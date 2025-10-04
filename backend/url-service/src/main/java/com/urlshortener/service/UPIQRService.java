package com.urlshortener.service;

import org.springframework.stereotype.Service;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class UPIQRService {
    
    public String generateUPILink(UPIPaymentRequest request) {
        StringBuilder upiLink = new StringBuilder("upi://pay?");
        
        // Add UPI ID (Virtual Payment Address)
        if (request.getUpiId() != null && !request.getUpiId().isEmpty()) {
            upiLink.append("pa=").append(URLEncoder.encode(request.getUpiId(), StandardCharsets.UTF_8));
        }
        
        // Add payee name
        if (request.getPayeeName() != null && !request.getPayeeName().isEmpty()) {
            upiLink.append("&pn=").append(URLEncoder.encode(request.getPayeeName(), StandardCharsets.UTF_8));
        }
        
        // Add amount
        if (request.getAmount() != null && request.getAmount() > 0) {
            upiLink.append("&am=").append(request.getAmount());
        }
        
        // Add currency (default INR)
        upiLink.append("&cu=INR");
        
        // Add transaction note
        if (request.getTransactionNote() != null && !request.getTransactionNote().isEmpty()) {
            upiLink.append("&tn=").append(URLEncoder.encode(request.getTransactionNote(), StandardCharsets.UTF_8));
        }
        
        // Add merchant code (optional)
        if (request.getMerchantCode() != null && !request.getMerchantCode().isEmpty()) {
            upiLink.append("&mc=").append(URLEncoder.encode(request.getMerchantCode(), StandardCharsets.UTF_8));
        }
        
        // Add transaction reference (optional)
        if (request.getTransactionRef() != null && !request.getTransactionRef().isEmpty()) {
            upiLink.append("&tr=").append(URLEncoder.encode(request.getTransactionRef(), StandardCharsets.UTF_8));
        }
        
        return upiLink.toString();
    }
    
    public Map<String, String> getPopularUPIApps() {
        return Map.of(
            "phonepe", "PhonePe",
            "paytm", "Paytm",
            "googlepay", "Google Pay",
            "bhim", "BHIM UPI",
            "amazonpay", "Amazon Pay",
            "mobikwik", "MobiKwik",
            "freecharge", "Freecharge",
            "ybl", "Yes Bank"
        );
    }
    
    public String generateDeepLink(String upiLink, String appName) {
        switch (appName.toLowerCase()) {
            case "phonepe":
                return "phonepe://pay?pa=" + extractUPIId(upiLink);
            case "paytm":
                return "paytmmp://pay?pa=" + extractUPIId(upiLink);
            case "googlepay":
                return "tez://upi/pay?pa=" + extractUPIId(upiLink);
            case "bhim":
                return "bhim://pay?pa=" + extractUPIId(upiLink);
            default:
                return upiLink; // Return generic UPI link
        }
    }
    
    private String extractUPIId(String upiLink) {
        // Extract UPI ID from the UPI link
        String[] parts = upiLink.split("[?&]");
        for (String part : parts) {
            if (part.startsWith("pa=")) {
                return part.substring(3);
            }
        }
        return "";
    }
    
    public static class UPIPaymentRequest {
        private String upiId;
        private String payeeName;
        private Double amount;
        private String transactionNote;
        private String merchantCode;
        private String transactionRef;
        
        // Constructors
        public UPIPaymentRequest() {}
        
        public UPIPaymentRequest(String upiId, String payeeName, Double amount) {
            this.upiId = upiId;
            this.payeeName = payeeName;
            this.amount = amount;
        }
        
        // Getters and Setters
        public String getUpiId() { return upiId; }
        public void setUpiId(String upiId) { this.upiId = upiId; }
        
        public String getPayeeName() { return payeeName; }
        public void setPayeeName(String payeeName) { this.payeeName = payeeName; }
        
        public Double getAmount() { return amount; }
        public void setAmount(Double amount) { this.amount = amount; }
        
        public String getTransactionNote() { return transactionNote; }
        public void setTransactionNote(String transactionNote) { this.transactionNote = transactionNote; }
        
        public String getMerchantCode() { return merchantCode; }
        public void setMerchantCode(String merchantCode) { this.merchantCode = merchantCode; }
        
        public String getTransactionRef() { return transactionRef; }
        public void setTransactionRef(String transactionRef) { this.transactionRef = transactionRef; }
    }
}