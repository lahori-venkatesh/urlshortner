package com.urlshortener.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;

@Document(collection = "shortened_urls")
public class ShortenedUrl {
    
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String shortCode;
    
    private String originalUrl;
    private String shortUrl;
    
    // Owner information
    private String userId; // Reference to User
    private String createdBy; // Email or name
    
    // URL metadata
    private String title;
    private String description;
    private String favicon;
    private String domain;
    
    // Customization
    private String customAlias;
    private String password; // Password protection
    private boolean isPasswordProtected = false;
    
    // Expiration
    private LocalDateTime expiresAt;
    private boolean isExpired = false;
    
    // Click limits
    private Integer maxClicks; // Maximum allowed clicks (null = unlimited)
    
    // Status and settings
    private boolean isActive = true;
    private boolean isPublic = true;
    private boolean trackClicks = true;
    
    // Analytics counters
    private int totalClicks = 0;
    private int uniqueClicks = 0;
    private int todayClicks = 0;
    private int thisWeekClicks = 0;
    private int thisMonthClicks = 0;
    
    // Geographic data
    private Map<String, Integer> clicksByCountry = new HashMap<>();
    private Map<String, Integer> clicksByCity = new HashMap<>();
    
    // Device and browser data
    private Map<String, Integer> clicksByDevice = new HashMap<>();
    private Map<String, Integer> clicksByBrowser = new HashMap<>();
    private Map<String, Integer> clicksByOS = new HashMap<>();
    
    // Referrer data
    private Map<String, Integer> clicksByReferrer = new HashMap<>();
    
    // Time-based analytics
    private Map<String, Integer> clicksByHour = new HashMap<>();
    private Map<String, Integer> clicksByDay = new HashMap<>();
    
    // QR Code
    private boolean hasQrCode = false;
    private String qrCodeUrl;
    private String qrCodeStyle = "STANDARD"; // STANDARD, CUSTOM, LOGO
    
    // Timestamps
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    private LocalDateTime lastClickedAt;
    
    // Tags and categories
    private String[] tags;
    private String category;
    private String notes;
    
    // Constructors
    public ShortenedUrl() {}
    
    public ShortenedUrl(String originalUrl, String shortCode, String userId) {
        this.originalUrl = originalUrl;
        this.shortCode = shortCode;
        this.userId = userId;
        // Short URL will be set by the service with proper domain
        this.shortUrl = shortCode; // Temporary, will be updated by service
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getShortCode() { return shortCode; }
    public void setShortCode(String shortCode) { this.shortCode = shortCode; }
    
    public String getOriginalUrl() { return originalUrl; }
    public void setOriginalUrl(String originalUrl) { this.originalUrl = originalUrl; }
    
    public String getShortUrl() { return shortUrl; }
    public void setShortUrl(String shortUrl) { this.shortUrl = shortUrl; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getFavicon() { return favicon; }
    public void setFavicon(String favicon) { this.favicon = favicon; }
    
    public String getDomain() { return domain; }
    public void setDomain(String domain) { this.domain = domain; }
    
    public String getCustomAlias() { return customAlias; }
    public void setCustomAlias(String customAlias) { this.customAlias = customAlias; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public boolean isPasswordProtected() { return isPasswordProtected; }
    public void setPasswordProtected(boolean passwordProtected) { isPasswordProtected = passwordProtected; }
    
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    
    public boolean isExpired() { return isExpired; }
    public void setExpired(boolean expired) { isExpired = expired; }
    
    public Integer getMaxClicks() { return maxClicks; }
    public void setMaxClicks(Integer maxClicks) { this.maxClicks = maxClicks; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public boolean isPublic() { return isPublic; }
    public void setPublic(boolean aPublic) { isPublic = aPublic; }
    
    public boolean isTrackClicks() { return trackClicks; }
    public void setTrackClicks(boolean trackClicks) { this.trackClicks = trackClicks; }
    
    public int getTotalClicks() { return totalClicks; }
    public void setTotalClicks(int totalClicks) { this.totalClicks = totalClicks; }
    
    public int getUniqueClicks() { return uniqueClicks; }
    public void setUniqueClicks(int uniqueClicks) { this.uniqueClicks = uniqueClicks; }
    
    public int getTodayClicks() { return todayClicks; }
    public void setTodayClicks(int todayClicks) { this.todayClicks = todayClicks; }
    
    public int getThisWeekClicks() { return thisWeekClicks; }
    public void setThisWeekClicks(int thisWeekClicks) { this.thisWeekClicks = thisWeekClicks; }
    
    public int getThisMonthClicks() { return thisMonthClicks; }
    public void setThisMonthClicks(int thisMonthClicks) { this.thisMonthClicks = thisMonthClicks; }
    
    public Map<String, Integer> getClicksByCountry() { return clicksByCountry; }
    public void setClicksByCountry(Map<String, Integer> clicksByCountry) { this.clicksByCountry = clicksByCountry; }
    
    public Map<String, Integer> getClicksByCity() { return clicksByCity; }
    public void setClicksByCity(Map<String, Integer> clicksByCity) { this.clicksByCity = clicksByCity; }
    
    public Map<String, Integer> getClicksByDevice() { return clicksByDevice; }
    public void setClicksByDevice(Map<String, Integer> clicksByDevice) { this.clicksByDevice = clicksByDevice; }
    
    public Map<String, Integer> getClicksByBrowser() { return clicksByBrowser; }
    public void setClicksByBrowser(Map<String, Integer> clicksByBrowser) { this.clicksByBrowser = clicksByBrowser; }
    
    public Map<String, Integer> getClicksByOS() { return clicksByOS; }
    public void setClicksByOS(Map<String, Integer> clicksByOS) { this.clicksByOS = clicksByOS; }
    
    public Map<String, Integer> getClicksByReferrer() { return clicksByReferrer; }
    public void setClicksByReferrer(Map<String, Integer> clicksByReferrer) { this.clicksByReferrer = clicksByReferrer; }
    
    public Map<String, Integer> getClicksByHour() { return clicksByHour; }
    public void setClicksByHour(Map<String, Integer> clicksByHour) { this.clicksByHour = clicksByHour; }
    
    public Map<String, Integer> getClicksByDay() { return clicksByDay; }
    public void setClicksByDay(Map<String, Integer> clicksByDay) { this.clicksByDay = clicksByDay; }
    
    public boolean isHasQrCode() { return hasQrCode; }
    public void setHasQrCode(boolean hasQrCode) { this.hasQrCode = hasQrCode; }
    
    public String getQrCodeUrl() { return qrCodeUrl; }
    public void setQrCodeUrl(String qrCodeUrl) { this.qrCodeUrl = qrCodeUrl; }
    
    public String getQrCodeStyle() { return qrCodeStyle; }
    public void setQrCodeStyle(String qrCodeStyle) { this.qrCodeStyle = qrCodeStyle; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public LocalDateTime getLastClickedAt() { return lastClickedAt; }
    public void setLastClickedAt(LocalDateTime lastClickedAt) { this.lastClickedAt = lastClickedAt; }
    
    public String[] getTags() { return tags; }
    public void setTags(String[] tags) { this.tags = tags; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}