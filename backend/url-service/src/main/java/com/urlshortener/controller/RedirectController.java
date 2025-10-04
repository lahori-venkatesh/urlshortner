package com.urlshortener.controller;

import com.urlshortener.service.AnalyticsService;
import com.urlshortener.service.UrlShortenerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@CrossOrigin(origins = "*")
public class RedirectController {
    
    @Autowired
    private UrlShortenerService urlShortenerService;
    
    @Autowired
    private AnalyticsService analyticsService;
    
    @GetMapping("/{shortCode}")
    public ResponseEntity<Void> redirect(
            @PathVariable String shortCode,
            @RequestParam(required = false) String password,
            HttpServletRequest request) {
        try {
            String originalUrl = urlShortenerService.redirect(shortCode, password);
            
            // Record analytics asynchronously (non-blocking)
            analyticsService.recordClick(shortCode, request);
            analyticsService.updateClickCount(shortCode);
            
            return ResponseEntity.status(302)
                    .header("Location", originalUrl)
                    .header("Cache-Control", "no-cache, no-store, must-revalidate")
                    .build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}