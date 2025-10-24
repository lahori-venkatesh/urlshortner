package com.urlshortener.controller;

import com.urlshortener.service.SubscriptionService;
import com.urlshortener.service.SubscriptionService.UserPlanInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/subscription")
@CrossOrigin(origins = "*")
public class SubscriptionController {
    
    @Autowired
    private SubscriptionService subscriptionService;
    
    /**
     * Get user's current plan information
     */
    @GetMapping("/plan/{userId}")
    public ResponseEntity<Map<String, Object>> getUserPlan(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            UserPlanInfo planInfo = subscriptionService.getUserPlanInfo(userId);
            
            Map<String, Object> planData = new HashMap<>();
            planData.put("plan", planInfo.getPlan());
            planData.put("hasPremiumAccess", planInfo.isHasPremiumAccess());
            planData.put("inTrial", planInfo.isInTrial());
            planData.put("trialEligible", planInfo.isTrialEligible());
            planData.put("subscriptionExpiry", planInfo.getSubscriptionExpiry());
            planData.put("remainingDailyUrls", planInfo.getRemainingDailyUrls());
            planData.put("remainingDailyQrCodes", planInfo.getRemainingDailyQrCodes());
            planData.put("maxFileSizeMB", planInfo.getMaxFileSizeMB());
            
            // Feature access
            planData.put("canUseCustomAlias", subscriptionService.canUseCustomAlias(userId));
            planData.put("canUsePasswordProtection", subscriptionService.canUsePasswordProtection(userId));
            planData.put("canSetExpiration", subscriptionService.canSetExpiration(userId));
            planData.put("canUseCustomDomain", subscriptionService.canUseCustomDomain(userId));
            planData.put("canAccessDetailedAnalytics", subscriptionService.canAccessDetailedAnalytics(userId));
            planData.put("canCustomizeQrCodes", subscriptionService.canCustomizeQrCodes(userId));
            
            response.put("success", true);
            response.put("data", planData);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to get plan information: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Check if user can perform specific action
     */
    @GetMapping("/check/{userId}/{action}")
    public ResponseEntity<Map<String, Object>> checkAccess(@PathVariable String userId, @PathVariable String action) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            boolean hasAccess = false;
            String message = "";
            
            switch (action.toLowerCase()) {
                case "create-url":
                    hasAccess = subscriptionService.canCreateUrl(userId);
                    if (!hasAccess) {
                        int remaining = subscriptionService.getRemainingDailyUrls(userId);
                        message = "Daily limit reached. You have " + remaining + " URLs remaining today.";
                    }
                    break;
                    
                case "create-qr":
                    hasAccess = subscriptionService.canCreateQrCode(userId);
                    if (!hasAccess) {
                        int remaining = subscriptionService.getRemainingDailyQrCodes(userId);
                        message = "Daily limit reached. You have " + remaining + " QR codes remaining today.";
                    }
                    break;
                    
                case "custom-alias":
                    hasAccess = subscriptionService.canUseCustomAlias(userId);
                    if (!hasAccess) {
                        message = "Custom aliases are available with Premium plans.";
                    }
                    break;
                    
                case "password-protection":
                    hasAccess = subscriptionService.canUsePasswordProtection(userId);
                    if (!hasAccess) {
                        message = "Password protection is available with Premium plans.";
                    }
                    break;
                    
                case "expiration":
                    hasAccess = subscriptionService.canSetExpiration(userId);
                    if (!hasAccess) {
                        message = "Link expiration is available with Premium plans.";
                    }
                    break;
                    
                case "custom-domain":
                    hasAccess = subscriptionService.canUseCustomDomain(userId);
                    if (!hasAccess) {
                        message = "Custom domains are available with Premium plans.";
                    }
                    break;
                    
                case "detailed-analytics":
                    hasAccess = subscriptionService.canAccessDetailedAnalytics(userId);
                    if (!hasAccess) {
                        message = "Detailed analytics are available with Premium plans.";
                    }
                    break;
                    
                case "customize-qr":
                    hasAccess = subscriptionService.canCustomizeQrCodes(userId);
                    if (!hasAccess) {
                        message = "QR code customization is available with Premium plans.";
                    }
                    break;
                    
                default:
                    response.put("success", false);
                    response.put("message", "Unknown action: " + action);
                    return ResponseEntity.badRequest().body(response);
            }
            
            response.put("success", true);
            response.put("hasAccess", hasAccess);
            response.put("message", message);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to check access: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Start trial for eligible user
     */
    @PostMapping("/trial/{userId}")
    public ResponseEntity<Map<String, Object>> startTrial(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            boolean started = subscriptionService.startTrial(userId);
            
            if (started) {
                response.put("success", true);
                response.put("message", "Trial started successfully! You now have 1-day premium access.");
            } else {
                response.put("success", false);
                response.put("message", "You are not eligible for trial or have already used it.");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to start trial: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Upgrade user to premium plan
     */
    @PostMapping("/upgrade")
    public ResponseEntity<Map<String, Object>> upgradePlan(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String userId = (String) request.get("userId");
            String planType = (String) request.get("planType");
            String subscriptionId = (String) request.get("subscriptionId");
            String customerId = (String) request.get("customerId");
            
            if (userId == null || planType == null) {
                response.put("success", false);
                response.put("message", "User ID and plan type are required");
                return ResponseEntity.badRequest().body(response);
            }
            
            subscriptionService.upgradeToPremium(userId, planType, subscriptionId, customerId);
            
            response.put("success", true);
            response.put("message", "Plan upgraded successfully to " + planType);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to upgrade plan: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Get pricing information
     */
    @GetMapping("/pricing")
    public ResponseEntity<Map<String, Object>> getPricing() {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Map<String, Object> pricing = new HashMap<>();
            
            // Free plan
            Map<String, Object> freePlan = new HashMap<>();
            freePlan.put("name", "Free");
            freePlan.put("price", 0);
            freePlan.put("currency", "INR");
            freePlan.put("period", "forever");
            freePlan.put("features", new String[]{
                "10 URLs per day",
                "10 QR codes per day",
                "Basic QR codes (B&W)",
                "5MB file uploads",
                "Basic analytics",
                "7-day data retention"
            });
            
            // Premium Monthly
            Map<String, Object> monthlyPlan = new HashMap<>();
            monthlyPlan.put("name", "Premium Monthly");
            monthlyPlan.put("price", 299);
            monthlyPlan.put("currency", "INR");
            monthlyPlan.put("period", "month");
            monthlyPlan.put("features", new String[]{
                "Unlimited URLs",
                "Unlimited QR codes",
                "Custom QR codes with logos",
                "500MB file uploads",
                "Detailed analytics",
                "Custom aliases",
                "Password protection",
                "Link expiration",
                "Custom domains",
                "Priority support"
            });
            
            // Premium Yearly
            Map<String, Object> yearlyPlan = new HashMap<>();
            yearlyPlan.put("name", "Premium Yearly");
            yearlyPlan.put("price", 2499);
            yearlyPlan.put("currency", "INR");
            yearlyPlan.put("period", "year");
            yearlyPlan.put("savings", 1089);
            yearlyPlan.put("features", new String[]{
                "Everything in Monthly",
                "Save ₹1,089 per year",
                "Best value for businesses"
            });
            
            // Lifetime
            Map<String, Object> lifetimePlan = new HashMap<>();
            lifetimePlan.put("name", "Lifetime");
            lifetimePlan.put("price", 9999);
            lifetimePlan.put("currency", "INR");
            lifetimePlan.put("period", "lifetime");
            lifetimePlan.put("features", new String[]{
                "Everything in Premium",
                "Pay once, use forever",
                "Perfect for agencies",
                "No recurring payments"
            });
            
            pricing.put("free", freePlan);
            pricing.put("monthly", monthlyPlan);
            pricing.put("yearly", yearlyPlan);
            pricing.put("lifetime", lifetimePlan);
            
            response.put("success", true);
            response.put("data", pricing);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to get pricing: " + e.getMessage());
            return ResponseEntity.status(500).body(response);
        }
    }
}