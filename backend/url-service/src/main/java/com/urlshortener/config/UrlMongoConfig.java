package com.urlshortener.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.urlshortener.model.ShortenedUrl;

/**
 * MongoDB configuration for ShortenedUrl collection with custom domain support
 */
@Component
public class UrlMongoConfig implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(UrlMongoConfig.class);
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    @Override
    public void run(String... args) throws Exception {
        try {
            setupUrlIndexes();
            logger.info("ShortenedUrl MongoDB configuration completed successfully");
        } catch (Exception e) {
            logger.error("Failed to configure ShortenedUrl MongoDB indexes", e);
        }
    }
    
    /**
     * Set up indexes for the shortened_urls collection with custom domain support
     */
    private void setupUrlIndexes() {
        IndexOperations indexOps = mongoTemplate.indexOps(ShortenedUrl.class);
        
        try {
            // 1. Existing unique index on shortCode (keep existing functionality)
            indexOps.ensureIndex(
                new Index()
                    .on("shortCode", org.springframework.data.domain.Sort.Direction.ASC)
                    .unique()
                    .named("idx_short_code_unique")
            );
        } catch (Exception e) {
            logger.warn("Index idx_short_code_unique already exists or conflicts with existing index: {}", e.getMessage());
        }
        
        // Create other indexes with error handling
        String[] indexNames = {
            "idx_shortcode_domain_compound",
            "idx_domain", 
            "idx_user_active",
            "idx_scope_active",
            "idx_custom_alias_unique",
            "idx_created_at_desc",
            "idx_expires_cleanup",
            "idx_total_clicks_desc",
            "idx_domain_created"
        };
        
        Index[] indexes = {
            // 2. NEW: Compound index on shortCode and domain for multi-tenant support
            new Index()
                .on("shortCode", org.springframework.data.domain.Sort.Direction.ASC)
                .on("domain", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_shortcode_domain_compound"),
            
            // 3. Index on domain for domain-specific queries
            new Index()
                .on("domain", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_domain"),
            
            // 4. Existing indexes for user queries
            new Index()
                .on("userId", org.springframework.data.domain.Sort.Direction.ASC)
                .on("isActive", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_user_active"),
            
            // 5. Scope-based indexes for team collaboration
            new Index()
                .on("scopeType", org.springframework.data.domain.Sort.Direction.ASC)
                .on("scopeId", org.springframework.data.domain.Sort.Direction.ASC)
                .on("isActive", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_scope_active"),
            
            // 6. Index for custom alias uniqueness
            new Index()
                .on("customAlias", org.springframework.data.domain.Sort.Direction.ASC)
                .unique()
                .sparse() // Only index non-null values
                .named("idx_custom_alias_unique"),
            
            // 7. Index for analytics and sorting
            new Index()
                .on("createdAt", org.springframework.data.domain.Sort.Direction.DESC)
                .named("idx_created_at_desc"),
            
            // 8. Index for expiration cleanup
            new Index()
                .on("expiresAt", org.springframework.data.domain.Sort.Direction.ASC)
                .on("isExpired", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_expires_cleanup"),
            
            // 9. Index for high-traffic URL identification
            new Index()
                .on("totalClicks", org.springframework.data.domain.Sort.Direction.DESC)
                .named("idx_total_clicks_desc"),
            
            // 10. Compound index for domain analytics
            new Index()
                .on("domain", org.springframework.data.domain.Sort.Direction.ASC)
                .on("createdAt", org.springframework.data.domain.Sort.Direction.DESC)
                .named("idx_domain_created")
        };
        
        int createdIndexes = 1; // Count the first index if it was created
        for (int i = 0; i < indexes.length; i++) {
            try {
                indexOps.ensureIndex(indexes[i]);
                createdIndexes++;
            } catch (Exception e) {
                logger.warn("Index {} already exists or conflicts: {}", indexNames[i], e.getMessage());
            }
        }
        
        logger.info("Successfully created/verified {} indexes for shortened_urls collection", createdIndexes);
    }
}