package com.urlshortener.admin.controller;

import com.urlshortener.admin.audit.AuditLog;
import com.urlshortener.admin.model.AdminUser;
import com.urlshortener.model.Team;
import com.urlshortener.service.TeamService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/admin/teams")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTeamController {

    @Autowired
    private TeamService teamService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN_teams:read')")
    public ResponseEntity<?> getTeams(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortOrder,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String plan,
            @RequestParam(required = false) String memberCount,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        
        try {
            Sort sort = Sort.by(Sort.Direction.fromString(sortOrder), sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<Team> teams;
            
            if (search != null && !search.trim().isEmpty()) {
                teams = teamService.searchTeams(search, pageable);
            } else {
                teams = teamService.findAllTeams(pageable);
            }
            
            // Apply filters if provided
            if (plan != null || memberCount != null || dateFrom != null || dateTo != null) {
                teams = teamService.findTeamsWithFilters(plan, memberCount, dateFrom, dateTo, pageable);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("content", teams.getContent());
            response.put("totalElements", teams.getTotalElements());
            response.put("totalPages", teams.getTotalPages());
            response.put("currentPage", teams.getNumber());
            response.put("pageSize", teams.getSize());
            response.put("hasNext", teams.hasNext());
            response.put("hasPrevious", teams.hasPrevious());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", response
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to fetch teams: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN_teams:read')")
    @AuditLog(action = "TEAM_VIEW", entity = "Team")
    public ResponseEntity<?> getTeam(@PathVariable String id) {
        try {
            Optional<Team> teamOpt = teamService.findById(id);
            
            if (teamOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Team team = teamOpt.get();
            
            // Add additional team data for admin view
            Map<String, Object> teamData = new HashMap<>();
            teamData.put("id", team.getId());
            teamData.put("name", team.getName());
            teamData.put("plan", team.getPlan());
            teamData.put("owner", team.getOwner());
            teamData.put("members", team.getMembers());
            teamData.put("domains", team.getDomains());
            teamData.put("createdAt", team.getCreatedAt());
            teamData.put("updatedAt", team.getUpdatedAt());
            
            // Add usage statistics
            Map<String, Object> usage = new HashMap<>();
            usage.put("linksCreated", teamService.getTeamLinksCount(id));
            usage.put("linksLimit", teamService.getTeamLinksLimit(team.getPlan()));
            usage.put("membersCount", team.getMembers().size());
            usage.put("membersLimit", teamService.getTeamMembersLimit(team.getPlan()));
            usage.put("domainsUsed", team.getDomains().size());
            usage.put("domainsLimit", teamService.getTeamDomainsLimit(team.getPlan()));
            teamData.put("usage", usage);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", teamData
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to fetch team: " + e.getMessage()
            ));
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN_teams:create')")
    @AuditLog(action = "TEAM_CREATE", entity = "Team", logPayload = true)
    public ResponseEntity<?> createTeam(@RequestBody CreateTeamRequest request, HttpServletRequest httpRequest) {
        try {
            AdminUser adminUser = (AdminUser) httpRequest.getAttribute("adminUser");
            
            Team team = teamService.createTeamByAdmin(
                request.getName(),
                request.getOwnerId(),
                request.getPlan()
            );

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", team,
                "message", "Team created successfully"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to create team: " + e.getMessage()
            ));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN_teams:update')")
    @AuditLog(action = "TEAM_UPDATE", entity = "Team", logPayload = true)
    public ResponseEntity<?> updateTeam(@PathVariable String id, @RequestBody UpdateTeamRequest request) {
        try {
            Team team = teamService.updateTeamByAdmin(id, request);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", team,
                "message", "Team updated successfully"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to update team: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/{id}/transfer")
    @PreAuthorize("hasAuthority('ADMIN_teams:transfer')")
    @AuditLog(action = "TEAM_TRANSFER", entity = "Team")
    public ResponseEntity<?> transferOwnership(@PathVariable String id, @RequestBody TransferOwnershipRequest request) {
        try {
            teamService.transferOwnership(id, request.getNewOwnerId());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Team ownership transferred successfully"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to transfer ownership: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("hasAuthority('ADMIN_teams:update')")
    @AuditLog(action = "TEAM_ADD_MEMBER", entity = "Team")
    public ResponseEntity<?> addMember(@PathVariable String id, @RequestBody AddMemberRequest request) {
        try {
            teamService.addMemberByAdmin(id, request.getUserId(), request.getRole());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Member added successfully"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to add member: " + e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("hasAuthority('ADMIN_teams:update')")
    @AuditLog(action = "TEAM_REMOVE_MEMBER", entity = "Team")
    public ResponseEntity<?> removeMember(@PathVariable String id, @PathVariable String userId) {
        try {
            teamService.removeMemberByAdmin(id, userId);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Member removed successfully"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to remove member: " + e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN_teams:delete')")
    @AuditLog(action = "TEAM_DELETE", entity = "Team")
    public ResponseEntity<?> deleteTeam(@PathVariable String id) {
        try {
            teamService.deleteTeam(id);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Team deleted successfully"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to delete team: " + e.getMessage()
            ));
        }
    }

    // Request DTOs
    public static class CreateTeamRequest {
        private String name;
        private String ownerId;
        private String plan;

        // Getters and setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getOwnerId() { return ownerId; }
        public void setOwnerId(String ownerId) { this.ownerId = ownerId; }

        public String getPlan() { return plan; }
        public void setPlan(String plan) { this.plan = plan; }
    }

    public static class UpdateTeamRequest {
        private String name;
        private String plan;

        // Getters and setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getPlan() { return plan; }
        public void setPlan(String plan) { this.plan = plan; }
    }

    public static class TransferOwnershipRequest {
        private String newOwnerId;

        public String getNewOwnerId() { return newOwnerId; }
        public void setNewOwnerId(String newOwnerId) { this.newOwnerId = newOwnerId; }
    }

    public static class AddMemberRequest {
        private String userId;
        private String role;

        // Getters and setters
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }
}