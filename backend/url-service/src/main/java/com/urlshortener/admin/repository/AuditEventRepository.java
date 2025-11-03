package com.urlshortener.admin.repository;

import com.urlshortener.admin.model.AuditEvent;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
@ConditionalOnProperty(name = "app.admin.enabled", havingValue = "true", matchIfMissing = false)
public interface AuditEventRepository extends MongoRepository<AuditEvent, String> {
    
    Page<AuditEvent> findByActorIdOrderByTimestampDesc(String actorId, Pageable pageable);
    
    Page<AuditEvent> findByEntityTypeAndEntityIdOrderByTimestampDesc(
        String entityType, String entityId, Pageable pageable);
    
    Page<AuditEvent> findByActionTypeOrderByTimestampDesc(String actionType, Pageable pageable);
    
    @Query("{ 'timestamp': { '$gte': ?0, '$lte': ?1 } }")
    Page<AuditEvent> findByTimestampBetweenOrderByTimestampDesc(
        LocalDateTime start, LocalDateTime end, Pageable pageable);
    
    @Query("{ '$and': [ " +
           "{ 'timestamp': { '$gte': ?0, '$lte': ?1 } }, " +
           "{ 'actorId': ?2 } " +
           "] }")
    Page<AuditEvent> findByTimestampBetweenAndActorIdOrderByTimestampDesc(
        LocalDateTime start, LocalDateTime end, String actorId, Pageable pageable);
    
    @Query("{ '$and': [ " +
           "{ 'timestamp': { '$gte': ?0, '$lte': ?1 } }, " +
           "{ 'actionType': ?2 } " +
           "] }")
    Page<AuditEvent> findByTimestampBetweenAndActionTypeOrderByTimestampDesc(
        LocalDateTime start, LocalDateTime end, String actionType, Pageable pageable);
    
    @Query("{ '$and': [ " +
           "{ 'timestamp': { '$gte': ?0, '$lte': ?1 } }, " +
           "{ 'entityType': ?2 } " +
           "] }")
    Page<AuditEvent> findByTimestampBetweenAndEntityTypeOrderByTimestampDesc(
        LocalDateTime start, LocalDateTime end, String entityType, Pageable pageable);
    
    List<AuditEvent> findTop10ByOrderByTimestampDesc();
    
    long countByActionType(String actionType);
    
    long countByActorId(String actorId);
    
    long countByTimestampBetween(LocalDateTime start, LocalDateTime end);
    
    @Query("{ '$and': [ " +
           "{ 'timestamp': { '$gte': ?0 } }, " +
           "{ 'success': false } " +
           "] }")
    List<AuditEvent> findFailedActionsSince(LocalDateTime since);
}