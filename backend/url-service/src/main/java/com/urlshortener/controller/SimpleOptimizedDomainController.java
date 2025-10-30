package com.urlshortener.controller;

import com.urlshortener.model.OptimizedDomain;
import com.urlshortener.repository.OptimizedDomainRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/simple-optimized/domains")
@CrossOrigin(origins = "*")
public class SimpleOptimizedDomainController {
    
    private static final Logger logger = LoggerFactory.getLogger(SimpleOptimizedDomainController.class);
    
    @Autowired
    private OptimizedDomainRepository domainRepository;
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    /**
     * Create optimized domain with production-ready schema (simplified response)
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createOptimizedDomain(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String domainName = request.get("domainName");
            String ownerTypeStr = request.getOrDefault("ownerType", "USER");
            String ownerId = request.getOrDefault("ownerId", "user-" + System.currentTimeMillis());
            String plan = request.getOrDefault("plan", "PRO");
            
            if (domainName == null || domainName.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "domainName is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Check if domain already exists
            if (domainRepository.existsByDomainName(domainName)) {
                response.put("success", false);
                response.put("message", "Domain already exists: " + domainName);
                return ResponseEntity.badRequest().body(response);
            }
            
            // Create optimized domain
            OptimizedDomain.OwnerType ownerType = OptimizedDomain.OwnerType.valueOf(ownerTypeStr);
            String verificationToken = "token-" + UUID.randomUUID().toString().substring(0, 8);
            
            OptimizedDomain domain = new OptimizedDomain(domainName, ownerType, ownerId, verificationToken);
            
            // Set up SSL configuration
            domain.setSslProvider(OptimizedDomain.SslProvider.CLOUDFLARE);
            
            // Set up plan context
            OptimizedDomain.PlanContext planContext = new OptimizedDomain.PlanContext();
            planContext.setPlan(plan);
            planContext.setCustomDomainQuota(plan.equals("PRO") ? 3 : 1);
            planContext.setUsageCount(1);
            domain.setPlanContext(planContext);
            
            // Initialize risk assessment
            domain.getRisk().updateRisk(0.0);
            
            // Set up job details
            domain.getJob().setQueueId("job-" + System.currentTimeMillis());
            domain.getJob().recordProcessing("worker-asia-1");
            
            // Save to MongoDB
            OptimizedDomain savedDomain = domainRepository.save(domain);
            
            // Create simplified response
            Map<String, Object> domainData = new HashMap<>();
            domainData.put("id", savedDomain.getId());
            domainData.put("domainName", savedDomain.getDomainName());
            domainData.put("ownerType", savedDomain.getOwnerType().name());
            domainData.put("ownerId", savedDomain.getOwnerId());
            domainData.put("status", savedDomain.getStatus().name());
            domainData.put("sslStatus", savedDomain.getSslStatus().name());
            domainData.put("verificationToken", savedDomain.getVerificationToken());
            domainData.put("cnameTarget", savedDomain.getCnameTarget());
            domainData.put("isActive", savedDomain.isActive());
            domainData.put("totalRedirects", savedDomain.getTotalRedirects());
            domainData.put("plan", savedDomain.getPlanContext().getPlan());
            domainData.put("riskScore", savedDomain.getRisk().getScore());
            domainData.put("riskClassification", savedDomain.getRisk().getClassification().name());
            domainData.put("createdAt", savedDomain.getCreatedAt().toString());
            domainData.put("updatedAt", savedDomain.getUpdatedAt().toString());
            
            response.put("success", true);
            response.put("message", "Optimized domain created successfully!");
            response.put("domain", domainData);
            response.put("database", mongoTemplate.getDb().getName());
            response.put("collection", "domains");
            response.put("schema", "optimized-production-ready");
            
            logger.info("✅ Optimized domain created: {} in database: {}", 
                domainName, mongoTemplate.getDb().getName());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Failed to create optimized domain", e);
            response.put("success", false);
            response.put("message", "Failed to create domain: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Get all optimized domains (simplified response)
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllOptimizedDomains() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<OptimizedDomain> domains = domainRepository.findAll();
            
            // Convert to simplified format
            List<Map<String, Object>> domainList = domains.stream().map(domain -> {
                Map<String, Object> domainMap = new HashMap<>();
                domainMap.put("id", domain.getId());
                domainMap.put("domainName", domain.getDomainName());
                domainMap.put("ownerType", domain.getOwnerType().name());
                domainMap.put("ownerId", domain.getOwnerId());
                domainMap.put("status", domain.getStatus().name());
                domainMap.put("sslStatus", domain.getSslStatus().name());
                domainMap.put("isActive", domain.isActive());
                domainMap.put("totalRedirects", domain.getTotalRedirects());
                
                // Plan context
                if (domain.getPlanContext() != null) {
                    domainMap.put("plan", domain.getPlanContext().getPlan());
                    domainMap.put("quota", domain.getPlanContext().getCustomDomainQuota());
                    domainMap.put("usage", domain.getPlanContext().getUsageCount());
                }
                
                // Risk assessment
                if (domain.getRisk() != null) {
                    domainMap.put("riskScore", domain.getRisk().getScore());
                    domainMap.put("riskClassification", domain.getRisk().getClassification().name());
                }
                
                // Performance stats
                if (domain.getPerformanceStats() != null) {
                    domainMap.put("avgLatencyMs", domain.getPerformanceStats().getAvgRedirectLatencyMs());
                    domainMap.put("cacheHitRate", domain.getPerformanceStats().getCacheHitRate());
                }
                
                // SSL info
                if (domain.getSsl() != null) {
                    domainMap.put("sslCertificateId", domain.getSsl().getCertificateId());
                    domainMap.put("sslExpiresAt", domain.getSsl().getExpiresAt() != null ? 
                        domain.getSsl().getExpiresAt().toString() : null);
                }
                
                domainMap.put("createdAt", domain.getCreatedAt().toString());
                domainMap.put("updatedAt", domain.getUpdatedAt().toString());
                
                return domainMap;
            }).toList();
            
            response.put("success", true);
            response.put("message", "Optimized domains retrieved successfully");
            response.put("totalDomains", domains.size());
            response.put("domains", domainList);
            response.put("database", mongoTemplate.getDb().getName());
            response.put("schema", "optimized-production-ready");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Failed to retrieve optimized domains", e);
            response.put("success", false);
            response.put("message", "Failed to retrieve domains: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Verify domain and activate SSL
     */
    @PostMapping("/{id}/verify")
    public ResponseEntity<Map<String, Object>> verifyDomain(@PathVariable String id) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            OptimizedDomain domain = domainRepository.findById(id).orElse(null);
            
            if (domain == null) {
                response.put("success", false);
                response.put("message", "Domain not found");
                return ResponseEntity.notFound().build();
            }
            
            // Simulate verification
            domain.markAsVerified();
            domain.activateSsl(OptimizedDomain.SslProvider.CLOUDFLARE, "cf-cert-" + System.currentTimeMillis());
            domain.updatePerformanceMetrics(42);
            
            OptimizedDomain savedDomain = domainRepository.save(domain);
            
            response.put("success", true);
            response.put("message", "Domain verified and SSL activated!");
            response.put("domainName", savedDomain.getDomainName());
            response.put("status", savedDomain.getStatus().name());
            response.put("sslStatus", savedDomain.getSslStatus().name());
            response.put("sslCertificateId", savedDomain.getSsl().getCertificateId());
            response.put("verifiedAt", savedDomain.getUpdatedAt().toString());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Failed to verify domain: {}", id, e);
            response.put("success", false);
            response.put("message", "Verification failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Simulate redirect and update performance metrics
     */
    @PostMapping("/{id}/redirect")
    public ResponseEntity<Map<String, Object>> simulateRedirect(@PathVariable String id) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            OptimizedDomain domain = domainRepository.findById(id).orElse(null);
            
            if (domain == null) {
                response.put("success", false);
                response.put("message", "Domain not found");
                return ResponseEntity.notFound().build();
            }
            
            // Simulate redirect with random latency
            long latency = 30 + (long) (Math.random() * 50);
            domain.incrementRedirects();
            domain.updatePerformanceMetrics(latency);
            domain.getPerformanceStats().recordCacheHit();
            
            OptimizedDomain savedDomain = domainRepository.save(domain);
            
            response.put("success", true);
            response.put("message", "Redirect simulated successfully");
            response.put("domainName", savedDomain.getDomainName());
            response.put("latencyMs", latency);
            response.put("totalRedirects", savedDomain.getTotalRedirects());
            response.put("avgLatencyMs", savedDomain.getPerformanceStats().getAvgRedirectLatencyMs());
            response.put("cacheHitRate", savedDomain.getPerformanceStats().getCacheHitRate());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Failed to simulate redirect: {}", id, e);
            response.put("success", false);
            response.put("message", "Redirect simulation failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Get database info
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getDatabaseInfo() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String databaseName = mongoTemplate.getDb().getName();
            long domainCount = domainRepository.count();
            long verifiedDomains = domainRepository.countByStatus(OptimizedDomain.DomainStatus.VERIFIED);
            
            response.put("success", true);
            response.put("databaseName", databaseName);
            response.put("collectionName", "domains");
            response.put("totalDomains", domainCount);
            response.put("verifiedDomains", verifiedDomains);
            response.put("schema", "optimized-production-ready");
            response.put("message", "Database info retrieved successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Failed to get database info", e);
            response.put("success", false);
            response.put("message", "Failed to get database info: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}