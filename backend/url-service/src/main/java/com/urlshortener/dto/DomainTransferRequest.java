package com.urlshortener.dto;

import jakarta.validation.constraints.NotBlank;

public class DomainTransferRequest {
    
    @NotBlank(message = "Domain ID is required")
    private String domainId;
    
    @NotBlank(message = "Target owner type is required")
    private String targetOwnerType; // USER or TEAM
    
    @NotBlank(message = "Target owner ID is required")
    private String targetOwnerId;
    
    private String reason = "User initiated transfer";
    private boolean migrateLinks = false; // Whether to migrate existing links
    
    // Constructors
    public DomainTransferRequest() {}
    
    public DomainTransferRequest(String domainId, String targetOwnerType, String targetOwnerId) {
        this.domainId = domainId;
        this.targetOwnerType = targetOwnerType;
        this.targetOwnerId = targetOwnerId;
    }
    
    // Getters and Setters
    public String getDomainId() { return domainId; }
    public void setDomainId(String domainId) { this.domainId = domainId; }
    
    public String getTargetOwnerType() { return targetOwnerType; }
    public void setTargetOwnerType(String targetOwnerType) { this.targetOwnerType = targetOwnerType; }
    
    public String getTargetOwnerId() { return targetOwnerId; }
    public void setTargetOwnerId(String targetOwnerId) { this.targetOwnerId = targetOwnerId; }
    
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    
    public boolean isMigrateLinks() { return migrateLinks; }
    public void setMigrateLinks(boolean migrateLinks) { this.migrateLinks = migrateLinks; }
}