package com.urlshortener.admin.service;

import com.urlshortener.admin.model.AuditEvent;
import com.urlshortener.admin.repository.AuditEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@ConditionalOnProperty(name = "app.admin.enabled", havingValue = "true", matchIfMissing = false)
public class AuditService {

    @Autowired
    private AuditEventRepository auditEventRepository;

    @Async
    public void logEvent(AuditEvent event) {
        try {
            auditEventRepository.save(event);
        } catch (Exception e) {
            // Log error but don't fail the main operation
            System.err.println("Failed to save audit event: " + e.getMessage());
        }
    }

    @Async
    public void logEvent(String actorId, String actorName, String actorEmail, 
                        String actionType, String entityType, String entityId,
                        Map<String, Object> oldValues, Map<String, Object> newValues,
                        String ipAddress, String userAgent, String sessionId) {
        
        AuditEvent event = new AuditEvent();
        event.setActorId(actorId);
        event.setActorName(actorName);
        event.setActorEmail(actorEmail);
        event.setActionType(actionType);
        event.setEntityType(entityType);
        event.setEntityId(entityId);
        event.setOldValues(oldValues);
        event.setNewValues(newValues);
        event.setIpAddress(ipAddress);
        event.setUserAgent(userAgent);
        event.setSessionId(sessionId);
        event.setSuccess(true);

        logEvent(event);
    }

    public Page<AuditEvent> findAll(Pageable pageable) {
        return auditEventRepository.findAll(pageable);
    }

    public Page<AuditEvent> findByActor(String actorId, Pageable pageable) {
        return auditEventRepository.findByActorIdOrderByTimestampDesc(actorId, pageable);
    }

    public Page<AuditEvent> findByEntity(String entityType, String entityId, Pageable pageable) {
        return auditEventRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(
            entityType, entityId, pageable);
    }

    public Page<AuditEvent> findByActionType(String actionType, Pageable pageable) {
        return auditEventRepository.findByActionTypeOrderByTimestampDesc(actionType, pageable);
    }

    public Page<AuditEvent> findByDateRange(LocalDateTime start, LocalDateTime end, Pageable pageable) {
        return auditEventRepository.findByTimestampBetweenOrderByTimestampDesc(start, end, pageable);
    }

    public Page<AuditEvent> findByDateRangeAndActor(LocalDateTime start, LocalDateTime end, 
                                                   String actorId, Pageable pageable) {
        return auditEventRepository.findByTimestampBetweenAndActorIdOrderByTimestampDesc(
            start, end, actorId, pageable);
    }

    public Page<AuditEvent> findByDateRangeAndActionType(LocalDateTime start, LocalDateTime end, 
                                                        String actionType, Pageable pageable) {
        return auditEventRepository.findByTimestampBetweenAndActionTypeOrderByTimestampDesc(
            start, end, actionType, pageable);
    }

    public List<AuditEvent> getRecentEvents(int limit) {
        return auditEventRepository.findTop10ByOrderByTimestampDesc();
    }

    public long countByActionType(String actionType) {
        return auditEventRepository.countByActionType(actionType);
    }

    public long countByActor(String actorId) {
        return auditEventRepository.countByActorId(actorId);
    }

    public long countByDateRange(LocalDateTime start, LocalDateTime end) {
        return auditEventRepository.countByTimestampBetween(start, end);
    }

    public List<AuditEvent> getFailedActionsSince(LocalDateTime since) {
        return auditEventRepository.findFailedActionsSince(since);
    }

    // Helper method to create audit event for user actions
    public void auditUserAction(String adminId, String adminName, String adminEmail,
                               String action, String userId, String description,
                               String ipAddress, String userAgent) {
        AuditEvent event = new AuditEvent();
        event.setActorId(adminId);
        event.setActorName(adminName);
        event.setActorEmail(adminEmail);
        event.setActionType(action);
        event.setEntityType("User");
        event.setEntityId(userId);
        event.setDescription(description);
        event.setIpAddress(ipAddress);
        event.setUserAgent(userAgent);
        event.setSuccess(true);

        logEvent(event);
    }

    // Helper method to create audit event for system actions
    public void auditSystemAction(String adminId, String adminName, String adminEmail,
                                 String action, String description,
                                 String ipAddress, String userAgent) {
        AuditEvent event = new AuditEvent();
        event.setActorId(adminId);
        event.setActorName(adminName);
        event.setActorEmail(adminEmail);
        event.setActionType(action);
        event.setEntityType("System");
        event.setDescription(description);
        event.setIpAddress(ipAddress);
        event.setUserAgent(userAgent);
        event.setSuccess(true);

        logEvent(event);
    }
}