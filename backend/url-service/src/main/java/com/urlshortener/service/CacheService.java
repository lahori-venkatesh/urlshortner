package com.urlshortener.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
public class CacheService {
    
    private static final Logger logger = LoggerFactory.getLogger(CacheService.class);
    
    @Autowired
    private CacheManager cacheManager;
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    /**
     * Invalidate all analytics caches for a specific user
     */
    public void invalidateUserAnalytics(String userId) {
        try {
            // Clear user-specific analytics caches
            clearCache("userAnalytics", userId);
            clearCache("dashboardOverview", userId);
            clearCache("realtimeAnalytics", userId);
            clearCache("userUrls", userId);
            clearCache("userQRCodes", userId);
            clearCache("userFiles", userId);
            
            logger.info("Invalidated analytics caches for user: {}", userId);
        } catch (Exception e) {
            logger.error("Error invalidating user analytics cache for user: {}", userId, e);
        }
    }
    
    /**
     * Invalidate analytics caches for a specific URL
     */
    public void invalidateUrlAnalytics(String shortCode, String userId) {
        try {
            // Clear URL-specific analytics
            clearCache("urlAnalytics", shortCode);
            clearCache("clickCounts", shortCode);
            
            // Clear user analytics as they aggregate URL data
            invalidateUserAnalytics(userId);
            
            logger.info("Invalidated analytics caches for URL: {} (user: {})", shortCode, userId);
        } catch (Exception e) {
            logger.error("Error invalidating URL analytics cache for URL: {}", shortCode, e);
        }
    }
    
    /**
     * Invalidate country/geographic statistics
     */
    public void invalidateGeoStats() {
        try {
            clearCachePattern("countryStats*");
            clearCachePattern("geoData*");
            
            logger.info("Invalidated geographic statistics caches");
        } catch (Exception e) {
            logger.error("Error invalidating geo stats cache", e);
        }
    }
    
    /**
     * Clear specific cache entry
     */
    public void clearCache(String cacheName, String key) {
        try {
            var cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.evict(key);
                logger.debug("Cleared cache entry: {}:{}", cacheName, key);
            }
        } catch (Exception e) {
            logger.error("Error clearing cache {}:{}", cacheName, key, e);
        }
    }
    
    /**
     * Clear entire cache
     */
    public void clearEntireCache(String cacheName) {
        try {
            var cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
                logger.info("Cleared entire cache: {}", cacheName);
            }
        } catch (Exception e) {
            logger.error("Error clearing entire cache: {}", cacheName, e);
        }
    }
    
    /**
     * Clear cache entries matching pattern
     */
    public void clearCachePattern(String pattern) {
        try {
            Set<String> keys = redisTemplate.keys("pebly:" + pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                logger.info("Cleared {} cache entries matching pattern: {}", keys.size(), pattern);
            }
        } catch (Exception e) {
            logger.error("Error clearing cache pattern: {}", pattern, e);
        }
    }
    
    /**
     * Set cache entry with custom TTL
     */
    public void setCacheWithTtl(String key, Object value, long ttlSeconds) {
        try {
            redisTemplate.opsForValue().set("pebly:" + key, value, ttlSeconds, TimeUnit.SECONDS);
            logger.debug("Set cache entry with TTL: {} ({}s)", key, ttlSeconds);
        } catch (Exception e) {
            logger.error("Error setting cache with TTL: {}", key, e);
        }
    }
    
    /**
     * Get cache entry
     */
    public Object getCacheEntry(String key) {
        try {
            return redisTemplate.opsForValue().get("pebly:" + key);
        } catch (Exception e) {
            logger.error("Error getting cache entry: {}", key, e);
            return null;
        }
    }
    
    /**
     * Check if cache entry exists
     */
    public boolean cacheExists(String key) {
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey("pebly:" + key));
        } catch (Exception e) {
            logger.error("Error checking cache existence: {}", key, e);
            return false;
        }
    }
    
    /**
     * Increment counter in cache
     */
    public Long incrementCounter(String key) {
        try {
            return redisTemplate.opsForValue().increment("pebly:counter:" + key);
        } catch (Exception e) {
            logger.error("Error incrementing counter: {}", key, e);
            return null;
        }
    }
    
    /**
     * Get cache statistics
     */
    public void logCacheStats() {
        try {
            Set<String> keys = redisTemplate.keys("pebly:*");
            logger.info("Total cache entries: {}", keys != null ? keys.size() : 0);
            
            // Log cache sizes by type
            if (keys != null) {
                long analyticsCount = keys.stream().filter(k -> k.contains("analytics")).count();
                long urlCount = keys.stream().filter(k -> k.contains("userUrls")).count();
                long qrCount = keys.stream().filter(k -> k.contains("userQRCodes")).count();
                long fileCount = keys.stream().filter(k -> k.contains("userFiles")).count();
                
                logger.info("Cache breakdown - Analytics: {}, URLs: {}, QR: {}, Files: {}", 
                           analyticsCount, urlCount, qrCount, fileCount);
            }
        } catch (Exception e) {
            logger.error("Error getting cache statistics", e);
        }
    }
}