package com.urlshortener.aspect;

import com.urlshortener.service.PerformanceMonitoringService;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.time.Instant;

@Aspect
@Component
public class CachePerformanceAspect {
    
    private static final Logger logger = LoggerFactory.getLogger(CachePerformanceAspect.class);
    
    @Autowired
    private PerformanceMonitoringService performanceMonitoringService;
    
    @Autowired
    private CacheManager cacheManager;
    
    /**
     * Monitor @Cacheable methods
     */
    @Around("@annotation(org.springframework.cache.annotation.Cacheable)")
    public Object monitorCacheableMethod(ProceedingJoinPoint joinPoint) throws Throwable {
        Instant startTime = Instant.now();
        String methodName = getMethodName(joinPoint);
        
        try {
            // Check if result is in cache first
            String cacheKey = generateCacheKey(joinPoint);
            boolean cacheHit = isCacheHit(cacheKey);
            
            Object result = joinPoint.proceed();
            
            Duration duration = Duration.between(startTime, Instant.now());
            
            if (cacheHit) {
                performanceMonitoringService.recordCacheHit(methodName);
                logger.debug("Cache HIT for method: {} ({}ms)", methodName, duration.toMillis());
            } else {
                performanceMonitoringService.recordCacheMiss(methodName);
                logger.debug("Cache MISS for method: {} ({}ms)", methodName, duration.toMillis());
            }
            
            performanceMonitoringService.recordCacheOperation("read", duration);
            
            return result;
            
        } catch (Exception e) {
            Duration duration = Duration.between(startTime, Instant.now());
            performanceMonitoringService.recordError("cache.read", e.getMessage());
            logger.error("Cache operation failed for method: {} ({}ms)", methodName, duration.toMillis(), e);
            throw e;
        }
    }
    
    /**
     * Monitor @CacheEvict methods
     */
    @Around("@annotation(org.springframework.cache.annotation.CacheEvict)")
    public Object monitorCacheEvictMethod(ProceedingJoinPoint joinPoint) throws Throwable {
        Instant startTime = Instant.now();
        String methodName = getMethodName(joinPoint);
        
        try {
            Object result = joinPoint.proceed();
            
            Duration duration = Duration.between(startTime, Instant.now());
            performanceMonitoringService.recordCacheOperation("evict", duration);
            
            logger.debug("Cache EVICT for method: {} ({}ms)", methodName, duration.toMillis());
            
            return result;
            
        } catch (Exception e) {
            Duration duration = Duration.between(startTime, Instant.now());
            performanceMonitoringService.recordError("cache.evict", e.getMessage());
            logger.error("Cache evict failed for method: {} ({}ms)", methodName, duration.toMillis(), e);
            throw e;
        }
    }
    
    /**
     * Monitor @CachePut methods
     */
    @Around("@annotation(org.springframework.cache.annotation.CachePut)")
    public Object monitorCachePutMethod(ProceedingJoinPoint joinPoint) throws Throwable {
        Instant startTime = Instant.now();
        String methodName = getMethodName(joinPoint);
        
        try {
            Object result = joinPoint.proceed();
            
            Duration duration = Duration.between(startTime, Instant.now());
            performanceMonitoringService.recordCacheOperation("put", duration);
            
            logger.debug("Cache PUT for method: {} ({}ms)", methodName, duration.toMillis());
            
            return result;
            
        } catch (Exception e) {
            Duration duration = Duration.between(startTime, Instant.now());
            performanceMonitoringService.recordError("cache.put", e.getMessage());
            logger.error("Cache put failed for method: {} ({}ms)", methodName, duration.toMillis(), e);
            throw e;
        }
    }
    
    /**
     * Monitor database query methods (methods in repository or service classes)
     */
    @Around("execution(* com.urlshortener.repository.*.*(..)) || " +
            "execution(* com.urlshortener.service.*.*(..) && " +
            "!execution(* com.urlshortener.service.PerformanceMonitoringService.*(..))")
    public Object monitorDatabaseQueries(ProceedingJoinPoint joinPoint) throws Throwable {
        // Only monitor if it's likely a database operation
        String methodName = getMethodName(joinPoint);
        if (!isDatabaseOperation(methodName)) {
            return joinPoint.proceed();
        }
        
        Instant startTime = Instant.now();
        
        try {
            Object result = joinPoint.proceed();
            
            Duration duration = Duration.between(startTime, Instant.now());
            performanceMonitoringService.recordDatabaseQuery(methodName, duration);
            
            // Log slow queries (> 500ms)
            if (duration.toMillis() > 500) {
                logger.warn("Slow database query detected: {} took {}ms", methodName, duration.toMillis());
            }
            
            return result;
            
        } catch (Exception e) {
            Duration duration = Duration.between(startTime, Instant.now());
            performanceMonitoringService.recordError("database.query", e.getMessage());
            logger.error("Database query failed: {} ({}ms)", methodName, duration.toMillis(), e);
            throw e;
        }
    }
    
    private String getMethodName(ProceedingJoinPoint joinPoint) {
        return joinPoint.getSignature().getDeclaringType().getSimpleName() + "." + 
               joinPoint.getSignature().getName();
    }
    
    private String generateCacheKey(ProceedingJoinPoint joinPoint) {
        // Simple cache key generation - in production, you'd want more sophisticated logic
        StringBuilder keyBuilder = new StringBuilder();
        keyBuilder.append(getMethodName(joinPoint));
        
        Object[] args = joinPoint.getArgs();
        if (args != null) {
            for (Object arg : args) {
                if (arg != null) {
                    keyBuilder.append(":").append(arg.toString());
                }
            }
        }
        
        return keyBuilder.toString();
    }
    
    private boolean isCacheHit(String cacheKey) {
        try {
            // Check common cache names for the key
            String[] cacheNames = {"userUrls", "userQRCodes", "userFiles", "urlAnalytics", 
                                 "userAnalytics", "dashboardOverview", "realtimeAnalytics"};
            
            for (String cacheName : cacheNames) {
                Cache cache = cacheManager.getCache(cacheName);
                if (cache != null && cache.get(cacheKey) != null) {
                    return true;
                }
            }
            
            return false;
            
        } catch (Exception e) {
            logger.debug("Error checking cache hit for key: {}", cacheKey, e);
            return false;
        }
    }
    
    private boolean isDatabaseOperation(String methodName) {
        // Check if the method name suggests a database operation
        String lowerMethodName = methodName.toLowerCase();
        return lowerMethodName.contains("find") || 
               lowerMethodName.contains("save") || 
               lowerMethodName.contains("delete") || 
               lowerMethodName.contains("update") || 
               lowerMethodName.contains("count") || 
               lowerMethodName.contains("exists") ||
               lowerMethodName.contains("repository");
    }
}