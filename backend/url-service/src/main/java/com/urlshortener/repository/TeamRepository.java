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
}