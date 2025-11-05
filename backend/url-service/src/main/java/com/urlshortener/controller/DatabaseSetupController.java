package com.urlshortener.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.urlshortener.model.Domain;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/v1/setup")
@CrossOrigin(origins = "*")
public class DatabaseSetupController {
    
    private static final Logger logger = LoggerFactory.getLogger(DatabaseSetupController.class);
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    @GetMapping("/database-status")
    public ResponseEntity<Map<String, Object>> getDatabaseStatus() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Check collections
            boolean hasUsers = mongoTemplate.collectionExists("users");
            boolean hasUrls = mongoTemplate.collectionExists("shortened_urls");
            boolean hasTeams = mongoTemplate.collectionExists("teams");
            boolean hasDomains = mongoTemplate.collectionExists("domains");
            
            // Count documents
            long userCount = hasUsers ? mongoTemplate.count(new Query(), "users") : 0;
            long urlCount = hasUrls ? mongoTemplate.count(new Query(), "shortened_urls") : 0;
            long teamCount = hasTeams ? mongoTemplate.count(new Query(), "teams") : 0;
            long domainCount = hasDomains ? mongoTemplate.count(new Query(), "domains") : 0;
            
            // Check indexes
            int domainIndexes = 0;
            if (hasDomains) {
                IndexOperations domainIndexOps = mongoTemplate.indexOps("domains");
                domainIndexes = domainIndexOps.getIndexInfo().size();
            }
            
            response.put("success", true);
            response.put("timestamp", LocalDateTime.now());
            response.put("collections", Map.of(
                "users", Map.of("exists", hasUsers, "count", userCount),
                "shortened_urls", Map.of("exists", hasUrls, "count", urlCount),
                "teams", Map.of("exists", hasTeams, "count", teamCount),
                "domains", Map.of("exists", hasDomains, "count", domainCount, "indexes", domainIndexes)
            ));
            
            response.put("custom_domains_ready", hasDomains && domainIndexes > 1);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to get database status", e);
            
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/create-domains-collection")
    public ResponseEntity<Map<String, Object>> createDomainsCollection() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Creating domains collection...");
            
            // Check if collection already exists
            boolean exists = mongoTemplate.collectionExists("domains");
            
            if (!exists) {
                // Create the collection
                mongoTemplate.createCollection("domains");
                logger.info("Created domains collection");
                response.put("collection_created", true);
            } else {
                logger.info("Domains collection already exists");
                response.put("collection_created", false);
                response.put("message", "Collection already exists");
            }
            
            // Create indexes
            createDomainsIndexes();
            
            // Verify creation
            long domainCount = mongoTemplate.count(new Query(), "domains");
            IndexOperations indexOps = mongoTemplate.indexOps("domains");
            int indexCount = indexOps.getIndexInfo().size();
            
            response.put("success", true);
            response.put("timestamp", LocalDateTime.now());
            response.put("domain_count", domainCount);
            response.put("index_count", indexCount);
            response.put("message", "Domains collection is ready for custom domains");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to create domains collection", e);
            
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/create-sample-domain")
    public ResponseEntity<Map<String, Object>> createSampleDomain() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Creating sample domain...");
            
            // Ensure domains collection exists
            if (!mongoTemplate.collectionExists("domains")) {
                mongoTemplate.createCollection("domains");
                createDomainsIndexes();
            }
            
            // Create a sample domain
            Domain sampleDomain = new Domain();
            sampleDomain.setDomainName("demo.example.com");
            sampleDomain.setOwnerType("USER");
            sampleDomain.setOwnerId("sample-user-id");
            sampleDomain.setVerificationToken("sample-token-123");
            sampleDomain.setCnameTarget("pebly.vercel.app");
            sampleDomain.setStatus("VERIFIED");
            sampleDomain.setSslStatus("ACTIVE");
            sampleDomain.setSslProvider("CLOUDFLARE");
            sampleDomain.setCreatedAt(LocalDateTime.now());
            sampleDomain.setUpdatedAt(LocalDateTime.now());
            
            // Save to database
            Domain saved = mongoTemplate.save(sampleDomain);
            
            response.put("success", true);
            response.put("timestamp", LocalDateTime.now());
            response.put("sample_domain", Map.of(
                "id", saved.getId(),
                "domainName", saved.getDomainName(),
                "status", saved.getStatus(),
                "sslStatus", saved.getSslStatus()
            ));
            response.put("message", "Sample domain created successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to create sample domain", e);
            
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @GetMapping("/test-domain-query")
    public ResponseEntity<Map<String, Object>> testDomainQuery() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Test basic domain queries
            long totalDomains = mongoTemplate.count(new Query(), Domain.class);
            
            Query verifiedQuery = new Query(Criteria.where("status").is("VERIFIED"));
            long verifiedDomains = mongoTemplate.count(verifiedQuery, Domain.class);
            
            // Get sample domains
            Query sampleQuery = new Query().limit(3);
            List<Domain> sampleDomains = mongoTemplate.find(sampleQuery, Domain.class);
            
            response.put("success", true);
            response.put("timestamp", LocalDateTime.now());
            response.put("total_domains", totalDomains);
            response.put("verified_domains", verifiedDomains);
            response.put("sample_domains", sampleDomains.stream().map(d -> Map.of(
                "domainName", d.getDomainName(),
                "status", d.getStatus(),
                "ownerType", d.getOwnerType()
            )).toList());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to test domain queries", e);
            
            response.put("success", false);
            response.put("error", e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    private void createDomainsIndexes() {
        logger.info("Creating domains collection indexes...");
        
        IndexOperations indexOps = mongoTemplate.indexOps(Domain.class);
        
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
            
            logger.info("Successfully created domains collection indexes");
            
        } catch (Exception e) {
            logger.warn("Some indexes may already exist: {}", e.getMessage());
        }
    }
}