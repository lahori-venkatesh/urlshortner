package com.urlshortener.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Document(collection = "domains")
@CompoundIndex(def = "{'domainName': 1}", unique = true)
@CompoundIndex(def = "{'ownerId': 1, 'ownerType': 1}")
public class Domain {
    
    // Enums for type safety
    public enum OwnerType {
        USER, TEAM
    }
    
    public enum DomainStatus {
        RESERVED, PENDING, VERIFIED, ERROR, SUSPENDED
    }
    
    public enum SslStatus {
        PENDING, ACTIVE, ERROR, EXPIRED
    }
    
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String domainName;
    
    @Indexed
    private String ownerType; // USER or TEAM
    
    @Indexed
    private String ownerId; // userId or teamId
    
    private String verificationToken;
    private String status = "RESERVED"; // RESERVED, PENDING, VERIFIED, ERROR, SUSPENDED
    private String sslStatus = "PENDING"; // PENDING, ACTIVE, ERROR, EXPIRED
    
    // Verification details
    private String cnameTarget;
    private LocalDateTime reservedUntil;
    private int verificationAttempts = 0;
    private LocalDateTime lastVerificationAttempt;
    private String verificationError;
    
    // SSL details
    private String sslProvider; // CLOUDFLARE, LETS_ENCRYPT
    private LocalDateTime sslIssuedAt;
    private LocalDateTime sslExpiresAt;
    private String sslError;
    
    // Ownership history for transfers
    private List<OwnershipHistory> ownershipHistory = new ArrayList<>();
    
    // Security and abuse prevention
    private boolean isBlacklisted = false;
    private String blacklistReason;
    private LocalDateTime lastReconfirmation;
    private LocalDateTime nextReconfirmationDue;
    
    // Usage statistics
    private long totalRedirects = 0;
    private LocalDateTime lastUsed;
    
    // Timestamps
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    // Constructors
    public Domain() {}
    
    public Domain(String domainName, String ownerType, String ownerId, String verificationToken) {
        this.domainName = domainName;
        this.ownerType = ownerType;
        this.ownerId = ownerId;
        this.verificationToken = verificationToken;
        this.cnameTarget = "pebly.vercel.app";
        this.reservedUntil = LocalDateTime.now().plusMinutes(15);
    }
    
    // Helper methods
    public boolean isReservationExpired() {
        return reservedUntil != null && LocalDateTime.now().isAfter(reservedUntil);
    }
    
    public boolean isVerified() {
        return "VERIFIED".equals(status);
    }
    
    public boolean isSslActive() {
        return "ACTIVE".equals(sslStatus);
    }
    
    public boolean needsReconfirmation() {
        return nextReconfirmationDue != null && LocalDateTime.now().isAfter(nextReconfirmationDue);
    }
    
    public void addOwnershipHistory(String fromOwnerType, String fromOwnerId, String reason) {
        ownershipHistory.add(new OwnershipHistory(fromOwnerType, fromOwnerId, ownerType, ownerId, reason, LocalDateTime.now()));
    }
    
    public void incrementVerificationAttempts() {
        this.verificationAttempts++;
        this.lastVerificationAttempt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public void markAsVerified() {
        this.status = "VERIFIED";
        this.verificationError = null;
        this.updatedAt = LocalDateTime.now();
        this.nextReconfirmationDue = LocalDateTime.now().plusYears(1);
    }
    
    public void markSslActive(String provider) {
        this.sslStatus = "ACTIVE";
        this.sslProvider = provider;
        this.sslIssuedAt = LocalDateTime.now();
        this.sslExpiresAt = LocalDateTime.now().plusMonths(3); // Standard SSL cert duration
        this.sslError = null;
        this.updatedAt = LocalDateTime.now();
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
    
    public String getVerificationToken() { return verificationToken; }
    public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }
    
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    
    public String getSslStatus() { return sslStatus; }
    public void setSslStatus(String sslStatus) { this.sslStatus = sslStatus; }
    
    public String getCnameTarget() { return cnameTarget; }
    public void setCnameTarget(String cnameTarget) { this.cnameTarget = cnameTarget; }
    
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
    
    public List<OwnershipHistory> getOwnershipHistory() { return ownershipHistory; }
    public void setOwnershipHistory(List<OwnershipHistory> ownershipHistory) { this.ownershipHistory = ownershipHistory; }
    
    public boolean isBlacklisted() { return isBlacklisted; }
    public void setBlacklisted(boolean blacklisted) { isBlacklisted = blacklisted; }
    
    public String getBlacklistReason() { return blacklistReason; }
    public void setBlacklistReason(String blacklistReason) { this.blacklistReason = blacklistReason; }
    
    public LocalDateTime getLastReconfirmation() { return lastReconfirmation; }
    public void setLastReconfirmation(LocalDateTime lastReconfirmation) { this.lastReconfirmation = lastReconfirmation; }
    
    public LocalDateTime getNextReconfirmationDue() { return nextReconfirmationDue; }
    public void setNextReconfirmationDue(LocalDateTime nextReconfirmationDue) { this.nextReconfirmationDue = nextReconfirmationDue; }
    
    public long getTotalRedirects() { return totalRedirects; }
    public void setTotalRedirects(long totalRedirects) { this.totalRedirects = totalRedirects; }
    
    public LocalDateTime getLastUsed() { return lastUsed; }
    public void setLastUsed(LocalDateTime lastUsed) { this.lastUsed = lastUsed; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    // Enum-based helper methods for type safety
    public OwnerType getOwnerTypeEnum() {
        try {
            return OwnerType.valueOf(ownerType);
        } catch (Exception e) {
            return OwnerType.USER; // default
        }
    }
    
    public void setOwnerType(OwnerType ownerType) {
        this.ownerType = ownerType.name();
    }
    
    public DomainStatus getStatusEnum() {
        try {
            return DomainStatus.valueOf(status);
        } catch (Exception e) {
            return DomainStatus.RESERVED; // default
        }
    }
    
    public void setStatus(DomainStatus status) {
        this.status = status.name();
    }
    
    public SslStatus getSslStatusEnum() {
        try {
            return SslStatus.valueOf(sslStatus);
        } catch (Exception e) {
            return SslStatus.PENDING; // default
        }
    }
    
    public void setSslStatus(SslStatus sslStatus) {
        this.sslStatus = sslStatus.name();
    }
    
    // Inner class for ownership history
    public static class OwnershipHistory {
        private String fromOwnerType;
        private String fromOwnerId;
        private String toOwnerType;
        private String toOwnerId;
        private String reason;
        private LocalDateTime transferredAt;
        
        public OwnershipHistory() {}
        
        public OwnershipHistory(String fromOwnerType, String fromOwnerId, String toOwnerType, String toOwnerId, String reason, LocalDateTime transferredAt) {
            this.fromOwnerType = fromOwnerType;
            this.fromOwnerId = fromOwnerId;
            this.toOwnerType = toOwnerType;
            this.toOwnerId = toOwnerId;
            this.reason = reason;
            this.transferredAt = transferredAt;
        }
        
        // Getters and setters
        public String getFromOwnerType() { return fromOwnerType; }
        public void setFromOwnerType(String fromOwnerType) { this.fromOwnerType = fromOwnerType; }
        
        public String getFromOwnerId() { return fromOwnerId; }
        public void setFromOwnerId(String fromOwnerId) { this.fromOwnerId = fromOwnerId; }
        
        public String getToOwnerType() { return toOwnerType; }
        public void setToOwnerType(String toOwnerType) { this.toOwnerType = toOwnerType; }
        
        public String getToOwnerId() { return toOwnerId; }
        public void setToOwnerId(String toOwnerId) { this.toOwnerId = toOwnerId; }
        
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        
        public LocalDateTime getTransferredAt() { return transferredAt; }
        public void setTransferredAt(LocalDateTime transferredAt) { this.transferredAt = transferredAt; }
    }
}