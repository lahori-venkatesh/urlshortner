package com.urlshortener.service;

import com.urlshortener.model.*;
import com.urlshortener.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class DatabaseService {
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ShortenedUrlRepository shortenedUrlRepository;
    
    @Autowired
    private UploadedFileRepository uploadedFileRepository;
    
    @Autowired
    private ClickAnalyticsRepository clickAnalyticsRepository;
    
    @Autowired
    private QrCodeRepository qrCodeRepository;
    
    public Map<String, Object> initializeDatabase() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Create indexes for better performance
            createIndexes();
            
            // Get collection statistics
            Map<String, Object> stats = getDatabaseStats();
            
            result.put("success", true);
            result.put("message", "Database initialized successfully");
            result.put("collections", stats);
            result.put("timestamp", LocalDateTime.now());
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Database initialization failed: " + e.getMessage());
            result.put("error", e.getClass().getSimpleName());
        }
        
        return result;
    }
    
    private void createIndexes() {
        // User collection indexes
        mongoTemplate.indexOps(User.class)
            .ensureIndex(new Index().on("email", Sort.Direction.ASC).unique());
        mongoTemplate.indexOps(User.class)
            .ensureIndex(new Index().on("googleId", Sort.Direction.ASC));
        mongoTemplate.indexOps(User.class)
            .ensureIndex(new Index().on("apiKey", Sort.Direction.ASC));
        mongoTemplate.indexOps(User.class)
            .ensureIndex(new Index().on("createdAt", Sort.Direction.DESC));
        
        // ShortenedUrl collection indexes
        mongoTemplate.indexOps(ShortenedUrl.class)
            .ensureIndex(new Index().on("shortCode", Sort.Direction.ASC).unique());
        mongoTemplate.indexOps(ShortenedUrl.class)
            .ensureIndex(new Index().on("userId", Sort.Direction.ASC));
        mongoTemplate.indexOps(ShortenedUrl.class)
            .ensureIndex(new Index().on("customAlias", Sort.Direction.ASC));
        mongoTemplate.indexOps(ShortenedUrl.class)
            .ensureIndex(new Index().on("createdAt", Sort.Direction.DESC));
        mongoTemplate.indexOps(ShortenedUrl.class)
            .ensureIndex(new Index().on("totalClicks", Sort.Direction.DESC));
        
        // UploadedFile collection indexes
        mongoTemplate.indexOps(UploadedFile.class)
            .ensureIndex(new Index().on("fileCode", Sort.Direction.ASC).unique());
        mongoTemplate.indexOps(UploadedFile.class)
            .ensureIndex(new Index().on("userId", Sort.Direction.ASC));
        mongoTemplate.indexOps(UploadedFile.class)
            .ensureIndex(new Index().on("uploadedAt", Sort.Direction.DESC));
        mongoTemplate.indexOps(UploadedFile.class)
            .ensureIndex(new Index().on("fileType", Sort.Direction.ASC));
        
        // ClickAnalytics collection indexes
        mongoTemplate.indexOps(ClickAnalytics.class)
            .ensureIndex(new Index().on("shortCode", Sort.Direction.ASC));
        mongoTemplate.indexOps(ClickAnalytics.class)
            .ensureIndex(new Index().on("userId", Sort.Direction.ASC));
        mongoTemplate.indexOps(ClickAnalytics.class)
            .ensureIndex(new Index().on("clickedAt", Sort.Direction.DESC));
        mongoTemplate.indexOps(ClickAnalytics.class)
            .ensureIndex(new Index().on("country", Sort.Direction.ASC));
        mongoTemplate.indexOps(ClickAnalytics.class)
            .ensureIndex(new Index().on("deviceType", Sort.Direction.ASC));
        
        // QrCode collection indexes
        mongoTemplate.indexOps(QrCode.class)
            .ensureIndex(new Index().on("qrCode", Sort.Direction.ASC).unique());
        mongoTemplate.indexOps(QrCode.class)
            .ensureIndex(new Index().on("userId", Sort.Direction.ASC));
        mongoTemplate.indexOps(QrCode.class)
            .ensureIndex(new Index().on("shortCode", Sort.Direction.ASC));
        mongoTemplate.indexOps(QrCode.class)
            .ensureIndex(new Index().on("fileCode", Sort.Direction.ASC));
        mongoTemplate.indexOps(QrCode.class)
            .ensureIndex(new Index().on("createdAt", Sort.Direction.DESC));
    }
    
    public Map<String, Object> getDatabaseStats() {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            // Get database name
            String dbName = mongoTemplate.getDb().getName();
            stats.put("databaseName", dbName);
            
            // Count documents in each collection
            stats.put("users", userRepository.count());
            stats.put("shortenedUrls", shortenedUrlRepository.count());
            stats.put("uploadedFiles", uploadedFileRepository.count());
            stats.put("clickAnalytics", clickAnalyticsRepository.count());
            stats.put("qrCodes", qrCodeRepository.count());
            
            // Collection names
            stats.put("collections", mongoTemplate.getCollectionNames());
            
        } catch (Exception e) {
            stats.put("error", e.getMessage());
        }
        
        return stats;
    }
    
    public Map<String, Object> testDatabaseOperations() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Test user creation
            User testUser = new User("test@example.com", "hashedPassword");
            testUser.setFirstName("Test");
            testUser.setLastName("User");
            User savedUser = userRepository.save(testUser);
            
            // Test URL creation
            ShortenedUrl testUrl = new ShortenedUrl("https://example.com", "test123", savedUser.getId());
            testUrl.setTitle("Test URL");
            ShortenedUrl savedUrl = shortenedUrlRepository.save(testUrl);
            
            // Test analytics creation
            ClickAnalytics testAnalytics = new ClickAnalytics("test123", savedUser.getId(), "127.0.0.1", "Test Agent");
            testAnalytics.setCountry("Test Country");
            testAnalytics.setDeviceType("DESKTOP");
            ClickAnalytics savedAnalytics = clickAnalyticsRepository.save(testAnalytics);
            
            // Test QR code creation
            QrCode testQr = new QrCode("https://example.com", "URL", savedUser.getId());
            testQr.setTitle("Test QR Code");
            QrCode savedQr = qrCodeRepository.save(testQr);
            
            // Clean up test data
            userRepository.delete(savedUser);
            shortenedUrlRepository.delete(savedUrl);
            clickAnalyticsRepository.delete(savedAnalytics);
            qrCodeRepository.delete(savedQr);
            
            result.put("success", true);
            result.put("message", "All database operations completed successfully");
            result.put("testResults", Map.of(
                "userCreated", savedUser.getId() != null,
                "urlCreated", savedUrl.getId() != null,
                "analyticsCreated", savedAnalytics.getId() != null,
                "qrCodeCreated", savedQr.getId() != null
            ));
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "Database operation failed: " + e.getMessage());
            result.put("error", e.getClass().getSimpleName());
        }
        
        return result;
    }
    
    public Map<String, Object> getRealtimeStats() {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime todayStart = now.toLocalDate().atStartOfDay();
            LocalDateTime weekStart = now.minusDays(7);
            LocalDateTime monthStart = now.minusDays(30);
            
            // User statistics
            Map<String, Object> userStats = new HashMap<>();
            userStats.put("total", userRepository.count());
            userStats.put("active", userRepository.findByIsActiveTrue().size());
            userStats.put("verified", userRepository.findByEmailVerified(true).size());
            userStats.put("premium", userRepository.countBySubscriptionPlan("PREMIUM"));
            userStats.put("registeredToday", userRepository.findByCreatedAtBetween(todayStart, now).size());
            
            // URL statistics
            Map<String, Object> urlStats = new HashMap<>();
            urlStats.put("total", shortenedUrlRepository.count());
            urlStats.put("createdToday", shortenedUrlRepository.findByCreatedAtBetween(todayStart, now).size());
            urlStats.put("withQrCodes", shortenedUrlRepository.findByHasQrCodeTrue().size());
            urlStats.put("passwordProtected", shortenedUrlRepository.findByIsPasswordProtectedTrue().size());
            
            // File statistics
            Map<String, Object> fileStats = new HashMap<>();
            fileStats.put("total", uploadedFileRepository.count());
            fileStats.put("uploadedToday", uploadedFileRepository.findByUploadedAtBetween(todayStart, now).size());
            fileStats.put("public", uploadedFileRepository.findByIsPublicTrue().size());
            
            // Analytics statistics
            Map<String, Object> analyticsStats = new HashMap<>();
            analyticsStats.put("totalClicks", clickAnalyticsRepository.count());
            analyticsStats.put("clicksToday", clickAnalyticsRepository.findRecentClicks(todayStart).size());
            analyticsStats.put("clicksThisWeek", clickAnalyticsRepository.findRecentClicks(weekStart).size());
            analyticsStats.put("uniqueClicks", clickAnalyticsRepository.findByIsUniqueClickTrue().size());
            
            // QR Code statistics
            Map<String, Object> qrStats = new HashMap<>();
            qrStats.put("total", qrCodeRepository.count());
            qrStats.put("createdToday", qrCodeRepository.findByCreatedAtBetween(todayStart, now).size());
            qrStats.put("active", qrCodeRepository.findByTrackScansTrue().size());
            
            stats.put("users", userStats);
            stats.put("urls", urlStats);
            stats.put("files", fileStats);
            stats.put("analytics", analyticsStats);
            stats.put("qrCodes", qrStats);
            stats.put("timestamp", now);
            stats.put("success", true);
            
        } catch (Exception e) {
            stats.put("success", false);
            stats.put("error", e.getMessage());
        }
        
        return stats;
    }
}