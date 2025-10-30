package com.urlshortener.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.urlshortener.model.Domain;

/**
 * MongoDB configuration for Custom Domain collections and indexes
 * This class ensures proper database setup for the custom domain feature
 */
@Component
public class DomainMongoConfig implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(DomainMongoConfig.class);
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    @Override
    public void run(String... args) throws Exception {
        try {
            setupDomainIndexes();
            logger.info("Custom Domain MongoDB configuration completed successfully");
        } catch (Exception e) {
            logger.error("Failed to configure Custom Domain MongoDB indexes", e);
        }
    }
    
    /**
     * Set up indexes for the domains collection
     */
    private void setupDomainIndexes() {
        IndexOperations indexOps = mongoTemplate.indexOps(Domain.class);
        
        // 1. Unique index on domainName (prevents duplicate domains)
        indexOps.ensureIndex(
            new Index()
                .on("domainName", org.springframework.data.domain.Sort.Direction.ASC)
                .unique()
                .named("idx_domain_name_unique")
        );
        
        // 2. Compound index on ownerId and ownerType (for fast owner queries)
        indexOps.ensureIndex(
            new Index()
                .on("ownerId", org.springframework.data.domain.Sort.Direction.ASC)
                .on("ownerType", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_owner_compound")
        );
        
        // 3. Index on status (for filtering by verification status)
        indexOps.ensureIndex(
            new Index()
                .on("status", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_domain_status")
        );
        
        // 4. Index on verificationToken (for fast token lookups)
        indexOps.ensureIndex(
            new Index()
                .on("verificationToken", org.springframework.data.domain.Sort.Direction.ASC)
                .unique()
                .named("idx_verification_token_unique")
        );
        
        // 5. Compound index for verified domains by owner (most common query)
        indexOps.ensureIndex(
            new Index()
                .on("ownerId", org.springframework.data.domain.Sort.Direction.ASC)
                .on("ownerType", org.springframework.data.domain.Sort.Direction.ASC)
                .on("status", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_owner_status_compound")
        );
        
        // 6. Index on reservedUntil for cleanup operations
        indexOps.ensureIndex(
            new Index()
                .on("reservedUntil", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_reserved_until")
        );
        
        // 7. Index on nextReconfirmationDue for scheduled reconfirmation
        indexOps.ensureIndex(
            new Index()
                .on("nextReconfirmationDue", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_reconfirmation_due")
        );
        
        // 8. Index on sslExpiresAt for SSL renewal monitoring
        indexOps.ensureIndex(
            new Index()
                .on("sslExpiresAt", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_ssl_expires")
        );
        
        // 9. Index on createdAt for sorting and analytics
        indexOps.ensureIndex(
            new Index()
                .on("createdAt", org.springframework.data.domain.Sort.Direction.DESC)
                .named("idx_created_at_desc")
        );
        
        // 10. Compound index for pending verification cleanup
        indexOps.ensureIndex(
            new Index()
                .on("status", org.springframework.data.domain.Sort.Direction.ASC)
                .on("verificationAttempts", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_status_attempts")
        );
        
        logger.info("Created {} indexes for domains collection", 10);
    }
}