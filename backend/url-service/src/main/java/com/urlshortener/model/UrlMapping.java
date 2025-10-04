package com.urlshortener.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "url_mappings")
public class UrlMapping {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank
    @Column(unique = true, nullable = false)
    private String shortCode;
    
    @NotBlank
    @Column(nullable = false, length = 2048)
    private String originalUrl;
    
    @Column(name = "custom_alias")
    private String customAlias;
    
    @Column(name = "password_hash")
    private String passwordHash;
    
    @Column(name = "expiration_date")
    private LocalDateTime expirationDate;
    
    @Column(name = "max_clicks")
    private Integer maxClicks;
    
    @Column(name = "click_count")
    private Long clickCount = 0L;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "is_one_time")
    private Boolean isOneTime = false;
    
    @NotNull
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "created_by")
    private String createdBy;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "link_type")
    private LinkType linkType = LinkType.URL;
    
    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    // Enums
    public enum LinkType {
        URL, QR, FILE
    }
    
    // Constructors
    public UrlMapping() {
        this.createdAt = LocalDateTime.now();
    }
    
    public UrlMapping(String shortCode, String originalUrl) {
        this();
        this.shortCode = shortCode;
        this.originalUrl = originalUrl;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getShortCode() { return shortCode; }
    public void setShortCode(String shortCode) { this.shortCode = shortCode; }
    
    public String getOriginalUrl() { return originalUrl; }
    public void setOriginalUrl(String originalUrl) { this.originalUrl = originalUrl; }
    
    public String getCustomAlias() { return customAlias; }
    public void setCustomAlias(String customAlias) { this.customAlias = customAlias; }
    
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    
    public LocalDateTime getExpirationDate() { return expirationDate; }
    public void setExpirationDate(LocalDateTime expirationDate) { this.expirationDate = expirationDate; }
    
    public Integer getMaxClicks() { return maxClicks; }
    public void setMaxClicks(Integer maxClicks) { this.maxClicks = maxClicks; }
    
    public Long getClickCount() { return clickCount; }
    public void setClickCount(Long clickCount) { this.clickCount = clickCount; }
    
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    
    public Boolean getIsOneTime() { return isOneTime; }
    public void setIsOneTime(Boolean isOneTime) { this.isOneTime = isOneTime; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    
    public LinkType getLinkType() { return linkType; }
    public void setLinkType(LinkType linkType) { this.linkType = linkType; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    // Helper methods
    public boolean isExpired() {
        return expirationDate != null && LocalDateTime.now().isAfter(expirationDate);
    }
    
    public boolean hasReachedMaxClicks() {
        return maxClicks != null && clickCount >= maxClicks;
    }
    
    public void incrementClickCount() {
        this.clickCount++;
    }
}