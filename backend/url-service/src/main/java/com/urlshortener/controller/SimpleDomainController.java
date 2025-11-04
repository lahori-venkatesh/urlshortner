package com.urlshortener.controller;

import com.urlshortener.model.Domain;
import com.urlshortener.repository.DomainRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/domains-simple")
@CrossOrigin(origins = "*")
public class SimpleDomainController {
    
    private static final Logger logger = LoggerFactory.getLogger(SimpleDomainController.class);
    
    @Autowired(required = false)
    private DomainRepository domainRepository;
    
    /**
     * Simple test endpoint to check if domain functionality works
     */
    @GetMapping("/test")
    public ResponseEntity<?> testEndpoint() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Domain controller is working");
        response.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get domains for current user - simplified version
     */
    @GetMapping("/my")
    public ResponseEntity<?> getMyDomainsSimple(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (authentication == null) {
                response.put("success", false);
                response.put("message", "Authentication required");
                return ResponseEntity.status(401).body(response);
            }
            
            String currentUserId = authentication.getName();
            logger.info("Getting domains for user: {}", currentUserId);
            
            if (domainRepository == null) {
                logger.warn("DomainRepository is null - returning empty list");
                response.put("success", true);
                response.put("domains", List.of());
                response.put("message", "Domain repository not available - returning empty list");
                return ResponseEntity.ok(response);
            }
            
            // Try to get domains from repository
            List<Domain> domains = domainRepository.findByOwnerIdAndOwnerType(currentUserId, "USER");
            
            response.put("success", true);
            response.put("domains", domains);
            response.put("count", domains.size());
            response.put("userId", currentUserId);
            
            logger.info("Found {} domains for user {}", domains.size(), currentUserId);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching domains", e);
            response.put("success", false);
            response.put("message", "Error fetching domains: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Add a simple domain - for testing
     */
    @PostMapping("/add-simple")
    public ResponseEntity<?> addSimpleDomain(
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (authentication == null) {
                response.put("success", false);
                response.put("message", "Authentication required");
                return ResponseEntity.status(401).body(response);
            }
            
            String currentUserId = authentication.getName();
            String domainName = request.get("domainName");
            
            if (domainName == null || domainName.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Domain name is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (domainRepository == null) {
                response.put("success", false);
                response.put("message", "Domain repository not available");
                return ResponseEntity.status(500).body(response);
            }
            
            // Create a simple domain
            Domain domain = new Domain(domainName.trim().toLowerCase(), "USER", currentUserId, "test-token-" + System.currentTimeMillis());
            
            Domain savedDomain = domainRepository.save(domain);
            
            response.put("success", true);
            response.put("domain", savedDomain);
            response.put("message", "Domain added successfully");
            
            logger.info("Added domain {} for user {}", domainName, currentUserId);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error adding domain", e);
            response.put("success", false);
            response.put("message", "Error adding domain: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Health check for domain service
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        
        response.put("success", true);
        response.put("service", "SimpleDomainController");
        response.put("status", "healthy");
        response.put("repositoryAvailable", domainRepository != null);
        
        if (domainRepository != null) {
            try {
                long count = domainRepository.count();
                response.put("totalDomains", count);
            } catch (Exception e) {
                response.put("repositoryError", e.getMessage());
            }
        }
        
        return ResponseEntity.ok(response);
    }
}