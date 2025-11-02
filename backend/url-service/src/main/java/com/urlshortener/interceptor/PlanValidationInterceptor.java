package com.urlshortener.interceptor;

import com.urlshortener.annotation.RequiresPlan;
import com.urlshortener.model.User;
import com.urlshortener.service.PlanValidationService;
import com.urlshortener.service.UserService;
import com.urlshortener.exception.PlanLimitException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.lang.reflect.Method;
import java.util.Optional;

/**
 * Interceptor that validates plan access before controller methods execute
 * Works with @RequiresPlan annotation to enforce plan limits
 */
@Component
public class PlanValidationInterceptor implements HandlerInterceptor {
    
    private static final Logger logger = LoggerFactory.getLogger(PlanValidationInterceptor.class);
    
    @Autowired
    private PlanValidationService planValidationService;
    
    @Autowired
    private UserService userService;
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        
        // Only process if handler is a method (not static resources)
        if (!(handler instanceof HandlerMethod)) {
            return true;
        }
        
        HandlerMethod handlerMethod = (HandlerMethod) handler;
        Method method = handlerMethod.getMethod();
        
        // Check if method has @RequiresPlan annotation
        RequiresPlan requiresPlan = method.getAnnotation(RequiresPlan.class);
        if (requiresPlan == null) {
            return true; // No validation required
        }
        
        // Get current user from authentication
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }
        
        String userId = authentication.getName();
        Optional<User> userOpt = userService.findById(userId);
        
        if (userOpt.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return false;
        }
        
        User user = userOpt.get();
        
        try {
            // Validate feature access
            String feature = requiresPlan.feature();
            
            if (requiresPlan.checkLimit()) {
                // For limit-based features, we need to check current usage
                validateUsageLimit(user, feature);
            } else {
                // For feature-based access, just check if user has the feature
                planValidationService.validateFeatureAccess(user, feature);
            }
            
            logger.debug("Plan validation passed for user {} accessing feature {}", userId, feature);
            return true;
            
        } catch (PlanLimitException e) {
            logger.warn("Plan validation failed for user {} accessing feature {}: {}", 
                       userId, requiresPlan.feature(), e.getMessage());
            
            // Set appropriate response
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write(String.format(
                "{\"error\": \"Plan limit exceeded\", \"message\": \"%s\", \"feature\": \"%s\"}", 
                e.getMessage(), requiresPlan.feature()));
            
            return false;
        }
    }
    
    /**
     * Validate usage limits for countable resources
     */
    private void validateUsageLimit(User user, String feature) {
        switch (feature.toLowerCase()) {
            case "urlcreation":
            case "urls":
                planValidationService.validateUrlLimit(user, user.getMonthlyUrlsCreated());
                break;
                
            case "qrcreation":
            case "qrcodes":
                planValidationService.validateQRLimit(user, user.getMonthlyQrCodesCreated());
                break;
                
            case "fileupload":
            case "files":
                planValidationService.validateFileLimit(user, user.getMonthlyFilesUploaded());
                break;
                
            case "customdomains":
            case "domains":
                // We need to get current domain count from database
                // This will be implemented when we add the validation to domain controller
                break;
                
            case "teammembers":
            case "team":
                // We need to get current team member count from database
                // This will be implemented when we add the validation to team controller
                break;
                
            default:
                // For non-countable features, just check feature access
                planValidationService.validateFeatureAccess(user, feature);
                break;
        }
    }
}