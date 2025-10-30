package com.urlshortener.service;

import com.urlshortener.model.Domain;
import com.urlshortener.repository.DomainRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class DomainVerificationWorker {
    
    private static final Logger logger = LoggerFactory.getLogger(DomainVerificationWorker.class);
    
    @Autowired
    private DomainRepository domainRepository;
    
    @Autowired
    private SslProvisioningService sslProvisioningService;
    
    @Autowired
    private EmailService emailService;
    
    /**
     * Scheduled task to process pending domain verifications
     * Runs every 5 minutes
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    public void processPendingVerifications() {
        logger.info("Starting scheduled domain verification process");
        
        List<Domain> pendingDomains = domainRepository.findDomainsForVerification();
        
        for (Domain domain : pendingDomains) {
            try {
                verifyDomainAsync(domain);
            } catch (Exception e) {
                logger.error("Error processing domain verification for: {}", domain.getDomainName(), e);
            }
        }
        
        logger.info("Completed processing {} pending domain verifications", pendingDomains.size());
    }
    
    /**
     * Scheduled task to clean up expired reservations
     * Runs every hour
     */
    @Scheduled(fixedRate = 3600000) // 1 hour
    public void cleanupExpiredReservations() {
        logger.info("Starting cleanup of expired domain reservations");
        
        List<Domain> expiredDomains = domainRepository.findExpiredReservations(LocalDateTime.now());
        
        for (Domain domain : expiredDomains) {
            try {
                logger.info("Removing expired reservation for domain: {}", domain.getDomainName());
                domainRepository.delete(domain);
            } catch (Exception e) {
                logger.error("Error removing expired reservation for: {}", domain.getDomainName(), e);
            }
        }
        
        logger.info("Cleaned up {} expired domain reservations", expiredDomains.size());
    }
    
    /**
     * Scheduled task to check domains needing reconfirmation
     * Runs daily at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void processReconfirmations() {
        logger.info("Starting annual domain reconfirmation process");
        
        List<Domain> domainsNeedingReconfirmation = domainRepository.findDomainsNeedingReconfirmation(LocalDateTime.now());
        
        for (Domain domain : domainsNeedingReconfirmation) {
            try {
                reconfirmDomainAsync(domain);
            } catch (Exception e) {
                logger.error("Error during reconfirmation for: {}", domain.getDomainName(), e);
            }
        }
        
        logger.info("Processed {} domains for reconfirmation", domainsNeedingReconfirmation.size());
    }
    
    /**
     * Scheduled task to check SSL certificate expiry
     * Runs daily at 3 AM
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void checkSslExpiry() {
        logger.info("Starting SSL certificate expiry check");
        
        LocalDateTime expiryThreshold = LocalDateTime.now().plusDays(30); // 30 days before expiry
        List<Domain> domainsWithExpiringSsl = domainRepository.findDomainsWithExpiringSsl(expiryThreshold);
        
        for (Domain domain : domainsWithExpiringSsl) {
            try {
                renewSslCertificateAsync(domain);
            } catch (Exception e) {
                logger.error("Error renewing SSL for: {}", domain.getDomainName(), e);
            }
        }
        
        logger.info("Processed {} domains for SSL renewal", domainsWithExpiringSsl.size());
    }
    
    /**
     * Async domain verification with exponential backoff
     */
    @Async
    public CompletableFuture<Void> verifyDomainAsync(Domain domain) {
        logger.info("Starting async verification for domain: {}", domain.getDomainName());
        
        try {
            boolean isVerified = performDnsVerification(domain);
            
            if (isVerified) {
                domain.markAsVerified();
                domainRepository.save(domain);
                
                // Trigger SSL provisioning
                sslProvisioningService.provisionSslAsync(domain);
                
                // Send success notification
                sendVerificationSuccessEmail(domain);
                
                logger.info("Domain verified successfully: {}", domain.getDomainName());
            } else {
                // Increment attempts and set next retry
                domain.incrementVerificationAttempts();
                
                if (domain.getVerificationAttempts() >= 5) {
                    // Max attempts reached, schedule for hourly retry for 24 hours
                    domain.setStatus("PENDING");
                    domain.setVerificationError("Max verification attempts reached. Will retry hourly for 24 hours.");
                } else {
                    // Exponential backoff: 1min, 2min, 4min, 8min
                    int delayMinutes = (int) Math.pow(2, domain.getVerificationAttempts() - 1);
                    domain.setLastVerificationAttempt(LocalDateTime.now().plusMinutes(delayMinutes));
                }
                
                domainRepository.save(domain);
                logger.warn("Domain verification failed for: {} (attempt {})", 
                    domain.getDomainName(), domain.getVerificationAttempts());
            }
            
        } catch (Exception e) {
            domain.setVerificationError("Verification error: " + e.getMessage());
            domain.incrementVerificationAttempts();
            domainRepository.save(domain);
            
            logger.error("Exception during domain verification for: {}", domain.getDomainName(), e);
        }
        
        return CompletableFuture.completedFuture(null);
    }
    
    /**
     * Async domain reconfirmation
     */
    @Async
    public CompletableFuture<Void> reconfirmDomainAsync(Domain domain) {
        logger.info("Starting reconfirmation for domain: {}", domain.getDomainName());
        
        try {
            boolean isStillValid = performDnsVerification(domain);
            
            if (isStillValid) {
                domain.setLastReconfirmation(LocalDateTime.now());
                domain.setNextReconfirmationDue(LocalDateTime.now().plusYears(1));
                domainRepository.save(domain);
                
                logger.info("Domain reconfirmed successfully: {}", domain.getDomainName());
            } else {
                domain.setStatus("ERROR");
                domain.setVerificationError("Annual reconfirmation failed - DNS configuration invalid");
                domainRepository.save(domain);
                
                // Send warning email
                sendReconfirmationFailureEmail(domain);
                
                logger.warn("Domain reconfirmation failed: {}", domain.getDomainName());
            }
            
        } catch (Exception e) {
            logger.error("Exception during domain reconfirmation for: {}", domain.getDomainName(), e);
        }
        
        return CompletableFuture.completedFuture(null);
    }
    
    /**
     * Async SSL certificate renewal
     */
    @Async
    public CompletableFuture<Void> renewSslCertificateAsync(Domain domain) {
        logger.info("Starting SSL renewal for domain: {}", domain.getDomainName());
        
        try {
            boolean renewed = sslProvisioningService.renewSslCertificate(domain);
            
            if (renewed) {
                domain.setSslExpiresAt(LocalDateTime.now().plusMonths(3));
                domain.setSslError(null);
                domainRepository.save(domain);
                
                logger.info("SSL certificate renewed successfully for: {}", domain.getDomainName());
            } else {
                domain.setSslError("SSL renewal failed");
                domainRepository.save(domain);
                
                // Send alert email
                sendSslRenewalFailureEmail(domain);
                
                logger.warn("SSL renewal failed for: {}", domain.getDomainName());
            }
            
        } catch (Exception e) {
            logger.error("Exception during SSL renewal for: {}", domain.getDomainName(), e);
        }
        
        return CompletableFuture.completedFuture(null);
    }
    
    // Private helper methods
    
    private boolean performDnsVerification(Domain domain) {
        try {
            // Method 1: Check CNAME record
            InetAddress[] addresses = InetAddress.getAllByName(domain.getDomainName());
            for (InetAddress addr : addresses) {
                String canonicalName = addr.getCanonicalHostName();
                if (canonicalName.equals(domain.getCnameTarget())) {
                    return true;
                }
            }
            
            // Method 2: Direct verification subdomain check
            try {
                InetAddress[] verificationAddresses = InetAddress.getAllByName(domain.getCnameTarget());
                if (verificationAddresses.length > 0) {
                    return true;
                }
            } catch (UnknownHostException ignored) {
                // Verification subdomain not found, which is expected
            }
            
        } catch (UnknownHostException e) {
            logger.debug("DNS lookup failed for domain: {} - {}", domain.getDomainName(), e.getMessage());
        }
        
        return false;
    }
    
    private void sendVerificationSuccessEmail(Domain domain) {
        try {
            // Implementation would send email to domain owner
            logger.info("Sending verification success email for domain: {}", domain.getDomainName());
        } catch (Exception e) {
            logger.error("Failed to send verification success email for: {}", domain.getDomainName(), e);
        }
    }
    
    private void sendReconfirmationFailureEmail(Domain domain) {
        try {
            // Implementation would send warning email to domain owner
            logger.info("Sending reconfirmation failure email for domain: {}", domain.getDomainName());
        } catch (Exception e) {
            logger.error("Failed to send reconfirmation failure email for: {}", domain.getDomainName(), e);
        }
    }
    
    private void sendSslRenewalFailureEmail(Domain domain) {
        try {
            // Implementation would send SSL renewal failure alert
            logger.info("Sending SSL renewal failure email for domain: {}", domain.getDomainName());
        } catch (Exception e) {
            logger.error("Failed to send SSL renewal failure email for: {}", domain.getDomainName(), e);
        }
    }
}