package com.urlshortener.service;

import com.urlshortener.model.ShortenedUrl;
import com.urlshortener.model.QrCode;
import com.urlshortener.model.UploadedFile;
import com.urlshortener.repository.ShortenedUrlRepository;
import com.urlshortener.repository.QrCodeRepository;
import com.urlshortener.repository.UploadedFileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardService {
    
    private static final Logger logger = LoggerFactory.getLogger(DashboardService.class);
    
    @Autowired
    private ShortenedUrlRepository shortenedUrlRepository;
    
    @Autowired
    private QrCodeRepository qrCodeRepository;
    
    @Autowired
    private UploadedFileRepository uploadedFileRepository;
    
    @Autowired
    private AnalyticsService analyticsService;
    
    /**
     * Get comprehensive dashboard overview with caching
     */
    @Cacheable(value = "dashboardOverview", key = "#userId")
    public Map<String, Object> getDashboardOverview(String userId) {
        logger.debug("Generating dashboard overview for user: {}", userId);
        
        Map<String, Object> dashboard = new HashMap<>();
        
        // Get user's data
        List<ShortenedUrl> urls = shortenedUrlRepository.findByUserIdAndIsActiveTrue(userId);
        List<QrCode> qrCodes = qrCodeRepository.findByUserIdAndIsActiveTrue(userId);
        List<UploadedFile> files = uploadedFileRepository.findByUserIdAndIsActiveTrue(userId);
        
        // Basic statistics
        dashboard.put("totalLinks", urls.size());
        dashboard.put("totalQRCodes", qrCodes.size());
        dashboard.put("totalFiles", files.size());
        dashboard.put("shortLinks", urls.size());
        dashboard.put("qrCodeCount", qrCodes.size());
        dashboard.put("fileLinksCount", files.size());
        
        // Click statistics
        int totalClicks = urls.stream().mapToInt(ShortenedUrl::getTotalClicks).sum();
        int totalQRScans = qrCodes.stream().mapToInt(qr -> {
            Integer scans = qr.getTotalScans();
            return scans != null ? scans : 0;
        }).sum();
        int totalFileDownloads = files.stream().mapToInt(file -> {
            Integer downloads = file.getTotalDownloads();
            return downloads != null ? downloads : 0;
        }).sum();
        
        dashboard.put("totalClicks", totalClicks + totalQRScans + totalFileDownloads);
        
        // Time-based statistics
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = now.toLocalDate().atStartOfDay();
        LocalDateTime weekStart = now.minus(7, ChronoUnit.DAYS);
        
        int clicksToday = urls.stream()
            .filter(url -> url.getLastClickedAt() != null && url.getLastClickedAt().isAfter(todayStart))
            .mapToInt(ShortenedUrl::getTodayClicks)
            .sum();
        
        int clicksThisWeek = urls.stream()
            .filter(url -> url.getLastClickedAt() != null && url.getLastClickedAt().isAfter(weekStart))
            .mapToInt(ShortenedUrl::getThisWeekClicks)
            .sum();
        
        dashboard.put("clicksToday", clicksToday);
        dashboard.put("clicksThisWeek", clicksThisWeek);
        
        // Top performing link
        Optional<ShortenedUrl> topLink = urls.stream()
            .max(Comparator.comparing(ShortenedUrl::getTotalClicks));
        
        if (topLink.isPresent()) {
            Map<String, Object> topLinkData = new HashMap<>();
            ShortenedUrl link = topLink.get();
            topLinkData.put("shortUrl", link.getShortUrl());
            topLinkData.put("originalUrl", link.getOriginalUrl());
            topLinkData.put("clicks", link.getTotalClicks());
            topLinkData.put("title", link.getTitle());
            dashboard.put("topPerformingLink", topLinkData);
        }
        
        // Recent activity
        List<Map<String, Object>> recentActivity = new ArrayList<>();
        
        // Add recent URLs
        urls.stream()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .limit(5)
            .forEach(url -> {
                Map<String, Object> activity = new HashMap<>();
                activity.put("type", "link");
                activity.put("action", "created");
                activity.put("shortUrl", url.getShortUrl());
                activity.put("title", url.getTitle());
                activity.put("clicks", url.getTotalClicks());
                activity.put("timestamp", url.getCreatedAt());
                recentActivity.add(activity);
            });
        
        // Add recent QR codes
        qrCodes.stream()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .limit(3)
            .forEach(qr -> {
                Map<String, Object> activity = new HashMap<>();
                activity.put("type", "qr");
                activity.put("action", "generated");
                activity.put("title", qr.getTitle());
                activity.put("scans", qr.getTotalScans());
                activity.put("timestamp", qr.getCreatedAt());
                recentActivity.add(activity);
            });
        
        // Add recent files
        files.stream()
            .sorted((a, b) -> b.getUploadedAt().compareTo(a.getUploadedAt()))
            .limit(3)
            .forEach(file -> {
                Map<String, Object> activity = new HashMap<>();
                activity.put("type", "file");
                activity.put("action", "uploaded");
                activity.put("fileName", file.getOriginalFileName());
                activity.put("fileUrl", file.getFileUrl());
                activity.put("totalDownloads", file.getTotalDownloads());
                activity.put("fileSize", file.getFileSize());
                activity.put("timestamp", file.getUploadedAt());
                recentActivity.add(activity);
            });
        
        // Sort all activities by timestamp
        recentActivity.sort((a, b) -> {
            LocalDateTime timeA = (LocalDateTime) a.get("timestamp");
            LocalDateTime timeB = (LocalDateTime) b.get("timestamp");
            return timeB.compareTo(timeA);
        });
        
        dashboard.put("recentActivity", recentActivity.stream().limit(10).collect(Collectors.toList()));
        
        // Clicks over time (last 7 days)
        List<Map<String, Object>> clicksOverTime = generateClicksOverTime(urls, 7);
        dashboard.put("clicksOverTime", clicksOverTime);
        
        logger.debug("Generated dashboard overview for user: {} with {} links, {} QR codes, {} files", 
                    userId, urls.size(), qrCodes.size(), files.size());
        
        return dashboard;
    }
    
    /**
     * Get user's URLs with caching
     */
    @Cacheable(value = "userUrls", key = "#userId")
    public List<ShortenedUrl> getUserUrls(String userId) {
        logger.debug("Fetching URLs for user: {}", userId);
        return shortenedUrlRepository.findByUserIdAndIsActiveTrue(userId);
    }
    
    /**
     * Get user's QR codes with caching
     */
    @Cacheable(value = "userQRCodes", key = "#userId")
    public List<QrCode> getUserQRCodes(String userId) {
        logger.debug("Fetching QR codes for user: {}", userId);
        return qrCodeRepository.findByUserIdAndIsActiveTrue(userId);
    }
    
    /**
     * Get user's files with caching
     */
    @Cacheable(value = "userFiles", key = "#userId")
    public List<UploadedFile> getUserFiles(String userId) {
        logger.debug("Fetching files for user: {}", userId);
        return uploadedFileRepository.findByUserIdAndIsActiveTrue(userId);
    }
    
    /**
     * Get click counts for a specific URL with caching
     */
    @Cacheable(value = "clickCounts", key = "#shortCode")
    public Map<String, Object> getUrlClickCounts(String shortCode) {
        Optional<ShortenedUrl> urlOpt = shortenedUrlRepository.findByShortCode(shortCode);
        
        if (urlOpt.isEmpty()) {
            return Collections.emptyMap();
        }
        
        ShortenedUrl url = urlOpt.get();
        Map<String, Object> counts = new HashMap<>();
        counts.put("totalClicks", url.getTotalClicks());
        counts.put("uniqueClicks", url.getUniqueClicks());
        counts.put("todayClicks", url.getTodayClicks());
        counts.put("thisWeekClicks", url.getThisWeekClicks());
        counts.put("thisMonthClicks", url.getThisMonthClicks());
        counts.put("lastClickedAt", url.getLastClickedAt());
        
        return counts;
    }
    
    /**
     * Get country statistics with caching
     */
    @Cacheable(value = "countryStats", key = "#userId")
    public Map<String, Object> getCountryStats(String userId) {
        List<ShortenedUrl> urls = shortenedUrlRepository.findByUserIdAndIsActiveTrue(userId);
        
        Map<String, Integer> countryStats = new HashMap<>();
        Map<String, Integer> cityStats = new HashMap<>();
        
        for (ShortenedUrl url : urls) {
            if (url.getClicksByCountry() != null) {
                url.getClicksByCountry().forEach((country, count) -> 
                    countryStats.merge(country, count, Integer::sum));
            }
            if (url.getClicksByCity() != null) {
                url.getClicksByCity().forEach((city, count) -> 
                    cityStats.merge(city, count, Integer::sum));
            }
        }
        
        Map<String, Object> geoStats = new HashMap<>();
        geoStats.put("countries", countryStats);
        geoStats.put("cities", cityStats);
        geoStats.put("topCountry", getTopEntry(countryStats));
        geoStats.put("topCity", getTopEntry(cityStats));
        
        return geoStats;
    }
    
    private List<Map<String, Object>> generateClicksOverTime(List<ShortenedUrl> urls, int days) {
        List<Map<String, Object>> clicksOverTime = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();
        
        for (int i = days - 1; i >= 0; i--) {
            LocalDateTime date = now.minus(i, ChronoUnit.DAYS);
            String dateStr = date.toLocalDate().toString();
            
            // Calculate clicks for this day (simplified - in real implementation, 
            // you'd query click analytics for accurate daily data)
            int dayClicks = urls.stream()
                .filter(url -> url.getCreatedAt().toLocalDate().equals(date.toLocalDate()))
                .mapToInt(ShortenedUrl::getTotalClicks)
                .sum();
            
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", date.toLocalDate().toString());
            dayData.put("clicks", Math.max(dayClicks, 0));
            dayData.put("links", urls.stream()
                .filter(url -> url.getCreatedAt().toLocalDate().equals(date.toLocalDate()))
                .count());
            
            clicksOverTime.add(dayData);
        }
        
        return clicksOverTime;
    }
    
    private Map<String, Object> getTopEntry(Map<String, Integer> stats) {
        return stats.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(entry -> {
                Map<String, Object> top = new HashMap<>();
                top.put("name", entry.getKey());
                top.put("count", entry.getValue());
                return top;
            })
            .orElse(Collections.emptyMap());
    }
}