package com.urlshortener.security;

import com.urlshortener.model.User;
import com.urlshortener.model.Team;
import com.urlshortener.repository.UserRepository;
import com.urlshortener.repository.TeamRepository;
import com.urlshortener.repository.DomainRepository;
import org.springframework.security.access.expression.SecurityExpressionRoot;
import org.springframework.security.access.expression.method.MethodSecurityExpressionOperations;
import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

public class DomainQuotaMethodSecurityExpressionRoot extends SecurityExpressionRoot implements MethodSecurityExpressionOperations {
    
    private UserRepository userRepository;
    private TeamRepository teamRepository;
    private DomainRepository domainRepository;
    
    private Object filterObject;
    private Object returnObject;
    
    public DomainQuotaMethodSecurityExpressionRoot(Authentication authentication) {
        super(authentication);
    }
    
    public DomainQuotaMethodSecurityExpressionRoot(Authentication authentication, 
                                                 UserRepository userRepository,
                                                 TeamRepository teamRepository,
                                                 DomainRepository domainRepository) {
        super(authentication);
        this.userRepository = userRepository;
        this.teamRepository = teamRepository;
        this.domainRepository = domainRepository;
    }
    
    /**
     * Check if user has valid custom domain quota
     */
    public boolean hasValidCustomDomainQuota() {
        String userId = getAuthentication().getName();
        
        // Get user details
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return false;
        }
        
        // Check subscription plan
        String plan = user.getSubscriptionPlan();
        if (plan == null || "FREE".equals(plan)) {
            return false; // Free users can't add custom domains
        }
        
        // Check current domain count
        long currentDomains = domainRepository.countVerifiedDomainsByOwner(userId, "USER");
        int maxDomains = getMaxDomainsForPlan(plan);
        
        return currentDomains < maxDomains;
    }
    
    /**
     * Check if team has valid custom domain quota
     */
    public boolean hasValidTeamDomainQuota(String teamId) {
        String userId = getAuthentication().getName();
        
        // Check if user is team member
        Team team = teamRepository.findById(teamId).orElse(null);
        if (team == null || !team.isMember(userId)) {
            return false;
        }
        
        // Check team subscription
        String plan = team.getSubscriptionPlan();
        if (plan == null || "FREE".equals(plan)) {
            return false;
        }
        
        // Check current domain count
        long currentDomains = domainRepository.countVerifiedDomainsByOwner(teamId, "TEAM");
        int maxDomains = getMaxDomainsForPlan(plan);
        
        return currentDomains < maxDomains;
    }
    
    /**
     * Check if user can manage domains (Pro/Business plan)
     */
    public boolean canManageDomains() {
        String userId = getAuthentication().getName();
        User user = userRepository.findById(userId).orElse(null);
        
        if (user == null) {
            return false;
        }
        
        String plan = user.getSubscriptionPlan();
        return plan != null && (
            plan.startsWith("PRO_") || 
            plan.startsWith("BUSINESS_")
        );
    }
    
    private int getMaxDomainsForPlan(String plan) {
        return switch (plan) {
            case "PRO_MONTHLY", "PRO_YEARLY" -> 1;
            case "BUSINESS_MONTHLY", "BUSINESS_YEARLY" -> 3;
            default -> 0;
        };
    }
    
    @Override
    public void setFilterObject(Object filterObject) {
        this.filterObject = filterObject;
    }
    
    @Override
    public Object getFilterObject() {
        return filterObject;
    }
    
    @Override
    public void setReturnObject(Object returnObject) {
        this.returnObject = returnObject;
    }
    
    @Override
    public Object getReturnObject() {
        return returnObject;
    }
    
    @Override
    public Object getThis() {
        return this;
    }
}