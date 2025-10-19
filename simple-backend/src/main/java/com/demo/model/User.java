package com.demo.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.Set;

@Document(collection = "users")
public class User {
    
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String email;
    
    private String name;
    private String password; // Hashed password
    
    // OAuth information
    private String googleId;
    private String profilePicture;
    
    // Subscription and limits
    private String subscriptionPlan = "FREE"; // FREE, PRO, ENTERPRISE
    private LocalDateTime subscriptionExpiry;
    private boolean isActive = true;
    
    // Usage limits
    private int urlsCreated = 0;
    private int maxUrls = 100;
    private int maxClicksPerMonth = 10000;
    private int clicksThisMonth = 0;
    
    // Features access
    private boolean canUseCustomDomains = false;
    private boolean canUsePasswordProtection = false;
    private boolean canUseAnalytics = false;
    private boolean canUseFileUploads = false;
    private boolean canUseBulkOperations = false;
    
    // API access
    private String apiKey;
    private int apiCallsThisMonth = 0;
    private int maxApiCallsPerMonth = 1000;
    
    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLoginAt;
    
    // Preferences
    private String defaultDomain;
    private boolean emailNotifications = true;
    private String timezone = "UTC";
    
    // Security
    private Set<String> allowedIpAddresses;
    private boolean twoFactorEnabled = false;
    private String twoFactorSecret;
    
    // Constructors
    public User() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public User(String email, String name, String password) {
        this();
        this.email = email;
        this.name = name;
        this.password = password;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getGoogleId() { return googleId; }
    public void setGoogleId(String googleId) { this.googleId = googleId; }
    
    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
    
    public String getSubscriptionPlan() { return subscriptionPlan; }
    public void setSubscriptionPlan(String subscriptionPlan) { this.subscriptionPlan = subscriptionPlan; }
    
    public LocalDateTime getSubscriptionExpiry() { return subscriptionExpiry; }
    public void setSubscriptionExpiry(LocalDateTime subscriptionExpiry) { this.subscriptionExpiry = subscriptionExpiry; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public int getUrlsCreated() { return urlsCreated; }
    public void setUrlsCreated(int urlsCreated) { this.urlsCreated = urlsCreated; }
    
    public int getMaxUrls() { return maxUrls; }
    public void setMaxUrls(int maxUrls) { this.maxUrls = maxUrls; }
    
    public int getMaxClicksPerMonth() { return maxClicksPerMonth; }
    public void setMaxClicksPerMonth(int maxClicksPerMonth) { this.maxClicksPerMonth = maxClicksPerMonth; }
    
    public int getClicksThisMonth() { return clicksThisMonth; }
    public void setClicksThisMonth(int clicksThisMonth) { this.clicksThisMonth = clicksThisMonth; }
    
    public boolean isCanUseCustomDomains() { return canUseCustomDomains; }
    public void setCanUseCustomDomains(boolean canUseCustomDomains) { this.canUseCustomDomains = canUseCustomDomains; }
    
    public boolean isCanUsePasswordProtection() { return canUsePasswordProtection; }
    public void setCanUsePasswordProtection(boolean canUsePasswordProtection) { this.canUsePasswordProtection = canUsePasswordProtection; }
    
    public boolean isCanUseAnalytics() { return canUseAnalytics; }
    public void setCanUseAnalytics(boolean canUseAnalytics) { this.canUseAnalytics = canUseAnalytics; }
    
    public boolean isCanUseFileUploads() { return canUseFileUploads; }
    public void setCanUseFileUploads(boolean canUseFileUploads) { this.canUseFileUploads = canUseFileUploads; }
    
    public boolean isCanUseBulkOperations() { return canUseBulkOperations; }
    public void setCanUseBulkOperations(boolean canUseBulkOperations) { this.canUseBulkOperations = canUseBulkOperations; }
    
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    
    public int getApiCallsThisMonth() { return apiCallsThisMonth; }
    public void setApiCallsThisMonth(int apiCallsThisMonth) { this.apiCallsThisMonth = apiCallsThisMonth; }
    
    public int getMaxApiCallsPerMonth() { return maxApiCallsPerMonth; }
    public void setMaxApiCallsPerMonth(int maxApiCallsPerMonth) { this.maxApiCallsPerMonth = maxApiCallsPerMonth; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
    
    public String getDefaultDomain() { return defaultDomain; }
    public void setDefaultDomain(String defaultDomain) { this.defaultDomain = defaultDomain; }
    
    public boolean isEmailNotifications() { return emailNotifications; }
    public void setEmailNotifications(boolean emailNotifications) { this.emailNotifications = emailNotifications; }
    
    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }
    
    public Set<String> getAllowedIpAddresses() { return allowedIpAddresses; }
    public void setAllowedIpAddresses(Set<String> allowedIpAddresses) { this.allowedIpAddresses = allowedIpAddresses; }
    
    public boolean isTwoFactorEnabled() { return twoFactorEnabled; }
    public void setTwoFactorEnabled(boolean twoFactorEnabled) { this.twoFactorEnabled = twoFactorEnabled; }
    
    public String getTwoFactorSecret() { return twoFactorSecret; }
    public void setTwoFactorSecret(String twoFactorSecret) { this.twoFactorSecret = twoFactorSecret; }
}