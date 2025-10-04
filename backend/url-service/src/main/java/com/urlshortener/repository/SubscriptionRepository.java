package com.urlshortener.repository;

import com.urlshortener.model.Subscription;
import com.urlshortener.model.SubscriptionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    
    Optional<Subscription> findByRazorpaySubscriptionId(String razorpaySubscriptionId);
    
    @Query("SELECT s FROM Subscription s WHERE s.user.id = :userId AND s.status = 'ACTIVE' AND s.endDate > :currentTime")
    Optional<Subscription> findActiveSubscriptionByUserId(@Param("userId") Long userId);
    
    @Query("SELECT s FROM Subscription s WHERE s.user.id = :userId ORDER BY s.createdAt DESC")
    List<Subscription> findAllByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);
    
    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.endDate < :currentTime")
    List<Subscription> findExpiredActiveSubscriptions(@Param("currentTime") LocalDateTime currentTime);
    
    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.status = 'ACTIVE'")
    long countActiveSubscriptions();
    
    @Query("SELECT s FROM Subscription s WHERE s.user.email = :email ORDER BY s.createdAt DESC")
    List<Subscription> findByUserEmailOrderByCreatedAtDesc(@Param("email") String email);
}