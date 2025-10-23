package com.urlshortener.repository;

import com.urlshortener.model.Subscription;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends MongoRepository<Subscription, String> {
    
    // Find active subscriptions by user ID
    List<Subscription> findByUserIdAndIsActiveTrue(String userId);
    
    // Find active subscription that hasn't expired
    Optional<Subscription> findByUserIdAndIsActiveTrueAndExpiresAtAfter(String userId, LocalDateTime currentTime);
    
    // Find subscription by payment ID
    Optional<Subscription> findByPaymentId(String paymentId);
    
    // Find subscription by order ID
    Optional<Subscription> findByOrderId(String orderId);
    
    // Find all subscriptions by user ID
    List<Subscription> findByUserId(String userId);
    
    // Find subscriptions by plan type
    List<Subscription> findByPlanType(String planType);
    
    // Find expired subscriptions
    List<Subscription> findByIsActiveTrueAndExpiresAtBefore(LocalDateTime currentTime);
    
    // Count active subscriptions
    long countByIsActiveTrue();
    
    // Count subscriptions by plan type
    long countByPlanType(String planType);
    
    // Find subscriptions created between dates
    List<Subscription> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    // Find subscriptions with coupon code
    List<Subscription> findByCouponCodeIsNotNull();
    
    // Find subscriptions by coupon code
    List<Subscription> findByCouponCode(String couponCode);
}