package com.urlshortener.controller;

import com.urlshortener.model.Domain;
import com.urlshortener.repository.DomainRepository;
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
@RequestMapping("/api/v1/test/domains")
@CrossOrigin(origins = "*")
public class SimpleDomainTestController {
    
    private static final Logger logger = LoggerFactory.getLogger(SimpleDomainTestController.class);
    
    @Autowired
    private DomainRepository domainRepository;
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    /**
     * Simple POST endpoint to create a domain (no authentication required)
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createTestDomain(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String domainName = request.get("domainName");
            String ownerType = request.getOrDefault("ownerType", "USER");
            String ownerId = request.getOrDefault("ownerId", "test-user-" + System.currentTimeMillis());
            
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
            
            // Create new domain
            Domain domain = new Domain();
            domain.setDomainName(domainName);
            domain.setOwnerType(Domain.OwnerType.valueOf(ownerType));
            domain.setOwnerId(ownerId);
            domain.setVerificationToken("token-" + UUID.randomUUID().toString().substring(0, 8));
            domain.setStatus(Domain.DomainStatus.RESERVED);
            domain.setSslStatus(Domain.SslStatus.PENDING);
            domain.setCnameTarget(domain.getVerificationToken() + ".verify.bitaurl.com");
            domain.setVerificationAttempts(0);
            domain.setTotalRedirects(0L);
            domain.setBlacklisted(false);
            domain.setCreatedAt(LocalDateTime.now());
            domain.setUpdatedAt(LocalDateTime.now());
            
            // Save to MongoDB
            Domain savedDomain = domainRepository.save(domain);
            
            response.put("success", true);
            response.put("message", "Domain created successfully in MongoDB!");
            Map<String, Object> domainMap = new HashMap<>();
            domainMap.put("id", savedDomain.getId());
            domainMap.put("domainName", savedDomain.getDomainName());
            domainMap.put("ownerType", savedDomain.getOwnerType().toString());
            domainMap.put("ownerId", savedDomain.getOwnerId());
            domainMap.put("status", savedDomain.getStatus().toString());
            domainMap.put("verificationToken", savedDomain.getVerificationToken());
            domainMap.put("cnameTarget", savedDomain.getCnameTarget());
            domainMap.put("createdAt", savedDomain.getCreatedAt().toString());
            response.put("domain", domainMap);
            response.put("database", mongoTemplate.getDb().getName());
            response.put("collection", "domains");
            
            logger.info("✅ Test domain created successfully: {} in database: {}", 
                domainName, mongoTemplate.getDb().getName());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Failed to create test domain", e);
            response.put("success", false);
            response.put("message", "Failed to create domain: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Simple GET endpoint to list all domains (no authentication required)
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllDomains() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Domain> domains = domainRepository.findAll();
            
            response.put("success", true);
            response.put("message", "Domains retrieved successfully");
            response.put("totalDomains", domains.size());
            response.put("database", mongoTemplate.getDb().getName());
            response.put("collection", "domains");
            
            // Convert domains to simple map format
            List<Map<String, Object>> domainList = domains.stream().map(domain -> {
                Map<String, Object> domainMap = new HashMap<>();
                domainMap.put("id", domain.getId());
                domainMap.put("domainName", domain.getDomainName());
                domainMap.put("ownerType", domain.getOwnerType().toString());
                domainMap.put("ownerId", domain.getOwnerId());
                domainMap.put("status", domain.getStatus().toString());
                domainMap.put("sslStatus", domain.getSslStatus().toString());
                domainMap.put("verificationToken", domain.getVerificationToken());
                domainMap.put("cnameTarget", domain.getCnameTarget());
                domainMap.put("totalRedirects", domain.getTotalRedirects());
                domainMap.put("createdAt", domain.getCreatedAt().toString());
                return domainMap;
            }).toList();
            
            response.put("domains", domainList);
            
            logger.info("✅ Retrieved {} domains from database: {}", 
                domains.size(), mongoTemplate.getDb().getName());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Failed to retrieve domains", e);
            response.put("success", false);
            response.put("message", "Failed to retrieve domains: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Get a specific domain by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getDomainById(@PathVariable String id) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Domain domain = domainRepository.findById(id).orElse(null);
            
            if (domain == null) {
                response.put("success", false);
                response.put("message", "Domain not found with ID: " + id);
                return ResponseEntity.notFound().build();
            }
            
            response.put("success", true);
            response.put("message", "Domain found");
            Map<String, Object> domainMap = new HashMap<>();
            domainMap.put("id", domain.getId());
            domainMap.put("domainName", domain.getDomainName());
            domainMap.put("ownerType", domain.getOwnerType().toString());
            domainMap.put("ownerId", domain.getOwnerId());
            domainMap.put("status", domain.getStatus().toString());
            domainMap.put("sslStatus", domain.getSslStatus().toString());
            domainMap.put("verificationToken", domain.getVerificationToken());
            domainMap.put("cnameTarget", domain.getCnameTarget());
            domainMap.put("totalRedirects", domain.getTotalRedirects());
            domainMap.put("createdAt", domain.getCreatedAt().toString());
            domainMap.put("updatedAt", domain.getUpdatedAt().toString());
            response.put("domain", domainMap);
            response.put("database", mongoTemplate.getDb().getName());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Failed to get domain by ID: {}", id, e);
            response.put("success", false);
            response.put("message", "Failed to get domain: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Delete a domain by ID (for testing)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteDomain(@PathVariable String id) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Domain domain = domainRepository.findById(id).orElse(null);
            
            if (domain == null) {
                response.put("success", false);
                response.put("message", "Domain not found with ID: " + id);
                return ResponseEntity.notFound().build();
            }
            
            String domainName = domain.getDomainName();
            domainRepository.delete(domain);
            
            response.put("success", true);
            response.put("message", "Domain deleted successfully: " + domainName);
            response.put("deletedDomain", domainName);
            response.put("database", mongoTemplate.getDb().getName());
            
            logger.info("✅ Test domain deleted: {} from database: {}", 
                domainName, mongoTemplate.getDb().getName());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Failed to delete domain: {}", id, e);
            response.put("success", false);
            response.put("message", "Failed to delete domain: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Get database and collection info
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