package com.urlshortener.controller;

import com.urlshortener.service.UrlShortenerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "*")
public class RedirectController {
    
    @Autowired
    private UrlShortenerService urlShortenerService;
    
    @GetMapping("/{shortCode}")
    public ResponseEntity<Void> redirect(
            @PathVariable String shortCode,
            @RequestParam(required = false) String password) {
        try {
            String originalUrl = urlShortenerService.redirect(shortCode, password);
            return ResponseEntity.status(302)
                    .header("Location", originalUrl)
                    .build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}