package com.urlshortener.controller;

import com.urlshortener.model.QrCode;
import com.urlshortener.service.QrCodeService;
import com.urlshortener.service.DashboardService;
import com.urlshortener.service.SubscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/qr")
@CrossOrigin(origins = "*")
public class QrCodeController {
    
    @Autowired
    private QrCodeService qrCodeService;
    
    @Autowired
    private SubscriptionService subscriptionService;
    
    @Autowired
    private DashboardService dashboardService;
    
    @PostMapping
    public ResponseEntity<Map<String, Object>> createQrCode(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String content = (String) request.get("content");
            String contentType = (String) request.get("contentType");
            String userId = (String) request.get("userId");
            String title = (String) request.get("title");
            String description = (String) request.get("description");
            String style = (String) request.get("style");
            String foregroundColor = (String) request.get("foregroundColor");
            String backgroundColor = (String) request.get("backgroundColor");
            Integer size = (Integer) request.get("size");
            String format = (String) request.get("format");
            String scopeType = (String) request.getOrDefault("scopeType", "USER");
            String scopeId = (String) request.getOrDefault("scopeId", userId);
            
            if (content == null || content.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Content is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Check subscription limits
            if (userId != null && !subscriptionService.canCreateQrCode(userId)) {
                int remaining = subscriptionService.getRemainingDailyQrCodes(userId);
                response.put("success", false);
                response.put("message", "Daily QR code limit reached. You have " + remaining + " QR codes remaining today. Upgrade to Premium for unlimited access.");
                response.put("upgradeRequired", true);
                return ResponseEntity.status(429).body(response);
            }
            
            // Check premium features
            boolean hasCustomization = (foregroundColor != null && !foregroundColor.equals("#000000")) ||
                                     (backgroundColor != null && !backgroundColor.equals("#FFFFFF")) ||
                                     (style != null && !style.equals("square"));
            
            if (userId != null && hasCustomization && !subscriptionService.canCustomizeQrCodes(userId)) {
                response.put("success", false);
                response.put("message", "QR code customization is available with Premium plans only.");
                response.put("upgradeRequired", true);
                return ResponseEntity.status(403).body(response);
            }
            
            QrCode qrCode = qrCodeService.createQrCode(
                content, contentType != null ? contentType : "TEXT", userId,
                title, description, style, foregroundColor, backgroundColor,
                size != null ? size : 300, format != null ? format : "PNG",
                scopeType, scopeId
            );
            
            Map<String, Object> qrData = new HashMap<>();
            qrData.put("id", qrCode.getId());
            qrData.put("qrCode", qrCode.getQrCode());
            qrData.put("qrImageUrl", qrCode.getQrImageUrl());
            qrData.put("qrImagePath", qrCode.getQrImagePath());
            qrData.put("content", qrCode.getContent());
            qrData.put("contentType", qrCode.getContentType());
            qrData.put("title", qrCode.getTitle());
            qrData.put("description", qrCode.getDescription());
            qrData.put("style", qrCode.getStyle());
            qrData.put("size", qrCode.getSize());
            qrData.put("format", qrCode.getFormat());
            qrData.put("createdAt", qrCode.getCreatedAt());
            
            // Track usage for subscription management
            if (userId != null) {
                subscriptionService.incrementQrCodeUsage(userId);
            }
            
            response.put("success", true);
            response.put("message", "QR Code created successfully");
            response.put("data", qrData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/{qrCodeId}")
    public ResponseEntity<Map<String, Object>> getQrCode(@PathVariable String qrCodeId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Try to find by QR code first, then by ID
            Optional<QrCode> qrCodeOpt = qrCodeService.getByQrCode(qrCodeId);
            if (qrCodeOpt.isEmpty()) {
                qrCodeOpt = qrCodeService.getById(qrCodeId);
            }
            
            if (qrCodeOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "QR Code not found");
                return ResponseEntity.notFound().build();
            }
            
            QrCode qrCode = qrCodeOpt.get();
            
            Map<String, Object> qrData = new HashMap<>();
            qrData.put("id", qrCode.getId());
            qrData.put("qrCode", qrCode.getQrCode());
            qrData.put("qrImageUrl", qrCode.getQrImageUrl());
            qrData.put("qrImagePath", qrCode.getQrImagePath());
            qrData.put("content", qrCode.getContent());
            qrData.put("contentType", qrCode.getContentType());
            qrData.put("title", qrCode.getTitle());
            qrData.put("description", qrCode.getDescription());
            qrData.put("style", qrCode.getStyle());
            qrData.put("foregroundColor", qrCode.getForegroundColor());
            qrData.put("backgroundColor", qrCode.getBackgroundColor());
            qrData.put("size", qrCode.getSize());
            qrData.put("format", qrCode.getFormat());
            qrData.put("totalScans", qrCode.getTotalScans());
            qrData.put("uniqueScans", qrCode.getUniqueScans());
            qrData.put("todayScans", qrCode.getTodayScans());
            qrData.put("thisWeekScans", qrCode.getThisWeekScans());
            qrData.put("thisMonthScans", qrCode.getThisMonthScans());
            qrData.put("scansByCountry", qrCode.getScansByCountry());
            qrData.put("scansByCity", qrCode.getScansByCity());
            qrData.put("scansByDevice", qrCode.getScansByDevice());
            qrData.put("scansByBrowser", qrCode.getScansByBrowser());
            qrData.put("scansByOS", qrCode.getScansByOS());
            qrData.put("scansByHour", qrCode.getScansByHour());
            qrData.put("scansByDay", qrCode.getScansByDay());
            qrData.put("createdAt", qrCode.getCreatedAt());
            qrData.put("updatedAt", qrCode.getUpdatedAt());
            qrData.put("lastScannedAt", qrCode.getLastScannedAt());
            
            response.put("success", true);
            response.put("data", qrData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserQrCodes(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Use cached dashboard service for better performance
            List<QrCode> qrCodes = dashboardService.getUserQRCodes(userId);
            
            List<Map<String, Object>> qrCodesData = qrCodes.stream().map(qr -> {
                Map<String, Object> qrData = new HashMap<>();
                qrData.put("id", qr.getId());
                qrData.put("qrCode", qr.getQrCode());
                qrData.put("qrImageUrl", qr.getQrImageUrl());
                qrData.put("qrImagePath", qr.getQrImagePath());
                qrData.put("content", qr.getContent());
                qrData.put("contentType", qr.getContentType());
                qrData.put("title", qr.getTitle());
                qrData.put("description", qr.getDescription());
                qrData.put("style", qr.getStyle());
                qrData.put("foregroundColor", qr.getForegroundColor());
                qrData.put("backgroundColor", qr.getBackgroundColor());
                qrData.put("size", qr.getSize());
                qrData.put("format", qr.getFormat());
                qrData.put("totalScans", qr.getTotalScans());
                qrData.put("uniqueScans", qr.getUniqueScans());
                qrData.put("createdAt", qr.getCreatedAt());
                qrData.put("updatedAt", qr.getUpdatedAt());
                qrData.put("lastScannedAt", qr.getLastScannedAt());
                return qrData;
            }).toList();
            
            response.put("success", true);
            response.put("count", qrCodes.size());
            response.put("data", qrCodesData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PutMapping("/{qrCodeId}")
    public ResponseEntity<Map<String, Object>> updateQrCode(@PathVariable String qrCodeId,
                                                           @RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String userId = (String) request.get("userId");
            
            if (userId == null) {
                response.put("success", false);
                response.put("message", "User ID is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            QrCode updates = new QrCode();
            if (request.containsKey("title")) updates.setTitle((String) request.get("title"));
            if (request.containsKey("description")) updates.setDescription((String) request.get("description"));
            if (request.containsKey("content")) updates.setContent((String) request.get("content"));
            if (request.containsKey("contentType")) updates.setContentType((String) request.get("contentType"));
            if (request.containsKey("style")) updates.setStyle((String) request.get("style"));
            if (request.containsKey("foregroundColor")) updates.setForegroundColor((String) request.get("foregroundColor"));
            if (request.containsKey("backgroundColor")) updates.setBackgroundColor((String) request.get("backgroundColor"));
            if (request.containsKey("size")) updates.setSize((Integer) request.get("size"));
            if (request.containsKey("format")) updates.setFormat((String) request.get("format"));
            
            QrCode updated = qrCodeService.updateQrCode(qrCodeId, userId, updates);
            
            Map<String, Object> qrData = new HashMap<>();
            qrData.put("id", updated.getId());
            qrData.put("qrCode", updated.getQrCode());
            qrData.put("title", updated.getTitle());
            qrData.put("description", updated.getDescription());
            qrData.put("content", updated.getContent());
            qrData.put("contentType", updated.getContentType());
            qrData.put("style", updated.getStyle());
            qrData.put("foregroundColor", updated.getForegroundColor());
            qrData.put("backgroundColor", updated.getBackgroundColor());
            qrData.put("size", updated.getSize());
            qrData.put("format", updated.getFormat());
            qrData.put("updatedAt", updated.getUpdatedAt());
            
            response.put("success", true);
            response.put("message", "QR Code updated successfully");
            response.put("data", qrData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @DeleteMapping("/{qrCodeId}")
    public ResponseEntity<Map<String, Object>> deleteQrCode(@PathVariable String qrCodeId,
                                                           @RequestParam String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            qrCodeService.deleteQrCode(qrCodeId, userId);
            
            response.put("success", true);
            response.put("message", "QR Code deleted successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/{qrCodeId}/scan")
    public ResponseEntity<Map<String, Object>> recordScan(@PathVariable String qrCodeId,
                                                         @RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String ipAddress = request.get("ipAddress");
            String userAgent = request.get("userAgent");
            String country = request.get("country");
            String city = request.get("city");
            String deviceType = request.get("deviceType");
            
            qrCodeService.recordScan(qrCodeId, ipAddress, userAgent, country, city, deviceType);
            
            response.put("success", true);
            response.put("message", "Scan recorded successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/{qrCodeId}/redirect")
    public ResponseEntity<Map<String, Object>> handleQrRedirect(
            @PathVariable String qrCodeId,
            @RequestBody(required = false) Map<String, Object> request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<QrCode> qrCodeOpt = qrCodeService.getByQrCode(qrCodeId);
            
            if (qrCodeOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "QR Code not found");
                return ResponseEntity.status(404).body(response);
            }
            
            QrCode qrCode = qrCodeOpt.get();
            
            // Check if QR code is active
            if (!qrCode.isActive()) {
                response.put("success", false);
                response.put("message", "QR Code is no longer active");
                return ResponseEntity.status(404).body(response);
            }
            
            // Check if QR code has expired
            if (qrCode.getExpiresAt() != null && qrCode.getExpiresAt().isBefore(java.time.LocalDateTime.now())) {
                response.put("success", false);
                response.put("message", "QR Code has expired");
                return ResponseEntity.status(410).body(response);
            }
            
            // Record scan analytics (if enabled)
            if (qrCode.isTrackScans() && request != null) {
                String ipAddress = (String) request.get("ipAddress");
                String userAgent = (String) request.get("userAgent");
                String country = (String) request.get("country");
                String city = (String) request.get("city");
                String deviceType = (String) request.get("deviceType");
                
                qrCodeService.recordScan(qrCodeId, ipAddress, userAgent, country, city, deviceType);
            }
            
            // Return the QR code content
            Map<String, Object> qrData = new HashMap<>();
            qrData.put("content", qrCode.getContent());
            qrData.put("contentType", qrCode.getContentType());
            qrData.put("qrCode", qrCode.getQrCode());
            qrData.put("title", qrCode.getTitle());
            
            response.put("success", true);
            response.put("data", qrData);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    // Team-scoped endpoints
    @GetMapping("/scope/{scopeType}/{scopeId}")
    public ResponseEntity<Map<String, Object>> getQrCodesByScope(
            @PathVariable String scopeType, 
            @PathVariable String scopeId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<QrCode> qrCodes = qrCodeService.getQrCodesByScope(scopeType, scopeId);
            
            response.put("success", true);
            response.put("qrCodes", qrCodes);
            response.put("count", qrCodes.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}