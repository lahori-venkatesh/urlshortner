package com.urlshortener.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import com.urlshortener.dto.PaymentRequest;
import com.urlshortener.dto.PaymentResponse;
import com.urlshortener.model.PlanType;
import com.urlshortener.model.Subscription;
import com.urlshortener.model.User;
import com.urlshortener.repository.SubscriptionRepository;
import com.urlshortener.repository.UserRepository;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@Transactional
public class RazorpayService {
    
    private static final Logger logger = LoggerFactory.getLogger(RazorpayService.class);
    
    private final RazorpayClient razorpayClient;
    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    
    @Value("${razorpay.key.id}")
    private String razorpayKeyId;
    
    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;
    
    @Value("${app.frontend.url}")
    private String frontendUrl;
    
    public RazorpayService(SubscriptionRepository subscriptionRepository,
                          UserRepository userRepository,
                          @Value("${razorpay.key.id}") String keyId,
                          @Value("${razorpay.key.secret}") String keySecret) throws RazorpayException {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.razorpayClient = new RazorpayClient(keyId, keySecret);
    }
    
    public PaymentResponse createOrder(PaymentRequest paymentRequest, String userEmail) {
        try {
            // Get user
            Optional<User> userOpt = userRepository.findByEmail(userEmail);
            if (userOpt.isEmpty()) {
                throw new RuntimeException("User not found");
            }
            User user = userOpt.get();
            
            // Calculate amount in paise (Razorpay uses paise)
            BigDecimal amount = paymentRequest.getPlanType().getPriceAsBigDecimal();
            int amountInPaise = amount.multiply(BigDecimal.valueOf(100)).intValue();
            
            // Create Razorpay order
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "order_" + System.currentTimeMillis());
            
            Order order = razorpayClient.orders.create(orderRequest);
            
            // Create subscription record
            Subscription subscription = new Subscription(user, paymentRequest.getPlanType(), amount);
            subscription.setRazorpaySubscriptionId(order.get("id"));
            subscriptionRepository.save(subscription);
            
            // Create payment response
            return new PaymentResponse(
                order.get("id"),
                razorpayKeyId,
                amount,
                "INR",
                "Pebly Premium",
                paymentRequest.getPlanType().getDisplayName(),
                paymentRequest.getEmail(),
                paymentRequest.getPhone(),
                frontendUrl + "/payment/callback"
            );
            
        } catch (RazorpayException e) {
            logger.error("Error creating Razorpay order", e);
            throw new RuntimeException("Failed to create payment order", e);
        }
    }
    
    public boolean verifyPayment(String orderId, String paymentId, String signature) {
        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", orderId);
            attributes.put("razorpay_payment_id", paymentId);
            attributes.put("razorpay_signature", signature);
            
            Utils.verifyPaymentSignature(attributes, razorpayKeySecret);
            
            // Update subscription status
            Optional<Subscription> subscriptionOpt = subscriptionRepository.findByRazorpaySubscriptionId(orderId);
            if (subscriptionOpt.isPresent()) {
                Subscription subscription = subscriptionOpt.get();
                subscription.setStatus(com.urlshortener.model.SubscriptionStatus.ACTIVE);
                subscription.setRazorpayPaymentId(paymentId);
                subscriptionRepository.save(subscription);
                
                logger.info("Payment verified and subscription activated for order: {}", orderId);
                return true;
            }
            
            return false;
            
        } catch (RazorpayException e) {
            logger.error("Payment verification failed for order: {}", orderId, e);
            return false;
        }
    }
    
    public boolean hasActiveSubscription(String userEmail) {
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            return false;
        }
        
        return subscriptionRepository.findActiveSubscriptionByUserId(userOpt.get().getId()).isPresent();
    }
    
    public Optional<Subscription> getActiveSubscription(String userEmail) {
        Optional<User> userOpt = userRepository.findByEmail(userEmail);
        if (userOpt.isEmpty()) {
            return Optional.empty();
        }
        
        return subscriptionRepository.findActiveSubscriptionByUserId(userOpt.get().getId());
    }
}