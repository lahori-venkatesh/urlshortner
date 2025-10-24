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
    
    @Autowired(required = false)
    private MongoTemplate mongoTemplate;
    
    @Autowired(required = false)
    private UserRepository userRepository;
    
    @Autowired(required = false)
    private ShortenedUrlRepository shortenedUrlRepository;
    
    @Autowired(required = false)
    private UploadedFileRepository uploadedFileRepository;
    
    @Autowired(required = false)
    private ClickAnalyticsRepository clickAnalyticsRepository;
    
    @Autowired(required = false)
    private QrCodeRepository qrCodeRepository;
    
    public Map<String, Object> initializeDatabase() {
        Map<String, Object> result = new HashMap<>();
        
        if (mongoTemplate == null) {
            result.put("success", false);
            result.put("message", "MongoDB not configured - running in simple mode");
            return result;
        }
        
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
        if (mongoTemplate == null) {
            return;
        }
        
        try {
            // Test connection first
            mongoTemplate.getDb().getName();
            
            // User collection indexes
            createIndexSafely(User.class, "email", Sort.Direction.ASC, true);
            createIndexSafely(User.class, "googleId", Sort.Direction.ASC, false);
            createIndexSafely(User.class, "apiKey", Sort.Direction.ASC, false);
            createIndexSafely(User.class, "createdAt", Sort.Direction.DESC, false);
            
            // ShortenedUrl collection indexes
            createIndexSafely(ShortenedUrl.class, "shortCode", Sort.Direction.ASC, true);
            createIndexSafely(ShortenedUrl.class, "userId", Sort.Direction.ASC, false);
            createIndexSafely(ShortenedUrl.class, "customAlias", Sort.Direction.ASC, false);
            createIndexSafely(ShortenedUrl.class, "createdAt", Sort.Direction.DESC, false);
            createIndexSafely(ShortenedUrl.class, "totalClicks", Sort.Direction.DESC, false);
            
            // UploadedFile collection indexes
            createIndexSafely(UploadedFile.class, "fileCode", Sort.Direction.ASC, true);
            createIndexSafely(UploadedFile.class, "userId", Sort.Direction.ASC, false);
            createIndexSafely(UploadedFile.class, "uploadedAt", Sort.Direction.DESC, false);
            createIndexSafely(UploadedFile.class, "fileType", Sort.Direction.ASC, false);
            
            // ClickAnalytics collection indexes
            createIndexSafely(ClickAnalytics.class, "shortCode", Sort.Direction.ASC, false);
            createIndexSafely(ClickAnalytics.class, "userId", Sort.Direction.ASC, false);
            createIndexSafely(ClickAnalytics.class, "clickedAt", Sort.Direction.DESC, false);
            createIndexSafely(ClickAnalytics.class, "country", Sort.Direction.ASC, false);
            createIndexSafely(ClickAnalytics.class, "deviceType", Sort.Direction.ASC, false);
            
            // QrCode collection indexes
            createIndexSafely(QrCode.class, "qrCode", Sort.Direction.ASC, true);
            createIndexSafely(QrCode.class, "userId", Sort.Direction.ASC, false);
            createIndexSafely(QrCode.class, "shortCode", Sort.Direction.ASC, false);
            createIndexSafely(QrCode.class, "fileCode", Sort.Direction.ASC, false);
            createIndexSafely(QrCode.class, "createdAt", Sort.Direction.DESC, false);
            
        } catch (Exception e) {
            System.err.println("Warning: Could not create MongoDB indexes - " + e.getMessage());
            // Don't throw exception, just log and continue
        }
    }
    
    private void createIndexSafely(Class<?> entityClass, String field, Sort.Direction direction, boolean unique) {
        try {
            Index index = new Index().on(field, direction);
            if (unique) {
                index = index.unique();
            }
            mongoTemplate.indexOps(entityClass).ensureIndex(index);
        } catch (Exception e) {
            System.err.println("Warning: Could not create index on " + entityClass.getSimpleName() + "." + field + " - " + e.getMessage());
        }
    }
    
    public Map<String, Object> getDatabaseStats() {
        Map<String, Object> stats = new HashMap<>();
        
        if (mongoTemplate == null) {
            stats.put("error", "MongoDB not configured - running in simple mode");
            return stats;
        }
        
        try {
            // Get database name
            String dbName = mongoTemplate.getDb().getName();
            stats.put("databaseName", dbName);
            
            // Count documents in each collection (with null checks)
            stats.put("users", userRepository != null ? userRepository.count() : 0);
            stats.put("shortenedUrls", shortenedUrlRepository != null ? shortenedUrlRepository.count() : 0);
            stats.put("uploadedFiles", uploadedFileRepository != null ? uploadedFileRepository.count() : 0);
            stats.put("clickAnalytics", clickAnalyticsRepository != null ? clickAnalyticsRepository.count() : 0);
            stats.put("qrCodes", qrCodeRepository != null ? qrCodeRepository.count() : 0);
            
            // Collection names
            stats.put("collections", mongoTemplate.getCollectionNames());
            
        } catch (Exception e) {
            stats.put("error", e.getMessage());
        }
        
        return stats;
    }
    
    public Map<String, Object> testDatabaseOperations() {
        Map<String, Object> result = new HashMap<>();
        
        if (mongoTemplate == null || userRepository == null) {
            result.put("success", false);
            result.put("message", "MongoDB not configured - running in simple mode");
            return result;
        }
        
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
        
        if (mongoTemplate == null) {
            stats.put("error", "MongoDB not configured - running in simple mode");
            return stats;
        }
        
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime todayStart = now.toLocalDate().atStartOfDay();
            LocalDateTime weekStart = now.minusDays(7);
            LocalDateTime monthStart = now.minusDays(30);
            
            // User statistics
            Map<String, Object> userStats = new HashMap<>();
            if (userRepository != null) {
                userStats.put("total", userRepository.count());
                userStats.put("active", userRepository.findByIsActiveTrue().size());
                userStats.put("verified", userRepository.findByEmailVerified(true).size());
                userStats.put("premium", userRepository.countBySubscriptionPlan("PREMIUM"));
                userStats.put("registeredToday", userRepository.findByCreatedAtBetween(todayStart, now).size());
            } else {
                userStats.put("total", 0);
                userStats.put("active", 0);
                userStats.put("verified", 0);
                userStats.put("premium", 0);
                userStats.put("registeredToday", 0);
            }
            
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