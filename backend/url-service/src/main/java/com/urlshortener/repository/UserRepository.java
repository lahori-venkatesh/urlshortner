package com.urlshortener.repository;

import com.urlshortener.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    
    // Find user by email
    Optional<User> findByEmail(String email);
    
    // Find user by Google ID
    Optional<User> findByGoogleId(String googleId);
    
    // Find user by API key
    Optional<User> findByApiKey(String apiKey);
    
    // Check if email exists
    boolean existsByEmail(String email);
    
    // Find active users
    List<User> findByIsActiveTrue();
    
    // Find users by subscription plan
    List<User> findBySubscriptionPlan(String subscriptionPlan);
    
    // Find users with expired subscriptions
    @Query("{'subscriptionExpiry': {$lt: ?0}}")
    List<User> findUsersWithExpiredSubscriptions(LocalDateTime currentDate);
    
    // Find users created between dates
    List<User> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    // Find users by email verification status
    List<User> findByEmailVerified(boolean emailVerified);
    
    // Find users who haven't logged in for a while
    @Query("{'lastLoginAt': {$lt: ?0}}")
    List<User> findInactiveUsers(LocalDateTime cutoffDate);
    
    // Count users by subscription plan
    @Query(value = "{'subscriptionPlan': ?0}", count = true)
    long countBySubscriptionPlan(String subscriptionPlan);
    
    // Find users with high API usage
    @Query("{'apiCallsThisMonth': {$gte: ?0}}")
    List<User> findHighApiUsageUsers(int threshold);

    // Admin-specific methods
    @Query("{'email': {$regex: ?0, $options: 'i'}}")
    List<User> findByEmailContainingIgnoreCase(String email);

    // For admin search functionality
    @Query("{'$or': [" +
           "{'email': {$regex: ?0, $options: 'i'}}, " +
           "{'firstName': {$regex: ?1, $options: 'i'}}, " +
           "{'lastName': {$regex: ?2, $options: 'i'}}" +
           "]}")
    org.springframework.data.domain.Page<User> findByEmailContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(
            String email, String firstName, String lastName, org.springframework.data.domain.Pageable pageable);

    // For admin filtering
    @Query("{'$and': [" +
           "{'isActive': ?0}, " +
           "{'subscriptionPlan': ?1}, " +
           "{'createdAt': {$gte: ?2, $lte: ?3}}" +
           "]}")
    org.springframework.data.domain.Page<User> findUsersWithFilters(
            String status, String plan, String dateFrom, String dateTo, org.springframework.data.domain.Pageable pageable);
}