package com.urlshortener.service;

import com.urlshortener.model.Domain;
import com.urlshortener.model.User;
import com.urlshortener.model.Team;
import com.urlshortener.repository.DomainRepository;
import com.urlshortener.repository.UserRepository;
import com.urlshortener.repository.TeamRepository;
import com.urlshortener.dto.DomainRequest;
import com.urlshortener.dto.DomainResponse;
import com.urlshortener.dto.DomainTransferRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class DomainService {
    
    private static final Logger logger = LoggerFactory.getLogger(DomainService.class);
    private static final String DOMAIN_BLACKLIST_KEY = "domain:blacklist:";
    private static final String DOMAIN_RATE_LIMIT_KEY = "domain:rate:";
    private static final String VERIFICATION_RATE_LIMIT_KEY = "verify:rate:";
    
    @Autowired
    private DomainRepository domainRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TeamRepository teamRepository;
    
    @Autowired(required = false)
    private RedisTemplate<String, Object> redisTemplate;
    
    @Autowired(required = false)
    private EmailService emailService;
    
    private final SecureRandom secureRandom = new SecureRandom();
    
    /**
     * Reserve a domain with rate limiting and quota enforcement
     */
    @Transactional
    public DomainResponse reserveDomain(DomainRequest request, String currentUserId) {
        // Validate rate limits
        validateRateLimit(currentUserId, "domain_add", 20, 24 * 60 * 60); // 20/day
        
        // Validate domain quota based on subscription
        validateDomainQuota(request.getOwnerId(), request.getOwnerType());
        
        // Check if domain is blacklisted
        validateDomainSafety(request.getDomainName());
        
        // Check for existing domain
        if (domainRepository.existsByDomainName(request.getDomainName())) {
            throw new IllegalArgumentException("Domain already exists or is reserved by another user");
        }
        
        // Generate unique verification token
        String verificationToken = generateVerificationToken();
        
        // Create domain reservation
        Domain domain = new Domain(
            request.getDomainName(),
            request.getOwnerType(),
            request.getOwnerId(),
            verificationToken
        );
        
        domain = domainRepository.save(domain);
        
        logger.info("Domain reserved: {} for owner: {}/{}", 
            request.getDomainName(), request.getOwnerType(), request.getOwnerId());
        
        return DomainResponse.forPublicApi(domain);
    }
    
    /**
     * Trigger domain verification (async)
     */
    public DomainResponse verifyDomain(String domainId, String currentUserId) {
        Domain domain = domainRepository.findById(domainId)
            .orElseThrow(() -> new IllegalArgumentException("Domain not found"));
        
        // Validate ownership
        validateDomainOwnership(domain, currentUserId);
        
        // Check verification rate limit
        validateRateLimit(domain.getDomainName(), "verification", 5, 60 * 60); // 5/hour
        
        // Check if reservation expired
        if (domain.isReservationExpired() && !"VERIFIED".equals(domain.getStatus())) {
            throw new IllegalArgumentException("Domain reservation has expired");
        }
        
        // Increment attempts
        domain.incrementVerificationAttempts();
        
        // Perform DNS verification
        boolean isVerified = performDnsVerification(domain);
        
        if (isVerified) {
            domain.markAsVerified();
            // Trigger SSL provisioning asynchronously
            provisionSslAsync(domain);
        } else {
            domain.setStatus("PENDING");
            domain.setVerificationError("DNS CNAME record not found or incorrect");
        }
        
        domain = domainRepository.save(domain);
        
        // Clear cache
        clearDomainCache(domain.getOwnerId(), domain.getOwnerType());
        
        return DomainResponse.forPublicApi(domain);
    }
    
    /**
     * Get domains for user or team (cached)
     */
    @Cacheable(value = "domains_list", key = "#ownerId + ':' + #ownerType")
    public List<DomainResponse> getDomainsByOwner(String ownerId, String ownerType) {
        List<Domain> domains = domainRepository.findByOwnerIdAndOwnerType(ownerId, ownerType);
        return domains.stream()
            .map(DomainResponse::forPublicApi)
            .collect(Collectors.toList());
    }
    
    /**
     * Get verified domains only (for link creation dropdown)
     */
    @Cacheable(value = "verified_domains", key = "#ownerId + ':' + #ownerType")
    public List<DomainResponse> getVerifiedDomains(String ownerId, String ownerType) {
        List<Domain> domains = domainRepository.findVerifiedDomainsByOwner(ownerId, ownerType);
        return domains.stream()
            .map(DomainResponse::forPublicApi)
            .collect(Collectors.toList());
    }
    
    /**
     * Transfer domain ownership (with email confirmation)
     */
    @Transactional
    public DomainResponse transferDomain(DomainTransferRequest request, String currentUserId) {
        Domain domain = domainRepository.findById(request.getDomainId())
            .orElseThrow(() -> new IllegalArgumentException("Domain not found"));
        
        // Validate current ownership
        validateDomainOwnership(domain, currentUserId);
        
        // Validate target owner exists and has quota
        validateDomainQuota(request.getTargetOwnerId(), request.getTargetOwnerType());
        
        // Add to ownership history
        domain.addOwnershipHistory(
            domain.getOwnerType(), 
            domain.getOwnerId(), 
            request.getReason()
        );
        
        // Update ownership
        domain.setOwnerType(request.getTargetOwnerType());
        domain.setOwnerId(request.getTargetOwnerId());
        domain.setUpdatedAt(LocalDateTime.now());
        
        domain = domainRepository.save(domain);
        
        // Clear caches for both old and new owners
        clearDomainCache(domain.getOwnerId(), domain.getOwnerType());
        clearDomainCache(request.getTargetOwnerId(), request.getTargetOwnerType());
        
        // Send confirmation email
        sendTransferConfirmationEmail(domain, request.getReason());
        
        logger.info("Domain transferred: {} from {}/{} to {}/{}", 
            domain.getDomainName(), 
            domain.getOwnerType(), domain.getOwnerId(),
            request.getTargetOwnerType(), request.getTargetOwnerId());
        
        return DomainResponse.forPublicApi(domain);
    }
    
    /**
     * Get domain status (for polling)
     */
    public DomainResponse getDomainStatus(String domainId, String currentUserId) {
        Domain domain = domainRepository.findById(domainId)
            .orElseThrow(() -> new IllegalArgumentException("Domain not found"));
        
        validateDomainOwnership(domain, currentUserId);
        
        return DomainResponse.forPublicApi(domain);
    }
    
    /**
     * Find domains available for team migration
     */
    public List<DomainResponse> getUserDomainsForMigration(String userId) {
        List<Domain> domains = domainRepository.findUserDomainsForMigration(userId);
        return domains.stream()
            .map(DomainResponse::forPublicApi)
            .collect(Collectors.toList());
    }
    
    // Private helper methods
    
    private void validateRateLimit(String key, String action, int limit, int windowSeconds) {
        // Skip rate limiting if Redis is not available
        if (redisTemplate == null) {
            logger.warn("Redis not available, skipping rate limit check for {}", action);
            return;
        }
        
        String rateLimitKey = DOMAIN_RATE_LIMIT_KEY + action + ":" + key;
        String currentCount = (String) redisTemplate.opsForValue().get(rateLimitKey);
        
        if (currentCount != null && Integer.parseInt(currentCount) >= limit) {
            throw new IllegalArgumentException("Rate limit exceeded for " + action + ". Try again later.");
        }
        
        redisTemplate.opsForValue().increment(rateLimitKey);
        redisTemplate.expire(rateLimitKey, windowSeconds, TimeUnit.SECONDS);
    }
    
    private void validateDomainQuota(String ownerId, String ownerType) {
        long currentCount = domainRepository.countVerifiedDomainsByOwner(ownerId, ownerType);
        int maxDomains = getMaxDomainsForOwner(ownerId, ownerType);
        
        if (currentCount >= maxDomains) {
            throw new IllegalArgumentException("Domain quota exceeded. Upgrade your plan for more domains.");
        }
    }
    
    private int getMaxDomainsForOwner(String ownerId, String ownerType) {
        if ("USER".equals(ownerType)) {
            User user = userRepository.findById(ownerId).orElse(null);
            if (user == null) return 0;
            
            return switch (user.getSubscriptionPlan()) {
                case "PRO_MONTHLY", "PRO_YEARLY" -> 1;
                case "BUSINESS_MONTHLY", "BUSINESS_YEARLY" -> 3;
                default -> 0;
            };
        } else if ("TEAM".equals(ownerType)) {
            Team team = teamRepository.findById(ownerId).orElse(null);
            if (team == null) return 0;
            
            return switch (team.getSubscriptionPlan()) {
                case "BUSINESS_MONTHLY", "BUSINESS_YEARLY" -> 3;
                default -> 0;
            };
        }
        
        return 0;
    }
    
    private void validateDomainSafety(String domainName) {
        // Check Redis blacklist cache first (if available)
        if (redisTemplate != null) {
            String blacklistKey = DOMAIN_BLACKLIST_KEY + domainName;
            Boolean isBlacklisted = (Boolean) redisTemplate.opsForValue().get(blacklistKey);
            
            if (Boolean.TRUE.equals(isBlacklisted)) {
                throw new IllegalArgumentException("Domain is blacklisted for security reasons");
            }
        }
        
        // Basic domain validation
        if (domainName.contains("localhost") || 
            domainName.contains("127.0.0.1") || 
            domainName.contains("0.0.0.0")) {
            throw new IllegalArgumentException("Invalid domain name");
        }
    }
    
    private void validateDomainOwnership(Domain domain, String currentUserId) {
        if ("USER".equals(domain.getOwnerType())) {
            if (!domain.getOwnerId().equals(currentUserId)) {
                throw new IllegalArgumentException("Access denied: not domain owner");
            }
        } else if ("TEAM".equals(domain.getOwnerType())) {
            Team team = teamRepository.findById(domain.getOwnerId()).orElse(null);
            if (team == null || !team.isMember(currentUserId)) {
                throw new IllegalArgumentException("Access denied: not team member");
            }
        }
    }
    
    private String generateVerificationToken() {
        StringBuilder token = new StringBuilder();
        String chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        
        for (int i = 0; i < 12; i++) {
            token.append(chars.charAt(secureRandom.nextInt(chars.length())));
        }
        
        return token.toString();
    }
    
    private boolean performDnsVerification(Domain domain) {
        try {
            InetAddress[] addresses = InetAddress.getAllByName(domain.getCnameTarget());
            
            // Check if CNAME points to our verification subdomain
            for (InetAddress addr : addresses) {
                if (addr.getHostName().contains("pebly.vercel.app")) {
                    return true;
                }
            }
            
            // Alternative: check CNAME directly
            InetAddress[] cnameAddresses = InetAddress.getAllByName(domain.getDomainName());
            for (InetAddress addr : cnameAddresses) {
                if (addr.getCanonicalHostName().equals(domain.getCnameTarget())) {
                    return true;
                }
            }
            
        } catch (UnknownHostException e) {
            logger.warn("DNS verification failed for domain: {} - {}", domain.getDomainName(), e.getMessage());
            domain.setVerificationError("DNS lookup failed: " + e.getMessage());
        }
        
        return false;
    }
    
    private void provisionSslAsync(Domain domain) {
        // This would integrate with Cloudflare API or Let's Encrypt
        // For now, simulate SSL provisioning
        try {
            Thread.sleep(1000); // Simulate API call
            domain.markSslActive("CLOUDFLARE");
            domainRepository.save(domain);
            
            logger.info("SSL provisioned for domain: {}", domain.getDomainName());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            logger.error("SSL provisioning interrupted for domain: {}", domain.getDomainName());
        }
    }
    
    @CacheEvict(value = {"domains_list", "verified_domains"}, key = "#ownerId + ':' + #ownerType")
    private void clearDomainCache(String ownerId, String ownerType) {
        // Cache eviction handled by annotation
    }
    
    private void sendTransferConfirmationEmail(Domain domain, String reason) {
        try {
            if (emailService == null) {
                logger.warn("EmailService not available, skipping transfer confirmation email for domain: {}", domain.getDomainName());
                return;
            }
            
            // Get owner details for email
            if ("USER".equals(domain.getOwnerType())) {
                User user = userRepository.findById(domain.getOwnerId()).orElse(null);
                if (user != null) {
                    emailService.sendDomainTransferNotification(user.getEmail(), domain.getDomainName(), reason);
                }
            }
        } catch (Exception e) {
            logger.error("Failed to send transfer confirmation email for domain: {}", domain.getDomainName(), e);
        }
    }
}