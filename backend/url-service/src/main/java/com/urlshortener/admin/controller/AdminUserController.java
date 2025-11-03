package com.urlshortener.admin.controller;

import com.urlshortener.admin.audit.AuditLog;
import com.urlshortener.admin.model.AdminUser;
import com.urlshortener.admin.service.AuditService;
import com.urlshortener.model.User;
import com.urlshortener.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/admin/users")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
@ConditionalOnProperty(name = "app.admin.enabled", havingValue = "true", matchIfMissing = false)
public class AdminUserController {

    @Autowired
    private UserService userService;

    @Autowired
    private AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN_users:read')")
    public ResponseEntity<?> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortOrder,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String plan,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        
        try {
            Sort sort = Sort.by(Sort.Direction.fromString(sortOrder), sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<User> users;
            
            if (search != null && !search.trim().isEmpty()) {
                users = userService.searchUsers(search, pageable);
            } else {
                users = userService.findAllUsers(pageable);
            }
            
            // Apply filters if provided
            if (status != null || plan != null || dateFrom != null || dateTo != null) {
                users = userService.findUsersWithFilters(status, plan, dateFrom, dateTo, pageable);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("content", users.getContent());
            response.put("totalElements", users.getTotalElements());
            response.put("totalPages", users.getTotalPages());
            response.put("currentPage", users.getNumber());
            response.put("pageSize", users.getSize());
            response.put("hasNext", users.hasNext());
            response.put("hasPrevious", users.hasPrevious());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", response
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to fetch users: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN_users:read')")
    @AuditLog(action = "USER_VIEW", entity = "User")
    public ResponseEntity<?> getUser(@PathVariable String id) {
        try {
            Optional<User> userOpt = userService.findById(id);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            User user = userOpt.get();
            
            // Add additional user data for admin view
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("email", user.getEmail());
            userData.put("name", user.getName());
            userData.put("plan", user.getPlan());
            userData.put("status", user.getStatus());
            userData.put("emailVerified", user.isEmailVerified());
            userData.put("createdAt", user.getCreatedAt());
            userData.put("lastLogin", user.getLastLogin());
            
            // Add usage statistics
            Map<String, Object> usage = new HashMap<>();
            usage.put("linksCreated", userService.getUserLinksCount(id));
            usage.put("linksLimit", userService.getUserLinksLimit(user.getPlan()));
            usage.put("domainsUsed", userService.getUserDomainsCount(id));
            usage.put("domainsLimit", userService.getUserDomainsLimit(user.getPlan()));
            usage.put("clicksThisMonth", userService.getUserClicksThisMonth(id));
            usage.put("storageUsed", userService.getUserStorageUsed(id));
            usage.put("storageLimit", userService.getUserStorageLimit(user.getPlan()));
            userData.put("usage", usage);
            
            // Add subscription info if exists
            userData.put("subscription", userService.getUserSubscription(id));
            
            // Add teams
            userData.put("teams", userService.getUserTeams(id));

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", userData
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to fetch user: " + e.getMessage()
            ));
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN_users:create')")
    @AuditLog(action = "USER_CREATE", entity = "User", logPayload = true)
    public ResponseEntity<?> createUser(@RequestBody CreateUserRequest request, HttpServletRequest httpRequest) {
        try {
            AdminUser adminUser = (AdminUser) httpRequest.getAttribute("adminUser");
            
            User user = userService.createUserByAdmin(
                request.getEmail(),
                request.getName(),
                request.getPassword(),
                request.getPlan(),
                request.getStatus(),
                request.isEmailVerified()
            );

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", user,
                "message", "User created successfully"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to create user: " + e.getMessage()
            ));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN_users:update')")
    @AuditLog(action = "USER_UPDATE", entity = "User", logPayload = true)
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody UpdateUserRequest request) {
        try {
            User user = userService.updateUserByAdmin(id, request);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", user,
                "message", "User updated successfully"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to update user: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/{id}/suspend")
    @PreAuthorize("hasAuthority('ADMIN_users:suspend')")
    @AuditLog(action = "USER_SUSPEND", entity = "User")
    public ResponseEntity<?> suspendUser(@PathVariable String id, @RequestBody SuspendUserRequest request) {
        try {
            userService.suspendUser(id, request.getReason());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User suspended successfully"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to suspend user: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/{id}/reactivate")
    @PreAuthorize("hasAuthority('ADMIN_users:reactivate')")
    @AuditLog(action = "USER_REACTIVATE", entity = "User")
    public ResponseEntity<?> reactivateUser(@PathVariable String id) {
        try {
            userService.reactivateUser(id);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User reactivated successfully"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to reactivate user: " + e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN_users:delete')")
    @AuditLog(action = "USER_DELETE", entity = "User")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        try {
            userService.deleteUser(id);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User deleted successfully"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to delete user: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/{id}/impersonate")
    @PreAuthorize("hasAuthority('ADMIN_users:impersonate')")
    @AuditLog(action = "USER_IMPERSONATE", entity = "User")
    public ResponseEntity<?> impersonateUser(@PathVariable String id, HttpServletRequest httpRequest) {
        try {
            AdminUser adminUser = (AdminUser) httpRequest.getAttribute("adminUser");
            
            String impersonationToken = userService.generateImpersonationToken(id, adminUser.getId());
            String impersonationUrl = "/impersonate?token=" + impersonationToken;

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "token", impersonationToken,
                    "url", impersonationUrl
                ),
                "message", "Impersonation token generated successfully"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to generate impersonation token: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/{id}/export")
    @PreAuthorize("hasAuthority('ADMIN_users:export')")
    @AuditLog(action = "USER_EXPORT", entity = "User")
    public ResponseEntity<?> exportUserData(@PathVariable String id) {
        try {
            Map<String, Object> userData = userService.exportUserData(id);

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", userData,
                "message", "User data exported successfully"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to export user data: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasAuthority('ADMIN_users:bulk_actions')")
    @AuditLog(action = "USER_BULK_ACTION", entity = "User", logPayload = true)
    public ResponseEntity<?> bulkAction(@RequestBody BulkActionRequest request) {
        try {
            String action = request.getAction();
            List<String> userIds = request.getUserIds();
            Map<String, Object> data = request.getData();

            switch (action) {
                case "suspend":
                    String reason = (String) data.get("reason");
                    userService.bulkSuspendUsers(userIds, reason);
                    break;
                case "reactivate":
                    userService.bulkReactivateUsers(userIds);
                    break;
                case "delete":
                    String deleteReason = (String) data.get("reason");
                    userService.bulkDeleteUsers(userIds, deleteReason);
                    break;
                case "export":
                    return ResponseEntity.ok(Map.of(
                        "success", true,
                        "data", userService.bulkExportUsers(userIds),
                        "message", "Users exported successfully"
                    ));
                case "send_email":
                    String template = (String) data.get("template");
                    userService.bulkSendEmail(userIds, template);
                    break;
                default:
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Invalid bulk action: " + action
                    ));
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Bulk action completed successfully"
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Bulk action failed: " + e.getMessage()
            ));
        }
    }

    // Request DTOs
    public static class CreateUserRequest {
        private String email;
        private String name;
        private String password;
        private String plan;
        private String status;
        private boolean emailVerified;

        // Getters and setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getPlan() { return plan; }
        public void setPlan(String plan) { this.plan = plan; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public boolean isEmailVerified() { return emailVerified; }
        public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
    }

    public static class UpdateUserRequest {
        private String name;
        private String plan;
        private String status;
        private boolean emailVerified;

        // Getters and setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getPlan() { return plan; }
        public void setPlan(String plan) { this.plan = plan; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public boolean isEmailVerified() { return emailVerified; }
        public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
    }

    public static class SuspendUserRequest {
        private String reason;

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public static class BulkActionRequest {
        private String action;
        private List<String> userIds;
        private Map<String, Object> data;

        // Getters and setters
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }

        public List<String> getUserIds() { return userIds; }
        public void setUserIds(List<String> userIds) { this.userIds = userIds; }

        public Map<String, Object> getData() { return data; }
        public void setData(Map<String, Object> data) { this.data = data; }
    }
}