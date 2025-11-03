# BitaURL - Security Documentation

## 🎯 Security Overview

BitaURL implements enterprise-grade security measures to protect user data, ensure platform integrity, and maintain compliance with industry standards. Our security framework follows the principle of defense in depth, implementing multiple layers of protection across all system components.

## 🏛️ Security Architecture

### Security Principles

#### 1. Zero Trust Architecture
- **Never trust, always verify** - Every request is authenticated and authorized
- **Least privilege access** - Users and systems have minimal required permissions
- **Continuous monitoring** - All activities are logged and monitored
- **Micro-segmentation** - Network and application-level isolation

#### 2. Defense in Depth
- **Perimeter Security** - WAF, DDoS protection, rate limiting
- **Network Security** - VPC isolation, security groups, encrypted communication
- **Application Security** - Input validation, output encoding, secure coding practices
- **Data Security** - Encryption at rest and in transit, data classification
- **Identity Security** - Multi-factor authentication, role-based access control

#### 3. Security by Design
- **Secure defaults** - All configurations default to secure settings
- **Fail securely** - System failures default to deny access
- **Privacy by design** - Data protection built into system architecture
- **Compliance ready** - Built to meet SOC 2, GDPR, and other standards

## 🔐 Authentication & Authorization

### Multi-Factor Authentication (MFA)

#### TOTP (Time-based One-Time Password)
```java
@Service
public class MfaService {
    
    public String generateSecretKey() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[20];
        random.nextBytes(bytes);
        return Base32.encode(bytes);
    }
    
    public boolean validateTotpCode(String secretKey, String code) {
        long timeWindow = System.currentTimeMillis() / 30000;
        
        // Check current window and adjacent windows for clock skew
        for (int i = -1; i <= 1; i++) {
            String expectedCode = generateTotpCode(secretKey, timeWindow + i);
            if (constantTimeEquals(code, expectedCode)) {
                return true;
            }
        }
        return false;
    }
    
    private String generateTotpCode(String secretKey, long timeWindow) {
        byte[] key = Base32.decode(secretKey);
        byte[] timeBytes = ByteBuffer.allocate(8).putLong(timeWindow).array();
        
        Mac hmac = Mac.getInstance("HmacSHA1");
        hmac.init(new SecretKeySpec(key, "HmacSHA1"));
        byte[] hash = hmac.doFinal(timeBytes);
        
        int offset = hash[hash.length - 1] & 0x0F;
        int code = ((hash[offset] & 0x7F) << 24) |
                   ((hash[offset + 1] & 0xFF) << 16) |
                   ((hash[offset + 2] & 0xFF) << 8) |
                   (hash[offset + 3] & 0xFF);
        
        return String.format("%06d", code % 1000000);
    }
}
```

#### SMS-based MFA
```java
@Service
public class SmsService {
    
    @Autowired
    private TwilioClient twilioClient;
    
    public void sendMfaCode(String phoneNumber, String code) {
        Message message = Message.creator(
            new PhoneNumber(phoneNumber),
            new PhoneNumber(twilioConfig.getFromNumber()),
            "Your BitaURL verification code is: " + code + ". Valid for 5 minutes."
        ).create();
        
        auditService.logSecurityEvent("mfa.sms.sent", phoneNumber, message.getSid());
    }
    
    public String generateMfaCode() {
        SecureRandom random = new SecureRandom();
        return String.format("%06d", random.nextInt(1000000));
    }
}
```

### JWT Security Implementation

#### Token Generation with Enhanced Security
```java
@Component
public class JwtUtil {
    
    private static final String ISSUER = "bitaurl.com";
    private static final String AUDIENCE = "bitaurl-api";
    
    @Value("${app.jwt.secret}")
    private String jwtSecret;
    
    @Value("${app.jwt.access-token-expiration}")
    private int accessTokenExpiration;
    
    public String generateAccessToken(UserDetails userDetails, String sessionId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", userDetails.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.toList()));
        claims.put("sessionId", sessionId);
        claims.put("tokenType", "access");
        claims.put("deviceId", getCurrentDeviceId());
        
        return Jwts.builder()
            .setClaims(claims)
            .setSubject(userDetails.getUsername())
            .setIssuer(ISSUER)
            .setAudience(AUDIENCE)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + accessTokenExpiration))
            .setId(UUID.randomUUID().toString()) // JTI for token tracking
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact();
    }
    
    public boolean validateToken(String token, UserDetails userDetails) {
        try {
            Claims claims = Jwts.parser()
                .setSigningKey(jwtSecret)
                .requireIssuer(ISSUER)
                .requireAudience(AUDIENCE)
                .parseClaimsJws(token)
                .getBody();
            
            // Validate token hasn't been revoked
            String jti = claims.getId();
            if (tokenBlacklistService.isTokenRevoked(jti)) {
                return false;
            }
            
            // Validate session is still active
            String sessionId = claims.get("sessionId", String.class);
            if (!sessionService.isSessionActive(sessionId)) {
                return false;
            }
            
            return claims.getSubject().equals(userDetails.getUsername()) 
                && !isTokenExpired(claims);
                
        } catch (JwtException | IllegalArgumentException e) {
            logger.warn("JWT validation failed: {}", e.getMessage());
            return false;
        }
    }
}
```

#### Token Blacklisting
```java
@Service
public class TokenBlacklistService {
    
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    
    private static final String BLACKLIST_PREFIX = "blacklist:token:";
    
    public void revokeToken(String jti, long expirationTime) {
        String key = BLACKLIST_PREFIX + jti;
        long ttl = expirationTime - System.currentTimeMillis();
        
        if (ttl > 0) {
            redisTemplate.opsForValue().set(key, "revoked", ttl, TimeUnit.MILLISECONDS);
        }
    }
    
    public boolean isTokenRevoked(String jti) {
        String key = BLACKLIST_PREFIX + jti;
        return redisTemplate.hasKey(key);
    }
    
    public void revokeAllUserTokens(String userId) {
        // Increment user's token version to invalidate all existing tokens
        String versionKey = "user:token:version:" + userId;
        redisTemplate.opsForValue().increment(versionKey);
    }
}
```

### Role-Based Access Control (RBAC)

#### Permission System
```java
public enum Permission {
    // URL Management
    URL_CREATE("url:create"),
    URL_READ("url:read"),
    URL_UPDATE("url:update"),
    URL_DELETE("url:delete"),
    URL_ANALYTICS("url:analytics"),
    
    // Team Management
    TEAM_CREATE("team:create"),
    TEAM_MANAGE("team:manage"),
    TEAM_INVITE("team:invite"),
    TEAM_REMOVE_MEMBER("team:remove_member"),
    
    // Admin Permissions
    ADMIN_USER_MANAGE("admin:user:manage"),
    ADMIN_SYSTEM_MONITOR("admin:system:monitor"),
    ADMIN_AUDIT_VIEW("admin:audit:view"),
    ADMIN_BILLING_MANAGE("admin:billing:manage"),
    
    // System Permissions
    SYSTEM_MAINTENANCE("system:maintenance"),
    SYSTEM_BACKUP("system:backup");
    
    private final String permission;
    
    Permission(String permission) {
        this.permission = permission;
    }
}

@Entity
public class Role {
    @Id
    private String id;
    
    private String name;
    private String description;
    
    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    private Set<Permission> permissions = new HashSet<>();
    
    private int hierarchyLevel; // Lower number = higher privilege
    
    // Getters and setters
}
```

#### Method-Level Security
```java
@RestController
@RequestMapping("/api/v1/urls")
public class UrlController {
    
    @PostMapping
    @PreAuthorize("hasPermission(null, 'URL', 'CREATE')")
    public ResponseEntity<UrlResponse> createUrl(@RequestBody CreateUrlRequest request) {
        // Implementation
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(#id, 'URL', 'READ')")
    public ResponseEntity<UrlResponse> getUrl(@PathVariable String id) {
        // Implementation
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(#id, 'URL', 'DELETE') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUrl(@PathVariable String id) {
        // Implementation
    }
}

@Component
public class CustomPermissionEvaluator implements PermissionEvaluator {
    
    @Override
    public boolean hasPermission(Authentication auth, Object targetDomainObject, Object permission) {
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        
        String userId = auth.getName();
        String permissionString = permission.toString();
        
        // Check if user has the required permission
        return userService.hasPermission(userId, permissionString);
    }
    
    @Override
    public boolean hasPermission(Authentication auth, Serializable targetId, String targetType, Object permission) {
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }
        
        String userId = auth.getName();
        String resourceId = targetId.toString();
        String resourceType = targetType;
        String permissionString = permission.toString();
        
        // Check resource-specific permissions
        return resourcePermissionService.hasPermission(userId, resourceId, resourceType, permissionString);
    }
}
```

## 🛡️ Input Validation & Sanitization

### Request Validation
```java
@RestController
@Validated
public class UrlController {
    
    @PostMapping
    public ResponseEntity<UrlResponse> createUrl(
            @Valid @RequestBody CreateUrlRequest request) {
        // Validation is handled by @Valid annotation
        return ResponseEntity.ok(urlService.createUrl(request));
    }
}

public class CreateUrlRequest {
    
    @NotBlank(message = "Original URL is required")
    @URL(message = "Must be a valid URL")
    @Size(max = 2048, message = "URL too long")
    private String originalUrl;
    
    @Size(max = 100, message = "Title too long")
    @Pattern(regexp = "^[a-zA-Z0-9\\s\\-_.,!?]*$", message = "Title contains invalid characters")
    private String title;
    
    @Size(max = 500, message = "Description too long")
    private String description;
    
    @Pattern(regexp = "^[a-zA-Z0-9\\-_]*$", message = "Custom alias can only contain letters, numbers, hyphens, and underscores")
    @Size(min = 3, max = 50, message = "Custom alias must be between 3 and 50 characters")
    private String customAlias;
    
    @Valid
    private List<@Pattern(regexp = "^[a-zA-Z0-9\\-_]*$") String> tags;
    
    // Getters and setters
}
```

### SQL Injection Prevention
```java
@Repository
public class UrlRepository {
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    // Using parameterized queries with Spring Data MongoDB
    public List<Url> findUrlsByUserAndKeyword(String userId, String keyword) {
        Query query = new Query();
        
        // Safe parameter binding
        query.addCriteria(Criteria.where("userId").is(userId));
        
        if (keyword != null && !keyword.trim().isEmpty()) {
            // Escape special regex characters
            String escapedKeyword = Pattern.quote(keyword.trim());
            query.addCriteria(new Criteria().orOperator(
                Criteria.where("title").regex(escapedKeyword, "i"),
                Criteria.where("description").regex(escapedKeyword, "i")
            ));
        }
        
        return mongoTemplate.find(query, Url.class);
    }
}
```

### XSS Prevention
```java
@Component
public class XssProtectionService {
    
    private final PolicyFactory policy;
    
    public XssProtectionService() {
        this.policy = Sanitizers.FORMATTING
            .and(Sanitizers.LINKS)
            .and(Sanitizers.BLOCKS)
            .and(Sanitizers.IMAGES);
    }
    
    public String sanitizeHtml(String input) {
        if (input == null) {
            return null;
        }
        return policy.sanitize(input);
    }
    
    public String escapeHtml(String input) {
        if (input == null) {
            return null;
        }
        return StringEscapeUtils.escapeHtml4(input);
    }
}

@RestController
public class ContentController {
    
    @Autowired
    private XssProtectionService xssProtectionService;
    
    @PostMapping("/content")
    public ResponseEntity<String> createContent(@RequestBody ContentRequest request) {
        // Sanitize HTML content
        String sanitizedContent = xssProtectionService.sanitizeHtml(request.getContent());
        
        // Escape other fields
        String escapedTitle = xssProtectionService.escapeHtml(request.getTitle());
        
        // Process sanitized content
        return ResponseEntity.ok("Content created successfully");
    }
}
```

## 🔒 Data Protection

### Encryption at Rest
```java
@Configuration
public class EncryptionConfig {
    
    @Value("${app.encryption.key}")
    private String encryptionKey;
    
    @Bean
    public AESUtil aesUtil() {
        return new AESUtil(encryptionKey);
    }
}

@Component
public class AESUtil {
    
    private final SecretKeySpec secretKey;
    private final String algorithm = "AES/GCM/NoPadding";
    
    public AESUtil(String key) {
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        byte[] keyBytes = sha.digest(key.getBytes(StandardCharsets.UTF_8));
        this.secretKey = new SecretKeySpec(keyBytes, "AES");
    }
    
    public String encrypt(String plainText) {
        try {
            Cipher cipher = Cipher.getInstance(algorithm);
            
            // Generate random IV
            byte[] iv = new byte[12];
            SecureRandom.getInstanceStrong().nextBytes(iv);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(128, iv);
            
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec);
            byte[] cipherText = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            
            // Combine IV and ciphertext
            byte[] encryptedWithIv = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, encryptedWithIv, 0, iv.length);
            System.arraycopy(cipherText, 0, encryptedWithIv, iv.length, cipherText.length);
            
            return Base64.getEncoder().encodeToString(encryptedWithIv);
            
        } catch (Exception e) {
            throw new SecurityException("Encryption failed", e);
        }
    }
    
    public String decrypt(String encryptedText) {
        try {
            byte[] encryptedWithIv = Base64.getDecoder().decode(encryptedText);
            
            // Extract IV and ciphertext
            byte[] iv = new byte[12];
            byte[] cipherText = new byte[encryptedWithIv.length - 12];
            System.arraycopy(encryptedWithIv, 0, iv, 0, 12);
            System.arraycopy(encryptedWithIv, 12, cipherText, 0, cipherText.length);
            
            Cipher cipher = Cipher.getInstance(algorithm);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(128, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec);
            
            byte[] plainText = cipher.doFinal(cipherText);
            return new String(plainText, StandardCharsets.UTF_8);
            
        } catch (Exception e) {
            throw new SecurityException("Decryption failed", e);
        }
    }
}
```

### Sensitive Data Handling
```java
@Entity
public class User {
    
    @Id
    private String id;
    
    private String email;
    private String name;
    
    @Convert(converter = EncryptedStringConverter.class)
    private String phoneNumber; // Encrypted in database
    
    @Convert(converter = EncryptedStringConverter.class)
    private String address; // Encrypted in database
    
    @JsonIgnore
    private String passwordHash; // Never serialized to JSON
    
    @Transient
    private String plainTextPassword; // Never persisted
    
    // Getters and setters
}

@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {
    
    @Autowired
    private AESUtil aesUtil;
    
    @Override
    public String convertToDatabaseColumn(String attribute) {
        if (attribute == null) {
            return null;
        }
        return aesUtil.encrypt(attribute);
    }
    
    @Override
    public String convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return aesUtil.decrypt(dbData);
    }
}
```

### PII Data Masking
```java
@Component
public class DataMaskingService {
    
    public String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email;
        }
        
        String[] parts = email.split("@");
        String username = parts[0];
        String domain = parts[1];
        
        if (username.length() <= 2) {
            return "*".repeat(username.length()) + "@" + domain;
        }
        
        return username.charAt(0) + "*".repeat(username.length() - 2) + 
               username.charAt(username.length() - 1) + "@" + domain;
    }
    
    public String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.length() < 4) {
            return phoneNumber;
        }
        
        return "*".repeat(phoneNumber.length() - 4) + 
               phoneNumber.substring(phoneNumber.length() - 4);
    }
    
    public String maskCreditCard(String cardNumber) {
        if (cardNumber == null || cardNumber.length() < 4) {
            return cardNumber;
        }
        
        return "*".repeat(cardNumber.length() - 4) + 
               cardNumber.substring(cardNumber.length() - 4);
    }
}
```

## 🚨 Security Monitoring & Incident Response

### Security Event Logging
```java
@Service
public class SecurityAuditService {
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    @Autowired
    private SecurityAlertService alertService;
    
    public void logSecurityEvent(SecurityEventType eventType, String userId, 
                                String details, HttpServletRequest request) {
        
        SecurityAuditLog log = SecurityAuditLog.builder()
            .eventType(eventType)
            .userId(userId)
            .ipAddress(getClientIpAddress(request))
            .userAgent(request.getHeader("User-Agent"))
            .sessionId(request.getSession().getId())
            .details(details)
            .timestamp(LocalDateTime.now())
            .severity(eventType.getSeverity())
            .build();
        
        auditLogRepository.save(log);
        
        // Check for suspicious patterns
        if (isSuspiciousActivity(eventType, userId, request)) {
            alertService.triggerSecurityAlert(log);
        }
    }
    
    private boolean isSuspiciousActivity(SecurityEventType eventType, String userId, 
                                       HttpServletRequest request) {
        
        String ipAddress = getClientIpAddress(request);
        
        // Check for multiple failed login attempts
        if (eventType == SecurityEventType.LOGIN_FAILED) {
            long failedAttempts = auditLogRepository.countFailedLoginAttempts(
                ipAddress, LocalDateTime.now().minusMinutes(15)
            );
            return failedAttempts >= 5;
        }
        
        // Check for unusual geographic access
        if (eventType == SecurityEventType.LOGIN_SUCCESS) {
            return isUnusualGeographicAccess(userId, ipAddress);
        }
        
        // Check for privilege escalation attempts
        if (eventType == SecurityEventType.PERMISSION_DENIED) {
            long deniedAttempts = auditLogRepository.countPermissionDeniedAttempts(
                userId, LocalDateTime.now().minusMinutes(5)
            );
            return deniedAttempts >= 3;
        }
        
        return false;
    }
}

public enum SecurityEventType {
    LOGIN_SUCCESS(Severity.INFO),
    LOGIN_FAILED(Severity.WARNING),
    LOGOUT(Severity.INFO),
    PASSWORD_CHANGED(Severity.INFO),
    MFA_ENABLED(Severity.INFO),
    MFA_DISABLED(Severity.WARNING),
    PERMISSION_DENIED(Severity.WARNING),
    SUSPICIOUS_ACTIVITY(Severity.HIGH),
    DATA_EXPORT(Severity.INFO),
    ADMIN_ACTION(Severity.INFO),
    SYSTEM_BREACH_ATTEMPT(Severity.CRITICAL);
    
    private final Severity severity;
    
    SecurityEventType(Severity severity) {
        this.severity = severity;
    }
    
    public Severity getSeverity() {
        return severity;
    }
}
```

### Intrusion Detection
```java
@Service
public class IntrusionDetectionService {
    
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    
    @Autowired
    private SecurityAlertService alertService;
    
    private static final String RATE_LIMIT_PREFIX = "rate_limit:";
    private static final String SUSPICIOUS_IP_PREFIX = "suspicious_ip:";
    
    @EventListener
    public void handleSecurityEvent(SecurityAuditLog event) {
        
        // Rate limiting check
        if (isRateLimitExceeded(event.getIpAddress(), event.getEventType())) {
            blockSuspiciousIp(event.getIpAddress(), "Rate limit exceeded");
        }
        
        // Brute force detection
        if (event.getEventType() == SecurityEventType.LOGIN_FAILED) {
            handleFailedLogin(event);
        }
        
        // Unusual access pattern detection
        if (event.getEventType() == SecurityEventType.LOGIN_SUCCESS) {
            detectUnusualAccess(event);
        }
    }
    
    private void handleFailedLogin(SecurityAuditLog event) {
        String key = "failed_login:" + event.getIpAddress();
        String countStr = redisTemplate.opsForValue().get(key);
        int count = countStr != null ? Integer.parseInt(countStr) : 0;
        
        count++;
        redisTemplate.opsForValue().set(key, String.valueOf(count), 15, TimeUnit.MINUTES);
        
        if (count >= 5) {
            blockSuspiciousIp(event.getIpAddress(), "Brute force attack detected");
            alertService.triggerSecurityAlert(
                SecurityAlert.builder()
                    .type(AlertType.BRUTE_FORCE_ATTACK)
                    .ipAddress(event.getIpAddress())
                    .userId(event.getUserId())
                    .details("Multiple failed login attempts: " + count)
                    .severity(Severity.HIGH)
                    .build()
            );
        }
    }
    
    private void blockSuspiciousIp(String ipAddress, String reason) {
        String key = SUSPICIOUS_IP_PREFIX + ipAddress;
        redisTemplate.opsForValue().set(key, reason, 24, TimeUnit.HOURS);
        
        // Add to WAF blocklist
        wafService.blockIpAddress(ipAddress, reason);
    }
    
    public boolean isSuspiciousIp(String ipAddress) {
        String key = SUSPICIOUS_IP_PREFIX + ipAddress;
        return redisTemplate.hasKey(key);
    }
}
```

### Automated Incident Response
```java
@Service
public class IncidentResponseService {
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private UserService userService;
    
    @EventListener
    public void handleSecurityAlert(SecurityAlert alert) {
        
        switch (alert.getType()) {
            case BRUTE_FORCE_ATTACK:
                handleBruteForceAttack(alert);
                break;
                
            case SUSPICIOUS_LOGIN:
                handleSuspiciousLogin(alert);
                break;
                
            case DATA_BREACH_ATTEMPT:
                handleDataBreachAttempt(alert);
                break;
                
            case PRIVILEGE_ESCALATION:
                handlePrivilegeEscalation(alert);
                break;
        }
    }
    
    private void handleSuspiciousLogin(SecurityAlert alert) {
        // Temporarily lock user account
        userService.temporaryLockAccount(alert.getUserId(), "Suspicious login detected");
        
        // Send security notification to user
        notificationService.sendSecurityAlert(
            alert.getUserId(),
            "Suspicious login attempt detected",
            "We detected a login attempt from an unusual location. If this wasn't you, please change your password immediately."
        );
        
        // Notify security team
        notificationService.notifySecurityTeam(alert);
        
        // Force logout all sessions
        sessionService.invalidateAllUserSessions(alert.getUserId());
    }
    
    private void handleDataBreachAttempt(SecurityAlert alert) {
        // Immediately block the IP
        wafService.blockIpAddress(alert.getIpAddress(), "Data breach attempt");
        
        // Escalate to security team
        notificationService.escalateToSecurityTeam(alert);
        
        // Log detailed forensic information
        forensicService.captureIncidentDetails(alert);
        
        // If admin account involved, notify executives
        if (userService.isAdminUser(alert.getUserId())) {
            notificationService.notifyExecutives(alert);
        }
    }
}
```

## 🔍 Vulnerability Management

### Security Scanning
```java
@Service
public class VulnerabilityScanner {
    
    @Scheduled(cron = "0 0 2 * * ?") // Daily at 2 AM
    public void performSecurityScan() {
        
        // Scan for weak passwords
        scanWeakPasswords();
        
        // Scan for inactive admin accounts
        scanInactiveAdminAccounts();
        
        // Scan for excessive permissions
        scanExcessivePermissions();
        
        // Scan for unencrypted sensitive data
        scanUnencryptedData();
        
        // Generate security report
        generateSecurityReport();
    }
    
    private void scanWeakPasswords() {
        List<User> users = userRepository.findUsersWithWeakPasswords();
        
        for (User user : users) {
            SecurityVulnerability vulnerability = SecurityVulnerability.builder()
                .type(VulnerabilityType.WEAK_PASSWORD)
                .severity(Severity.MEDIUM)
                .userId(user.getId())
                .description("User has a weak password")
                .recommendation("Enforce strong password policy")
                .build();
                
            vulnerabilityRepository.save(vulnerability);
            
            // Notify user to change password
            notificationService.sendPasswordChangeReminder(user.getId());
        }
    }
    
    private void scanInactiveAdminAccounts() {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(90);
        List<User> inactiveAdmins = userRepository.findInactiveAdminsSince(cutoffDate);
        
        for (User admin : inactiveAdmins) {
            SecurityVulnerability vulnerability = SecurityVulnerability.builder()
                .type(VulnerabilityType.INACTIVE_ADMIN_ACCOUNT)
                .severity(Severity.HIGH)
                .userId(admin.getId())
                .description("Admin account inactive for over 90 days")
                .recommendation("Disable or review admin account")
                .build();
                
            vulnerabilityRepository.save(vulnerability);
        }
    }
}
```

### Dependency Scanning
```xml
<!-- Maven plugin for dependency vulnerability scanning -->
<plugin>
    <groupId>org.owasp</groupId>
    <artifactId>dependency-check-maven</artifactId>
    <version>8.4.0</version>
    <configuration>
        <failBuildOnCVSS>7</failBuildOnCVSS>
        <suppressionFiles>
            <suppressionFile>dependency-check-suppressions.xml</suppressionFile>
        </suppressionFiles>
    </configuration>
    <executions>
        <execution>
            <goals>
                <goal>check</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

## 🛡️ Network Security

### WAF Configuration
```yaml
# CloudFlare WAF Rules
rules:
  - name: "Block SQL Injection Attempts"
    expression: '(http.request.uri.query contains "union select") or (http.request.uri.query contains "drop table")'
    action: "block"
    
  - name: "Block XSS Attempts"
    expression: '(http.request.uri.query contains "<script>") or (http.request.body contains "<script>")'
    action: "block"
    
  - name: "Rate Limit API Endpoints"
    expression: 'http.request.uri.path matches "^/api/v1/.*"'
    action: "rate_limit"
    rate_limit:
      requests_per_minute: 100
      
  - name: "Block Known Bad IPs"
    expression: 'ip.src in $bad_ip_list'
    action: "block"
    
  - name: "Challenge Suspicious Requests"
    expression: '(cf.threat_score gt 50) or (cf.bot_management.score lt 30)'
    action: "challenge"
```

### DDoS Protection
```java
@Component
public class DdosProtectionFilter implements Filter {
    
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    
    private static final int MAX_REQUESTS_PER_MINUTE = 60;
    private static final int MAX_REQUESTS_PER_HOUR = 1000;
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, 
                        FilterChain chain) throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        String clientIp = getClientIpAddress(httpRequest);
        
        if (isRateLimited(clientIp)) {
            httpResponse.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            httpResponse.getWriter().write("Rate limit exceeded");
            return;
        }
        
        // Record request
        recordRequest(clientIp);
        
        chain.doFilter(request, response);
    }
    
    private boolean isRateLimited(String clientIp) {
        String minuteKey = "rate_limit:minute:" + clientIp + ":" + 
                          (System.currentTimeMillis() / 60000);
        String hourKey = "rate_limit:hour:" + clientIp + ":" + 
                        (System.currentTimeMillis() / 3600000);
        
        Long minuteCount = redisTemplate.opsForValue().increment(minuteKey);
        Long hourCount = redisTemplate.opsForValue().increment(hourKey);
        
        // Set expiration for keys
        redisTemplate.expire(minuteKey, 60, TimeUnit.SECONDS);
        redisTemplate.expire(hourKey, 3600, TimeUnit.SECONDS);
        
        return minuteCount > MAX_REQUESTS_PER_MINUTE || 
               hourCount > MAX_REQUESTS_PER_HOUR;
    }
}
```

## 📋 Compliance & Standards

### GDPR Compliance
```java
@Service
public class GdprComplianceService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    public PersonalDataExport exportUserData(String userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found"));
        
        // Collect all personal data
        PersonalDataExport export = PersonalDataExport.builder()
            .userId(userId)
            .exportDate(LocalDateTime.now())
            .personalInfo(user.getPersonalInfo())
            .urls(urlRepository.findByUserId(userId))
            .analytics(analyticsRepository.findByUserId(userId))
            .auditLogs(auditLogRepository.findByUserId(userId))
            .build();
        
        // Log data export
        auditService.logDataExport(userId, "GDPR data export requested");
        
        return export;
    }
    
    public void deleteUserData(String userId, String reason) {
        // Verify user consent for deletion
        if (!hasValidDeletionConsent(userId)) {
            throw new IllegalStateException("No valid deletion consent found");
        }
        
        // Anonymize or delete personal data
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UserNotFoundException("User not found"));
        
        // Anonymize user data
        user.setEmail("deleted-user-" + userId + "@anonymized.com");
        user.setName("Deleted User");
        user.setPhoneNumber(null);
        user.setAddress(null);
        user.setDeletedAt(LocalDateTime.now());
        user.setDeletionReason(reason);
        
        userRepository.save(user);
        
        // Delete or anonymize related data
        anonymizeUserUrls(userId);
        anonymizeUserAnalytics(userId);
        
        // Log deletion
        auditService.logDataDeletion(userId, reason);
    }
    
    public ConsentRecord recordConsent(String userId, ConsentType consentType, 
                                     boolean granted, String legalBasis) {
        ConsentRecord consent = ConsentRecord.builder()
            .userId(userId)
            .consentType(consentType)
            .granted(granted)
            .legalBasis(legalBasis)
            .timestamp(LocalDateTime.now())
            .ipAddress(getCurrentUserIpAddress())
            .userAgent(getCurrentUserAgent())
            .build();
        
        return consentRepository.save(consent);
    }
}
```

### SOC 2 Compliance
```java
@Service
public class Soc2ComplianceService {
    
    // Trust Service Criteria: Security
    public SecurityControlsReport generateSecurityControlsReport() {
        return SecurityControlsReport.builder()
            .accessControls(assessAccessControls())
            .logicalPhysicalAccess(assessLogicalPhysicalAccess())
            .systemOperations(assessSystemOperations())
            .changeManagement(assessChangeManagement())
            .riskMitigation(assessRiskMitigation())
            .build();
    }
    
    // Trust Service Criteria: Availability
    public AvailabilityReport generateAvailabilityReport() {
        return AvailabilityReport.builder()
            .systemUptime(calculateSystemUptime())
            .performanceMetrics(getPerformanceMetrics())
            .capacityPlanning(getCapacityPlanningData())
            .incidentResponse(getIncidentResponseMetrics())
            .build();
    }
    
    // Trust Service Criteria: Processing Integrity
    public ProcessingIntegrityReport generateProcessingIntegrityReport() {
        return ProcessingIntegrityReport.builder()
            .dataValidation(assessDataValidation())
            .errorHandling(assessErrorHandling())
            .dataProcessingControls(assessDataProcessingControls())
            .build();
    }
    
    // Trust Service Criteria: Confidentiality
    public ConfidentialityReport generateConfidentialityReport() {
        return ConfidentialityReport.builder()
            .dataClassification(getDataClassificationStatus())
            .encryptionControls(assessEncryptionControls())
            .accessRestrictions(assessAccessRestrictions())
            .dataRetention(getDataRetentionPolicies())
            .build();
    }
    
    // Trust Service Criteria: Privacy
    public PrivacyReport generatePrivacyReport() {
        return PrivacyReport.builder()
            .dataCollection(assessDataCollection())
            .dataUsage(assessDataUsage())
            .dataRetention(assessDataRetention())
            .dataDisposal(assessDataDisposal())
            .consentManagement(assessConsentManagement())
            .build();
    }
}
```

## 🔧 Security Configuration

### Security Headers Configuration
```java
@Configuration
@EnableWebSecurity
public class SecurityHeadersConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.headers(headers -> headers
            .frameOptions().deny()
            .contentTypeOptions().and()
            .httpStrictTransportSecurity(hsts -> hsts
                .maxAgeInSeconds(31536000)
                .includeSubdomains(true)
                .preload(true)
            )
            .contentSecurityPolicy("default-src 'self'; " +
                                 "script-src 'self' 'unsafe-inline' https://cdn.bitaurl.com; " +
                                 "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                                 "font-src 'self' https://fonts.gstatic.com; " +
                                 "img-src 'self' data: https:; " +
                                 "connect-src 'self' https://api.bitaurl.com")
            .and()
            .referrerPolicy(ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
            .addHeaderWriter(new StaticHeadersWriter("X-XSS-Protection", "1; mode=block"))
            .addHeaderWriter(new StaticHeadersWriter("Permissions-Policy", 
                "geolocation=(), microphone=(), camera=()"))
        );
        
        return http.build();
    }
}
```

### CORS Configuration
```java
@Configuration
public class CorsConfig {
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Allowed origins (whitelist)
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "https://*.bitaurl.com",
            "https://localhost:3000", // Development
            "https://localhost:3001"  // Admin panel development
        ));
        
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "OPTIONS"
        ));
        
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization", "Content-Type", "X-Requested-With", 
            "Accept", "Origin", "Access-Control-Request-Method",
            "Access-Control-Request-Headers"
        ));
        
        configuration.setExposedHeaders(Arrays.asList(
            "X-RateLimit-Limit", "X-RateLimit-Remaining", 
            "X-RateLimit-Reset", "X-Total-Count"
        ));
        
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        
        return source;
    }
}
```

---

This security documentation provides comprehensive guidance for implementing, maintaining, and monitoring security measures in the BitaURL platform. Regular security reviews, penetration testing, and compliance audits should be conducted to ensure ongoing security effectiveness.