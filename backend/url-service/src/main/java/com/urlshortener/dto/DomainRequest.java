package com.urlshortener.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class DomainRequest {
    
    @NotBlank(message = "Domain name is required")
    @Size(min = 4, max = 253, message = "Domain name must be between 4 and 253 characters")
    @Pattern(
        regexp = "^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\\.)+[a-zA-Z]{2,}$",
        message = "Invalid domain name format"
    )
    private String domainName;
    
    private String ownerType; // USER or TEAM
    private String ownerId;
    
    // Constructors
    public DomainRequest() {}
    
    public DomainRequest(String domainName, String ownerType, String ownerId) {
        this.domainName = domainName;
        this.ownerType = ownerType;
        this.ownerId = ownerId;
    }
    
    // Getters and Setters
    public String getDomainName() { return domainName; }
    public void setDomainName(String domainName) { 
        this.domainName = domainName != null ? domainName.toLowerCase().trim() : null; 
    }
    
    public String getOwnerType() { return ownerType; }
    public void setOwnerType(String ownerType) { this.ownerType = ownerType; }
    
    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }
}