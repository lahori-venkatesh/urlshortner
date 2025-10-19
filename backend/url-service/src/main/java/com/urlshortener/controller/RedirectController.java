package com.urlshortener.controller;

import com.urlshortener.model.ShortenedUrl;
import com.urlshortener.service.UrlShorteningService;
import com.urlshortener.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.view.RedirectView;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
public class RedirectController {
    
    @Autowired
    private UrlShorteningService urlShorteningService;
    
    @Autowired(required = false)
    private AnalyticsService analyticsService;
    
    @GetMapping("/{shortCode}")
    public RedirectView redirect(@PathVariable String shortCode, HttpServletRequest request) {
        try {
            Optional<ShortenedUrl> urlOpt = urlShorteningService.getByShortCode(shortCode);
            
            if (urlOpt.isEmpty()) {
                // Redirect to a 404 page or error page
                RedirectView redirectView = new RedirectView();
                redirectView.setUrl("https://pebly.vercel.app/404?error=url-not-found");
                redirectView.setStatusCode(HttpStatus.NOT_FOUND);
                return redirectView;
            }
            
            ShortenedUrl url = urlOpt.get();
            
            // Record analytics if service is available
            if (analyticsService != null) {
                try {
                    String userAgent = request.getHeader("User-Agent");
                    String referer = request.getHeader("Referer");
                    String clientIp = getClientIpAddress(request);
                    
                    analyticsService.recordClick(shortCode, clientIp, userAgent, referer, 
                                                null, null, null, null, null);
                } catch (Exception e) {
                    // Log error but don't fail the redirect
                    System.err.println("Failed to record analytics: " + e.getMessage());
                }
            }
            
            // Increment click count
            urlShorteningService.incrementClicks(shortCode);
            
            // Perform the redirect
            RedirectView redirectView = new RedirectView();
            redirectView.setUrl(url.getOriginalUrl());
            redirectView.setStatusCode(HttpStatus.MOVED_PERMANENTLY);
            return redirectView;
            
        } catch (Exception e) {
            System.err.println("Redirect error: " + e.getMessage());
            // Redirect to error page
            RedirectView redirectView = new RedirectView();
            redirectView.setUrl("https://pebly.vercel.app/404?error=redirect-failed");
            redirectView.setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR);
            return redirectView;
        }
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}