package com.urlshortener.model;

import java.time.LocalDateTime;

public class TeamMember {
    
    private String userId;
    private TeamRole role;
    private LocalDateTime joinedAt;
    private String invitedBy; // userId of who invited this member
    private boolean isActive = true;
    
    // Constructors
    public TeamMember() {}
    
    public TeamMember(String userId, TeamRole role, LocalDateTime joinedAt) {
        this.userId = userId;
        this.role = role;
        this.joinedAt = joinedAt;
    }
    
    public TeamMember(String userId, TeamRole role, LocalDateTime joinedAt, String invitedBy) {
        this.userId = userId;
        this.role = role;
        this.joinedAt = joinedAt;
        this.invitedBy = invitedBy;
    }
    
    // Getters and Setters
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public TeamRole getRole() { return role; }
    public void setRole(TeamRole role) { this.role = role; }
    
    public LocalDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
    
    public String getInvitedBy() { return invitedBy; }
    public void setInvitedBy(String invitedBy) { this.invitedBy = invitedBy; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}