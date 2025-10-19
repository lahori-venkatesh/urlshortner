package com.urlshortener.repository;

import com.urlshortener.model.QrCode;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface QrCodeRepository extends MongoRepository<QrCode, String> {
    
    // Find by QR code identifier
    Optional<QrCode> findByQrCode(String qrCode);
    
    // Find by short code (for URL QR codes)
    Optional<QrCode> findByShortCode(String shortCode);
    
    // Find by file code (for file QR codes)
    Optional<QrCode> findByFileCode(String fileCode);
    
    // Find QR codes by user
    List<QrCode> findByUserId(String userId);
    
    // Find active QR codes by user
    List<QrCode> findByUserIdAndIsActiveTrue(String userId);
    
    // Find QR codes by content type
    List<QrCode> findByContentType(String contentType);
    
    // Find public QR codes
    List<QrCode> findByIsPublicTrue();
    
    // Find QR codes by style
    List<QrCode> findByStyle(String style);
    
    // Find expired QR codes
    @Query("{'expiresAt': {$lt: ?0}, 'isExpired': false}")
    List<QrCode> findExpiredQrCodes(LocalDateTime currentDate);
    
    // Find QR codes created between dates
    List<QrCode> findByCreatedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    // Find QR codes by user and date range
    List<QrCode> findByUserIdAndCreatedAtBetween(String userId, LocalDateTime startDate, LocalDateTime endDate);
    
    // Find QR codes by category
    List<QrCode> findByCategory(String category);
    
    // Find most scanned QR codes
    @Query(value = "{}", sort = "{'totalScans': -1}")
    List<QrCode> findMostScannedQrCodes();
    
    // Find recently scanned QR codes
    @Query("{'lastScannedAt': {$gte: ?0}}")
    List<QrCode> findRecentlyScannedQrCodes(LocalDateTime since);
    
    // Find QR codes with high scan count
    @Query("{'totalScans': {$gte: ?0}}")
    List<QrCode> findHighScanQrCodes(int minScans);
    
    // Count QR codes by user
    long countByUserId(String userId);
    
    // Count active QR codes by user
    long countByUserIdAndIsActiveTrue(String userId);
    
    // Count QR codes by content type
    long countByContentType(String contentType);
    
    // Check if QR code exists
    boolean existsByQrCode(String qrCode);
    
    // Find QR codes with tracking enabled
    List<QrCode> findByTrackScansTrue();
}