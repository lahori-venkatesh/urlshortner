package com.urlshortener.interceptor;

import com.urlshortener.service.PerformanceMonitoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.time.Instant;

@Component
public class PerformanceInterceptor implements HandlerInterceptor {
    
    private static final Logger logger = LoggerFactory.getLogger(PerformanceInterceptor.class);
    
    @Autowired
    private PerformanceMonitoringService performanceMonitoringService;
    
    private static final String START_TIME_ATTRIBUTE = "startTime";
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // Record start time
        request.setAttribute(START_TIME_ATTRIBUTE, Instant.now());
        
        // Log request details
        String endpoint = getEndpointName(request);
        logger.debug("API request started: {} {}", request.getMethod(), endpoint);
        
        return true;
    }
    
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, 
                              Object handler, Exception ex) {
        
        try {
            // Calculate request duration
            Instant startTime = (Instant) request.getAttribute(START_TIME_ATTRIBUTE);
            if (startTime != null) {
                Duration duration = Duration.between(startTime, Instant.now());
                String endpoint = getEndpointName(request);
                
                // Record API performance metrics
                performanceMonitoringService.recordApiRequest(endpoint, duration);
                
                // Log slow requests (> 1 second)
                if (duration.toMillis() > 1000) {
                    logger.warn("Slow API request detected: {} {} took {}ms", 
                              request.getMethod(), endpoint, duration.toMillis());
                }
                
                // Record errors if any
                if (ex != null) {
                    performanceMonitoringService.recordError("api.exception", ex.getMessage());
                    logger.error("API request failed: {} {} - {}", 
                               request.getMethod(), endpoint, ex.getMessage());
                }
                
                // Record HTTP error status codes
                int statusCode = response.getStatus();
                if (statusCode >= 400) {
                    String errorType = getErrorType(statusCode);
                    performanceMonitoringService.recordError("api.http." + errorType, 
                                                            "HTTP " + statusCode + " for " + endpoint);
                }
                
                logger.debug("API request completed: {} {} - {}ms (status: {})", 
                           request.getMethod(), endpoint, duration.toMillis(), statusCode);
            }
            
        } catch (Exception e) {
            logger.error("Error in performance interceptor", e);
        }
    }
    
    /**
     * Extract meaningful endpoint name from request
     */
    private String getEndpointName(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String method = request.getMethod();
        
        // Normalize common patterns
        uri = uri.replaceAll("/api/v1", "");
        uri = uri.replaceAll("/[a-f0-9-]{36}", "/{id}"); // Replace UUIDs
        uri = uri.replaceAll("/[a-zA-Z0-9]{6,}", "/{code}"); // Replace short codes
        uri = uri.replaceAll("/\\d+", "/{id}"); // Replace numeric IDs
        
        return method + " " + uri;
    }
    
    /**
     * Get error type from HTTP status code
     */
    private String getErrorType(int statusCode) {
        if (statusCode >= 400 && statusCode < 500) {
            return "client_error";
        } else if (statusCode >= 500) {
            return "server_error";
        }
        return "unknown";
    }
}