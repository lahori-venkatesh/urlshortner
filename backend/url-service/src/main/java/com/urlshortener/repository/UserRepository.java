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
}