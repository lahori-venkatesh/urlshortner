package com.demo.controller;

import com.demo.model.User;
import com.demo.service.UserService;
import com.demo.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private JwtService jwtService;
    
    /**
     * User registration
     */
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            User user = userService.registerUser(request.getEmail(), request.getName(), request.getPassword());
            
            // Generate JWT token
            String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getName());
            
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("email", user.getEmail());
            userData.put("name", user.getName());
            userData.put("subscriptionPlan", user.getSubscriptionPlan());
            userData.put("maxUrls", user.getMaxUrls());
            userData.put("urlsCreated", user.getUrlsCreated());
            userData.put("apiKey", user.getApiKey());
            userData.put("createdAt", user.getCreatedAt().toString());
            
            Map<String, Object> data = new HashMap<>();
            data.put("user", userData);
            data.put("token", token);
            
            response.put("success", true);
            response.put("message", "User registered successfully and stored in MongoDB!");
            response.put("data", data);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * User login
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            User user = userService.authenticateUser(request.getEmail(), request.getPassword());
            
            // Generate JWT token
            String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getName());
            
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("email", user.getEmail());
            userData.put("name", user.getName());
            userData.put("subscriptionPlan", user.getSubscriptionPlan());
            userData.put("maxUrls", user.getMaxUrls());
            userData.put("urlsCreated", user.getUrlsCreated());
            userData.put("apiKey", user.getApiKey());
            userData.put("lastLoginAt", user.getLastLoginAt().toString());
            
            Map<String, Object> data = new HashMap<>();
            data.put("user", userData);
            data.put("token", token);
            
            response.put("success", true);
            response.put("message", "Login successful! User data retrieved from MongoDB.");
            response.put("data", data);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Get user profile
     */
    @GetMapping("/profile")
    public ResponseEntity<Map<String, Object>> getProfile(@RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = jwtService.extractUserId(token);
            
            User user = userService.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("email", user.getEmail());
            userData.put("name", user.getName());
            userData.put("subscriptionPlan", user.getSubscriptionPlan());
            userData.put("maxUrls", user.getMaxUrls());
            userData.put("urlsCreated", user.getUrlsCreated());
            userData.put("maxClicksPerMonth", user.getMaxClicksPerMonth());
            userData.put("clicksThisMonth", user.getClicksThisMonth());
            userData.put("apiKey", user.getApiKey());
            userData.put("canUseFileUploads", user.isCanUseFileUploads());
            userData.put("canUseAnalytics", user.isCanUseAnalytics());
            userData.put("canUsePasswordProtection", user.isCanUsePasswordProtection());
            userData.put("createdAt", user.getCreatedAt().toString());
            userData.put("lastLoginAt", user.getLastLoginAt() != null ? user.getLastLoginAt().toString() : null);
            
            response.put("success", true);
            response.put("message", "Profile retrieved from MongoDB");
            response.put("data", userData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Update user profile
     */
    @PutMapping("/profile")
    public ResponseEntity<Map<String, Object>> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody UpdateProfileRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = jwtService.extractUserId(token);
            
            User user = userService.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Update user fields
            if (request.getName() != null) {
                user.setName(request.getName());
            }
            if (request.getTimezone() != null) {
                user.setTimezone(request.getTimezone());
            }
            if (request.getEmailNotifications() != null) {
                user.setEmailNotifications(request.getEmailNotifications());
            }
            
            User updatedUser = userService.updateUser(user);
            
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", updatedUser.getId());
            userData.put("email", updatedUser.getEmail());
            userData.put("name", updatedUser.getName());
            userData.put("timezone", updatedUser.getTimezone());
            userData.put("emailNotifications", updatedUser.isEmailNotifications());
            userData.put("updatedAt", updatedUser.getUpdatedAt().toString());
            
            response.put("success", true);
            response.put("message", "Profile updated successfully in MongoDB");
            response.put("data", userData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Change password
     */
    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ChangePasswordRequest request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String token = authHeader.replace("Bearer ", "");
            String userId = jwtService.extractUserId(token);
            
            userService.changePassword(userId, request.getOldPassword(), request.getNewPassword());
            
            response.put("success", true);
            response.put("message", "Password changed successfully in MongoDB");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // Request DTOs
    public static class RegisterRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;
        
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
        private String name;
        
        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;
        
        // Getters and setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
    
    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;
        
        @NotBlank(message = "Password is required")
        private String password;
        
        // Getters and setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
    
    public static class UpdateProfileRequest {
        private String name;
        private String timezone;
        private Boolean emailNotifications;
        
        // Getters and setters
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        
        public String getTimezone() { return timezone; }
        public void setTimezone(String timezone) { this.timezone = timezone; }
        
        public Boolean getEmailNotifications() { return emailNotifications; }
        public void setEmailNotifications(Boolean emailNotifications) { this.emailNotifications = emailNotifications; }
    }
    
    public static class ChangePasswordRequest {
        @NotBlank(message = "Current password is required")
        private String oldPassword;
        
        @NotBlank(message = "New password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String newPassword;
        
        // Getters and setters
        public String getOldPassword() { return oldPassword; }
        public void setOldPassword(String oldPassword) { this.oldPassword = oldPassword; }
        
        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }
}