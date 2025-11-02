package com.urlshortener.model;

/**
 * Centralized Plan Policy System for Pebly SaaS Platform
 * This enum defines all plan limits and features in one place
 * Must be kept in sync with frontend planPolicy.ts
 */
public enum PlanPolicy {
    FREE("Free", 0, 1, 100, 10, 5, false, false, false, false, false, false),
    PRO("Pro", 1, 3, 1000, 100, 50, true, true, true, false, true, false),
    BUSINESS("Business", 3, 10, 10000, 1000, 500, true, true, true, true, true, true),
    BUSINESS_TRIAL("Business Trial", 3, 10, 10000, 1000, 500, true, true, true, true, true, true);

    private final String displayName;
    private final int domains;
    private final int teamMembers;
    private final int urlsPerMonth;
    private final int qrCodesPerMonth;
    private final int filesPerMonth;
    private final boolean customDomain;
    private final boolean analytics;
    private final boolean teamCollaboration;
    private final boolean whiteLabel;
    private final boolean apiAccess;
    private final boolean prioritySupport;

    PlanPolicy(String displayName, int domains, int teamMembers, int urlsPerMonth, 
               int qrCodesPerMonth, int filesPerMonth, boolean customDomain, 
               boolean analytics, boolean teamCollaboration, boolean whiteLabel, 
               boolean apiAccess, boolean prioritySupport) {
        this.displayName = displayName;
        this.domains = domains;
        this.teamMembers = teamMembers;
        this.urlsPerMonth = urlsPerMonth;
        this.qrCodesPerMonth = qrCodesPerMonth;
        this.filesPerMonth = filesPerMonth;
        this.customDomain = customDomain;
        this.analytics = analytics;
        this.teamCollaboration = teamCollaboration;
        this.whiteLabel = whiteLabel;
        this.apiAccess = apiAccess;
        this.prioritySupport = prioritySupport;
    }

    // Getters
    public String getDisplayName() { return displayName; }
    public int getDomains() { return domains; }
    public int getTeamMembers() { return teamMembers; }
    public int getUrlsPerMonth() { return urlsPerMonth; }
    public int getQrCodesPerMonth() { return qrCodesPerMonth; }
    public int getFilesPerMonth() { return filesPerMonth; }
    public boolean hasCustomDomain() { return customDomain; }
    public boolean hasAnalytics() { return analytics; }
    public boolean hasTeamCollaboration() { return teamCollaboration; }
    public boolean hasWhiteLabel() { return whiteLabel; }
    public boolean hasApiAccess() { return apiAccess; }
    public boolean hasPrioritySupport() { return prioritySupport; }

    /**
     * Get plan policy from string with fallback to FREE
     */
    public static PlanPolicy fromString(String planName) {
        if (planName == null || planName.trim().isEmpty()) {
            return FREE;
        }
        
        try {
            String normalizedPlan = planName.toUpperCase().replaceAll("[^A-Z_]", "");
            return PlanPolicy.valueOf(normalizedPlan);
        } catch (IllegalArgumentException e) {
            return FREE;
        }
    }

    /**
     * Check if user can add a domain
     */
    public boolean canAddDomain(int currentDomainCount) {
        return currentDomainCount < this.domains;
    }

    /**
     * Check if user can add a team member
     */
    public boolean canAddTeamMember(int currentMemberCount) {
        return currentMemberCount < this.teamMembers;
    }

    /**
     * Check if user can create a URL
     */
    public boolean canCreateUrl(int currentUrlCount) {
        return currentUrlCount < this.urlsPerMonth;
    }

    /**
     * Check if user can create a QR code
     */
    public boolean canCreateQR(int currentQRCount) {
        return currentQRCount < this.qrCodesPerMonth;
    }

    /**
     * Check if user can upload a file
     */
    public boolean canUploadFile(int currentFileCount) {
        return currentFileCount < this.filesPerMonth;
    }

    /**
     * Get upgrade path for current plan
     */
    public PlanPolicy getUpgradePath() {
        switch (this) {
            case FREE:
                return PRO;
            case PRO:
                return BUSINESS;
            default:
                return BUSINESS;
        }
    }

    /**
     * Check if plan is a trial plan
     */
    public boolean isTrial() {
        return this.name().contains("TRIAL");
    }

    /**
     * Check if plan is free
     */
    public boolean isFree() {
        return this == FREE;
    }

    /**
     * Check if plan is paid
     */
    public boolean isPaid() {
        return this != FREE;
    }
}