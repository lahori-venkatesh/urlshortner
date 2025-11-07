package com.urlshortener.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import java.util.Map;
import java.util.HashMap;

@Service
public class CloudflareService {
    
    @Value("${cloudflare.api.token:}")
    private String apiToken;
    
    @Value("${cloudflare.account.id:}")
    private String accountId;
    
    @Value("${cloudflare.worker.name:pebly-proxy}")
    private String workerName;
    
    private static final String CF_API_URL = "https://api.cloudflare.com/client/v4";
    
    private final RestTemplate restTemplate;
    
    public CloudflareService() {
        this.restTemplate = new RestTemplate();
    }
    
    /**
     * Add custom domain to Cloudflare Worker
     */
    public boolean addDomainToWorker(String domain) {
        try {
            if (apiToken == null || apiToken.isEmpty()) {
                System.err.println("Cloudflare API token not configured");
                return false;
            }
            
            String url = CF_API_URL + "/accounts/" + accountId + "/workers/domains";
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + apiToken);
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, String> body = new HashMap<>();
            body.put("hostname", domain);
            body.put("service", workerName);
            body.put("environment", "production");
            
            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);
            
            ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
            
            System.out.println("✅ Domain added to Cloudflare Worker: " + domain);
            System.out.println("Response: " + response.getBody());
            
            return response.getStatusCode() == HttpStatus.OK || 
                   response.getStatusCode() == HttpStatus.CREATED;
                   
        } catch (HttpClientErrorException e) {
            System.err.println("❌ Failed to add domain to Cloudflare: " + e.getMessage());
            System.err.println("Response: " + e.getResponseBodyAsString());
            return false;
        } catch (Exception e) {
            System.err.println("❌ Error adding domain to Cloudflare: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Remove custom domain from Cloudflare Worker
     */
    public boolean removeDomainFromWorker(String domain) {
        try {
            if (apiToken == null || apiToken.isEmpty()) {
                System.err.println("Cloudflare API token not configured");
                return false;
            }
            
            String url = CF_API_URL + "/accounts/" + accountId + "/workers/domains/" + domain;
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + apiToken);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            restTemplate.exchange(url, HttpMethod.DELETE, request, String.class);
            
            System.out.println("✅ Domain removed from Cloudflare Worker: " + domain);
            return true;
            
        } catch (Exception e) {
            System.err.println("❌ Error removing domain from Cloudflare: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Check if domain is configured in Cloudflare Worker
     */
    public boolean isDomainConfigured(String domain) {
        try {
            if (apiToken == null || apiToken.isEmpty()) {
                return false;
            }
            
            String url = CF_API_URL + "/accounts/" + accountId + "/workers/domains";
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + apiToken);
            
            HttpEntity<String> request = new HttpEntity<>(headers);
            
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);
            
            // Check if domain exists in response
            return response.getBody() != null && response.getBody().contains(domain);
            
        } catch (Exception e) {
            System.err.println("❌ Error checking domain in Cloudflare: " + e.getMessage());
            return false;
        }
    }
}
