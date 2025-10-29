package com.urlshortener.service;

import com.urlshortener.model.SupportTicket;
import com.urlshortener.model.SupportResponse;
import com.urlshortener.model.User;
import com.urlshortener.repository.SupportTicketRepository;
import com.urlshortener.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SupportService {
    
    private static final Logger logger = LoggerFactory.getLogger(SupportService.class);
    
    @Autowired
    private SupportTicketRepository supportTicketRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private EmailService emailService;
    
    /**
     * Create a new support ticket
     */
    public SupportTicket createTicket(String userId, SupportTicket.Category category, 
                                    String subject, String message, SupportTicket.Priority priority,
                                    String userAgent, String ipAddress, String currentPage) {
        
        // Get user information
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        User user = userOpt.get();
        
        // Create ticket
        SupportTicket ticket = new SupportTicket(
            userId, 
            user.getEmail(), 
            user.getFirstName() + " " + user.getLastName(),
            category, 
            subject, 
            message, 
            priority
        );
        
        // Set metadata
        ticket.setUserAgent(userAgent);
        ticket.setIpAddress(ipAddress);
        ticket.setCurrentPage(currentPage);
        
        // Auto-assign based on category and priority
        autoAssignTicket(ticket);
        
        // Save ticket
        SupportTicket savedTicket = supportTicketRepository.save(ticket);
        
        // Send notifications
        sendTicketCreatedNotifications(savedTicket);
        
        logger.info("Created support ticket {} for user {}", savedTicket.getId(), userId);
        return savedTicket;
    }
    
    /**
     * Add a response to a ticket
     */
    public SupportTicket addResponse(String ticketId, String message, 
                                   SupportResponse.Sender sender, String senderId, 
                                   String senderName, String senderEmail, 
                                   List<String> attachments) {
        
        Optional<SupportTicket> ticketOpt = supportTicketRepository.findById(ticketId);
        if (ticketOpt.isEmpty()) {
            throw new RuntimeException("Ticket not found");
        }
        
        SupportTicket ticket = ticketOpt.get();
        
        // Create response
        SupportResponse response = new SupportResponse(
            ticketId, message, sender, senderId, senderName, senderEmail
        );
        response.setId(UUID.randomUUID().toString());
        
        if (attachments != null && !attachments.isEmpty()) {
            response.setAttachments(attachments);
        }
        
        // Add response to ticket
        ticket.addResponse(response);
        
        // Update ticket status if needed
        if (sender == SupportResponse.Sender.AGENT && ticket.getStatus() == SupportTicket.Status.OPEN) {
            ticket.setStatus(SupportTicket.Status.IN_PROGRESS);
        } else if (sender == SupportResponse.Sender.USER && 
                  ticket.getStatus() == SupportTicket.Status.WAITING_FOR_USER) {
            ticket.setStatus(SupportTicket.Status.IN_PROGRESS);
        }
        
        // Save ticket
        SupportTicket savedTicket = supportTicketRepository.save(ticket);
        
        // Send notifications
        sendResponseNotifications(savedTicket, response);
        
        logger.info("Added response to ticket {} by {}", ticketId, senderName);
        return savedTicket;
    }
    
    /**
     * Update ticket status
     */
    public SupportTicket updateTicketStatus(String ticketId, SupportTicket.Status status, 
                                          String updatedBy, String reason) {
        
        Optional<SupportTicket> ticketOpt = supportTicketRepository.findById(ticketId);
        if (ticketOpt.isEmpty()) {
            throw new RuntimeException("Ticket not found");
        }
        
        SupportTicket ticket = ticketOpt.get();
        SupportTicket.Status oldStatus = ticket.getStatus();
        
        ticket.updateStatus(status);
        
        // Add system response for status change
        if (reason != null && !reason.trim().isEmpty()) {
            SupportResponse systemResponse = new SupportResponse(
                ticketId, 
                String.format("Status changed from %s to %s. Reason: %s", 
                             oldStatus.getDisplayName(), status.getDisplayName(), reason),
                SupportResponse.Sender.SYSTEM,
                updatedBy,
                "System"
            );
            systemResponse.setId(UUID.randomUUID().toString());
            systemResponse.setResponseType("status_change");
            ticket.addResponse(systemResponse);
        }
        
        SupportTicket savedTicket = supportTicketRepository.save(ticket);
        
        // Send notifications
        sendStatusChangeNotifications(savedTicket, oldStatus, status);
        
        logger.info("Updated ticket {} status from {} to {} by {}", 
                   ticketId, oldStatus, status, updatedBy);
        return savedTicket;
    }
    
    /**
     * Assign ticket to agent
     */
    public SupportTicket assignTicket(String ticketId, String agentId, String assignedBy) {
        Optional<SupportTicket> ticketOpt = supportTicketRepository.findById(ticketId);
        if (ticketOpt.isEmpty()) {
            throw new RuntimeException("Ticket not found");
        }
        
        SupportTicket ticket = ticketOpt.get();
        String oldAgent = ticket.getAssignedAgent();
        
        ticket.assignAgent(agentId);
        
        // Add system response for assignment
        SupportResponse systemResponse = new SupportResponse(
            ticketId,
            String.format("Ticket assigned to agent %s", agentId),
            SupportResponse.Sender.SYSTEM,
            assignedBy,
            "System"
        );
        systemResponse.setId(UUID.randomUUID().toString());
        systemResponse.setResponseType("assignment");
        ticket.addResponse(systemResponse);
        
        SupportTicket savedTicket = supportTicketRepository.save(ticket);
        
        logger.info("Assigned ticket {} to agent {} by {}", ticketId, agentId, assignedBy);
        return savedTicket;
    }
    
    /**
     * Get tickets for a user
     */
    public List<SupportTicket> getUserTickets(String userId) {
        return supportTicketRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
    
    /**
     * Get ticket by ID
     */
    public Optional<SupportTicket> getTicket(String ticketId) {
        return supportTicketRepository.findById(ticketId);
    }
    
    /**
     * Search tickets for a user
     */
    public List<SupportTicket> searchUserTickets(String userId, String searchTerm) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return getUserTickets(userId);
        }
        return supportTicketRepository.searchUserTickets(userId, searchTerm.trim());
    }
    
    /**
     * Get tickets by status
     */
    public List<SupportTicket> getTicketsByStatus(SupportTicket.Status status) {
        return supportTicketRepository.findByStatusOrderByCreatedAtDesc(status);
    }
    
    /**
     * Get tickets by category
     */
    public List<SupportTicket> getTicketsByCategory(SupportTicket.Category category) {
        return supportTicketRepository.findByCategoryOrderByCreatedAtDesc(category);
    }
    
    /**
     * Get tickets assigned to agent
     */
    public List<SupportTicket> getAgentTickets(String agentId) {
        return supportTicketRepository.findByAssignedAgentOrderByCreatedAtDesc(agentId);
    }
    
    /**
     * Get unassigned tickets
     */
    public List<SupportTicket> getUnassignedTickets() {
        return supportTicketRepository.findByAssignedAgentIsNullOrderByCreatedAtDesc();
    }
    
    /**
     * Get overdue tickets
     */
    public List<SupportTicket> getOverdueTickets() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusHours(24);
        return supportTicketRepository.findOverdueTickets(cutoffTime);
    }
    
    /**
     * Get tickets requiring attention
     */
    public List<SupportTicket> getTicketsRequiringAttention() {
        LocalDateTime urgentCutoff = LocalDateTime.now().minusHours(2);
        return supportTicketRepository.findTicketsRequiringAttention(urgentCutoff);
    }
    
    /**
     * Get support statistics
     */
    public SupportStatistics getStatistics() {
        SupportStatistics stats = new SupportStatistics();
        
        stats.setTotalTickets(supportTicketRepository.count());
        stats.setOpenTickets(supportTicketRepository.countByStatus(SupportTicket.Status.OPEN));
        stats.setInProgressTickets(supportTicketRepository.countByStatus(SupportTicket.Status.IN_PROGRESS));
        stats.setResolvedTickets(supportTicketRepository.countByStatus(SupportTicket.Status.RESOLVED));
        stats.setClosedTickets(supportTicketRepository.countByStatus(SupportTicket.Status.CLOSED));
        stats.setUnassignedTickets(supportTicketRepository.countByAssignedAgentIsNull());
        
        // Category counts
        stats.setPaymentTickets(supportTicketRepository.countByCategory(SupportTicket.Category.PAYMENT));
        stats.setTechnicalTickets(supportTicketRepository.countByCategory(SupportTicket.Category.TECHNICAL));
        stats.setAccountTickets(supportTicketRepository.countByCategory(SupportTicket.Category.ACCOUNT));
        stats.setGeneralTickets(supportTicketRepository.countByCategory(SupportTicket.Category.GENERAL));
        
        // Priority counts
        stats.setUrgentTickets(supportTicketRepository.countByPriority(SupportTicket.Priority.URGENT));
        stats.setHighPriorityTickets(supportTicketRepository.countByPriority(SupportTicket.Priority.HIGH));
        stats.setMediumPriorityTickets(supportTicketRepository.countByPriority(SupportTicket.Priority.MEDIUM));
        stats.setLowPriorityTickets(supportTicketRepository.countByPriority(SupportTicket.Priority.LOW));
        
        return stats;
    }
    
    /**
     * Auto-assign ticket based on category and priority
     */
    private void autoAssignTicket(SupportTicket ticket) {
        // Simple auto-assignment logic
        // In a real system, this would be more sophisticated
        
        if (ticket.getCategory() == SupportTicket.Category.PAYMENT) {
            // Assign to payment specialist
            ticket.setAssignedAgent("payment-team");
        } else if (ticket.getPriority() == SupportTicket.Priority.URGENT) {
            // Assign urgent tickets to senior agents
            ticket.setAssignedAgent("senior-agent");
        }
        // Otherwise, leave unassigned for manual assignment
    }
    
    /**
     * Send notifications when ticket is created
     */
    private void sendTicketCreatedNotifications(SupportTicket ticket) {
        try {
            // Send confirmation email to user
            emailService.sendTicketCreatedEmail(
                ticket.getUserEmail(),
                ticket.getUserName(),
                ticket.getId(),
                ticket.getSubject()
            );
            
            // Send notification to support team
            emailService.sendNewTicketNotificationToSupport(ticket);
            
        } catch (Exception e) {
            logger.error("Failed to send ticket created notifications for ticket {}", ticket.getId(), e);
        }
    }
    
    /**
     * Send notifications when response is added
     */
    private void sendResponseNotifications(SupportTicket ticket, SupportResponse response) {
        try {
            if (response.getSender() == SupportResponse.Sender.AGENT) {
                // Send email to user about agent response
                emailService.sendAgentResponseEmail(
                    ticket.getUserEmail(),
                    ticket.getUserName(),
                    ticket.getId(),
                    ticket.getSubject(),
                    response.getMessage()
                );
            } else if (response.getSender() == SupportResponse.Sender.USER) {
                // Send notification to assigned agent
                if (ticket.getAssignedAgent() != null) {
                    emailService.sendUserResponseNotificationToAgent(ticket, response);
                }
            }
        } catch (Exception e) {
            logger.error("Failed to send response notifications for ticket {}", ticket.getId(), e);
        }
    }
    
    /**
     * Send notifications when status changes
     */
    private void sendStatusChangeNotifications(SupportTicket ticket, 
                                             SupportTicket.Status oldStatus, 
                                             SupportTicket.Status newStatus) {
        try {
            if (newStatus == SupportTicket.Status.RESOLVED || newStatus == SupportTicket.Status.CLOSED) {
                emailService.sendTicketResolvedEmail(
                    ticket.getUserEmail(),
                    ticket.getUserName(),
                    ticket.getId(),
                    ticket.getSubject()
                );
            }
        } catch (Exception e) {
            logger.error("Failed to send status change notifications for ticket {}", ticket.getId(), e);
        }
    }
    
    /**
     * Support statistics inner class
     */
    public static class SupportStatistics {
        private long totalTickets;
        private long openTickets;
        private long inProgressTickets;
        private long resolvedTickets;
        private long closedTickets;
        private long unassignedTickets;
        
        private long paymentTickets;
        private long technicalTickets;
        private long accountTickets;
        private long generalTickets;
        
        private long urgentTickets;
        private long highPriorityTickets;
        private long mediumPriorityTickets;
        private long lowPriorityTickets;
        
        // Getters and setters
        public long getTotalTickets() { return totalTickets; }
        public void setTotalTickets(long totalTickets) { this.totalTickets = totalTickets; }
        
        public long getOpenTickets() { return openTickets; }
        public void setOpenTickets(long openTickets) { this.openTickets = openTickets; }
        
        public long getInProgressTickets() { return inProgressTickets; }
        public void setInProgressTickets(long inProgressTickets) { this.inProgressTickets = inProgressTickets; }
        
        public long getResolvedTickets() { return resolvedTickets; }
        public void setResolvedTickets(long resolvedTickets) { this.resolvedTickets = resolvedTickets; }
        
        public long getClosedTickets() { return closedTickets; }
        public void setClosedTickets(long closedTickets) { this.closedTickets = closedTickets; }
        
        public long getUnassignedTickets() { return unassignedTickets; }
        public void setUnassignedTickets(long unassignedTickets) { this.unassignedTickets = unassignedTickets; }
        
        public long getPaymentTickets() { return paymentTickets; }
        public void setPaymentTickets(long paymentTickets) { this.paymentTickets = paymentTickets; }
        
        public long getTechnicalTickets() { return technicalTickets; }
        public void setTechnicalTickets(long technicalTickets) { this.technicalTickets = technicalTickets; }
        
        public long getAccountTickets() { return accountTickets; }
        public void setAccountTickets(long accountTickets) { this.accountTickets = accountTickets; }
        
        public long getGeneralTickets() { return generalTickets; }
        public void setGeneralTickets(long generalTickets) { this.generalTickets = generalTickets; }
        
        public long getUrgentTickets() { return urgentTickets; }
        public void setUrgentTickets(long urgentTickets) { this.urgentTickets = urgentTickets; }
        
        public long getHighPriorityTickets() { return highPriorityTickets; }
        public void setHighPriorityTickets(long highPriorityTickets) { this.highPriorityTickets = highPriorityTickets; }
        
        public long getMediumPriorityTickets() { return mediumPriorityTickets; }
        public void setMediumPriorityTickets(long mediumPriorityTickets) { this.mediumPriorityTickets = mediumPriorityTickets; }
        
        public long getLowPriorityTickets() { return lowPriorityTickets; }
        public void setLowPriorityTickets(long lowPriorityTickets) { this.lowPriorityTickets = lowPriorityTickets; }
    }
}