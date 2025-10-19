package com.urlshortener.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Document(collection = "users")
public class User {
    
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String email;
    
    private String password; // Will be hashed
    
    private String firstName;
    private String lastName;
    private String profilePicture;
    
    // Account details
    private String subscriptionPlan = "FREE"; // FREE, PREMIUM
    private LocalDateTime subscriptionExpiry;
    private boolean isActive = true;
    private boolean emailVerified = false;
    
    // Usage statistics
    private int totalUrls = 0;
    private int totalQrCodes = 0;
    private int totalFiles = 0;
    private int totalClicks = 0;
    
    // Timestamps
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    private LocalDateTime lastLoginAt;
    
    // OAuth details
    private String googleId;
    private String authProvider = "LOCAL"; // LOCAL, GOOGLE
    
    // API access
    private String apiKey;
    private int apiCallsThisMonth = 0;
    
    // Constructors
    public User() {}
    
    public User(String email, String password) {
        this.email = email;
        this.password = password;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    
    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }
    
    public String getSubscriptionPlan() { return subscriptionPlan; }
    public void setSubscriptionPlan(String subscriptionPlan) { this.subscriptionPlan = subscriptionPlan; }
    
    public LocalDateTime getSubscriptionExpiry() { return subscriptionExpiry; }
    public void setSubscriptionExpiry(LocalDateTime subscriptionExpiry) { this.subscriptionExpiry = subscriptionExpiry; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public boolean isEmailVerified() { return emailVerified; }
    public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
    
    public int getTotalUrls() { return totalUrls; }
    public void setTotalUrls(int totalUrls) { this.totalUrls = totalUrls; }
    
    public int getTotalQrCodes() { return totalQrCodes; }
    public void setTotalQrCodes(int totalQrCodes) { this.totalQrCodes = totalQrCodes; }
    
    public int getTotalFiles() { return totalFiles; }
    public void setTotalFiles(int totalFiles) { this.totalFiles = totalFiles; }
    
    public int getTotalClicks() { return totalClicks; }
    public void setTotalClicks(int totalClicks) { this.totalClicks = totalClicks; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public LocalDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(LocalDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
    
    public String getGoogleId() { return googleId; }
    public void setGoogleId(String googleId) { this.googleId = googleId; }
    
    public String getAuthProvider() { return authProvider; }
    public void setAuthProvider(String authProvider) { this.authProvider = authProvider; }
    
    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    
    public int getApiCallsThisMonth() { return apiCallsThisMonth; }
    public void setApiCallsThisMonth(int apiCallsThisMonth) { this.apiCallsThisMonth = apiCallsThisMonth; }
}