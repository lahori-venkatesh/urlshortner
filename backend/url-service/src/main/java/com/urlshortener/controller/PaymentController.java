package com.urlshortener.controller;

import com.urlshortener.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/payments")
@CrossOrigin(origins = "*")
public class PaymentController {
    
    @Autowired
    private PaymentService paymentService;
    
    @PostMapping("/create-order")
    public ResponseEntity<Map<String, Object>> createOrder(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Integer amount = (Integer) request.get("amount");
            String currency = (String) request.get("currency");
            String planType = (String) request.get("planType");
            String planName = (String) request.get("planName");
            String couponCode = (String) request.get("couponCode");
            String userId = (String) request.get("userId");
            
            if (amount == null || amount <= 0) {
                response.put("success", false);
                response.put("message", "Invalid amount");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Note: Frontend already calculates discounted price, so we don't apply discount here
            // The amount received is already the final discounted amount
            // We just validate the coupon code if provided
            if (couponCode != null && !couponCode.trim().isEmpty()) {
                // Validate coupon exists but don't apply discount again
                if (!"VENKAT99".equalsIgnoreCase(couponCode) && !"VENAKT90".equalsIgnoreCase(couponCode)) {
                    response.put("success", false);
                    response.put("message", "Invalid coupon code");
                    return ResponseEntity.badRequest().body(response);
                }
            }
            
            String orderId = paymentService.createRazorpayOrder(amount, currency, planType, planName, userId);
            
            response.put("success", true);
            response.put("orderId", orderId);
            response.put("amount", amount);
            response.put("currency", currency);
            response.put("message", "Order created successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyPayment(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String razorpayOrderId = (String) request.get("razorpay_order_id");
            String razorpayPaymentId = (String) request.get("razorpay_payment_id");
            String razorpaySignature = (String) request.get("razorpay_signature");
            String planType = (String) request.get("planType");
            String userId = (String) request.get("userId");
            
            if (razorpayOrderId == null || razorpayPaymentId == null || razorpaySignature == null) {
                response.put("success", false);
                response.put("message", "Missing payment verification parameters");
                return ResponseEntity.badRequest().body(response);
            }
            
            boolean isValid = paymentService.verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);
            
            if (isValid) {
                // Activate subscription for user
                paymentService.activateSubscription(userId, planType, razorpayPaymentId);
                
                response.put("success", true);
                response.put("message", "Payment verified and subscription activated");
            } else {
                response.put("success", false);
                response.put("message", "Payment verification failed");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/webhook")
    public ResponseEntity<String> handleWebhook(@RequestBody String payload,
                                               @RequestHeader("X-Razorpay-Signature") String signature) {
        try {
            boolean isValid = paymentService.verifyWebhookSignature(payload, signature);
            
            if (isValid) {
                paymentService.processWebhookEvent(payload);
                return ResponseEntity.ok("OK");
            } else {
                return ResponseEntity.badRequest().body("Invalid signature");
            }
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Webhook processing failed");
        }
    }
    
    @GetMapping("/subscription-status/{userId}")
    public ResponseEntity<Map<String, Object>> getSubscriptionStatus(@PathVariable String userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Map<String, Object> subscriptionStatus = paymentService.getSubscriptionStatus(userId);
            
            response.put("success", true);
            response.put("data", subscriptionStatus);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/validate-coupon")
    public ResponseEntity<Map<String, Object>> validateCoupon(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String couponCode = (String) request.get("couponCode");
            Integer amount = (Integer) request.get("amount");
            
            if (couponCode == null || couponCode.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Coupon code is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            Map<String, Object> couponInfo = paymentService.validateCoupon(couponCode, amount);
            
            response.put("success", true);
            response.put("data", couponInfo);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}