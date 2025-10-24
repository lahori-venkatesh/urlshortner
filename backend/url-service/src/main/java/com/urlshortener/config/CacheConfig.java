package com.urlshortener.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
@EnableCaching
public class CacheConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(CacheConfig.class);
    
    /**
     * Fallback cache manager when Redis is not available
     */
    @Bean
    @Primary
    @ConditionalOnProperty(name = "spring.cache.type", havingValue = "simple", matchIfMissing = true)
    public CacheManager simpleCacheManager() {
        logger.info("Using simple in-memory cache manager (Redis not configured)");
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
        
        // Pre-configure cache names
        cacheManager.setCacheNames(java.util.Arrays.asList(
            "userUrls",
            "userQRCodes", 
            "userFiles",
            "urlAnalytics",
            "userAnalytics",
            "dashboardOverview",
            "realtimeAnalytics",
            "clickCounts",
            "countryStats"
        ));
        
        cacheManager.setAllowNullValues(false);
        return cacheManager;
    }
}