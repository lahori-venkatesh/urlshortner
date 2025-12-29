package com.urlshortener.model;

/**
 * Centralized Plan Policy System for Pebly SaaS Platform
 * This enum defines all plan limits and features in one place
 * Must be kept in sync with frontend planPolicy.ts
 * 
 * CORRECTED PLAN STRUCTURE:
 * - FREE: 0 domains, 0 team members, 75 URLs/month, 30 QR/month, 5 files/month,
 * 7-day team trial (1 member)
 * - PRO: 1 domain, 3 team members, 1000 URLs/month, 100 QR/month, 50
 * files/month, 7-day trial
 * - BUSINESS: 3 domains, 10 team members, 10000 URLs/month, 1000 QR/month, 500
 * files/month, 14-day trial
 * - BUSINESS_TRIAL: Same as BUSINESS but with trial period active
 */
public enum PlanPolicy {
    FREE("Free", 0, 0, 75, 30, 5, 7, false, false, false, false, false, false, false, false, false, false, false, false,
            false, false, false),
    PRO("Pro", 1, 3, 1000, 100, 50, 7, true, true, true, false, true, false, true, true, true, true, true, true, true,
            true, true),
    BUSINESS("Business", 3, 10, 10000, 1000, 500, 14, true, true, true, true, true, true, true, true, true, true, true,
            true, true, true, true),
    BUSINESS_TRIAL("Business Trial", 3, 10, 10000, 1000, 500, 14, true, true, true, true, true, true, true, true, true,
            true, true, true, true, true, true);

    private final String displayName;
    private final int domains;
    private final int teamMembers;
    private final int urlsPerMonth;
    private final int qrCodesPerMonth;
    private final int filesPerMonth;
    private final int trialDays;

    // Core features
    private final boolean customDomain;
    private final boolean analytics;
    private final boolean teamCollaboration;
    private final boolean whiteLabel;
    private final boolean apiAccess;
    private final boolean prioritySupport;

    // URL Shortener Premium Features
    private final boolean customAlias;
    private final boolean passwordProtection;
    private final boolean linkExpiration;
    private final boolean clickLimits;

    // QR Code Premium Features
    private final boolean customQRColors;
    private final boolean qrLogo;
    private final boolean qrBranding;
    private final boolean advancedQRSettings;

    // File Upload Premium Features
    private final boolean advancedFileSettings;

    PlanPolicy(String displayName, int domains, int teamMembers, int urlsPerMonth,
            int qrCodesPerMonth, int filesPerMonth, int trialDays,
            boolean customDomain, boolean analytics, boolean teamCollaboration,
            boolean whiteLabel, boolean apiAccess, boolean prioritySupport,
            boolean customAlias, boolean passwordProtection, boolean linkExpiration,
            boolean clickLimits, boolean customQRColors, boolean qrLogo,
            boolean qrBranding, boolean advancedQRSettings, boolean advancedFileSettings) {
        this.displayName = displayName;
        this.domains = domains;
        this.teamMembers = teamMembers;
        this.urlsPerMonth = urlsPerMonth;
        this.qrCodesPerMonth = qrCodesPerMonth;
        this.filesPerMonth = filesPerMonth;
        this.trialDays = trialDays;
        this.customDomain = customDomain;
        this.analytics = analytics;
        this.teamCollaboration = teamCollaboration;
        this.whiteLabel = whiteLabel;
        this.apiAccess = apiAccess;
        this.prioritySupport = prioritySupport;
        this.customAlias = customAlias;
        this.passwordProtection = passwordProtection;
        this.linkExpiration = linkExpiration;
        this.clickLimits = clickLimits;
        this.customQRColors = customQRColors;
        this.qrLogo = qrLogo;
        this.qrBranding = qrBranding;
        this.advancedQRSettings = advancedQRSettings;
        this.advancedFileSettings = advancedFileSettings;
    }

    // Getters
    public String getDisplayName() {
        return displayName;
    }

    public int getDomains() {
        return domains;
    }

    public int getTeamMembers() {
        return teamMembers;
    }

    public int getUrlsPerMonth() {
        return urlsPerMonth;
    }

    public int getQrCodesPerMonth() {
        return qrCodesPerMonth;
    }

    public int getFilesPerMonth() {
        return filesPerMonth;
    }

    public int getTrialDays() {
        return trialDays;
    }

    // Core feature getters
    public boolean hasCustomDomain() {
        return customDomain;
    }

    public boolean hasAnalytics() {
        return analytics;
    }

    public boolean hasTeamCollaboration() {
        return teamCollaboration;
    }

    public boolean hasWhiteLabel() {
        return whiteLabel;
    }

    public boolean hasApiAccess() {
        return apiAccess;
    }

    public boolean hasPrioritySupport() {
        return prioritySupport;
    }

    // URL Shortener Premium Features
    public boolean hasCustomAlias() {
        return customAlias;
    }

    public boolean hasPasswordProtection() {
        return passwordProtection;
    }

    public boolean hasLinkExpiration() {
        return linkExpiration;
    }

    public boolean hasClickLimits() {
        return clickLimits;
    }

    // QR Code Premium Features
    public boolean hasCustomQRColors() {
        return customQRColors;
    }

    public boolean hasQrLogo() {
        return qrLogo;
    }

    public boolean hasQrBranding() {
        return qrBranding;
    }

    public boolean hasAdvancedQRSettings() {
        return advancedQRSettings;
    }

    // File Upload Premium Features
    public boolean hasAdvancedFileSettings() {
        return advancedFileSettings;
    }

    /**
     * Get plan policy from string with fallback to FREE
     */
    /**
     * Get plan policy from string with fallback to FREE
     */
    public static PlanPolicy fromString(String planName) {
        if (planName == null || planName.trim().isEmpty()) {
            return FREE;
        }

        try {
            String normalizedPlan = planName.toUpperCase().replaceAll("[^A-Z_]", "");

            // Map specific plan variants to base plans
            if (normalizedPlan.startsWith("PRO_")) {
                return PRO;
            }
            if (normalizedPlan.startsWith("BUSINESS_") && !normalizedPlan.contains("TRIAL")) {
                return BUSINESS;
            }
            if (normalizedPlan.equals("BUSINESS_TRIAL")) {
                return BUSINESS_TRIAL;
            }

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

    /**
     * Check if user has access to a specific feature
     * This mirrors the frontend hasFeature function
     */
    public boolean hasFeature(String featureName) {
        switch (featureName.toLowerCase()) {
            case "customdomain":
                return hasCustomDomain();
            case "analytics":
                return hasAnalytics();
            case "teamcollaboration":
                return hasTeamCollaboration();
            case "whitelabel":
                return hasWhiteLabel();
            case "apiaccess":
                return hasApiAccess();
            case "prioritysupport":
                return hasPrioritySupport();
            case "customalias":
                return hasCustomAlias();
            case "passwordprotection":
                return hasPasswordProtection();
            case "linkexpiration":
                return hasLinkExpiration();
            case "clicklimits":
                return hasClickLimits();
            case "customqrcolors":
                return hasCustomQRColors();
            case "qrlogo":
                return hasQrLogo();
            case "qrbranding":
                return hasQrBranding();
            case "advancedqrsettings":
                return hasAdvancedQRSettings();
            case "advancedfilesettings":
                return hasAdvancedFileSettings();
            default:
                return false;
        }
    }

    /**
     * Get upgrade reason message (mirrors frontend logic)
     */
    public String getUpgradeReason(String feature, Integer currentCount) {
        if (this.isFree()) {
            return String.format("Upgrade to %s to unlock %s", this.getUpgradePath().getDisplayName(), feature);
        }

        if ("Custom Domains".equals(feature) && this == PRO) {
            return "Upgrade to Business for more domains";
        }

        if ("Team Members".equals(feature) && this == PRO) {
            return "Upgrade to Business for larger teams";
        }

        if (currentCount != null) {
            return String.format("You've reached your %s limit for the %s plan", feature.toLowerCase(),
                    this.displayName);
        }

        return String.format("%s is not available in your current plan", feature);
    }

    /**
     * Check if user should see upgrade modal (mirrors frontend logic)
     */
    public boolean shouldShowUpgradeModal(String feature, Integer currentCount) {
        // Free users always see upgrade modal for paid features
        if (this.isFree() && !this.hasFeature(feature)) {
            return true;
        }

        // Paid users see upgrade modal when they hit limits
        if (this.isPaid() && currentCount != null) {
            if ("Custom Domains".equals(feature) && !this.canAddDomain(currentCount)) {
                return this == PRO; // PRO users can upgrade to BUSINESS
            }
            if ("Team Members".equals(feature) && !this.canAddTeamMember(currentCount)) {
                return this == PRO; // PRO users can upgrade to BUSINESS
            }
        }

        return false;
    }
}