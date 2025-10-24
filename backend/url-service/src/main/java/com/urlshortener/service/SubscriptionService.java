package com.urlshortener.service;

import com.urlshortener.model.User;
import com.urlshortener.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@Service
public class SubscriptionService {
    
    private static final Logger logger = LoggerFactory.getLogger(SubscriptionService.class);
    
    @Autowired
    private UserRepository userRepository;
    
    // Plan constants
    public static final String FREE_PLAN = "FREE";
    public static final String PREMIUM_MONTHLY = "PREMIUM_MONTHLY";
    public static final String PREMIUM_YEARLY = "PREMIUM_YEARLY";
    public static final String LIFETIME = "LIFETIME";
    
    // Usage limits - Updated
    public static final int FREE_DAILY_URLS = 5;
    public static final int FREE_DAILY_QR_CODES = 3;
    public static final int FREE_DAILY_FILES = 1;
    public static final int MONTHLY_DAILY_URLS = 100;
    public static final int MONTHLY_DAILY_QR_CODES = 60;
    public static final int MONTHLY_DAILY_FILES = 10;
    public static final long FREE_FILE_SIZE_MB = 5;
    public static final long PREMIUM_FILE_SIZE_MB = 500;
    public static final int FREE_DATA_RETENTION_DAYS = 7;
    
    /**
     * Check if user has premium access
     */
    public boolean hasPremiumAccess(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return false;
        
        User user = userOpt.get();
        String plan = user.getSubscriptionPlan();
        
        // Lifetime plan always has access
        if (LIFETIME.equals(plan)) {
            return true;
        }
        
        // Check if premium subscription is active
        if ((PREMIUM_MONTHLY.equals(plan) || PREMIUM_YEARLY.equals(plan)) && 
            user.getSubscriptionExpiry() != null && 
            user.getSubscriptionExpiry().isAfter(LocalDateTime.now())) {
            return true;
        }
        
        // Check if user is in trial period
        return isInTrialPeriod(user);
    }
    
    /**
     * Check if user is in trial period
     */
    public boolean isInTrialPeriod(User user) {
        if (user.getTrialStartDate() != null && user.getTrialEndDate() != null) {
            LocalDateTime now = LocalDateTime.now();
            return now.isAfter(user.getTrialStartDate()) && now.isBefore(user.getTrialEndDate());
        }
        return false;
    }
    
    /**
     * Check if user can create more URLs today
     */
    public boolean canCreateUrl(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return false;
        
        User user = userOpt.get();
        
        // Reset daily counter if needed
        resetDailyUsageIfNeeded(user);
        
        // Check limits based on plan
        String plan = user.getSubscriptionPlan();
        int dailyLimit;
        
        if (LIFETIME.equals(plan) || 
            (PREMIUM_YEARLY.equals(plan) && user.getSubscriptionExpiry() != null && 
             user.getSubscriptionExpiry().isAfter(LocalDateTime.now()))) {
            return true; // Unlimited for yearly and lifetime
        } else if (PREMIUM_MONTHLY.equals(plan) && user.getSubscriptionExpiry() != null && 
                   user.getSubscriptionExpiry().isAfter(LocalDateTime.now())) {
            dailyLimit = MONTHLY_DAILY_URLS;
        } else if (isInTrialPeriod(user)) {
            return true; // Unlimited during trial
        } else {
            dailyLimit = FREE_DAILY_URLS;
        }
        
        return user.getDailyUrlsCreated() < dailyLimit;
    }
    
    /**
     * Check if user can create more QR codes today
     */
    public boolean canCreateQrCode(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return false;
        
        User user = userOpt.get();
        
        // Reset daily counter if needed
        resetDailyUsageIfNeeded(user);
        
        // Check limits based on plan
        String plan = user.getSubscriptionPlan();
        int dailyLimit;
        
        if (LIFETIME.equals(plan) || 
            (PREMIUM_YEARLY.equals(plan) && user.getSubscriptionExpiry() != null && 
             user.getSubscriptionExpiry().isAfter(LocalDateTime.now()))) {
            return true; // Unlimited for yearly and lifetime
        } else if (PREMIUM_MONTHLY.equals(plan) && user.getSubscriptionExpiry() != null && 
                   user.getSubscriptionExpiry().isAfter(LocalDateTime.now())) {
            dailyLimit = MONTHLY_DAILY_QR_CODES;
        } else if (isInTrialPeriod(user)) {
            return true; // Unlimited during trial
        } else {
            dailyLimit = FREE_DAILY_QR_CODES;
        }
        
        return user.getDailyQrCodesCreated() < dailyLimit;
    }
    
    /**
     * Check if user can upload more files today
     */
    public boolean canUploadFile(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return false;
        
        User user = userOpt.get();
        
        // Reset daily counter if needed
        resetDailyUsageIfNeeded(user);
        
        // Check limits based on plan
        String plan = user.getSubscriptionPlan();
        int dailyLimit;
        
        if (LIFETIME.equals(plan) || 
            (PREMIUM_YEARLY.equals(plan) && user.getSubscriptionExpiry() != null && 
             user.getSubscriptionExpiry().isAfter(LocalDateTime.now()))) {
            return true; // Unlimited for yearly and lifetime
        } else if (PREMIUM_MONTHLY.equals(plan) && user.getSubscriptionExpiry() != null && 
                   user.getSubscriptionExpiry().isAfter(LocalDateTime.now())) {
            dailyLimit = MONTHLY_DAILY_FILES;
        } else if (isInTrialPeriod(user)) {
            return true; // Unlimited during trial
        } else {
            dailyLimit = FREE_DAILY_FILES;
        }
        
        return user.getDailyFilesUploaded() < dailyLimit;
    }
    
    /**
     * Check if user can use custom alias
     */
    public boolean canUseCustomAlias(String userId) {
        return hasPremiumAccess(userId);
    }
    
    /**
     * Check if user can use password protection
     */
    public boolean canUsePasswordProtection(String userId) {
        return hasPremiumAccess(userId);
    }
    
    /**
     * Check if user can set expiration dates
     */
    public boolean canSetExpiration(String userId) {
        return hasPremiumAccess(userId);
    }
    
    /**
     * Check if user can use custom domains
     */
    public boolean canUseCustomDomain(String userId) {
        return hasPremiumAccess(userId);
    }
    
    /**
     * Check if user can access detailed analytics
     */
    public boolean canAccessDetailedAnalytics(String userId) {
        return hasPremiumAccess(userId);
    }
    
    /**
     * Check if user can customize QR codes (colors, logos)
     */
    public boolean canCustomizeQrCodes(String userId) {
        return hasPremiumAccess(userId);
    }
    
    /**
     * Get maximum file size for user
     */
    public long getMaxFileSizeMB(String userId) {
        return hasPremiumAccess(userId) ? PREMIUM_FILE_SIZE_MB : FREE_FILE_SIZE_MB;
    }
    
    /**
     * Increment URL usage for user
     */
    public void incrementUrlUsage(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return;
        
        User user = userOpt.get();
        resetDailyUsageIfNeeded(user);
        
        user.setDailyUrlsCreated(user.getDailyUrlsCreated() + 1);
        user.setTotalUrls(user.getTotalUrls() + 1);
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        logger.info("Incremented URL usage for user: {}", userId);
    }
    
    /**
     * Increment QR code usage for user
     */
    public void incrementQrCodeUsage(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return;
        
        User user = userOpt.get();
        resetDailyUsageIfNeeded(user);
        
        user.setDailyQrCodesCreated(user.getDailyQrCodesCreated() + 1);
        user.setTotalQrCodes(user.getTotalQrCodes() + 1);
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        logger.info("Incremented QR code usage for user: {}", userId);
    }
    
    /**
     * Increment file upload usage for user
     */
    public void incrementFileUsage(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return;
        
        User user = userOpt.get();
        resetDailyUsageIfNeeded(user);
        
        user.setDailyFilesUploaded(user.getDailyFilesUploaded() + 1);
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        logger.info("Incremented file usage for user: {}", userId);
    }
    
    /**
     * Reset daily usage counters if 24 hours have passed
     */
    private void resetDailyUsageIfNeeded(User user) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastReset = user.getLastUsageReset();
        
        if (lastReset == null || ChronoUnit.HOURS.between(lastReset, now) >= 24) {
            user.setDailyUrlsCreated(0);
            user.setDailyQrCodesCreated(0);
            user.setDailyFilesUploaded(0);
            user.setLastUsageReset(now);
            userRepository.save(user);
            logger.info("Reset daily usage for user: {}", user.getId());
        }
    }
    
    /**
     * Upgrade user to premium plan
     */
    public void upgradeToPremium(String userId, String planType, String subscriptionId, String customerId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return;
        
        User user = userOpt.get();
        user.setSubscriptionPlan(planType);
        user.setSubscriptionId(subscriptionId);
        user.setCustomerId(customerId);
        
        // Set expiry date based on plan
        LocalDateTime expiry = null;
        if (PREMIUM_MONTHLY.equals(planType)) {
            expiry = LocalDateTime.now().plusMonths(1);
        } else if (PREMIUM_YEARLY.equals(planType)) {
            expiry = LocalDateTime.now().plusYears(1);
        }
        // LIFETIME plan doesn't need expiry
        
        user.setSubscriptionExpiry(expiry);
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        logger.info("Upgraded user {} to plan: {}", userId, planType);
    }
    
    /**
     * Start trial for eligible user
     */
    public boolean startTrial(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return false;
        
        User user = userOpt.get();
        
        // Check if user is eligible for trial
        if (user.isHasUsedTrial() || !isEligibleForTrial(user)) {
            return false;
        }
        
        LocalDateTime now = LocalDateTime.now();
        user.setTrialStartDate(now);
        user.setTrialEndDate(now.plusDays(1)); // 1-day trial
        user.setHasUsedTrial(true);
        user.setUpdatedAt(now);
        
        userRepository.save(user);
        logger.info("Started trial for user: {}", userId);
        return true;
    }
    
    /**
     * Check if user is eligible for trial
     */
    public boolean isEligibleForTrial(User user) {
        // Eligible if: 7 consecutive login days OR 20+ links shared
        return user.getConsecutiveLoginDays() >= 7 || user.getTotalLinksShared() >= 20;
    }
    
    /**
     * Get remaining daily URLs for user
     */
    public int getRemainingDailyUrls(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return 0;
        
        User user = userOpt.get();
        resetDailyUsageIfNeeded(user);
        
        String plan = user.getSubscriptionPlan();
        int dailyLimit;
        
        if (LIFETIME.equals(plan) || 
            (PREMIUM_YEARLY.equals(plan) && user.getSubscriptionExpiry() != null && 
             user.getSubscriptionExpiry().isAfter(LocalDateTime.now())) ||
            isInTrialPeriod(user)) {
            return -1; // Unlimited
        } else if (PREMIUM_MONTHLY.equals(plan) && user.getSubscriptionExpiry() != null && 
                   user.getSubscriptionExpiry().isAfter(LocalDateTime.now())) {
            dailyLimit = MONTHLY_DAILY_URLS;
        } else {
            dailyLimit = FREE_DAILY_URLS;
        }
        
        return Math.max(0, dailyLimit - user.getDailyUrlsCreated());
    }
    
    /**
     * Get remaining daily QR codes for user
     */
    public int getRemainingDailyQrCodes(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return 0;
        
        User user = userOpt.get();
        resetDailyUsageIfNeeded(user);
        
        String plan = user.getSubscriptionPlan();
        int dailyLimit;
        
        if (LIFETIME.equals(plan) || 
            (PREMIUM_YEARLY.equals(plan) && user.getSubscriptionExpiry() != null && 
             user.getSubscriptionExpiry().isAfter(LocalDateTime.now())) ||
            isInTrialPeriod(user)) {
            return -1; // Unlimited
        } else if (PREMIUM_MONTHLY.equals(plan) && user.getSubscriptionExpiry() != null && 
                   user.getSubscriptionExpiry().isAfter(LocalDateTime.now())) {
            dailyLimit = MONTHLY_DAILY_QR_CODES;
        } else {
            dailyLimit = FREE_DAILY_QR_CODES;
        }
        
        return Math.max(0, dailyLimit - user.getDailyQrCodesCreated());
    }
    
    /**
     * Get remaining daily files for user
     */
    public int getRemainingDailyFiles(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return 0;
        
        User user = userOpt.get();
        resetDailyUsageIfNeeded(user);
        
        String plan = user.getSubscriptionPlan();
        int dailyLimit;
        
        if (LIFETIME.equals(plan) || 
            (PREMIUM_YEARLY.equals(plan) && user.getSubscriptionExpiry() != null && 
             user.getSubscriptionExpiry().isAfter(LocalDateTime.now())) ||
            isInTrialPeriod(user)) {
            return -1; // Unlimited
        } else if (PREMIUM_MONTHLY.equals(plan) && user.getSubscriptionExpiry() != null && 
                   user.getSubscriptionExpiry().isAfter(LocalDateTime.now())) {
            dailyLimit = MONTHLY_DAILY_FILES;
        } else {
            dailyLimit = FREE_DAILY_FILES;
        }
        
        return Math.max(0, dailyLimit - user.getDailyFilesUploaded());
    }
    
    /**
     * Get user's current plan info
     */
    public UserPlanInfo getUserPlanInfo(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return new UserPlanInfo();
        
        User user = userOpt.get();
        resetDailyUsageIfNeeded(user);
        
        UserPlanInfo info = new UserPlanInfo();
        info.setPlan(user.getSubscriptionPlan());
        info.setHasPremiumAccess(hasPremiumAccess(userId));
        info.setInTrial(isInTrialPeriod(user));
        info.setTrialEligible(!user.isHasUsedTrial() && isEligibleForTrial(user));
        info.setSubscriptionExpiry(user.getSubscriptionExpiry());
        info.setRemainingDailyUrls(getRemainingDailyUrls(userId));
        info.setRemainingDailyQrCodes(getRemainingDailyQrCodes(userId));
        info.setRemainingDailyFiles(getRemainingDailyFiles(userId));
        info.setMaxFileSizeMB(getMaxFileSizeMB(userId));
        
        return info;
    }
    
    /**
     * Inner class for plan information
     */
    public static class UserPlanInfo {
        private String plan;
        private boolean hasPremiumAccess;
        private boolean inTrial;
        private boolean trialEligible;
        private LocalDateTime subscriptionExpiry;
        private int remainingDailyUrls;
        private int remainingDailyQrCodes;
        private int remainingDailyFiles;
        private long maxFileSizeMB;
        
        // Getters and setters
        public String getPlan() { return plan; }
        public void setPlan(String plan) { this.plan = plan; }
        
        public boolean isHasPremiumAccess() { return hasPremiumAccess; }
        public void setHasPremiumAccess(boolean hasPremiumAccess) { this.hasPremiumAccess = hasPremiumAccess; }
        
        public boolean isInTrial() { return inTrial; }
        public void setInTrial(boolean inTrial) { this.inTrial = inTrial; }
        
        public boolean isTrialEligible() { return trialEligible; }
        public void setTrialEligible(boolean trialEligible) { this.trialEligible = trialEligible; }
        
        public LocalDateTime getSubscriptionExpiry() { return subscriptionExpiry; }
        public void setSubscriptionExpiry(LocalDateTime subscriptionExpiry) { this.subscriptionExpiry = subscriptionExpiry; }
        
        public int getRemainingDailyUrls() { return remainingDailyUrls; }
        public void setRemainingDailyUrls(int remainingDailyUrls) { this.remainingDailyUrls = remainingDailyUrls; }
        
        public int getRemainingDailyQrCodes() { return remainingDailyQrCodes; }
        public void setRemainingDailyQrCodes(int remainingDailyQrCodes) { this.remainingDailyQrCodes = remainingDailyQrCodes; }
        
        public int getRemainingDailyFiles() { return remainingDailyFiles; }
        public void setRemainingDailyFiles(int remainingDailyFiles) { this.remainingDailyFiles = remainingDailyFiles; }
        
        public long getMaxFileSizeMB() { return maxFileSizeMB; }
        public void setMaxFileSizeMB(long maxFileSizeMB) { this.maxFileSizeMB = maxFileSizeMB; }
    }
    
    /**
     * Cancel user subscription
     */
    public boolean cancelSubscription(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return false;
        
        User user = userOpt.get();
        String currentPlan = user.getSubscriptionPlan();
        
        // Check if user has an active subscription to cancel
        if (FREE_PLAN.equals(currentPlan) || LIFETIME.equals(currentPlan)) {
            return false; // Nothing to cancel
        }
        
        // Mark subscription as cancelled but keep access until expiry
        user.setSubscriptionCancelled(true);
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        logger.info("Cancelled subscription for user: {}", userId);
        return true;
    }
}