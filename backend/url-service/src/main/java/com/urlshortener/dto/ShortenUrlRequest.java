package com.urlshortener.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class ShortenUrlRequest {
    
    @NotBlank(message = "Original URL is required")
    @Pattern(regexp = "^https?://.*", message = "URL must start with http:// or https://")
    private String originalUrl;
    
    private String customAlias;
    private String password;
    private Integer expirationDays;
    private Integer maxClicks;
    private Boolean isOneTime;
    
    // Constructors
    public ShortenUrlRequest() {}
    
    public ShortenUrlRequest(String originalUrl) {
        this.originalUrl = originalUrl;
    }
    
    // Getters and Setters
    public String getOriginalUrl() { return originalUrl; }
    public void setOriginalUrl(String originalUrl) { this.originalUrl = originalUrl; }
    
    public String getCustomAlias() { return customAlias; }
    public void setCustomAlias(String customAlias) { this.customAlias = customAlias; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public Integer getExpirationDays() { return expirationDays; }
    public void setExpirationDays(Integer expirationDays) { this.expirationDays = expirationDays; }
    
    public Integer getMaxClicks() { return maxClicks; }
    public void setMaxClicks(Integer maxClicks) { this.maxClicks = maxClicks; }
    
    public Boolean getIsOneTime() { return isOneTime; }
    public void setIsOneTime(Boolean isOneTime) { this.isOneTime = isOneTime; }
}