package com.urlshortener.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "subscriptions")
public class Subscription {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PlanType planType;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionStatus status;
    
    @Column(name = "razorpay_subscription_id")
    private String razorpaySubscriptionId;
    
    @Column(name = "razorpay_payment_id")
    private String razorpayPaymentId;
    
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;
    
    @Column(nullable = false)
    private String currency = "INR";
    
    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;
    
    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public Subscription() {
        this.createdAt = LocalDateTime.now();
    }
    
    public Subscription(User user, PlanType planType, BigDecimal amount) {
        this();
        this.user = user;
        this.planType = planType;
        this.amount = amount;
        this.status = SubscriptionStatus.PENDING;
        this.startDate = LocalDateTime.now();
        this.endDate = calculateEndDate(planType);
    }
    
    private LocalDateTime calculateEndDate(PlanType planType) {
        return switch (planType) {
            case MONTHLY -> startDate.plusMonths(1);
            case YEARLY -> startDate.plusYears(1);
            case LIFETIME -> startDate.plusYears(100); // Effectively lifetime
        };
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public PlanType getPlanType() { return planType; }
    public void setPlanType(PlanType planType) { this.planType = planType; }
    
    public SubscriptionStatus getStatus() { return status; }
    public void setStatus(SubscriptionStatus status) { 
        this.status = status;
        this.updatedAt = LocalDateTime.now();
    }
    
    public String getRazorpaySubscriptionId() { return razorpaySubscriptionId; }
    public void setRazorpaySubscriptionId(String razorpaySubscriptionId) { 
        this.razorpaySubscriptionId = razorpaySubscriptionId; 
    }
    
    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { 
        this.razorpayPaymentId = razorpayPaymentId; 
    }
    
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    
    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }
    
    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    // Helper methods
    public boolean isActive() {
        return status == SubscriptionStatus.ACTIVE && 
               LocalDateTime.now().isBefore(endDate);
    }
    
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(endDate);
    }
}

enum PlanType {
    MONTHLY("Monthly Plan", 299.00),
    YEARLY("Yearly Plan", 2999.00),
    LIFETIME("Lifetime Plan", 9999.00);
    
    private final String displayName;
    private final double price;
    
    PlanType(String displayName, double price) {
        this.displayName = displayName;
        this.price = price;
    }
    
    public String getDisplayName() { return displayName; }
    public double getPrice() { return price; }
    public BigDecimal getPriceAsBigDecimal() { return BigDecimal.valueOf(price); }
}

enum SubscriptionStatus {
    PENDING,
    ACTIVE,
    CANCELLED,
    EXPIRED,
    FAILED
}