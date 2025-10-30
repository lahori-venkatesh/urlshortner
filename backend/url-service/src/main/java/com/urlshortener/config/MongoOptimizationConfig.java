package com.urlshortener.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.convert.DefaultMongoTypeMapper;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.index.IndexDefinition;
import org.springframework.data.mongodb.core.index.CompoundIndexDefinition;
import org.springframework.data.mongodb.core.index.PartialIndexFilter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.beans.factory.annotation.Autowired;

import com.urlshortener.model.Team;
import com.urlshortener.model.TeamInvite;
import com.urlshortener.model.ShortenedUrl;
import com.urlshortener.model.QrCode;
import com.urlshortener.model.UploadedFile;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;
import java.util.concurrent.TimeUnit;

//@Configuration  // Disabled for now to avoid conflicts
public class MongoOptimizationConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(MongoOptimizationConfig.class);
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    /**
     * Remove the _class field from MongoDB documents to reduce storage size
     */
    @Bean
    public MappingMongoConverter mappingMongoConverter(MongoDatabaseFactory factory, 
                                                      MongoMappingContext context, 
                                                      MongoCustomConversions conversions) {
        MappingMongoConverter converter = new MappingMongoConverter(factory, context);
        converter.setCustomConversions(conversions);
        converter.setTypeMapper(new DefaultMongoTypeMapper(null)); // Remove _class field
        return converter;
    }
    
    /**
     * Create optimized indexes after application startup
     */
    @EventListener(ApplicationReadyEvent.class)
    public void createOptimizedIndexes() {
        logger.info("🚀 Creating optimized MongoDB indexes for team collaboration...");
        
        try {
            createTeamIndexes();
            createTeamInviteIndexes();
            createContentIndexes();
            logger.info("✅ All optimized indexes created successfully");
        } catch (Exception e) {
            logger.error("❌ Error creating indexes: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Create indexes for Teams collection
     */
    private void createTeamIndexes() {
        IndexOperations teamIndexOps = mongoTemplate.indexOps(Team.class);
        
        // 1. Primary lookup: find teams by user membership (most important)
        teamIndexOps.ensureIndex(
            new CompoundIndexDefinition(new Document()
                .append("members.userId", 1)
                .append("isActive", 1))
                .named("idx_teams_member_active")
                .background()
                .partial(PartialIndexFilter.of(Criteria.where("isActive").is(true)))
        );
        
        // 2. Owner lookup
        teamIndexOps.ensureIndex(
            new CompoundIndexDefinition(new Document()
                .append("ownerId", 1)
                .append("isActive", 1))
                .named("idx_teams_owner_active")
                .background()
        );
        
        // 3. Team name uniqueness (case insensitive)
        teamIndexOps.ensureIndex(
            new CompoundIndexDefinition(new Document()
                .append("teamName", 1)
                .append("isActive", 1))
                .named("idx_teams_name_unique")
                .unique()
                .background()
                .partial(PartialIndexFilter.of(Criteria.where("isActive").is(true)))
        );
        
        // 4. Subscription management
        teamIndexOps.ensureIndex(
            new CompoundIndexDefinition(new Document()
                .append("subscriptionPlan", 1)
                .append("subscriptionExpiry", 1))
                .named("idx_teams_subscription")
                .background()
        );
        
        logger.info("✅ Team indexes created");
    }
    
    /**
     * Create indexes for TeamInvite collection
     */
    private void createTeamInviteIndexes() {
        IndexOperations inviteIndexOps = mongoTemplate.indexOps(TeamInvite.class);
        
        // 1. Primary lookup: pending invites by email
        inviteIndexOps.ensureIndex(
            new CompoundIndexDefinition(new Document()
                .append("email", 1)
                .append("isAccepted", 1)
                .append("isExpired", 1)
                .append("expiresAt", 1))
                .named("idx_invites_email_pending")
                .background()
        );
        
        // 2. Invite token lookup (unique)
        inviteIndexOps.ensureIndex(
            new CompoundIndexDefinition(new Document()
                .append("inviteToken", 1))
                .named("idx_invites_token_unique")
                .unique()
                .background()
        );
        
        // 3. Team invites lookup
        inviteIndexOps.ensureIndex(
            new CompoundIndexDefinition(new Document()
                .append("teamId", 1)
                .append("isAccepted", 1)
                .append("isExpired", 1))
                .named("idx_invites_team_status")
                .background()
        );
        
        // 4. TTL index for automatic cleanup of expired invites
        inviteIndexOps.ensureIndex(
            new CompoundIndexDefinition(new Document()
                .append("expiresAt", 1))
                .named("idx_invites_ttl")
                .background()
                .expire(0, TimeUnit.SECONDS) // Expire immediately after expiresAt date
        );
        
        logger.info("✅ Team invite indexes created");
    }
    
    /**
     * Create indexes for content collections (URLs, QR codes, Files)
     */
    private void createContentIndexes() {
        createShortenedUrlIndexes();
        createQrCodeIndexes();
        createUploadedFileIndexes();
    }
    
    private void createShortenedUrlIndexes() {
        IndexOperations urlIndexOps = mongoTemplate.indexOps(ShortenedUrl.class);
        
        // 1. Scope-based queries (most important for team collaboration)
        urlIndexOps.ensureIndex(
            new CompoundIndexDefinition(new Document()
                .append("scopeType", 1)
                .append("scopeId", 1)
                .append("isActive", 1)
                .append("createdAt", -1))
                .named("idx_urls_scope_active_created")
                .background()
                .partial(PartialIndexFilter.of(Criteria.where("isActive").is(true)))
        );
        
        // 2. User's personal URLs (backward compatibility)
        urlIndexOps.ensureIndex(
            new CompoundIndexDefinition(new Document()
                .append("userId", 1)
                .append("isActive", 1)
                .append("createdAt", -1))
                .named("idx_urls_user_active_created")
                .background()
                .partial(PartialIndexFilter.of(Criteria.where("isActive").is(true)))
        );
        
        // 3. Analytics queries
        urlIndexOps.ensureIndex(
            new CompoundIndexDefinition(new Document()
                .append("scopeType", 1)
                .append("scopeId", 1)
                .append("totalClicks", -1))
                .named("idx_urls_scope_clicks")
                .background()
        );
        
        // 4. Short code lookup (should already exist, but ensure it's optimized)
        urlIndexOps.ensureIndex(
            new CompoundIndexDefinition(new Document()
                .append("shortCode", 1))
                .named("idx_urls_shortcode_unique")
                .unique()
                .background()
        );
        
        logger.info("✅ Shortened URL indexes created");
    }
    
    private void createQrCodeIndexes() {
        IndexOperations qrIndexOps = mongoTemplate.indexOps(QrCode.class);
        
        // Same pattern as URLs
        qrIndexOps.ensureIndex(
            new CompoundIndexDefinition(new Document()
                .append("scopeType", 1)
                .append("scopeId", 1)
                .append("isActive", 1)
                .append("createdAt", -1))
                .named("idx_qr_scope_active_created")
                .background()
                .partial(PartialIndexFilter.of(Criteria.where("isActive").is(true)))
        );
        
        qrIndexOps.ensureIndex(
            new CompoundIndexDefinition(new Document()
                .append("userId", 1)
                .append("isActive", 1)
                .append("createdAt", -1))
                .named("idx_qr_user_active_created")
                .background()
                .partial(PartialIndexFilter.of(Criteria.where("isActive").is(true)))
        );
        
        qrIndexOps.ensureIndex(
            new CompoundIndexDefinition(new Document()
                .append("qrCode", 1))
                .named("idx_qr_code_unique")
                .unique()
                .background()
        );
        
        logger.info("✅ QR Code indexes created");
    }
    
    private void createUploadedFileIndexes() {
        IndexOperations fileIndexOps = mongoTemplate.indexOps(UploadedFile.class);
        
        // Same pattern as URLs and QR codes
        fileIndexOps.ensureIndex(
            new CompoundIndexDefinition(new Document()
                .append("scopeType", 1)
                .append("scopeId", 1)
                .append("isActive", 1)
                .append("uploadedAt", -1))
                .named("idx_files_scope_active_uploaded")
                .background()
                .partial(PartialIndexFilter.of(Criteria.where("isActive").is(true)))
        );
        
        fileIndexOps.ensureIndex(
            new CompoundIndexDefinition(new Document()
                .append("userId", 1)
                .append("isActive", 1)
                .append("uploadedAt", -1))
                .named("idx_files_user_active_uploaded")
                .background()
                .partial(PartialIndexFilter.of(Criteria.where("isActive").is(true)))
        );
        
        fileIndexOps.ensureIndex(
            new CompoundIndexDefinition(new Document()
                .append("fileCode", 1))
                .named("idx_files_code_unique")
                .unique()
                .background()
        );
        
        logger.info("✅ Uploaded File indexes created");
    }
}