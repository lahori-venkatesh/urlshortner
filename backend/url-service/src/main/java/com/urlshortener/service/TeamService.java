package com.urlshortener.service;

import com.urlshortener.model.*;
import com.urlshortener.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TeamService {
    
    private static final Logger logger = LoggerFactory.getLogger(TeamService.class);
    
    private final TeamRepository teamRepository;
    private final TeamInviteRepository teamInviteRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    
    @Autowired
    public TeamService(TeamRepository teamRepository,
                      TeamInviteRepository teamInviteRepository,
                      UserRepository userRepository,
                      EmailService emailService) {
        this.teamRepository = teamRepository;
        this.teamInviteRepository = teamInviteRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }
    
    // Create a new team
    @Transactional
    public Team createTeam(String teamName, String ownerId, String description) {
        // Check if team name already exists
        Optional<Team> existingTeam = teamRepository.findByTeamNameIgnoreCaseAndIsActiveTrue(teamName);
        if (existingTeam.isPresent()) {
            throw new RuntimeException("Team name already exists");
        }
        
        // Get owner details
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Create team
        Team team = new Team(teamName, ownerId);
        team.setDescription(description);
        
        // Set initial limits based on plan
        updateTeamLimits(team, "FREE");
        
        Team savedTeam = teamRepository.save(team);
        
        // Auto-provision 7-day business trial for new teams
        if ("FREE".equals(savedTeam.getSubscriptionPlan())) {
            startBusinessTrial(savedTeam);
        }
        
        return savedTeam;
    }
    
    // Get teams for a user
    public List<Team> getUserTeams(String userId) {
        return teamRepository.findTeamsByUserId(userId);
    }
    
    // Get team by ID with permission check
    public Team getTeam(String teamId, String userId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));
        
        if (!team.isMember(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        return team;
    }
    
    // Invite user to team
    @Transactional
    public TeamInvite inviteUserToTeam(String teamId, String email, TeamRole role, String invitedBy) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));
        
        // Check permissions
        if (!team.canUserPerformAction(invitedBy, "INVITE_MEMBERS")) {
            throw new RuntimeException("Insufficient permissions to invite members");
        }
        
        // Check team member limit
        if (team.getMembers().size() >= team.getMemberLimit()) {
            throw new RuntimeException("Team member limit reached. Upgrade to add more members.");
        }
        
        // Check if user is already a member
        if (team.isMember(getUserIdByEmail(email))) {
            throw new RuntimeException("User is already a team member");
        }
        
        // Check if there's already a pending invite
        Optional<TeamInvite> existingInvite = teamInviteRepository
                .findPendingInviteByTeamAndEmail(teamId, email, LocalDateTime.now());
        if (existingInvite.isPresent()) {
            throw new RuntimeException("Invite already sent to this email");
        }
        
        // Create invite
        String inviteToken = UUID.randomUUID().toString();
        TeamInvite invite = new TeamInvite(teamId, email, invitedBy, role, inviteToken);
        TeamInvite savedInvite = teamInviteRepository.save(invite);
        
        // Send email invitation
        sendInviteEmail(team, savedInvite, invitedBy);
        
        return savedInvite;
    }
    
    // Accept team invite
    @Transactional
    public Team acceptInvite(String inviteToken, String userId) {
        logger.info("🔍 Attempting to accept invite - Token: {}, UserId: {}", 
                   inviteToken != null ? inviteToken.substring(0, Math.min(8, inviteToken.length())) + "..." : "null", 
                   userId);
        
        TeamInvite invite = teamInviteRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> {
                    logger.error("❌ Invalid invite token: {}", inviteToken);
                    return new RuntimeException("Invalid invite token");
                });
        
        logger.info("✅ Found invite - Email: {}, Team: {}, Accepted: {}, Expired: {}, ExpiresAt: {}", 
                   invite.getEmail(), invite.getTeamId(), invite.isAccepted(), invite.isExpired(), invite.getExpiresAt());
        
        if (!invite.isValid()) {
            logger.error("❌ Invite is not valid - Accepted: {}, Expired: {}, ExpiresAt: {}, Now: {}", 
                        invite.isAccepted(), invite.isExpired(), invite.getExpiresAt(), LocalDateTime.now());
            throw new RuntimeException("Invite has expired or already been used");
        }
        
        Team team = teamRepository.findById(invite.getTeamId())
                .orElseThrow(() -> {
                    logger.error("❌ Team not found: {}", invite.getTeamId());
                    return new RuntimeException("Team not found");
                });
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    logger.error("❌ User not found: {}", userId);
                    return new RuntimeException("User not found");
                });
        
        logger.info("✅ Found user - Email: {}, InviteEmail: {}", user.getEmail(), invite.getEmail());
        
        // Verify email matches
        if (!user.getEmail().equals(invite.getEmail())) {
            logger.error("❌ Email mismatch - User: {}, Invite: {}", user.getEmail(), invite.getEmail());
            throw new RuntimeException("This invitation was sent to " + invite.getEmail() + " but you are logged in as " + user.getEmail());
        }
        
        // Check if user is already a member
        if (team.isMember(userId)) {
            logger.warn("⚠️ User {} is already a member of team {}", userId, team.getTeamName());
            throw new RuntimeException("You are already a member of this team");
        }
        
        // Add user to team
        team.addMember(userId, invite.getRole());
        Team savedTeam = teamRepository.save(team);
        
        // Mark invite as accepted
        invite.setAccepted(true);
        invite.setAcceptedAt(LocalDateTime.now());
        teamInviteRepository.save(invite);
        
        logger.info("✅ Successfully accepted invite - User {} joined team {} as {}", 
                   user.getEmail(), team.getTeamName(), invite.getRole());
        
        return savedTeam;
    }
    
    // Remove member from team
    @Transactional
    public void removeMember(String teamId, String memberUserId, String requestingUserId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));
        
        // Check permissions
        if (!team.canUserPerformAction(requestingUserId, "REMOVE_MEMBERS")) {
            throw new RuntimeException("Insufficient permissions to remove members");
        }
        
        // Cannot remove owner
        if (team.getOwnerId().equals(memberUserId)) {
            throw new RuntimeException("Cannot remove team owner");
        }
        
        team.removeMember(memberUserId);
        teamRepository.save(team);
    }
    
    // Update member role
    @Transactional
    public void updateMemberRole(String teamId, String memberUserId, TeamRole newRole, String requestingUserId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));
        
        // Check permissions
        if (!team.canUserPerformAction(requestingUserId, "CHANGE_ROLES")) {
            throw new RuntimeException("Insufficient permissions to change roles");
        }
        
        // Cannot change owner role
        if (team.getOwnerId().equals(memberUserId)) {
            throw new RuntimeException("Cannot change owner role");
        }
        
        team.updateMemberRole(memberUserId, newRole);
        teamRepository.save(team);
    }
    
    // Update team details
    @Transactional
    public Team updateTeam(String teamId, String teamName, String description, String userId) {
        logger.info("🔍 Attempting to update team - TeamId: {}, UserId: {}, NewName: {}", 
                   teamId, userId, teamName);
        
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> {
                    logger.error("❌ Team not found: {}", teamId);
                    return new RuntimeException("Team not found");
                });
        
        logger.info("✅ Found team - CurrentName: {}, Owner: {}", team.getTeamName(), team.getOwnerId());
        
        // Check permissions (only owner and admin can update team details)
        TeamRole userRole = team.getUserRole(userId);
        logger.info("🔍 User role in team: {}", userRole);
        
        if (userRole != TeamRole.OWNER && userRole != TeamRole.ADMIN) {
            logger.error("❌ Insufficient permissions - User: {}, Role: {}", userId, userRole);
            throw new RuntimeException("Only team owners and admins can update team settings");
        }
        
        // Check team name uniqueness if changed
        if (!team.getTeamName().equals(teamName)) {
            logger.info("🔍 Checking team name uniqueness: {} -> {}", team.getTeamName(), teamName);
            Optional<Team> existingTeam = teamRepository.findByTeamNameIgnoreCaseAndIsActiveTrue(teamName);
            if (existingTeam.isPresent() && !existingTeam.get().getId().equals(teamId)) {
                logger.error("❌ Team name already exists: {}", teamName);
                throw new RuntimeException("Team name '" + teamName + "' is already taken");
            }
            team.setTeamName(teamName);
            logger.info("✅ Team name updated: {}", teamName);
        }
        
        team.setDescription(description != null ? description : "");
        team.setUpdatedAt(LocalDateTime.now());
        
        Team savedTeam = teamRepository.save(team);
        logger.info("✅ Team updated successfully - Name: {}, Description: {}", 
                   savedTeam.getTeamName(), savedTeam.getDescription());
        
        return savedTeam;
    }
    
    // Delete team (only owner)
    @Transactional
    public void deleteTeam(String teamId, String userId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));
        
        if (!team.canUserPerformAction(userId, "DELETE_TEAM")) {
            throw new RuntimeException("Only team owner can delete the team");
        }
        
        // Soft delete
        team.setActive(false);
        team.setUpdatedAt(LocalDateTime.now());
        teamRepository.save(team);
        
        // Cancel any pending invites
        List<TeamInvite> pendingInvites = teamInviteRepository
                .findPendingInvitesByTeamId(teamId, LocalDateTime.now());
        pendingInvites.forEach(invite -> {
            invite.setExpired(true);
            teamInviteRepository.save(invite);
        });
    }
    
    // Get team members with user details
    public List<Map<String, Object>> getTeamMembersWithDetails(String teamId, String userId) {
        Team team = getTeam(teamId, userId);
        
        return team.getMembers().stream()
                .map(member -> {
                    User user = userRepository.findById(member.getUserId()).orElse(null);
                    Map<String, Object> memberInfo = new HashMap<>();
                    memberInfo.put("userId", member.getUserId());
                    memberInfo.put("role", member.getRole());
                    memberInfo.put("joinedAt", member.getJoinedAt());
                    memberInfo.put("isActive", member.isActive());
                    
                    if (user != null) {
                        memberInfo.put("name", user.getFirstName() + " " + user.getLastName());
                        memberInfo.put("email", user.getEmail());
                        memberInfo.put("profilePicture", user.getProfilePicture());
                    }
                    
                    return memberInfo;
                })
                .collect(Collectors.toList());
    }
    
    // Get pending invites for team
    public List<TeamInvite> getPendingInvites(String teamId, String userId) {
        Team team = getTeam(teamId, userId);
        
        // Only admins and owners can see pending invites
        TeamRole userRole = team.getUserRole(userId);
        if (userRole != TeamRole.OWNER && userRole != TeamRole.ADMIN) {
            throw new RuntimeException("Insufficient permissions to view invites");
        }
        
        return teamInviteRepository.findPendingInvitesByTeamId(teamId, LocalDateTime.now());
    }
    
    // Start business trial for new team
    private void startBusinessTrial(Team team) {
        team.setSubscriptionPlan("BUSINESS_TRIAL");
        team.setSubscriptionExpiry(LocalDateTime.now().plusDays(7));
        updateTeamLimits(team, "BUSINESS_TRIAL");
        teamRepository.save(team);
    }
    
    // Update team limits based on plan
    private void updateTeamLimits(Team team, String plan) {
        switch (plan) {
            case "FREE":
                team.setMemberLimit(1); // FREE teams get 1 member (owner only)
                team.setLinkQuota(1000);
                break;
            case "PRO":
            case "PRO_MONTHLY":
            case "PRO_YEARLY":
                team.setMemberLimit(3); // PRO teams get up to 3 members
                team.setLinkQuota(5000);
                break;
            case "BUSINESS_TRIAL":
            case "BUSINESS_MONTHLY":
            case "BUSINESS_YEARLY":
                team.setMemberLimit(10); // BUSINESS teams get up to 10 members
                team.setLinkQuota(-1); // Unlimited
                break;
            default:
                team.setMemberLimit(1); // Default to FREE limits
                team.setLinkQuota(1000);
        }
    }
    
    // Helper method to get user ID by email
    private String getUserIdByEmail(String email) {
        return userRepository.findByEmail(email)
                .map(User::getId)
                .orElse(null);
    }
    
    // Send invite email
    private void sendInviteEmail(Team team, TeamInvite invite, String invitedBy) {
        try {
            User inviter = userRepository.findById(invitedBy).orElse(null);
            String inviterName = inviter != null ? 
                    (inviter.getFirstName() + " " + inviter.getLastName()).trim() : "Someone";
            
            if (inviterName.isEmpty()) {
                inviterName = inviter != null ? inviter.getEmail() : "Someone";
            }
            
            String subject = "🎉 You're invited to join " + team.getTeamName() + " on Pebly";
            String inviteUrl = "https://pebly.vercel.app/invite/" + invite.getInviteToken();
            
            // Create plain text email
            String plainTextBody = buildPlainTextInviteEmail(inviterName, team.getTeamName(), 
                                                           invite.getRole().getDisplayName(), inviteUrl);
            
            // Create HTML email
            String htmlBody = buildHtmlInviteEmail(inviterName, team.getTeamName(), 
                                                 invite.getRole().getDisplayName(), inviteUrl);
            
            // Send HTML email with plain text fallback
            emailService.sendHtmlEmail(invite.getEmail(), subject, plainTextBody, htmlBody);
            
            logger.info("✅ Team invite email sent to {} for team {} by {}", 
                       invite.getEmail(), team.getTeamName(), inviterName);
            
        } catch (Exception e) {
            // Log error but don't fail the invite creation
            logger.error("❌ Failed to send invite email to {}: {}", invite.getEmail(), e.getMessage(), e);
        }
    }
    
    private String buildPlainTextInviteEmail(String inviterName, String teamName, String role, String inviteUrl) {
        return String.format("""
            Hi there!
            
            %s has invited you to join the team '%s' on Pebly.
            
            Team Details:
            • Team Name: %s
            • Your Role: %s
            • Invited by: %s
            
            To accept this invitation, click the link below:
            %s
            
            What you can do as a %s:
            %s
            
            Important Notes:
            • This invitation will expire in 7 days
            • You'll need to create a Pebly account if you don't have one
            • Once you join, you'll have access to team features and shared resources
            
            About Pebly:
            Pebly is a powerful URL shortening and link management platform that helps teams 
            create, manage, and track short links, QR codes, and file sharing.
            
            Questions? Visit our help center: https://pebly.vercel.app/help
            
            Best regards,
            The Pebly Team
            
            ---
            This invitation was sent to %s. If you weren't expecting this invitation, 
            you can safely ignore this email.
            """, 
            inviterName, teamName, teamName, role, inviterName, inviteUrl, role, 
            getRoleDescription(role), inviteUrl.split("/invite/")[1]
        );
    }
    
    private String buildHtmlInviteEmail(String inviterName, String teamName, String role, String inviteUrl) {
        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Team Invitation - Pebly</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
                    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                    .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 40px 30px; text-align: center; }
                    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
                    .header p { margin: 10px 0 0; opacity: 0.9; font-size: 16px; }
                    .content { padding: 40px 30px; }
                    .invite-card { background: #f8fafc; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #667eea; }
                    .invite-card h3 { margin: 0 0 16px; color: #1a202c; font-size: 18px; }
                    .invite-details { list-style: none; padding: 0; margin: 0; }
                    .invite-details li { padding: 8px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; }
                    .invite-details li:last-child { border-bottom: none; }
                    .invite-details .label { font-weight: 600; color: #4a5568; }
                    .invite-details .value { color: #1a202c; }
                    .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; text-align: center; transition: transform 0.2s; }
                    .cta-button:hover { transform: translateY(-2px); }
                    .role-info { background: #e6fffa; border: 1px solid #81e6d9; border-radius: 8px; padding: 16px; margin: 20px 0; }
                    .role-info h4 { margin: 0 0 8px; color: #234e52; }
                    .role-info p { margin: 0; color: #2d3748; font-size: 14px; }
                    .footer { background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
                    .footer p { margin: 0; color: #718096; font-size: 14px; }
                    .footer a { color: #667eea; text-decoration: none; }
                    .expiry-notice { background: #fff5f5; border: 1px solid #fed7d7; border-radius: 8px; padding: 16px; margin: 20px 0; }
                    .expiry-notice p { margin: 0; color: #c53030; font-size: 14px; font-weight: 500; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 Team Invitation</h1>
                        <p>You've been invited to join a team on Pebly</p>
                    </div>
                    
                    <div class="content">
                        <p>Hi there!</p>
                        <p><strong>%s</strong> has invited you to join their team on Pebly.</p>
                        
                        <div class="invite-card">
                            <h3>Invitation Details</h3>
                            <ul class="invite-details">
                                <li><span class="label">Team Name:</span> <span class="value">%s</span></li>
                                <li><span class="label">Your Role:</span> <span class="value">%s</span></li>
                                <li><span class="label">Invited by:</span> <span class="value">%s</span></li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center;">
                            <a href="%s" class="cta-button">Accept Invitation</a>
                        </div>
                        
                        <div class="role-info">
                            <h4>As a %s, you'll be able to:</h4>
                            <p>%s</p>
                        </div>
                        
                        <div class="expiry-notice">
                            <p>⏰ This invitation expires in 7 days</p>
                        </div>
                        
                        <p><strong>About Pebly:</strong><br>
                        Pebly is a powerful URL shortening and link management platform that helps teams create, manage, and track short links, QR codes, and file sharing.</p>
                        
                        <p>If you don't have a Pebly account yet, you'll be able to create one when you accept the invitation.</p>
                    </div>
                    
                    <div class="footer">
                        <p>Questions? <a href="https://pebly.vercel.app/help">Visit our help center</a></p>
                        <p style="margin-top: 16px;">This invitation was sent to your email address. If you weren't expecting this, you can safely ignore this email.</p>
                        <p style="margin-top: 16px; color: #a0aec0;">© 2024 Pebly. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            """, 
            inviterName, teamName, role, inviterName, inviteUrl, role, getRoleDescription(role)
        );
    }
    
    private String getRoleDescription(String role) {
        return switch (role.toUpperCase()) {
            case "OWNER" -> "Full access to all team features, settings, billing, and member management";
            case "ADMIN" -> "Manage team members, create and edit all content, access team analytics";
            case "MEMBER" -> "Create and manage your own links, QR codes, and files within the team";
            case "VIEWER" -> "View team content and analytics, but cannot create or edit content";
            default -> "Access team features based on your assigned permissions";
        };
    }
    
    // Clean up expired invites (scheduled task)
    public void cleanupExpiredInvites() {
        List<TeamInvite> expiredInvites = teamInviteRepository.findExpiredInvites(LocalDateTime.now());
        expiredInvites.forEach(invite -> {
            invite.setExpired(true);
            teamInviteRepository.save(invite);
        });
    }
}