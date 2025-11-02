package com.urlshortener.aspect;

import com.urlshortener.annotation.RequiresPlan;
import com.urlshortener.model.User;
import com.urlshortener.service.PlanValidationService;
import com.urlshortener.service.UserService;
import com.urlshortener.exception.PlanLimitException;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Optional;

/**
 * Aspect that validates plan access using @RequiresPlan annotation
 * Alternative to interceptor approach - provides more flexibility
 */
@Aspect
@Component
public class PlanValidationAspect {
    
    private static final Logger logger = LoggerFactory.getLogger(PlanValidationAspect.class);
    
    @Autowired
    private PlanValidationService planValidationService;
    
    @Autowired
    private UserService userService;
    
    @Around("@annotation(requiresPlan)")
    public Object validatePlanAccess(ProceedingJoinPoint joinPoint, RequiresPlan requiresPlan) throws Throwable {
        
        // Get current user from authentication
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new PlanLimitException("Authentication required");
        }
        
        String userId = authentication.getName();
        Optional<User> userOpt = userService.findById(userId);
        
        if (userOpt.isEmpty()) {
            throw new PlanLimitException("User not found");
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
            
            // Proceed with the original method
            return joinPoint.proceed();
            
        } catch (PlanLimitException e) {
            logger.warn("Plan validation failed for user {} accessing feature {}: {}", 
                       userId, requiresPlan.feature(), e.getMessage());
            throw e;
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
                // Domain count validation will be handled in the controller method itself
                // since we need to query the database for current count
                planValidationService.validateFeatureAccess(user, "customDomain");
                break;
                
            case "teammembers":
            case "team":
                // Team member count validation will be handled in the controller method itself
                // since we need to query the database for current count
                planValidationService.validateFeatureAccess(user, "teamCollaboration");
                break;
                
            default:
                // For non-countable features, just check feature access
                planValidationService.validateFeatureAccess(user, feature);
                break;
        }
    }
}