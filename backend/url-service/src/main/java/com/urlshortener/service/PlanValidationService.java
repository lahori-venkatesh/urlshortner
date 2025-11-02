package com.urlshortener.service;

import com.urlshortener.model.PlanPolicy;
import com.urlshortener.model.User;
import com.urlshortener.exception.PlanLimitException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;

/**
 * Centralized Plan Validation Service
 * Mirrors the frontend planPolicy.ts validation logic exactly
 * Handles all plan limits, features, and trial logic
 */
@Service
public class PlanValidationService {
    
    private static final Logger logger = LoggerFactory.getLogger(PlanValidationService.class);
    
    @Autowired
    private UserService userService;
    
    /**
     * Get user's effective plan policy (considering trials)
     */
    public PlanPolicy getUserPlanPolicy(User user) {
        if (user == null || user.getSubscriptionPlan() == null) {
            return PlanPolicy.FREE;
        }
        
        return PlanPolicy.fromString(user.getSubscriptionPlan());
    }
    
    /**
     * Check if user is currently in trial period
     */
    public boolean isUserInTrial(User user) {
        if (user == null || user.getTrialStartDate() == null || user.getTrialEndDate() == null) {
            return false;
        }
        
        LocalDateTime now = LocalDateTime.now();
        return now.isAfter(user.getTrialStartDate()) && now.isBefore(user.getTrialEndDate());
    }
    
    /**
     * Check if user can access a specific feature
     */
    public boolean canAccessFeature(User user, String featureName) {
        PlanPolicy policy = getUserPlanPolicy(user);
        
        // Special case for FREE users with team collaboration trial
        if (policy == PlanPolicy.FREE && "teamcollaboration".equals(featureName.toLowerCase())) {
            return isUserInTrial(user);
        }
        
        return policy.hasFeature(featureName);
    }
    
    /**
     * Check if user can add a custom domain
     */
    public boolean canAddDomain(User user, int currentDomainCount) {
        PlanPolicy policy = getUserPlanPolicy(user);
        return policy.canAddDomain(currentDomainCount);
    }
    
    /**
     * Check if user can add a team member
     */
    public boolean canAddTeamMember(User user, int currentMemberCount) {
        PlanPolicy policy = getUserPlanPolicy(user);
        
        // Special case for FREE users in team trial (max 1 member)
        if (policy == PlanPolicy.FREE && isUserInTrial(user)) {
            return currentMemberCount < 1;
        }
        
        return policy.canAddTeamMember(currentMemberCount);
    }
    
    /**
     * Check if user can create a URL
     */
    public boolean canCreateUrl(User user, int currentUrlCount) {
        PlanPolicy policy = getUserPlanPolicy(user);
        return policy.canCreateUrl(currentUrlCount);
    }
    
    /**
     * Check if user can create a QR code
     */
    public boolean canCreateQR(User user, int currentQRCount) {
        PlanPolicy policy = getUserPlanPolicy(user);
        return policy.canCreateQR(currentQRCount);
    }
    
    /**
     * Check if user can upload a file
     */
    public boolean canUploadFile(User user, int currentFileCount) {
        PlanPolicy policy = getUserPlanPolicy(user);
        return policy.canUploadFile(currentFileCount);
    }
    
    /**
     * Validate feature access and throw exception if not allowed
     */
    public void validateFeatureAccess(User user, String featureName) {
        if (!canAccessFeature(user, featureName)) {
            PlanPolicy policy = getUserPlanPolicy(user);
            String message = policy.getUpgradeReason(featureName, null);
            throw new PlanLimitException(message);
        }
    }
    
    /**
     * Validate domain limit and throw exception if exceeded
     */
    public void validateDomainLimit(User user, int currentDomainCount) {
        if (!canAddDomain(user, currentDomainCount)) {
            PlanPolicy policy = getUserPlanPolicy(user);
            throw new PlanLimitException("Custom Domains", policy.getDisplayName(), 
                                       currentDomainCount, policy.getDomains());
        }
    }
    
    /**
     * Validate team member limit and throw exception if exceeded
     */
    public void validateTeamMemberLimit(User user, int currentMemberCount) {
        if (!canAddTeamMember(user, currentMemberCount)) {
            PlanPolicy policy = getUserPlanPolicy(user);
            int effectiveLimit = (policy == PlanPolicy.FREE && isUserInTrial(user)) ? 1 : policy.getTeamMembers();
            throw new PlanLimitException("Team Members", policy.getDisplayName(), 
                                       currentMemberCount, effectiveLimit);
        }
    }
    
    /**
     * Validate URL creation limit and throw exception if exceeded
     */
    public void validateUrlLimit(User user, int currentUrlCount) {
        if (!canCreateUrl(user, currentUrlCount)) {
            PlanPolicy policy = getUserPlanPolicy(user);
            throw new PlanLimitException("URLs", policy.getDisplayName(), 
                                       currentUrlCount, policy.getUrlsPerMonth());
        }
    }
    
    /**
     * Validate QR code creation limit and throw exception if exceeded
     */
    public void validateQRLimit(User user, int currentQRCount) {
        if (!canCreateQR(user, currentQRCount)) {
            PlanPolicy policy = getUserPlanPolicy(user);
            throw new PlanLimitException("QR Codes", policy.getDisplayName(), 
                                       currentQRCount, policy.getQrCodesPerMonth());
        }
    }
    
    /**
     * Validate file upload limit and throw exception if exceeded
     */
    public void validateFileLimit(User user, int currentFileCount) {
        if (!canUploadFile(user, currentFileCount)) {
            PlanPolicy policy = getUserPlanPolicy(user);
            throw new PlanLimitException("File Uploads", policy.getDisplayName(), 
                                       currentFileCount, policy.getFilesPerMonth());
        }
    }
    
    /**
     * Get upgrade path for user's current plan
     */
    public PlanPolicy getUpgradePath(User user) {
        PlanPolicy policy = getUserPlanPolicy(user);
        return policy.getUpgradePath();
    }
    
    /**
     * Start trial for user (FREE users get team collaboration trial)
     */
    public void startTrial(User user, String trialType) {
        if (user.isHasUsedTrial()) {
            throw new PlanLimitException("Trial already used for this account");
        }
        
        LocalDateTime now = LocalDateTime.now();
        PlanPolicy policy = getUserPlanPolicy(user);
        
        user.setTrialStartDate(now);
        user.setTrialEndDate(now.plusDays(policy.getTrialDays()));
        user.setHasUsedTrial(true);
        
        userService.updateUser(user);
        
        logger.info("Started {} trial for user {}: {} days", trialType, user.getId(), policy.getTrialDays());
    }
    
    /**
     * Check if trial has expired and handle cleanup
     */
    public boolean isTrialExpired(User user) {
        if (user.getTrialEndDate() == null) {
            return false;
        }
        
        boolean expired = LocalDateTime.now().isAfter(user.getTrialEndDate());
        
        if (expired && isUserInTrial(user)) {
            // Clean up expired trial
            handleTrialExpiry(user);
        }
        
        return expired;
    }
    
    /**
     * Handle trial expiry cleanup
     */
    private void handleTrialExpiry(User user) {
        logger.info("Trial expired for user {}, cleaning up", user.getId());
        
        // For FREE users, trial expiry means losing team collaboration access
        // The frontend will handle showing upgrade modals
        
        // Note: We don't automatically downgrade paid trial users here
        // That should be handled by subscription management
    }
}