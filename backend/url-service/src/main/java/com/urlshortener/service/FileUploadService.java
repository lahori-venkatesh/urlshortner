package com.urlshortener.service;

import com.urlshortener.model.UploadedFile;
import com.urlshortener.model.User;
import com.urlshortener.repository.UploadedFileRepository;
import com.urlshortener.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import com.mongodb.client.gridfs.model.GridFSFile;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import java.io.IOException;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;
import java.util.zip.GZIPOutputStream;
import java.util.zip.GZIPInputStream;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;

@Service
public class FileUploadService {
    
    @Autowired
    private UploadedFileRepository uploadedFileRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private GridFsTemplate gridFsTemplate;
    
    @Value("${app.shorturl.domain:https://pebly.vercel.app}")
    private String shortUrlDomain;
    
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
        
        // Set the complete file URL with frontend domain
        String fullFileUrl = shortUrlDomain + "/" + uploadedFile.getFileCode();
        uploadedFile.setFileUrl(fullFileUrl);
        
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
            // Compress file if it's large (> 5MB) to optimize database storage
            byte[] fileData;
            boolean isCompressed = false;
            
            if (file.getSize() > 5 * 1024 * 1024) { // 5MB threshold
                try {
                    byte[] compressedData = compressFile(file);
                    if (compressedData.length < file.getSize()) {
                        fileData = compressedData;
                        isCompressed = true;
                        uploadedFile.setFileSize(compressedData.length); // Update with compressed size
                    } else {
                        fileData = file.getBytes();
                    }
                } catch (Exception e) {
                    // If compression fails, use original file
                    fileData = file.getBytes();
                }
            } else {
                fileData = file.getBytes();
            }
            
            // Store file in GridFS
            org.bson.types.ObjectId fileId = gridFsTemplate.store(
                new ByteArrayInputStream(fileData),
                uploadedFile.getFileCode(),
                file.getContentType()
            );
            
            uploadedFile.setGridFsFileId(fileId.toString());
            uploadedFile.setStoredFileName(uploadedFile.getFileCode());
            
            // Add compression metadata
            if (isCompressed) {
                uploadedFile.setDescription(
                    (uploadedFile.getDescription() != null ? uploadedFile.getDescription() + " " : "") + 
                    "[Compressed for storage optimization]"
                );
            }
            
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
    
    public void recordDownload(String fileCode, String ipAddress, String userAgent, 
                              String country, String city, String deviceType) {
        Optional<UploadedFile> fileOpt = uploadedFileRepository.findByFileCode(fileCode);
        
        if (fileOpt.isPresent()) {
            UploadedFile file = fileOpt.get();
            
            // Update download statistics
            file.setTotalDownloads(file.getTotalDownloads() + 1);
            file.setLastAccessedAt(LocalDateTime.now());
            
            // Update geographic data
            if (country != null) {
                file.getDownloadsByCountry().merge(country, 1, Integer::sum);
            }
            if (city != null) {
                file.getDownloadsByCity().merge(city, 1, Integer::sum);
            }
            
            // Update device data
            if (deviceType != null) {
                file.getDownloadsByDevice().merge(deviceType, 1, Integer::sum);
            }
            
            // Update time-based data
            LocalDateTime now = LocalDateTime.now();
            String hourKey = String.valueOf(now.getHour());
            String dayKey = now.getDayOfWeek().toString();
            
            file.getDownloadsByHour().merge(hourKey, 1, Integer::sum);
            file.getDownloadsByDay().merge(dayKey, 1, Integer::sum);
            
            uploadedFileRepository.save(file);
        }
    }
    
    private byte[] compressFile(MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        
        // Compress images
        if (contentType != null && contentType.startsWith("image/")) {
            return compressImage(file);
        }
        
        // Compress other files using GZIP
        return compressWithGzip(file.getBytes());
    }
    
    private byte[] compressImage(MultipartFile file) throws IOException {
        BufferedImage originalImage = ImageIO.read(file.getInputStream());
        
        if (originalImage == null) {
            // If we can't read as image, fall back to GZIP compression
            return compressWithGzip(file.getBytes());
        }
        
        // Calculate new dimensions (max 1920x1080 for large images)
        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();
        int maxWidth = 1920;
        int maxHeight = 1080;
        
        int newWidth = originalWidth;
        int newHeight = originalHeight;
        
        // Only compress if image is larger than max dimensions
        if (originalWidth > maxWidth || originalHeight > maxHeight) {
            double widthRatio = (double) maxWidth / originalWidth;
            double heightRatio = (double) maxHeight / originalHeight;
            double ratio = Math.min(widthRatio, heightRatio);
            
            newWidth = (int) (originalWidth * ratio);
            newHeight = (int) (originalHeight * ratio);
        }
        
        // Create compressed image
        BufferedImage compressedImage = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = compressedImage.createGraphics();
        
        // Set high quality rendering hints
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        
        g2d.drawImage(originalImage, 0, 0, newWidth, newHeight, null);
        g2d.dispose();
        
        // Convert to byte array
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        String formatName = getImageFormat(file.getContentType());
        ImageIO.write(compressedImage, formatName, baos);
        
        byte[] compressedBytes = baos.toByteArray();
        
        // Only return compressed version if it's actually smaller
        return compressedBytes.length < file.getSize() ? compressedBytes : file.getBytes();
    }
    
    private byte[] compressWithGzip(byte[] data) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (GZIPOutputStream gzipOut = new GZIPOutputStream(baos)) {
            gzipOut.write(data);
        }
        
        byte[] compressedData = baos.toByteArray();
        
        // Only return compressed version if it's actually smaller (some files don't compress well)
        return compressedData.length < data.length ? compressedData : data;
    }
    
    private String getImageFormat(String contentType) {
        if (contentType == null) return "jpg";
        
        switch (contentType.toLowerCase()) {
            case "image/png":
                return "png";
            case "image/gif":
                return "gif";
            case "image/webp":
                return "webp";
            default:
                return "jpg";
        }
    }
}