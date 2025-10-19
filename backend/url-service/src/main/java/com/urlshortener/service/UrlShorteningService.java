package com.urlshortener.service;

import com.urlshortener.model.ShortenedUrl;
import com.urlshortener.model.User;
import com.urlshortener.repository.ShortenedUrlRepository;
import com.urlshortener.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;
import java.util.List;

@Service
public class UrlShorteningService {
    
    @Autowired
    private ShortenedUrlRepository shortenedUrlRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    private static final String CHARACTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int SHORT_CODE_LENGTH = 6;
    
    public ShortenedUrl createShortUrl(String originalUrl, String userId, String customAlias, 
                                     String password, Integer expirationDays, String title, String description) {
        
        // Validate URL
        if (!isValidUrl(originalUrl)) {
            throw new RuntimeException("Invalid URL format");
        }
        
        // Generate or validate short code
        String shortCode;
        if (customAlias != null && !customAlias.trim().isEmpty()) {
            if (shortenedUrlRepository.existsByCustomAlias(customAlias)) {
                throw new RuntimeException("Custom alias already exists");
            }
            shortCode = customAlias;
        } else {
            shortCode = generateUniqueShortCode();
        }
        
        // Create shortened URL
        ShortenedUrl shortenedUrl = new ShortenedUrl(originalUrl, shortCode, userId);
        shortenedUrl.setCustomAlias(customAlias);
        shortenedUrl.setTitle(title);
        shortenedUrl.setDescription(description);
        
        // Set password protection
        if (password != null && !password.trim().isEmpty()) {
            shortenedUrl.setPassword(password);
            shortenedUrl.setPasswordProtected(true);
        }
        
        // Set expiration
        if (expirationDays != null && expirationDays > 0) {
            shortenedUrl.setExpiresAt(LocalDateTime.now().plusDays(expirationDays));
        }
        
        // Extract domain from URL
        try {
            java.net.URL url = new java.net.URL(originalUrl);
            shortenedUrl.setDomain(url.getHost());
        } catch (Exception e) {
            // If URL parsing fails, just store as is
        }
        
        // Save to database
        ShortenedUrl saved = shortenedUrlRepository.save(shortenedUrl);
        
        // Update user statistics
        if (userId != null) {
            updateUserStats(userId);
        }
        
        return saved;
    }
    
    public Optional<ShortenedUrl> getByShortCode(String shortCode) {
        return shortenedUrlRepository.findByShortCode(shortCode);
    }
    
    public List<ShortenedUrl> getUserUrls(String userId) {
        return shortenedUrlRepository.findByUserIdAndIsActiveTrue(userId);
    }
    
    public ShortenedUrl updateUrl(String shortCode, String userId, ShortenedUrl updates) {
        Optional<ShortenedUrl> existingOpt = shortenedUrlRepository.findByShortCode(shortCode);
        
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("URL not found");
        }
        
        ShortenedUrl existing = existingOpt.get();
        
        // Check ownership
        if (!existing.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to update this URL");
        }
        
        // Update fields
        if (updates.getTitle() != null) existing.setTitle(updates.getTitle());
        if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
        if (updates.getPassword() != null) {
            existing.setPassword(updates.getPassword());
            existing.setPasswordProtected(!updates.getPassword().trim().isEmpty());
        }
        if (updates.getExpiresAt() != null) existing.setExpiresAt(updates.getExpiresAt());
        if (updates.getTags() != null) existing.setTags(updates.getTags());
        if (updates.getCategory() != null) existing.setCategory(updates.getCategory());
        if (updates.getNotes() != null) existing.setNotes(updates.getNotes());
        
        existing.setUpdatedAt(LocalDateTime.now());
        
        return shortenedUrlRepository.save(existing);
    }
    
    public void incrementClicks(String shortCode) {
        Optional<ShortenedUrl> urlOpt = shortenedUrlRepository.findByShortCode(shortCode);
        if (urlOpt.isPresent()) {
            ShortenedUrl url = urlOpt.get();
            url.setTotalClicks(url.getTotalClicks() + 1);
            url.setLastAccessedAt(LocalDateTime.now());
            shortenedUrlRepository.save(url);
        }
    }
    
    public void deleteUrl(String shortCode, String userId) {
        Optional<ShortenedUrl> existingOpt = shortenedUrlRepository.findByShortCode(shortCode);
        
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("URL not found");
        }
        
        ShortenedUrl existing = existingOpt.get();
        
        // Check ownership
        if (!existing.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this URL");
        }
        
        // Soft delete
        existing.setActive(false);
        existing.setUpdatedAt(LocalDateTime.now());
        shortenedUrlRepository.save(existing);
    }
    
    private String generateUniqueShortCode() {
        String shortCode;
        do {
            shortCode = generateRandomString(SHORT_CODE_LENGTH);
        } while (shortenedUrlRepository.existsByShortCode(shortCode));
        
        return shortCode;
    }
    
    private String generateRandomString(int length) {
        Random random = new Random();
        StringBuilder sb = new StringBuilder(length);
        
        for (int i = 0; i < length; i++) {
            sb.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
        }
        
        return sb.toString();
    }
    
    private boolean isValidUrl(String url) {
        try {
            new java.net.URL(url);
            return url.startsWith("http://") || url.startsWith("https://");
        } catch (Exception e) {
            return false;
        }
    }
    
    private void updateUserStats(String userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setTotalUrls(user.getTotalUrls() + 1);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        }
    }
}