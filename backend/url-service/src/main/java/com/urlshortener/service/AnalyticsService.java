package com.urlshortener.service;

import com.urlshortener.model.ClickAnalytics;
import com.urlshortener.model.ShortenedUrl;
import com.urlshortener.repository.ClickAnalyticsRepository;
import com.urlshortener.repository.ShortenedUrlRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {
    
    @Autowired
    private ClickAnalyticsRepository clickAnalyticsRepository;
    
    @Autowired
    private ShortenedUrlRepository shortenedUrlRepository;
    
    public ClickAnalytics recordClick(String shortCode, String ipAddress, String userAgent,
                                    String referrer, String country, String city, 
                                    String deviceType, String browser, String os) {
        
        // Get the shortened URL
        Optional<ShortenedUrl> urlOpt = shortenedUrlRepository.findByShortCode(shortCode);
        if (urlOpt.isEmpty()) {
            throw new RuntimeException("Short URL not found");
        }
        
        ShortenedUrl shortenedUrl = urlOpt.get();
        
        // Create analytics record
        ClickAnalytics analytics = new ClickAnalytics(shortCode, shortenedUrl.getUserId(), ipAddress, userAgent);
        
        // Set geographic data
        analytics.setCountry(country);
        analytics.setCity(city);
        
        // Set device data
        analytics.setDeviceType(deviceType);
        analytics.setBrowser(browser);
        analytics.setOperatingSystem(os);
        analytics.setMobile("MOBILE".equals(deviceType));
        
        // Set referrer data
        analytics.setReferrer(referrer);
        if (referrer != null && !referrer.isEmpty()) {
            try {
                java.net.URL url = new java.net.URL(referrer);
                analytics.setReferrerDomain(url.getHost());
                analytics.setReferrerType(determineReferrerType(url.getHost()));
            } catch (Exception e) {
                analytics.setReferrerType("DIRECT");
            }
        } else {
            analytics.setReferrerType("DIRECT");
        }
        
        // Check if this is a unique click (same IP in last 24 hours)
        LocalDateTime yesterday = LocalDateTime.now().minus(1, ChronoUnit.DAYS);
        List<ClickAnalytics> recentClicks = clickAnalyticsRepository
            .findByShortCodeAndClickedAtBetween(shortCode, yesterday, LocalDateTime.now());
        
        boolean isUnique = recentClicks.stream()
            .noneMatch(click -> ipAddress.equals(click.getIpAddress()));
        analytics.setUniqueClick(isUnique);
        
        // Save analytics
        ClickAnalytics saved = clickAnalyticsRepository.save(analytics);
        
        // Update URL statistics
        updateUrlStatistics(shortenedUrl, analytics);
        
        return saved;
    }
    
    public Map<String, Object> getUrlAnalytics(String shortCode, String userId) {
        // Verify ownership
        Optional<ShortenedUrl> urlOpt = shortenedUrlRepository.findByShortCode(shortCode);
        if (urlOpt.isEmpty()) {
            throw new RuntimeException("Short URL not found");
        }
        
        ShortenedUrl url = urlOpt.get();
        if (!url.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to view analytics");
        }
        
        Map<String, Object> analytics = new HashMap<>();
        
        // Basic statistics
        analytics.put("totalClicks", url.getTotalClicks());
        analytics.put("uniqueClicks", url.getUniqueClicks());
        analytics.put("todayClicks", url.getTodayClicks());
        analytics.put("thisWeekClicks", url.getThisWeekClicks());
        analytics.put("thisMonthClicks", url.getThisMonthClicks());
        
        // Geographic data
        analytics.put("clicksByCountry", url.getClicksByCountry());
        analytics.put("clicksByCity", url.getClicksByCity());
        
        // Device data
        analytics.put("clicksByDevice", url.getClicksByDevice());
        analytics.put("clicksByBrowser", url.getClicksByBrowser());
        analytics.put("clicksByOS", url.getClicksByOS());
        
        // Referrer data
        analytics.put("clicksByReferrer", url.getClicksByReferrer());
        
        // Time-based data
        analytics.put("clicksByHour", url.getClicksByHour());
        analytics.put("clicksByDay", url.getClicksByDay());
        
        // Recent activity
        LocalDateTime last7Days = LocalDateTime.now().minus(7, ChronoUnit.DAYS);
        List<ClickAnalytics> recentClicks = clickAnalyticsRepository
            .findByShortCodeAndClickedAtBetween(shortCode, last7Days, LocalDateTime.now());
        
        Map<String, Long> dailyClicks = recentClicks.stream()
            .collect(Collectors.groupingBy(
                click -> click.getClickedAt().toLocalDate().toString(),
                Collectors.counting()
            ));
        
        analytics.put("last7DaysClicks", dailyClicks);
        
        return analytics;
    }
    
    public Map<String, Object> getUserAnalytics(String userId) {
        // Get user's URLs
        List<ShortenedUrl> userUrls = shortenedUrlRepository.findByUserId(userId);
        
        Map<String, Object> analytics = new HashMap<>();
        
        // Overall statistics
        int totalUrls = userUrls.size();
        int totalClicks = userUrls.stream().mapToInt(ShortenedUrl::getTotalClicks).sum();
        int totalUniqueClicks = userUrls.stream().mapToInt(ShortenedUrl::getUniqueClicks).sum();
        
        analytics.put("totalUrls", totalUrls);
        analytics.put("totalClicks", totalClicks);
        analytics.put("totalUniqueClicks", totalUniqueClicks);
        
        // Top performing URLs
        List<Map<String, Object>> topUrls = userUrls.stream()
            .sorted((a, b) -> Integer.compare(b.getTotalClicks(), a.getTotalClicks()))
            .limit(10)
            .map(url -> {
                Map<String, Object> urlData = new HashMap<>();
                urlData.put("shortCode", url.getShortCode());
                urlData.put("originalUrl", url.getOriginalUrl());
                urlData.put("title", url.getTitle());
                urlData.put("totalClicks", url.getTotalClicks());
                urlData.put("createdAt", url.getCreatedAt());
                return urlData;
            })
            .collect(Collectors.toList());
        
        analytics.put("topUrls", topUrls);
        
        // Aggregate geographic data
        Map<String, Integer> allCountries = new HashMap<>();
        Map<String, Integer> allDevices = new HashMap<>();
        Map<String, Integer> allBrowsers = new HashMap<>();
        
        for (ShortenedUrl url : userUrls) {
            url.getClicksByCountry().forEach((country, count) -> 
                allCountries.merge(country, count, Integer::sum));
            url.getClicksByDevice().forEach((device, count) -> 
                allDevices.merge(device, count, Integer::sum));
            url.getClicksByBrowser().forEach((browser, count) -> 
                allBrowsers.merge(browser, count, Integer::sum));
        }
        
        analytics.put("clicksByCountry", allCountries);
        analytics.put("clicksByDevice", allDevices);
        analytics.put("clicksByBrowser", allBrowsers);
        
        // Recent activity (last 30 days)
        LocalDateTime last30Days = LocalDateTime.now().minus(30, ChronoUnit.DAYS);
        List<ClickAnalytics> recentClicks = clickAnalyticsRepository
            .findByUserIdAndClickedAtBetween(userId, last30Days, LocalDateTime.now());
        
        Map<String, Long> dailyActivity = recentClicks.stream()
            .collect(Collectors.groupingBy(
                click -> click.getClickedAt().toLocalDate().toString(),
                Collectors.counting()
            ));
        
        analytics.put("last30DaysActivity", dailyActivity);
        
        return analytics;
    }
    
    public Map<String, Object> getRealtimeAnalytics(String userId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();
        LocalDateTime hourStart = now.truncatedTo(ChronoUnit.HOURS);
        
        // Get today's clicks for user
        List<ClickAnalytics> todayClicks = clickAnalyticsRepository
            .findByUserIdAndClickedAtBetween(userId, todayStart, now);
        
        // Get this hour's clicks
        List<ClickAnalytics> thisHourClicks = clickAnalyticsRepository
            .findByUserIdAndClickedAtBetween(userId, hourStart, now);
        
        Map<String, Object> realtime = new HashMap<>();
        realtime.put("clicksToday", todayClicks.size());
        realtime.put("clicksThisHour", thisHourClicks.size());
        realtime.put("uniqueClicksToday", todayClicks.stream()
            .collect(Collectors.groupingBy(ClickAnalytics::getIpAddress))
            .size());
        
        // Recent clicks (last 10)
        List<ClickAnalytics> recentClicks = clickAnalyticsRepository
            .findByUserId(userId)
            .stream()
            .sorted((a, b) -> b.getClickedAt().compareTo(a.getClickedAt()))
            .limit(10)
            .collect(Collectors.toList());
        
        List<Map<String, Object>> recentActivity = recentClicks.stream()
            .map(click -> {
                Map<String, Object> activity = new HashMap<>();
                activity.put("shortCode", click.getShortCode());
                activity.put("country", click.getCountry());
                activity.put("deviceType", click.getDeviceType());
                activity.put("browser", click.getBrowser());
                activity.put("clickedAt", click.getClickedAt());
                return activity;
            })
            .collect(Collectors.toList());
        
        realtime.put("recentActivity", recentActivity);
        realtime.put("timestamp", now);
        
        return realtime;
    }
    
    private void updateUrlStatistics(ShortenedUrl url, ClickAnalytics analytics) {
        // Update basic counters
        url.setTotalClicks(url.getTotalClicks() + 1);
        if (analytics.isUniqueClick()) {
            url.setUniqueClicks(url.getUniqueClicks() + 1);
        }
        
        // Update time-based counters
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();
        LocalDateTime weekStart = now.minus(7, ChronoUnit.DAYS);
        LocalDateTime monthStart = now.minus(30, ChronoUnit.DAYS);
        
        if (analytics.getClickedAt().isAfter(todayStart)) {
            url.setTodayClicks(url.getTodayClicks() + 1);
        }
        if (analytics.getClickedAt().isAfter(weekStart)) {
            url.setThisWeekClicks(url.getThisWeekClicks() + 1);
        }
        if (analytics.getClickedAt().isAfter(monthStart)) {
            url.setThisMonthClicks(url.getThisMonthClicks() + 1);
        }
        
        // Update geographic data
        if (analytics.getCountry() != null) {
            url.getClicksByCountry().merge(analytics.getCountry(), 1, Integer::sum);
        }
        if (analytics.getCity() != null) {
            url.getClicksByCity().merge(analytics.getCity(), 1, Integer::sum);
        }
        
        // Update device data
        if (analytics.getDeviceType() != null) {
            url.getClicksByDevice().merge(analytics.getDeviceType(), 1, Integer::sum);
        }
        if (analytics.getBrowser() != null) {
            url.getClicksByBrowser().merge(analytics.getBrowser(), 1, Integer::sum);
        }
        if (analytics.getOperatingSystem() != null) {
            url.getClicksByOS().merge(analytics.getOperatingSystem(), 1, Integer::sum);
        }
        
        // Update referrer data
        if (analytics.getReferrerDomain() != null) {
            url.getClicksByReferrer().merge(analytics.getReferrerDomain(), 1, Integer::sum);
        }
        
        // Update time-based data
        String hourKey = String.valueOf(now.getHour());
        String dayKey = now.getDayOfWeek().toString();
        
        url.getClicksByHour().merge(hourKey, 1, Integer::sum);
        url.getClicksByDay().merge(dayKey, 1, Integer::sum);
        
        url.setLastClickedAt(now);
        url.setUpdatedAt(now);
        
        shortenedUrlRepository.save(url);
    }
    
    private String determineReferrerType(String domain) {
        if (domain == null) return "DIRECT";
        
        domain = domain.toLowerCase();
        
        if (domain.contains("google") || domain.contains("bing") || domain.contains("yahoo")) {
            return "SEARCH";
        } else if (domain.contains("facebook") || domain.contains("twitter") || 
                  domain.contains("linkedin") || domain.contains("instagram")) {
            return "SOCIAL";
        } else if (domain.contains("gmail") || domain.contains("outlook") || 
                  domain.contains("mail")) {
            return "EMAIL";
        } else {
            return "WEBSITE";
        }
    }
}