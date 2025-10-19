package com.urlshortener.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.HashMap;

@Document(collection = "uploaded_files")
public class UploadedFile {
    
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String fileCode; // Unique identifier for the file
    
    // File information
    private String originalFileName;
    private String storedFileName;
    private String fileType; // MIME type
    private String fileExtension;
    private long fileSize; // in bytes
    
    // GridFS information
    private String gridFsFileId; // Reference to GridFS file
    
    // Owner information
    private String userId; // Reference to User
    private String uploadedBy; // Email or name
    
    // Access control
    private boolean isPublic = false;
    private boolean requiresPassword = false;
    private String password; // Password protection
    private LocalDateTime expiresAt;
    private boolean isExpired = false;
    
    // File metadata
    private String title;
    private String description;
    private String[] tags;
    private String category;
    
    // Access statistics
    private int totalDownloads = 0;
    private int uniqueDownloads = 0;
    private int todayDownloads = 0;
    private int thisWeekDownloads = 0;
    private int thisMonthDownloads = 0;
    
    // Geographic data
    private Map<String, Integer> downloadsByCountry = new HashMap<>();
    private Map<String, Integer> downloadsByCity = new HashMap<>();
    
    // Device and browser data
    private Map<String, Integer> downloadsByDevice = new HashMap<>();
    private Map<String, Integer> downloadsByBrowser = new HashMap<>();
    private Map<String, Integer> downloadsByOS = new HashMap<>();
    
    // Time-based analytics
    private Map<String, Integer> downloadsByHour = new HashMap<>();
    private Map<String, Integer> downloadsByDay = new HashMap<>();
    
    // URL generation
    private String fileUrl; // Public URL to access the file
    private String shortUrl; // Shortened URL for the file
    private boolean hasShortUrl = false;
    
    // QR Code for file access
    private boolean hasQrCode = false;
    private String qrCodeUrl;
    
    // Status
    private boolean isActive = true;
    private String status = "ACTIVE"; // ACTIVE, DELETED, EXPIRED, SUSPENDED
    
    // Timestamps
    private LocalDateTime uploadedAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    private LocalDateTime lastAccessedAt;
    
    // Virus scan results
    private boolean isScanned = false;
    private boolean isSafe = true;
    private String scanResult;
    private LocalDateTime scannedAt;
    
    // Constructors
    public UploadedFile() {}
    
    public UploadedFile(String originalFileName, String fileType, long fileSize, String userId) {
        this.originalFileName = originalFileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.userId = userId;
        this.fileCode = generateFileCode();
        this.fileUrl = "http://localhost:8080/files/" + this.fileCode;
    }
    
    private String generateFileCode() {
        return "file_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 10000);
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getFileCode() { return fileCode; }
    public void setFileCode(String fileCode) { this.fileCode = fileCode; }
    
    public String getOriginalFileName() { return originalFileName; }
    public void setOriginalFileName(String originalFileName) { this.originalFileName = originalFileName; }
    
    public String getStoredFileName() { return storedFileName; }
    public void setStoredFileName(String storedFileName) { this.storedFileName = storedFileName; }
    
    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
    
    public String getFileExtension() { return fileExtension; }
    public void setFileExtension(String fileExtension) { this.fileExtension = fileExtension; }
    
    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }
    
    public String getGridFsFileId() { return gridFsFileId; }
    public void setGridFsFileId(String gridFsFileId) { this.gridFsFileId = gridFsFileId; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }
    
    public boolean isPublic() { return isPublic; }
    public void setPublic(boolean aPublic) { isPublic = aPublic; }
    
    public boolean isRequiresPassword() { return requiresPassword; }
    public void setRequiresPassword(boolean requiresPassword) { this.requiresPassword = requiresPassword; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
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
    
    public int getTotalDownloads() { return totalDownloads; }
    public void setTotalDownloads(int totalDownloads) { this.totalDownloads = totalDownloads; }
    
    public int getUniqueDownloads() { return uniqueDownloads; }
    public void setUniqueDownloads(int uniqueDownloads) { this.uniqueDownloads = uniqueDownloads; }
    
    public int getTodayDownloads() { return todayDownloads; }
    public void setTodayDownloads(int todayDownloads) { this.todayDownloads = todayDownloads; }
    
    public int getThisWeekDownloads() { return thisWeekDownloads; }
    public void setThisWeekDownloads(int thisWeekDownloads) { this.thisWeekDownloads = thisWeekDownloads; }
    
    public int getThisMonthDownloads() { return thisMonthDownloads; }
    public void setThisMonthDownloads(int thisMonthDownloads) { this.thisMonthDownloads = thisMonthDownloads; }
    
    public Map<String, Integer> getDownloadsByCountry() { return downloadsByCountry; }
    public void setDownloadsByCountry(Map<String, Integer> downloadsByCountry) { this.downloadsByCountry = downloadsByCountry; }
    
    public Map<String, Integer> getDownloadsByCity() { return downloadsByCity; }
    public void setDownloadsByCity(Map<String, Integer> downloadsByCity) { this.downloadsByCity = downloadsByCity; }
    
    public Map<String, Integer> getDownloadsByDevice() { return downloadsByDevice; }
    public void setDownloadsByDevice(Map<String, Integer> downloadsByDevice) { this.downloadsByDevice = downloadsByDevice; }
    
    public Map<String, Integer> getDownloadsByBrowser() { return downloadsByBrowser; }
    public void setDownloadsByBrowser(Map<String, Integer> downloadsByBrowser) { this.downloadsByBrowser = downloadsByBrowser; }
    
    public Map<String, Integer> getDownloadsByOS() { return downloadsByOS; }
    public void setDownloadsByOS(Map<String, Integer> downloadsByOS) { this.downloadsByOS = downloadsByOS; }
    
    public Map<String, Integer> getDownloadsByHour() { return downloadsByHour; }
    public void setDownloadsByHour(Map<String, Integer> downloadsByHour) { this.downloadsByHour = downloadsByHour; }
    
    public Map<String, Integer> getDownloadsByDay() { return downloadsByDay; }
    public void setDownloadsByDay(Map<String, Integer> downloadsByDay) { this.downloadsByDay = downloadsByDay; }
    
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    
    public String getShortUrl() { return shortUrl; }
    public void setShortUrl(String shortUrl) { this.shortUrl = shortUrl; }
    
    public boolean isHasShortUrl() { return hasShortUrl; }
    public void setHasShortUrl(boolean hasShortUrl) { this.hasShortUrl = hasShortUrl; }
    
    public boolean isHasQrCode() { return hasQrCode; }
    public void setHasQrCode(boolean hasQrCode) { this.hasQrCode = hasQrCode; }
    
    public String getQrCodeUrl() { return qrCodeUrl; }
    public void setQrCodeUrl(String qrCodeUrl) { this.qrCodeUrl = qrCodeUrl; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public LocalDateTime getLastAccessedAt() { return lastAccessedAt; }
    public void setLastAccessedAt(LocalDateTime lastAccessedAt) { this.lastAccessedAt = lastAccessedAt; }
    
    public boolean isScanned() { return isScanned; }
    public void setScanned(boolean scanned) { isScanned = scanned; }
    
    public boolean isSafe() { return isSafe; }
    public void setSafe(boolean safe) { isSafe = safe; }
    
    public String getScanResult() { return scanResult; }
    public void setScanResult(String scanResult) { this.scanResult = scanResult; }
    
    public LocalDateTime getScannedAt() { return scannedAt; }
    public void setScannedAt(LocalDateTime scannedAt) { this.scannedAt = scannedAt; }
}