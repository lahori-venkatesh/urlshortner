package com.urlshortener.controller;

import com.urlshortener.annotation.RequiresPlan;
import com.urlshortener.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {
    
    @Autowired
    private AnalyticsService analyticsService;
    
    @GetMapping("/url/{shortCode}")
    @RequiresPlan(feature = "analytics")
    public ResponseEntity<Map<String, Object>> getUrlAnalytics(@PathVariable String shortCode,
                                                              @RequestParam String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Map<String, Object> analytics = analyticsService.getUrlAnalytics(shortCode, userId);
            
            response.put("success", true);
            response.put("data", analytics);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/user/{userId}")
    @RequiresPlan(feature = "analytics")
    public ResponseEntity<Map<String, Object>> getUserAnalytics(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Map<String, Object> analytics = analyticsService.getUserAnalytics(userId);
            
            response.put("success", true);
            response.put("data", analytics);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/realtime/{userId}")
    public ResponseEntity<Map<String, Object>> getRealtimeAnalytics(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Map<String, Object> analytics = analyticsService.getRealtimeAnalytics(userId);
            
            response.put("success", true);
            response.put("data", analytics);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}