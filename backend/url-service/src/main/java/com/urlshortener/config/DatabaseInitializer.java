package com.urlshortener.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.urlshortener.model.Domain;

/**
 * Database initializer that ensures the domains collection exists on startup
 */
@Component
public class DatabaseInitializer implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(DatabaseInitializer.class);
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    @Override
    public void run(String... args) throws Exception {
        try {
            initializeDomainsCollection();
            logger.info("Database initialization completed successfully");
        } catch (Exception e) {
            logger.error("Database initialization failed", e);
            // Don't fail the application startup, just log the error
        }
    }
    
    private void initializeDomainsCollection() {
        logger.info("Initializing domains collection...");
        
        // Check if domains collection exists
        boolean exists = mongoTemplate.collectionExists(Domain.class);
        
        if (!exists) {
            logger.info("Creating domains collection...");
            mongoTemplate.createCollection(Domain.class);
        } else {
            logger.info("Domains collection already exists");
        }
        
        // Create indexes (this is idempotent - won't create duplicates)
        createDomainsIndexes();
        
        // Ensure shortened_urls collection has domain support
        ensureUrlDomainSupport();
        
        logger.info("Domains collection initialization completed");
    }
    
    private void createDomainsIndexes() {
        logger.info("Creating/verifying domains collection indexes...");
        
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
            
            logger.info("Successfully created/verified {} domain indexes", 5);
            
        } catch (Exception e) {
            logger.warn("Some indexes may already exist or failed to create: {}", e.getMessage());
        }
    }
    
    private void ensureUrlDomainSupport() {
        logger.info("Ensuring URL collection supports custom domains...");
        
        try {
            // Check if shortened_urls collection exists
            boolean urlsExist = mongoTemplate.collectionExists("shortened_urls");
            
            if (urlsExist) {
                IndexOperations urlIndexOps = mongoTemplate.indexOps("shortened_urls");
                
                // Add domain-related indexes
                urlIndexOps.ensureIndex(
                    new Index()
                        .on("shortCode", org.springframework.data.domain.Sort.Direction.ASC)
                        .on("domain", org.springframework.data.domain.Sort.Direction.ASC)
                        .named("idx_shortcode_domain_compound")
                        .background()
                );
                
                urlIndexOps.ensureIndex(
                    new Index()
                        .on("domain", org.springframework.data.domain.Sort.Direction.ASC)
                        .named("idx_domain")
                        .background()
                );
                
                logger.info("URL collection domain support verified");
            } else {
                logger.info("URL collection doesn't exist yet - will be created when first URL is shortened");
            }
            
        } catch (Exception e) {
            logger.warn("Failed to ensure URL domain support: {}", e.getMessage());
        }
    }
}