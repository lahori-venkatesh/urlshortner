package com.urlshortener.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Document(collection = "teams")
public class Team {
    
    @Id
    private String id;
    
    @Indexed
    private String teamName;
    
    @Indexed
    private String ownerId; // Reference to User who created the team
    
    private List<TeamMember> members = new ArrayList<>();
    
    // Team subscription details
    private String subscriptionPlan = "FREE"; // FREE, BUSINESS_MONTHLY, BUSINESS_YEARLY
    private LocalDateTime subscriptionExpiry;
    private boolean subscriptionCancelled = false;
    private String subscriptionId; // Razorpay subscription ID
    private String customerId; // Razorpay customer ID
    
    // Team settings
    private String description;
    private String logoUrl;
    private boolean isActive = true;
    
    // Usage statistics
    private int totalUrls = 0;
    private int totalQrCodes = 0;
    private int totalFiles = 0;
    private int totalClicks = 0;
    
    // Monthly usage tracking
    private int monthlyUrlsCreated = 0;
    private int monthlyQrCodesCreated = 0;
    private int monthlyFilesUploaded = 0;
    private LocalDateTime lastMonthlyReset = LocalDateTime.now();
    
    // Team limits based on plan
    private int memberLimit = 1; // FREE: 1, PRO: 3, BUSINESS: 10
    private int linkQuota = 1000; // FREE: 1000/month, PRO: 5000/month, BUSINESS: unlimited
    
    // Timestamps
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    // Constructors
    public Team() {}
    
    public Team(String teamName, String ownerId) {
        this.teamName = teamName;
        this.ownerId = ownerId;
        // Add owner as first member
        this.members.add(new TeamMember(ownerId, TeamRole.OWNER, LocalDateTime.now()));
    }
    
    // Helper methods
    public boolean isMember(String userId) {
        return members.stream().anyMatch(member -> member.getUserId().equals(userId));
    }
    
    public TeamRole getUserRole(String userId) {
        return members.stream()
                .filter(member -> member.getUserId().equals(userId))
                .map(TeamMember::getRole)
                .findFirst()
                .orElse(null);
    }
    
    public boolean canUserPerformAction(String userId, String action) {
        TeamRole role = getUserRole(userId);
        if (role == null) return false;
        
        return switch (action) {
            case "CREATE_CONTENT" -> role != TeamRole.VIEWER;
            case "EDIT_OWN_CONTENT" -> role != TeamRole.VIEWER;
            case "EDIT_ALL_CONTENT" -> role == TeamRole.OWNER || role == TeamRole.ADMIN;
            case "DELETE_CONTENT" -> role == TeamRole.OWNER || role == TeamRole.ADMIN;
            case "INVITE_MEMBERS" -> role == TeamRole.OWNER || role == TeamRole.ADMIN;
            case "REMOVE_MEMBERS" -> role == TeamRole.OWNER || role == TeamRole.ADMIN;
            case "CHANGE_ROLES" -> role == TeamRole.OWNER;
            case "MANAGE_BILLING" -> role == TeamRole.OWNER;
            case "DELETE_TEAM" -> role == TeamRole.OWNER;
            case "VIEW_ANALYTICS" -> true; // All members can view analytics
            default -> false;
        };
    }
    
    public void addMember(String userId, TeamRole role) {
        if (!isMember(userId)) {
            members.add(new TeamMember(userId, role, LocalDateTime.now()));
            setUpdatedAt(LocalDateTime.now());
        }
    }
    
    public void removeMember(String userId) {
        members.removeIf(member -> member.getUserId().equals(userId));
        setUpdatedAt(LocalDateTime.now());
    }
    
    public void updateMemberRole(String userId, TeamRole newRole) {
        members.stream()
                .filter(member -> member.getUserId().equals(userId))
                .findFirst()
                .ifPresent(member -> member.setRole(newRole));
        setUpdatedAt(LocalDateTime.now());
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }
    
    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }
    
    public List<TeamMember> getMembers() { return members; }
    public void setMembers(List<TeamMember> members) { this.members = members; }
    
    public String getSubscriptionPlan() { return subscriptionPlan; }
    public void setSubscriptionPlan(String subscriptionPlan) { this.subscriptionPlan = subscriptionPlan; }
    
    public LocalDateTime getSubscriptionExpiry() { return subscriptionExpiry; }
    public void setSubscriptionExpiry(LocalDateTime subscriptionExpiry) { this.subscriptionExpiry = subscriptionExpiry; }
    
    public boolean isSubscriptionCancelled() { return subscriptionCancelled; }
    public void setSubscriptionCancelled(boolean subscriptionCancelled) { this.subscriptionCancelled = subscriptionCancelled; }
    
    public String getSubscriptionId() { return subscriptionId; }
    public void setSubscriptionId(String subscriptionId) { this.subscriptionId = subscriptionId; }
    
    public String getCustomerId() { return customerId; }
    public void setCustomerId(String customerId) { this.customerId = customerId; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public int getTotalUrls() { return totalUrls; }
    public void setTotalUrls(int totalUrls) { this.totalUrls = totalUrls; }
    
    public int getTotalQrCodes() { return totalQrCodes; }
    public void setTotalQrCodes(int totalQrCodes) { this.totalQrCodes = totalQrCodes; }
    
    public int getTotalFiles() { return totalFiles; }
    public void setTotalFiles(int totalFiles) { this.totalFiles = totalFiles; }
    
    public int getTotalClicks() { return totalClicks; }
    public void setTotalClicks(int totalClicks) { this.totalClicks = totalClicks; }
    
    public int getMonthlyUrlsCreated() { return monthlyUrlsCreated; }
    public void setMonthlyUrlsCreated(int monthlyUrlsCreated) { this.monthlyUrlsCreated = monthlyUrlsCreated; }
    
    public int getMonthlyQrCodesCreated() { return monthlyQrCodesCreated; }
    public void setMonthlyQrCodesCreated(int monthlyQrCodesCreated) { this.monthlyQrCodesCreated = monthlyQrCodesCreated; }
    
    public int getMonthlyFilesUploaded() { return monthlyFilesUploaded; }
    public void setMonthlyFilesUploaded(int monthlyFilesUploaded) { this.monthlyFilesUploaded = monthlyFilesUploaded; }
    
    public LocalDateTime getLastMonthlyReset() { return lastMonthlyReset; }
    public void setLastMonthlyReset(LocalDateTime lastMonthlyReset) { this.lastMonthlyReset = lastMonthlyReset; }
    
    public int getMemberLimit() { return memberLimit; }
    public void setMemberLimit(int memberLimit) { this.memberLimit = memberLimit; }
    
    public int getLinkQuota() { return linkQuota; }
    public void setLinkQuota(int linkQuota) { this.linkQuota = linkQuota; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Additional methods for admin functionality
    public String getName() {
        return teamName;
    }

    public String getPlan() {
        return subscriptionPlan;
    }

    public String getOwner() {
        return ownerId;
    }

    public List<String> getDomains() {
        // Return empty list for now - would need domain repository integration
        return new ArrayList<>();
    }
}