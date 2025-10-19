package com.urlshortener.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;

@Document(collection = "qr_codes")
public class QrCode {
    
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String qrCode; // Unique identifier for the QR code
    
    // Associated content
    private String contentType; // URL, TEXT, VCARD, WIFI, etc.
    private String content; // The actual content (URL, text, etc.)
    private String shortCode; // Reference to shortened URL if applicable
    private String fileCode; // Reference to uploaded file if applicable
    
    // Owner information
    private String userId; // Reference to User
    private String createdBy; // Email or name
    
    // QR Code customization
    private String style = "STANDARD"; // STANDARD, CUSTOM, LOGO, ARTISTIC
    private String foregroundColor = "#000000";
    private String backgroundColor = "#FFFFFF";
    private String logoUrl; // Custom logo in the center
    private int size = 300; // Size in pixels
    private String format = "PNG"; // PNG, JPG, SVG
    private int errorCorrectionLevel = 1; // 0-3 (L, M, Q, H)
    
    // Design options
    private String frameStyle = "NONE"; // NONE, SQUARE, CIRCLE, ROUNDED
    private String eyeStyle = "SQUARE"; // SQUARE, CIRCLE, ROUNDED
    private String dataPattern = "SQUARE"; // SQUARE, CIRCLE, ROUNDED, DOT
    
    // QR Code file information
    private String qrImageUrl; // URL to access the QR code image
    private String qrImagePath; // File path where QR code is stored
    private long fileSize; // Size of the QR code image file
    
    // Analytics
    private int totalScans = 0;
    private int uniqueScans = 0;
    private int todayScans = 0;
    private int thisWeekScans = 0;
    private int thisMonthScans = 0;
    
    // Geographic data
    private Map<String, Integer> scansByCountry = new HashMap<>();
    private Map<String, Integer> scansByCity = new HashMap<>();
    
    // Device and browser data
    private Map<String, Integer> scansByDevice = new HashMap<>();
    private Map<String, Integer> scansByBrowser = new HashMap<>();
    private Map<String, Integer> scansByOS = new HashMap<>();
    
    // Time-based analytics
    private Map<String, Integer> scansByHour = new HashMap<>();
    private Map<String, Integer> scansByDay = new HashMap<>();
    
    // Status and settings
    private boolean isActive = true;
    private boolean isPublic = true;
    private boolean trackScans = true;
    
    // Expiration
    private LocalDateTime expiresAt;
    private boolean isExpired = false;
    
    // Metadata
    private String title;
    private String description;
    private String[] tags;
    private String category;
    
    // Timestamps
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    private LocalDateTime lastScannedAt;
    
    // Constructors
    public QrCode() {}
    
    public QrCode(String content, String contentType, String userId) {
        this.content = content;
        this.contentType = contentType;
        this.userId = userId;
        this.qrCode = generateQrCode();
        this.qrImageUrl = "http://localhost:8080/qr/" + this.qrCode + ".png";
    }
    
    private String generateQrCode() {
        return "qr_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 10000);
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getQrCode() { return qrCode; }
    public void setQrCode(String qrCode) { this.qrCode = qrCode; }
    
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    
    public String getShortCode() { return shortCode; }
    public void setShortCode(String shortCode) { this.shortCode = shortCode; }
    
    public String getFileCode() { return fileCode; }
    public void setFileCode(String fileCode) { this.fileCode = fileCode; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    
    public String getStyle() { return style; }
    public void setStyle(String style) { this.style = style; }
    
    public String getForegroundColor() { return foregroundColor; }
    public void setForegroundColor(String foregroundColor) { this.foregroundColor = foregroundColor; }
    
    public String getBackgroundColor() { return backgroundColor; }
    public void setBackgroundColor(String backgroundColor) { this.backgroundColor = backgroundColor; }
    
    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }
    
    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }
    
    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }
    
    public int getErrorCorrectionLevel() { return errorCorrectionLevel; }
    public void setErrorCorrectionLevel(int errorCorrectionLevel) { this.errorCorrectionLevel = errorCorrectionLevel; }
    
    public String getFrameStyle() { return frameStyle; }
    public void setFrameStyle(String frameStyle) { this.frameStyle = frameStyle; }
    
    public String getEyeStyle() { return eyeStyle; }
    public void setEyeStyle(String eyeStyle) { this.eyeStyle = eyeStyle; }
    
    public String getDataPattern() { return dataPattern; }
    public void setDataPattern(String dataPattern) { this.dataPattern = dataPattern; }
    
    public String getQrImageUrl() { return qrImageUrl; }
    public void setQrImageUrl(String qrImageUrl) { this.qrImageUrl = qrImageUrl; }
    
    public String getQrImagePath() { return qrImagePath; }
    public void setQrImagePath(String qrImagePath) { this.qrImagePath = qrImagePath; }
    
    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }
    
    public int getTotalScans() { return totalScans; }
    public void setTotalScans(int totalScans) { this.totalScans = totalScans; }
    
    public int getUniqueScans() { return uniqueScans; }
    public void setUniqueScans(int uniqueScans) { this.uniqueScans = uniqueScans; }
    
    public int getTodayScans() { return todayScans; }
    public void setTodayScans(int todayScans) { this.todayScans = todayScans; }
    
    public int getThisWeekScans() { return thisWeekScans; }
    public void setThisWeekScans(int thisWeekScans) { this.thisWeekScans = thisWeekScans; }
    
    public int getThisMonthScans() { return thisMonthScans; }
    public void setThisMonthScans(int thisMonthScans) { this.thisMonthScans = thisMonthScans; }
    
    public Map<String, Integer> getScansByCountry() { return scansByCountry; }
    public void setScansByCountry(Map<String, Integer> scansByCountry) { this.scansByCountry = scansByCountry; }
    
    public Map<String, Integer> getScansByCity() { return scansByCity; }
    public void setScansByCity(Map<String, Integer> scansByCity) { this.scansByCity = scansByCity; }
    
    public Map<String, Integer> getScansByDevice() { return scansByDevice; }
    public void setScansByDevice(Map<String, Integer> scansByDevice) { this.scansByDevice = scansByDevice; }
    
    public Map<String, Integer> getScansByBrowser() { return scansByBrowser; }
    public void setScansByBrowser(Map<String, Integer> scansByBrowser) { this.scansByBrowser = scansByBrowser; }
    
    public Map<String, Integer> getScansByOS() { return scansByOS; }
    public void setScansByOS(Map<String, Integer> scansByOS) { this.scansByOS = scansByOS; }
    
    public Map<String, Integer> getScansByHour() { return scansByHour; }
    public void setScansByHour(Map<String, Integer> scansByHour) { this.scansByHour = scansByHour; }
    
    public Map<String, Integer> getScansByDay() { return scansByDay; }
    public void setScansByDay(Map<String, Integer> scansByDay) { this.scansByDay = scansByDay; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public boolean isPublic() { return isPublic; }
    public void setPublic(boolean aPublic) { isPublic = aPublic; }
    
    public boolean isTrackScans() { return trackScans; }
    public void setTrackScans(boolean trackScans) { this.trackScans = trackScans; }
    
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    
    public boolean isExpired() { return isExpired; }
    public void setExpired(boolean expired) { isExpired = expired; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String[] getTags() { return tags; }
    public void setTags(String[] tags) { this.tags = tags; }
    
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public LocalDateTime getLastScannedAt() { return lastScannedAt; }
    public void setLastScannedAt(LocalDateTime lastScannedAt) { this.lastScannedAt = lastScannedAt; }
}