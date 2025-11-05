package com.urlshortener.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.urlshortener.model.Domain;
import com.urlshortener.model.ShortenedUrl;
import com.urlshortener.repository.DomainRepository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Database migration service for custom domain feature
 * Handles data migration and collection setup
 */
@Service
public class DatabaseMigrationService {
    
    private static final Logger logger = LoggerFactory.getLogger(DatabaseMigrationService.class);
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    @Autowired
    private DomainRepository domainRepository;
    
    /**
     * Migrate existing URLs to support custom domains
     * This method updates existing ShortenedUrl documents to include domain field
     */
    public void migrateExistingUrls() {
        logger.info("Starting migration of existing URLs for custom domain support");
        
        try {
            // Find all URLs without domain field set
            Query query = new Query(Criteria.where("domain").exists(false));
            List<ShortenedUrl> urlsToUpdate = mongoTemplate.find(query, ShortenedUrl.class);
            
            logger.info("Found {} URLs to migrate", urlsToUpdate.size());
            
            // Update each URL to set default domain
            Update update = new Update().set("domain", null); // null means default domain
            long updatedCount = mongoTemplate.updateMulti(query, update, ShortenedUrl.class).getModifiedCount();
            
            logger.info("Successfully migrated {} URLs with default domain", updatedCount);
            
        } catch (Exception e) {
            logger.error("Failed to migrate existing URLs", e);
            throw new RuntimeException("URL migration failed", e);
        }
    }
    
    /**
     * Create sample domain data for testing (development only)
     */
    public void createSampleDomains() {
        if (domainRepository.count() > 0) {
            logger.info("Sample domains already exist, skipping creation");
            return;
        }
        
        logger.info("Creating sample domains for testing");
        
        try {
            // Sample verified domain
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
            
            domainRepository.save(sampleDomain);
            
            logger.info("Created sample domain: {}", sampleDomain.getDomainName());
            
        } catch (Exception e) {
            logger.error("Failed to create sample domains", e);
        }
    }
    
    /**
     * Validate database collections and indexes
     */
    public boolean validateDatabaseSetup() {
        try {
            // Check if domains collection exists
            boolean domainsExists = mongoTemplate.collectionExists(Domain.class);
            
            // Check if shortened_urls collection exists
            boolean urlsExists = mongoTemplate.collectionExists(ShortenedUrl.class);
            
            logger.info("Database validation - Domains collection exists: {}, URLs collection exists: {}", 
                domainsExists, urlsExists);
            
            return domainsExists && urlsExists;
            
        } catch (Exception e) {
            logger.error("Database validation failed", e);
            return false;
        }
    }
    
    /**
     * Get database statistics for monitoring
     */
    public DatabaseStats getDatabaseStats() {
        try {
            long totalDomains = domainRepository.count();
            long verifiedDomains = domainRepository.findByStatus("VERIFIED").size();
            long pendingDomains = domainRepository.findByStatus("PENDING").size();
            
            Query urlQuery = new Query();
            long totalUrls = mongoTemplate.count(urlQuery, ShortenedUrl.class);
            
            Query customDomainUrlQuery = new Query(Criteria.where("domain").ne(null));
            long customDomainUrls = mongoTemplate.count(customDomainUrlQuery, ShortenedUrl.class);
            
            return new DatabaseStats(
                totalDomains,
                verifiedDomains,
                pendingDomains,
                totalUrls,
                customDomainUrls
            );
            
        } catch (Exception e) {
            logger.error("Failed to get database statistics", e);
            return new DatabaseStats(0, 0, 0, 0, 0);
        }
    }
    
    /**
     * Clean up expired domain reservations
     */
    public void cleanupExpiredReservations() {
        try {
            List<Domain> expiredDomains = domainRepository.findExpiredReservations(LocalDateTime.now());
            
            for (Domain domain : expiredDomains) {
                domainRepository.delete(domain);
                logger.info("Cleaned up expired reservation for domain: {}", domain.getDomainName());
            }
            
            logger.info("Cleaned up {} expired domain reservations", expiredDomains.size());
            
        } catch (Exception e) {
            logger.error("Failed to cleanup expired reservations", e);
        }
    }
    
    /**
     * Database statistics class
     */
    public static class DatabaseStats {
        private final long totalDomains;
        private final long verifiedDomains;
        private final long pendingDomains;
        private final long totalUrls;
        private final long customDomainUrls;
        
        public DatabaseStats(long totalDomains, long verifiedDomains, long pendingDomains, 
                           long totalUrls, long customDomainUrls) {
            this.totalDomains = totalDomains;
            this.verifiedDomains = verifiedDomains;
            this.pendingDomains = pendingDomains;
            this.totalUrls = totalUrls;
            this.customDomainUrls = customDomainUrls;
        }
        
        // Getters
        public long getTotalDomains() { return totalDomains; }
        public long getVerifiedDomains() { return verifiedDomains; }
        public long getPendingDomains() { return pendingDomains; }
        public long getTotalUrls() { return totalUrls; }
        public long getCustomDomainUrls() { return customDomainUrls; }
        
        @Override
        public String toString() {
            return String.format(
                "DatabaseStats{totalDomains=%d, verifiedDomains=%d, pendingDomains=%d, totalUrls=%d, customDomainUrls=%d}",
                totalDomains, verifiedDomains, pendingDomains, totalUrls, customDomainUrls
            );
        }
    }
}