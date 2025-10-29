package com.urlshortener.repository;

import com.urlshortener.model.SupportTicket;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SupportTicketRepository extends MongoRepository<SupportTicket, String> {
    
    // Find tickets by user
    List<SupportTicket> findByUserIdOrderByCreatedAtDesc(String userId);
    
    // Find tickets by status
    List<SupportTicket> findByStatusOrderByCreatedAtDesc(SupportTicket.Status status);
    
    // Find tickets by category
    List<SupportTicket> findByCategoryOrderByCreatedAtDesc(SupportTicket.Category category);
    
    // Find tickets by priority
    List<SupportTicket> findByPriorityOrderByCreatedAtDesc(SupportTicket.Priority priority);
    
    // Find tickets assigned to an agent
    List<SupportTicket> findByAssignedAgentOrderByCreatedAtDesc(String agentId);
    
    // Find unassigned tickets
    List<SupportTicket> findByAssignedAgentIsNullOrderByCreatedAtDesc();
    
    // Find tickets by user and status
    List<SupportTicket> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, SupportTicket.Status status);
    
    // Find tickets by user and category
    List<SupportTicket> findByUserIdAndCategoryOrderByCreatedAtDesc(String userId, SupportTicket.Category category);
    
    // Find overdue tickets
    @Query("{ 'status': { $in: ['OPEN', 'IN_PROGRESS'] }, 'createdAt': { $lt: ?0 } }")
    List<SupportTicket> findOverdueTickets(LocalDateTime cutoffTime);
    
    // Find tickets created within date range
    List<SupportTicket> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime startDate, LocalDateTime endDate);
    
    // Find tickets updated within date range
    List<SupportTicket> findByUpdatedAtBetweenOrderByUpdatedAtDesc(LocalDateTime startDate, LocalDateTime endDate);
    
    // Search tickets by subject or message content
    @Query("{ $or: [ " +
           "{ 'subject': { $regex: ?0, $options: 'i' } }, " +
           "{ 'message': { $regex: ?0, $options: 'i' } }, " +
           "{ 'responses.message': { $regex: ?0, $options: 'i' } } " +
           "] }")
    List<SupportTicket> searchTickets(String searchTerm);
    
    // Find tickets by user with search
    @Query("{ 'userId': ?0, $or: [ " +
           "{ 'subject': { $regex: ?1, $options: 'i' } }, " +
           "{ 'message': { $regex: ?1, $options: 'i' } }, " +
           "{ 'responses.message': { $regex: ?1, $options: 'i' } } " +
           "] }")
    List<SupportTicket> searchUserTickets(String userId, String searchTerm);
    
    // Count tickets by status
    long countByStatus(SupportTicket.Status status);
    
    // Count tickets by category
    long countByCategory(SupportTicket.Category category);
    
    // Count tickets by priority
    long countByPriority(SupportTicket.Priority priority);
    
    // Count tickets by user
    long countByUserId(String userId);
    
    // Count tickets assigned to agent
    long countByAssignedAgent(String agentId);
    
    // Count unassigned tickets
    long countByAssignedAgentIsNull();
    
    // Find recent tickets (last 24 hours)
    @Query("{ 'createdAt': { $gte: ?0 } }")
    List<SupportTicket> findRecentTickets(LocalDateTime since);
    
    // Find tickets requiring attention (high priority, overdue, etc.)
    @Query("{ $or: [ " +
           "{ 'priority': 'URGENT' }, " +
           "{ 'priority': 'HIGH', 'status': 'OPEN' }, " +
           "{ 'status': 'OPEN', 'createdAt': { $lt: ?0 } } " +
           "] }")
    List<SupportTicket> findTicketsRequiringAttention(LocalDateTime urgentCutoff);
    
    // Find tickets by multiple statuses
    List<SupportTicket> findByStatusInOrderByCreatedAtDesc(List<SupportTicket.Status> statuses);
    
    // Find tickets by user email (for guest users)
    List<SupportTicket> findByUserEmailOrderByCreatedAtDesc(String userEmail);
    
    // Analytics queries
    @Query(value = "{ 'createdAt': { $gte: ?0, $lte: ?1 } }", count = true)
    long countTicketsInDateRange(LocalDateTime startDate, LocalDateTime endDate);
    
    @Query(value = "{ 'resolvedAt': { $gte: ?0, $lte: ?1 } }", count = true)
    long countResolvedTicketsInDateRange(LocalDateTime startDate, LocalDateTime endDate);
    
    // Find tickets with specific tags
    @Query("{ 'tags': { $in: ?0 } }")
    List<SupportTicket> findByTagsIn(List<String> tags);
}