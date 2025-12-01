# Custom Domain SSL Implementation Plan

## 🎯 Goal
Implement **automatic SSL certificate provisioning** for custom domains using Cloudflare SaaS SSL.

---

## 📋 Current Status

### ✅ What's Working
- Domain reservation and DNS verification
- Cloudflare Workers universal proxy
- Database schema for SSL tracking
- Frontend onboarding flow
- Scheduled workers for verification

### ❌ What's NOT Working
- **SSL certificate provisioning is SIMULATED** (fake implementation)
- No actual Cloudflare API integration
- No Let's Encrypt ACME implementation
- Users see "Not Secure" warning on custom domains

---

## 🚀 Implementation Options

### **Option 1: Cloudflare SaaS SSL (RECOMMENDED)**

**Best for:** Production-ready, scalable solution

**Requirements:**
- Cloudflare Business plan ($200/month) or Enterprise
- Your main domain on Cloudflare (e.g., pebly.com)
- Cloudflare for SaaS feature enabled

**Pros:**
- ✅ Automatic SSL provisioning (30 seconds)
- ✅ Auto-renewal (no maintenance)
- ✅ Wildcard support
- ✅ DV and EV certificates
- ✅ Used by Bitly, Rebrandly, etc.
- ✅ Handles millions of domains

**Cons:**
- ❌ Costs $200/month minimum
- ❌ Requires Cloudflare Business plan

**Implementation Steps:**

#### 1. Enable Cloudflare for SaaS
```bash
# In Cloudflare Dashboard:
# 1. Go to SSL/TLS → Custom Hostnames
# 2. Click "Enable Cloudflare for SaaS"
# 3. Set fallback origin: pebly-proxy.workers.dev
# 4. Get your Zone ID and API Token
```

#### 2. Update Backend Configuration
```yaml
# application.yml
cloudflare:
  api:
    token: ${CLOUDFLARE_API_TOKEN}
    email: ${CLOUDFLARE_EMAIL}
  zone:
    id: ${CLOUDFLARE_ZONE_ID}
  saas:
    enabled: true
    fallback-origin: pebly-proxy.workers.dev
```

#### 3. Implement Real SSL Provisioning Service

**File:** `backend/url-service/src/main/java/com/urlshortener/service/CloudflareSaasService.java`

```java
package com.urlshortener.service;

import com.urlshortener.model.Domain;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class CloudflareSaasService {
    
    private static final Logger logger = LoggerFactory.getLogger(CloudflareSaasService.class);
    
    @Value("${cloudflare.api.token}")
    private String apiToken;
    
    @Value("${cloudflare.zone.id}")
    private String zoneId;
    
    @Value("${cloudflare.saas.fallback-origin}")
    private String fallbackOrigin;
    
    private final WebClient webClient;
    
    public CloudflareSaasService(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder
            .baseUrl("https://api.cloudflare.com/client/v4")
            .defaultHeader("Authorization", "Bearer " + apiToken)
            .defaultHeader("Content-Type", "application/json")
            .build();
    }
    
    /**
     * Create custom hostname with SSL in Cloudflare
     */
    public boolean createCustomHostname(Domain domain) {
        logger.info("Creating custom hostname for: {}", domain.getDomainName());
        
        try {
            Map<String, Object> requestBody = Map.of(
                "hostname", domain.getDomainName(),
                "ssl", Map.of(
                    "method", "http",  // HTTP validation (easier than TXT)
                    "type", "dv",      // Domain Validation
                    "settings", Map.of(
                        "http2", "on",
                        "min_tls_version", "1.2",
                        "tls_1_3", "on"
                    )
                )
            );
            
            Map<String, Object> response = webClient.post()
                .uri("/zones/{zoneId}/custom_hostnames", zoneId)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
            
            if (response != null && response.get("success").equals(true)) {
                Map<String, Object> result = (Map<String, Object>) response.get("result");
                String customHostnameId = (String) result.get("id");
                String status = (String) result.get("status");
                
                // Save custom hostname ID for future reference
                domain.setSslProvider("CLOUDFLARE_SAAS");
                domain.setSslStatus("PENDING");
                
                logger.info("Custom hostname created: {} with ID: {}", domain.getDomainName(), customHostnameId);
                return true;
            }
            
            return false;
            
        } catch (Exception e) {
            logger.error("Failed to create custom hostname for: {}", domain.getDomainName(), e);
            return false;
        }
    }
    
    /**
     * Check SSL status for custom hostname
     */
    public String checkSslStatus(Domain domain) {
        logger.info("Checking SSL status for: {}", domain.getDomainName());
        
        try {
            Map<String, Object> response = webClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/zones/{zoneId}/custom_hostnames")
                    .queryParam("hostname", domain.getDomainName())
                    .build(zoneId))
                .retrieve()
                .bodyToMono(Map.class)
                .block();
            
            if (response != null && response.get("success").equals(true)) {
                List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("result");
                
                if (!results.isEmpty()) {
                    Map<String, Object> hostname = results.get(0);
                    Map<String, Object> ssl = (Map<String, Object>) hostname.get("ssl");
                    String status = (String) ssl.get("status");
                    
                    // Status can be: pending_validation, pending_issuance, active, etc.
                    logger.info("SSL status for {}: {}", domain.getDomainName(), status);
                    return status;
                }
            }
            
            return "unknown";
            
        } catch (Exception e) {
            logger.error("Failed to check SSL status for: {}", domain.getDomainName(), e);
            return "error";
        }
    }
    
    /**
     * Delete custom hostname (when domain is removed)
     */
    public boolean deleteCustomHostname(Domain domain, String customHostnameId) {
        logger.info("Deleting custom hostname: {}", domain.getDomainName());
        
        try {
            webClient.delete()
                .uri("/zones/{zoneId}/custom_hostnames/{id}", zoneId, customHostnameId)
                .retrieve()
                .bodyToMono(Void.class)
                .block();
            
            logger.info("Custom hostname deleted: {}", domain.getDomainName());
            return true;
            
        } catch (Exception e) {
            logger.error("Failed to delete custom hostname: {}", domain.getDomainName(), e);
            return false;
        }
    }
}
```

#### 4. Update SslProvisioningService

Replace the fake implementation with real Cloudflare SaaS calls:

```java
@Autowired
private CloudflareSaasService cloudflareSaasService;

private boolean provisionCloudflareSSL(Domain domain) {
    try {
        logger.info("Provisioning Cloudflare SaaS SSL for: {}", domain.getDomainName());
        
        // Create custom hostname with SSL
        boolean created = cloudflareSaasService.createCustomHostname(domain);
        
        if (created) {
            // Wait for SSL to be issued (usually 30-60 seconds)
            for (int i = 0; i < 12; i++) {  // Check for 2 minutes max
                Thread.sleep(10000);  // Wait 10 seconds
                
                String status = cloudflareSaasService.checkSslStatus(domain);
                
                if ("active".equals(status)) {
                    logger.info("SSL certificate active for: {}", domain.getDomainName());
                    return true;
                } else if ("error".equals(status)) {
                    logger.error("SSL provisioning failed for: {}", domain.getDomainName());
                    return false;
                }
            }
        }
        
        return false;
        
    } catch (Exception e) {
        logger.error("Cloudflare SaaS SSL provisioning failed: {}", domain.getDomainName(), e);
        return false;
    }
}
```

#### 5. Update DNS Instructions for Users

Users need to point CNAME to your Cloudflare zone, not the worker:

**Before:**
```
CNAME: go.yourdomain.com → pebly-proxy.workers.dev
```

**After (with SaaS SSL):**
```
CNAME: go.yourdomain.com → pebly.com (your main domain on Cloudflare)
```

Or use a dedicated subdomain:
```
CNAME: go.yourdomain.com → proxy.pebly.com
```

#### 6. Testing

```bash
# 1. Create custom domain via API
curl -X POST https://your-backend.com/api/v1/domains \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"domainName": "go.testdomain.com", "ownerType": "USER"}'

# 2. Add CNAME record
# go.testdomain.com → pebly.com

# 3. Wait 30-60 seconds for SSL provisioning

# 4. Test HTTPS
curl -I https://go.testdomain.com/test123
# Should show: HTTP/2 200 with valid SSL certificate
```

---

### **Option 2: Let's Encrypt with ACME (FREE Alternative)**

**Best for:** Budget-conscious, self-hosted solution

**Requirements:**
- Server with public IP
- Port 80/443 access
- ACME client library

**Pros:**
- ✅ Completely FREE
- ✅ No vendor lock-in
- ✅ Industry standard
- ✅ Auto-renewal

**Cons:**
- ❌ More complex to implement
- ❌ Requires server infrastructure
- ❌ Manual certificate management
- ❌ 90-day renewal cycle
- ❌ Rate limits (50 certs/week per domain)

**Implementation Steps:**

#### 1. Add ACME Client Dependency

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.shredzone.acme4j</groupId>
    <artifactId>acme4j-client</artifactId>
    <version>2.16</version>
</dependency>
<dependency>
    <groupId>org.shredzone.acme4j</groupId>
    <artifactId>acme4j-utils</artifactId>
    <version>2.16</version>
</dependency>
```

#### 2. Implement ACME Service

**File:** `backend/url-service/src/main/java/com/urlshortener/service/AcmeService.java`

```java
package com.urlshortener.service;

import org.shredzone.acme4j.*;
import org.shredzone.acme4j.challenge.Http01Challenge;
import org.shredzone.acme4j.util.KeyPairUtils;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.*;
import java.security.KeyPair;

@Service
public class AcmeService {
    
    private static final Logger logger = LoggerFactory.getLogger(AcmeService.class);
    private static final String ACME_SERVER = "acme://letsencrypt.org";
    
    public boolean provisionCertificate(String domain) {
        try {
            // 1. Load or create account key pair
            KeyPair accountKeyPair = loadOrCreateKeyPair("account");
            
            // 2. Create session
            Session session = new Session(ACME_SERVER);
            
            // 3. Get account
            Account account = new AccountBuilder()
                .agreeToTermsOfService()
                .useKeyPair(accountKeyPair)
                .create(session);
            
            // 4. Order certificate
            Order order = account.newOrder()
                .domain(domain)
                .create();
            
            // 5. Process authorizations
            for (Authorization auth : order.getAuthorizations()) {
                if (auth.getStatus() == Status.VALID) {
                    continue;
                }
                
                // Get HTTP-01 challenge
                Http01Challenge challenge = auth.findChallenge(Http01Challenge.TYPE);
                
                if (challenge == null) {
                    throw new Exception("HTTP-01 challenge not available");
                }
                
                // Store challenge token for verification
                String token = challenge.getToken();
                String content = challenge.getAuthorization();
                storeChallengeToken(token, content);
                
                // Trigger challenge
                challenge.trigger();
                
                // Wait for validation
                int attempts = 10;
                while (auth.getStatus() != Status.VALID && attempts-- > 0) {
                    Thread.sleep(3000);
                    auth.update();
                }
                
                if (auth.getStatus() != Status.VALID) {
                    throw new Exception("Authorization failed");
                }
            }
            
            // 6. Generate certificate key pair
            KeyPair domainKeyPair = KeyPairUtils.createKeyPair(2048);
            
            // 7. Finalize order
            order.execute(domainKeyPair);
            
            // 8. Wait for certificate
            int attempts = 10;
            while (order.getStatus() != Status.VALID && attempts-- > 0) {
                Thread.sleep(3000);
                order.update();
            }
            
            // 9. Download certificate
            Certificate certificate = order.getCertificate();
            
            // 10. Store certificate
            storeCertificate(domain, certificate, domainKeyPair);
            
            logger.info("Certificate provisioned successfully for: {}", domain);
            return true;
            
        } catch (Exception e) {
            logger.error("Failed to provision certificate for: {}", domain, e);
            return false;
        }
    }
    
    private KeyPair loadOrCreateKeyPair(String name) throws IOException {
        File file = new File("keys/" + name + ".pem");
        
        if (file.exists()) {
            try (FileReader fr = new FileReader(file)) {
                return KeyPairUtils.readKeyPair(fr);
            }
        } else {
            KeyPair keyPair = KeyPairUtils.createKeyPair(2048);
            file.getParentFile().mkdirs();
            try (FileWriter fw = new FileWriter(file)) {
                KeyPairUtils.writeKeyPair(keyPair, fw);
            }
            return keyPair;
        }
    }
    
    private void storeChallengeToken(String token, String content) {
        // Store in database or file system for HTTP-01 challenge verification
        // Your web server needs to serve this at: /.well-known/acme-challenge/{token}
    }
    
    private void storeCertificate(String domain, Certificate cert, KeyPair keyPair) {
        // Store certificate and private key securely
        // You'll need to configure your reverse proxy (Nginx/Caddy) to use these
    }
}
```

#### 3. Expose ACME Challenge Endpoint

```java
@RestController
@RequestMapping("/.well-known/acme-challenge")
public class AcmeController {
    
    @GetMapping("/{token}")
    public ResponseEntity<String> getChallenge(@PathVariable String token) {
        // Retrieve challenge content from storage
        String content = challengeStorage.get(token);
        
        if (content != null) {
            return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .body(content);
        }
        
        return ResponseEntity.notFound().build();
    }
}
```

#### 4. Configure Reverse Proxy

You'll need Nginx or Caddy to handle SSL termination:

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name ~^(?<domain>.+)$;
    
    # Dynamic SSL certificate loading
    ssl_certificate /path/to/certs/$domain/fullchain.pem;
    ssl_certificate_key /path/to/certs/$domain/privkey.pem;
    
    location / {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
    }
}
```

---

### **Option 3: Hybrid Approach (RECOMMENDED for MVP)**

Use Cloudflare Workers with Cloudflare's automatic SSL:

#### Current Setup (What You Have)
```
User Domain → CNAME → pebly-proxy.workers.dev → Backend
```

#### Problem
Workers.dev domains get SSL, but custom domains don't automatically.

#### Solution: Cloudflare Proxy Mode

**Step 1:** Tell users to add domain to Cloudflare (free account)

**Step 2:** Update DNS instructions:
```
Type: CNAME
Name: go
Target: pebly-proxy.workers.dev
Proxy Status: ✅ Proxied (orange cloud)
```

**Step 3:** Cloudflare automatically provisions SSL!

**Pros:**
- ✅ FREE for users
- ✅ Automatic SSL
- ✅ No code changes needed
- ✅ Works immediately

**Cons:**
- ❌ Users must have Cloudflare account
- ❌ Less professional (requires user action)
- ❌ Not fully automated

---

## 📊 Comparison Matrix

| Feature | Cloudflare SaaS | Let's Encrypt | Hybrid (CF Proxy) |
|---------|----------------|---------------|-------------------|
| **Cost** | $200/month | FREE | FREE |
| **Setup Complexity** | Easy | Hard | Easy |
| **User Experience** | Excellent | Good | Good |
| **Automation** | Full | Partial | Manual |
| **Scalability** | Unlimited | Limited | Good |
| **Maintenance** | None | High | Low |
| **SSL Provisioning** | 30 seconds | 2-5 minutes | Instant |
| **Renewal** | Automatic | Automatic | Automatic |
| **Best For** | Production SaaS | Self-hosted | MVP/Testing |

---

## 🎯 RECOMMENDED IMPLEMENTATION PATH

### **Phase 1: MVP (Week 1) - Hybrid Approach**
1. Update frontend instructions to guide users through Cloudflare setup
2. Add documentation for "orange cloud" proxy mode
3. Test with 5-10 beta users
4. **Cost: $0**

### **Phase 2: Production (Month 2) - Cloudflare SaaS**
1. Upgrade to Cloudflare Business plan
2. Implement CloudflareSaasService
3. Update SslProvisioningService with real API calls
4. Migrate existing domains
5. **Cost: $200/month**

### **Phase 3: Enterprise (Month 6) - Multi-Provider**
1. Add Let's Encrypt as fallback
2. Implement certificate storage
3. Add custom SSL upload option
4. Support wildcard certificates
5. **Cost: $200/month + infrastructure**

---

## 📝 Implementation Checklist

### Immediate Actions (This Week)
- [ ] Choose implementation option (SaaS vs Hybrid)
- [ ] Get Cloudflare API credentials
- [ ] Update environment variables
- [ ] Test with one custom domain

### Backend Changes
- [ ] Create CloudflareSaasService.java
- [ ] Update SslProvisioningService.java (remove fake code)
- [ ] Add SSL status polling
- [ ] Implement error handling
- [ ] Add logging and monitoring

### Frontend Changes
- [ ] Update DNS instructions in CustomDomainOnboarding.tsx
- [ ] Add SSL status indicator
- [ ] Show certificate details
- [ ] Add troubleshooting guide

### Testing
- [ ] Test SSL provisioning flow
- [ ] Test certificate renewal
- [ ] Test error scenarios
- [ ] Load test with 100 domains

### Documentation
- [ ] Update README with SSL setup
- [ ] Create user guide for custom domains
- [ ] Document API endpoints
- [ ] Add troubleshooting section

---

## 🚨 Critical Notes

1. **Current Code is FAKE** - All SSL provisioning just sleeps and returns true
2. **No Real SSL** - Users will see "Not Secure" warnings
3. **Database Ready** - Schema supports SSL tracking, just needs real implementation
4. **Proxy Works** - Cloudflare Workers routing is functional
5. **Missing Piece** - Only SSL certificate provisioning needs implementation

---

## 💰 Cost Analysis

### Cloudflare SaaS SSL
- **Setup**: $0 (one-time)
- **Monthly**: $200 (Business plan)
- **Per Domain**: $0 (unlimited)
- **Total Year 1**: $2,400

### Let's Encrypt
- **Setup**: $0
- **Monthly**: $50-100 (server costs)
- **Per Domain**: $0
- **Total Year 1**: $600-1,200

### Hybrid (User Cloudflare)
- **Setup**: $0
- **Monthly**: $0
- **Per Domain**: $0 (user pays)
- **Total Year 1**: $0

---

## 🎉 Expected Results After Implementation

### Before (Current State)
```
❌ User adds custom domain
❌ DNS configured correctly
❌ Links redirect properly
❌ Browser shows "Not Secure" ⚠️
❌ Users complain about SSL warnings
```

### After (With SaaS SSL)
```
✅ User adds custom domain
✅ DNS configured correctly
✅ SSL certificate auto-provisioned (30 sec)
✅ Browser shows "Secure" 🔒
✅ Professional, production-ready
```

---

## 📞 Next Steps

1. **Decide on approach** (SaaS vs Hybrid vs Let's Encrypt)
2. **Get Cloudflare credentials** (if using SaaS)
3. **Implement CloudflareSaasService** (2-3 hours)
4. **Update SslProvisioningService** (1 hour)
5. **Test with real domain** (30 minutes)
6. **Deploy to production** (1 hour)

**Total Implementation Time: 1-2 days**

---

## 🔗 Resources

- [Cloudflare for SaaS Documentation](https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/)
- [Custom Hostnames API](https://developers.cloudflare.com/api/operations/custom-hostnames-for-a-zone-create-custom-hostname)
- [Let's Encrypt ACME](https://letsencrypt.org/docs/client-options/)
- [ACME4J Library](https://shredzone.org/maven/acme4j/)

---

**Ready to implement? Let me know which option you want to proceed with!** 🚀
