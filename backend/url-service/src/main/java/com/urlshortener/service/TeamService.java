package com.urlshortener.service;

import com.urlshortener.model.*;
import com.urlshortener.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TeamService {
    
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
        TeamInvite invite = teamInviteRepository.findByInviteToken(inviteToken)
                .orElseThrow(() -> new RuntimeException("Invalid invite token"));
        
        if (!invite.isValid()) {
            throw new RuntimeException("Invite has expired or already been used");
        }
        
        Team team = teamRepository.findById(invite.getTeamId())
                .orElseThrow(() -> new RuntimeException("Team not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Verify email matches
        if (!user.getEmail().equals(invite.getEmail())) {
            throw new RuntimeException("Email mismatch");
        }
        
        // Add user to team
        team.addMember(userId, invite.getRole());
        Team savedTeam = teamRepository.save(team);
        
        // Mark invite as accepted
        invite.setAccepted(true);
        invite.setAcceptedAt(LocalDateTime.now());
        teamInviteRepository.save(invite);
        
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
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));
        
        // Check permissions (only owner and admin can update team details)
        TeamRole userRole = team.getUserRole(userId);
        if (userRole != TeamRole.OWNER && userRole != TeamRole.ADMIN) {
            throw new RuntimeException("Insufficient permissions to update team");
        }
        
        // Check team name uniqueness if changed
        if (!team.getTeamName().equals(teamName)) {
            Optional<Team> existingTeam = teamRepository.findByTeamNameIgnoreCaseAndIsActiveTrue(teamName);
            if (existingTeam.isPresent() && !existingTeam.get().getId().equals(teamId)) {
                throw new RuntimeException("Team name already exists");
            }
            team.setTeamName(teamName);
        }
        
        team.setDescription(description);
        team.setUpdatedAt(LocalDateTime.now());
        
        return teamRepository.save(team);
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
                team.setMemberLimit(3);
                team.setLinkQuota(1000);
                break;
            case "BUSINESS_TRIAL":
            case "BUSINESS_MONTHLY":
            case "BUSINESS_YEARLY":
                team.setMemberLimit(10);
                team.setLinkQuota(-1); // Unlimited
                break;
            default:
                team.setMemberLimit(3);
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
                    inviter.getFirstName() + " " + inviter.getLastName() : "Someone";
            
            String subject = "You're invited to join " + team.getTeamName() + " on Pebly";
            String inviteUrl = "https://pebly.com/invite/" + invite.getInviteToken();
            
            String body = String.format(
                    "Hi there!\n\n" +
                    "%s has invited you to join the team '%s' on Pebly.\n\n" +
                    "Role: %s\n\n" +
                    "Click the link below to accept the invitation:\n" +
                    "%s\n\n" +
                    "This invitation will expire in 7 days.\n\n" +
                    "Best regards,\n" +
                    "The Pebly Team",
                    inviterName, team.getTeamName(), invite.getRole().getDisplayName(), inviteUrl
            );
            
            emailService.sendEmail(invite.getEmail(), subject, body);
        } catch (Exception e) {
            // Log error but don't fail the invite creation
            System.err.println("Failed to send invite email: " + e.getMessage());
        }
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