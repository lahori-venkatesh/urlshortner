package com.urlshortener.repository;

import com.urlshortener.model.TeamInvite;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TeamInviteRepository extends MongoRepository<TeamInvite, String> {
    
    // Find pending invites for an email
    @Query("{ 'email': ?0, 'isAccepted': false, 'isExpired': false, 'expiresAt': { $gt: ?1 } }")
    List<TeamInvite> findPendingInvitesByEmail(String email, LocalDateTime now);
    
    // Find invite by token
    Optional<TeamInvite> findByInviteToken(String inviteToken);
    
    // Find invites for a team
    List<TeamInvite> findByTeamIdOrderByCreatedAtDesc(String teamId);
    
    // Find pending invites for a team
    @Query("{ 'teamId': ?0, 'isAccepted': false, 'isExpired': false, 'expiresAt': { $gt: ?1 } }")
    List<TeamInvite> findPendingInvitesByTeamId(String teamId, LocalDateTime now);
    
    // Find expired invites
    @Query("{ 'expiresAt': { $lt: ?0 }, 'isExpired': false }")
    List<TeamInvite> findExpiredInvites(LocalDateTime now);
    
    // Check if user already has pending invite for team
    @Query("{ 'teamId': ?0, 'email': ?1, 'isAccepted': false, 'isExpired': false, 'expiresAt': { $gt: ?2 } }")
    Optional<TeamInvite> findPendingInviteByTeamAndEmail(String teamId, String email, LocalDateTime now);
}