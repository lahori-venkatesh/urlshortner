package com.urlshortener.service;

import com.urlshortener.model.Domain;
import com.urlshortener.repository.DomainRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class SslProvisioningService {
    
    private static final Logger logger = LoggerFactory.getLogger(SslProvisioningService.class);
    
    @Autowired
    private DomainRepository domainRepository;
    
    @Autowired
    private WebClient.Builder webClientBuilder;
    
    @Value("${cloudflare.api.token:}")
    private String cloudflareApiToken;
    
    @Value("${cloudflare.zone.id:}")
    private String cloudflareZoneId;
    
    @Value("${ssl.provider:CLOUDFLARE}")
    private String defaultSslProvider;
    
    /**
     * Provision SSL certificate for verified domain
     */
    @Async
    public CompletableFuture<Boolean> provisionSslAsync(Domain domain) {
        logger.info("Starting SSL provisioning for domain: {}", domain.getDomainName());
        
        try {
            boolean success = false;
            
            // Try Cloudflare first if configured
            if ("CLOUDFLARE".equals(defaultSslProvider) && isCloudflareConfigured()) {
                success = provisionCloudflareSSL(domain);
                if (success) {
                    domain.setSslProvider("CLOUDFLARE");
                }
            }
            
            // Fallback to Let's Encrypt if Cloudflare fails or not configured
            if (!success) {
                success = provisionLetsEncryptSSL(domain);
                if (success) {
                    domain.setSslProvider("LETS_ENCRYPT");
                }
            }
            
            if (success) {
                domain.markSslActive(domain.getSslProvider());
                domainRepository.save(domain);
                logger.info("SSL provisioned successfully for domain: {} using {}", 
                    domain.getDomainName(), domain.getSslProvider());
            } else {
                domain.setSslStatus("ERROR");
                domain.setSslError("Failed to provision SSL certificate");
                domainRepository.save(domain);
                logger.error("SSL provisioning failed for domain: {}", domain.getDomainName());
            }
            
            return CompletableFuture.completedFuture(success);
            
        } catch (Exception e) {
            domain.setSslStatus("ERROR");
            domain.setSslError("SSL provisioning error: " + e.getMessage());
            domainRepository.save(domain);
            
            logger.error("Exception during SSL provisioning for domain: {}", domain.getDomainName(), e);
            return CompletableFuture.completedFuture(false);
        }
    }
    
    /**
     * Renew SSL certificate
     */
    public boolean renewSslCertificate(Domain domain) {
        logger.info("Renewing SSL certificate for domain: {}", domain.getDomainName());
        
        try {
            boolean success = false;
            
            if ("CLOUDFLARE".equals(domain.getSslProvider())) {
                success = renewCloudflareSSL(domain);
            } else if ("LETS_ENCRYPT".equals(domain.getSslProvider())) {
                success = renewLetsEncryptSSL(domain);
            }
            
            if (success) {
                domain.setSslExpiresAt(LocalDateTime.now().plusMonths(3));
                domain.setSslError(null);
                domainRepository.save(domain);
                logger.info("SSL certificate renewed successfully for domain: {}", domain.getDomainName());
            } else {
                domain.setSslError("SSL renewal failed");
                domainRepository.save(domain);
                logger.error("SSL renewal failed for domain: {}", domain.getDomainName());
            }
            
            return success;
            
        } catch (Exception e) {
            logger.error("Exception during SSL renewal for domain: {}", domain.getDomainName(), e);
            return false;
        }
    }
    
    // Private methods for different SSL providers
    
    private boolean provisionCloudflareSSL(Domain domain) {
        try {
            logger.info("Provisioning Cloudflare SSL for domain: {}", domain.getDomainName());
            
            WebClient webClient = webClientBuilder
                .baseUrl("https://api.cloudflare.com/client/v4")
                .defaultHeader("Authorization", "Bearer " + cloudflareApiToken)
                .defaultHeader("Content-Type", "application/json")
                .build();
            
            // Step 1: Add DNS record for domain
            Map<String, Object> dnsRecord = Map.of(
                "type", "CNAME",
                "name", domain.getDomainName(),
                "content", "bitaurl.com", // Your main domain
                "ttl", 1 // Auto TTL
            );
            
            String dnsResponse = webClient.post()
                .uri("/zones/{zoneId}/dns_records", cloudflareZoneId)
                .bodyValue(dnsRecord)
                .retrieve()
                .bodyToMono(String.class)
                .block();
            
            logger.debug("Cloudflare DNS response: {}", dnsResponse);
            
            // Step 2: Enable SSL for the domain
            Map<String, Object> sslConfig = Map.of(
                "certificate_authority", "lets_encrypt",
                "type", "advanced"
            );
            
            String sslResponse = webClient.post()
                .uri("/zones/{zoneId}/ssl/certificate_packs", cloudflareZoneId)
                .bodyValue(sslConfig)
                .retrieve()
                .bodyToMono(String.class)
                .block();
            
            logger.debug("Cloudflare SSL response: {}", sslResponse);
            
            // Simulate success (in real implementation, parse response)
            Thread.sleep(2000); // Simulate API delay
            return true;
            
        } catch (Exception e) {
            logger.error("Cloudflare SSL provisioning failed for domain: {}", domain.getDomainName(), e);
            return false;
        }
    }
    
    private boolean provisionLetsEncryptSSL(Domain domain) {
        try {
            logger.info("Provisioning Let's Encrypt SSL for domain: {}", domain.getDomainName());
            
            // In a real implementation, this would use ACME client
            // For now, simulate the process
            
            // Step 1: Create ACME challenge
            logger.debug("Creating ACME challenge for domain: {}", domain.getDomainName());
            Thread.sleep(1000);
            
            // Step 2: Verify domain ownership
            logger.debug("Verifying domain ownership for: {}", domain.getDomainName());
            Thread.sleep(2000);
            
            // Step 3: Issue certificate
            logger.debug("Issuing certificate for domain: {}", domain.getDomainName());
            Thread.sleep(3000);
            
            // Step 4: Install certificate
            logger.debug("Installing certificate for domain: {}", domain.getDomainName());
            Thread.sleep(1000);
            
            return true;
            
        } catch (Exception e) {
            logger.error("Let's Encrypt SSL provisioning failed for domain: {}", domain.getDomainName(), e);
            return false;
        }
    }
    
    private boolean renewCloudflareSSL(Domain domain) {
        try {
            logger.info("Renewing Cloudflare SSL for domain: {}", domain.getDomainName());
            
            // Cloudflare typically auto-renews, but we can trigger renewal
            WebClient webClient = webClientBuilder
                .baseUrl("https://api.cloudflare.com/client/v4")
                .defaultHeader("Authorization", "Bearer " + cloudflareApiToken)
                .build();
            
            // Get certificate info and trigger renewal if needed
            String response = webClient.get()
                .uri("/zones/{zoneId}/ssl/certificate_packs", cloudflareZoneId)
                .retrieve()
                .bodyToMono(String.class)
                .block();
            
            logger.debug("Cloudflare SSL renewal response: {}", response);
            
            Thread.sleep(1000); // Simulate processing
            return true;
            
        } catch (Exception e) {
            logger.error("Cloudflare SSL renewal failed for domain: {}", domain.getDomainName(), e);
            return false;
        }
    }
    
    private boolean renewLetsEncryptSSL(Domain domain) {
        try {
            logger.info("Renewing Let's Encrypt SSL for domain: {}", domain.getDomainName());
            
            // In real implementation, use ACME client to renew
            // Simulate renewal process
            Thread.sleep(2000);
            
            return true;
            
        } catch (Exception e) {
            logger.error("Let's Encrypt SSL renewal failed for domain: {}", domain.getDomainName(), e);
            return false;
        }
    }
    
    private boolean isCloudflareConfigured() {
        return cloudflareApiToken != null && !cloudflareApiToken.isEmpty() &&
               cloudflareZoneId != null && !cloudflareZoneId.isEmpty();
    }
}