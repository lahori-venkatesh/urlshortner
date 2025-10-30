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

import com.urlshortener.service.DatabaseMigrationService;
import com.urlshortener.service.ProductionDatabaseMigrationService;
import com.urlshortener.model.Domain;

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
    
    @Autowired
    private DatabaseMigrationService databaseMigrationService;
    
    @Autowired
    private ProductionDatabaseMigrationService productionMigrationService;
    
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
    
    // ===== CUSTOM DOMAIN MIGRATION ENDPOINTS =====
    
    @PostMapping("/deploy-custom-domains")
    public ResponseEntity<Map<String, Object>> deployCustomDomains() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Starting custom domains deployment...");
            
            // Step 1: Create custom domain indexes
            createCustomDomainIndexes();
            
            // Step 2: Migrate existing URLs for custom domain support
            databaseMigrationService.migrateExistingUrls();
            
            // Step 3: Verify deployment
            Map<String, Object> verification = verifyCustomDomainDeployment();
            
            response.put("success", true);
            response.put("message", "Custom domains deployed successfully");
            response.put("timestamp", LocalDateTime.now());
            response.put("verification", verification);
            
            logger.info("Custom domains deployment completed successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Custom domains deployment failed", e);
            
            response.put("success", false);
            response.put("message", "Deployment failed: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @GetMapping("/custom-domains-status")
    public ResponseEntity<Map<String, Object>> getCustomDomainsStatus() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Map<String, Object> status = verifyCustomDomainDeployment();
            DatabaseMigrationService.DatabaseStats stats = databaseMigrationService.getDatabaseStats();
            
            boolean isDeployed = (Boolean) status.get("domainsCollectionExists") && 
                               (Integer) status.get("domainsIndexCount") > 1;
            
            response.put("success", true);
            response.put("isDeployed", isDeployed);
            response.put("status", status);
            response.put("statistics", Map.of(
                "totalDomains", stats.getTotalDomains(),
                "verifiedDomains", stats.getVerifiedDomains(),
                "pendingDomains", stats.getPendingDomains(),
                "totalUrls", stats.getTotalUrls(),
                "customDomainUrls", stats.getCustomDomainUrls()
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to check status: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/migrate-urls-for-domains")
    public ResponseEntity<Map<String, Object>> migrateUrlsForDomains() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Starting URL migration for custom domain support...");
            
            databaseMigrationService.migrateExistingUrls();
            
            response.put("success", true);
            response.put("message", "URLs migrated successfully for custom domain support");
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("URL migration failed", e);
            
            response.put("success", false);
            response.put("message", "Migration failed: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/cleanup-expired-domains")
    public ResponseEntity<Map<String, Object>> cleanupExpiredDomains() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Starting cleanup of expired domain reservations...");
            
            databaseMigrationService.cleanupExpiredReservations();
            
            response.put("success", true);
            response.put("message", "Expired domain reservations cleaned up successfully");
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Domain cleanup failed", e);
            
            response.put("success", false);
            response.put("message", "Cleanup failed: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/create-sample-domains")
    public ResponseEntity<Map<String, Object>> createSampleDomains() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Creating sample domains for testing...");
            
            databaseMigrationService.createSampleDomains();
            
            response.put("success", true);
            response.put("message", "Sample domains created successfully");
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Sample domain creation failed", e);
            
            response.put("success", false);
            response.put("message", "Sample creation failed: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    private void createCustomDomainIndexes() {
        logger.info("Creating custom domain indexes...");
        
        // DOMAINS COLLECTION INDEXES
        IndexOperations domainsIndexOps = mongoTemplate.indexOps(Domain.class);
        
        // 1. Unique index on domainName (prevents duplicate domains)
        domainsIndexOps.ensureIndex(
            new Index()
                .on("domainName", org.springframework.data.domain.Sort.Direction.ASC)
                .unique()
                .named("idx_domain_name_unique")
                .background()
        );
        
        // 2. Compound index on ownerId and ownerType (for fast owner queries)
        domainsIndexOps.ensureIndex(
            new Index()
                .on("ownerId", org.springframework.data.domain.Sort.Direction.ASC)
                .on("ownerType", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_owner_compound")
                .background()
        );
        
        // 3. Index on status (for filtering by verification status)
        domainsIndexOps.ensureIndex(
            new Index()
                .on("status", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_domain_status")
                .background()
        );
        
        // 4. Index on verificationToken (for fast token lookups)
        domainsIndexOps.ensureIndex(
            new Index()
                .on("verificationToken", org.springframework.data.domain.Sort.Direction.ASC)
                .unique()
                .named("idx_verification_token_unique")
                .background()
        );
        
        // 5. Compound index for verified domains by owner (most common query)
        domainsIndexOps.ensureIndex(
            new Index()
                .on("ownerId", org.springframework.data.domain.Sort.Direction.ASC)
                .on("ownerType", org.springframework.data.domain.Sort.Direction.ASC)
                .on("status", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_owner_status_compound")
                .background()
        );
        
        // ENHANCED SHORTENED URLS COLLECTION FOR CUSTOM DOMAINS
        IndexOperations urlsIndexOps = mongoTemplate.indexOps("shortened_urls");
        
        // Compound index on shortCode and domain for multi-tenant support
        urlsIndexOps.ensureIndex(
            new Index()
                .on("shortCode", org.springframework.data.domain.Sort.Direction.ASC)
                .on("domain", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_shortcode_domain_compound")
                .background()
        );
        
        // Index on domain for domain-specific queries
        urlsIndexOps.ensureIndex(
            new Index()
                .on("domain", org.springframework.data.domain.Sort.Direction.ASC)
                .named("idx_domain")
                .background()
        );
        
        logger.info("Custom domain indexes created successfully");
    }
    
    private Map<String, Object> verifyCustomDomainDeployment() {
        Map<String, Object> verification = new HashMap<>();
        
        // Check collections
        boolean hasDomains = mongoTemplate.collectionExists(Domain.class);
        boolean hasUrls = mongoTemplate.collectionExists("shortened_urls");
        
        verification.put("domainsCollectionExists", hasDomains);
        verification.put("urlsCollectionExists", hasUrls);
        
        // Check indexes
        IndexOperations domainsIndexOps = mongoTemplate.indexOps(Domain.class);
        IndexOperations urlsIndexOps = mongoTemplate.indexOps("shortened_urls");
        
        verification.put("domainsIndexCount", domainsIndexOps.getIndexInfo().size());
        verification.put("urlsIndexCount", urlsIndexOps.getIndexInfo().size());
        
        // Check migrated data
        long urlsWithDomainField = mongoTemplate.count(
            new Query(Criteria.where("domain").exists(true)), 
            "shortened_urls"
        );
        
        verification.put("urlsWithDomainFieldCount", urlsWithDomainField);
        
        return verification;
    }
    
    // ===== PRODUCTION MIGRATION ENDPOINTS =====
    
    @GetMapping("/check-production-database")
    public ResponseEntity<Map<String, Object>> checkProductionDatabase() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Checking production database state...");
            
            Map<String, Object> state = productionMigrationService.checkDatabaseState();
            
            response.put("success", true);
            response.put("message", "Database state checked successfully");
            response.put("timestamp", LocalDateTime.now());
            response.put("database_state", state);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to check production database", e);
            
            response.put("success", false);
            response.put("message", "Database check failed: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/initialize-domains-production")
    public ResponseEntity<Map<String, Object>> initializeDomainsProduction() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Initializing domains collection in production...");
            
            Map<String, Object> result = productionMigrationService.initializeDomainsCollection();
            
            response.put("success", (Boolean) result.get("success"));
            response.put("message", "Domains collection initialization completed");
            response.put("timestamp", LocalDateTime.now());
            response.put("result", result);
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(500).body(response);
            }
            
        } catch (Exception e) {
            logger.error("Failed to initialize domains collection", e);
            
            response.put("success", false);
            response.put("message", "Initialization failed: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/migrate-urls-production")
    public ResponseEntity<Map<String, Object>> migrateUrlsProduction() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Migrating URLs for custom domain support in production...");
            
            Map<String, Object> result = productionMigrationService.migrateUrlsForCustomDomains();
            
            response.put("success", (Boolean) result.get("success"));
            response.put("message", "URL migration completed");
            response.put("timestamp", LocalDateTime.now());
            response.put("result", result);
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(500).body(response);
            }
            
        } catch (Exception e) {
            logger.error("Failed to migrate URLs", e);
            
            response.put("success", false);
            response.put("message", "Migration failed: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/add-domain-indexes-production")
    public ResponseEntity<Map<String, Object>> addDomainIndexesProduction() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Adding custom domain indexes in production...");
            
            Map<String, Object> result = productionMigrationService.addCustomDomainIndexesToUrls();
            
            response.put("success", (Boolean) result.get("success"));
            response.put("message", "Index creation completed");
            response.put("timestamp", LocalDateTime.now());
            response.put("result", result);
            
            if ((Boolean) result.get("success")) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(500).body(response);
            }
            
        } catch (Exception e) {
            logger.error("Failed to add domain indexes", e);
            
            response.put("success", false);
            response.put("message", "Index creation failed: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/full-production-migration")
    public ResponseEntity<Map<String, Object>> fullProductionMigration() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Starting full production migration for custom domains...");
            
            // Step 1: Check current state
            Map<String, Object> initialState = productionMigrationService.checkDatabaseState();
            
            // Step 2: Initialize domains collection
            Map<String, Object> domainsResult = productionMigrationService.initializeDomainsCollection();
            if (!(Boolean) domainsResult.get("success")) {
                throw new RuntimeException("Failed to initialize domains collection: " + domainsResult.get("error"));
            }
            
            // Step 3: Migrate URLs
            Map<String, Object> urlsResult = productionMigrationService.migrateUrlsForCustomDomains();
            if (!(Boolean) urlsResult.get("success")) {
                throw new RuntimeException("Failed to migrate URLs: " + urlsResult.get("error"));
            }
            
            // Step 4: Add indexes
            Map<String, Object> indexesResult = productionMigrationService.addCustomDomainIndexesToUrls();
            if (!(Boolean) indexesResult.get("success")) {
                throw new RuntimeException("Failed to add indexes: " + indexesResult.get("error"));
            }
            
            // Step 5: Validate migration
            Map<String, Object> validation = productionMigrationService.validateMigration();
            
            response.put("success", true);
            response.put("message", "Full production migration completed successfully");
            response.put("timestamp", LocalDateTime.now());
            response.put("steps", Map.of(
                "initial_state", initialState,
                "domains_initialization", domainsResult,
                "urls_migration", urlsResult,
                "indexes_creation", indexesResult,
                "validation", validation
            ));
            
            logger.info("Full production migration completed successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Full production migration failed", e);
            
            response.put("success", false);
            response.put("message", "Full migration failed: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @GetMapping("/validate-production-migration")
    public ResponseEntity<Map<String, Object>> validateProductionMigration() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Validating production migration...");
            
            Map<String, Object> validation = productionMigrationService.validateMigration();
            
            response.put("success", (Boolean) validation.get("success"));
            response.put("message", "Migration validation completed");
            response.put("timestamp", LocalDateTime.now());
            response.put("validation", validation);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to validate migration", e);
            
            response.put("success", false);
            response.put("message", "Validation failed: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    @PostMapping("/setup-domains-collection")
    public ResponseEntity<Map<String, Object>> setupDomainsCollection() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            logger.info("Setting up domains collection in MongoDB Atlas...");
            
            // Check if collection exists
            boolean exists = mongoTemplate.collectionExists("domains");
            
            if (!exists) {
                // Create the collection
                mongoTemplate.createCollection("domains");
                logger.info("Created domains collection");
            }
            
            // Initialize with indexes
            Map<String, Object> result = productionMigrationService.initializeDomainsCollection();
            
            response.put("success", true);
            response.put("message", "Domains collection setup completed");
            response.put("collection_existed", exists);
            response.put("initialization_result", result);
            response.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to setup domains collection", e);
            
            response.put("success", false);
            response.put("message", "Setup failed: " + e.getMessage());
            response.put("error", e.getClass().getSimpleName());
            
            return ResponseEntity.status(500).body(response);
        }
    }
}