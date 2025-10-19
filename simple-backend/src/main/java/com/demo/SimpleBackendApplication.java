package com.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

@SpringBootApplication
@RestController
@CrossOrigin(origins = "http://localhost:3000")
public class SimpleBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SimpleBackendApplication.class, args);
    }
    
    @GetMapping("/")
    public ResponseEntity<Map<String, String>> home() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "🚀 URL Shortener Backend with MongoDB is running!");
        response.put("status", "success");
        response.put("version", "1.0.0");
        response.put("mongodb", "❌ MongoDB Atlas authentication failed!");
        response.put("features", "User registration, login, password hashing, JWT authentication");
        response.put("database", "MongoDB Atlas - Authentication issue detected");
        response.put("issue", "MongoDB credentials need to be verified");
        response.put("solution", "Please check MongoDB Atlas username/password and database permissions");
        return ResponseEntity.ok(response);
    }
    
    @Autowired
    private com.demo.repository.UserRepository userRepository;
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "url-shortener");
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        
        // Test MongoDB connection
        try {
            long userCount = userRepository.count();
            response.put("mongodb", "Connected - " + userCount + " users in database");
        } catch (Exception e) {
            response.put("mongodb", "Error: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/api/v1/urls")
    public ResponseEntity<Map<String, Object>> createShortUrl(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> data = new HashMap<>();
        
        String originalUrl = request.get("originalUrl");
        String shortCode = "demo" + (System.currentTimeMillis() % 10000);
        
        data.put("shortCode", shortCode);
        data.put("shortUrl", "http://localhost:8080/" + shortCode);
        data.put("originalUrl", originalUrl);
        data.put("createdAt", java.time.LocalDateTime.now().toString());
        data.put("clicks", 0);
        data.put("isActive", true);
        
        response.put("success", true);
        response.put("message", "URL created successfully (demo mode - MongoDB connection issue)");
        response.put("data", data);
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/api/v1/test-mongodb")
    public ResponseEntity<Map<String, Object>> testMongoDB() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            long userCount = userRepository.count();
            response.put("success", true);
            response.put("message", "✅ MongoDB Atlas connection successful!");
            response.put("userCount", userCount);
            response.put("database", "pebly_production");
            response.put("status", "Connected and ready for user registration");
            response.put("credentials", "Username: lahorivenkatesh709, Database: pebly_production");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "❌ MongoDB Atlas connection still failing!");
            response.put("error", e.getMessage());
            response.put("troubleshooting", "Atlas Admin permissions may take 2-5 minutes to propagate");
            response.put("next_steps", "Wait a few minutes and try again, or check MongoDB Atlas dashboard");
        }
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/api/v1/auth/test-register")
    public ResponseEntity<Map<String, Object>> testUserRegistration(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        String email = request.get("email");
        String name = request.get("name");
        String password = request.get("password");
        
        try {
            // Try to register user in MongoDB
            long userCount = userRepository.count();
            
            response.put("success", true);
            response.put("message", "✅ Ready to register user in MongoDB!");
            response.put("currentUsers", userCount);
            response.put("willCreate", Map.of(
                "email", email,
                "name", name,
                "hasPassword", password != null && !password.isEmpty()
            ));
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "❌ Cannot register user - MongoDB connection issue");
            response.put("error", e.getMessage());
            response.put("received", Map.of(
                "email", email,
                "name", name,
                "passwordLength", password != null ? password.length() : 0
            ));
        }
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/api/v1/files/my-files")
    public ResponseEntity<Map<String, Object>> getMyFiles(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> response = new HashMap<>();
        List<Map<String, Object>> files = new ArrayList<>();
        
        // Demo file data - in real implementation, this would fetch from MongoDB based on user
        Map<String, Object> demoFile = new HashMap<>();
        demoFile.put("fileId", "demo-file-1");
        demoFile.put("fileName", "sample-document.pdf");
        demoFile.put("contentType", "application/pdf");
        demoFile.put("fileSize", 1024000);
        demoFile.put("uploadedAt", java.time.LocalDateTime.now().minusDays(1).toString());
        demoFile.put("downloadCount", 5);
        demoFile.put("isPublic", true);
        demoFile.put("shortCode", "demo123");
        demoFile.put("shortUrl", "http://localhost:8080/demo123");
        files.add(demoFile);
        
        response.put("success", true);
        response.put("message", "Files retrieved successfully (MongoDB integration ready)");
        response.put("data", files);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/api/v1/files/upload")
    public ResponseEntity<Map<String, Object>> uploadFile() {
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> data = new HashMap<>();
        
        String fileId = "demo-file-" + System.currentTimeMillis();
        String shortCode = "file" + (System.currentTimeMillis() % 10000);
        
        data.put("fileId", fileId);
        data.put("shortCode", shortCode);
        data.put("shortUrl", "http://localhost:8080/" + shortCode);
        data.put("fileName", "uploaded-file.pdf");
        data.put("fileSize", 2048000);
        data.put("fileType", "pdf");
        data.put("uploadedAt", java.time.LocalDateTime.now().toString());
        data.put("isPasswordProtected", false);
        
        response.put("success", true);
        response.put("message", "File upload simulation successful! MongoDB GridFS integration coming soon.");
        response.put("data", data);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/api/v1/files/stats")
    public ResponseEntity<Map<String, Object>> getFileStats(@RequestHeader(value = "User-ID", required = false) String userId) {
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> stats = new HashMap<>();
        Map<String, Integer> fileTypeStats = new HashMap<>();
        
        stats.put("totalFiles", 3);
        stats.put("totalSize", 5120000L);
        stats.put("totalDownloads", 15L);
        
        fileTypeStats.put("pdf", 2);
        fileTypeStats.put("jpg", 1);
        stats.put("fileTypeStats", fileTypeStats);
        
        response.put("success", true);
        response.put("message", "File statistics retrieved (demo mode)");
        response.put("data", stats);
        
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/api/v1/files/{fileId}")
    public ResponseEntity<Map<String, Object>> deleteFile(@PathVariable String fileId, @RequestHeader(value = "User-ID", required = false) String userId) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "File deletion simulated successfully! MongoDB integration coming soon.");
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{shortCode}")
    public ResponseEntity<Void> redirect(@PathVariable String shortCode) {
        // Demo redirect - in real implementation this would redirect to the actual URL or file
        return ResponseEntity.status(302)
                .header("Location", "https://www.google.com")
                .header("Cache-Control", "no-cache, no-store, must-revalidate")
                .build();
    }
}