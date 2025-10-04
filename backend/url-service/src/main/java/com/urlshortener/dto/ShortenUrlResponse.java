package com.urlshortener.dto;

import java.time.LocalDateTime;

public class ShortenUrlResponse {
    
    private String shortUrl;
    private String shortCode;
    private String originalUrl;
    private LocalDateTime createdAt;
    
    // Constructors
    public ShortenUrlResponse() {}
    
    public ShortenUrlResponse(String shortUrl, String shortCode, String originalUrl, LocalDateTime createdAt) {
        this.shortUrl = shortUrl;
        this.shortCode = shortCode;
        this.originalUrl = originalUrl;
        this.createdAt = createdAt;
    }
    
    // Getters and Setters
    public String getShortUrl() { return shortUrl; }
    public void setShortUrl(String shortUrl) { this.shortUrl = shortUrl; }
    
    public String getShortCode() { return shortCode; }
    public void setShortCode(String shortCode) { this.shortCode = shortCode; }
    
    public String getOriginalUrl() { return originalUrl; }
    public void setOriginalUrl(String originalUrl) { this.originalUrl = originalUrl; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}