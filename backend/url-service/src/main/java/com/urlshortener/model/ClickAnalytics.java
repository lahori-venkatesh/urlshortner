package com.urlshortener.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;

@Document(collection = "click_analytics")
public class ClickAnalytics {
    
    @Id
    private String id;
    
    // Reference to the shortened URL
    @Indexed
    private String shortCode;
    
    @Indexed
    private String userId; // Owner of the URL
    
    // Click information
    private LocalDateTime clickedAt = LocalDateTime.now();
    
    // User information
    private String ipAddress;
    private String userAgent;
    private String sessionId;
    private boolean isUniqueClick = false;
    
    // Geographic information
    private String country;
    private String countryCode;
    private String region;
    private String city;
    private String timezone;
    private Double latitude;
    private Double longitude;
    
    // Device information
    private String deviceType; // DESKTOP, MOBILE, TABLET
    private String deviceBrand;
    private String deviceModel;
    private String operatingSystem;
    private String osVersion;
    
    // Browser information
    private String browser;
    private String browserVersion;
    private String browserEngine;
    
    // Referrer information
    private String referrer;
    private String referrerDomain;
    private String referrerType; // DIRECT, SEARCH, SOCIAL, EMAIL, etc.
    
    // UTM parameters
    private String utmSource;
    private String utmMedium;
    private String utmCampaign;
    private String utmTerm;
    private String utmContent;
    
    // Additional tracking
    private String language;
    private String screenResolution;
    private boolean isMobile;
    private boolean isBot = false;
    private String botName;
    
    // Time-based categorization
    private int hourOfDay;
    private int dayOfWeek;
    private int dayOfMonth;
    private int month;
    private int year;
    
    // Constructors
    public ClickAnalytics() {}
    
    public ClickAnalytics(String shortCode, String userId, String ipAddress, String userAgent) {
        this.shortCode = shortCode;
        this.userId = userId;
        this.ipAddress = ipAddress;
        this.userAgent = userAgent;
        
        LocalDateTime now = LocalDateTime.now();
        this.hourOfDay = now.getHour();
        this.dayOfWeek = now.getDayOfWeek().getValue();
        this.dayOfMonth = now.getDayOfMonth();
        this.month = now.getMonthValue();
        this.year = now.getYear();
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getShortCode() { return shortCode; }
    public void setShortCode(String shortCode) { this.shortCode = shortCode; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public LocalDateTime getClickedAt() { return clickedAt; }
    public void setClickedAt(LocalDateTime clickedAt) { this.clickedAt = clickedAt; }
    
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    
    public boolean isUniqueClick() { return isUniqueClick; }
    public void setUniqueClick(boolean uniqueClick) { isUniqueClick = uniqueClick; }
    
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    
    public String getTimezone() { return timezone; }
    public void setTimezone(String timezone) { this.timezone = timezone; }
    
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    
    public String getDeviceType() { return deviceType; }
    public void setDeviceType(String deviceType) { this.deviceType = deviceType; }
    
    public String getDeviceBrand() { return deviceBrand; }
    public void setDeviceBrand(String deviceBrand) { this.deviceBrand = deviceBrand; }
    
    public String getDeviceModel() { return deviceModel; }
    public void setDeviceModel(String deviceModel) { this.deviceModel = deviceModel; }
    
    public String getOperatingSystem() { return operatingSystem; }
    public void setOperatingSystem(String operatingSystem) { this.operatingSystem = operatingSystem; }
    
    public String getOsVersion() { return osVersion; }
    public void setOsVersion(String osVersion) { this.osVersion = osVersion; }
    
    public String getBrowser() { return browser; }
    public void setBrowser(String browser) { this.browser = browser; }
    
    public String getBrowserVersion() { return browserVersion; }
    public void setBrowserVersion(String browserVersion) { this.browserVersion = browserVersion; }
    
    public String getBrowserEngine() { return browserEngine; }
    public void setBrowserEngine(String browserEngine) { this.browserEngine = browserEngine; }
    
    public String getReferrer() { return referrer; }
    public void setReferrer(String referrer) { this.referrer = referrer; }
    
    public String getReferrerDomain() { return referrerDomain; }
    public void setReferrerDomain(String referrerDomain) { this.referrerDomain = referrerDomain; }
    
    public String getReferrerType() { return referrerType; }
    public void setReferrerType(String referrerType) { this.referrerType = referrerType; }
    
    public String getUtmSource() { return utmSource; }
    public void setUtmSource(String utmSource) { this.utmSource = utmSource; }
    
    public String getUtmMedium() { return utmMedium; }
    public void setUtmMedium(String utmMedium) { this.utmMedium = utmMedium; }
    
    public String getUtmCampaign() { return utmCampaign; }
    public void setUtmCampaign(String utmCampaign) { this.utmCampaign = utmCampaign; }
    
    public String getUtmTerm() { return utmTerm; }
    public void setUtmTerm(String utmTerm) { this.utmTerm = utmTerm; }
    
    public String getUtmContent() { return utmContent; }
    public void setUtmContent(String utmContent) { this.utmContent = utmContent; }
    
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    
    public String getScreenResolution() { return screenResolution; }
    public void setScreenResolution(String screenResolution) { this.screenResolution = screenResolution; }
    
    public boolean isMobile() { return isMobile; }
    public void setMobile(boolean mobile) { isMobile = mobile; }
    
    public boolean isBot() { return isBot; }
    public void setBot(boolean bot) { isBot = bot; }
    
    public String getBotName() { return botName; }
    public void setBotName(String botName) { this.botName = botName; }
    
    public int getHourOfDay() { return hourOfDay; }
    public void setHourOfDay(int hourOfDay) { this.hourOfDay = hourOfDay; }
    
    public int getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(int dayOfWeek) { this.dayOfWeek = dayOfWeek; }
    
    public int getDayOfMonth() { return dayOfMonth; }
    public void setDayOfMonth(int dayOfMonth) { this.dayOfMonth = dayOfMonth; }
    
    public int getMonth() { return month; }
    public void setMonth(int month) { this.month = month; }
    
    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }
}