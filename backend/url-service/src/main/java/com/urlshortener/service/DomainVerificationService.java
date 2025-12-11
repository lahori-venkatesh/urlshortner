package com.urlshortener.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;
import java.util.Hashtable;

@Service
public class DomainVerificationService {
    
    @Value("${app.domain.proxy-target:tinyslash.com}")
    private String expectedTarget;
    
    /**
     * Verify DNS CNAME record
     */
    public boolean verifyDNS(String domain) {
        try {
            String cnameTarget = getCNAMERecord(domain);
            
            if (cnameTarget == null) {
                System.out.println("❌ No CNAME record found for: " + domain);
                return false;
            }
            
            // Normalize CNAME target (remove trailing dot)
            cnameTarget = cnameTarget.endsWith(".") ? 
                         cnameTarget.substring(0, cnameTarget.length() - 1) : 
                         cnameTarget;
            
            boolean isValid = cnameTarget.equalsIgnoreCase(expectedTarget);
            
            if (isValid) {
                System.out.println("✅ DNS verified for: " + domain + " → " + cnameTarget);
            } else {
                System.out.println("❌ DNS mismatch for: " + domain);
                System.out.println("   Expected: " + expectedTarget);
                System.out.println("   Found: " + cnameTarget);
            }
            
            return isValid;
            
        } catch (Exception e) {
            System.err.println("❌ DNS verification failed for " + domain + ": " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Get CNAME record for domain
     */
    public String getCNAMERecord(String domain) {
        try {
            Hashtable<String, String> env = new Hashtable<>();
            env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
            env.put("java.naming.provider.url", "dns://8.8.8.8"); // Use Google DNS
            
            DirContext ctx = new InitialDirContext(env);
            Attributes attrs = ctx.getAttributes(domain, new String[]{"CNAME"});
            Attribute cnameAttr = attrs.get("CNAME");
            
            if (cnameAttr != null) {
                return cnameAttr.get().toString();
            }
            
            ctx.close();
            
        } catch (NamingException e) {
            // Try with default DNS
            try {
                Hashtable<String, String> env = new Hashtable<>();
                env.put("java.naming.factory.initial", "com.sun.jndi.dns.DnsContextFactory");
                
                DirContext ctx = new InitialDirContext(env);
                Attributes attrs = ctx.getAttributes(domain, new String[]{"CNAME"});
                Attribute cnameAttr = attrs.get("CNAME");
                
                if (cnameAttr != null) {
                    return cnameAttr.get().toString();
                }
                
                ctx.close();
                
            } catch (NamingException ex) {
                System.err.println("DNS lookup failed for " + domain + ": " + ex.getMessage());
            }
        }
        
        return null;
    }
    
    /**
     * Extract subdomain from full domain
     */
    public String extractSubdomain(String domain) {
        String[] parts = domain.split("\\.");
        if (parts.length >= 3) {
            return parts[0]; // Return subdomain part (e.g., "go" from "go.company.com")
        }
        return "@"; // Root domain
    }
    
    /**
     * Validate domain format
     */
    public boolean isValidDomain(String domain) {
        if (domain == null || domain.trim().isEmpty()) {
            return false;
        }
        
        // Basic domain validation regex
        String domainRegex = "^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\\.[a-zA-Z]{2,}$|" +
                           "^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]\\.[a-zA-Z]{2,}$";
        
        return domain.matches(domainRegex);
    }
}
