package com.urlshortener.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Document(collection = "domains")
@CompoundIndexes({
    @CompoundIndex(def = "{'domainName': 1}", unique = true, name = "idx_domain_name_unique"),
    @CompoundIndex(def = "{'ownerId': 1, 'ownerType': 1}", name = "idx_owner_compound"),
    @CompoundIndex(def = "{'ownerId': 1, 'ownerType': 1, 'status': 1}", name = "idx_owner_status_compound"),
    @CompoundIndex(def = "{'status': 1, 'isActive': 1}", name = "idx_status_active"),
    @CompoundIndex(def = "{'verificationToken': 1}", unique = true, name = "idx_verification_token_unique"),
    @CompoundIndex(def = "{'ssl.expiresAt': 1}", name = "idx_ssl_expiry"),
    @CompoundIndex(def = "{'verification.nextCheckAt': 1}", name = "idx_next_verification"),
    @CompoundIndex(def = "{'risk.score': 1, 'risk.classification': 1}", name = "idx_risk_assessment"),
    @CompoundIndex(def = "{'planContext.plan': 1, 'ownerType': 1}", name = "idx_plan_owner")
})
public class OptimizedDomain {
    
    // Enums for type safety and validation
    public enum OwnerType {
        USER, TEAM
    }
    
    public enum DomainStatus {
        RESERVED, PENDING, VERIFIED, ERROR, SUSPENDED
    }
    
    public enum SslStatus {
        PENDING, ACTIVE, ERROR, EXPIRED
    }
    
    public enum VerificationMethod {
        CNAME, TXT, HTTP
    }
    
    public enum RiskClassification {
        LOW, MEDIUM, HIGH, CRITICAL
    }
    
    public enum SslProvider {
        CLOUDFLARE, LETS_ENCRYPT, CUSTOM
    }
    
    @Id
    private String id;
    
    // Core domain information
    @Indexed(unique = true)
    private String domainName;
    
    private String cnameTarget;
    
    @Indexed(unique = true)
    private String verificationToken;
    
    private int verificationAttempts = 0;
    
    // Status and activity
    @Indexed
    private DomainStatus status = DomainStatus.RESERVED;
    
    @Indexed
    private boolean isActive = true;
    
    private String disabledReason;
    
    // Ownership information
    @Indexed
    private OwnerType ownerType;
    
    @Indexed
    private String ownerId;
    
    private List<OwnershipHistory> ownershipHistory = new ArrayList<>();
    
    // SSL Configuration
    private SslProvider sslProvider;
    
    private SslStatus sslStatus = SslStatus.PENDING;
    
    private SslDetails ssl;
    
    // Verification details
    private VerificationDetails verification;
    
    // Risk assessment
    private RiskAssessment risk;
    
    // Plan and quota context
    private PlanContext planContext;
    
    // Performance monitoring
    private PerformanceStats performanceStats;
    
    // Background job tracking
    private JobDetails job;
    
    // Security flags
    @Indexed
    private boolean isBlacklisted = false;
    
    // Usage statistics
    private long totalRedirects = 0;
    
    // Timestamps
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    // Constructors
    public OptimizedDomain() {
        this.verification = new VerificationDetails();
        this.risk = new RiskAssessment();
        this.performanceStats = new PerformanceStats();
        this.job = new JobDetails();
    }
    
    public OptimizedDomain(String domainName, OwnerType ownerType, String ownerId, String verificationToken) {
        this();
        this.domainName = domainName;
        this.ownerType = ownerType;
        this.ownerId = ownerId;
        this.verificationToken = verificationToken;
        String backendUrl = System.getenv("BACKEND_URL");
        this.cnameTarget = backendUrl != null ? backendUrl.replace("https://", "") : "urlshortner-1-hpyu.onrender.com";
        
        // Initialize ownership history
        this.ownershipHistory.add(new OwnershipHistory(
            ownerType, ownerId, LocalDateTime.now()
        ));
    }
    
    // Helper methods
    public boolean isVerified() {
        return status == DomainStatus.VERIFIED;
    }
    
    public boolean isSslActive() {
        return sslStatus == SslStatus.ACTIVE && ssl != null && ssl.isValid();
    }
    
    public boolean needsVerificationCheck() {
        return verification != null && verification.needsCheck();
    }
    
    public boolean isHighRisk() {
        return risk != null && (risk.classification == RiskClassification.HIGH || 
                               risk.classification == RiskClassification.CRITICAL);
    }
    
    public void markAsVerified() {
        this.status = DomainStatus.VERIFIED;
        this.updatedAt = LocalDateTime.now();
        if (this.verification != null) {
            this.verification.markAsVerified();
        }
    }
    
    public void activateSsl(SslProvider provider, String certificateId) {
        this.sslProvider = provider;
        this.sslStatus = SslStatus.ACTIVE;
        this.ssl = new SslDetails(certificateId, LocalDateTime.now(), LocalDateTime.now().plusMonths(3));
        this.updatedAt = LocalDateTime.now();
    }
    
    public void incrementRedirects() {
        this.totalRedirects++;
        this.updatedAt = LocalDateTime.now();
        if (this.performanceStats != null) {
            this.performanceStats.updateLastRedirect();
        }
    }
    
    public void updatePerformanceMetrics(long latencyMs) {
        if (this.performanceStats != null) {
            this.performanceStats.updateLatency(latencyMs);
        }
    }
    
    // Nested classes for complex data structures
    
    public static class SslDetails {
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
        private LocalDateTime activatedAt;
        
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
        private LocalDateTime expiresAt;
        
        private String certificateId;
        
        public SslDetails() {}
        
        public SslDetails(String certificateId, LocalDateTime activatedAt, LocalDateTime expiresAt) {
            this.certificateId = certificateId;
            this.activatedAt = activatedAt;
            this.expiresAt = expiresAt;
        }
        
        public boolean isValid() {
            return expiresAt != null && LocalDateTime.now().isBefore(expiresAt);
        }
        
        public boolean isExpiringSoon() {
            return expiresAt != null && LocalDateTime.now().plusDays(30).isAfter(expiresAt);
        }
        
        // Getters and setters
        public LocalDateTime getActivatedAt() { return activatedAt; }
        public void setActivatedAt(LocalDateTime activatedAt) { this.activatedAt = activatedAt; }
        
        public LocalDateTime getExpiresAt() { return expiresAt; }
        public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
        
        public String getCertificateId() { return certificateId; }
        public void setCertificateId(String certificateId) { this.certificateId = certificateId; }
    }
    
    public static class VerificationDetails {
        private VerificationMethod method = VerificationMethod.CNAME;
        
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
        private LocalDateTime lastCheckedAt;
        
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
        private LocalDateTime nextCheckAt;
        
        private int verificationFailures = 0;
        
        public VerificationDetails() {
            this.nextCheckAt = LocalDateTime.now().plusMinutes(5); // Initial check in 5 minutes
        }
        
        public boolean needsCheck() {
            return nextCheckAt != null && LocalDateTime.now().isAfter(nextCheckAt);
        }
        
        public void markAsVerified() {
            this.lastCheckedAt = LocalDateTime.now();
            this.nextCheckAt = LocalDateTime.now().plusHours(24); // Daily recheck for verified domains
            this.verificationFailures = 0;
        }
        
        public void recordFailure() {
            this.verificationFailures++;
            this.lastCheckedAt = LocalDateTime.now();
            // Exponential backoff: 5min, 15min, 30min, 1hr, 2hr, 4hr, max 6hr
            int delayMinutes = Math.min(360, 5 * (int) Math.pow(2, Math.min(verificationFailures - 1, 6)));
            this.nextCheckAt = LocalDateTime.now().plusMinutes(delayMinutes);
        }
        
        // Getters and setters
        public VerificationMethod getMethod() { return method; }
        public void setMethod(VerificationMethod method) { this.method = method; }
        
        public LocalDateTime getLastCheckedAt() { return lastCheckedAt; }
        public void setLastCheckedAt(LocalDateTime lastCheckedAt) { this.lastCheckedAt = lastCheckedAt; }
        
        public LocalDateTime getNextCheckAt() { return nextCheckAt; }
        public void setNextCheckAt(LocalDateTime nextCheckAt) { this.nextCheckAt = nextCheckAt; }
        
        public int getVerificationFailures() { return verificationFailures; }
        public void setVerificationFailures(int verificationFailures) { this.verificationFailures = verificationFailures; }
    }
    
    public static class RiskAssessment {
        private double score = 0.0;
        private RiskClassification classification = RiskClassification.LOW;
        
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
        private LocalDateTime checkedAt;
        
        public RiskAssessment() {
            this.checkedAt = LocalDateTime.now();
        }
        
        public void updateRisk(double score) {
            this.score = score;
            this.checkedAt = LocalDateTime.now();
            
            // Classify risk based on score
            if (score < 0.3) {
                this.classification = RiskClassification.LOW;
            } else if (score < 0.6) {
                this.classification = RiskClassification.MEDIUM;
            } else if (score < 0.8) {
                this.classification = RiskClassification.HIGH;
            } else {
                this.classification = RiskClassification.CRITICAL;
            }
        }
        
        // Getters and setters
        public double getScore() { return score; }
        public void setScore(double score) { this.score = score; }
        
        public RiskClassification getClassification() { return classification; }
        public void setClassification(RiskClassification classification) { this.classification = classification; }
        
        public LocalDateTime getCheckedAt() { return checkedAt; }
        public void setCheckedAt(LocalDateTime checkedAt) { this.checkedAt = checkedAt; }
    }
    
    public static class PlanContext {
        private String plan = "FREE";
        private int customDomainQuota = 1;
        private int usageCount = 0;
        
        public boolean canAddDomain() {
            return usageCount < customDomainQuota;
        }
        
        public void incrementUsage() {
            this.usageCount++;
        }
        
        public void decrementUsage() {
            this.usageCount = Math.max(0, this.usageCount - 1);
        }
        
        // Getters and setters
        public String getPlan() { return plan; }
        public void setPlan(String plan) { this.plan = plan; }
        
        public int getCustomDomainQuota() { return customDomainQuota; }
        public void setCustomDomainQuota(int customDomainQuota) { this.customDomainQuota = customDomainQuota; }
        
        public int getUsageCount() { return usageCount; }
        public void setUsageCount(int usageCount) { this.usageCount = usageCount; }
    }
    
    public static class PerformanceStats {
        private long lastRedirectLatencyMs = 0;
        private double avgRedirectLatencyMs = 0.0;
        private double cacheHitRate = 0.0;
        private long totalRequests = 0;
        private long cacheHits = 0;
        
        public void updateLatency(long latencyMs) {
            this.lastRedirectLatencyMs = latencyMs;
            this.totalRequests++;
            
            // Calculate rolling average (simple approach)
            if (this.avgRedirectLatencyMs == 0.0) {
                this.avgRedirectLatencyMs = latencyMs;
            } else {
                this.avgRedirectLatencyMs = (this.avgRedirectLatencyMs * 0.9) + (latencyMs * 0.1);
            }
        }
        
        public void updateLastRedirect() {
            this.totalRequests++;
        }
        
        public void recordCacheHit() {
            this.cacheHits++;
            this.cacheHitRate = this.totalRequests > 0 ? (double) this.cacheHits / this.totalRequests : 0.0;
        }
        
        // Getters and setters
        public long getLastRedirectLatencyMs() { return lastRedirectLatencyMs; }
        public void setLastRedirectLatencyMs(long lastRedirectLatencyMs) { this.lastRedirectLatencyMs = lastRedirectLatencyMs; }
        
        public double getAvgRedirectLatencyMs() { return avgRedirectLatencyMs; }
        public void setAvgRedirectLatencyMs(double avgRedirectLatencyMs) { this.avgRedirectLatencyMs = avgRedirectLatencyMs; }
        
        public double getCacheHitRate() { return cacheHitRate; }
        public void setCacheHitRate(double cacheHitRate) { this.cacheHitRate = cacheHitRate; }
        
        public long getTotalRequests() { return totalRequests; }
        public void setTotalRequests(long totalRequests) { this.totalRequests = totalRequests; }
        
        public long getCacheHits() { return cacheHits; }
        public void setCacheHits(long cacheHits) { this.cacheHits = cacheHits; }
    }
    
    public static class JobDetails {
        private String queueId;
        private int retryCount = 0;
        private String lastWorkerId;
        
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
        private LocalDateTime lastProcessedAt;
        
        public void recordProcessing(String workerId) {
            this.lastWorkerId = workerId;
            this.lastProcessedAt = LocalDateTime.now();
        }
        
        public void incrementRetry() {
            this.retryCount++;
        }
        
        // Getters and setters
        public String getQueueId() { return queueId; }
        public void setQueueId(String queueId) { this.queueId = queueId; }
        
        public int getRetryCount() { return retryCount; }
        public void setRetryCount(int retryCount) { this.retryCount = retryCount; }
        
        public String getLastWorkerId() { return lastWorkerId; }
        public void setLastWorkerId(String lastWorkerId) { this.lastWorkerId = lastWorkerId; }
        
        public LocalDateTime getLastProcessedAt() { return lastProcessedAt; }
        public void setLastProcessedAt(LocalDateTime lastProcessedAt) { this.lastProcessedAt = lastProcessedAt; }
    }
    
    public static class OwnershipHistory {
        private OwnerType ownerType;
        private String ownerId;
        
        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
        private LocalDateTime transferredAt;
        
        public OwnershipHistory() {}
        
        public OwnershipHistory(OwnerType ownerType, String ownerId, LocalDateTime transferredAt) {
            this.ownerType = ownerType;
            this.ownerId = ownerId;
            this.transferredAt = transferredAt;
        }
        
        // Getters and setters
        public OwnerType getOwnerType() { return ownerType; }
        public void setOwnerType(OwnerType ownerType) { this.ownerType = ownerType; }
        
        public String getOwnerId() { return ownerId; }
        public void setOwnerId(String ownerId) { this.ownerId = ownerId; }
        
        public LocalDateTime getTransferredAt() { return transferredAt; }
        public void setTransferredAt(LocalDateTime transferredAt) { this.transferredAt = transferredAt; }
    }
    
    // Main getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getDomainName() { return domainName; }
    public void setDomainName(String domainName) { this.domainName = domainName; }
    
    public String getCnameTarget() { return cnameTarget; }
    public void setCnameTarget(String cnameTarget) { this.cnameTarget = cnameTarget; }
    
    public String getVerificationToken() { return verificationToken; }
    public void setVerificationToken(String verificationToken) { this.verificationToken = verificationToken; }
    
    public int getVerificationAttempts() { return verificationAttempts; }
    public void setVerificationAttempts(int verificationAttempts) { this.verificationAttempts = verificationAttempts; }
    
    public DomainStatus getStatus() { return status; }
    public void setStatus(DomainStatus status) { this.status = status; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public String getDisabledReason() { return disabledReason; }
    public void setDisabledReason(String disabledReason) { this.disabledReason = disabledReason; }
    
    public OwnerType getOwnerType() { return ownerType; }
    public void setOwnerType(OwnerType ownerType) { this.ownerType = ownerType; }
    
    public String getOwnerId() { return ownerId; }
    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }
    
    public List<OwnershipHistory> getOwnershipHistory() { return ownershipHistory; }
    public void setOwnershipHistory(List<OwnershipHistory> ownershipHistory) { this.ownershipHistory = ownershipHistory; }
    
    public SslProvider getSslProvider() { return sslProvider; }
    public void setSslProvider(SslProvider sslProvider) { this.sslProvider = sslProvider; }
    
    public SslStatus getSslStatus() { return sslStatus; }
    public void setSslStatus(SslStatus sslStatus) { this.sslStatus = sslStatus; }
    
    public SslDetails getSsl() { return ssl; }
    public void setSsl(SslDetails ssl) { this.ssl = ssl; }
    
    public VerificationDetails getVerification() { return verification; }
    public void setVerification(VerificationDetails verification) { this.verification = verification; }
    
    public RiskAssessment getRisk() { return risk; }
    public void setRisk(RiskAssessment risk) { this.risk = risk; }
    
    public PlanContext getPlanContext() { return planContext; }
    public void setPlanContext(PlanContext planContext) { this.planContext = planContext; }
    
    public PerformanceStats getPerformanceStats() { return performanceStats; }
    public void setPerformanceStats(PerformanceStats performanceStats) { this.performanceStats = performanceStats; }
    
    public JobDetails getJob() { return job; }
    public void setJob(JobDetails job) { this.job = job; }
    
    public boolean isBlacklisted() { return isBlacklisted; }
    public void setBlacklisted(boolean blacklisted) { isBlacklisted = blacklisted; }
    
    public long getTotalRedirects() { return totalRedirects; }
    public void setTotalRedirects(long totalRedirects) { this.totalRedirects = totalRedirects; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}