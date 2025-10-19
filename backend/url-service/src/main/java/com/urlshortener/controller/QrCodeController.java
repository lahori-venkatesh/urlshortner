package com.urlshortener.controller;

import com.urlshortener.model.QrCode;
import com.urlshortener.service.QrCodeService;
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
            
            if (content == null || content.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Content is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            QrCode qrCode = qrCodeService.createQrCode(
                content, contentType != null ? contentType : "TEXT", userId,
                title, description, style, foregroundColor, backgroundColor,
                size != null ? size : 300, format != null ? format : "PNG"
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
            Optional<QrCode> qrCodeOpt = qrCodeService.getByQrCode(qrCodeId);
            
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
            qrData.put("totalScans", qrCode.getTotalScans());
            qrData.put("createdAt", qrCode.getCreatedAt());
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
            List<QrCode> qrCodes = qrCodeService.getUserQrCodes(userId);
            
            List<Map<String, Object>> qrCodesData = qrCodes.stream().map(qr -> {
                Map<String, Object> qrData = new HashMap<>();
                qrData.put("id", qr.getId());
                qrData.put("qrCode", qr.getQrCode());
                qrData.put("qrImageUrl", qr.getQrImageUrl());
                qrData.put("content", qr.getContent());
                qrData.put("contentType", qr.getContentType());
                qrData.put("title", qr.getTitle());
                qrData.put("description", qr.getDescription());
                qrData.put("totalScans", qr.getTotalScans());
                qrData.put("uniqueScans", qr.getUniqueScans());
                qrData.put("createdAt", qr.getCreatedAt());
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
            
            QrCode updated = qrCodeService.updateQrCode(qrCodeId, userId, updates);
            
            response.put("success", true);
            response.put("message", "QR Code updated successfully");
            response.put("data", Map.of(
                "qrCode", updated.getQrCode(),
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
}