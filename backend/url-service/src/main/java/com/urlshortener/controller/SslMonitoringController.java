package com.urlshortener.controller;

import com.urlshortener.service.CloudflareSaasService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * SSL Monitoring Controller
 * Monitor Cloudflare SaaS SSL usage and status
 */
@RestController
@RequestMapping("/api/v1/admin/ssl")
@CrossOrigin(origins = "*")
public class SslMonitoringController {
    
    @Autowired
    private CloudflareSaasService cloudflareSaasService;
    
    /**
     * Get SSL usage statistics
     * Shows how many of the 100 free hostnames are used
     */
    @GetMapping("/usage")
    public ResponseEntity<Map<String, Object>> getUsageStats() {
        try {
            Map<String, Object> stats = cloudflareSaasService.getUsageStats();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "stats", stats
            ));
            
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Failed to get usage stats: " + e.getMessage()
            ));
        }
    }
    
    /**
     * List all custom hostnames
     */
    @GetMapping("/hostnames")
    public ResponseEntity<Map<String, Object>> listHostnames() {
        try {
            List<Map<String, Object>> hostnames = cloudflareSaasService.listAllCustomHostnames();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "count", hostnames.size(),
                "hostnames", hostnames
            ));
            
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Failed to list hostnames: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Check if we've reached the free tier limit
     */
    @GetMapping("/limit-check")
    public ResponseEntity<Map<String, Object>> checkLimit() {
        try {
            boolean atLimit = cloudflareSaasService.hasReachedLimit();
            Map<String, Object> stats = cloudflareSaasService.getUsageStats();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "atLimit", atLimit,
                "total", stats.get("total"),
                "limit", stats.get("limit"),
                "remaining", stats.get("remaining")
            ));
            
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                "success", false,
                "message", "Failed to check limit: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Health check for Cloudflare SaaS integration
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        try {
            // Try to list hostnames to verify API connection
            List<Map<String, Object>> hostnames = cloudflareSaasService.listAllCustomHostnames();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "status", "healthy",
                "message", "Cloudflare SaaS SSL is working",
                "hostnameCount", hostnames.size()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of(
                "success", false,
                "status", "unhealthy",
                "message", "Cloudflare SaaS SSL connection failed: " + e.getMessage()
            ));
        }
    }
}
