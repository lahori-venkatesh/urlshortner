package com.urlshortener.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/init")
@CrossOrigin(origins = "*")
public class InitializeDatabaseController {
    
    private static final Logger logger = LoggerFactory.getLogger(InitializeDatabaseController.class);
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    /**
     * Simple endpoint to initialize custom domains database
     * This will create the domains collection in MongoDB Atlas
     */
    @PostMapping("/domains")
    public ResponseEntity<Map<String, Object>> initializeDomainsDatabase() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("=== INITIALIZING CUSTOM DOMAINS DATABASE ===");
            
            // Step 1: Create domains collection
            boolean collectionExists = mongoTemplate.collectionExists("domains");
            logger.info("Domains collection exists: {}", collectionExists);
            
            if (!collectionExists) {
                mongoTemplate.createCollection("domains");
                logger.info("✅ Created domains collection");
            }
            
            // Step 2: Create indexes
            createDomainsIndexes();
            
            // Step 3: Insert sample domain
            insertSampleDomain();
            
            // Step 4: Verify
            long domainCount = mongoTemplate.count(org.springframework.data.mongodb.core.query.Query.query(
                org.springframework.data.mongodb.core.query.Criteria.where("_id").exists(true)
            ), "domains");
            
            IndexOperations indexOps = mongoTemplate.indexOps("domains");
            int indexCount = indexOps.getIndexInfo().size();
            
            response.put("success", true);
            response.put("message", "Custom domains database initialized successfully!");
            response.put("timestamp", LocalDateTime.now().toString());
            response.put("database_name", mongoTemplate.getDb().getName());
            response.put("collection_name", "domains");
            response.put("collection_exists", mongoTemplate.collectionExists("domains"));
            response.put("total_domains", domainCount);
            response.put("total_indexes", indexCount);
            response.put("ready_for_custom_domains", true);
            
            logger.info("=== CUSTOM DOMAINS DATABASE READY ===");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to initialize domains database", e);
            
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("message", "Failed to initialize custom domains database");
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Check if domains database is ready
     */
    @GetMapping("/domains/status")
    public ResponseEntity<Map<String, Object>> checkDomainsStatus() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            boolean collectionExists = mongoTemplate.collectionExists("domains");
            
            long domainCount = 0;
            int indexCount = 0;
            
            if (collectionExists) {
                domainCount = mongoTemplate.count(org.springframework.data.mongodb.core.query.Query.query(
                    org.springframework.data.mongodb.core.query.Criteria.where("_id").exists(true)
                ), "domains");
                
                IndexOperations indexOps = mongoTemplate.indexOps("domains");
                indexCount = indexOps.getIndexInfo().size();
            }
            
            response.put("success", true);
            response.put("database_name", mongoTemplate.getDb().getName());
            response.put("collection_name", "domains");
            response.put("collection_exists", collectionExists);
            response.put("total_domains", domainCount);
            response.put("total_indexes", indexCount);
            response.put("ready_for_custom_domains", collectionExists && indexCount > 1);
            response.put("timestamp", LocalDateTime.now().toString());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to check domains status", e);
            
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Create a test domain to verify the system works
     */
    @PostMapping("/domains/test")
    public ResponseEntity<Map<String, Object>> createTestDomain(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String domainName = request.getOrDefault("domainName", "test-" + System.currentTimeMillis() + ".example.com");
            
            // Ensure collection exists
            if (!mongoTemplate.collectionExists("domains")) {
                mongoTemplate.createCollection("domains");
                createDomainsIndexes();
            }
            
            // Create test domain document
            Map<String, Object> domain = new HashMap<>();
            domain.put("domainName", domainName);
            domain.put("ownerType", "USER");
            domain.put("ownerId", "test-user-" + System.currentTimeMillis());
            domain.put("verificationToken", "test-token-" + System.currentTimeMillis());
            domain.put("status", "RESERVED");
            domain.put("sslStatus", "PENDING");
            domain.put("cnameTarget", "pebly.vercel.app");
            domain.put("verificationAttempts", 0);
            domain.put("totalRedirects", 0L);
            domain.put("isBlacklisted", false);
            domain.put("createdAt", LocalDateTime.now());
            domain.put("updatedAt", LocalDateTime.now());
            
            // Insert into MongoDB
            mongoTemplate.insert(domain, "domains");
            
            response.put("success", true);
            response.put("message", "Test domain created successfully in MongoDB Atlas!");
            response.put("domain", domain);
            response.put("collection_name", "domains");
            response.put("database_name", mongoTemplate.getDb().getName());
            
            logger.info("✅ Test domain created: {}", domainName);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to create test domain", e);
            
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    private void createDomainsIndexes() {
        logger.info("Creating domains indexes...");
        
        IndexOperations indexOps = mongoTemplate.indexOps("domains");
        
        try {
            // Unique index on domainName
            indexOps.ensureIndex(
                new Index()
                    .on("domainName", org.springframework.data.domain.Sort.Direction.ASC)
                    .unique()
                    .named("idx_domain_name_unique")
            );
            
            // Index on ownerId and ownerType
            indexOps.ensureIndex(
                new Index()
                    .on("ownerId", org.springframework.data.domain.Sort.Direction.ASC)
                    .on("ownerType", org.springframework.data.domain.Sort.Direction.ASC)
                    .named("idx_owner_compound")
            );
            
            // Index on status
            indexOps.ensureIndex(
                new Index()
                    .on("status", org.springframework.data.domain.Sort.Direction.ASC)
                    .named("idx_domain_status")
            );
            
            logger.info("✅ Created domains indexes");
            
        } catch (Exception e) {
            logger.warn("Some indexes may already exist: {}", e.getMessage());
        }
    }
    
    /**
     * Get comprehensive database status including all collections
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getDatabaseStatus() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String databaseName = mongoTemplate.getDb().getName();
            java.util.Set<String> collectionNames = mongoTemplate.getDb().listCollectionNames().into(new java.util.HashSet<>());
            
            Map<String, Object> collections = new HashMap<>();
            
            // Check each collection
            for (String collectionName : collectionNames) {
                Map<String, Object> collectionInfo = new HashMap<>();
                long count = mongoTemplate.count(
                    org.springframework.data.mongodb.core.query.Query.query(
                        org.springframework.data.mongodb.core.query.Criteria.where("_id").exists(true)
                    ), collectionName);
                
                IndexOperations indexOps = mongoTemplate.indexOps(collectionName);
                int indexCount = indexOps.getIndexInfo().size();
                
                collectionInfo.put("documentCount", count);
                collectionInfo.put("indexCount", indexCount);
                collections.put(collectionName, collectionInfo);
            }
            
            response.put("success", true);
            response.put("databaseName", databaseName);
            response.put("totalCollections", collectionNames.size());
            response.put("collections", collections);
            response.put("timestamp", LocalDateTime.now().toString());
            
            // Check if custom domains are ready
            boolean domainsReady = collectionNames.contains("domains") && 
                                 ((Map<String, Object>) collections.get("domains")).get("indexCount").equals(4);
            response.put("customDomainsReady", domainsReady);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to get database status", e);
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Initialize all collections and indexes for the complete system
     */
    @PostMapping("/initialize-all")
    public ResponseEntity<Map<String, Object>> initializeAllCollections() {
        Map<String, Object> response = new HashMap<>();
        java.util.List<String> operations = new java.util.ArrayList<>();
        
        try {
            logger.info("=== INITIALIZING COMPLETE PEBLY DATABASE ===");
            
            // 1. Initialize domains collection
            operations.add("Initializing domains collection");
            initializeDomainsCollection();
            
            // 2. Initialize/update shortened_urls collection for custom domain support
            operations.add("Updating shortened_urls collection for custom domain support");
            updateUrlsCollectionForCustomDomains();
            
            // 3. Initialize users collection indexes
            operations.add("Initializing users collection indexes");
            initializeUsersCollection();
            
            // 4. Initialize analytics collection
            operations.add("Initializing analytics collection");
            initializeAnalyticsCollection();
            
            // 5. Initialize teams collection
            operations.add("Initializing teams collection");
            initializeTeamsCollection();
            
            // Get final status
            String databaseName = mongoTemplate.getDb().getName();
            java.util.Set<String> collectionNames = mongoTemplate.getDb().listCollectionNames().into(new java.util.HashSet<>());
            
            response.put("success", true);
            response.put("message", "Complete Pebly database initialized successfully!");
            response.put("databaseName", databaseName);
            response.put("operations", operations);
            response.put("totalCollections", collectionNames.size());
            response.put("collections", collectionNames);
            response.put("timestamp", LocalDateTime.now().toString());
            
            logger.info("=== COMPLETE PEBLY DATABASE READY ===");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to initialize complete database", e);
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("operations", operations);
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Clean up test data from all collections
     */
    @DeleteMapping("/cleanup-test-data")
    public ResponseEntity<Map<String, Object>> cleanupTestData() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Map<String, Long> deletedCounts = new HashMap<>();
            
            // Clean test domains
            org.springframework.data.mongodb.core.query.Query domainQuery = 
                org.springframework.data.mongodb.core.query.Query.query(
                    org.springframework.data.mongodb.core.query.Criteria.where("domainName").regex("^(test-|demo\\.|sample\\.).*")
                );
            long deletedDomains = mongoTemplate.remove(domainQuery, "domains").getDeletedCount();
            deletedCounts.put("domains", deletedDomains);
            
            // Clean test URLs
            org.springframework.data.mongodb.core.query.Query urlQuery = 
                org.springframework.data.mongodb.core.query.Query.query(
                    org.springframework.data.mongodb.core.query.Criteria.where("userId").regex("^(test-|sample-).*")
                );
            long deletedUrls = mongoTemplate.remove(urlQuery, "shortened_urls").getDeletedCount();
            deletedCounts.put("urls", deletedUrls);
            
            // Clean test users
            org.springframework.data.mongodb.core.query.Query userQuery = 
                org.springframework.data.mongodb.core.query.Query.query(
                    org.springframework.data.mongodb.core.query.Criteria.where("email").regex(".*test.*")
                );
            long deletedUsers = mongoTemplate.remove(userQuery, "users").getDeletedCount();
            deletedCounts.put("users", deletedUsers);
            
            response.put("success", true);
            response.put("message", "Test data cleanup completed");
            response.put("deletedCounts", deletedCounts);
            response.put("timestamp", LocalDateTime.now().toString());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to cleanup test data", e);
            response.put("success", false);
            response.put("error", e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    // Private helper methods
    
    private void initializeDomainsCollection() {
        if (!mongoTemplate.collectionExists("domains")) {
            mongoTemplate.createCollection("domains");
        }
        createDomainsIndexes();
        insertSampleDomain();
    }
    
    private void updateUrlsCollectionForCustomDomains() {
        if (mongoTemplate.collectionExists("shortened_urls")) {
            // Add domain field to existing URLs that don't have it
            org.springframework.data.mongodb.core.query.Query query = 
                org.springframework.data.mongodb.core.query.Query.query(
                    org.springframework.data.mongodb.core.query.Criteria.where("domain").exists(false)
                );
            
            org.springframework.data.mongodb.core.query.Update update = 
                new org.springframework.data.mongodb.core.query.Update()
                    .set("domain", null)
                    .set("updatedAt", LocalDateTime.now());
            
            long updatedCount = mongoTemplate.updateMulti(query, update, "shortened_urls").getModifiedCount();
            logger.info("Updated {} URLs with domain field", updatedCount);
            
            // Create indexes for custom domain support
            IndexOperations indexOps = mongoTemplate.indexOps("shortened_urls");
            
            try {
                // Compound index for shortCode + domain (most important for URL resolution)
                indexOps.ensureIndex(
                    new Index()
                        .on("shortCode", org.springframework.data.domain.Sort.Direction.ASC)
                        .on("domain", org.springframework.data.domain.Sort.Direction.ASC)
                        .named("idx_shortcode_domain_compound")
                );
                
                // Index on domain for filtering
                indexOps.ensureIndex(
                    new Index()
                        .on("domain", org.springframework.data.domain.Sort.Direction.ASC)
                        .named("idx_domain")
                );
                
                logger.info("✅ Created URL indexes for custom domain support");
                
            } catch (Exception e) {
                logger.warn("Some URL indexes may already exist: {}", e.getMessage());
            }
        }
    }
    
    private void initializeUsersCollection() {
        if (!mongoTemplate.collectionExists("users")) {
            mongoTemplate.createCollection("users");
        }
        
        IndexOperations indexOps = mongoTemplate.indexOps("users");
        
        try {
            // Unique index on email
            indexOps.ensureIndex(
                new Index()
                    .on("email", org.springframework.data.domain.Sort.Direction.ASC)
                    .unique()
                    .named("idx_user_email_unique")
            );
            
            // Index on googleId
            indexOps.ensureIndex(
                new Index()
                    .on("googleId", org.springframework.data.domain.Sort.Direction.ASC)
                    .named("idx_user_google_id")
            );
            
            logger.info("✅ Created users collection indexes");
            
        } catch (Exception e) {
            logger.warn("Some user indexes may already exist: {}", e.getMessage());
        }
    }
    
    private void initializeAnalyticsCollection() {
        if (!mongoTemplate.collectionExists("analytics")) {
            mongoTemplate.createCollection("analytics");
        }
        
        IndexOperations indexOps = mongoTemplate.indexOps("analytics");
        
        try {
            // Compound index for URL analytics
            indexOps.ensureIndex(
                new Index()
                    .on("shortCode", org.springframework.data.domain.Sort.Direction.ASC)
                    .on("timestamp", org.springframework.data.domain.Sort.Direction.DESC)
                    .named("idx_analytics_shortcode_timestamp")
            );
            
            // Index on userId for user analytics
            indexOps.ensureIndex(
                new Index()
                    .on("userId", org.springframework.data.domain.Sort.Direction.ASC)
                    .named("idx_analytics_user_id")
            );
            
            logger.info("✅ Created analytics collection indexes");
            
        } catch (Exception e) {
            logger.warn("Some analytics indexes may already exist: {}", e.getMessage());
        }
    }
    
    private void initializeTeamsCollection() {
        if (!mongoTemplate.collectionExists("teams")) {
            mongoTemplate.createCollection("teams");
        }
        
        IndexOperations indexOps = mongoTemplate.indexOps("teams");
        
        try {
            // Unique index on team name
            indexOps.ensureIndex(
                new Index()
                    .on("name", org.springframework.data.domain.Sort.Direction.ASC)
                    .unique()
                    .named("idx_team_name_unique")
            );
            
            // Index on owner
            indexOps.ensureIndex(
                new Index()
                    .on("ownerId", org.springframework.data.domain.Sort.Direction.ASC)
                    .named("idx_team_owner")
            );
            
            logger.info("✅ Created teams collection indexes");
            
        } catch (Exception e) {
            logger.warn("Some team indexes may already exist: {}", e.getMessage());
        }
    }
    
    private void insertSampleDomain() {
        try {
            // Check if sample domain already exists
            org.springframework.data.mongodb.core.query.Query query = 
                org.springframework.data.mongodb.core.query.Query.query(
                    org.springframework.data.mongodb.core.query.Criteria.where("domainName").is("demo.example.com")
                );
            
            boolean exists = mongoTemplate.exists(query, "domains");
            
            if (!exists) {
                Map<String, Object> sampleDomain = new HashMap<>();
                sampleDomain.put("domainName", "demo.example.com");
                sampleDomain.put("ownerType", "USER");
                sampleDomain.put("ownerId", "sample-user-id");
                sampleDomain.put("verificationToken", "sample-token-123");
                sampleDomain.put("status", "VERIFIED");
                sampleDomain.put("sslStatus", "ACTIVE");
                sampleDomain.put("cnameTarget", "pebly.vercel.app");
                sampleDomain.put("verificationAttempts", 1);
                sampleDomain.put("sslProvider", "CLOUDFLARE");
                sampleDomain.put("totalRedirects", 0L);
                sampleDomain.put("isBlacklisted", false);
                sampleDomain.put("createdAt", LocalDateTime.now());
                sampleDomain.put("updatedAt", LocalDateTime.now());
                
                mongoTemplate.insert(sampleDomain, "domains");
                logger.info("✅ Created sample domain: demo.example.com");
            } else {
                logger.info("ℹ️ Sample domain already exists");
            }
            
        } catch (Exception e) {
            logger.warn("Failed to create sample domain: {}", e.getMessage());
        }
    }
}