package com.urlshortener.dto;

import java.math.BigDecimal;

public class PaymentResponse {
    
    private String orderId;
    private String razorpayKeyId;
    private BigDecimal amount;
    private String currency;
    private String name;
    private String description;
    private String email;
    private String phone;
    private String callbackUrl;
    
    // Constructors
    public PaymentResponse() {}
    
    public PaymentResponse(String orderId, String razorpayKeyId, BigDecimal amount, 
                          String currency, String name, String description, 
                          String email, String phone, String callbackUrl) {
        this.orderId = orderId;
        this.razorpayKeyId = razorpayKeyId;
        this.amount = amount;
        this.currency = currency;
        this.name = name;
        this.description = description;
        this.email = email;
        this.phone = phone;
        this.callbackUrl = callbackUrl;
    }
    
    // Getters and Setters
    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }
    
    public String getRazorpayKeyId() { return razorpayKeyId; }
    public void setRazorpayKeyId(String razorpayKeyId) { this.razorpayKeyId = razorpayKeyId; }
    
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    
    public String getCallbackUrl() { return callbackUrl; }
    public void setCallbackUrl(String callbackUrl) { this.callbackUrl = callbackUrl; }
}