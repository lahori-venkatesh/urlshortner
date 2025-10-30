package com.urlshortener.repository;

import com.urlshortener.model.Domain;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DomainRepository extends MongoRepository<Domain, String> {
    
    // Find by domain name
    Optional<Domain> findByDomainName(String domainName);
    
    // Find by owner
    List<Domain> findByOwnerIdAndOwnerType(String ownerId, String ownerType);
    
    // Find verified domains by owner
    @Query("{'ownerId': ?0, 'ownerType': ?1, 'status': 'VERIFIED'}")
    List<Domain> findVerifiedDomainsByOwner(String ownerId, String ownerType);
    
    // Find domains by verification token
    Optional<Domain> findByVerificationToken(String verificationToken);
    
    // Find expired reservations for cleanup
    @Query("{'status': 'RESERVED', 'reservedUntil': {$lt: ?0}}")
    List<Domain> findExpiredReservations(LocalDateTime now);
    
    // Find domains pending verification
    @Query("{'status': 'PENDING', 'verificationAttempts': {$lt: 5}}")
    List<Domain> findDomainsForVerification();
    
    // Find domains needing reconfirmation
    @Query("{'status': 'VERIFIED', 'nextReconfirmationDue': {$lt: ?0}}")
    List<Domain> findDomainsNeedingReconfirmation(LocalDateTime now);
    
    // Find domains with SSL expiring soon
    @Query("{'sslStatus': 'ACTIVE', 'sslExpiresAt': {$lt: ?0}}")
    List<Domain> findDomainsWithExpiringSsl(LocalDateTime expiryThreshold);
    
    // Count domains by owner and status
    @Query(value = "{'ownerId': ?0, 'ownerType': ?1, 'status': ?2}", count = true)
    long countByOwnerAndStatus(String ownerId, String ownerType, String status);
    
    // Count verified domains by owner (for quota enforcement)
    @Query(value = "{'ownerId': ?0, 'ownerType': ?1, 'status': 'VERIFIED'}", count = true)
    long countVerifiedDomainsByOwner(String ownerId, String ownerType);
    
    // Find domains by status
    List<Domain> findByStatus(String status);
    
    // Check if domain exists (for conflict prevention)
    boolean existsByDomainName(String domainName);
    
    // Find domains for migration (when user creates team)
    @Query("{'ownerId': ?0, 'ownerType': 'USER', 'status': 'VERIFIED'}")
    List<Domain> findUserDomainsForMigration(String userId);
}