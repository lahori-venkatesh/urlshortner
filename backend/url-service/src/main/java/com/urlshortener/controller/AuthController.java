package com.urlshortener.controller;

import com.urlshortener.model.User;
import com.urlshortener.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import java.util.Map;
import java.util.HashMap;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    
    @Autowired
    private UserService userService;
    
    @Value("${jwt.secret:mySecretKeyForJWTTokenGenerationAndValidationThatIsLongEnoughForHS512AlgorithmAndMeetsSecurityRequirements}")
    private String jwtSecret;
    
    @Value("${jwt.expiration:86400000}")
    private int jwtExpiration; // 24 hours in milliseconds
    
    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }
    
    private String generateToken(User user) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);
        
        return Jwts.builder()
                .setSubject(user.getId())
                .claim("email", user.getEmail())
                .claim("firstName", user.getFirstName())
                .claim("lastName", user.getLastName())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }
    
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
            
            // Generate JWT token
            String token = generateToken(user);
            
            response.put("success", true);
            response.put("message", "User registered successfully");
            response.put("user", userData);
            response.put("token", token);
            
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
            
            // Generate JWT token
            String token = generateToken(user);
            
            response.put("success", true);
            response.put("message", "Login successful");
            response.put("user", userData);
            response.put("token", token);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/google/callback")
    public ResponseEntity<Map<String, Object>> googleCallback(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String code = request.get("code");
            String redirectUri = request.get("redirectUri");
            
            if (code == null) {
                response.put("success", false);
                response.put("message", "Authorization code is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Exchange code for access token with Google
            String accessToken = exchangeCodeForAccessToken(code, redirectUri);
            
            // Get user info from Google
            Map<String, Object> userInfo = getUserInfoFromGoogle(accessToken);
            
            // Register or login user
            String email = (String) userInfo.get("email");
            String googleId = (String) userInfo.get("id");
            String firstName = (String) userInfo.get("given_name");
            String lastName = (String) userInfo.get("family_name");
            String profilePicture = (String) userInfo.get("picture");
            
            User user = userService.registerWithGoogle(email, googleId, firstName, lastName, profilePicture);
            
            // Prepare response data
            Map<String, Object> tokenData = new HashMap<>();
            tokenData.put("access_token", accessToken);
            tokenData.put("token_type", "Bearer");
            
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
            
            // Generate JWT token for our application
            String jwtToken = generateToken(user);
            
            response.put("success", true);
            response.put("message", "Google authentication successful");
            response.put("user", userData);
            response.put("token", jwtToken);
            response.put("google_access_token", accessToken);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Authentication failed: " + e.getMessage());
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
            
            // Generate JWT token
            String token = generateToken(user);
            
            response.put("success", true);
            response.put("message", "Google authentication successful");
            response.put("user", userData);
            response.put("token", token);
            
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
    
    @PostMapping("/validate")
    public ResponseEntity<Map<String, Object>> validateToken(@RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            System.out.println("=== Token Validation Request ===");
            System.out.println("Auth Header: " + (authHeader != null ? authHeader.substring(0, Math.min(20, authHeader.length())) + "..." : "null"));
            
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                System.out.println("Invalid authorization header format");
                response.put("success", false);
                response.put("message", "Invalid authorization header");
                return ResponseEntity.badRequest().body(response);
            }
            
            String token = authHeader.substring(7);
            System.out.println("Extracted token length: " + token.length());
            
            // Parse and validate JWT token
            var claims = Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            
            String userId = claims.getSubject();
            String email = claims.get("email", String.class);
            
            System.out.println("Token validated for user: " + email + " (ID: " + userId + ")");
            
            // Get user from database to ensure they still exist
            var userOpt = userService.findById(userId);
            if (userOpt.isEmpty()) {
                System.out.println("User not found in database: " + userId);
                response.put("success", false);
                response.put("message", "User not found");
                return ResponseEntity.badRequest().body(response);
            }
            
            User user = userOpt.get();
            System.out.println("User found and validated: " + user.getEmail());
            
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
            userData.put("createdAt", user.getCreatedAt());
            userData.put("lastLoginAt", user.getLastLoginAt());
            
            response.put("success", true);
            response.put("user", userData);
            response.put("token", token);
            
            System.out.println("Token validation successful");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.out.println("Token validation failed: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Invalid or expired token: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshToken(@RequestHeader("Authorization") String authHeader) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                response.put("success", false);
                response.put("message", "Invalid authorization header");
                return ResponseEntity.badRequest().body(response);
            }
            
            String token = authHeader.substring(7);
            String userId = null;
            
            try {
                // Try to parse token normally first
                var claims = Jwts.parserBuilder()
                        .setSigningKey(getSigningKey())
                        .build()
                        .parseClaimsJws(token)
                        .getBody();
                
                userId = claims.getSubject();
            } catch (Exception e) {
                // If token is expired, parse without validation to get user ID
                try {
                    String[] chunks = token.split("\\.");
                    if (chunks.length == 3) {
                        // Decode payload without signature verification
                        String payload = new String(java.util.Base64.getUrlDecoder().decode(chunks[1]));
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        var claims = mapper.readValue(payload, java.util.Map.class);
                        userId = (String) claims.get("sub");
                    }
                } catch (Exception parseError) {
                    response.put("success", false);
                    response.put("message", "Invalid token format");
                    return ResponseEntity.badRequest().body(response);
                }
            }
            
            if (userId == null) {
                response.put("success", false);
                response.put("message", "Unable to extract user ID from token");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Get user from database
            var userOpt = userService.findById(userId);
            if (userOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "User not found");
                return ResponseEntity.badRequest().body(response);
            }
            
            User user = userOpt.get();
            
            // Generate new token
            String newToken = generateToken(user);
            
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", user.getId());
            userData.put("email", user.getEmail());
            userData.put("firstName", user.getFirstName());
            userData.put("lastName", user.getLastName());
            userData.put("profilePicture", user.getProfilePicture());
            userData.put("subscriptionPlan", user.getSubscriptionPlan());
            userData.put("emailVerified", user.isEmailVerified());
            userData.put("authProvider", user.getAuthProvider());
            userData.put("createdAt", user.getCreatedAt());
            userData.put("totalUrls", user.getTotalUrls());
            userData.put("totalQrCodes", user.getTotalQrCodes());
            userData.put("totalFiles", user.getTotalFiles());
            userData.put("totalClicks", user.getTotalClicks());
            userData.put("apiKey", user.getApiKey());
            
            response.put("success", true);
            response.put("token", newToken);
            response.put("user", userData);
            response.put("message", "Token refreshed successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to refresh token: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getAllUsers() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            var users = userService.findAllUsers();
            
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
    
    @Value("${google.client.id:}")
    private String googleClientId;
    
    @Value("${google.client.secret:}")
    private String googleClientSecret;
    
    private String exchangeCodeForAccessToken(String code, String redirectUri) throws Exception {
        RestTemplate restTemplate = new RestTemplate();
        
        // Prepare request body
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("client_id", googleClientId);
        params.add("client_secret", googleClientSecret);
        params.add("code", code);
        params.add("grant_type", "authorization_code");
        params.add("redirect_uri", redirectUri);
        
        // Prepare headers
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Type", "application/x-www-form-urlencoded");
        
        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);
        
        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                "https://oauth2.googleapis.com/token",
                HttpMethod.POST,
                request,
                Map.class
            );
            
            Map<String, Object> responseBody = response.getBody();
            if (responseBody != null && responseBody.containsKey("access_token")) {
                return (String) responseBody.get("access_token");
            } else {
                throw new Exception("Failed to get access token from Google");
            }
        } catch (Exception e) {
            throw new Exception("Failed to exchange code for access token: " + e.getMessage());
        }
    }
    
    @SuppressWarnings("unchecked")
    private Map<String, Object> getUserInfoFromGoogle(String accessToken) throws Exception {
        RestTemplate restTemplate = new RestTemplate();
        
        // Prepare headers
        HttpHeaders headers = new HttpHeaders();
        headers.add("Authorization", "Bearer " + accessToken);
        
        HttpEntity<String> request = new HttpEntity<>(headers);
        
        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                HttpMethod.GET,
                request,
                Map.class
            );
            
            Map<String, Object> userInfo = response.getBody();
            if (userInfo != null) {
                return userInfo;
            } else {
                throw new Exception("Failed to get user info from Google");
            }
        } catch (Exception e) {
            throw new Exception("Failed to get user info from Google: " + e.getMessage());
        }
    }
}