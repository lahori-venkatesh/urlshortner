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
    public static final String PRO_MONTHLY = "PRO_MONTHLY";
    public static final String PRO_YEARLY = "PRO_YEARLY";
    public static final String BUSINESS_MONTHLY = "BUSINESS_MONTHLY";
    public static final String BUSINESS_YEARLY = "BUSINESS_YEARLY";
    
    // Usage limits - New Structure
    // Free Plan: 75 URLs, 30 QR codes, 5 files per month
    public static final int FREE_MONTHLY_URLS = 75;
    public static final int FREE_MONTHLY_QR_CODES = 30;
    public static final int FREE_MONTHLY_FILES = 5;
    
    // Pro Plan: Unlimited URLs/QR, 50 files per month
    public static final int PRO_MONTHLY_FILES = 50;
    
    // Business Plan: Unlimited URLs/QR, 200 files per month
    public static final int BUSINESS_MONTHLY_FILES = 200;
    
    // File size limits
    public static final long FREE_FILE_SIZE_MB = 5;
    public static final long PRO_FILE_SIZE_MB = 100;
    public static final long BUSINESS_FILE_SIZE_MB = 500;
    
    /**
     * Check if user has premium access (Pro or Business)
     */
    public boolean hasPremiumAccess(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return false;
        
        User user = userOpt.get();
        String plan = user.getSubscriptionPlan();
        
        // Check if premium subscription is active
        if ((PRO_MONTHLY.equals(plan) || PRO_YEARLY.equals(plan) || 
             BUSINESS_MONTHLY.equals(plan) || BUSINESS_YEARLY.equals(plan)) && 
            user.getSubscriptionExpiry() != null && 
            user.getSubscriptionExpiry().isAfter(LocalDateTime.now())) {
            return true;
        }
        
        // Check if user is in trial period
        return isInTrialPeriod(user);
    }
    
    /**
     * Check if user has business plan access
     */
    public boolean hasBusinessAccess(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return false;
        
        User user = userOpt.get();
        String plan = user.getSubscriptionPlan();
        
        return (BUSINESS_MONTHLY.equals(plan) || BUSINESS_YEARLY.equals(plan)) && 
               user.getSubscriptionExpiry() != null && 
               user.getSubscriptionExpiry().isAfter(LocalDateTime.now());
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
     * Check if user can create more URLs
     */
    public boolean canCreateUrl(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return false;
        
        User user = userOpt.get();
        
        // Reset counters if needed
        resetMonthlyUsageIfNeeded(user);
        
        // Check limits based on plan
        String plan = user.getSubscriptionPlan();
        
        // Pro and Business plans have unlimited URLs
        if (hasPremiumAccess(userId) || isInTrialPeriod(user)) {
            return true;
        } else {
            // Free plan: check monthly limit (75 URLs per month)
            return user.getMonthlyUrlsCreated() < FREE_MONTHLY_URLS;
        }
    }
    
    /**
     * Check if user can create more QR codes
     */
    public boolean canCreateQrCode(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return false;
        
        User user = userOpt.get();
        
        // Reset counters if needed
        resetMonthlyUsageIfNeeded(user);
        
        // Check limits based on plan
        String plan = user.getSubscriptionPlan();
        
        // Pro and Business plans have unlimited QR codes
        if (hasPremiumAccess(userId) || isInTrialPeriod(user)) {
            return true;
        } else {
            // Free plan: check monthly limit (30 QR codes per month)
            return user.getMonthlyQrCodesCreated() < FREE_MONTHLY_QR_CODES;
        }
    }
    
    /**
     * Check if user can upload more files
     */
    public boolean canUploadFile(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return false;
        
        User user = userOpt.get();
        
        // Reset counters if needed
        resetMonthlyUsageIfNeeded(user);
        
        // Check limits based on plan
        String plan = user.getSubscriptionPlan();
        
        if (hasBusinessAccess(userId)) {
            // Business plan: 200 files per month
            return user.getMonthlyFilesUploaded() < BUSINESS_MONTHLY_FILES;
        } else if (hasPremiumAccess(userId) || isInTrialPeriod(user)) {
            // Pro plan: 50 files per month
            return user.getMonthlyFilesUploaded() < PRO_MONTHLY_FILES;
        } else {
            // Free plan: 5 files per month
            return user.getMonthlyFilesUploaded() < FREE_MONTHLY_FILES;
        }
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
        if (hasBusinessAccess(userId)) {
            return BUSINESS_FILE_SIZE_MB; // 500MB for Business
        } else if (hasPremiumAccess(userId)) {
            return PRO_FILE_SIZE_MB; // 100MB for Pro
        } else {
            return FREE_FILE_SIZE_MB; // 5MB for Free
        }
    }
    
    /**
     * Increment URL usage for user
     */
    public void incrementUrlUsage(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return;
        
        User user = userOpt.get();
        resetDailyUsageIfNeeded(user);
        resetMonthlyUsageIfNeeded(user);
        
        user.setDailyUrlsCreated(user.getDailyUrlsCreated() + 1);
        user.setMonthlyUrlsCreated(user.getMonthlyUrlsCreated() + 1);
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
        resetMonthlyUsageIfNeeded(user);
        
        user.setDailyQrCodesCreated(user.getDailyQrCodesCreated() + 1);
        user.setMonthlyQrCodesCreated(user.getMonthlyQrCodesCreated() + 1);
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
        resetMonthlyUsageIfNeeded(user);
        
        user.setDailyFilesUploaded(user.getDailyFilesUploaded() + 1);
        user.setMonthlyFilesUploaded(user.getMonthlyFilesUploaded() + 1);
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
     * Reset monthly usage counters if 30 days have passed
     */
    private void resetMonthlyUsageIfNeeded(User user) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime lastMonthlyReset = user.getLastMonthlyReset();
        
        if (lastMonthlyReset == null || ChronoUnit.DAYS.between(lastMonthlyReset, now) >= 30) {
            user.setMonthlyUrlsCreated(0);
            user.setMonthlyQrCodesCreated(0);
            user.setMonthlyFilesUploaded(0);
            user.setLastMonthlyReset(now);
            userRepository.save(user);
            logger.info("Reset monthly usage for user: {}", user.getId());
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
        if (PRO_MONTHLY.equals(planType) || BUSINESS_MONTHLY.equals(planType)) {
            expiry = LocalDateTime.now().plusMonths(1);
        } else if (PRO_YEARLY.equals(planType) || BUSINESS_YEARLY.equals(planType)) {
            expiry = LocalDateTime.now().plusYears(1);
        }
        // No lifetime plans in new structure
        
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
        int monthlyLimit;
        
        // Pro and Business plans have unlimited URLs
        if ((PRO_MONTHLY.equals(plan) || PRO_YEARLY.equals(plan) || 
             BUSINESS_MONTHLY.equals(plan) || BUSINESS_YEARLY.equals(plan)) && 
            user.getSubscriptionExpiry() != null && 
            user.getSubscriptionExpiry().isAfter(LocalDateTime.now())) {
            return -1; // Unlimited
        } else if (isInTrialPeriod(user)) {
            return -1; // Unlimited during trial
        } else {
            monthlyLimit = FREE_MONTHLY_URLS;
        }
        
        return Math.max(0, monthlyLimit - user.getMonthlyUrlsCreated());
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
        int monthlyLimit;
        
        // Pro and Business plans have unlimited QR codes
        if ((PRO_MONTHLY.equals(plan) || PRO_YEARLY.equals(plan) || 
             BUSINESS_MONTHLY.equals(plan) || BUSINESS_YEARLY.equals(plan)) && 
            user.getSubscriptionExpiry() != null && 
            user.getSubscriptionExpiry().isAfter(LocalDateTime.now())) {
            return -1; // Unlimited
        } else if (isInTrialPeriod(user)) {
            return -1; // Unlimited during trial
        } else {
            monthlyLimit = FREE_MONTHLY_QR_CODES;
        }
        
        return Math.max(0, monthlyLimit - user.getMonthlyQrCodesCreated());
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
        int monthlyLimit;
        
        // Check plan type and set appropriate file limits
        if ((PRO_MONTHLY.equals(plan) || PRO_YEARLY.equals(plan)) && 
            user.getSubscriptionExpiry() != null && 
            user.getSubscriptionExpiry().isAfter(LocalDateTime.now())) {
            monthlyLimit = PRO_MONTHLY_FILES; // 50 files per month
        } else if ((BUSINESS_MONTHLY.equals(plan) || BUSINESS_YEARLY.equals(plan)) && 
                   user.getSubscriptionExpiry() != null && 
                   user.getSubscriptionExpiry().isAfter(LocalDateTime.now())) {
            monthlyLimit = BUSINESS_MONTHLY_FILES; // 200 files per month
        } else if (isInTrialPeriod(user)) {
            monthlyLimit = PRO_MONTHLY_FILES; // Trial gets Pro limits
        } else {
            monthlyLimit = FREE_MONTHLY_FILES; // 5 files per month
        }
        
        return Math.max(0, monthlyLimit - user.getMonthlyFilesUploaded());
    }
    
    /**
     * Get remaining monthly URLs for free user
     */
    public int getRemainingMonthlyUrls(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return 0;
        
        User user = userOpt.get();
        resetMonthlyUsageIfNeeded(user);
        
        if (hasPremiumAccess(userId)) return -1; // Unlimited for premium
        
        return Math.max(0, FREE_MONTHLY_URLS - user.getMonthlyUrlsCreated());
    }
    
    /**
     * Get remaining monthly QR codes for free user
     */
    public int getRemainingMonthlyQrCodes(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return 0;
        
        User user = userOpt.get();
        resetMonthlyUsageIfNeeded(user);
        
        if (hasPremiumAccess(userId)) return -1; // Unlimited for premium
        
        return Math.max(0, FREE_MONTHLY_QR_CODES - user.getMonthlyQrCodesCreated());
    }
    
    /**
     * Get remaining monthly files for free user
     */
    public int getRemainingMonthlyFiles(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) return 0;
        
        User user = userOpt.get();
        resetMonthlyUsageIfNeeded(user);
        
        if (hasPremiumAccess(userId)) return -1; // Unlimited for premium
        
        return Math.max(0, FREE_MONTHLY_FILES - user.getMonthlyFilesUploaded());
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
        info.setRemainingMonthlyUrls(getRemainingMonthlyUrls(userId));
        info.setRemainingMonthlyQrCodes(getRemainingMonthlyQrCodes(userId));
        info.setRemainingMonthlyFiles(getRemainingMonthlyFiles(userId));
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
        private int remainingMonthlyUrls;
        private int remainingMonthlyQrCodes;
        private int remainingMonthlyFiles;
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
        
        public int getRemainingMonthlyUrls() { return remainingMonthlyUrls; }
        public void setRemainingMonthlyUrls(int remainingMonthlyUrls) { this.remainingMonthlyUrls = remainingMonthlyUrls; }
        
        public int getRemainingMonthlyQrCodes() { return remainingMonthlyQrCodes; }
        public void setRemainingMonthlyQrCodes(int remainingMonthlyQrCodes) { this.remainingMonthlyQrCodes = remainingMonthlyQrCodes; }
        
        public int getRemainingMonthlyFiles() { return remainingMonthlyFiles; }
        public void setRemainingMonthlyFiles(int remainingMonthlyFiles) { this.remainingMonthlyFiles = remainingMonthlyFiles; }
        
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
        if (FREE_PLAN.equals(currentPlan)) {
            return false; // Nothing to cancel for free users
        }
        
        // Mark subscription as cancelled but keep access until expiry
        user.setSubscriptionCancelled(true);
        user.setUpdatedAt(LocalDateTime.now());
        
        userRepository.save(user);
        logger.info("Cancelled subscription for user: {}", userId);
        return true;
    }
}