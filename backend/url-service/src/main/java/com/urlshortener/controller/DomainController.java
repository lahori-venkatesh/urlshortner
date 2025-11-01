package com.urlshortener.controller;

import com.urlshortener.dto.DomainRequest;
import com.urlshortener.dto.DomainResponse;
import com.urlshortener.dto.DomainTransferRequest;
import com.urlshortener.service.DomainService;
import com.urlshortener.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/domains")
@CrossOrigin(origins = "*")
public class DomainController {
    
    private static final Logger logger = LoggerFactory.getLogger(DomainController.class);
    
    @Autowired
    private DomainService domainService;
    
    @Autowired
    private UserService userService;
    
    /**
     * Reserve a new custom domain
     * POST /api/v1/domains
     */
    @PostMapping
    public ResponseEntity<?> reserveDomain(
            @Valid @RequestBody DomainRequest request,
            Authentication authentication) {
        
        try {
            String currentUserId = authentication.getName();
            
            // TODO: Add plan validation once repositories are properly configured
            
            // Set owner info if not provided (for individual users)
            if (request.getOwnerType() == null) {
                request.setOwnerType("USER");
                request.setOwnerId(currentUserId);
            }
            
            DomainResponse response = domainService.reserveDomain(request, currentUserId);
            
            Map<String, Object> successResponse = new HashMap<>();
            successResponse.put("success", true);
            successResponse.put("domain", response);
            successResponse.put("message", "Domain reserved successfully");
            
            logger.info("Domain reserved successfully: {} by user: {}", 
                       request.getDomainName(), currentUserId);
            
            return ResponseEntity.ok(successResponse);
            
        } catch (Exception e) {
            logger.error("Error reserving domain: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to reserve domain: " + e.getMessage());
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Verify domain DNS configuration
     * POST /api/v1/domains/verify
     */
    @PostMapping("/verify")
    public ResponseEntity<?> verifyDomain(
            @RequestParam String domainId,
            Authentication authentication) {
        
        try {
            String currentUserId = authentication.getName();
            DomainResponse response = domainService.verifyDomain(domainId, currentUserId);
            
            boolean isVerified = "VERIFIED".equals(response.getStatus());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "verified", isVerified,
                "message", isVerified ? 
                    "Domain verified successfully! SSL certificate is being provisioned." :
                    "Verification in progress. Please ensure CNAME record is correctly configured.",
                "domain", response
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            logger.error("Unexpected error during domain verification", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Verification failed. Please try again later."
            ));
        }
    }
    
    /**
     * Get domains for current user
     * GET /api/v1/domains/my
     */
    @GetMapping("/my")
    public ResponseEntity<?> getMyDomains(
            @RequestParam(required = false) String ownerType,
            @RequestParam(required = false) String ownerId,
            Authentication authentication) {
        
        try {
            String currentUserId = authentication.getName();
            
            // Default to user's personal domains
            if (ownerType == null) {
                ownerType = "USER";
                ownerId = currentUserId;
            }
            
            List<DomainResponse> domains = domainService.getDomainsByOwner(ownerId, ownerType);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "domains", domains
            ));
            
        } catch (Exception e) {
            logger.error("Error fetching user domains", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to fetch domains"
            ));
        }
    }
    
    /**
     * Get verified domains only (for link creation)
     * GET /api/v1/domains/verified
     */
    @GetMapping("/verified")
    public ResponseEntity<?> getVerifiedDomains(
            @RequestParam(required = false) String ownerType,
            @RequestParam(required = false) String ownerId,
            Authentication authentication) {
        
        try {
            String currentUserId = authentication.getName();
            
            // Default to user's personal domains
            if (ownerType == null) {
                ownerType = "USER";
                ownerId = currentUserId;
            }
            
            List<DomainResponse> domains = domainService.getVerifiedDomains(ownerId, ownerType);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "domains", domains
            ));
            
        } catch (Exception e) {
            logger.error("Error fetching verified domains", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to fetch verified domains"
            ));
        }
    }
    
    /**
     * Transfer domain ownership
     * POST /api/v1/domains/transfer
     */
    @PostMapping("/transfer")
    public ResponseEntity<?> transferDomain(
            @Valid @RequestBody DomainTransferRequest request,
            Authentication authentication) {
        
        try {
            String currentUserId = authentication.getName();
            DomainResponse response = domainService.transferDomain(request, currentUserId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Domain transferred successfully",
                "domain", response
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            logger.error("Error during domain transfer", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Transfer failed. Please try again later."
            ));
        }
    }
    
    /**
     * Get domain status (for polling verification progress)
     * GET /api/v1/domains/{id}/status
     */
    @GetMapping("/{id}/status")
    public ResponseEntity<?> getDomainStatus(
            @PathVariable String id,
            Authentication authentication) {
        
        try {
            String currentUserId = authentication.getName();
            DomainResponse response = domainService.getDomainStatus(id, currentUserId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "domain", response
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            logger.error("Error fetching domain status", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Failed to fetch domain status"
            ));
        }
    }
}