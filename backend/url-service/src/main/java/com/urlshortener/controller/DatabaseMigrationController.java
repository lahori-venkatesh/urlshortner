package com.urlshortener.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.index.PartialIndexFilter;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/v1/database")
@CrossOrigin(origins = "*")
public class DatabaseMigrationController {
    
    private static final Logger logger = LoggerFactory.getLogger(DatabaseMigrationController.class);
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    @PostMapping("/deploy-team-collaboration")
    public ResponseEntity<Map<String, Object>> deployTeamCollaboration() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Starting team collaboration deployment...");
            
            // Step 1: Create team collaboration indexes
            createTeamCollaborationIndexes();
            
            // Step 2: Migrate existing data
            migrateExistingData();
            
            // Step 3: Verify deployment
            Map<String, Object> verification = verifyDeployment();
            
            response.put("success", true);
            response.put("message", "Team collaboration deployed successfully");
            response.put("timestamp", LocalDateTime.now());
            response.put("verification", verification);
            
            logger.info("Team collaboration deployment completed successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Team collaboration deployment failed", e);
            
            response.put("success", false);
            response.put("message", "Deployment failed: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    private void createTeamCollaborationIndexes() {
        logger.info("Creating team collaboration indexes...");
        
        // TEAMS COLLECTION INDEXES
        IndexOperations teamsIndexOps = mongoTemplate.indexOps("teams");
        
        // Primary lookup: find teams by user membership
        teamsIndexOps.ensureIndex(
            new Index()
                .on("members.userId", org.springframework.data.domain.Sort.Direction.ASC)
                .on("isActive", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_teams_member_active")
                .background()
                .partial(PartialIndexFilter.of(Criteria.where("isActive").is(true)))
        );
        
        // Owner lookup
        teamsIndexOps.ensureIndex(
            new Index()
                .on("ownerId", org.springframework.data.domain.Sort.Direction.ASC)
                .on("isActive", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_teams_owner_active")
                .background()
        );
        
        // Team name uniqueness
        teamsIndexOps.ensureIndex(
            new Index()
                .on("teamName", org.springframework.data.domain.Sort.Direction.ASC)
                .on("isActive", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_teams_name_active")
                .background()
                .partial(PartialIndexFilter.of(Criteria.where("isActive").is(true)))
        );
        
        // Subscription management
        teamsIndexOps.ensureIndex(
            new Index()
                .on("subscriptionPlan", org.springframework.data.domain.Sort.Direction.ASC)
                .on("subscriptionExpiry", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_teams_subscription")
                .background()
        );
        
        // TEAM INVITES COLLECTION INDEXES
        IndexOperations invitesIndexOps = mongoTemplate.indexOps("team_invites");
        
        // Primary lookup: pending invites by email
        invitesIndexOps.ensureIndex(
            new Index()
                .on("email", org.springframework.data.domain.Sort.Direction.ASC)
                .on("isAccepted", org.springframework.data.domain.Sort.Direction.ASC)
                .on("isExpired", org.springframework.data.domain.Sort.Direction.ASC)
                .on("expiresAt", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_invites_email_pending")
                .background()
        );
        
        // Invite token lookup (unique)
        invitesIndexOps.ensureIndex(
            new Index()
                .on("inviteToken", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_invites_token_unique")
                .unique()
                .background()
        );
        
        // Team invites lookup
        invitesIndexOps.ensureIndex(
            new Index()
                .on("teamId", org.springframework.data.domain.Sort.Direction.ASC)
                .on("isAccepted", org.springframework.data.domain.Sort.Direction.ASC)
                .on("isExpired", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_invites_team_status")
                .background()
        );
        
        // ENHANCED EXISTING COLLECTIONS
        
        // Shortened URLs - Scope-based queries
        IndexOperations urlsIndexOps = mongoTemplate.indexOps("shortened_urls");
        urlsIndexOps.ensureIndex(
            new Index()
                .on("scopeType", org.springframework.data.domain.Sort.Direction.ASC)
                .on("scopeId", org.springframework.data.domain.Sort.Direction.ASC)
                .on("isActive", org.springframework.data.domain.Sort.Direction.ASC)
                .on("createdAt", org.springframework.data.domain.Sort.Direction.DESC)
                .named("idx_urls_scope_active_created")
                .background()
                .partial(PartialIndexFilter.of(Criteria.where("isActive").is(true)))
        );
        
        // Analytics queries by scope
        urlsIndexOps.ensureIndex(
            new Index()
                .on("scopeType", org.springframework.data.domain.Sort.Direction.ASC)
                .on("scopeId", org.springframework.data.domain.Sort.Direction.ASC)
                .on("totalClicks", org.springframework.data.domain.Sort.Direction.DESC)
                .named("idx_urls_scope_clicks")
                .background()
        );
        
        // QR Codes - Scope-based queries
        IndexOperations qrIndexOps = mongoTemplate.indexOps("qr_codes");
        qrIndexOps.ensureIndex(
            new Index()
                .on("scopeType", org.springframework.data.domain.Sort.Direction.ASC)
                .on("scopeId", org.springframework.data.domain.Sort.Direction.ASC)
                .on("isActive", org.springframework.data.domain.Sort.Direction.ASC)
                .on("createdAt", org.springframework.data.domain.Sort.Direction.DESC)
                .named("idx_qr_scope_active_created")
                .background()
                .partial(PartialIndexFilter.of(Criteria.where("isActive").is(true)))
        );
        
        // Uploaded Files - Scope-based queries
        IndexOperations filesIndexOps = mongoTemplate.indexOps("uploaded_files");
        filesIndexOps.ensureIndex(
            new Index()
                .on("scopeType", org.springframework.data.domain.Sort.Direction.ASC)
                .on("scopeId", org.springframework.data.domain.Sort.Direction.ASC)
                .on("isActive", org.springframework.data.domain.Sort.Direction.ASC)
                .on("uploadedAt", org.springframework.data.domain.Sort.Direction.DESC)
                .named("idx_files_scope_active_uploaded")
                .background()
                .partial(PartialIndexFilter.of(Criteria.where("isActive").is(true)))
        );
        
        logger.info("Team collaboration indexes created successfully");
    }
    
    private void migrateExistingData() {
        logger.info("Migrating existing data for team collaboration...");
        
        // Migrate shortened URLs
        Query urlQuery = new Query(Criteria.where("scopeType").exists(false));
        Update urlUpdate = new Update()
            .set("scopeType", "USER")
            .set("updatedAt", LocalDateTime.now());
        
        // Use aggregation to set scopeId to userId value
        List<Map> urls = mongoTemplate.find(urlQuery, Map.class, "shortened_urls");
        for (Map url : urls) {
            String userId = (String) url.get("userId");
            if (userId != null) {
                Query singleUrlQuery = new Query(Criteria.where("_id").is(url.get("_id")));
                Update singleUrlUpdate = new Update()
                    .set("scopeType", "USER")
                    .set("scopeId", userId)
                    .set("updatedAt", LocalDateTime.now());
                mongoTemplate.updateFirst(singleUrlQuery, singleUrlUpdate, "shortened_urls");
            }
        }
        
        // Migrate QR codes
        Query qrQuery = new Query(Criteria.where("scopeType").exists(false));
        List<Map> qrCodes = mongoTemplate.find(qrQuery, Map.class, "qr_codes");
        for (Map qr : qrCodes) {
            String userId = (String) qr.get("userId");
            if (userId != null) {
                Query singleQrQuery = new Query(Criteria.where("_id").is(qr.get("_id")));
                Update singleQrUpdate = new Update()
                    .set("scopeType", "USER")
                    .set("scopeId", userId)
                    .set("updatedAt", LocalDateTime.now());
                mongoTemplate.updateFirst(singleQrQuery, singleQrUpdate, "qr_codes");
            }
        }
        
        // Migrate uploaded files
        Query fileQuery = new Query(Criteria.where("scopeType").exists(false));
        List<Map> files = mongoTemplate.find(fileQuery, Map.class, "uploaded_files");
        for (Map file : files) {
            String userId = (String) file.get("userId");
            if (userId != null) {
                Query singleFileQuery = new Query(Criteria.where("_id").is(file.get("_id")));
                Update singleFileUpdate = new Update()
                    .set("scopeType", "USER")
                    .set("scopeId", userId)
                    .set("updatedAt", LocalDateTime.now());
                mongoTemplate.updateFirst(singleFileQuery, singleFileUpdate, "uploaded_files");
            }
        }
        
        logger.info("Data migration completed successfully");
    }
    
    private Map<String, Object> verifyDeployment() {
        Map<String, Object> verification = new HashMap<>();
        
        // Check collections
        boolean hasTeams = mongoTemplate.collectionExists("teams");
        boolean hasInvites = mongoTemplate.collectionExists("team_invites");
        
        verification.put("teamsCollectionExists", hasTeams);
        verification.put("teamInvitesCollectionExists", hasInvites);
        
        // Check indexes
        IndexOperations teamsIndexOps = mongoTemplate.indexOps("teams");
        IndexOperations invitesIndexOps = mongoTemplate.indexOps("team_invites");
        IndexOperations urlsIndexOps = mongoTemplate.indexOps("shortened_urls");
        
        verification.put("teamsIndexCount", teamsIndexOps.getIndexInfo().size());
        verification.put("invitesIndexCount", invitesIndexOps.getIndexInfo().size());
        verification.put("urlsIndexCount", urlsIndexOps.getIndexInfo().size());
        
        // Check migrated data
        long urlsWithScope = mongoTemplate.count(
            new Query(Criteria.where("scopeType").exists(true)), 
            "shortened_urls"
        );
        long qrWithScope = mongoTemplate.count(
            new Query(Criteria.where("scopeType").exists(true)), 
            "qr_codes"
        );
        
        verification.put("urlsWithScopeCount", urlsWithScope);
        verification.put("qrCodesWithScopeCount", qrWithScope);
        
        return verification;
    }
    
    @GetMapping("/team-collaboration-status")
    public ResponseEntity<Map<String, Object>> getTeamCollaborationStatus() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Map<String, Object> status = verifyDeployment();
            
            boolean isDeployed = (Boolean) status.get("teamsCollectionExists") && 
                               (Integer) status.get("teamsIndexCount") > 1;
            
            response.put("success", true);
            response.put("isDeployed", isDeployed);
            response.put("status", status);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to check status: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}