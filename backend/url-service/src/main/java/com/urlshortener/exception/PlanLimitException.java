package com.urlshortener.exception;

/**
 * Exception thrown when a user tries to exceed their plan limits
 */
public class PlanLimitException extends RuntimeException {
    private final String feature;
    private final String planName;
    private final int currentCount;
    private final int limit;

    public PlanLimitException(String message) {
        super(message);
        this.feature = null;
        this.planName = null;
        this.currentCount = 0;
        this.limit = 0;
    }

    public PlanLimitException(String feature, String planName, int currentCount, int limit) {
        super(String.format("Plan limit exceeded for %s. Current: %d, Limit: %d (Plan: %s)", 
                          feature, currentCount, limit, planName));
        this.feature = feature;
        this.planName = planName;
        this.currentCount = currentCount;
        this.limit = limit;
    }

    public PlanLimitException(String message, Throwable cause) {
        super(message, cause);
        this.feature = null;
        this.planName = null;
        this.currentCount = 0;
        this.limit = 0;
    }

    // Getters
    public String getFeature() { return feature; }
    public String getPlanName() { return planName; }
    public int getCurrentCount() { return currentCount; }
    public int getLimit() { return limit; }
}