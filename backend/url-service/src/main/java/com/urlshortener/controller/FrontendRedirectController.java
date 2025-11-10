package com.urlshortener.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.servlet.view.RedirectView;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;

/**
 * Controller to redirect all non-API frontend routes to the actual frontend URL
 * This prevents users from seeing the backend URL when they refresh the page
 */
@Controller
public class FrontendRedirectController {
    
    private static final String FRONTEND_URL = "https://pebly.vercel.app";
    
    /**
     * Redirect /dashboard and all its sub-routes to frontend
     */
    @GetMapping({
        "/dashboard",
        "/dashboard/**",
        "/pricing",
        "/profile",
        "/account-settings",
        "/qr-generator",
        "/domains",
        "/analytics/**",
        "/redirect/**",
        "/invite/**",
        "/contact",
        "/about",
        "/shipping-policy",
        "/terms",
        "/cancellation-refund",
        "/privacy"
    })
    public RedirectView redirectToFrontend(HttpServletRequest request) {
        String requestUri = request.getRequestURI();
        String queryString = request.getQueryString();
        
        // Build the full frontend URL with path and query params
        String frontendUrl = FRONTEND_URL + requestUri;
        if (queryString != null && !queryString.isEmpty()) {
            frontendUrl += "?" + queryString;
        }
        
        System.out.println("🔄 Redirecting backend URL to frontend: " + requestUri + " → " + frontendUrl);
        
        RedirectView redirectView = new RedirectView();
        redirectView.setUrl(frontendUrl);
        redirectView.setStatusCode(HttpStatus.MOVED_PERMANENTLY); // 301 redirect
        return redirectView;
    }
}
