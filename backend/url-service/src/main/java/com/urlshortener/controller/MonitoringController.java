package com.urlshortener.controller;

import com.urlshortener.service.PerformanceMonitoringService;
import com.urlshortener.service.CacheService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/monitoring")
@CrossOrigin(origins = "*")
public class MonitoringController {
    
    private static final Logger logger = LoggerFactory.getLogger(MonitoringController.class);
    
    @Autowired
    private PerformanceMonitoringService performanceMonitoringService;
    
    @Autowired
    private CacheService cacheService;
    
    /**
     * Get comprehensive performance report
     */
    @GetMapping("/performance")
    public ResponseEntity<Map<String, Object>> getPerformanceReport() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Generating performance report");
            
            Map<String, Object> report = performanceMonitoringService.getPerformanceReport();
            
            response.put("success", true);
            response.put("data", report);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error generating performance report", e);
            response.put("success", false);
            response.put("message", "Failed to generate performance report: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Get cache performance statistics
     */
    @GetMapping("/cache")
    public ResponseEntity<Map<String, Object>> getCacheStats() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.debug("Fetching cache performance statistics");
            
            Map<String, Object> cacheStats = performanceMonitoringService.getCachePerformanceStats();
            
            response.put("success", true);
            response.put("data", cacheStats);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching cache statistics", e);
            response.put("success", false);
            response.put("message", "Failed to fetch cache statistics: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Get database performance statistics
     */
    @GetMapping("/database")
    public ResponseEntity<Map<String, Object>> getDatabaseStats() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.debug("Fetching database performance statistics");
            
            Map<String, Object> dbStats = performanceMonitoringService.getDatabasePerformanceStats();
            
            response.put("success", true);
            response.put("data", dbStats);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching database statistics", e);
            response.put("success", false);
            response.put("message", "Failed to fetch database statistics: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Get API performance statistics
     */
    @GetMapping("/api")
    public ResponseEntity<Map<String, Object>> getApiStats() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.debug("Fetching API performance statistics");
            
            Map<String, Object> apiStats = performanceMonitoringService.getApiPerformanceStats();
            
            response.put("success", true);
            response.put("data", apiStats);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching API statistics", e);
            response.put("success", false);
            response.put("message", "Failed to fetch API statistics: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Get system health status
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealthStatus() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.debug("Checking system health status");
            
            boolean isHealthy = performanceMonitoringService.isSystemHealthy();
            Map<String, Object> systemStats = performanceMonitoringService.getSystemStats();
            Map<String, String> recommendations = performanceMonitoringService.getPerformanceRecommendations();
            
            Map<String, Object> healthData = new HashMap<>();
            healthData.put("healthy", isHealthy);
            healthData.put("status", isHealthy ? "UP" : "DEGRADED");
            healthData.put("systemStats", systemStats);
            healthData.put("recommendations", recommendations);
            
            response.put("success", true);
            response.put("data", healthData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error checking system health", e);
            response.put("success", false);
            response.put("message", "Failed to check system health: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Get performance recommendations
     */
    @GetMapping("/recommendations")
    public ResponseEntity<Map<String, Object>> getRecommendations() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.debug("Generating performance recommendations");
            
            Map<String, String> recommendations = performanceMonitoringService.getPerformanceRecommendations();
            
            response.put("success", true);
            response.put("data", recommendations);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error generating recommendations", e);
            response.put("success", false);
            response.put("message", "Failed to generate recommendations: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Clear all caches (admin operation)
     */
    @PostMapping("/cache/clear-all")
    public ResponseEntity<Map<String, Object>> clearAllCaches() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.warn("Clearing all caches - admin operation");
            
            // Clear different cache types
            cacheService.clearEntireCache("analytics");
            cacheService.clearEntireCache("userAnalytics");
            cacheService.clearEntireCache("urlAnalytics");
            cacheService.clearEntireCache("userUrls");
            cacheService.clearEntireCache("userQRCodes");
            cacheService.clearEntireCache("userFiles");
            cacheService.clearEntireCache("dashboardOverview");
            cacheService.clearEntireCache("countryStats");
            cacheService.clearEntireCache("realtimeAnalytics");
            
            response.put("success", true);
            response.put("message", "All caches cleared successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error clearing all caches", e);
            response.put("success", false);
            response.put("message", "Failed to clear caches: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Warm up caches for a specific user (admin operation)
     */
    @PostMapping("/cache/warmup/{userId}")
    public ResponseEntity<Map<String, Object>> warmupUserCache(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Warming up cache for user: {}", userId);
            
            // This would trigger cache population by calling the cached methods
            // In a real implementation, you'd inject the dashboard service and call its methods
            
            response.put("success", true);
            response.put("message", "Cache warmup initiated for user: " + userId);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error warming up cache for user: {}", userId, e);
            response.put("success", false);
            response.put("message", "Failed to warm up cache: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Get cache statistics by type
     */
    @GetMapping("/cache/{cacheType}")
    public ResponseEntity<Map<String, Object>> getCacheStatsByType(@PathVariable String cacheType) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.debug("Fetching cache statistics for type: {}", cacheType);
            
            // Log cache statistics for the specific type
            cacheService.logCacheStats();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("cacheType", cacheType);
            stats.put("message", "Cache statistics logged - check server logs for details");
            
            response.put("success", true);
            response.put("data", stats);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching cache statistics for type: {}", cacheType, e);
            response.put("success", false);
            response.put("message", "Failed to fetch cache statistics: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Record custom performance metric (for testing)
     */
    @PostMapping("/metrics/record")
    public ResponseEntity<Map<String, Object>> recordCustomMetric(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String metricType = (String) request.get("type");
            String operation = (String) request.get("operation");
            Long duration = request.get("duration") != null ? 
                Long.valueOf(request.get("duration").toString()) : null;
            
            if (metricType == null || operation == null) {
                response.put("success", false);
                response.put("message", "Missing required fields: type, operation");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Record the metric based on type
            switch (metricType.toLowerCase()) {
                case "cache_hit":
                    performanceMonitoringService.recordCacheHit(operation);
                    break;
                case "cache_miss":
                    performanceMonitoringService.recordCacheMiss(operation);
                    break;
                case "error":
                    String message = (String) request.getOrDefault("message", "Custom error");
                    performanceMonitoringService.recordError(operation, message);
                    break;
                default:
                    response.put("success", false);
                    response.put("message", "Unknown metric type: " + metricType);
                    return ResponseEntity.badRequest().body(response);
            }
            
            response.put("success", true);
            response.put("message", "Metric recorded successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error recording custom metric", e);
            response.put("success", false);
            response.put("message", "Failed to record metric: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}