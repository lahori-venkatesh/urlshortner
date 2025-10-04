package com.urlshortener.repository;

import com.urlshortener.model.UrlMapping;
import com.urlshortener.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UrlMappingRepository extends JpaRepository<UrlMapping, Long> {
    
    Optional<UrlMapping> findByShortCodeAndIsActiveTrue(String shortCode);
    
    boolean existsByShortCode(String shortCode);
    
    Optional<UrlMapping> findByShortCode(String shortCode);
    
    // User-based queries
    List<UrlMapping> findByUserAndIsActiveTrue(User user);
    
    Page<UrlMapping> findByUserAndIsActiveTrue(User user, Pageable pageable);
    
    List<UrlMapping> findByUserOrderByCreatedAtDesc(User user);
    
    Page<UrlMapping> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
    
    Optional<UrlMapping> findByIdAndUser(Long id, User user);
    
    List<UrlMapping> findByLinkType(UrlMapping.LinkType linkType);
    
    List<UrlMapping> findByUserAndLinkType(User user, UrlMapping.LinkType linkType);
    
    @Query("SELECT u FROM UrlMapping u WHERE u.user = :user AND u.originalUrl LIKE %:url%")
    List<UrlMapping> findByUserAndOriginalUrlContaining(@Param("user") User user, @Param("url") String url);
    
    @Query("SELECT u FROM UrlMapping u WHERE u.user = :user AND u.createdAt >= :startDate")
    List<UrlMapping> findByUserAndCreatedAtAfter(@Param("user") User user, @Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT SUM(u.clickCount) FROM UrlMapping u WHERE u.user = :user")
    Long getTotalClicksByUser(@Param("user") User user);
    
    @Query("SELECT COUNT(u) FROM UrlMapping u WHERE u.user = :user AND u.isActive = true")
    long countActiveByUser(@Param("user") User user);
    
    @Query("SELECT u FROM UrlMapping u WHERE u.expirationDate IS NOT NULL AND u.expirationDate < :now")
    List<UrlMapping> findExpiredUrls(@Param("now") LocalDateTime now);
}