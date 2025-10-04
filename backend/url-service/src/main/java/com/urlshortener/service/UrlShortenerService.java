package com.urlshortener.service;

import com.urlshortener.dto.ShortenUrlRequest;
import com.urlshortener.dto.ShortenUrlResponse;
import com.urlshortener.model.UrlMapping;
import com.urlshortener.repository.UrlMappingRepository;
import com.urlshortener.util.Base62Encoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@Transactional
public class UrlShortenerService {
    
    @Autowired
    private UrlMappingRepository urlMappingRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private Base62Encoder base62Encoder;
    
    private static final String BASE_URL = "http://localhost:8081/";
    
    public ShortenUrlResponse shortenUrl(ShortenUrlRequest request) {
        String shortCode = generateShortCode(request.getCustomAlias());
        
        UrlMapping urlMapping = new UrlMapping(shortCode, request.getOriginalUrl());
        
        // Set optional fields
        if (request.getCustomAlias() != null && !request.getCustomAlias().isEmpty()) {
            urlMapping.setCustomAlias(request.getCustomAlias());
        }
        
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            urlMapping.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        }
        
        if (request.getExpirationDays() != null && request.getExpirationDays() > 0) {
            urlMapping.setExpirationDate(LocalDateTime.now().plusDays(request.getExpirationDays()));
        }
        
        if (request.getMaxClicks() != null && request.getMaxClicks() > 0) {
            urlMapping.setMaxClicks(request.getMaxClicks());
        }
        
        if (request.getIsOneTime() != null && request.getIsOneTime()) {
            urlMapping.setIsOneTime(true);
            urlMapping.setMaxClicks(1);
        }
        
        urlMapping = urlMappingRepository.save(urlMapping);
        
        return new ShortenUrlResponse(
            BASE_URL + shortCode,
            shortCode,
            urlMapping.getOriginalUrl(),
            urlMapping.getCreatedAt()
        );
    }
    
    public Optional<UrlMapping> getUrlMapping(String shortCode) {
        return urlMappingRepository.findByShortCodeAndIsActiveTrue(shortCode);
    }
    
    @Transactional
    public String redirect(String shortCode, String password) {
        Optional<UrlMapping> optionalMapping = getUrlMapping(shortCode);
        
        if (optionalMapping.isEmpty()) {
            throw new RuntimeException("Short URL not found");
        }
        
        UrlMapping mapping = optionalMapping.get();
        
        // Check if URL is expired
        if (mapping.isExpired()) {
            throw new RuntimeException("Short URL has expired");
        }
        
        // Check if max clicks reached
        if (mapping.hasReachedMaxClicks()) {
            throw new RuntimeException("Short URL has reached maximum clicks");
        }
        
        // Check password if required
        if (mapping.getPasswordHash() != null) {
            if (password == null || !passwordEncoder.matches(password, mapping.getPasswordHash())) {
                throw new RuntimeException("Password required or incorrect");
            }
        }
        
        // Increment click count
        mapping.incrementClickCount();
        
        // Deactivate if one-time use
        if (mapping.getIsOneTime()) {
            mapping.setIsActive(false);
        }
        
        urlMappingRepository.save(mapping);
        
        return mapping.getOriginalUrl();
    }
    
    private String generateShortCode(String customAlias) {
        if (customAlias != null && !customAlias.isEmpty()) {
            // Check if custom alias is available
            if (urlMappingRepository.existsByShortCode(customAlias)) {
                throw new RuntimeException("Custom alias already exists");
            }
            return customAlias;
        }
        
        // Generate unique short code using Base62 encoding
        String shortCode;
        do {
            long timestamp = System.currentTimeMillis();
            shortCode = base62Encoder.encode(timestamp);
        } while (urlMappingRepository.existsByShortCode(shortCode));
        
        return shortCode;
    }
}