package com.urlshortener.controller;

import com.urlshortener.dto.response.ApiResponse;
import com.urlshortener.service.SystemHealthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/system")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSystemController {

    @Autowired
    private SystemHealthService systemHealthService;

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSystemHealth() {
        try {
            Map<String, Object> healthData = systemHealthService.getCompleteSystemHealth();
            return ResponseEntity.ok(ApiResponse.success(healthData));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("Failed to fetch system health: " + e.getMessage()));
        }
    }

    @GetMapping("/health/mongodb")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMongoDBHealth() {
        try {
            Map<String, Object> mongoHealth = systemHealthService.getMongoDBHealth();
            return ResponseEntity.ok(ApiResponse.success(mongoHealth));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("Failed to fetch MongoDB health: " + e.getMessage()));
        }
    }

    @GetMapping("/health/services")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getExternalServicesHealth() {
        try {
            Map<String, Object> servicesHealth = systemHealthService.getExternalServicesHealth();
            return ResponseEntity.ok(ApiResponse.success(servicesHealth));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.error("Failed to fetch services health: " + e.getMessage()));
        }
    }
}