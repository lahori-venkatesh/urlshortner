package com.urlshortener.service;

import com.urlshortener.model.ShortenedUrl;
import com.urlshortener.model.User;
import com.urlshortener.repository.ShortenedUrlRepository;
import com.urlshortener.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;
import java.util.List;

@Service
public class UrlShorteningService {
    
    private static final Logger logger = LoggerFactory.getLogger(UrlShorteningService.class);
    
    private final ShortenedUrlRepository shortenedUrlRepository;
    private final UserRepository userRepository;
    private final CacheService cacheService;
    private final SubscriptionService subscriptionService;
    
    @Autowired
    public UrlShorteningService(ShortenedUrlRepository shortenedUrlRepository,
                               UserRepository userRepository,
                               CacheService cacheService,
                               SubscriptionService subscriptionService) {
        this.shortenedUrlRepository = shortenedUrlRepository;
        this.userRepository = userRepository;
        this.cacheService = cacheService;
        this.subscriptionService = subscriptionService;
    }
    
    @Value("${app.shorturl.domain:https://pebly.vercel.app}")
    private String shortUrlDomain;
    
    private static final String CHARACTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int SHORT_CODE_LENGTH = 6;
    
    public ShortenedUrl createShortUrl(String originalUrl, String userId, String customAlias, 
                                     String password, Integer expirationDays, Integer maxClicks, String title, String description) {
        return createShortUrl(originalUrl, userId, customAlias, password, expirationDays, maxClicks, title, description, "USER", userId);
    }
    
    public ShortenedUrl createShortUrl(String originalUrl, String userId, String customAlias, 
                                     String password, Integer expirationDays, Integer maxClicks, String title, String description,
                                     String scopeType, String scopeId) {
        return createShortUrl(originalUrl, userId, customAlias, password, expirationDays, maxClicks, title, description, scopeType, scopeId, null);
    }
    
    public ShortenedUrl createShortUrl(String originalUrl, String userId, String customAlias, 
                                     String password, Integer expirationDays, Integer maxClicks, String title, String description,
                                     String scopeType, String scopeId, String customDomain) {
        
        // Validate URL
        if (!isValidUrl(originalUrl)) {
            throw new RuntimeException("Invalid URL format");
        }
        
        // Check subscription limits
        if (!subscriptionService.canCreateUrl(userId)) {
            int remaining = subscriptionService.getRemainingDailyUrls(userId);
            throw new RuntimeException("Daily URL limit reached. You have " + remaining + " URLs remaining today. Upgrade to Premium for unlimited access.");
        }
        
        // Check premium features
        if (customAlias != null && !customAlias.trim().isEmpty() && !subscriptionService.canUseCustomAlias(userId)) {
            throw new RuntimeException("Custom aliases are available with Premium plans only.");
        }
        
        if (password != null && !password.trim().isEmpty() && !subscriptionService.canUsePasswordProtection(userId)) {
            throw new RuntimeException("Password protection is available with Premium plans only.");
        }
        
        if (expirationDays != null && expirationDays > 0 && !subscriptionService.canSetExpiration(userId)) {
            throw new RuntimeException("Link expiration is available with Premium plans only.");
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
        ShortenedUrl shortenedUrl = new ShortenedUrl(originalUrl, shortCode, userId, scopeType, scopeId);
        
        // Set the complete short URL with custom domain or default domain
        String domainToUse = customDomain != null ? customDomain : shortUrlDomain;
        String fullShortUrl = (domainToUse.startsWith("http") ? domainToUse : "https://" + domainToUse) + "/" + shortCode;
        shortenedUrl.setShortUrl(fullShortUrl);
        
        // Store the domain for multi-tenant support
        if (customDomain != null) {
            // For custom domains, store the custom domain
            shortenedUrl.setDomain(customDomain);
        } else {
            // For default domain URLs, store the default domain (not the original URL's domain)
            String defaultDomain = extractDomainFromUrl(shortUrlDomain);
            shortenedUrl.setDomain(defaultDomain);
        }
        
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
        
        // Set max clicks limit
        if (maxClicks != null && maxClicks > 0) {
            shortenedUrl.setMaxClicks(maxClicks);
        }
        
        // Note: Domain is already set above for custom domains
        // Don't overwrite the custom domain with the original URL's domain
        
        // Save to database
        ShortenedUrl saved = shortenedUrlRepository.save(shortenedUrl);
        
        // Update user statistics and usage tracking
        if (userId != null) {
            updateUserStats(userId);
            subscriptionService.incrementUrlUsage(userId);
            // Invalidate user URLs cache
            cacheService.clearCache("userUrls", userId);
        }
        
        logger.info("Created short URL: {} for user: {}", shortCode, userId);
        
        return saved;
    }
    
    public Optional<ShortenedUrl> getByShortCode(String shortCode) {
        return shortenedUrlRepository.findByShortCode(shortCode);
    }
    
    /**
     * Find URL by shortCode and domain for multi-tenant support
     * Enhanced with better error handling and fallback logic
     */
    public Optional<ShortenedUrl> getByShortCodeAndDomain(String shortCode, String domain) {
        try {
            // Try with caching first
            return getByShortCodeAndDomainCached(shortCode, domain);
        } catch (Exception e) {
            logger.warn("Cache lookup failed for shortCode: {} domain: {}, falling back to direct DB query: {}", 
                       shortCode, domain, e.getMessage());
            // Fallback to direct database query without caching
            return getByShortCodeAndDomainDirect(shortCode, domain);
        }
    }
    
    @Cacheable(value = "short_urls", key = "#shortCode + ':' + #domain")
    public Optional<ShortenedUrl> getByShortCodeAndDomainCached(String shortCode, String domain) {
        return getByShortCodeAndDomainDirect(shortCode, domain);
    }
    
    /**
     * Direct database lookup without caching (fallback method)
     */
    public Optional<ShortenedUrl> getByShortCodeAndDomainDirect(String shortCode, String domain) {
        try {
            // First try to find by shortCode and exact domain match
            Optional<ShortenedUrl> urlOpt = shortenedUrlRepository.findByShortCodeAndDomain(shortCode, domain);
            
            // If not found and we have a domain, try some fallback strategies
            if (urlOpt.isEmpty() && domain != null) {
                String defaultDomain = extractDomainFromUrl(shortUrlDomain);
                
                // For default domain requests, also try with null domain (legacy URLs)
                if (domain.equals(defaultDomain)) {
                    urlOpt = shortenedUrlRepository.findByShortCodeAndDomain(shortCode, null);
                }
                
                // If still not found, try shortCode only (most permissive)
                if (urlOpt.isEmpty()) {
                    urlOpt = shortenedUrlRepository.findByShortCode(shortCode);
                }
            }
            
            return urlOpt;
        } catch (Exception e) {
            logger.error("Database lookup failed for shortCode: {} domain: {}", shortCode, domain, e);
            return Optional.empty();
        }
    }
    
    /**
     * Fallback method to find URL by shortCode only, ignoring domain
     * Used for URLs created with incorrect domain values
     */
    public Optional<ShortenedUrl> findByShortCodeIgnoreDomain(String shortCode) {
        return shortenedUrlRepository.findByShortCode(shortCode);
    }
    
    private String extractDomainFromUrl(String url) {
        try {
            java.net.URL parsedUrl = new java.net.URL(url);
            return parsedUrl.getHost();
        } catch (Exception e) {
            return url;
        }
    }
    
    @Cacheable(value = "userUrls", key = "#userId")
    public List<ShortenedUrl> getUserUrls(String userId) {
        logger.debug("Fetching URLs for user: {}", userId);
        return shortenedUrlRepository.findByUserIdAndIsActiveTrue(userId);
    }
    
    // Get URLs by scope (user or team)
    public List<ShortenedUrl> getUrlsByScope(String scopeType, String scopeId) {
        logger.debug("Fetching URLs for scope: {} - {}", scopeType, scopeId);
        return shortenedUrlRepository.findByScopeTypeAndScopeIdAndIsActiveTrue(scopeType, scopeId);
    }
    
    // Get team URLs (for team members)
    public List<ShortenedUrl> getTeamUrls(String teamId) {
        return getUrlsByScope("TEAM", teamId);
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
        
        ShortenedUrl updated = shortenedUrlRepository.save(existing);
        
        // Invalidate relevant caches
        cacheService.clearCache("userUrls", userId);
        cacheService.invalidateUrlAnalytics(shortCode, userId);
        
        logger.info("Updated URL: {} for user: {}", shortCode, userId);
        
        return updated;
    }
    
    @CacheEvict(value = {"clickCounts", "urlAnalytics", "userAnalytics"}, key = "#shortCode")
    public void incrementClicks(String shortCode) {
        Optional<ShortenedUrl> urlOpt = shortenedUrlRepository.findByShortCode(shortCode);
        if (urlOpt.isPresent()) {
            ShortenedUrl url = urlOpt.get();
            url.setTotalClicks(url.getTotalClicks() + 1);
            url.setLastClickedAt(LocalDateTime.now());
            shortenedUrlRepository.save(url);
            
            // Invalidate user analytics cache
            cacheService.invalidateUserAnalytics(url.getUserId());
            
            logger.debug("Incremented clicks for URL: {}", shortCode);
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
        
        // Invalidate relevant caches
        cacheService.clearCache("userUrls", userId);
        cacheService.invalidateUrlAnalytics(shortCode, userId);
        
        logger.info("Deleted URL: {} for user: {}", shortCode, userId);
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