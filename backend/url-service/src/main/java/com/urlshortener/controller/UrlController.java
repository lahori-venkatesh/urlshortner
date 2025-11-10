package com.urlshortener.controller;

import com.urlshortener.annotation.RequiresPlan;
import com.urlshortener.model.ShortenedUrl;
import com.urlshortener.service.UrlShorteningService;
import com.urlshortener.service.AnalyticsService;
import com.urlshortener.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
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
    
    @Autowired
    private DashboardService dashboardService;
    
    @PostMapping("/fix-urls")
    public ResponseEntity<Map<String, Object>> fixExistingUrls() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // This is a one-time migration endpoint to fix existing URLs
            // You can call this once after deployment to update existing records
            
            response.put("success", true);
            response.put("message", "URL migration completed - this feature needs to be implemented in the service layer");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Migration failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }

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
            
            // Check if max clicks limit has been reached
            if (url.getMaxClicks() != null && url.getTotalClicks() >= url.getMaxClicks()) {
                response.put("success", false);
                response.put("message", "URL has reached its maximum click limit");
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
    @RequiresPlan(feature = "urlCreation", checkLimit = true)
    public ResponseEntity<Map<String, Object>> createShortUrl(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String originalUrl = (String) request.get("originalUrl");
            String userId = (String) request.get("userId");
            String customAlias = (String) request.get("customAlias");
            String password = (String) request.get("password");
            
            // Safe integer conversion with better error handling
            Integer expirationDays = null;
            Integer maxClicks = null;
            
            try {
                Object expDaysObj = request.get("expirationDays");
                if (expDaysObj != null) {
                    if (expDaysObj instanceof Integer) {
                        expirationDays = (Integer) expDaysObj;
                    } else if (expDaysObj instanceof String && !((String) expDaysObj).isEmpty()) {
                        expirationDays = Integer.parseInt((String) expDaysObj);
                    } else if (expDaysObj instanceof Number) {
                        expirationDays = ((Number) expDaysObj).intValue();
                    }
                }
            } catch (Exception e) {
                System.err.println("⚠️ Failed to parse expirationDays: " + e.getMessage());
            }
            
            try {
                Object maxClicksObj = request.get("maxClicks");
                if (maxClicksObj != null) {
                    if (maxClicksObj instanceof Integer) {
                        maxClicks = (Integer) maxClicksObj;
                    } else if (maxClicksObj instanceof String && !((String) maxClicksObj).isEmpty()) {
                        maxClicks = Integer.parseInt((String) maxClicksObj);
                    } else if (maxClicksObj instanceof Number) {
                        maxClicks = ((Number) maxClicksObj).intValue();
                    }
                }
            } catch (Exception e) {
                System.err.println("⚠️ Failed to parse maxClicks: " + e.getMessage());
            }
            
            String title = (String) request.get("title");
            String description = (String) request.get("description");
            String scopeType = (String) request.getOrDefault("scopeType", "USER");
            String scopeId = (String) request.getOrDefault("scopeId", userId);
            String customDomain = (String) request.get("customDomain"); // New: custom domain support
            
            System.out.println("🔍 Creating URL with params:");
            System.out.println("  - originalUrl: " + originalUrl);
            System.out.println("  - userId: " + userId);
            System.out.println("  - customAlias: " + customAlias);
            System.out.println("  - password: " + (password != null && !password.isEmpty() ? "***" : "null"));
            System.out.println("  - expirationDays: " + expirationDays);
            System.out.println("  - maxClicks: " + maxClicks);
            System.out.println("  - customDomain: " + customDomain);
            
            if (originalUrl == null || originalUrl.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Original URL is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Note: Premium feature validation is handled by @RequiresPlan aspect
            // Additional premium features like customAlias, password, expiration, maxClicks
            // are validated in the service layer based on user's plan
            
            ShortenedUrl shortenedUrl = urlShorteningService.createShortUrl(
                originalUrl, userId, customAlias, password, expirationDays, maxClicks, title, description, scopeType, scopeId, customDomain
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
            urlData.put("maxClicks", shortenedUrl.getMaxClicks());
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
            // Use cached dashboard service for better performance
            List<ShortenedUrl> urls = dashboardService.getUserUrls(userId);
            
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
    
    @PostMapping("/bulk-delete")
    public ResponseEntity<Map<String, Object>> bulkDeleteUrls(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            @SuppressWarnings("unchecked")
            List<String> shortCodes = (List<String>) request.get("shortCodes");
            String userId = (String) request.get("userId");
            
            if (shortCodes == null || shortCodes.isEmpty()) {
                response.put("success", false);
                response.put("message", "No URLs selected for deletion");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (userId == null || userId.isEmpty()) {
                response.put("success", false);
                response.put("message", "User ID is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            int successCount = 0;
            int failCount = 0;
            List<String> errors = new ArrayList<>();
            
            for (String shortCode : shortCodes) {
                try {
                    urlShorteningService.deleteUrl(shortCode, userId);
                    successCount++;
                } catch (Exception e) {
                    failCount++;
                    errors.add(shortCode + ": " + e.getMessage());
                }
            }
            
            response.put("success", true);
            response.put("message", String.format("Deleted %d URLs successfully", successCount));
            response.put("successCount", successCount);
            response.put("failCount", failCount);
            if (!errors.isEmpty()) {
                response.put("errors", errors);
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Bulk delete failed: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
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
    
    // Team-scoped endpoints
    @GetMapping("/scope/{scopeType}/{scopeId}")
    public ResponseEntity<Map<String, Object>> getUrlsByScope(
            @PathVariable String scopeType, 
            @PathVariable String scopeId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<ShortenedUrl> urls = urlShorteningService.getUrlsByScope(scopeType, scopeId);
            
            response.put("success", true);
            response.put("urls", urls);
            response.put("count", urls.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}