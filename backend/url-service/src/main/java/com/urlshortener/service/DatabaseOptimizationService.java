package com.urlshortener.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.mongodb.core.BulkOperations;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.annotation.Async;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.urlshortener.model.TeamInvite;
import com.urlshortener.model.ShortenedUrl;
import com.urlshortener.model.QrCode;
import com.urlshortener.model.UploadedFile;
import com.urlshortener.repository.TeamInviteRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DatabaseOptimizationService {
    
    private static final Logger logger = LoggerFactory.getLogger(DatabaseOptimizationService.class);
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    @Autowired
    private TeamInviteRepository teamInviteRepository;
    
    /**
     * Scheduled task to cleanup expired invites
     * Runs every hour
     */
    @Scheduled(fixedRate = 3600000) // 1 hour
    public void cleanupExpiredInvites() {
        logger.info("🧹 Starting cleanup of expired team invites...");
        
        try {
            LocalDateTime now = LocalDateTime.now();
            
            // Mark expired invites
            Query expiredQuery = new Query(
                Criteria.where("expiresAt").lt(now)
                       .and("isExpired").is(false)
            );
            
            Update expiredUpdate = new Update()
                .set("isExpired", true)
                .set("updatedAt", now);
            
            var result = mongoTemplate.updateMulti(expiredQuery, expiredUpdate, TeamInvite.class);
            
            logger.info("✅ Marked {} invites as expired", result.getModifiedCount());
            
            // Delete old expired invites (older than 30 days)
            LocalDateTime thirtyDaysAgo = now.minusDays(30);
            Query deleteQuery = new Query(
                Criteria.where("expiresAt").lt(thirtyDaysAgo)
                       .and("isExpired").is(true)
            );
            
            var deleteResult = mongoTemplate.remove(deleteQuery, TeamInvite.class);
            logger.info("🗑️ Deleted {} old expired invites", deleteResult.getDeletedCount());
            
        } catch (Exception e) {
            logger.error("❌ Error during invite cleanup: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Scheduled task to update team statistics
     * Runs every 6 hours
     */
    @Scheduled(fixedRate = 21600000) // 6 hours
    public void updateTeamStatistics() {
        logger.info("📊 Starting team statistics update...");
        
        try {
            // Update team URL counts
            updateTeamUrlCounts();
            
            // Update team QR code counts
            updateTeamQrCodeCounts();
            
            // Update team file counts
            updateTeamFileCounts();
            
            logger.info("✅ Team statistics update completed");
            
        } catch (Exception e) {
            logger.error("❌ Error updating team statistics: {}", e.getMessage(), e);
        }
        
        // Method completed
    }
    
    private void updateTeamUrlCounts() {
        // Aggregate URL counts by team
        var pipeline = List.of(
            new org.bson.Document("$match", 
                new org.bson.Document("scopeType", "TEAM")
                    .append("isActive", true)
            ),
            new org.bson.Document("$group",
                new org.bson.Document("_id", "$scopeId")
                    .append("totalUrls", new org.bson.Document("$sum", 1))
                    .append("totalClicks", new org.bson.Document("$sum", "$totalClicks"))
            )
        );
        
        var results = mongoTemplate.getCollection("shortened_urls")
                                  .aggregate(pipeline)
                                  .into(new java.util.ArrayList<>());
        
        // Only perform bulk update if there are results
        if (!results.isEmpty()) {
            // Bulk update teams
            BulkOperations bulkOps = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, "teams");
            
            for (var result : results) {
                String teamId = result.getString("_id");
                Integer totalUrls = result.getInteger("totalUrls", 0);
                Integer totalClicks = result.getInteger("totalClicks", 0);
                
                Query query = new Query(Criteria.where("id").is(teamId));
                Update update = new Update()
                    .set("totalUrls", totalUrls)
                    .set("totalClicks", totalClicks)
                    .set("updatedAt", LocalDateTime.now());
                
                bulkOps.updateOne(query, update);
            }
            
            var bulkResult = bulkOps.execute();
            logger.info("📈 Updated URL statistics for {} teams", bulkResult.getModifiedCount());
        } else {
            logger.info("📈 No team URL statistics to update");
        }
    }
    
    private void updateTeamQrCodeCounts() {
        var pipeline = List.of(
            new org.bson.Document("$match", 
                new org.bson.Document("scopeType", "TEAM")
                    .append("isActive", true)
            ),
            new org.bson.Document("$group",
                new org.bson.Document("_id", "$scopeId")
                    .append("totalQrCodes", new org.bson.Document("$sum", 1))
                    .append("totalScans", new org.bson.Document("$sum", "$totalScans"))
            )
        );
        
        var results = mongoTemplate.getCollection("qr_codes")
                                  .aggregate(pipeline)
                                  .into(new java.util.ArrayList<>());
        
        // Only perform bulk update if there are results
        if (!results.isEmpty()) {
            BulkOperations bulkOps = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, "teams");
            
            for (var result : results) {
                String teamId = result.getString("_id");
                Integer totalQrCodes = result.getInteger("totalQrCodes", 0);
                
                Query query = new Query(Criteria.where("id").is(teamId));
                Update update = new Update()
                    .set("totalQrCodes", totalQrCodes)
                    .set("updatedAt", LocalDateTime.now());
                
                bulkOps.updateOne(query, update);
            }
            
            var bulkResult = bulkOps.execute();
            logger.info("📈 Updated QR code statistics for {} teams", bulkResult.getModifiedCount());
        } else {
            logger.info("📈 No team QR code statistics to update");
        }
    }
    
    private void updateTeamFileCounts() {
        var pipeline = List.of(
            new org.bson.Document("$match", 
                new org.bson.Document("scopeType", "TEAM")
                    .append("isActive", true)
            ),
            new org.bson.Document("$group",
                new org.bson.Document("_id", "$scopeId")
                    .append("totalFiles", new org.bson.Document("$sum", 1))
                    .append("totalDownloads", new org.bson.Document("$sum", "$totalDownloads"))
            )
        );
        
        var results = mongoTemplate.getCollection("uploaded_files")
                                  .aggregate(pipeline)
                                  .into(new java.util.ArrayList<>());
        
        // Only perform bulk update if there are results
        if (!results.isEmpty()) {
            BulkOperations bulkOps = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, "teams");
            
            for (var result : results) {
                String teamId = result.getString("_id");
                Integer totalFiles = result.getInteger("totalFiles", 0);
                
                Query query = new Query(Criteria.where("id").is(teamId));
                Update update = new Update()
                    .set("totalFiles", totalFiles)
                    .set("updatedAt", LocalDateTime.now());
                
                bulkOps.updateOne(query, update);
            }
            
            var bulkResult = bulkOps.execute();
            logger.info("📈 Updated file statistics for {} teams", bulkResult.getModifiedCount());
        } else {
            logger.info("📈 No team file statistics to update");
        }
    }
    
    /**
     * Migrate existing data to support team collaboration
     * This should be run once after deployment
     */
    public void migrateExistingDataToTeamScope() {
        logger.info("🔄 Starting data migration for team collaboration...");
        
        try {
            // Migrate URLs
            migrateUrlsToScope();
            
            // Migrate QR codes
            migrateQrCodesToScope();
            
            // Migrate files
            migrateFilesToScope();
            
            logger.info("✅ Data migration completed successfully");
            
        } catch (Exception e) {
            logger.error("❌ Error during data migration: {}", e.getMessage(), e);
            throw new RuntimeException("Data migration failed", e);
        }
    }
    
    private void migrateUrlsToScope() {
        Query query = new Query(
            new Criteria().orOperator(
                Criteria.where("scopeType").exists(false),
                Criteria.where("scopeId").exists(false)
            )
        );
        
        List<ShortenedUrl> urlsToMigrate = mongoTemplate.find(query, ShortenedUrl.class);
        
        if (!urlsToMigrate.isEmpty()) {
            BulkOperations bulkOps = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, ShortenedUrl.class);
            
            for (ShortenedUrl url : urlsToMigrate) {
                Query updateQuery = new Query(Criteria.where("id").is(url.getId()));
                Update update = new Update()
                    .set("scopeType", "USER")
                    .set("scopeId", url.getUserId())
                    .set("updatedAt", LocalDateTime.now());
                
                bulkOps.updateOne(updateQuery, update);
            }
            
            var result = bulkOps.execute();
            logger.info("📝 Migrated {} URLs to team scope", result.getModifiedCount());
        }
    }
    
    private void migrateQrCodesToScope() {
        Query query = new Query(
            new Criteria().orOperator(
                Criteria.where("scopeType").exists(false),
                Criteria.where("scopeId").exists(false)
            )
        );
        
        List<QrCode> qrCodesToMigrate = mongoTemplate.find(query, QrCode.class);
        
        if (!qrCodesToMigrate.isEmpty()) {
            BulkOperations bulkOps = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, QrCode.class);
            
            for (QrCode qrCode : qrCodesToMigrate) {
                Query updateQuery = new Query(Criteria.where("id").is(qrCode.getId()));
                Update update = new Update()
                    .set("scopeType", "USER")
                    .set("scopeId", qrCode.getUserId())
                    .set("updatedAt", LocalDateTime.now());
                
                bulkOps.updateOne(updateQuery, update);
            }
            
            var result = bulkOps.execute();
            logger.info("📝 Migrated {} QR codes to team scope", result.getModifiedCount());
        }
    }
    
    private void migrateFilesToScope() {
        Query query = new Query(
            new Criteria().orOperator(
                Criteria.where("scopeType").exists(false),
                Criteria.where("scopeId").exists(false)
            )
        );
        
        List<UploadedFile> filesToMigrate = mongoTemplate.find(query, UploadedFile.class);
        
        if (!filesToMigrate.isEmpty()) {
            BulkOperations bulkOps = mongoTemplate.bulkOps(BulkOperations.BulkMode.UNORDERED, UploadedFile.class);
            
            for (UploadedFile file : filesToMigrate) {
                Query updateQuery = new Query(Criteria.where("id").is(file.getId()));
                Update update = new Update()
                    .set("scopeType", "USER")
                    .set("scopeId", file.getUserId())
                    .set("updatedAt", LocalDateTime.now());
                
                bulkOps.updateOne(updateQuery, update);
            }
            
            var result = bulkOps.execute();
            logger.info("📝 Migrated {} files to team scope", result.getModifiedCount());
        }
    }
    
    /**
     * Get database performance statistics
     */
    public DatabaseStats getDatabaseStats() {
        DatabaseStats stats = new DatabaseStats();
        
        try {
            // Collection counts
            stats.setTotalTeams(mongoTemplate.count(new Query(), "teams"));
            stats.setTotalUsers(mongoTemplate.count(new Query(), "users"));
            stats.setTotalUrls(mongoTemplate.count(new Query(), "shortened_urls"));
            stats.setTotalQrCodes(mongoTemplate.count(new Query(), "qr_codes"));
            stats.setTotalFiles(mongoTemplate.count(new Query(), "uploaded_files"));
            stats.setTotalInvites(mongoTemplate.count(new Query(), "team_invites"));
            
            // Active counts
            stats.setActiveTeams(mongoTemplate.count(
                new Query(Criteria.where("isActive").is(true)), "teams"));
            stats.setActiveUrls(mongoTemplate.count(
                new Query(Criteria.where("isActive").is(true)), "shortened_urls"));
            stats.setActiveQrCodes(mongoTemplate.count(
                new Query(Criteria.where("isActive").is(true)), "qr_codes"));
            stats.setActiveFiles(mongoTemplate.count(
                new Query(Criteria.where("isActive").is(true)), "uploaded_files"));
            
            // Team vs Personal content
            stats.setTeamUrls(mongoTemplate.count(
                new Query(Criteria.where("scopeType").is("TEAM")), "shortened_urls"));
            stats.setPersonalUrls(mongoTemplate.count(
                new Query(Criteria.where("scopeType").is("USER")), "shortened_urls"));
            
        } catch (Exception e) {
            logger.error("Error getting database stats: {}", e.getMessage(), e);
        }
        
        return stats;
    }
    
    public static class DatabaseStats {
        private long totalTeams;
        private long totalUsers;
        private long totalUrls;
        private long totalQrCodes;
        private long totalFiles;
        private long totalInvites;
        private long activeTeams;
        private long activeUrls;
        private long activeQrCodes;
        private long activeFiles;
        private long teamUrls;
        private long personalUrls;
        
        // Getters and setters
        public long getTotalTeams() { return totalTeams; }
        public void setTotalTeams(long totalTeams) { this.totalTeams = totalTeams; }
        
        public long getTotalUsers() { return totalUsers; }
        public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
        
        public long getTotalUrls() { return totalUrls; }
        public void setTotalUrls(long totalUrls) { this.totalUrls = totalUrls; }
        
        public long getTotalQrCodes() { return totalQrCodes; }
        public void setTotalQrCodes(long totalQrCodes) { this.totalQrCodes = totalQrCodes; }
        
        public long getTotalFiles() { return totalFiles; }
        public void setTotalFiles(long totalFiles) { this.totalFiles = totalFiles; }
        
        public long getTotalInvites() { return totalInvites; }
        public void setTotalInvites(long totalInvites) { this.totalInvites = totalInvites; }
        
        public long getActiveTeams() { return activeTeams; }
        public void setActiveTeams(long activeTeams) { this.activeTeams = activeTeams; }
        
        public long getActiveUrls() { return activeUrls; }
        public void setActiveUrls(long activeUrls) { this.activeUrls = activeUrls; }
        
        public long getActiveQrCodes() { return activeQrCodes; }
        public void setActiveQrCodes(long activeQrCodes) { this.activeQrCodes = activeQrCodes; }
        
        public long getActiveFiles() { return activeFiles; }
        public void setActiveFiles(long activeFiles) { this.activeFiles = activeFiles; }
        
        public long getTeamUrls() { return teamUrls; }
        public void setTeamUrls(long teamUrls) { this.teamUrls = teamUrls; }
        
        public long getPersonalUrls() { return personalUrls; }
        public void setPersonalUrls(long personalUrls) { this.personalUrls = personalUrls; }
    }
}