package com.urlshortener.controller;

import com.urlshortener.service.DashboardService;
import com.urlshortener.service.AnalyticsService;
import com.urlshortener.service.CacheService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {
    
    private static final Logger logger = LoggerFactory.getLogger(DashboardController.class);
    
    @Autowired
    private DashboardService dashboardService;
    
    @Autowired
    private AnalyticsService analyticsService;
    
    @Autowired
    private CacheService cacheService;
    
    /**
     * Get comprehensive dashboard overview with caching
     */
    @GetMapping("/overview/{userId}")
    public ResponseEntity<Map<String, Object>> getDashboardOverview(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Fetching dashboard overview for user: {}", userId);
            
            Map<String, Object> dashboard = dashboardService.getDashboardOverview(userId);
            
            response.put("success", true);
            response.put("data", dashboard);
            response.put("cached", true); // Indicates data is cached for performance
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching dashboard overview for user: {}", userId, e);
            response.put("success", false);
            response.put("message", "Failed to load dashboard: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Get user's URLs with caching
     */
    @GetMapping("/urls/{userId}")
    public ResponseEntity<Map<String, Object>> getUserUrls(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.debug("Fetching URLs for user: {}", userId);
            
            var urls = dashboardService.getUserUrls(userId);
            
            response.put("success", true);
            response.put("count", urls.size());
            response.put("data", urls);
            response.put("cached", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching URLs for user: {}", userId, e);
            response.put("success", false);
            response.put("message", "Failed to load URLs: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Get user's QR codes with caching
     */
    @GetMapping("/qr/{userId}")
    public ResponseEntity<Map<String, Object>> getUserQRCodes(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.debug("Fetching QR codes for user: {}", userId);
            
            var qrCodes = dashboardService.getUserQRCodes(userId);
            
            response.put("success", true);
            response.put("count", qrCodes.size());
            response.put("data", qrCodes);
            response.put("cached", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching QR codes for user: {}", userId, e);
            response.put("success", false);
            response.put("message", "Failed to load QR codes: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Get user's files with caching
     */
    @GetMapping("/files/{userId}")
    public ResponseEntity<Map<String, Object>> getUserFiles(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.debug("Fetching files for user: {}", userId);
            
            var files = dashboardService.getUserFiles(userId);
            
            response.put("success", true);
            response.put("count", files.size());
            response.put("data", files);
            response.put("cached", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching files for user: {}", userId, e);
            response.put("success", false);
            response.put("message", "Failed to load files: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Get URL click counts with caching
     */
    @GetMapping("/clicks/{shortCode}")
    public ResponseEntity<Map<String, Object>> getUrlClickCounts(@PathVariable String shortCode) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.debug("Fetching click counts for URL: {}", shortCode);
            
            Map<String, Object> counts = dashboardService.getUrlClickCounts(shortCode);
            
            if (counts.isEmpty()) {
                response.put("success", false);
                response.put("message", "URL not found");
                return ResponseEntity.notFound().build();
            }
            
            response.put("success", true);
            response.put("data", counts);
            response.put("cached", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching click counts for URL: {}", shortCode, e);
            response.put("success", false);
            response.put("message", "Failed to load click counts: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Get country statistics with caching
     */
    @GetMapping("/geo/{userId}")
    public ResponseEntity<Map<String, Object>> getCountryStats(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.debug("Fetching geo stats for user: {}", userId);
            
            Map<String, Object> geoStats = dashboardService.getCountryStats(userId);
            
            response.put("success", true);
            response.put("data", geoStats);
            response.put("cached", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching geo stats for user: {}", userId, e);
            response.put("success", false);
            response.put("message", "Failed to load geo stats: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Get realtime analytics with short cache
     */
    @GetMapping("/realtime/{userId}")
    public ResponseEntity<Map<String, Object>> getRealtimeAnalytics(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.debug("Fetching realtime analytics for user: {}", userId);
            
            Map<String, Object> realtime = analyticsService.getRealtimeAnalytics(userId);
            
            response.put("success", true);
            response.put("data", realtime);
            response.put("cached", true);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching realtime analytics for user: {}", userId, e);
            response.put("success", false);
            response.put("message", "Failed to load realtime analytics: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Clear user's cache (for testing/admin purposes)
     */
    @PostMapping("/cache/clear/{userId}")
    public ResponseEntity<Map<String, Object>> clearUserCache(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Clearing cache for user: {}", userId);
            
            cacheService.invalidateUserAnalytics(userId);
            
            response.put("success", true);
            response.put("message", "Cache cleared successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error clearing cache for user: {}", userId, e);
            response.put("success", false);
            response.put("message", "Failed to clear cache: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Get cache statistics (for monitoring)
     */
    @GetMapping("/cache/stats")
    public ResponseEntity<Map<String, Object>> getCacheStats() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            cacheService.logCacheStats();
            
            response.put("success", true);
            response.put("message", "Cache stats logged - check server logs");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting cache stats", e);
            response.put("success", false);
            response.put("message", "Failed to get cache stats: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}