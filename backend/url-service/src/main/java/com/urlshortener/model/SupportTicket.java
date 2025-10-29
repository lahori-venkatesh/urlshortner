package com.urlshortener.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Document(collection = "support_tickets")
public class SupportTicket {
    
    @Id
    private String id;
    
    @Indexed
    private String userId;
    
    private String userEmail;
    private String userName;
    
    private Category category;
    private String subject;
    private String message;
    private Priority priority;
    private Status status;
    
    private String assignedAgent;
    private List<SupportResponse> responses = new ArrayList<>();
    private List<String> attachments = new ArrayList<>();
    private List<String> tags = new ArrayList<>();
    
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    
    // Metadata
    private String userAgent;
    private String ipAddress;
    private String currentPage;
    private String browserInfo;
    
    public enum Category {
        PAYMENT("Payment Support"),
        TECHNICAL("Technical Support"),
        ACCOUNT("Account Support"),
        GENERAL("General Inquiry"),
        FEATURE_REQUEST("Feature Request");
        
        private final String displayName;
        
        Category(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    public enum Priority {
        LOW("Low"),
        MEDIUM("Medium"),
        HIGH("High"),
        URGENT("Urgent");
        
        private final String displayName;
        
        Priority(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    public enum Status {
        OPEN("Open"),
        IN_PROGRESS("In Progress"),
        WAITING_FOR_USER("Waiting for User"),
        RESOLVED("Resolved"),
        CLOSED("Closed");
        
        private final String displayName;
        
        Status(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    // Constructors
    public SupportTicket() {}
    
    public SupportTicket(String userId, String userEmail, String userName, 
                        Category category, String subject, String message, Priority priority) {
        this.userId = userId;
        this.userEmail = userEmail;
        this.userName = userName;
        this.category = category;
        this.subject = subject;
        this.message = message;
        this.priority = priority;
        this.status = Status.OPEN;
    }
    
    // Helper methods
    public void addResponse(SupportResponse response) {
        this.responses.add(response);
        this.updatedAt = LocalDateTime.now();
    }
    
    public void updateStatus(Status newStatus) {
        this.status = newStatus;
        this.updatedAt = LocalDateTime.now();
        
        if (newStatus == Status.RESOLVED) {
            this.resolvedAt = LocalDateTime.now();
        } else if (newStatus == Status.CLOSED) {
            this.closedAt = LocalDateTime.now();
        }
    }
    
    public void assignAgent(String agentId) {
        this.assignedAgent = agentId;
        this.updatedAt = LocalDateTime.now();
        
        if (this.status == Status.OPEN) {
            this.status = Status.IN_PROGRESS;
        }
    }
    
    public boolean isOverdue() {
        if (status == Status.CLOSED || status == Status.RESOLVED) {
            return false;
        }
        
        LocalDateTime deadline = createdAt.plusHours(getResponseTimeHours());
        return LocalDateTime.now().isAfter(deadline);
    }
    
    private int getResponseTimeHours() {
        switch (priority) {
            case URGENT: return 2;
            case HIGH: return 8;
            case MEDIUM: return 24;
            case LOW: return 72;
            default: return 24;
        }
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }
    
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    
    public String getAssignedAgent() { return assignedAgent; }
    public void setAssignedAgent(String assignedAgent) { this.assignedAgent = assignedAgent; }
    
    public List<SupportResponse> getResponses() { return responses; }
    public void setResponses(List<SupportResponse> responses) { this.responses = responses; }
    
    public List<String> getAttachments() { return attachments; }
    public void setAttachments(List<String> attachments) { this.attachments = attachments; }
    
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
    
    public LocalDateTime getClosedAt() { return closedAt; }
    public void setClosedAt(LocalDateTime closedAt) { this.closedAt = closedAt; }
    
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    
    public String getCurrentPage() { return currentPage; }
    public void setCurrentPage(String currentPage) { this.currentPage = currentPage; }
    
    public String getBrowserInfo() { return browserInfo; }
    public void setBrowserInfo(String browserInfo) { this.browserInfo = browserInfo; }
}