package com.urlshortener.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;

@Service
@Transactional
public class AnalyticsService {
    
    private static final Logger logger = LoggerFactory.getLogger(AnalyticsService.class);
    
    @Async("analyticsExecutor")
    public CompletableFuture<Void> recordClick(String shortCode, HttpServletRequest request) {
        try {
            // Extract analytics data
            String userAgent = request.getHeader("User-Agent");
            String referer = request.getHeader("Referer");
            String ipAddress = getClientIpAddress(request);
            
            // Log click event (in production, save to database/analytics service)
            logger.info("Click recorded - ShortCode: {}, IP: {}, UserAgent: {}, Referer: {}, Time: {}", 
                       shortCode, ipAddress, userAgent, referer, LocalDateTime.now());
            
            // Here you would typically:
            // 1. Save to analytics database (MongoDB/ClickHouse)
            // 2. Update click counters
            // 3. Process geolocation data
            // 4. Detect device/browser information
            // 5. Check for bot traffic
            
            return CompletableFuture.completedFuture(null);
            
        } catch (Exception e) {
            logger.error("Error recording click analytics for shortCode: {}", shortCode, e);
            return CompletableFuture.failedFuture(e);
        }
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    @Async("analyticsExecutor")
    public CompletableFuture<Void> updateClickCount(String shortCode) {
        try {
            // Increment click count in database
            // This should be done atomically to handle high concurrency
            logger.debug("Updating click count for shortCode: {}", shortCode);
            
            return CompletableFuture.completedFuture(null);
            
        } catch (Exception e) {
            logger.error("Error updating click count for shortCode: {}", shortCode, e);
            return CompletableFuture.failedFuture(e);
        }
    }
}