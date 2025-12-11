package com.urlshortener.controller;

import com.urlshortener.model.Domain;
import com.urlshortener.repository.DomainRepository;
import com.urlshortener.service.CloudflareService;
import com.urlshortener.service.DomainVerificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/domains")
@CrossOrigin(origins = "*")
public class CustomDomainController {
    
    @Autowired
    private DomainRepository domainRepository;
    
    @Autowired
    private CloudflareService cloudflareService;
    
    @Autowired
    private DomainVerificationService verificationService;
    
    @Value("${app.domain.proxy-target:tinyslash.com}")
    private String proxyTarget;
    
    @PostMapping("/add")
    public ResponseEntity<Map<String, Object>> addCustomDomain(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String domain = (String) request.get("domain");
            String userId = (String) request.get("userId");
            
            if (domain == null || domain.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Domain is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (userId == null || userId.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "User ID is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Validate domain format
            if (!verificationService.isValidDomain(domain)) {
                response.put("success", false);
                response.put("message", "Invalid domain format");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Check if domain already exists
            if (domainRepository.existsByDomainName(domain)) {
                response.put("success", false);
                response.put("message", "Domain already exists");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Create and save domain
            String verificationToken = UUID.randomUUID().toString();
            Domain customDomain = new Domain(domain, "USER", userId, verificationToken);
            customDomain.setStatus(Domain.DomainStatus.PENDING);
            customDomain.setCnameTarget(proxyTarget);
            domainRepository.save(customDomain);
            
            System.out.println("✅ Domain added to database: " + domain);
            
            // Return DNS instructions
            Map<String, Object> dnsInstructions = new HashMap<>();
            dnsInstructions.put("type", "CNAME");
            dnsInstructions.put("name", verificationService.extractSubdomain(domain));
            dnsInstructions.put("target", proxyTarget);
            dnsInstructions.put("ttl", "Auto or 300");
            
            response.put("success", true);
            response.put("message", "Domain added successfully. Please configure DNS.");
            response.put("domain", domain);
            response.put("status", "pending");
            response.put("dnsInstructions", dnsInstructions);
            response.put("verificationUrl", "/api/domains/verify/" + domain);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error adding domain: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/verify/{domain}")
    public ResponseEntity<Map<String, Object>> verifyDomain(@PathVariable String domain) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get domain from database
            Optional<Domain> domainOpt = domainRepository.findByDomainName(domain);
            
            if (domainOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Domain not found");
                return ResponseEntity.notFound().build();
            }
            
            Domain customDomain = domainOpt.get();
            customDomain.setLastVerificationAttempt(LocalDateTime.now());
            
            // Step 1: Verify DNS
            boolean dnsValid = verificationService.verifyDNS(domain);
            
            if (!dnsValid) {
                customDomain.setStatus(Domain.DomainStatus.PENDING);
                customDomain.setVerificationError("DNS not configured correctly");
                customDomain.incrementVerificationAttempts();
                domainRepository.save(customDomain);
                
                response.put("success", false);
                response.put("message", "DNS not configured correctly");
                response.put("domain", domain);
                response.put("status", "dns_pending");
                response.put("expectedTarget", proxyTarget);
                
                Map<String, Object> troubleshooting = new HashMap<>();
                troubleshooting.put("step1", "Add CNAME record: " + verificationService.extractSubdomain(domain) + " → " + proxyTarget);
                troubleshooting.put("step2", "Wait 5-15 minutes for DNS propagation");
                troubleshooting.put("step3", "Click verify again");
                response.put("troubleshooting", troubleshooting);
                
                return ResponseEntity.ok(response);
            }
            
            // Step 2: Add to Cloudflare Worker (AUTOMATED)
            System.out.println("🚀 Adding domain to Cloudflare Worker: " + domain);
            boolean addedToCloudflare = cloudflareService.addDomainToWorker(domain);
            
            if (addedToCloudflare) {
                // Success! Domain is verified and active
                customDomain.markAsVerified();
                customDomain.markSslActive("CLOUDFLARE");
                domainRepository.save(customDomain);
                
                System.out.println("✅ Domain verified and activated: " + domain);
                
                response.put("success", true);
                response.put("message", "Domain verified successfully! Your custom domain is now active.");
                response.put("domain", domain);
                response.put("status", "verified");
                response.put("isActive", true);
                response.put("sslStatus", "active");
                
            } else {
                // Cloudflare API failed
                customDomain.setStatus(Domain.DomainStatus.ERROR);
                customDomain.setVerificationError("Failed to add domain to Cloudflare");
                customDomain.incrementVerificationAttempts();
                domainRepository.save(customDomain);
                
                response.put("success", false);
                response.put("message", "DNS verified but failed to activate domain. Please contact support.");
                response.put("domain", domain);
                response.put("status", "cloudflare_failed");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Verification failed: " + e.getMessage());
            response.put("domain", domain);
            response.put("status", "verification_failed");
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @GetMapping("/list")
    public ResponseEntity<Map<String, Object>> listDomains(@RequestParam String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Domain> domains = domainRepository.findByOwnerIdAndOwnerType(userId, "USER");
            
            List<Map<String, Object>> domainList = domains.stream().map(domain -> {
                Map<String, Object> domainMap = new HashMap<>();
                domainMap.put("domain", domain.getDomainName());
                domainMap.put("status", domain.getStatus());
                domainMap.put("sslStatus", domain.getSslStatus());
                domainMap.put("isVerified", domain.isVerified());
                domainMap.put("createdAt", domain.getCreatedAt());
                domainMap.put("lastVerificationAttempt", domain.getLastVerificationAttempt());
                domainMap.put("verificationError", domain.getVerificationError());
                domainMap.put("cnameTarget", domain.getCnameTarget());
                return domainMap;
            }).collect(Collectors.toList());
            
            response.put("success", true);
            response.put("domains", domainList);
            response.put("count", domainList.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error listing domains: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @DeleteMapping("/{domain}")
    public ResponseEntity<Map<String, Object>> deleteDomain(@PathVariable String domain, @RequestParam String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<Domain> domainOpt = domainRepository.findByDomainName(domain);
            
            if (domainOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Domain not found");
                return ResponseEntity.notFound().build();
            }
            
            Domain customDomain = domainOpt.get();
            
            // Check if user owns domain
            if (!customDomain.getOwnerId().equals(userId)) {
                response.put("success", false);
                response.put("message", "Unauthorized");
                return ResponseEntity.status(403).body(response);
            }
            
            // Remove from Cloudflare if verified
            if (customDomain.isVerified()) {
                cloudflareService.removeDomainFromWorker(domain);
            }
            
            // Delete from database
            domainRepository.delete(customDomain);
            
            System.out.println("✅ Domain deleted: " + domain);
            
            response.put("success", true);
            response.put("message", "Domain deleted successfully");
            response.put("domain", domain);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error deleting domain: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @GetMapping("/status/{domain}")
    public ResponseEntity<Map<String, Object>> getDomainStatus(@PathVariable String domain) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<Domain> domainOpt = domainRepository.findByDomainName(domain);
            
            if (domainOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Domain not found");
                return ResponseEntity.notFound().build();
            }
            
            Domain customDomain = domainOpt.get();
            
            response.put("success", true);
            response.put("domain", customDomain.getDomainName());
            response.put("status", customDomain.getStatus());
            response.put("sslStatus", customDomain.getSslStatus());
            response.put("isVerified", customDomain.isVerified());
            response.put("createdAt", customDomain.getCreatedAt());
            response.put("lastVerificationAttempt", customDomain.getLastVerificationAttempt());
            response.put("verificationError", customDomain.getVerificationError());
            response.put("cnameTarget", customDomain.getCnameTarget());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error getting domain status: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}