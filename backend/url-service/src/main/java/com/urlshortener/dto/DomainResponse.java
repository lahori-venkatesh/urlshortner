package com.urlshortener.dto;

import com.urlshortener.model.Domain;
import java.time.LocalDateTime;

public class DomainResponse {
    
    private String id;
    private String domainName;
    private String ownerType;
    private String ownerId;
    private String status;
    private String sslStatus;
    private String cnameTarget;
    private String verificationToken;
    private LocalDateTime reservedUntil;
    private int verificationAttempts;
    private LocalDateTime lastVerificationAttempt;
    private String verificationError;
    private String sslProvider;
    private LocalDateTime sslIssuedAt;
    private LocalDateTime sslExpiresAt;
    private String sslError;
    private boolean isBlacklisted;
    private String blacklistReason;
    private long totalRedirects;
    private LocalDateTime lastUsed;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Constructors
    public DomainResponse() {}
    
    public DomainResponse(Domain domain) {
        this.id = domain.getId();
        this.domainName = domain.getDomainName();
        this.ownerType = domain.getOwnerType();
        this.ownerId = domain.getOwnerId();
        this.status = domain.getStatus();
        this.sslStatus = domain.getSslStatus();
        this.cnameTarget = domain.getCnameTarget();
        this.verificationToken = domain.getVerificationToken();
        this.reservedUntil = domain.getReservedUntil();
        this.verificationAttempts = domain.getVerificationAttempts();
        this.lastVerificationAttempt = domain.getLastVerificationAttempt();
        this.verificationError = domain.getVerificationError();
        this.sslProvider = domain.getSslProvider();
        this.sslIssuedAt = domain.getSslIssuedAt();
        this.sslExpiresAt = domain.getSslExpiresAt();
        this.sslError = domain.getSslError();
        this.isBlacklisted = domain.isBlacklisted();
        this.blacklistReason = domain.getBlacklistReason();
        this.totalRedirects = domain.getTotalRedirects();
        this.lastUsed = domain.getLastUsed();
        this.createdAt = domain.getCreatedAt();
        this.updatedAt = domain.getUpdatedAt();
    }
    
    // Static factory method for public API (limited fields)
    public static DomainResponse forPublicApi(Domain domain) {
        DomainResponse response = new DomainResponse();
        response.id = domain.getId();
        response.domainName = domain.getDomainName();
        response.status = domain.getStatus();
        response.sslStatus = domain.getSslStatus();
        response.cnameTarget = domain.getCnameTarget();
        response.verificationToken = domain.getVerificationToken();
        response.verificationError = domain.getVerificationError();
        response.sslError = domain.getSslError();
        response.totalRedirects = domain.getTotalRedirects();
        response.createdAt = domain.getCreatedAt();
        return response;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getDomainName() { return domainName; }
    public void setDomainName(String domainName) { this.domainName = domainName; }
    
    public String getOwnerType() { return ownerType; }
    public void setOwnerType(String ownerType) { this.ownerType = ownerType; }
    
    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getSslStatus() { return sslStatus; }
    public void setSslStatus(String sslStatus) { this.sslStatus = sslStatus; }
    
    public String getCnameTarget() { return cnameTarget; }
    public void setCnameTarget(String cnameTarget) { this.cnameTarget = cnameTarget; }
    
    public String getVerificationToken() { return verificationToken; }
    public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }
    
    public LocalDateTime getReservedUntil() { return reservedUntil; }
    public void setReservedUntil(LocalDateTime reservedUntil) { this.reservedUntil = reservedUntil; }
    
    public int getVerificationAttempts() { return verificationAttempts; }
    public void setVerificationAttempts(int verificationAttempts) { this.verificationAttempts = verificationAttempts; }
    
    public LocalDateTime getLastVerificationAttempt() { return lastVerificationAttempt; }
    public void setLastVerificationAttempt(LocalDateTime lastVerificationAttempt) { this.lastVerificationAttempt = lastVerificationAttempt; }
    
    public String getVerificationError() { return verificationError; }
    public void setVerificationError(String verificationError) { this.verificationError = verificationError; }
    
    public String getSslProvider() { return sslProvider; }
    public void setSslProvider(String sslProvider) { this.sslProvider = sslProvider; }
    
    public LocalDateTime getSslIssuedAt() { return sslIssuedAt; }
    public void setSslIssuedAt(LocalDateTime sslIssuedAt) { this.sslIssuedAt = sslIssuedAt; }
    
    public LocalDateTime getSslExpiresAt() { return sslExpiresAt; }
    public void setSslExpiresAt(LocalDateTime sslExpiresAt) { this.sslExpiresAt = sslExpiresAt; }
    
    public String getSslError() { return sslError; }
    public void setSslError(String sslError) { this.sslError = sslError; }
    
    public boolean isBlacklisted() { return isBlacklisted; }
    public void setBlacklisted(boolean blacklisted) { isBlacklisted = blacklisted; }
    
    public String getBlacklistReason() { return blacklistReason; }
    public void setBlacklistReason(String blacklistReason) { this.blacklistReason = blacklistReason; }
    
    public long getTotalRedirects() { return totalRedirects; }
    public void setTotalRedirects(long totalRedirects) { this.totalRedirects = totalRedirects; }
    
    public LocalDateTime getLastUsed() { return lastUsed; }
    public void setLastUsed(LocalDateTime lastUsed) { this.lastUsed = lastUsed; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}