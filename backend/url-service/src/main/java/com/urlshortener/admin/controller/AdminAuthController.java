package com.urlshortener.admin.controller;

import com.urlshortener.admin.model.AdminUser;
import com.urlshortener.admin.service.AdminUserService;
import com.urlshortener.admin.service.AuditService;
import com.urlshortener.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/admin/auth")
@CrossOrigin(origins = "*")
@ConditionalOnProperty(name = "app.admin.enabled", havingValue = "true", matchIfMissing = false)
public class AdminAuthController {

    @Autowired
    private AdminUserService adminUserService;

    @Autowired
    private AuditService auditService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        try {
            // Validate credentials
            Optional<AdminUser> adminUserOpt = adminUserService.findByEmail(request.getEmail());
            
            if (adminUserOpt.isEmpty() || !adminUserService.validatePassword(request.getEmail(), request.getPassword())) {
                auditService.auditSystemAction(
                    null, "Unknown", request.getEmail(),
                    "LOGIN_FAILED", "Failed login attempt",
                    getClientIpAddress(httpRequest), httpRequest.getHeader("User-Agent")
                );
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Invalid credentials"
                ));
            }

            AdminUser adminUser = adminUserOpt.get();

            // Check if account is active
            if (!adminUser.isActive()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "Account is deactivated"
                ));
            }

            // Check MFA if enabled
            if (adminUser.isMfaEnabled()) {
                if (request.getMfaCode() == null || request.getMfaCode().isEmpty()) {
                    return ResponseEntity.ok(Map.of(
                        "success", true,
                        "requiresMfa", true,
                        "message", "MFA code required"
                    ));
                }
                
                // TODO: Implement MFA validation
                // For now, accept any 6-digit code
                if (!request.getMfaCode().matches("\\d{6}")) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "message", "Invalid MFA code"
                    ));
                }
            }

            // Generate JWT token
            String token = jwtUtil.generateToken(adminUser.getId(), adminUser.getEmail(), 
                                               adminUser.getName(), "");

            // Update last login
            adminUserService.updateLastLogin(adminUser.getEmail(), getClientIpAddress(httpRequest));

            // Audit successful login
            auditService.auditSystemAction(
                adminUser.getId(), adminUser.getName(), adminUser.getEmail(),
                "LOGIN_SUCCESS", "Successful admin login",
                getClientIpAddress(httpRequest), httpRequest.getHeader("User-Agent")
            );

            // Prepare response
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", adminUser.getId());
            userData.put("email", adminUser.getEmail());
            userData.put("name", adminUser.getName());
            userData.put("role", Map.of(
                "name", adminUser.getRole().getName(),
                "displayName", adminUser.getRole().getDisplayName()
            ));
            userData.put("permissions", adminUser.getPermissions());
            userData.put("mfaEnabled", adminUser.isMfaEnabled());
            userData.put("lastLogin", adminUser.getLastLogin());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", Map.of(
                    "token", token,
                    "user", userData
                )
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Login failed: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        try {
            AdminUser adminUser = (AdminUser) request.getAttribute("adminUser");
            
            if (adminUser == null) {
                return ResponseEntity.status(401).body(Map.of(
                    "success", false,
                    "message", "Unauthorized"
                ));
            }

            Map<String, Object> userData = new HashMap<>();
            userData.put("id", adminUser.getId());
            userData.put("email", adminUser.getEmail());
            userData.put("name", adminUser.getName());
            userData.put("role", Map.of(
                "name", adminUser.getRole().getName(),
                "displayName", adminUser.getRole().getDisplayName()
            ));
            userData.put("permissions", adminUser.getPermissions());
            userData.put("mfaEnabled", adminUser.isMfaEnabled());
            userData.put("lastLogin", adminUser.getLastLogin());

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", userData
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to get user info: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        try {
            AdminUser adminUser = (AdminUser) request.getAttribute("adminUser");
            
            if (adminUser != null) {
                auditService.auditSystemAction(
                    adminUser.getId(), adminUser.getName(), adminUser.getEmail(),
                    "LOGOUT", "Admin logout",
                    getClientIpAddress(request), request.getHeader("User-Agent")
                );
            }

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Logged out successfully"
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Logout failed: " + e.getMessage()
            ));
        }
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }

    // Request DTOs
    public static class LoginRequest {
        private String email;
        private String password;
        private String mfaCode;

        // Getters and setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getMfaCode() { return mfaCode; }
        public void setMfaCode(String mfaCode) { this.mfaCode = mfaCode; }
    }
}