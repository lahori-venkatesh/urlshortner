package com.urlshortener.repository;

import com.urlshortener.model.ShortenedUrl;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ShortenedUrlRepository extends MongoRepository<ShortenedUrl, String> {
    
    // Find by short code
    Optional<ShortenedUrl> findByShortCode(String shortCode);
    
    // Find by custom alias
    Optional<ShortenedUrl> findByCustomAlias(String customAlias);
    
    // Find URLs by user
    List<ShortenedUrl> findByUserId(String userId);
    
    // Find active URLs by user
    List<ShortenedUrl> findByUserIdAndIsActiveTrue(String userId);
    
    // Find public URLs
    List<ShortenedUrl> findByIsPublicTrue();
    
    // Find URLs with QR codes
    List<ShortenedUrl> findByHasQrCodeTrue();
    
    // Find expired URLs
    @Query("{'expiresAt': {$lt: ?0}, 'isExpired': false}")
    List<ShortenedUrl> findExpiredUrls(LocalDateTime currentDate);
    
    // Find URLs created between dates
    List<ShortenedUrl> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    // Find URLs by user and date range
    List<ShortenedUrl> findByUserIdAndCreatedAtBetween(String userId, LocalDateTime startDate, LocalDateTime endDate);
    
    // Find most clicked URLs
    @Query(value = "{}", sort = "{'totalClicks': -1}")
    List<ShortenedUrl> findTopClickedUrls();
    
    // Find URLs by category
    List<ShortenedUrl> findByCategory(String category);
    
    // Find URLs with password protection
    List<ShortenedUrl> findByIsPasswordProtectedTrue();
    
    // Count URLs by user
    long countByUserId(String userId);
    
    // Count active URLs by user
    long countByUserIdAndIsActiveTrue(String userId);
    
    // Find URLs with high click count
    @Query("{'totalClicks': {$gte: ?0}}")
    List<ShortenedUrl> findHighTrafficUrls(int minClicks);
    
    // Find recently clicked URLs
    @Query("{'lastClickedAt': {$gte: ?0}}")
    List<ShortenedUrl> findRecentlyClickedUrls(LocalDateTime since);
    
    // Check if short code exists
    boolean existsByShortCode(String shortCode);
    
    // Check if custom alias exists
    boolean existsByCustomAlias(String customAlias);
    
    // Team collaboration queries
    List<ShortenedUrl> findByScopeTypeAndScopeIdAndIsActiveTrue(String scopeType, String scopeId);
    
    List<ShortenedUrl> findByScopeTypeAndScopeId(String scopeType, String scopeId);
    
    long countByScopeTypeAndScopeId(String scopeType, String scopeId);
    
    // Find URLs by scope and date range
    List<ShortenedUrl> findByScopeTypeAndScopeIdAndCreatedAtBetween(String scopeType, String scopeId, LocalDateTime startDate, LocalDateTime endDate);
    
    // Custom domain support - find by shortCode and domain
    Optional<ShortenedUrl> findByShortCodeAndDomain(String shortCode, String domain);
    
    // Find URLs by domain (for domain analytics)
    List<ShortenedUrl> findByDomain(String domain);
    
    // Count URLs by domain
    long countByDomain(String domain);
}