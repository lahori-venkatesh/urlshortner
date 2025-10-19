package com.urlshortener.controller;

import com.urlshortener.model.ShortenedUrl;
import com.urlshortener.service.UrlShorteningService;
import com.urlshortener.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/urls")
@CrossOrigin(origins = "*")
public class UrlController {
    
    @Autowired
    private UrlShorteningService urlShorteningService;
    
    @Autowired
    private AnalyticsService analyticsService;
    
    @PostMapping("/{shortCode}/redirect")
    public ResponseEntity<Map<String, Object>> handleRedirect(
            @PathVariable String shortCode,
            @RequestBody(required = false) Map<String, Object> request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<ShortenedUrl> urlOpt = urlShorteningService.getByShortCode(shortCode);
            
            if (urlOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "URL not found");
                return ResponseEntity.status(404).body(response);
            }
            
            ShortenedUrl url = urlOpt.get();
            
            // Check if URL is active
            if (!url.isActive()) {
                response.put("success", false);
                response.put("message", "URL is no longer active");
                return ResponseEntity.status(404).body(response);
            }
            
            // Check if URL has expired
            if (url.getExpiresAt() != null && url.getExpiresAt().isBefore(LocalDateTime.now())) {
                response.put("success", false);
                response.put("message", "URL has expired");
                return ResponseEntity.status(410).body(response);
            }
            
            // Check password protection
            if (url.isPasswordProtected()) {
                String providedPassword = request != null ? (String) request.get("password") : null;
                
                if (providedPassword == null || !providedPassword.equals(url.getPassword())) {
                    response.put("success", false);
                    response.put("message", "Password required");
                    response.put("passwordRequired", true);
                    return ResponseEntity.status(401).body(response);
                }
            }
            
            // Record analytics (if enabled)
            if (url.isTrackClicks() && request != null) {
                // You can add analytics recording here
                urlShorteningService.incrementClicks(shortCode);
            }
            
            // Return the original URL
            Map<String, Object> urlData = new HashMap<>();
            urlData.put("originalUrl", url.getOriginalUrl());
            urlData.put("shortCode", url.getShortCode());
            urlData.put("title", url.getTitle());
            
            response.put("success", true);
            response.put("data", urlData);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createShortUrl(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String originalUrl = (String) request.get("originalUrl");
            String userId = (String) request.get("userId");
            String customAlias = (String) request.get("customAlias");
            String password = (String) request.get("password");
            Integer expirationDays = (Integer) request.get("expirationDays");
            String title = (String) request.get("title");
            String description = (String) request.get("description");
            
            if (originalUrl == null || originalUrl.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Original URL is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            ShortenedUrl shortenedUrl = urlShorteningService.createShortUrl(
                originalUrl, userId, customAlias, password, expirationDays, title, description
            );
            
            Map<String, Object> urlData = new HashMap<>();
            urlData.put("id", shortenedUrl.getId());
            urlData.put("shortCode", shortenedUrl.getShortCode());
            urlData.put("shortUrl", shortenedUrl.getShortUrl());
            urlData.put("originalUrl", shortenedUrl.getOriginalUrl());
            urlData.put("title", shortenedUrl.getTitle());
            urlData.put("description", shortenedUrl.getDescription());
            urlData.put("createdAt", shortenedUrl.getCreatedAt());
            urlData.put("expiresAt", shortenedUrl.getExpiresAt());
            urlData.put("isPasswordProtected", shortenedUrl.isPasswordProtected());
            
            response.put("success", true);
            response.put("message", "URL shortened successfully");
            response.put("data", urlData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/info/{shortCode}")
    public ResponseEntity<Map<String, Object>> getUrl(@PathVariable String shortCode) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<ShortenedUrl> urlOpt = urlShorteningService.getByShortCode(shortCode);
            
            if (urlOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "URL not found");
                return ResponseEntity.notFound().build();
            }
            
            ShortenedUrl url = urlOpt.get();
            
            Map<String, Object> urlData = new HashMap<>();
            urlData.put("id", url.getId());
            urlData.put("shortCode", url.getShortCode());
            urlData.put("shortUrl", url.getShortUrl());
            urlData.put("originalUrl", url.getOriginalUrl());
            urlData.put("title", url.getTitle());
            urlData.put("description", url.getDescription());
            urlData.put("totalClicks", url.getTotalClicks());
            urlData.put("createdAt", url.getCreatedAt());
            urlData.put("isPasswordProtected", url.isPasswordProtected());
            
            response.put("success", true);
            response.put("data", urlData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserUrls(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<ShortenedUrl> urls = urlShorteningService.getUserUrls(userId);
            
            List<Map<String, Object>> urlsData = urls.stream().map(url -> {
                Map<String, Object> urlData = new HashMap<>();
                urlData.put("id", url.getId());
                urlData.put("shortCode", url.getShortCode());
                urlData.put("shortUrl", url.getShortUrl());
                urlData.put("originalUrl", url.getOriginalUrl());
                urlData.put("title", url.getTitle());
                urlData.put("description", url.getDescription());
                urlData.put("totalClicks", url.getTotalClicks());
                urlData.put("uniqueClicks", url.getUniqueClicks());
                urlData.put("createdAt", url.getCreatedAt());
                urlData.put("lastClickedAt", url.getLastClickedAt());
                urlData.put("isPasswordProtected", url.isPasswordProtected());
                urlData.put("hasQrCode", url.isHasQrCode());
                return urlData;
            }).toList();
            
            response.put("success", true);
            response.put("count", urls.size());
            response.put("data", urlsData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PutMapping("/{shortCode}")
    public ResponseEntity<Map<String, Object>> updateUrl(@PathVariable String shortCode, 
                                                        @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String userId = (String) request.get("userId");
            
            if (userId == null) {
                response.put("success", false);
                response.put("message", "User ID is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            ShortenedUrl updates = new ShortenedUrl();
            if (request.containsKey("title")) updates.setTitle((String) request.get("title"));
            if (request.containsKey("description")) updates.setDescription((String) request.get("description"));
            if (request.containsKey("password")) updates.setPassword((String) request.get("password"));
            
            ShortenedUrl updated = urlShorteningService.updateUrl(shortCode, userId, updates);
            
            response.put("success", true);
            response.put("message", "URL updated successfully");
            response.put("data", Map.of(
                "shortCode", updated.getShortCode(),
                "title", updated.getTitle(),
                "description", updated.getDescription(),
                "updatedAt", updated.getUpdatedAt()
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @DeleteMapping("/{shortCode}")
    public ResponseEntity<Map<String, Object>> deleteUrl(@PathVariable String shortCode,
                                                        @RequestParam String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            urlShorteningService.deleteUrl(shortCode, userId);
            
            response.put("success", true);
            response.put("message", "URL deleted successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/{shortCode}/click")
    public ResponseEntity<Map<String, Object>> recordClick(@PathVariable String shortCode,
                                                          @RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String ipAddress = request.get("ipAddress");
            String userAgent = request.get("userAgent");
            String referrer = request.get("referrer");
            String country = request.get("country");
            String city = request.get("city");
            String deviceType = request.get("deviceType");
            String browser = request.get("browser");
            String os = request.get("os");
            
            analyticsService.recordClick(shortCode, ipAddress, userAgent, referrer, 
                                       country, city, deviceType, browser, os);
            
            response.put("success", true);
            response.put("message", "Click recorded successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}