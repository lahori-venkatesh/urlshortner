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
@RequestMapping("/api/v1/optimized/domains")
@CrossOrigin(origins = "*")
public class OptimizedDomainTestController {
    
    private static final Logger logger = LoggerFactory.getLogger(OptimizedDomainTestController.class);
    
    @Autowired
    private OptimizedDomainRepository domainRepository;
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    /**
     * Create an optimized domain with full production-ready schema
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
            
            // Create optimized domain with full schema
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
            domain.getRisk().updateRisk(0.0); // Start with low risk
            
            // Set up job details
            domain.getJob().setQueueId("job-" + System.currentTimeMillis());
            domain.getJob().recordProcessing("worker-asia-1");
            
            // Save to MongoDB
            OptimizedDomain savedDomain = domainRepository.save(domain);
            
            // Create response with full domain data
            Map<String, Object> domainData = createDomainResponseMap(savedDomain);
            
            response.put("success", true);
            response.put("message", "Optimized domain created successfully in MongoDB!");
            response.put("domain", domainData);
            response.put("database", mongoTemplate.getDb().getName());
            response.put("collection", "domains");
            response.put("schema", "optimized");
            
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
     * Get all optimized domains with full schema
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllOptimizedDomains() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<OptimizedDomain> domains = domainRepository.findAll();
            
            response.put("success", true);
            response.put("message", "Optimized domains retrieved successfully");
            response.put("totalDomains", domains.size());
            response.put("database", mongoTemplate.getDb().getName());
            response.put("collection", "domains");
            response.put("schema", "optimized");
            
            // Convert domains to response format
            List<Map<String, Object>> domainList = domains.stream()
                .map(this::createDomainResponseMap)
                .toList();
            
            response.put("domains", domainList);
            
            logger.info("✅ Retrieved {} optimized domains from database: {}", 
                domains.size(), mongoTemplate.getDb().getName());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Failed to retrieve optimized domains", e);
            response.put("success", false);
            response.put("message", "Failed to retrieve domains: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Get domain by ID with full optimized schema
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getOptimizedDomainById(@PathVariable String id) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            OptimizedDomain domain = domainRepository.findById(id).orElse(null);
            
            if (domain == null) {
                response.put("success", false);
                response.put("message", "Domain not found with ID: " + id);
                return ResponseEntity.notFound().build();
            }
            
            response.put("success", true);
            response.put("message", "Optimized domain found");
            response.put("domain", createDomainResponseMap(domain));
            response.put("database", mongoTemplate.getDb().getName());
            response.put("schema", "optimized");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Failed to get optimized domain by ID: {}", id, e);
            response.put("success", false);
            response.put("message", "Failed to get domain: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Simulate domain verification
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
            
            // Simulate verification process
            domain.markAsVerified();
            domain.activateSsl(OptimizedDomain.SslProvider.CLOUDFLARE, "cf-cert-" + System.currentTimeMillis());
            
            // Update performance stats
            domain.updatePerformanceMetrics(42); // Simulate 42ms latency
            
            OptimizedDomain savedDomain = domainRepository.save(domain);
            
            response.put("success", true);
            response.put("message", "Domain verified and SSL activated!");
            response.put("domain", createDomainResponseMap(savedDomain));
            
            logger.info("✅ Domain verified: {}", domain.getDomainName());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Failed to verify domain: {}", id, e);
            response.put("success", false);
            response.put("message", "Verification failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Simulate domain usage (redirect)
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
            
            // Simulate redirect
            long latency = 30 + (long) (Math.random() * 50); // Random latency 30-80ms
            domain.incrementRedirects();
            domain.updatePerformanceMetrics(latency);
            domain.getPerformanceStats().recordCacheHit(); // Simulate cache hit
            
            OptimizedDomain savedDomain = domainRepository.save(domain);
            
            response.put("success", true);
            response.put("message", "Redirect simulated successfully");
            response.put("latencyMs", latency);
            response.put("totalRedirects", savedDomain.getTotalRedirects());
            response.put("avgLatency", savedDomain.getPerformanceStats().getAvgRedirectLatencyMs());
            response.put("cacheHitRate", savedDomain.getPerformanceStats().getCacheHitRate());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Failed to simulate redirect for domain: {}", id, e);
            response.put("success", false);
            response.put("message", "Redirect simulation failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Get domain statistics and analytics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDomainStatistics() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get various statistics
            List<OptimizedDomainRepository.StatusCount> statusCounts = domainRepository.getStatusCounts();
            List<OptimizedDomainRepository.PlanStats> planStats = domainRepository.getPlanStatistics();
            List<OptimizedDomainRepository.RiskStats> riskStats = domainRepository.getRiskStatistics();
            OptimizedDomainRepository.PerformanceOverview perfOverview = domainRepository.getPerformanceOverview();
            
            long totalDomains = domainRepository.count();
            long activeDomains = domainRepository.findByStatusAndIsActive(OptimizedDomain.DomainStatus.VERIFIED, true).size();
            long highRiskDomains = domainRepository.findHighRiskDomains().size();
            
            response.put("success", true);
            response.put("totalDomains", totalDomains);
            response.put("activeDomains", activeDomains);
            response.put("highRiskDomains", highRiskDomains);
            response.put("statusBreakdown", statusCounts);
            response.put("planBreakdown", planStats);
            response.put("riskBreakdown", riskStats);
            response.put("performanceOverview", perfOverview);
            response.put("database", mongoTemplate.getDb().getName());
            response.put("schema", "optimized");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Failed to get domain statistics", e);
            response.put("success", false);
            response.put("message", "Failed to get statistics: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Get database info for optimized schema
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getDatabaseInfo() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String databaseName = mongoTemplate.getDb().getName();
            boolean collectionExists = mongoTemplate.collectionExists("domains");
            long domainCount = domainRepository.count();
            
            response.put("success", true);
            response.put("databaseName", databaseName);
            response.put("collectionName", "domains");
            response.put("collectionExists", collectionExists);
            response.put("totalDomains", domainCount);
            response.put("schema", "optimized");
            response.put("message", "Optimized database info retrieved successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Failed to get optimized database info", e);
            response.put("success", false);
            response.put("message", "Failed to get database info: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    // Helper method to create domain response map
    private Map<String, Object> createDomainResponseMap(OptimizedDomain domain) {
        Map<String, Object> domainMap = new HashMap<>();
        
        // Basic info
        domainMap.put("id", domain.getId());
        domainMap.put("domainName", domain.getDomainName());
        domainMap.put("cnameTarget", domain.getCnameTarget());
        domainMap.put("verificationToken", domain.getVerificationToken());
        domainMap.put("verificationAttempts", domain.getVerificationAttempts());
        domainMap.put("status", domain.getStatus().name());
        domainMap.put("isActive", domain.isActive());
        domainMap.put("disabledReason", domain.getDisabledReason());
        
        // Owner info
        domainMap.put("ownerType", domain.getOwnerType().name());
        domainMap.put("ownerId", domain.getOwnerId());
        domainMap.put("ownershipHistory", domain.getOwnershipHistory());
        
        // SSL info
        domainMap.put("sslProvider", domain.getSslProvider() != null ? domain.getSslProvider().name() : null);
        domainMap.put("sslStatus", domain.getSslStatus().name());
        domainMap.put("ssl", domain.getSsl());
        
        // Verification info
        domainMap.put("verification", domain.getVerification());
        
        // Risk assessment
        domainMap.put("risk", domain.getRisk());
        
        // Plan context
        domainMap.put("planContext", domain.getPlanContext());
        
        // Performance stats
        domainMap.put("performanceStats", domain.getPerformanceStats());
        
        // Job details
        domainMap.put("job", domain.getJob());
        
        // Security and usage
        domainMap.put("isBlacklisted", domain.isBlacklisted());
        domainMap.put("totalRedirects", domain.getTotalRedirects());
        
        // Timestamps (convert to ISO string format)
        domainMap.put("createdAt", domain.getCreatedAt() != null ? domain.getCreatedAt().toString() : null);
        domainMap.put("updatedAt", domain.getUpdatedAt() != null ? domain.getUpdatedAt().toString() : null);
        
        return domainMap;
    }
}