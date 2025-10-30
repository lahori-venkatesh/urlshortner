package com.urlshortener.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.urlshortener.model.Domain;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.security.SecureRandom;

@RestController
@RequestMapping("/api/v1/direct-setup")
@CrossOrigin(origins = "*")
public class DirectDatabaseSetupController {
    
    private static final Logger logger = LoggerFactory.getLogger(DirectDatabaseSetupController.class);
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    private final SecureRandom secureRandom = new SecureRandom();
    
    /**
     * Direct endpoint to create domains collection and test with a real domain
     */
    @PostMapping("/create-domains-collection-now")
    public ResponseEntity<Map<String, Object>> createDomainsCollectionNow() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("=== CREATING DOMAINS COLLECTION IN MONGODB ATLAS ===");
            
            // Step 1: Check current state
            boolean domainsExists = mongoTemplate.collectionExists("domains");
            logger.info("Domains collection exists: {}", domainsExists);
            
            // Step 2: Create collection if it doesn't exist
            if (!domainsExists) {
                mongoTemplate.createCollection("domains");
                logger.info("✅ Created domains collection");
                response.put("collection_created", true);
            } else {
                logger.info("ℹ️ Domains collection already exists");
                response.put("collection_created", false);
            }
            
            // Step 3: Create indexes
            createAllIndexes();
            
            // Step 4: Create a test domain
            Domain testDomain = createTestDomain();
            Domain savedDomain = mongoTemplate.save(testDomain);
            logger.info("✅ Created test domain: {}", savedDomain.getDomainName());
            
            // Step 5: Verify everything
            long domainCount = mongoTemplate.count(new Query(), "domains");
            IndexOperations indexOps = mongoTemplate.indexOps("domains");
            int indexCount = indexOps.getIndexInfo().size();
            
            // Step 6: Test query
            Domain foundDomain = mongoTemplate.findById(savedDomain.getId(), Domain.class);
            
            response.put("success", true);
            response.put("timestamp", LocalDateTime.now());
            response.put("message", "Domains collection created and tested successfully!");
            response.put("details", Map.of(
                "collection_exists", mongoTemplate.collectionExists("domains"),
                "total_domains", domainCount,
                "total_indexes", indexCount,
                "test_domain_created", savedDomain.getDomainName(),
                "test_domain_id", savedDomain.getId(),
                "test_query_success", foundDomain != null
            ));
            
            logger.info("=== DOMAINS COLLECTION SETUP COMPLETED ===");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to create domains collection", e);
            
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("error_type", e.getClass().getSimpleName());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Test endpoint to create a real domain and verify storage
     */
    @PostMapping("/test-domain-creation")
    public ResponseEntity<Map<String, Object>> testDomainCreation(@RequestBody Map<String, String> request) {
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
            
            logger.info("Testing domain creation for: {}", domainName);
            
            // Ensure collection exists
            if (!mongoTemplate.collectionExists("domains")) {
                mongoTemplate.createCollection("domains");
                createAllIndexes();
                logger.info("Created domains collection for test");
            }
            
            // Create domain
            Domain domain = new Domain();
            domain.setDomainName(domainName.toLowerCase().trim());
            domain.setOwnerType(ownerType);
            domain.setOwnerId(ownerId);
            domain.setVerificationToken(generateVerificationToken());
            domain.setCnameTarget(domain.getVerificationToken() + ".verify.bitaurl.com");
            domain.setStatus("RESERVED");
            domain.setSslStatus("PENDING");
            domain.setVerificationAttempts(0);
            domain.setTotalRedirects(0L);
            domain.setBlacklisted(false);
            domain.setCreatedAt(LocalDateTime.now());
            domain.setUpdatedAt(LocalDateTime.now());
            domain.setReservedUntil(LocalDateTime.now().plusMinutes(15));
            
            // Save to MongoDB Atlas
            Domain savedDomain = mongoTemplate.save(domain);
            
            // Verify it was saved
            Domain foundDomain = mongoTemplate.findById(savedDomain.getId(), Domain.class);
            
            response.put("success", true);
            response.put("message", "Test domain created and verified in MongoDB Atlas!");
            response.put("domain", Map.of(
                "id", savedDomain.getId(),
                "domainName", savedDomain.getDomainName(),
                "ownerType", savedDomain.getOwnerType(),
                "ownerId", savedDomain.getOwnerId(),
                "status", savedDomain.getStatus(),
                "verificationToken", savedDomain.getVerificationToken(),
                "cnameTarget", savedDomain.getCnameTarget(),
                "createdAt", savedDomain.getCreatedAt()
            ));
            response.put("verification", Map.of(
                "saved_successfully", savedDomain.getId() != null,
                "found_in_database", foundDomain != null,
                "data_matches", foundDomain != null && foundDomain.getDomainName().equals(domainName.toLowerCase().trim())
            ));
            
            logger.info("✅ Test domain created successfully: {} with ID: {}", savedDomain.getDomainName(), savedDomain.getId());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to create test domain", e);
            
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("error_type", e.getClass().getSimpleName());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Check what's currently in the domains collection
     */
    @GetMapping("/check-domains-collection")
    public ResponseEntity<Map<String, Object>> checkDomainsCollection() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            boolean exists = mongoTemplate.collectionExists("domains");
            
            if (!exists) {
                response.put("success", true);
                response.put("collection_exists", false);
                response.put("message", "Domains collection does not exist yet");
                return ResponseEntity.ok(response);
            }
            
            long totalDomains = mongoTemplate.count(new Query(), "domains");
            IndexOperations indexOps = mongoTemplate.indexOps("domains");
            int indexCount = indexOps.getIndexInfo().size();
            
            // Get sample domains
            var sampleDomains = mongoTemplate.find(new Query().limit(5), Domain.class);
            
            response.put("success", true);
            response.put("collection_exists", true);
            response.put("total_domains", totalDomains);
            response.put("total_indexes", indexCount);
            response.put("sample_domains", sampleDomains.stream().map(d -> Map.of(
                "id", d.getId(),
                "domainName", d.getDomainName(),
                "status", d.getStatus(),
                "ownerType", d.getOwnerType(),
                "createdAt", d.getCreatedAt()
            )).toList());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to check domains collection", e);
            
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    private void createAllIndexes() {
        logger.info("Creating all required indexes...");
        
        IndexOperations indexOps = mongoTemplate.indexOps("domains");
        
        try {
            // 1. Unique index on domainName
            indexOps.ensureIndex(
                new Index()
                    .on("domainName", org.springframework.data.domain.Sort.Direction.ASC)
                    .unique()
                    .named("idx_domain_name_unique")
                    .background()
            );
            
            // 2. Compound index on ownerId and ownerType
            indexOps.ensureIndex(
                new Index()
                    .on("ownerId", org.springframework.data.domain.Sort.Direction.ASC)
                    .on("ownerType", org.springframework.data.domain.Sort.Direction.ASC)
                    .named("idx_owner_compound")
                    .background()
            );
            
            // 3. Index on status
            indexOps.ensureIndex(
                new Index()
                    .on("status", org.springframework.data.domain.Sort.Direction.ASC)
                    .named("idx_domain_status")
                    .background()
            );
            
            // 4. Unique index on verificationToken
            indexOps.ensureIndex(
                new Index()
                    .on("verificationToken", org.springframework.data.domain.Sort.Direction.ASC)
                    .unique()
                    .named("idx_verification_token_unique")
                    .background()
            );
            
            // 5. Compound index for verified domains by owner
            indexOps.ensureIndex(
                new Index()
                    .on("ownerId", org.springframework.data.domain.Sort.Direction.ASC)
                    .on("ownerType", org.springframework.data.domain.Sort.Direction.ASC)
                    .on("status", org.springframework.data.domain.Sort.Direction.ASC)
                    .named("idx_owner_status_compound")
                    .background()
            );
            
            logger.info("✅ All indexes created successfully");
            
        } catch (Exception e) {
            logger.warn("Some indexes may already exist: {}", e.getMessage());
        }
    }
    
    private Domain createTestDomain() {
        Domain domain = new Domain();
        domain.setDomainName("test-" + System.currentTimeMillis() + ".example.com");
        domain.setOwnerType("USER");
        domain.setOwnerId("test-user-" + System.currentTimeMillis());
        domain.setVerificationToken(generateVerificationToken());
        domain.setCnameTarget(domain.getVerificationToken() + ".verify.bitaurl.com");
        domain.setStatus("VERIFIED");
        domain.setSslStatus("ACTIVE");
        domain.setSslProvider("CLOUDFLARE");
        domain.setVerificationAttempts(1);
        domain.setTotalRedirects(0L);
        domain.setBlacklisted(false);
        domain.setCreatedAt(LocalDateTime.now());
        domain.setUpdatedAt(LocalDateTime.now());
        domain.setSslIssuedAt(LocalDateTime.now());
        domain.setSslExpiresAt(LocalDateTime.now().plusDays(90));
        domain.setNextReconfirmationDue(LocalDateTime.now().plusYears(1));
        
        return domain;
    }
    
    private String generateVerificationToken() {
        StringBuilder token = new StringBuilder();
        String chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        
        for (int i = 0; i < 12; i++) {
            token.append(chars.charAt(secureRandom.nextInt(chars.length())));
        }
        
        return token.toString();
    }
}