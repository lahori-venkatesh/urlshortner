package com.urlshortener;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import com.urlshortener.service.DatabaseService;
import java.util.Map;
import java.util.HashMap;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(exclude = {
        org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration.class,
        org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration.class,
        org.springframework.boot.autoconfigure.data.mongo.MongoDataAutoConfiguration.class,
        org.springframework.boot.autoconfigure.data.mongo.MongoRepositoriesAutoConfiguration.class
})
@RestController
@CrossOrigin(origins = "*")
@EnableScheduling
public class UrlShortenerSimpleApplication {

    @Autowired(required = false)
    private MongoTemplate mongoTemplate;

    @Autowired(required = false)
    private DatabaseService databaseService;

    public static void main(String[] args) {
        // MongoDB is now enabled - configured in application.yml
        SpringApplication.run(UrlShortenerSimpleApplication.class, args);
    }

    @GetMapping("/")
    public ResponseEntity<Map<String, String>> home() {
        Map<String, String> response = new HashMap<>();
        response.put("message", "URL Shortener Backend is running!");
        response.put("status", "success");
        response.put("version", "1.0.0");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "url-shortener");

        // Check MongoDB connection
        if (mongoTemplate != null) {
            try {
                String dbName = mongoTemplate.getDb().getName();
                long userCount = mongoTemplate.getCollection("users").countDocuments();
                response.put("mongodb", "Connected - " + userCount + " users in database");
                response.put("database", dbName);
            } catch (Exception e) {
                response.put("mongodb", "Connection failed: " + e.getMessage());
            }
        } else {
            response.put("mongodb", "Not configured");
        }

        return ResponseEntity.ok(response);
    }

    // Legacy endpoints removed - now handled by dedicated controllers

    @PostMapping("/api/v1/test-mongodb")
    public ResponseEntity<Map<String, Object>> testMongoDB() {
        Map<String, Object> response = new HashMap<>();

        if (mongoTemplate == null) {
            response.put("success", false);
            response.put("message", "MongoDB not configured");
            return ResponseEntity.ok(response);
        }

        try {
            String dbName = mongoTemplate.getDb().getName();
            long userCount = mongoTemplate.getCollection("users").countDocuments();

            response.put("success", true);
            response.put("database", dbName);
            response.put("userCount", userCount);
            response.put("message", "✅ MongoDB Atlas connection successful!");
            response.put("status", "Connected and ready for user registration");
            response.put("credentials", "Database: " + dbName);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "❌ MongoDB connection failed: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/v1/database/init")
    public ResponseEntity<Map<String, Object>> initializeDatabase() {
        if (databaseService == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Database service not available");
            return ResponseEntity.ok(response);
        }

        Map<String, Object> result = databaseService.initializeDatabase();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/api/v1/database/stats")
    public ResponseEntity<Map<String, Object>> getDatabaseStats() {
        if (databaseService == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Database service not available");
            return ResponseEntity.ok(response);
        }

        Map<String, Object> stats = databaseService.getDatabaseStats();
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/api/v1/database/test")
    public ResponseEntity<Map<String, Object>> testDatabaseOperations() {
        if (databaseService == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Database service not available");
            return ResponseEntity.ok(response);
        }

        Map<String, Object> result = databaseService.testDatabaseOperations();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/api/v1/analytics/realtime")
    public ResponseEntity<Map<String, Object>> getRealtimeAnalytics() {
        if (databaseService == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Database service not available");
            return ResponseEntity.ok(response);
        }

        Map<String, Object> stats = databaseService.getRealtimeStats();
        return ResponseEntity.ok(stats);
    }
}