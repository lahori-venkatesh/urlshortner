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
    
    @GetMapping("/debug/{shortCode}")
    public ResponseEntity<String> debugUrl(@PathVariable String shortCode, HttpServletRequest request) {
        try {
            String hostDomain = getOriginalHostDomain(request);
            
            StringBuilder debug = new StringBuilder();
            debug.append("🔍 DEBUG INFO:\n");
            debug.append("ShortCode: ").append(shortCode).append("\n");
            debug.append("HostDomain: ").append(hostDomain).append("\n");
            debug.append("ServerName: ").append(request.getServerName()).append("\n");
            
            // Try all lookup methods
            Optional<ShortenedUrl> urlOpt1 = urlShorteningService.getByShortCodeAndDomain(shortCode, hostDomain);
            debug.append("Lookup 1 (shortCode + domain): ").append(urlOpt1.isPresent() ? "FOUND" : "NOT FOUND").append("\n");
            
            Optional<ShortenedUrl> urlOpt2 = urlShorteningService.getByShortCode(shortCode);
            debug.append("Lookup 2 (shortCode only): ").append(urlOpt2.isPresent() ? "FOUND" : "NOT FOUND").append("\n");
            
            Optional<ShortenedUrl> urlOpt3 = urlShorteningService.findByShortCodeIgnoreDomain(shortCode);
            debug.append("Lookup 3 (ignore domain): ").append(urlOpt3.isPresent() ? "FOUND" : "NOT FOUND").append("\n");
            
            if (urlOpt3.isPresent()) {
                ShortenedUrl url = urlOpt3.get();
                debug.append("Found URL:\n");
                debug.append("  Original: ").append(url.getOriginalUrl()).append("\n");
                debug.append("  Domain: ").append(url.getDomain()).append("\n");
                debug.append("  ShortUrl: ").append(url.getShortUrl()).append("\n");
            }
            
            return ResponseEntity.ok(debug.toString());
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{shortCode}")
    public RedirectView redirect(@PathVariable String shortCode, HttpServletRequest request) {
        try {
            // Get the host domain from the request - check proxy headers first
            String hostDomain = getOriginalHostDomain(request);
            
            System.out.println("🔍 Redirect Request - ShortCode: " + shortCode + ", HostDomain: " + hostDomain);
            
            // Enhanced URL lookup with multiple fallback strategies
            Optional<ShortenedUrl> urlOpt = Optional.empty();
            
            try {
                // Strategy 1: Find by shortCode and exact domain match
                urlOpt = urlShorteningService.getByShortCodeAndDomain(shortCode, hostDomain);
                if (urlOpt.isPresent()) {
                    System.out.println("✅ Found URL with exact domain match: " + hostDomain);
                }
            } catch (Exception e) {
                System.err.println("⚠️ Domain lookup failed, trying fallbacks: " + e.getMessage());
            }
            
            // Strategy 2: For default domain, try with null domain (legacy URLs)
            if (urlOpt.isEmpty() && "pebly.vercel.app".equals(hostDomain)) {
                try {
                    urlOpt = urlShorteningService.getByShortCodeAndDomain(shortCode, null);
                    if (urlOpt.isPresent()) {
                        System.out.println("✅ Found URL with null domain (legacy default domain URL)");
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ Null domain lookup failed: " + e.getMessage());
                }
            }
            
            // Strategy 3: Try shortCode only (most permissive fallback)
            if (urlOpt.isEmpty()) {
                try {
                    urlOpt = urlShorteningService.getByShortCode(shortCode);
                    if (urlOpt.isPresent()) {
                        System.out.println("✅ Found URL with shortCode-only lookup");
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ ShortCode-only lookup failed: " + e.getMessage());
                }
            }
            
            // Strategy 4: Final fallback using ignore domain method
            if (urlOpt.isEmpty()) {
                try {
                    System.out.println("🔍 Trying final fallback search for shortCode: " + shortCode);
                    urlOpt = urlShorteningService.findByShortCodeIgnoreDomain(shortCode);
                    if (urlOpt.isPresent()) {
                        System.out.println("✅ Found URL with fallback search: " + urlOpt.get().getOriginalUrl());
                    }
                } catch (Exception e) {
                    System.err.println("⚠️ Final fallback failed: " + e.getMessage());
                }
            }
            
            if (urlOpt.isEmpty()) {
                System.out.println("❌ URL not found for shortCode: " + shortCode);
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
    
    /**
     * Get the original host domain, checking proxy headers first for custom domains
     */
    private String getOriginalHostDomain(HttpServletRequest request) {
        // For custom domains coming through Cloudflare Worker proxy
        String xForwardedHost = request.getHeader("X-Forwarded-Host");
        if (xForwardedHost != null && !xForwardedHost.isEmpty() && 
            !xForwardedHost.contains("onrender.com") &&
            !xForwardedHost.contains("pebly.vercel.app")) { // Don't treat default domain as custom
            System.out.println("🌐 Custom Domain via X-Forwarded-Host: " + xForwardedHost);
            return xForwardedHost;
        }
        
        String xOriginalHost = request.getHeader("X-Original-Host");
        if (xOriginalHost != null && !xOriginalHost.isEmpty() && 
            !xOriginalHost.contains("onrender.com") &&
            !xOriginalHost.contains("pebly.vercel.app")) { // Don't treat default domain as custom
            System.out.println("🌐 Custom Domain via X-Original-Host: " + xOriginalHost);
            return xOriginalHost;
        }
        
        // For default domain requests (either direct backend access or via Vercel)
        String serverName = request.getServerName();
        System.out.println("🌐 Server Name: " + serverName);
        
        // Normalize default domain requests to use the frontend domain
        if (serverName.contains("onrender.com") || serverName.contains("pebly.vercel.app")) {
            System.out.println("🌐 Normalized to Default Domain: pebly.vercel.app");
            return "pebly.vercel.app";
        }
        
        return serverName;
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