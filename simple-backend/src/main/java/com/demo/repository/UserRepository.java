package com.demo.repository;

import com.demo.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, String> {
    
    // Find user by email (for authentication)
    Optional<User> findByEmail(String email);
    
    // Find user by Google ID (for OAuth)
    Optional<User> findByGoogleId(String googleId);
    
    // Find user by API key
    Optional<User> findByApiKey(String apiKey);
    
    // Find active users
    @Query("{'isActive': true}")
    List<User> findActiveUsers();
    
    // Find users by subscription plan
    List<User> findBySubscriptionPlan(String subscriptionPlan);
    
    // Find users created after date
    @Query("{'createdAt': {$gte: ?0}}")
    List<User> findUsersCreatedAfter(LocalDateTime date);
    
    // Find users with expired subscriptions
    @Query("{'subscriptionExpiry': {$lt: ?0}, 'subscriptionPlan': {$ne: 'FREE'}}")
    List<User> findUsersWithExpiredSubscriptions(LocalDateTime now);
    
    // Count users by subscription plan
    long countBySubscriptionPlan(String subscriptionPlan);
    
    // Check if email exists
    boolean existsByEmail(String email);
}