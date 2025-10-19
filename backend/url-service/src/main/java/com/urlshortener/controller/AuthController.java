package com.urlshortener.controller;

import com.urlshortener.model.User;
import com.urlshortener.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @Autowired
    private UserService userService;
    
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = request.get("email");
            String password = request.get("password");
            String firstName = request.get("firstName");
            String lastName = request.get("lastName");
            
            // Validate required fields
            if (email == null || password == null) {
                response.put("success", false);
                response.put("message", "Email and password are required");
                return ResponseEntity.badRequest().body(response);
            }
            
            User user = userService.registerUser(email, password, firstName, lastName);
            
            // Remove sensitive information
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("email", user.getEmail());
            userData.put("firstName", user.getFirstName());
            userData.put("lastName", user.getLastName());
            userData.put("subscriptionPlan", user.getSubscriptionPlan());
            userData.put("emailVerified", user.isEmailVerified());
            userData.put("createdAt", user.getCreatedAt());
            userData.put("apiKey", user.getApiKey());
            
            response.put("success", true);
            response.put("message", "User registered successfully");
            response.put("user", userData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = request.get("email");
            String password = request.get("password");
            
            if (email == null || password == null) {
                response.put("success", false);
                response.put("message", "Email and password are required");
                return ResponseEntity.badRequest().body(response);
            }
            
            User user = userService.loginUser(email, password);
            
            // Remove sensitive information
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("email", user.getEmail());
            userData.put("firstName", user.getFirstName());
            userData.put("lastName", user.getLastName());
            userData.put("subscriptionPlan", user.getSubscriptionPlan());
            userData.put("emailVerified", user.isEmailVerified());
            userData.put("totalUrls", user.getTotalUrls());
            userData.put("totalQrCodes", user.getTotalQrCodes());
            userData.put("totalFiles", user.getTotalFiles());
            userData.put("totalClicks", user.getTotalClicks());
            userData.put("lastLoginAt", user.getLastLoginAt());
            userData.put("apiKey", user.getApiKey());
            
            response.put("success", true);
            response.put("message", "Login successful");
            response.put("user", userData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/google")
    public ResponseEntity<Map<String, Object>> googleAuth(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String email = request.get("email");
            String googleId = request.get("googleId");
            String firstName = request.get("firstName");
            String lastName = request.get("lastName");
            String profilePicture = request.get("profilePicture");
            
            if (email == null || googleId == null) {
                response.put("success", false);
                response.put("message", "Email and Google ID are required");
                return ResponseEntity.badRequest().body(response);
            }
            
            User user = userService.registerWithGoogle(email, googleId, firstName, lastName, profilePicture);
            
            // Remove sensitive information
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("email", user.getEmail());
            userData.put("firstName", user.getFirstName());
            userData.put("lastName", user.getLastName());
            userData.put("profilePicture", user.getProfilePicture());
            userData.put("subscriptionPlan", user.getSubscriptionPlan());
            userData.put("emailVerified", user.isEmailVerified());
            userData.put("totalUrls", user.getTotalUrls());
            userData.put("totalQrCodes", user.getTotalQrCodes());
            userData.put("totalFiles", user.getTotalFiles());
            userData.put("totalClicks", user.getTotalClicks());
            userData.put("authProvider", user.getAuthProvider());
            userData.put("apiKey", user.getApiKey());
            
            response.put("success", true);
            response.put("message", "Google authentication successful");
            response.put("user", userData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/profile/{email}")
    public ResponseEntity<Map<String, Object>> getProfile(@PathVariable String email) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            var userOpt = userService.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "User not found");
                return ResponseEntity.notFound().build();
            }
            
            User user = userOpt.get();
            
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("email", user.getEmail());
            userData.put("firstName", user.getFirstName());
            userData.put("lastName", user.getLastName());
            userData.put("profilePicture", user.getProfilePicture());
            userData.put("subscriptionPlan", user.getSubscriptionPlan());
            userData.put("emailVerified", user.isEmailVerified());
            userData.put("totalUrls", user.getTotalUrls());
            userData.put("totalQrCodes", user.getTotalQrCodes());
            userData.put("totalFiles", user.getTotalFiles());
            userData.put("totalClicks", user.getTotalClicks());
            userData.put("authProvider", user.getAuthProvider());
            userData.put("createdAt", user.getCreatedAt());
            userData.put("lastLoginAt", user.getLastLoginAt());
            
            response.put("success", true);
            response.put("user", userData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getAllUsers() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            var users = userService.userRepository.findAll();
            
            response.put("success", true);
            response.put("count", users.size());
            response.put("users", users.stream().map(user -> {
                Map<String, Object> userData = new HashMap<>();
                userData.put("id", user.getId());
                userData.put("email", user.getEmail());
                userData.put("firstName", user.getFirstName());
                userData.put("lastName", user.getLastName());
                userData.put("subscriptionPlan", user.getSubscriptionPlan());
                userData.put("emailVerified", user.isEmailVerified());
                userData.put("authProvider", user.getAuthProvider());
                userData.put("createdAt", user.getCreatedAt());
                userData.put("lastLoginAt", user.getLastLoginAt());
                return userData;
            }).toList());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}