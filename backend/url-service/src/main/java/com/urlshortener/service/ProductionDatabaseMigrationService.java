package com.urlshortener.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.urlshortener.model.Domain;
import com.urlshortener.model.ShortenedUrl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Production-safe database migration service for custom domain feature
 * This service performs safe migrations on existing production data
 */
@Service
public class ProductionDatabaseMigrationService {
    
    private static final Logger logger = LoggerFactory.getLogger(ProductionDatabaseMigrationService.class);
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    /**
     * Check the current state of the production database
     */
    public Map<String, Object> checkDatabaseState() {
        Map<String, Object> state = new HashMap<>();
        
        try {
            // Check existing collections
            boolean hasUsers = mongoTemplate.collectionExists("users");
            boolean hasUrls = mongoTemplate.collectionExists("shortened_urls");
            boolean hasTeams = mongoTemplate.collectionExists("teams");
            boolean hasDomains = mongoTemplate.collectionExists("domains");
            
            state.put("collections", Map.of(
                "users", hasUsers,
                "shortened_urls", hasUrls,
                "teams", hasTeams,
                "domains", hasDomains
            ));
            
            // Count existing data
            long userCount = hasUsers ? mongoTemplate.count(new Query(), "users") : 0;
            long urlCount = hasUrls ? mongoTemplate.count(new Query(), "shortened_urls") : 0;
            long teamCount = hasTeams ? mongoTemplate.count(new Query(), "teams") : 0;
            long domainCount = hasDomains ? mongoTemplate.count(new Query(), "domains") : 0;
            
            state.put("counts", Map.of(
                "users", userCount,
                "urls", urlCount,
                "teams", teamCount,
                "domains", domainCount
            ));
            
            // Check if URLs already have domain field
            long urlsWithDomainField = hasUrls ? 
                mongoTemplate.count(new Query(Criteria.where("domain").exists(true)), "shortened_urls") : 0;
            
            state.put("migration_status", Map.of(
                "urls_with_domain_field", urlsWithDomainField,
                "urls_need_migration", urlCount - urlsWithDomainField,
                "migration_required", urlsWithDomainField < urlCount
            ));
            
            // Check existing indexes
            if (hasUrls) {
                IndexOperations urlIndexOps = mongoTemplate.indexOps("shortened_urls");
                List<org.springframework.data.mongodb.core.index.IndexInfo> urlIndexes = urlIndexOps.getIndexInfo();
                
                boolean hasShortCodeDomainIndex = urlIndexes.stream()
                    .anyMatch(idx -> "idx_shortcode_domain_compound".equals(idx.getName()));
                
                state.put("indexes", Map.of(
                    "url_indexes_count", urlIndexes.size(),
                    "has_domain_indexes", hasShortCodeDomainIndex
                ));
            }
            
            logger.info("Database state check completed successfully");
            
        } catch (Exception e) {
            logger.error("Failed to check database state", e);
            state.put("error", e.getMessage());
        }
        
        return state;
    }
    
    /**
     * Safely create the domains collection and indexes
     */
    public Map<String, Object> initializeDomainsCollection() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            logger.info("Initializing domains collection for production...");
            
            // Check if domains collection already exists
            if (mongoTemplate.collectionExists(Domain.class)) {
                logger.info("Domains collection already exists, checking indexes...");
                result.put("collection_created", false);
                result.put("message", "Domains collection already exists");
            } else {
                // Create the collection
                mongoTemplate.createCollection(Domain.class);
                logger.info("Created domains collection");
                result.put("collection_created", true);
            }
            
            // Create indexes safely (createIndex is idempotent)
            IndexOperations indexOps = mongoTemplate.indexOps(Domain.class);
            
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
            
            // 6. Index on reservedUntil for cleanup
            indexOps.ensureIndex(
                new Index()
                    .on("reservedUntil", org.springframework.data.domain.Sort.Direction.ASC)
                    .named("idx_reserved_until")
                    .background()
            );
            
            // 7. Index on nextReconfirmationDue
            indexOps.ensureIndex(
                new Index()
                    .on("nextReconfirmationDue", org.springframework.data.domain.Sort.Direction.ASC)
                    .named("idx_reconfirmation_due")
                    .background()
            );
            
            // 8. Index on sslExpiresAt
            indexOps.ensureIndex(
                new Index()
                    .on("sslExpiresAt", org.springframework.data.domain.Sort.Direction.ASC)
                    .named("idx_ssl_expires")
                    .background()
            );
            
            // 9. Index on createdAt
            indexOps.ensureIndex(
                new Index()
                    .on("createdAt", org.springframework.data.domain.Sort.Direction.DESC)
                    .named("idx_created_at_desc")
                    .background()
            );
            
            // 10. Compound index for pending verification
            indexOps.ensureIndex(
                new Index()
                    .on("status", org.springframework.data.domain.Sort.Direction.ASC)
                    .on("verificationAttempts", org.springframework.data.domain.Sort.Direction.ASC)
                    .named("idx_status_attempts")
                    .background()
            );
            
            result.put("indexes_created", 10);
            result.put("success", true);
            
            logger.info("Successfully initialized domains collection with {} indexes", 10);
            
        } catch (Exception e) {
            logger.error("Failed to initialize domains collection", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Safely migrate existing URLs to support custom domains
     */
    public Map<String, Object> migrateUrlsForCustomDomains() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            logger.info("Starting safe migration of URLs for custom domain support...");
            
            // Check if shortened_urls collection exists
            if (!mongoTemplate.collectionExists("shortened_urls")) {
                result.put("success", false);
                result.put("message", "shortened_urls collection does not exist");
                return result;
            }
            
            // Count URLs that need migration
            Query needsMigrationQuery = new Query(Criteria.where("domain").exists(false));
            long urlsNeedingMigration = mongoTemplate.count(needsMigrationQuery, "shortened_urls");
            
            if (urlsNeedingMigration == 0) {
                result.put("success", true);
                result.put("message", "All URLs already have domain field");
                result.put("urls_migrated", 0);
                return result;
            }
            
            logger.info("Found {} URLs that need migration", urlsNeedingMigration);
            
            // Perform the migration in batches to avoid memory issues
            int batchSize = 1000;
            long totalMigrated = 0;
            
            while (true) {
                Query batchQuery = new Query(Criteria.where("domain").exists(false))
                    .limit(batchSize);
                
                Update update = new Update()
                    .set("domain", null) // null means default domain
                    .set("updatedAt", LocalDateTime.now());
                
                long batchResult = mongoTemplate.updateMulti(batchQuery, update, "shortened_urls")
                    .getModifiedCount();
                
                totalMigrated += batchResult;
                
                if (batchResult < batchSize) {
                    break; // No more documents to migrate
                }
                
                logger.info("Migrated {} URLs so far...", totalMigrated);
                
                // Small delay to avoid overwhelming the database
                Thread.sleep(100);
            }
            
            result.put("success", true);
            result.put("urls_migrated", totalMigrated);
            result.put("message", String.format("Successfully migrated %d URLs", totalMigrated));
            
            logger.info("Successfully migrated {} URLs for custom domain support", totalMigrated);
            
        } catch (Exception e) {
            logger.error("Failed to migrate URLs for custom domains", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Add custom domain indexes to existing shortened_urls collection
     */
    public Map<String, Object> addCustomDomainIndexesToUrls() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            logger.info("Adding custom domain indexes to shortened_urls collection...");
            
            IndexOperations indexOps = mongoTemplate.indexOps("shortened_urls");
            
            // 1. Compound index on shortCode and domain for multi-tenant support
            indexOps.ensureIndex(
                new Index()
                    .on("shortCode", org.springframework.data.domain.Sort.Direction.ASC)
                    .on("domain", org.springframework.data.domain.Sort.Direction.ASC)
                    .named("idx_shortcode_domain_compound")
                    .background()
            );
            
            // 2. Index on domain for domain-specific queries
            indexOps.ensureIndex(
                new Index()
                    .on("domain", org.springframework.data.domain.Sort.Direction.ASC)
                    .named("idx_domain")
                    .background()
            );
            
            // 3. Compound index for domain analytics
            indexOps.ensureIndex(
                new Index()
                    .on("domain", org.springframework.data.domain.Sort.Direction.ASC)
                    .on("createdAt", org.springframework.data.domain.Sort.Direction.DESC)
                    .named("idx_domain_created")
                    .background()
            );
            
            result.put("success", true);
            result.put("indexes_added", 3);
            result.put("message", "Successfully added custom domain indexes to URLs collection");
            
            logger.info("Successfully added 3 custom domain indexes to shortened_urls collection");
            
        } catch (Exception e) {
            logger.error("Failed to add custom domain indexes to URLs", e);
            result.put("success", false);
            result.put("error", e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Validate the migration was successful
     */
    public Map<String, Object> validateMigration() {
        Map<String, Object> validation = new HashMap<>();
        
        try {
            // Check domains collection
            boolean domainsExists = mongoTemplate.collectionExists(Domain.class);
            long domainCount = domainsExists ? mongoTemplate.count(new Query(), Domain.class) : 0;
            
            // Check URLs collection
            boolean urlsExists = mongoTemplate.collectionExists("shortened_urls");
            long urlCount = urlsExists ? mongoTemplate.count(new Query(), "shortened_urls") : 0;
            long urlsWithDomainField = urlsExists ? 
                mongoTemplate.count(new Query(Criteria.where("domain").exists(true)), "shortened_urls") : 0;
            
            // Check indexes
            int domainIndexCount = 0;
            int urlIndexCount = 0;
            
            if (domainsExists) {
                IndexOperations domainIndexOps = mongoTemplate.indexOps(Domain.class);
                domainIndexCount = domainIndexOps.getIndexInfo().size();
            }
            
            if (urlsExists) {
                IndexOperations urlIndexOps = mongoTemplate.indexOps("shortened_urls");
                urlIndexCount = urlIndexOps.getIndexInfo().size();
            }
            
            validation.put("collections", Map.of(
                "domains_exists", domainsExists,
                "urls_exists", urlsExists
            ));
            
            validation.put("data", Map.of(
                "domain_count", domainCount,
                "url_count", urlCount,
                "urls_with_domain_field", urlsWithDomainField,
                "migration_complete", urlsWithDomainField == urlCount
            ));
            
            validation.put("indexes", Map.of(
                "domain_indexes", domainIndexCount,
                "url_indexes", urlIndexCount
            ));
            
            boolean migrationSuccessful = domainsExists && 
                                        (urlsWithDomainField == urlCount) && 
                                        domainIndexCount >= 10 && 
                                        urlIndexCount >= 5;
            
            validation.put("migration_successful", migrationSuccessful);
            validation.put("success", true);
            
        } catch (Exception e) {
            logger.error("Failed to validate migration", e);
            validation.put("success", false);
            validation.put("error", e.getMessage());
        }
        
        return validation;
    }
}