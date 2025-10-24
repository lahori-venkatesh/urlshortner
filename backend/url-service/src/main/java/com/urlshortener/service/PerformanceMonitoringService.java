package com.urlshortener.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.Gauge;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.annotation.PostConstruct;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class PerformanceMonitoringService {
    
    private static final Logger logger = LoggerFactory.getLogger(PerformanceMonitoringService.class);
    
    @Autowired
    private MeterRegistry meterRegistry;
    
    @Autowired(required = false)
    private RedisTemplate<String, Object> redisTemplate;
    
    // Performance counters
    private Counter cacheHitCounter;
    private Counter cacheMissCounter;
    private Counter databaseQueryCounter;
    private Counter apiRequestCounter;
    private Counter errorCounter;
    
    // Performance timers
    private Timer cacheOperationTimer;
    private Timer databaseQueryTimer;
    private Timer apiResponseTimer;
    
    // Performance gauges
    private final AtomicLong activeCacheEntries = new AtomicLong(0);
    private final AtomicLong totalMemoryUsage = new AtomicLong(0);
    private final AtomicLong activeConnections = new AtomicLong(0);
    
    // Performance tracking
    private final Map<String, Long> operationTimes = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> operationCounts = new ConcurrentHashMap<>();
    
    @PostConstruct
    public void initializeMetrics() {
        // Initialize counters
        cacheHitCounter = Counter.builder("cache.hits")
                .description("Number of cache hits")
                .tag("type", "redis")
                .register(meterRegistry);
        
        cacheMissCounter = Counter.builder("cache.misses")
                .description("Number of cache misses")
                .tag("type", "redis")
                .register(meterRegistry);
        
        databaseQueryCounter = Counter.builder("database.queries")
                .description("Number of database queries")
                .tag("type", "mongodb")
                .register(meterRegistry);
        
        apiRequestCounter = Counter.builder("api.requests")
                .description("Number of API requests")
                .register(meterRegistry);
        
        errorCounter = Counter.builder("application.errors")
                .description("Number of application errors")
                .register(meterRegistry);
        
        // Initialize timers
        cacheOperationTimer = Timer.builder("cache.operation.duration")
                .description("Cache operation duration")
                .register(meterRegistry);
        
        databaseQueryTimer = Timer.builder("database.query.duration")
                .description("Database query duration")
                .register(meterRegistry);
        
        apiResponseTimer = Timer.builder("api.response.duration")
                .description("API response duration")
                .register(meterRegistry);
        
        // Initialize gauges
        Gauge.builder("cache.entries.active", this, PerformanceMonitoringService::getActiveCacheEntries)
                .description("Number of active cache entries")
                .register(meterRegistry);
        
        Gauge.builder("memory.usage.total", this, PerformanceMonitoringService::getTotalMemoryUsage)
                .description("Total memory usage in bytes")
                .register(meterRegistry);
        
        Gauge.builder("connections.active", this, PerformanceMonitoringService::getActiveConnections)
                .description("Number of active connections")
                .register(meterRegistry);
        
        logger.info("Performance monitoring metrics initialized");
    }
    
    /**
     * Record cache hit
     */
    public void recordCacheHit(String cacheType) {
        cacheHitCounter.increment();
        incrementOperationCount("cache.hit." + cacheType);
        logger.debug("Cache hit recorded for type: {}", cacheType);
    }
    
    /**
     * Record cache miss
     */
    public void recordCacheMiss(String cacheType) {
        cacheMissCounter.increment();
        incrementOperationCount("cache.miss." + cacheType);
        logger.debug("Cache miss recorded for type: {}", cacheType);
    }
    
    /**
     * Record database query
     */
    public void recordDatabaseQuery(String queryType, Duration duration) {
        databaseQueryCounter.increment();
        databaseQueryTimer.record(duration);
        recordOperationTime("db.query." + queryType, duration.toMillis());
        logger.debug("Database query recorded: {} ({}ms)", queryType, duration.toMillis());
    }
    
    /**
     * Record API request
     */
    public void recordApiRequest(String endpoint, Duration duration) {
        apiRequestCounter.increment();
        apiResponseTimer.record(duration);
        recordOperationTime("api." + endpoint, duration.toMillis());
        logger.debug("API request recorded: {} ({}ms)", endpoint, duration.toMillis());
    }
    
    /**
     * Record cache operation
     */
    public void recordCacheOperation(String operation, Duration duration) {
        cacheOperationTimer.record(duration);
        recordOperationTime("cache." + operation, duration.toMillis());
        logger.debug("Cache operation recorded: {} ({}ms)", operation, duration.toMillis());
    }
    
    /**
     * Record application error
     */
    public void recordError(String errorType, String message) {
        errorCounter.increment();
        incrementOperationCount("error." + errorType);
        logger.warn("Application error recorded: {} - {}", errorType, message);
    }
    
    /**
     * Get cache performance statistics
     */
    public Map<String, Object> getCachePerformanceStats() {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            long cacheEntries = 0;
            
            // Get cache entry count (only if Redis is available)
            if (redisTemplate != null) {
                Set<String> keys = redisTemplate.keys("pebly:*");
                cacheEntries = keys != null ? keys.size() : 0;
            }
            
            activeCacheEntries.set(cacheEntries);
            
            // Calculate cache hit ratio
            double totalCacheOps = cacheHitCounter.count() + cacheMissCounter.count();
            double hitRatio = totalCacheOps > 0 ? (cacheHitCounter.count() / totalCacheOps) * 100 : 0;
            
            stats.put("cacheEntries", cacheEntries);
            stats.put("cacheHits", cacheHitCounter.count());
            stats.put("cacheMisses", cacheMissCounter.count());
            stats.put("hitRatio", Math.round(hitRatio * 100.0) / 100.0);
            stats.put("avgCacheOpTime", getAverageOperationTime("cache"));
            
            // Memory usage estimation
            long estimatedMemory = cacheEntries * 1024; // Rough estimate: 1KB per entry
            totalMemoryUsage.set(estimatedMemory);
            stats.put("estimatedMemoryUsage", estimatedMemory);
            
        } catch (Exception e) {
            logger.error("Error getting cache performance stats", e);
            recordError("cache.stats", e.getMessage());
        }
        
        return stats;
    }
    
    /**
     * Get database performance statistics
     */
    public Map<String, Object> getDatabasePerformanceStats() {
        Map<String, Object> stats = new HashMap<>();
        
        stats.put("totalQueries", databaseQueryCounter.count());
        stats.put("avgQueryTime", getAverageOperationTime("db.query"));
        stats.put("slowQueries", getSlowOperations("db.query", 1000)); // > 1 second
        
        return stats;
    }
    
    /**
     * Get API performance statistics
     */
    public Map<String, Object> getApiPerformanceStats() {
        Map<String, Object> stats = new HashMap<>();
        
        stats.put("totalRequests", apiRequestCounter.count());
        stats.put("avgResponseTime", getAverageOperationTime("api"));
        stats.put("slowEndpoints", getSlowOperations("api", 500)); // > 500ms
        stats.put("errorRate", calculateErrorRate());
        
        return stats;
    }
    
    /**
     * Get comprehensive performance report
     */
    public Map<String, Object> getPerformanceReport() {
        Map<String, Object> report = new HashMap<>();
        
        report.put("timestamp", LocalDateTime.now());
        report.put("cache", getCachePerformanceStats());
        report.put("database", getDatabasePerformanceStats());
        report.put("api", getApiPerformanceStats());
        report.put("system", getSystemStats());
        
        return report;
    }
    
    /**
     * Get system statistics
     */
    public Map<String, Object> getSystemStats() {
        Map<String, Object> stats = new HashMap<>();
        
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        
        stats.put("maxMemory", maxMemory);
        stats.put("totalMemory", totalMemory);
        stats.put("usedMemory", usedMemory);
        stats.put("freeMemory", freeMemory);
        stats.put("memoryUsagePercent", Math.round(((double) usedMemory / maxMemory) * 100));
        stats.put("availableProcessors", runtime.availableProcessors());
        
        return stats;
    }
    
    /**
     * Check if system is healthy
     */
    public boolean isSystemHealthy() {
        try {
            Map<String, Object> cacheStats = getCachePerformanceStats();
            Map<String, Object> systemStats = getSystemStats();
            
            // Check cache hit ratio (should be > 70%)
            double hitRatio = (Double) cacheStats.getOrDefault("hitRatio", 0.0);
            if (hitRatio < 70.0) {
                logger.warn("Low cache hit ratio: {}%", hitRatio);
                return false;
            }
            
            // Check memory usage (should be < 85%)
            int memoryUsage = (Integer) systemStats.getOrDefault("memoryUsagePercent", 0);
            if (memoryUsage > 85) {
                logger.warn("High memory usage: {}%", memoryUsage);
                return false;
            }
            
            // Check error rate (should be < 5%)
            double errorRate = calculateErrorRate();
            if (errorRate > 5.0) {
                logger.warn("High error rate: {}%", errorRate);
                return false;
            }
            
            return true;
            
        } catch (Exception e) {
            logger.error("Error checking system health", e);
            return false;
        }
    }
    
    /**
     * Get performance recommendations
     */
    public Map<String, String> getPerformanceRecommendations() {
        Map<String, String> recommendations = new HashMap<>();
        
        try {
            Map<String, Object> cacheStats = getCachePerformanceStats();
            Map<String, Object> systemStats = getSystemStats();
            
            double hitRatio = (Double) cacheStats.getOrDefault("hitRatio", 0.0);
            int memoryUsage = (Integer) systemStats.getOrDefault("memoryUsagePercent", 0);
            
            if (hitRatio < 70.0) {
                recommendations.put("cache", "Consider increasing cache TTL or optimizing cache keys");
            }
            
            if (memoryUsage > 80) {
                recommendations.put("memory", "Consider increasing heap size or optimizing memory usage");
            }
            
            double avgApiTime = getAverageOperationTime("api");
            if (avgApiTime > 500) {
                recommendations.put("api", "API response times are high. Consider optimizing queries or adding more caching");
            }
            
            double avgDbTime = getAverageOperationTime("db.query");
            if (avgDbTime > 200) {
                recommendations.put("database", "Database queries are slow. Consider adding indexes or optimizing queries");
            }
            
        } catch (Exception e) {
            logger.error("Error generating performance recommendations", e);
        }
        
        return recommendations;
    }
    
    // Helper methods
    private void recordOperationTime(String operation, long timeMs) {
        operationTimes.put(operation + "." + System.currentTimeMillis(), timeMs);
        // Keep only recent entries (last 1000)
        if (operationTimes.size() > 1000) {
            operationTimes.entrySet().removeIf(entry -> 
                System.currentTimeMillis() - Long.parseLong(entry.getKey().split("\\.")[1]) > 300000); // 5 minutes
        }
    }
    
    private void incrementOperationCount(String operation) {
        operationCounts.computeIfAbsent(operation, k -> new AtomicLong(0)).incrementAndGet();
    }
    
    private double getAverageOperationTime(String operationPrefix) {
        return operationTimes.entrySet().stream()
                .filter(entry -> entry.getKey().startsWith(operationPrefix))
                .mapToLong(Map.Entry::getValue)
                .average()
                .orElse(0.0);
    }
    
    private Map<String, Long> getSlowOperations(String operationPrefix, long thresholdMs) {
        Map<String, Long> slowOps = new HashMap<>();
        operationTimes.entrySet().stream()
                .filter(entry -> entry.getKey().startsWith(operationPrefix) && entry.getValue() > thresholdMs)
                .forEach(entry -> {
                    String opName = entry.getKey().split("\\.")[0];
                    slowOps.merge(opName, 1L, Long::sum);
                });
        return slowOps;
    }
    
    private double calculateErrorRate() {
        double totalRequests = apiRequestCounter.count();
        double totalErrors = errorCounter.count();
        return totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0.0;
    }
    
    // Gauge methods
    private double getActiveCacheEntries() {
        return activeCacheEntries.get();
    }
    
    private double getTotalMemoryUsage() {
        return totalMemoryUsage.get();
    }
    
    private double getActiveConnections() {
        return activeConnections.get();
    }
}