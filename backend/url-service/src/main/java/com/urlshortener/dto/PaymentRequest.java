package com.urlshortener.dto;

import com.urlshortener.model.PlanType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Email;

public class PaymentRequest {
    
    @NotNull(message = "Plan type is required")
    private PlanType planType;
    
    @Email(message = "Valid email is required")
    private String email;
    
    private String name;
    private String phone;
    
    // Constructors
    public PaymentRequest() {}
    
    public PaymentRequest(PlanType planType, String email, String name, String phone) {
        this.planType = planType;
        this.email = email;
        this.name = name;
        this.phone = phone;
    }
    
    // Getters and Setters
    public PlanType getPlanType() { return planType; }
    public void setPlanType(PlanType planType) { this.planType = planType; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
}