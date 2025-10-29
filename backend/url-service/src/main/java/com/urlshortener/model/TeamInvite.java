package com.urlshortener.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;

@Document(collection = "team_invites")
public class TeamInvite {
    
    @Id
    private String id;
    
    @Indexed
    private String teamId;
    
    @Indexed
    private String email;
    
    private String invitedBy; // userId
    private TeamRole role;
    private String inviteToken;
    
    private boolean isAccepted = false;
    private boolean isExpired = false;
    private LocalDateTime expiresAt;
    
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime acceptedAt;
    
    // Constructors
    public TeamInvite() {}
    
    public TeamInvite(String teamId, String email, String invitedBy, TeamRole role, String inviteToken) {
        this.teamId = teamId;
        this.email = email;
        this.invitedBy = invitedBy;
        this.role = role;
        this.inviteToken = inviteToken;
        this.expiresAt = LocalDateTime.now().plusDays(7); // 7 days to accept
    }
    
    public boolean isValid() {
        return !isAccepted && !isExpired && LocalDateTime.now().isBefore(expiresAt);
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getTeamId() { return teamId; }
    public void setTeamId(String teamId) { this.teamId = teamId; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getInvitedBy() { return invitedBy; }
    public void setInvitedBy(String invitedBy) { this.invitedBy = invitedBy; }
    
    public TeamRole getRole() { return role; }
    public void setRole(TeamRole role) { this.role = role; }
    
    public String getInviteToken() { return inviteToken; }
    public void setInviteToken(String inviteToken) { this.inviteToken = inviteToken; }
    
    public boolean isAccepted() { return isAccepted; }
    public void setAccepted(boolean accepted) { isAccepted = accepted; }
    
    public boolean isExpired() { return isExpired; }
    public void setExpired(boolean expired) { isExpired = expired; }
    
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(LocalDateTime acceptedAt) { this.acceptedAt = acceptedAt; }
}