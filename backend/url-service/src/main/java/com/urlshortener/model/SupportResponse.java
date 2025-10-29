package com.urlshortener.model;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

public class SupportResponse {
    
    private String id;
    private String ticketId;
    private String message;
    private Sender sender;
    private String senderId;
    private String senderName;
    private String senderEmail;
    private LocalDateTime timestamp = LocalDateTime.now();
    private List<String> attachments = new ArrayList<>();
    private boolean isInternal = false; // For internal agent notes
    private String responseType = "message"; // message, note, status_change, etc.
    
    public enum Sender {
        USER("User"),
        AGENT("Support Agent"),
        SYSTEM("System");
        
        private final String displayName;
        
        Sender(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    // Constructors
    public SupportResponse() {}
    
    public SupportResponse(String ticketId, String message, Sender sender, 
                          String senderId, String senderName) {
        this.ticketId = ticketId;
        this.message = message;
        this.sender = sender;
        this.senderId = senderId;
        this.senderName = senderName;
    }
    
    public SupportResponse(String ticketId, String message, Sender sender, 
                          String senderId, String senderName, String senderEmail) {
        this(ticketId, message, sender, senderId, senderName);
        this.senderEmail = senderEmail;
    }
    
    // Helper methods
    public boolean isFromUser() {
        return sender == Sender.USER;
    }
    
    public boolean isFromAgent() {
        return sender == Sender.AGENT;
    }
    
    public boolean isFromSystem() {
        return sender == Sender.SYSTEM;
    }
    
    public void addAttachment(String attachmentUrl) {
        this.attachments.add(attachmentUrl);
    }
    
    public void markAsInternal() {
        this.isInternal = true;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getTicketId() { return ticketId; }
    public void setTicketId(String ticketId) { this.ticketId = ticketId; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public Sender getSender() { return sender; }
    public void setSender(Sender sender) { this.sender = sender; }
    
    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }
    
    public String getSenderName() { return senderName; }
    public void setSenderName(String senderName) { this.senderName = senderName; }
    
    public String getSenderEmail() { return senderEmail; }
    public void setSenderEmail(String senderEmail) { this.senderEmail = senderEmail; }
    
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    
    public List<String> getAttachments() { return attachments; }
    public void setAttachments(List<String> attachments) { this.attachments = attachments; }
    
    public boolean isInternal() { return isInternal; }
    public void setInternal(boolean internal) { isInternal = internal; }
    
    public String getResponseType() { return responseType; }
    public void setResponseType(String responseType) { this.responseType = responseType; }
}