package com.urlshortener.controller;

import com.urlshortener.model.*;
import com.urlshortener.service.TeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import jakarta.servlet.http.HttpServletRequest;
import java.util.*;

@RestController
@RequestMapping("/api/v1/teams")
@CrossOrigin(origins = "*")
public class TeamController {
    
    @Autowired
    private TeamService teamService;
    
    // Create new team
    @PostMapping
    public ResponseEntity<Map<String, Object>> createTeam(@RequestBody Map<String, String> request) {
        try {
            String userId = request.get("userId");
            String teamName = request.get("teamName");
            String description = request.get("description");
            
            if (userId == null || userId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "User ID is required"
                ));
            }
            
            if (teamName == null || teamName.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Team name is required"
                ));
            }
            
            Team team = teamService.createTeam(teamName.trim(), userId.trim(), description);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Team created successfully",
                "team", team
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    // Get user's teams
    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> getUserTeams(@RequestParam String userId) {
        try {
            if (userId == null || userId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "User ID is required"
                ));
            }
            
            List<Team> teams = teamService.getUserTeams(userId.trim());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "teams", teams
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    // Get team details
    @GetMapping("/{teamId}")
    public ResponseEntity<Map<String, Object>> getTeam(@PathVariable String teamId, @RequestParam String userId) {
        try {
            if (userId == null || userId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "User ID is required"
                ));
            }
            
            Team team = teamService.getTeam(teamId, userId.trim());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "team", team
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    // Update team
    @PutMapping("/{teamId}")
    public ResponseEntity<Map<String, Object>> updateTeam(
            @PathVariable String teamId,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        try {
            String userId = getCurrentUserId(httpRequest);
            
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "User not authenticated"
                ));
            }
            
            String teamName = request.get("teamName");
            String description = request.get("description");
            
            if (teamName == null || teamName.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Team name is required"
                ));
            }
            
            Team team = teamService.updateTeam(teamId, teamName.trim(), description != null ? description.trim() : "", userId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Team updated successfully",
                "team", team
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    // Delete team
    @DeleteMapping("/{teamId}")
    public ResponseEntity<Map<String, Object>> deleteTeam(@PathVariable String teamId, @RequestParam String userId) {
        try {
            if (userId == null || userId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "User ID is required"
                ));
            }
            
            teamService.deleteTeam(teamId, userId.trim());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Team deleted successfully"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    // Invite user to team
    @PostMapping("/{teamId}/invite")
    public ResponseEntity<Map<String, Object>> inviteUser(
            @PathVariable String teamId,
            @RequestBody Map<String, String> request) {
        try {
            String userId = request.get("userId");
            String email = request.get("email");
            String roleStr = request.get("role");
            
            if (userId == null || userId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "User ID is required"
                ));
            }
            
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Email is required"
                ));
            }
            
            TeamRole role;
            try {
                role = TeamRole.valueOf(roleStr != null ? roleStr.toUpperCase() : "MEMBER");
            } catch (IllegalArgumentException e) {
                role = TeamRole.MEMBER;
            }
            
            TeamInvite invite = teamService.inviteUserToTeam(teamId, email.trim(), role, userId.trim());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Invitation sent successfully",
                "invite", invite
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    // Accept team invite
    @PostMapping("/invite/{inviteToken}/accept")
    public ResponseEntity<Map<String, Object>> acceptInvite(
            @PathVariable String inviteToken,
            HttpServletRequest request) {
        try {
            String userId = getCurrentUserId(request);
            
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "User not authenticated"
                ));
            }
            
            Team team = teamService.acceptInvite(inviteToken, userId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Invitation accepted successfully",
                "team", team
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    // Get team members
    @GetMapping("/{teamId}/members")
    public ResponseEntity<Map<String, Object>> getTeamMembers(@PathVariable String teamId, @RequestParam String userId) {
        try {
            if (userId == null || userId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "User ID is required"
                ));
            }
            
            List<Map<String, Object>> members = teamService.getTeamMembersWithDetails(teamId, userId.trim());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "members", members
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    // Remove team member
    @DeleteMapping("/{teamId}/members/{memberUserId}")
    public ResponseEntity<Map<String, Object>> removeMember(
            @PathVariable String teamId,
            @PathVariable String memberUserId,
            HttpServletRequest request) {
        try {
            String userId = getCurrentUserId(request);
            
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "User not authenticated"
                ));
            }
            
            teamService.removeMember(teamId, memberUserId, userId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Member removed successfully"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    // Update member role
    @PutMapping("/{teamId}/members/{memberUserId}/role")
    public ResponseEntity<Map<String, Object>> updateMemberRole(
            @PathVariable String teamId,
            @PathVariable String memberUserId,
            @RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        try {
            String userId = getCurrentUserId(httpRequest);
            
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "User not authenticated"
                ));
            }
            
            String roleStr = request.get("role");
            
            if (roleStr == null || roleStr.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Role is required"
                ));
            }
            
            TeamRole role;
            try {
                role = TeamRole.valueOf(roleStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid role"
                ));
            }
            
            teamService.updateMemberRole(teamId, memberUserId, role, userId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Member role updated successfully"
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    // Get pending invites
    @GetMapping("/{teamId}/invites")
    public ResponseEntity<Map<String, Object>> getPendingInvites(
            @PathVariable String teamId,
            HttpServletRequest request) {
        try {
            String userId = getCurrentUserId(request);
            
            if (userId == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "User not authenticated"
                ));
            }
            
            List<TeamInvite> invites = teamService.getPendingInvites(teamId, userId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "invites", invites
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
    
    // Helper method to get current user ID from request attribute
    private String getCurrentUserId(HttpServletRequest request) {
        // First try to get from request attribute (set by JWT filter)
        com.urlshortener.model.User currentUser = (com.urlshortener.model.User) request.getAttribute("currentUser");
        if (currentUser != null) {
            return currentUser.getId();
        }
        
        // Fallback: try to get from security context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof String) {
            return (String) authentication.getPrincipal();
        }
        
        return null;
    }
    
    // Legacy method for backward compatibility
    private String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof String) {
            return (String) authentication.getPrincipal();
        }
        throw new RuntimeException("User not authenticated");
    }
}