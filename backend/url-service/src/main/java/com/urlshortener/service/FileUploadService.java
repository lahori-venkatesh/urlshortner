package com.urlshortener.service;

import com.urlshortener.model.UploadedFile;
import com.urlshortener.model.User;
import com.urlshortener.repository.UploadedFileRepository;
import com.urlshortener.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.mongodb.client.gridfs.model.GridFSFile;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

@Service
public class FileUploadService {
    
    @Autowired
    private UploadedFileRepository uploadedFileRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private GridFsTemplate gridFsTemplate;
    
    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    private static final String[] ALLOWED_TYPES = {
        "image/jpeg", "image/png", "image/gif", "image/webp",
        "application/pdf", "text/plain", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/zip", "application/x-zip-compressed"
    };
    
    public UploadedFile uploadFile(MultipartFile file, String userId, String title, 
                                 String description, String password, Integer expirationDays,
                                 boolean isPublic) throws IOException {
        
        // Validate file
        validateFile(file);
        
        // Create file metadata
        UploadedFile uploadedFile = new UploadedFile(
            file.getOriginalFilename(),
            file.getContentType(),
            file.getSize(),
            userId
        );
        
        // Set additional properties
        uploadedFile.setTitle(title);
        uploadedFile.setDescription(description);
        uploadedFile.setPublic(isPublic);
        
        // Set password protection
        if (password != null && !password.trim().isEmpty()) {
            uploadedFile.setPassword(password);
            uploadedFile.setRequiresPassword(true);
        }
        
        // Set expiration
        if (expirationDays != null && expirationDays > 0) {
            uploadedFile.setExpiresAt(LocalDateTime.now().plusDays(expirationDays));
        }
        
        // Extract file extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename != null && originalFilename.contains(".")) {
            String extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1);
            uploadedFile.setFileExtension(extension.toLowerCase());
        }
        
        try {
            // Store file in GridFS
            org.bson.types.ObjectId fileId = gridFsTemplate.store(
                file.getInputStream(),
                uploadedFile.getFileCode(),
                file.getContentType()
            );
            
            uploadedFile.setGridFsFileId(fileId.toString());
            uploadedFile.setStoredFileName(uploadedFile.getFileCode());
            
            // Save metadata to database
            UploadedFile saved = uploadedFileRepository.save(uploadedFile);
            
            // Update user statistics
            if (userId != null) {
                updateUserStats(userId);
            }
            
            return saved;
            
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage());
        }
    }
    
    public Optional<UploadedFile> getFileByCode(String fileCode) {
        return uploadedFileRepository.findByFileCode(fileCode);
    }
    
    public GridFsResource getFileContent(String fileCode) {
        Optional<UploadedFile> fileOpt = uploadedFileRepository.findByFileCode(fileCode);
        
        if (fileOpt.isEmpty()) {
            throw new RuntimeException("File not found");
        }
        
        UploadedFile file = fileOpt.get();
        
        // Check if file is expired
        if (file.getExpiresAt() != null && file.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("File has expired");
        }
        
        // Get file from GridFS
        GridFSFile gridFSFile = gridFsTemplate.findOne(
            new Query(Criteria.where("filename").is(fileCode))
        );
        
        if (gridFSFile == null) {
            throw new RuntimeException("File content not found");
        }
        
        // Update access statistics
        updateFileStats(file);
        
        return gridFsTemplate.getResource(gridFSFile);
    }
    
    public List<UploadedFile> getUserFiles(String userId) {
        return uploadedFileRepository.findByUserIdAndIsActiveTrue(userId);
    }
    
    public UploadedFile updateFile(String fileCode, String userId, UploadedFile updates) {
        Optional<UploadedFile> existingOpt = uploadedFileRepository.findByFileCode(fileCode);
        
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("File not found");
        }
        
        UploadedFile existing = existingOpt.get();
        
        // Check ownership
        if (!existing.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to update this file");
        }
        
        // Update fields
        if (updates.getTitle() != null) existing.setTitle(updates.getTitle());
        if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
        if (updates.getPassword() != null) {
            existing.setPassword(updates.getPassword());
            existing.setRequiresPassword(!updates.getPassword().trim().isEmpty());
        }
        if (updates.getExpiresAt() != null) existing.setExpiresAt(updates.getExpiresAt());
        if (updates.getTags() != null) existing.setTags(updates.getTags());
        if (updates.getCategory() != null) existing.setCategory(updates.getCategory());
        
        existing.setUpdatedAt(LocalDateTime.now());
        
        return uploadedFileRepository.save(existing);
    }
    
    public void deleteFile(String fileCode, String userId) {
        Optional<UploadedFile> existingOpt = uploadedFileRepository.findByFileCode(fileCode);
        
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("File not found");
        }
        
        UploadedFile existing = existingOpt.get();
        
        // Check ownership
        if (!existing.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this file");
        }
        
        // Delete from GridFS
        gridFsTemplate.delete(new Query(Criteria.where("filename").is(fileCode)));
        
        // Soft delete from database
        existing.setActive(false);
        existing.setStatus("DELETED");
        existing.setUpdatedAt(LocalDateTime.now());
        uploadedFileRepository.save(existing);
    }
    
    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }
        
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("File size exceeds maximum limit of 50MB");
        }
        
        String contentType = file.getContentType();
        if (contentType == null) {
            throw new RuntimeException("Unable to determine file type");
        }
        
        boolean isAllowed = false;
        for (String allowedType : ALLOWED_TYPES) {
            if (contentType.equals(allowedType)) {
                isAllowed = true;
                break;
            }
        }
        
        if (!isAllowed) {
            throw new RuntimeException("File type not allowed: " + contentType);
        }
    }
    
    private void updateUserStats(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setTotalFiles(user.getTotalFiles() + 1);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        }
    }
    
    private void updateFileStats(UploadedFile file) {
        file.setTotalDownloads(file.getTotalDownloads() + 1);
        file.setLastAccessedAt(LocalDateTime.now());
        uploadedFileRepository.save(file);
    }
}