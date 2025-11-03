package com.urlshortener.repository;

import com.urlshortener.model.Team;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends MongoRepository<Team, String> {
    
    // Find teams where user is a member
    @Query("{ 'members.userId': ?0, 'isActive': true }")
    List<Team> findTeamsByUserId(String userId);
    
    // Find teams owned by user
    List<Team> findByOwnerIdAndIsActiveTrue(String ownerId);
    
    // Find team by name (for uniqueness check)
    Optional<Team> findByTeamNameIgnoreCaseAndIsActiveTrue(String teamName);
    
    // Find teams by subscription plan
    List<Team> findBySubscriptionPlanAndIsActiveTrue(String subscriptionPlan);
    
    // Count active teams
    long countByIsActiveTrue();
    
    // Find teams with expired subscriptions
    @Query("{ 'subscriptionExpiry': { $lt: ?0 }, 'isActive': true }")
    List<Team> findTeamsWithExpiredSubscriptions(java.time.LocalDateTime now);

    // Admin-specific methods
    @Query("{'$or': [" +
           "{'teamName': {$regex: ?0, $options: 'i'}}, " +
           "{'ownerId': {$in: ?1}}" +
           "]}")
    org.springframework.data.domain.Page<Team> findByTeamNameContainingIgnoreCaseOrOwnerIdIn(
            String search, List<String> ownerIds, org.springframework.data.domain.Pageable pageable);

    // For admin filtering
    @Query("{'$and': [" +
           "{'subscriptionPlan': ?0}, " +
           "{'members': {$size: ?1}}, " +
           "{'createdAt': {$gte: ?2, $lte: ?3}}" +
           "]}")
    org.springframework.data.domain.Page<Team> findTeamsWithFilters(
            String plan, String memberCount, String dateFrom, String dateTo, org.springframework.data.domain.Pageable pageable);
}