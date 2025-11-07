package com.urlshortener.service;

import com.urlshortener.model.QrCode;
import com.urlshortener.model.User;
import com.urlshortener.repository.QrCodeRepository;
import com.urlshortener.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import javax.imageio.ImageIO;
import java.util.Base64;

@Service
public class QrCodeService {
    
    private static final Logger logger = LoggerFactory.getLogger(QrCodeService.class);
    
    @Autowired
    private QrCodeRepository qrCodeRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CacheService cacheService;
    
    @Value("${app.shorturl.domain:https://pebly.vercel.app}")
    private String shortUrlDomain;
    
    public QrCode createQrCode(String content, String contentType, String userId, 
                              String title, String description, String style,
                              String foregroundColor, String backgroundColor, 
                              int size, String format) {
        return createQrCode(content, contentType, userId, title, description, style, 
                           foregroundColor, backgroundColor, size, format, "USER", userId);
    }
    
    public QrCode createQrCode(String content, String contentType, String userId, 
                              String title, String description, String style,
                              String foregroundColor, String backgroundColor, 
                              int size, String format, String scopeType, String scopeId) {
        
        // Validate content
        if (content == null || content.trim().isEmpty()) {
            throw new RuntimeException("Content cannot be empty");
        }
        
        // Create QR code
        QrCode qrCode = new QrCode(content, contentType, userId, scopeType, scopeId);
        
        // Set the complete QR image URL with frontend domain
        String fullQrImageUrl = shortUrlDomain + "/qr/" + qrCode.getQrCode() + ".png";
        qrCode.setQrImageUrl(fullQrImageUrl);
        
        qrCode.setTitle(title);
        qrCode.setDescription(description);
        qrCode.setStyle(style != null ? style : "STANDARD");
        qrCode.setForegroundColor(foregroundColor != null ? foregroundColor : "#000000");
        qrCode.setBackgroundColor(backgroundColor != null ? backgroundColor : "#FFFFFF");
        qrCode.setSize(size > 0 ? size : 300);
        qrCode.setFormat(format != null ? format : "PNG");
        
        try {
            // Generate QR code image
            byte[] qrImageBytes = generateQrCodeImage(qrCode);
            qrCode.setFileSize(qrImageBytes.length);
            
            // For now, we'll store as base64 in the qrImagePath field
            // In production, you might want to store in GridFS or file system
            String base64Image = Base64.getEncoder().encodeToString(qrImageBytes);
            qrCode.setQrImagePath("data:image/" + format.toLowerCase() + ";base64," + base64Image);
            
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate QR code: " + e.getMessage());
        }
        
        // Save to database
        QrCode saved = qrCodeRepository.save(qrCode);
        
        // Update user statistics
        if (userId != null) {
            updateUserStats(userId);
            // Invalidate user QR codes cache
            cacheService.clearCache("userQRCodes", userId);
        }
        
        logger.info("Created QR code: {} for user: {}", saved.getQrCode(), userId);
        
        return saved;
    }
    
    public Optional<QrCode> getByQrCode(String qrCodeId) {
        return qrCodeRepository.findByQrCode(qrCodeId);
    }
    
    public Optional<QrCode> getById(String id) {
        return qrCodeRepository.findById(id);
    }
    
    @Cacheable(value = "userQRCodes", key = "#userId")
    public List<QrCode> getUserQrCodes(String userId) {
        logger.debug("Fetching QR codes for user: {}", userId);
        return qrCodeRepository.findByUserIdAndIsActiveTrue(userId);
    }
    
    // Get QR codes by scope (user or team)
    public List<QrCode> getQrCodesByScope(String scopeType, String scopeId) {
        logger.debug("Fetching QR codes for scope: {} - {}", scopeType, scopeId);
        return qrCodeRepository.findByScopeTypeAndScopeIdAndIsActiveTrue(scopeType, scopeId);
    }
    
    public QrCode updateQrCode(String qrCodeId, String userId, QrCode updates) {
        // Try to find by QR code first, then by ID
        Optional<QrCode> existingOpt = qrCodeRepository.findByQrCode(qrCodeId);
        if (existingOpt.isEmpty()) {
            existingOpt = qrCodeRepository.findById(qrCodeId);
        }
        
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("QR Code not found");
        }
        
        QrCode existing = existingOpt.get();
        
        // Check ownership
        if (!existing.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to update this QR Code");
        }
        
        // Update fields
        if (updates.getTitle() != null) existing.setTitle(updates.getTitle());
        if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
        if (updates.getContent() != null) existing.setContent(updates.getContent());
        if (updates.getContentType() != null) existing.setContentType(updates.getContentType());
        if (updates.getStyle() != null) existing.setStyle(updates.getStyle());
        if (updates.getForegroundColor() != null) existing.setForegroundColor(updates.getForegroundColor());
        if (updates.getBackgroundColor() != null) existing.setBackgroundColor(updates.getBackgroundColor());
        if (updates.getSize() > 0) existing.setSize(updates.getSize());
        if (updates.getFormat() != null) existing.setFormat(updates.getFormat());
        if (updates.getTags() != null) existing.setTags(updates.getTags());
        if (updates.getCategory() != null) existing.setCategory(updates.getCategory());
        
        existing.setUpdatedAt(LocalDateTime.now());
        
        QrCode updated = qrCodeRepository.save(existing);
        
        // Invalidate relevant caches
        cacheService.clearCache("userQRCodes", userId);
        
        logger.info("Updated QR code: {} for user: {}", qrCodeId, userId);
        
        return updated;
    }
    
    public void deleteQrCode(String qrCodeId, String userId) {
        // Try to find by QR code first, then by ID
        Optional<QrCode> existingOpt = qrCodeRepository.findByQrCode(qrCodeId);
        if (existingOpt.isEmpty()) {
            existingOpt = qrCodeRepository.findById(qrCodeId);
        }
        
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("QR Code not found");
        }
        
        QrCode existing = existingOpt.get();
        
        // Check ownership
        if (!existing.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this QR Code");
        }
        
        // Hard delete - actually remove from database
        qrCodeRepository.delete(existing);
        
        // Invalidate relevant caches
        cacheService.clearCache("userQRCodes", userId);
        
        logger.info("Permanently deleted QR code: {} for user: {}", qrCodeId, userId);
    }
    
    public void recordScan(String qrCodeId, String ipAddress, String userAgent, 
                          String country, String city, String deviceType) {
        Optional<QrCode> qrCodeOpt = qrCodeRepository.findByQrCode(qrCodeId);
        
        if (qrCodeOpt.isPresent()) {
            QrCode qrCode = qrCodeOpt.get();
            
            // Update scan statistics
            qrCode.setTotalScans(qrCode.getTotalScans() + 1);
            qrCode.setLastScannedAt(LocalDateTime.now());
            
            // Update geographic data
            if (country != null) {
                qrCode.getScansByCountry().merge(country, 1, Integer::sum);
            }
            if (city != null) {
                qrCode.getScansByCity().merge(city, 1, Integer::sum);
            }
            
            // Update device data
            if (deviceType != null) {
                qrCode.getScansByDevice().merge(deviceType, 1, Integer::sum);
            }
            
            // Update time-based data
            LocalDateTime now = LocalDateTime.now();
            String hourKey = String.valueOf(now.getHour());
            String dayKey = now.getDayOfWeek().toString();
            
            qrCode.getScansByHour().merge(hourKey, 1, Integer::sum);
            qrCode.getScansByDay().merge(dayKey, 1, Integer::sum);
            
            qrCodeRepository.save(qrCode);
            
            // Invalidate user analytics cache
            cacheService.invalidateUserAnalytics(qrCode.getUserId());
            
            logger.debug("Recorded scan for QR code: {}", qrCodeId);
        }
    }
    
    private byte[] generateQrCodeImage(QrCode qrCode) throws IOException {
        // Simple QR code generation (in production, use a proper QR code library like ZXing)
        int size = qrCode.getSize();
        BufferedImage image = new BufferedImage(size, size, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = image.createGraphics();
        
        // Parse colors
        Color bgColor = parseColor(qrCode.getBackgroundColor());
        Color fgColor = parseColor(qrCode.getForegroundColor());
        
        // Fill background
        g2d.setColor(bgColor);
        g2d.fillRect(0, 0, size, size);
        
        // Draw simple pattern (placeholder - use proper QR code library)
        g2d.setColor(fgColor);
        int cellSize = size / 25; // 25x25 grid
        
        // Draw finder patterns (corners)
        drawFinderPattern(g2d, 0, 0, cellSize);
        drawFinderPattern(g2d, size - 7 * cellSize, 0, cellSize);
        drawFinderPattern(g2d, 0, size - 7 * cellSize, cellSize);
        
        // Draw some data pattern (simplified)
        for (int i = 0; i < 25; i++) {
            for (int j = 0; j < 25; j++) {
                if ((i + j) % 3 == 0 && !isFinderPattern(i, j)) {
                    g2d.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
                }
            }
        }
        
        g2d.dispose();
        
        // Convert to byte array
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(image, qrCode.getFormat().toLowerCase(), baos);
        return baos.toByteArray();
    }
    
    private void drawFinderPattern(Graphics2D g2d, int x, int y, int cellSize) {
        // Draw 7x7 finder pattern
        g2d.fillRect(x, y, 7 * cellSize, 7 * cellSize);
        g2d.setColor(parseColor("#FFFFFF"));
        g2d.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize);
        g2d.setColor(parseColor("#000000"));
        g2d.fillRect(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize);
    }
    
    private boolean isFinderPattern(int i, int j) {
        return (i < 7 && j < 7) || (i >= 18 && j < 7) || (i < 7 && j >= 18);
    }
    
    private Color parseColor(String colorStr) {
        try {
            if (colorStr.startsWith("#")) {
                return Color.decode(colorStr);
            }
            return Color.BLACK;
        } catch (Exception e) {
            return Color.BLACK;
        }
    }
    
    private void updateUserStats(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setTotalQrCodes(user.getTotalQrCodes() + 1);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        }
    }
}