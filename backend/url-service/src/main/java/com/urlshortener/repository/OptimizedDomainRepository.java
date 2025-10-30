package com.urlshortener.repository;

import com.urlshortener.model.OptimizedDomain;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OptimizedDomainRepository extends MongoRepository<OptimizedDomain, String> {
    
    // Basic queries
    Optional<OptimizedDomain> findByDomainName(String domainName);
    boolean existsByDomainName(String domainName);
    Optional<OptimizedDomain> findByVerificationToken(String verificationToken);
    
    // Owner-based queries
    List<OptimizedDomain> findByOwnerIdAndOwnerType(String ownerId, OptimizedDomain.OwnerType ownerType);
    List<OptimizedDomain> findByOwnerIdAndOwnerTypeAndStatus(String ownerId, OptimizedDomain.OwnerType ownerType, OptimizedDomain.DomainStatus status);
    List<OptimizedDomain> findByOwnerIdAndOwnerTypeAndIsActive(String ownerId, OptimizedDomain.OwnerType ownerType, boolean isActive);
    
    // Status-based queries
    List<OptimizedDomain> findByStatus(OptimizedDomain.DomainStatus status);
    List<OptimizedDomain> findByStatusAndIsActive(OptimizedDomain.DomainStatus status, boolean isActive);
    long countByStatus(OptimizedDomain.DomainStatus status);
    
    // SSL-related queries
    List<OptimizedDomain> findBySslStatus(OptimizedDomain.SslStatus sslStatus);
    
    @Query("{'ssl.expiresAt': {$lt: ?0}, 'sslStatus': 'ACTIVE'}")
    List<OptimizedDomain> findDomainsWithExpiringSsl(LocalDateTime expiryThreshold);
    
    @Query("{'ssl.expiresAt': {$lt: ?0}, 'sslStatus': 'ACTIVE'}")
    List<OptimizedDomain> findDomainsWithExpiredSsl(LocalDateTime now);
    
    // Verification-related queries
    @Query("{'verification.nextCheckAt': {$lt: ?0}, 'status': {$in: ['PENDING', 'ERROR']}, 'isActive': true}")
    List<OptimizedDomain> findDomainsPendingVerification(LocalDateTime now);
    
    @Query("{'verification.verificationFailures': {$gte: ?0}}")
    List<OptimizedDomain> findDomainsWithMultipleFailures(int failureThreshold);
    
    // Risk-based queries
    @Query("{'risk.classification': {$in: ['HIGH', 'CRITICAL']}}")
    List<OptimizedDomain> findHighRiskDomains();
    
    @Query("{'risk.score': {$gte: ?0}}")
    List<OptimizedDomain> findDomainsByRiskScore(double minScore);
    
    // Performance queries
    @Query("{'performanceStats.avgRedirectLatencyMs': {$gte: ?0}}")
    List<OptimizedDomain> findSlowDomains(double latencyThreshold);
    
    @Query("{'performanceStats.cacheHitRate': {$lt: ?0}}")
    List<OptimizedDomain> findDomainsWithLowCacheHitRate(double hitRateThreshold);
    
    // Plan-based queries
    @Query("{'planContext.plan': ?0}")
    List<OptimizedDomain> findByPlan(String plan);
    
    @Query("{'planContext.usageCount': {$gte: '$planContext.customDomainQuota'}}")
    List<OptimizedDomain> findDomainsAtQuotaLimit();
    
    // Job and maintenance queries
    @Query("{'job.retryCount': {$gte: ?0}}")
    List<OptimizedDomain> findDomainsWithHighRetryCount(int retryThreshold);
    
    @Query("{'job.lastProcessedAt': {$lt: ?0}}")
    List<OptimizedDomain> findStaleJobs(LocalDateTime staleThreshold);
    
    // Blacklist and security queries
    List<OptimizedDomain> findByIsBlacklisted(boolean isBlacklisted);
    
    @Query("{'isBlacklisted': false, 'isActive': true, 'status': 'VERIFIED'}")
    List<OptimizedDomain> findActiveVerifiedDomains();
    
    // Analytics and reporting queries
    @Query("{'createdAt': {$gte: ?0, $lt: ?1}}")
    List<OptimizedDomain> findDomainsCreatedBetween(LocalDateTime start, LocalDateTime end);
    
    @Query("{'totalRedirects': {$gte: ?0}}")
    List<OptimizedDomain> findPopularDomains(long minRedirects);
    
    // Aggregation queries for statistics
    @Aggregation(pipeline = {
        "{ $group: { _id: '$status', count: { $sum: 1 } } }"
    })
    List<StatusCount> getStatusCounts();
    
    @Aggregation(pipeline = {
        "{ $group: { _id: '$planContext.plan', count: { $sum: 1 }, totalRedirects: { $sum: '$totalRedirects' } } }"
    })
    List<PlanStats> getPlanStatistics();
    
    @Aggregation(pipeline = {
        "{ $group: { _id: '$risk.classification', count: { $sum: 1 }, avgScore: { $avg: '$risk.score' } } }"
    })
    List<RiskStats> getRiskStatistics();
    
    @Aggregation(pipeline = {
        "{ $match: { 'performanceStats.totalRequests': { $gt: 0 } } }",
        "{ $group: { _id: null, avgLatency: { $avg: '$performanceStats.avgRedirectLatencyMs' }, avgCacheHitRate: { $avg: '$performanceStats.cacheHitRate' } } }"
    })
    PerformanceOverview getPerformanceOverview();
    
    // Cleanup and maintenance queries
    @Query("{'status': 'RESERVED', 'createdAt': {$lt: ?0}}")
    List<OptimizedDomain> findExpiredReservations(LocalDateTime expiryThreshold);
    
    @Query("{'isActive': false, 'updatedAt': {$lt: ?0}}")
    List<OptimizedDomain> findInactiveDomainsForCleanup(LocalDateTime cleanupThreshold);
    
    // Custom update operations
    @Query("{'domainName': ?0}")
    Optional<OptimizedDomain> findByDomainNameForUpdate(String domainName);
    
    // Projection interfaces for aggregation results
    interface StatusCount {
        String getId();
        long getCount();
    }
    
    interface PlanStats {
        String getId();
        long getCount();
        long getTotalRedirects();
    }
    
    interface RiskStats {
        String getId();
        long getCount();
        double getAvgScore();
    }
    
    interface PerformanceOverview {
        double getAvgLatency();
        double getAvgCacheHitRate();
    }
}