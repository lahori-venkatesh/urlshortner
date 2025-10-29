package com.urlshortener.repository;

import com.urlshortener.model.UploadedFile;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UploadedFileRepository extends MongoRepository<UploadedFile, String> {
    
    // Find by file code
    Optional<UploadedFile> findByFileCode(String fileCode);
    
    // Find files by user
    List<UploadedFile> findByUserId(String userId);
    
    // Find active files by user
    List<UploadedFile> findByUserIdAndIsActiveTrue(String userId);
    
    // Find public files
    List<UploadedFile> findByIsPublicTrue();
    
    // Find files by type
    List<UploadedFile> findByFileType(String fileType);
    
    // Find files by extension
    List<UploadedFile> findByFileExtension(String fileExtension);
    
    // Find expired files
    @Query("{'expiresAt': {$lt: ?0}, 'isExpired': false}")
    List<UploadedFile> findExpiredFiles(LocalDateTime currentDate);
    
    // Find files uploaded between dates
    List<UploadedFile> findByUploadedAtBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    // Find files by user and date range
    List<UploadedFile> findByUserIdAndUploadedAtBetween(String userId, LocalDateTime startDate, LocalDateTime endDate);
    
    // Find files by category
    List<UploadedFile> findByCategory(String category);
    
    // Find files with password protection
    List<UploadedFile> findByRequiresPasswordTrue();
    
    // Find files with QR codes
    List<UploadedFile> findByHasQrCodeTrue();
    
    // Find files by status
    List<UploadedFile> findByStatus(String status);
    
    // Find large files
    @Query("{'fileSize': {$gte: ?0}}")
    List<UploadedFile> findLargeFiles(long minSize);
    
    // Find most downloaded files
    @Query(value = "{}", sort = "{'totalDownloads': -1}")
    List<UploadedFile> findMostDownloadedFiles();
    
    // Find recently accessed files
    @Query("{'lastAccessedAt': {$gte: ?0}}")
    List<UploadedFile> findRecentlyAccessedFiles(LocalDateTime since);
    
    // Find unscanned files
    List<UploadedFile> findByIsScannedFalse();
    
    // Find unsafe files
    List<UploadedFile> findByIsSafeFalse();
    
    // Count files by user
    long countByUserId(String userId);
    
    // Count active files by user
    long countByUserIdAndIsActiveTrue(String userId);
    
    // Calculate total storage used by user
    @Query(value = "{'userId': ?0}", fields = "{'fileSize': 1}")
    List<UploadedFile> findFileSizesByUserId(String userId);
    
    // Check if file code exists
    boolean existsByFileCode(String fileCode);
    
    // Team collaboration queries
    List<UploadedFile> findByScopeTypeAndScopeIdAndIsActiveTrue(String scopeType, String scopeId);
    
    List<UploadedFile> findByScopeTypeAndScopeId(String scopeType, String scopeId);
    
    long countByScopeTypeAndScopeId(String scopeType, String scopeId);
    
    // Find files by scope and date range
    List<UploadedFile> findByScopeTypeAndScopeIdAndUploadedAtBetween(String scopeType, String scopeId, LocalDateTime startDate, LocalDateTime endDate);
}