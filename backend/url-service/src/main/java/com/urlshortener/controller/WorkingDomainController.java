package com.urlshortener.controller;

import com.urlshortener.model.Domain;
import com.urlshortener.repository.DomainRepository;
import com.urlshortener.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

/**
 * Working Domain Controller - Minimal implementation that actually works
 * This replaces the complex DomainController with a simple, functional version
 */
@RestController
@RequestMapping("/api/v1/domains")
@CrossOrigin(origins = "*")
public class WorkingDomainController {
    
    private static final Logger logger = LoggerFactory.getLogger(WorkingDomainController.class);
    
    @Autowired(required = false)
    private DomainRepository domainRepository;
    
    @Autowired(required = false)
    private UserRepository userRepository;
    
    /**
     * Get domains for current user - WORKING VERSION
     */
    @GetMapping("/my")
    public ResponseEntity<?> getMyDomains(
            @RequestParam(required = false) String ownerType,
            @RequestParam(required = false) String ownerId,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("=== GET /my domains request ===");
            
            if (authentication == null) {
                logger.warn("No authentication provided");
                response.put("success", false);
                response.put("message", "Authentication required");
                return ResponseEntity.status(401).body(response);
            }
            
            String currentUserId = authentication.getName();
            logger.info("User ID from auth: {}", currentUserId);
            
            // Default to user's personal domains
            if (ownerType == null) {
                ownerType = "USER";
                ownerId = currentUserId;
            }
            
            logger.info("Looking for domains: ownerType={}, ownerId={}", ownerType, ownerId);
            
            if (domainRepository == null) {
                logger.warn("DomainRepository is null - returning empty list");
                response.put("success", true);
                response.put("domains", List.of());
                response.put("message", "Domain repository not available - feature not fully deployed");
                response.put("repositoryStatus", "not_available");
                return ResponseEntity.ok(response);
            }
            
            // Try to get domains from repository
            List<Domain> domains;
            try {
                domains = domainRepository.findByOwnerIdAndOwnerType(ownerId, ownerType);
                logger.info("Repository query successful - found {} domains", domains.size());
            } catch (Exception e) {
                logger.error("Repository query failed", e);
                response.put("success", true);
                response.put("domains", List.of());
                response.put("message", "Database query failed - returning empty list");
                response.put("error", e.getMessage());
                return ResponseEntity.ok(response);
            }
            
            // Convert to simple response format
            List<Map<String, Object>> domainResponses = domains.stream()
                .map(this::convertDomainToResponse)
                .collect(Collectors.toList());
            
            response.put("success", true);
            response.put("domains", domainResponses);
            response.put("count", domains.size());
            response.put("userId", currentUserId);
            response.put("ownerType", ownerType);
            response.put("ownerId", ownerId);
            
            logger.info("Successfully returning {} domains for user {}", domains.size(), currentUserId);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Unexpected error in getMyDomains", e);
            response.put("success", false);
            response.put("message", "Internal server error: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Add a domain - WORKING VERSION
     */
    @PostMapping
    public ResponseEntity<?> addDomain(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("=== POST /domains request ===");
            
            if (authentication == null) {
                response.put("success", false);
                response.put("message", "Authentication required");
                return ResponseEntity.status(401).body(response);
            }
            
            String currentUserId = authentication.getName();
            String domainName = (String) request.get("domainName");
            String ownerType = (String) request.getOrDefault("ownerType", "USER");
            
            logger.info("Adding domain: {} for user: {}", domainName, currentUserId);
            
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
            
            // Check if user has permission (basic check)
            if (userRepository != null) {
                try {
                    var userOpt = userRepository.findById(currentUserId);
                    if (userOpt.isPresent()) {
                        var user = userOpt.get();
                        String plan = user.getSubscriptionPlan();
                        logger.info("User {} has plan: {}", currentUserId, plan);
                        
                        if (plan == null || plan.equals("FREE")) {
                            response.put("success", false);
                            response.put("message", "Custom domains require a PRO or BUSINESS plan");
                            response.put("currentPlan", plan);
                            return ResponseEntity.status(403).body(response);
                        }
                    }
                } catch (Exception e) {
                    logger.warn("Could not check user plan: {}", e.getMessage());
                }
            }
            
            // Clean domain name
            domainName = domainName.trim().toLowerCase();
            
            // Check if domain already exists
            try {
                if (domainRepository.existsByDomainName(domainName)) {
                    response.put("success", false);
                    response.put("message", "Domain already exists");
                    return ResponseEntity.badRequest().body(response);
                }
            } catch (Exception e) {
                logger.warn("Could not check domain existence: {}", e.getMessage());
            }
            
            // Create domain
            String verificationToken = "verify_" + System.currentTimeMillis();
            Domain domain = new Domain(domainName, ownerType, currentUserId, verificationToken);
            
            try {
                Domain savedDomain = domainRepository.save(domain);
                logger.info("Domain saved successfully: {}", savedDomain.getId());
                
                response.put("success", true);
                response.put("domain", convertDomainToResponse(savedDomain));
                response.put("message", "Domain reserved successfully");
                
                return ResponseEntity.ok(response);
                
            } catch (Exception e) {
                logger.error("Failed to save domain", e);
                response.put("success", false);
                response.put("message", "Failed to save domain: " + e.getMessage());
                return ResponseEntity.status(500).body(response);
            }
            
        } catch (Exception e) {
            logger.error("Unexpected error in addDomain", e);
            response.put("success", false);
            response.put("message", "Internal server error: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Get verified domains only
     */
    @GetMapping("/verified")
    public ResponseEntity<?> getVerifiedDomains(
            @RequestParam(required = false) String ownerType,
            @RequestParam(required = false) String ownerId,
            Authentication authentication) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (authentication == null) {
                response.put("success", false);
                response.put("message", "Authentication required");
                return ResponseEntity.status(401).body(response);
            }
            
            String currentUserId = authentication.getName();
            
            if (ownerType == null) {
                ownerType = "USER";
                ownerId = currentUserId;
            }
            
            if (domainRepository == null) {
                response.put("success", true);
                response.put("domains", List.of());
                response.put("message", "Domain repository not available");
                return ResponseEntity.ok(response);
            }
            
            try {
                List<Domain> domains = domainRepository.findVerifiedDomainsByOwner(ownerId, ownerType);
                
                List<Map<String, Object>> domainResponses = domains.stream()
                    .map(this::convertDomainToResponse)
                    .collect(Collectors.toList());
                
                response.put("success", true);
                response.put("domains", domainResponses);
                response.put("count", domains.size());
                
                return ResponseEntity.ok(response);
                
            } catch (Exception e) {
                logger.error("Failed to get verified domains", e);
                response.put("success", true);
                response.put("domains", List.of());
                response.put("message", "Query failed - returning empty list");
                return ResponseEntity.ok(response);
            }
            
        } catch (Exception e) {
            logger.error("Unexpected error in getVerifiedDomains", e);
            response.put("success", false);
            response.put("message", "Internal server error: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        
        response.put("success", true);
        response.put("service", "WorkingDomainController");
        response.put("status", "healthy");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("repositoryAvailable", domainRepository != null);
        response.put("userRepositoryAvailable", userRepository != null);
        
        if (domainRepository != null) {
            try {
                long count = domainRepository.count();
                response.put("totalDomains", count);
                response.put("repositoryWorking", true);
            } catch (Exception e) {
                response.put("repositoryError", e.getMessage());
                response.put("repositoryWorking", false);
            }
        }
        
        return ResponseEntity.ok(response);
    }
    
    // Helper method to convert Domain to response format
    private Map<String, Object> convertDomainToResponse(Domain domain) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", domain.getId());
        response.put("domainName", domain.getDomainName());
        response.put("status", domain.getStatus());
        response.put("sslStatus", domain.getSslStatus());
        response.put("cnameTarget", domain.getCnameTarget());
        response.put("verificationToken", domain.getVerificationToken());
        response.put("verificationError", domain.getVerificationError());
        response.put("totalRedirects", domain.getTotalRedirects());
        response.put("createdAt", domain.getCreatedAt());
        response.put("updatedAt", domain.getUpdatedAt());
        return response;
    }
}