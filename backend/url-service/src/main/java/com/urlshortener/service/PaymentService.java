package com.urlshortener.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import com.urlshortener.model.Subscription;
import com.urlshortener.model.User;
import com.urlshortener.repository.SubscriptionRepository;
import com.urlshortener.repository.UserRepository;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class PaymentService {
    
    @Autowired
    private SubscriptionRepository subscriptionRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Value("${razorpay.key.id}")
    private String razorpayKeyId;
    
    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;
    
    private RazorpayClient razorpayClient;
    
    private RazorpayClient getRazorpayClient() throws RazorpayException {
        if (razorpayClient == null) {
            razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        }
        return razorpayClient;
    }
    
    public String createRazorpayOrder(Integer amount, String currency, String planType, String planName, String userId) throws RazorpayException {
        RazorpayClient client = getRazorpayClient();
        
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amount); // amount in paise
        orderRequest.put("currency", currency != null ? currency : "INR");
        orderRequest.put("receipt", "order_" + System.currentTimeMillis());
        
        JSONObject notes = new JSONObject();
        notes.put("planType", planType);
        notes.put("planName", planName);
        notes.put("userId", userId);
        orderRequest.put("notes", notes);
        
        Order order = client.orders.create(orderRequest);
        return order.get("id");
    }
    
    public boolean verifyPayment(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", razorpayOrderId);
            options.put("razorpay_payment_id", razorpayPaymentId);
            options.put("razorpay_signature", razorpaySignature);
            
            return Utils.verifyPaymentSignature(options, razorpayKeySecret);
        } catch (Exception e) {
            return false;
        }
    }
    
    public void activateSubscription(String userId, String planType, String paymentId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        User user = userOpt.get();
        
        // Deactivate any existing subscriptions
        subscriptionRepository.findByUserIdAndIsActiveTrue(userId)
            .forEach(sub -> {
                sub.setActive(false);
                sub.setUpdatedAt(LocalDateTime.now());
                subscriptionRepository.save(sub);
            });
        
        // Create new subscription
        Subscription subscription = new Subscription();
        subscription.setUserId(userId);
        subscription.setPlanType(planType);
        subscription.setPaymentId(paymentId);
        subscription.setActive(true);
        subscription.setCreatedAt(LocalDateTime.now());
        subscription.setUpdatedAt(LocalDateTime.now());
        
        // Set expiration based on plan type
        if ("MONTHLY".equals(planType)) {
            subscription.setExpiresAt(LocalDateTime.now().plusMonths(1));
        } else if ("YEARLY".equals(planType)) {
            subscription.setExpiresAt(LocalDateTime.now().plusYears(1));
        } else if ("LIFETIME".equals(planType)) {
            subscription.setExpiresAt(LocalDateTime.now().plusYears(100)); // Effectively lifetime
        }
        
        subscriptionRepository.save(subscription);
        
        // Update user plan
        user.setSubscriptionPlan(planType.toUpperCase());
        user.setSubscriptionExpiry(subscription.getExpiresAt());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }
    
    public Map<String, Object> getSubscriptionStatus(String userId) {
        Map<String, Object> status = new HashMap<>();
        
        Optional<Subscription> activeSubscription = subscriptionRepository
            .findByUserIdAndIsActiveTrueAndExpiresAtAfter(userId, LocalDateTime.now());
        
        if (activeSubscription.isPresent()) {
            Subscription sub = activeSubscription.get();
            status.put("hasActiveSubscription", true);
            status.put("planType", sub.getPlanType());
            status.put("expiresAt", sub.getExpiresAt());
            status.put("isLifetime", "LIFETIME".equals(sub.getPlanType()));
        } else {
            status.put("hasActiveSubscription", false);
            status.put("planType", "FREE");
        }
        
        return status;
    }
    
    public Integer applyCouponDiscount(Integer originalAmount, String couponCode) {
        // Handle the special 99% discount coupon
        if ("VENKAT99".equalsIgnoreCase(couponCode)) {
            return Math.max(100, Math.round(originalAmount * 0.01f)); // 99% discount = pay only 1%, minimum ₹1
        }
        
        // Handle the special 90% discount coupon
        if ("VENAKT90".equalsIgnoreCase(couponCode)) {
            return Math.max(100, Math.round(originalAmount * 0.1f)); // 90% discount = pay only 10%, minimum ₹1
        }
        
        // Add more coupon logic here as needed
        throw new RuntimeException("Invalid coupon code");
    }
    
    public Map<String, Object> validateCoupon(String couponCode, Integer amount) {
        Map<String, Object> couponInfo = new HashMap<>();
        
        if ("VENKAT99".equalsIgnoreCase(couponCode)) {
            int discountedAmount = Math.max(100, Math.round(amount * 0.01f));
            couponInfo.put("valid", true);
            couponInfo.put("code", "VENKAT99");
            couponInfo.put("discount", 99);
            couponInfo.put("type", "percentage");
            couponInfo.put("discountedAmount", discountedAmount);
            couponInfo.put("savings", amount - discountedAmount);
        } else if ("VENAKT90".equalsIgnoreCase(couponCode)) {
            int discountedAmount = Math.max(100, Math.round(amount * 0.1f));
            couponInfo.put("valid", true);
            couponInfo.put("code", "VENAKT90");
            couponInfo.put("discount", 90);
            couponInfo.put("type", "percentage");
            couponInfo.put("discountedAmount", discountedAmount);
            couponInfo.put("savings", amount - discountedAmount);
        } else {
            throw new RuntimeException("Invalid coupon code");
        }
        
        return couponInfo;
    }
    
    public boolean verifyWebhookSignature(String payload, String signature) {
        try {
            String expectedSignature = generateSignature(payload, razorpayKeySecret);
            return expectedSignature.equals(signature);
        } catch (Exception e) {
            return false;
        }
    }
    
    public void processWebhookEvent(String payload) {
        try {
            JSONObject event = new JSONObject(payload);
            String eventType = event.getString("event");
            
            if ("payment.captured".equals(eventType)) {
                JSONObject payment = event.getJSONObject("payload").getJSONObject("payment");
                String paymentId = payment.getString("id");
                String orderId = payment.getString("order_id");
                
                // Process successful payment
                // You can add additional logic here based on your needs
                System.out.println("Payment captured: " + paymentId + " for order: " + orderId);
            }
            
        } catch (Exception e) {
            System.err.println("Error processing webhook: " + e.getMessage());
        }
    }
    
    private String generateSignature(String payload, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] hash = mac.doFinal(payload.getBytes());
        
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        
        return hexString.toString();
    }
}