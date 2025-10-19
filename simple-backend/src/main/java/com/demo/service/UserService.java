package com.demo.service;

import com.demo.model.User;
import com.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private BCryptPasswordEncoder passwordEncoder;
    
    /**
     * Register a new user
     */
    public User registerUser(String email, String name, String password) {
        // Check if email already exists
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already exists");
        }
        
        // Create new user
        User user = new User();
        user.setEmail(email);
        user.setName(name);
        user.setPassword(passwordEncoder.encode(password));
        user.setApiKey(generateApiKey());
        
        // Set default limits for free tier
        user.setSubscriptionPlan("FREE");
        user.setMaxUrls(100);
        user.setMaxClicksPerMonth(10000);
        user.setMaxApiCallsPerMonth(1000);
        
        return userRepository.save(user);
    }
    
    /**
     * Authenticate user login
     */
    public User authenticateUser(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        User user = userOpt.get();
        
        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }
        
        if (!user.isActive()) {
            throw new RuntimeException("Account is deactivated");
        }
        
        // Update last login time
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);
        
        return user;
    }
    
    /**
     * Find user by email
     */
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    /**
     * Find user by ID
     */
    public Optional<User> findById(String id) {
        return userRepository.findById(id);
    }
    
    /**
     * Update user profile
     */
    public User updateUser(User user) {
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }
    
    /**
     * Change user password
     */
    public void changePassword(String userId, String oldPassword, String newPassword) {
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        User user = userOpt.get();
        
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }
    
    /**
     * Update user subscription
     */
    public User updateSubscription(String userId, String subscriptionPlan) {
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        User user = userOpt.get();
        user.setSubscriptionPlan(subscriptionPlan);
        user.setSubscriptionExpiry(LocalDateTime.now().plusYears(1));
        
        // Update limits based on plan
        switch (subscriptionPlan) {
            case "PRO":
                user.setMaxUrls(10000);
                user.setMaxClicksPerMonth(100000);
                user.setMaxApiCallsPerMonth(10000);
                user.setCanUseCustomDomains(true);
                user.setCanUsePasswordProtection(true);
                user.setCanUseAnalytics(true);
                user.setCanUseFileUploads(true);
                break;
            case "ENTERPRISE":
                user.setMaxUrls(1000000);
                user.setMaxClicksPerMonth(10000000);
                user.setMaxApiCallsPerMonth(1000000);
                user.setCanUseCustomDomains(true);
                user.setCanUsePasswordProtection(true);
                user.setCanUseAnalytics(true);
                user.setCanUseFileUploads(true);
                user.setCanUseBulkOperations(true);
                break;
            default: // FREE
                user.setMaxUrls(100);
                user.setMaxClicksPerMonth(10000);
                user.setMaxApiCallsPerMonth(1000);
                user.setCanUseCustomDomains(false);
                user.setCanUsePasswordProtection(false);
                user.setCanUseAnalytics(false);
                user.setCanUseFileUploads(false);
                user.setCanUseBulkOperations(false);
        }
        
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }
    
    /**
     * Get user statistics
     */
    public UserStats getUserStats(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        User user = userOpt.get();
        
        UserStats stats = new UserStats();
        stats.setTotalUsers(userRepository.count());
        stats.setActiveUsers(userRepository.findActiveUsers().size());
        stats.setFreeUsers(userRepository.countBySubscriptionPlan("FREE"));
        stats.setProUsers(userRepository.countBySubscriptionPlan("PRO"));
        stats.setEnterpriseUsers(userRepository.countBySubscriptionPlan("ENTERPRISE"));
        
        return stats;
    }
    
    /**
     * Deactivate user account
     */
    public void deactivateUser(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setActive(false);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        }
    }
    
    // Helper methods
    private String generateApiKey() {
        return "pk_" + UUID.randomUUID().toString().replace("-", "");
    }
    
    // Statistics DTO
    public static class UserStats {
        private long totalUsers;
        private long activeUsers;
        private long freeUsers;
        private long proUsers;
        private long enterpriseUsers;
        
        // Getters and setters
        public long getTotalUsers() { return totalUsers; }
        public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
        
        public long getActiveUsers() { return activeUsers; }
        public void setActiveUsers(long activeUsers) { this.activeUsers = activeUsers; }
        
        public long getFreeUsers() { return freeUsers; }
        public void setFreeUsers(long freeUsers) { this.freeUsers = freeUsers; }
        
        public long getProUsers() { return proUsers; }
        public void setProUsers(long proUsers) { this.proUsers = proUsers; }
        
        public long getEnterpriseUsers() { return enterpriseUsers; }
        public void setEnterpriseUsers(long enterpriseUsers) { this.enterpriseUsers = enterpriseUsers; }
    }
}