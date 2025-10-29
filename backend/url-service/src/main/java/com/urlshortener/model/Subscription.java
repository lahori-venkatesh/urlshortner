package com.urlshortener.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;

@Document(collection = "subscriptions")
public class Subscription {
    
    @Id
    private String id;
    
    @Indexed
    private String userId;
    
    private String planType; // PRO_MONTHLY, PRO_YEARLY, BUSINESS_MONTHLY, BUSINESS_YEARLY
    private String paymentId; // Razorpay payment ID
    private String orderId; // Razorpay order ID
    
    private boolean isActive = true;
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
    private LocalDateTime expiresAt;
    
    // Payment details
    private Integer amountPaid; // Amount in paise
    private String currency = "INR";
    private String couponCode;
    private Integer discountAmount;
    
    // Constructors
    public Subscription() {}
    
    public Subscription(String userId, String planType, String paymentId) {
        this.userId = userId;
        this.planType = planType;
        this.paymentId = paymentId;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    
    public String getPlanType() { return planType; }
    public void setPlanType(String planType) { this.planType = planType; }
    
    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }
    
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    
    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    
    public Integer getAmountPaid() { return amountPaid; }
    public void setAmountPaid(Integer amountPaid) { this.amountPaid = amountPaid; }
    
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    
    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }
    
    public Integer getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(Integer discountAmount) { this.discountAmount = discountAmount; }
}