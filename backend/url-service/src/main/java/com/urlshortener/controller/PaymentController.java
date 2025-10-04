package com.urlshortener.controller;

import com.urlshortener.dto.PaymentRequest;
import com.urlshortener.dto.PaymentResponse;
import com.urlshortener.model.Subscription;
import com.urlshortener.service.RazorpayService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = {"${app.frontend.url}", "https://*.vercel.app"})
public class PaymentController {
    
    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);
    
    private final RazorpayService razorpayService;
    
    public PaymentController(RazorpayService razorpayService) {
        this.razorpayService = razorpayService;
    }
    
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@Valid @RequestBody PaymentRequest paymentRequest,
                                       Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            PaymentResponse paymentResponse = razorpayService.createOrder(paymentRequest, userEmail);
            
            logger.info("Payment order created for user: {}, plan: {}", userEmail, paymentRequest.getPlanType());
            
            return ResponseEntity.ok(paymentResponse);
            
        } catch (Exception e) {
            logger.error("Error creating payment order", e);
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to create payment order: " + e.getMessage()));
        }
    }
    
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> paymentData) {
        try {
            String orderId = paymentData.get("razorpay_order_id");
            String paymentId = paymentData.get("razorpay_payment_id");
            String signature = paymentData.get("razorpay_signature");
            
            boolean isValid = razorpayService.verifyPayment(orderId, paymentId, signature);
            
            if (isValid) {
                logger.info("Payment verified successfully for order: {}", orderId);
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Payment verified successfully"
                ));
            } else {
                logger.warn("Payment verification failed for order: {}", orderId);
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Payment verification failed"));
            }
            
        } catch (Exception e) {
            logger.error("Error verifying payment", e);
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Payment verification error: " + e.getMessage()));
        }
    }
    
    @GetMapping("/subscription/status")
    public ResponseEntity<?> getSubscriptionStatus(Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Optional<Subscription> subscription = razorpayService.getActiveSubscription(userEmail);
            
            if (subscription.isPresent()) {
                Subscription sub = subscription.get();
                return ResponseEntity.ok(Map.of(
                    "hasActiveSubscription", true,
                    "planType", sub.getPlanType(),
                    "status", sub.getStatus(),
                    "startDate", sub.getStartDate(),
                    "endDate", sub.getEndDate(),
                    "isExpired", sub.isExpired()
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                    "hasActiveSubscription", false
                ));
            }
            
        } catch (Exception e) {
            logger.error("Error getting subscription status", e);
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to get subscription status"));
        }
    }
    
    @GetMapping("/plans")
    public ResponseEntity<?> getAvailablePlans() {
        try {
            return ResponseEntity.ok(Map.of(
                "plans", Map.of(
                    "MONTHLY", Map.of(
                        "name", "Monthly Plan",
                        "price", 299,
                        "currency", "INR",
                        "features", new String[]{
                            "Unlimited URL shortening",
                            "Custom aliases",
                            "Basic analytics",
                            "QR code generation",
                            "Email support"
                        }
                    ),
                    "YEARLY", Map.of(
                        "name", "Yearly Plan",
                        "price", 2999,
                        "currency", "INR",
                        "discount", "17% OFF",
                        "features", new String[]{
                            "Everything in Monthly",
                            "Advanced analytics",
                            "Custom domains",
                            "Bulk operations",
                            "Priority support",
                            "API access"
                        }
                    ),
                    "LIFETIME", Map.of(
                        "name", "Lifetime Plan",
                        "price", 9999,
                        "currency", "INR",
                        "discount", "Best Value",
                        "features", new String[]{
                            "Everything in Yearly",
                            "Lifetime access",
                            "White-label solution",
                            "Advanced integrations",
                            "Dedicated support",
                            "Custom features"
                        }
                    )
                )
            ));
            
        } catch (Exception e) {
            logger.error("Error getting plans", e);
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to get plans"));
        }
    }
}