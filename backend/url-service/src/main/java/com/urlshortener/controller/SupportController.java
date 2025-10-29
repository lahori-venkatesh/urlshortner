package com.urlshortener.controller;

import com.urlshortener.model.SupportTicket;
import com.urlshortener.model.SupportResponse;
import com.urlshortener.service.SupportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/support")
@CrossOrigin(origins = "*")
public class SupportController {
    
    private static final Logger logger = LoggerFactory.getLogger(SupportController.class);
    
    @Autowired
    private SupportService supportService;
    
    /**
     * Create a new support ticket
     */
    @PostMapping("/tickets")
    public ResponseEntity<Map<String, Object>> createTicket(
            @RequestBody CreateTicketRequest request,
            HttpServletRequest httpRequest) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Extract request metadata
            String userAgent = httpRequest.getHeader("User-Agent");
            String ipAddress = getClientIpAddress(httpRequest);
            String currentPage = request.getCurrentPage();
            
            // Create ticket
            SupportTicket ticket = supportService.createTicket(
                request.getUserId(),
                request.getCategory(),
                request.getSubject(),
                request.getMessage(),
                request.getPriority(),
                userAgent,
                ipAddress,
                currentPage
            );
            
            response.put("success", true);
            response.put("message", "Support ticket created successfully");
            response.put("data", ticket);
            
            logger.info("Created support ticket {} for user {}", ticket.getId(), request.getUserId());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error creating support ticket", e);
            response.put("success", false);
            response.put("message", "Failed to create support ticket: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Get tickets for a user
     */
    @GetMapping("/tickets/user/{userId}")
    public ResponseEntity<Map<String, Object>> getUserTickets(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<SupportTicket> tickets = supportService.getUserTickets(userId);
            
            response.put("success", true);
            response.put("data", tickets);
            response.put("count", tickets.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching user tickets for user {}", userId, e);
            response.put("success", false);
            response.put("message", "Failed to fetch tickets: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Get a specific ticket by ID
     */
    @GetMapping("/tickets/{ticketId}")
    public ResponseEntity<Map<String, Object>> getTicket(@PathVariable String ticketId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<SupportTicket> ticket = supportService.getTicket(ticketId);
            
            if (ticket.isPresent()) {
                response.put("success", true);
                response.put("data", ticket.get());
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Ticket not found");
                return ResponseEntity.notFound().build();
            }
            
        } catch (Exception e) {
            logger.error("Error fetching ticket {}", ticketId, e);
            response.put("success", false);
            response.put("message", "Failed to fetch ticket: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Add a response to a ticket
     */
    @PostMapping("/tickets/{ticketId}/responses")
    public ResponseEntity<Map<String, Object>> addResponse(
            @PathVariable String ticketId,
            @RequestBody AddResponseRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            SupportTicket updatedTicket = supportService.addResponse(
                ticketId,
                request.getMessage(),
                SupportResponse.Sender.valueOf(request.getSender().toUpperCase()),
                request.getSenderId(),
                request.getSenderName(),
                request.getSenderEmail(),
                request.getAttachments()
            );
            
            response.put("success", true);
            response.put("message", "Response added successfully");
            response.put("data", updatedTicket);
            
            logger.info("Added response to ticket {} by {}", ticketId, request.getSenderName());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error adding response to ticket {}", ticketId, e);
            response.put("success", false);
            response.put("message", "Failed to add response: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Update ticket status
     */
    @PatchMapping("/tickets/{ticketId}/status")
    public ResponseEntity<Map<String, Object>> updateTicketStatus(
            @PathVariable String ticketId,
            @RequestBody UpdateStatusRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            SupportTicket updatedTicket = supportService.updateTicketStatus(
                ticketId,
                SupportTicket.Status.valueOf(request.getStatus().toUpperCase().replace("-", "_")),
                request.getUpdatedBy(),
                request.getReason()
            );
            
            response.put("success", true);
            response.put("message", "Ticket status updated successfully");
            response.put("data", updatedTicket);
            
            logger.info("Updated ticket {} status to {} by {}", 
                       ticketId, request.getStatus(), request.getUpdatedBy());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error updating ticket status for {}", ticketId, e);
            response.put("success", false);
            response.put("message", "Failed to update ticket status: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Search user tickets
     */
    @GetMapping("/tickets/user/{userId}/search")
    public ResponseEntity<Map<String, Object>> searchUserTickets(
            @PathVariable String userId,
            @RequestParam String query) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<SupportTicket> tickets = supportService.searchUserTickets(userId, query);
            
            response.put("success", true);
            response.put("data", tickets);
            response.put("count", tickets.size());
            response.put("query", query);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error searching tickets for user {} with query '{}'", userId, query, e);
            response.put("success", false);
            response.put("message", "Failed to search tickets: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Get tickets by status
     */
    @GetMapping("/tickets/status/{status}")
    public ResponseEntity<Map<String, Object>> getTicketsByStatus(@PathVariable String status) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            SupportTicket.Status ticketStatus = SupportTicket.Status.valueOf(status.toUpperCase().replace("-", "_"));
            List<SupportTicket> tickets = supportService.getTicketsByStatus(ticketStatus);
            
            response.put("success", true);
            response.put("data", tickets);
            response.put("count", tickets.size());
            response.put("status", status);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching tickets by status {}", status, e);
            response.put("success", false);
            response.put("message", "Failed to fetch tickets: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Get tickets by category
     */
    @GetMapping("/tickets/category/{category}")
    public ResponseEntity<Map<String, Object>> getTicketsByCategory(@PathVariable String category) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            SupportTicket.Category ticketCategory = SupportTicket.Category.valueOf(category.toUpperCase());
            List<SupportTicket> tickets = supportService.getTicketsByCategory(ticketCategory);
            
            response.put("success", true);
            response.put("data", tickets);
            response.put("count", tickets.size());
            response.put("category", category);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching tickets by category {}", category, e);
            response.put("success", false);
            response.put("message", "Failed to fetch tickets: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Get support statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            SupportService.SupportStatistics stats = supportService.getStatistics();
            
            response.put("success", true);
            response.put("data", stats);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching support statistics", e);
            response.put("success", false);
            response.put("message", "Failed to fetch statistics: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Get support categories and priorities (for frontend dropdowns)
     */
    @GetMapping("/metadata")
    public ResponseEntity<Map<String, Object>> getMetadata() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Map<String, Object> metadata = new HashMap<>();
            
            // Categories
            Map<String, String> categories = new HashMap<>();
            for (SupportTicket.Category category : SupportTicket.Category.values()) {
                categories.put(category.name().toLowerCase(), category.getDisplayName());
            }
            metadata.put("categories", categories);
            
            // Priorities
            Map<String, String> priorities = new HashMap<>();
            for (SupportTicket.Priority priority : SupportTicket.Priority.values()) {
                priorities.put(priority.name().toLowerCase(), priority.getDisplayName());
            }
            metadata.put("priorities", priorities);
            
            // Statuses
            Map<String, String> statuses = new HashMap<>();
            for (SupportTicket.Status status : SupportTicket.Status.values()) {
                statuses.put(status.name().toLowerCase().replace("_", "-"), status.getDisplayName());
            }
            metadata.put("statuses", statuses);
            
            response.put("success", true);
            response.put("data", metadata);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error fetching support metadata", e);
            response.put("success", false);
            response.put("message", "Failed to fetch metadata: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Get client IP address from request
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    // Request DTOs
    public static class CreateTicketRequest {
        private String userId;
        private SupportTicket.Category category;
        private String subject;
        private String message;
        private SupportTicket.Priority priority;
        private String currentPage;
        
        // Getters and setters
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        
        public SupportTicket.Category getCategory() { return category; }
        public void setCategory(SupportTicket.Category category) { this.category = category; }
        
        public String getSubject() { return subject; }
        public void setSubject(String subject) { this.subject = subject; }
        
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public SupportTicket.Priority getPriority() { return priority; }
        public void setPriority(SupportTicket.Priority priority) { this.priority = priority; }
        
        public String getCurrentPage() { return currentPage; }
        public void setCurrentPage(String currentPage) { this.currentPage = currentPage; }
    }
    
    public static class AddResponseRequest {
        private String message;
        private String sender;
        private String senderId;
        private String senderName;
        private String senderEmail;
        private List<String> attachments;
        
        // Getters and setters
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        
        public String getSender() { return sender; }
        public void setSender(String sender) { this.sender = sender; }
        
        public String getSenderId() { return senderId; }
        public void setSenderId(String senderId) { this.senderId = senderId; }
        
        public String getSenderName() { return senderName; }
        public void setSenderName(String senderName) { this.senderName = senderName; }
        
        public String getSenderEmail() { return senderEmail; }
        public void setSenderEmail(String senderEmail) { this.senderEmail = senderEmail; }
        
        public List<String> getAttachments() { return attachments; }
        public void setAttachments(List<String> attachments) { this.attachments = attachments; }
    }
    
    public static class UpdateStatusRequest {
        private String status;
        private String updatedBy;
        private String reason;
        
        // Getters and setters
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        
        public String getUpdatedBy() { return updatedBy; }
        public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
        
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
}