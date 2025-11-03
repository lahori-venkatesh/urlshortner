# BitaURL - Backend Documentation

## 🎯 Overview

The BitaURL backend is a robust Spring Boot application designed for high-performance URL shortening, comprehensive analytics, and enterprise-grade features. Built with Java 17 and Spring Boot 3.x, it provides a scalable, secure, and maintainable foundation for the BitaURL platform.

## 🏗️ Architecture

### Technology Stack
- **Java 17** - Latest LTS version with modern language features
- **Spring Boot 3.x** - Enterprise application framework
- **Spring Security 6** - Authentication and authorization
- **Spring Data MongoDB** - Database abstraction layer
- **Spring Cache** - Caching abstraction with Redis
- **JWT** - Stateless authentication tokens
- **Maven** - Dependency management and build tool
- **OpenAPI 3.0** - API documentation with Swagger

### Project Structure
```
backend/
├── src/main/java/com/urlshortener/
│   ├── UrlShortenerApplication.java
│   ├── config/                 # Configuration classes
│   │   ├── SecurityConfig.java
│   │   ├── MongoConfig.java
│   │   ├── RedisConfig.java
│   │   ├── CorsConfig.java
│   │   └── SwaggerConfig.java
│   ├── controller/             # REST controllers
│   │   ├── AuthController.java
│   │   ├── UrlController.java
│   │   ├── QrController.java
│   │   ├── FileController.java
│   │   ├── TeamController.java
│   │   ├── DomainController.java
│   │   ├── AnalyticsController.java
│   │   ├── AdminController.java
│   │   └── SupportController.java
│   ├── service/                # Business logic layer
│   │   ├── AuthService.java
│   │   ├── UserService.java
│   │   ├── UrlService.java
│   │   ├── QrService.java
│   │   ├── FileService.java
│   │   ├── TeamService.java
│   │   ├── DomainService.java
│   │   ├── AnalyticsService.java
│   │   ├── PaymentService.java
│   │   ├── NotificationService.java
│   │   └── AuditService.java
│   ├── repository/             # Data access layer
│   │   ├── UserRepository.java
│   │   ├── UrlRepository.java
│   │   ├── QrRepository.java
│   │   ├── FileRepository.java
│   │   ├── TeamRepository.java
│   │   ├── DomainRepository.java
│   │   ├── AnalyticsRepository.java
│   │   └── AuditLogRepository.java
│   ├── model/                  # Entity classes
│   │   ├── User.java
│   │   ├── Url.java
│   │   ├── QrCode.java
│   │   ├── FileUpload.java
│   │   ├── Team.java
│   │   ├── Domain.java
│   │   ├── Analytics.java
│   │   ├── Payment.java
│   │   └── AuditLog.java
│   ├── dto/                    # Data Transfer Objects
│   │   ├── request/
│   │   └── response/
│   ├── security/               # Security components
│   │   ├── JwtUtil.java
│   │   ├── JwtAuthenticationFilter.java
│   │   ├── CustomUserDetailsService.java
│   │   └── SecurityUtils.java
│   ├── exception/              # Exception handling
│   │   ├── GlobalExceptionHandler.java
│   │   ├── CustomExceptions.java
│   │   └── ErrorResponse.java
│   ├── util/                   # Utility classes
│   │   ├── ShortCodeGenerator.java
│   │   ├── QrCodeGenerator.java
│   │   ├── FileUtils.java
│   │   └── ValidationUtils.java
│   └── aspect/                 # Cross-cutting concerns
│       ├── LoggingAspect.java
│       ├── AuditAspect.java
│       └── RateLimitAspect.java
├── src/main/resources/
│   ├── application.yml
│   ├── application-dev.yml
│   ├── application-prod.yml
│   └── static/
└── src/test/java/
    ├── integration/
    ├── unit/
    └── TestConfiguration.java
```

## 🔐 Security Architecture

### Authentication & Authorization

#### JWT Implementation
```java
@Component
public class JwtUtil {
    private static final String SECRET_KEY = "your-secret-key";
    private static final int ACCESS_TOKEN_VALIDITY = 15 * 60 * 1000; // 15 minutes
    private static final int REFRESH_TOKEN_VALIDITY = 7 * 24 * 60 * 60 * 1000; // 7 days
    
    public String generateAccessToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", userDetails.getAuthorities());
        return createToken(claims, userDetails.getUsername(), ACCESS_TOKEN_VALIDITY);
    }
    
    public String generateRefreshToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        return createToken(claims, userDetails.getUsername(), REFRESH_TOKEN_VALIDITY);
    }
    
    private String createToken(Map<String, Object> claims, String subject, int validity) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + validity))
                .signWith(SignatureAlgorithm.HS512, SECRET_KEY)
                .compact();
    }
    
    public Boolean validateToken(String token, UserDetails userDetails) {
        final String username = getUsernameFromToken(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }
}
```

#### Security Configuration
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {
    
    @Autowired
    private JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers("/api/v1/public/**").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/v1/urls/**").authenticated()
                .requestMatchers(HttpMethod.POST, "/api/v1/urls/**").authenticated()
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
```

#### Role-Based Access Control
```java
public enum UserRole {
    SUPER_ADMIN("SUPER_ADMIN", 1, Arrays.asList("*")),
    ADMIN("ADMIN", 2, Arrays.asList("users:*", "urls:*", "teams:*", "analytics:*")),
    SUPPORT_ADMIN("SUPPORT_ADMIN", 3, Arrays.asList("users:read", "support:*", "tickets:*")),
    BILLING_ADMIN("BILLING_ADMIN", 4, Arrays.asList("billing:*", "payments:*", "subscriptions:*")),
    TECH_ADMIN("TECH_ADMIN", 5, Arrays.asList("system:*", "logs:*", "monitoring:*")),
    CONTENT_MODERATOR("CONTENT_MODERATOR", 6, Arrays.asList("urls:read", "urls:moderate", "qr:read")),
    AUDITOR("AUDITOR", 7, Arrays.asList("audit:read", "logs:read", "analytics:read")),
    USER("USER", 8, Arrays.asList("urls:own", "qr:own", "files:own", "teams:member"));
    
    private final String displayName;
    private final int level;
    private final List<String> permissions;
}

// Method-level security
@PreAuthorize("hasPermission(#urlId, 'URL', 'READ')")
public UrlResponse getUrl(@PathVariable String urlId) {
    // Implementation
}

@PreAuthorize("hasRole('ADMIN') or @urlService.isOwner(#urlId, authentication.name)")
public void deleteUrl(@PathVariable String urlId) {
    // Implementation
}
```

## 🗄️ Data Layer

### Entity Models

#### User Entity
```java
@Document(collection = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    private String id;
    
    @Indexed(unique = true)
    @Email
    private String email;
    
    private String name;
    private String avatar;
    
    @Enumerated(EnumType.STRING)
    private UserRole role = UserRole.USER;
    
    @Enumerated(EnumType.STRING)
    private PlanType plan = PlanType.FREE;
    
    private String passwordHash;
    private boolean emailVerified = false;
    private boolean active = true;
    
    private UserSettings settings;
    private SubscriptionDetails subscription;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    // Getters and setters
}
```

#### URL Entity
```java
@Document(collection = "urls")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Url {
    @Id
    private String id;
    
    @Indexed(unique = true)
    private String shortCode;
    
    @NotBlank
    private String originalUrl;
    
    private String userId;
    private String teamId;
    
    private String title;
    private String description;
    private List<String> tags;
    
    private String customDomain;
    private String customAlias;
    
    private LocalDateTime expiresAt;
    private boolean isActive = true;
    private boolean isPublic = false;
    
    private UrlSettings settings;
    private UrlAnalytics analytics;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
}
```

#### Analytics Entity
```java
@Document(collection = "analytics")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Analytics {
    @Id
    private String id;
    
    private String urlId;
    private String userId;
    
    private String ipAddress;
    private String userAgent;
    private String referer;
    
    private GeoLocation location;
    private DeviceInfo device;
    private BrowserInfo browser;
    
    private LocalDateTime timestamp;
    
    @Data
    public static class GeoLocation {
        private String country;
        private String region;
        private String city;
        private Double latitude;
        private Double longitude;
    }
    
    @Data
    public static class DeviceInfo {
        private String type; // mobile, desktop, tablet
        private String os;
        private String osVersion;
    }
    
    @Data
    public static class BrowserInfo {
        private String name;
        private String version;
    }
}
```

### Repository Layer

#### Custom Repository Implementation
```java
@Repository
public interface UrlRepository extends MongoRepository<Url, String>, UrlRepositoryCustom {
    
    @Query("{ 'shortCode': ?0, 'isActive': true }")
    Optional<Url> findByShortCodeAndActive(String shortCode);
    
    @Query("{ 'userId': ?0, 'isActive': true }")
    Page<Url> findByUserIdAndActive(String userId, Pageable pageable);
    
    @Query("{ 'teamId': ?0, 'isActive': true }")
    List<Url> findByTeamIdAndActive(String teamId);
    
    @Aggregation(pipeline = {
        "{ '$match': { 'userId': ?0, 'createdAt': { '$gte': ?1 } } }",
        "{ '$group': { '_id': null, 'totalClicks': { '$sum': '$analytics.totalClicks' } } }"
    })
    Long getTotalClicksByUserAndDateRange(String userId, LocalDateTime fromDate);
}

public interface UrlRepositoryCustom {
    List<Url> findUrlsWithFilters(UrlSearchCriteria criteria);
    AnalyticsReport generateAnalyticsReport(String userId, LocalDateTime from, LocalDateTime to);
}

@Component
public class UrlRepositoryCustomImpl implements UrlRepositoryCustom {
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    @Override
    public List<Url> findUrlsWithFilters(UrlSearchCriteria criteria) {
        Query query = new Query();
        
        if (criteria.getUserId() != null) {
            query.addCriteria(Criteria.where("userId").is(criteria.getUserId()));
        }
        
        if (criteria.getKeyword() != null) {
            Criteria keywordCriteria = new Criteria().orOperator(
                Criteria.where("title").regex(criteria.getKeyword(), "i"),
                Criteria.where("originalUrl").regex(criteria.getKeyword(), "i")
            );
            query.addCriteria(keywordCriteria);
        }
        
        if (criteria.getFromDate() != null) {
            query.addCriteria(Criteria.where("createdAt").gte(criteria.getFromDate()));
        }
        
        query.with(Sort.by(Sort.Direction.DESC, "createdAt"));
        
        return mongoTemplate.find(query, Url.class);
    }
}
```

## 🔧 Service Layer

### URL Service Implementation
```java
@Service
@Transactional
@Slf4j
public class UrlService {
    
    @Autowired
    private UrlRepository urlRepository;
    
    @Autowired
    private AnalyticsService analyticsService;
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    @Autowired
    private PlanPolicyService planPolicyService;
    
    private static final String URL_CACHE_PREFIX = "url:";
    private static final int CACHE_TTL = 3600; // 1 hour
    
    public UrlResponse createUrl(CreateUrlRequest request, String userId) {
        // Validate plan limits
        planPolicyService.validateUrlCreation(userId);
        
        // Generate short code
        String shortCode = generateUniqueShortCode(request.getCustomAlias());
        
        // Create URL entity
        Url url = Url.builder()
                .shortCode(shortCode)
                .originalUrl(request.getOriginalUrl())
                .userId(userId)
                .teamId(request.getTeamId())
                .title(request.getTitle())
                .description(request.getDescription())
                .tags(request.getTags())
                .expiresAt(request.getExpiresAt())
                .settings(request.getSettings())
                .build();
        
        // Save to database
        Url savedUrl = urlRepository.save(url);
        
        // Cache the URL for fast redirects
        cacheUrl(savedUrl);
        
        // Log audit event
        auditService.logUrlCreation(userId, savedUrl.getId());
        
        return UrlResponse.from(savedUrl);
    }
    
    public RedirectResponse handleRedirect(String shortCode, HttpServletRequest request) {
        // Try cache first
        Url url = getCachedUrl(shortCode);
        
        if (url == null) {
            // Fallback to database
            url = urlRepository.findByShortCodeAndActive(shortCode)
                    .orElseThrow(() -> new UrlNotFoundException("URL not found"));
            
            // Cache for future requests
            cacheUrl(url);
        }
        
        // Check expiration
        if (url.getExpiresAt() != null && url.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new UrlExpiredException("URL has expired");
        }
        
        // Record analytics asynchronously
        analyticsService.recordClick(url.getId(), request);
        
        return RedirectResponse.builder()
                .originalUrl(url.getOriginalUrl())
                .shortCode(shortCode)
                .build();
    }
    
    private String generateUniqueShortCode(String customAlias) {
        if (customAlias != null && !customAlias.isEmpty()) {
            if (urlRepository.findByShortCodeAndActive(customAlias).isPresent()) {
                throw new DuplicateShortCodeException("Custom alias already exists");
            }
            return customAlias;
        }
        
        String shortCode;
        int attempts = 0;
        do {
            shortCode = ShortCodeGenerator.generate();
            attempts++;
            if (attempts > 10) {
                throw new ShortCodeGenerationException("Failed to generate unique short code");
            }
        } while (urlRepository.findByShortCodeAndActive(shortCode).isPresent());
        
        return shortCode;
    }
    
    @Cacheable(value = "urls", key = "#shortCode")
    private Url getCachedUrl(String shortCode) {
        return (Url) redisTemplate.opsForValue().get(URL_CACHE_PREFIX + shortCode);
    }
    
    private void cacheUrl(Url url) {
        redisTemplate.opsForValue().set(
            URL_CACHE_PREFIX + url.getShortCode(), 
            url, 
            CACHE_TTL, 
            TimeUnit.SECONDS
        );
    }
}
```

### Analytics Service Implementation
```java
@Service
@Async
@Slf4j
public class AnalyticsService {
    
    @Autowired
    private AnalyticsRepository analyticsRepository;
    
    @Autowired
    private GeoLocationService geoLocationService;
    
    @Autowired
    private UserAgentParser userAgentParser;
    
    @EventListener
    @Async
    public void recordClick(String urlId, HttpServletRequest request) {
        try {
            Analytics analytics = Analytics.builder()
                    .urlId(urlId)
                    .ipAddress(getClientIpAddress(request))
                    .userAgent(request.getHeader("User-Agent"))
                    .referer(request.getHeader("Referer"))
                    .location(geoLocationService.getLocation(getClientIpAddress(request)))
                    .device(userAgentParser.parseDevice(request.getHeader("User-Agent")))
                    .browser(userAgentParser.parseBrowser(request.getHeader("User-Agent")))
                    .timestamp(LocalDateTime.now())
                    .build();
            
            analyticsRepository.save(analytics);
            
            // Update URL click count
            updateUrlClickCount(urlId);
            
        } catch (Exception e) {
            log.error("Failed to record analytics for URL: {}", urlId, e);
        }
    }
    
    public AnalyticsReport generateReport(String urlId, LocalDateTime from, LocalDateTime to) {
        List<Analytics> analytics = analyticsRepository.findByUrlIdAndTimestampBetween(urlId, from, to);
        
        return AnalyticsReport.builder()
                .totalClicks(analytics.size())
                .uniqueClicks(getUniqueClicks(analytics))
                .clicksByCountry(groupByCountry(analytics))
                .clicksByDevice(groupByDevice(analytics))
                .clicksByBrowser(groupByBrowser(analytics))
                .clicksOverTime(groupByTime(analytics))
                .topReferrers(getTopReferrers(analytics))
                .build();
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
```

## 🎮 Controller Layer

### URL Controller
```java
@RestController
@RequestMapping("/api/v1/urls")
@Validated
@Slf4j
public class UrlController {
    
    @Autowired
    private UrlService urlService;
    
    @PostMapping
    @PreAuthorize("hasAuthority('urls:create')")
    public ResponseEntity<ApiResponse<UrlResponse>> createUrl(
            @Valid @RequestBody CreateUrlRequest request,
            Authentication authentication) {
        
        String userId = authentication.getName();
        UrlResponse response = urlService.createUrl(request, userId);
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping
    @PreAuthorize("hasAuthority('urls:read')")
    public ResponseEntity<ApiResponse<PagedResponse<UrlResponse>>> getUrls(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String teamId,
            Authentication authentication) {
        
        String userId = authentication.getName();
        PagedResponse<UrlResponse> response = urlService.getUrls(userId, page, size, keyword, teamId);
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('urls:read') and @urlService.hasAccess(#id, authentication.name)")
    public ResponseEntity<ApiResponse<UrlResponse>> getUrl(@PathVariable String id) {
        UrlResponse response = urlService.getUrl(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('urls:update') and @urlService.isOwner(#id, authentication.name)")
    public ResponseEntity<ApiResponse<UrlResponse>> updateUrl(
            @PathVariable String id,
            @Valid @RequestBody UpdateUrlRequest request) {
        
        UrlResponse response = urlService.updateUrl(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('urls:delete') and @urlService.isOwner(#id, authentication.name)")
    public ResponseEntity<ApiResponse<Void>> deleteUrl(@PathVariable String id) {
        urlService.deleteUrl(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
    
    @GetMapping("/{id}/analytics")
    @PreAuthorize("hasAuthority('analytics:read') and @urlService.hasAccess(#id, authentication.name)")
    public ResponseEntity<ApiResponse<AnalyticsReport>> getAnalytics(
            @PathVariable String id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        
        AnalyticsReport report = analyticsService.generateReport(id, from, to);
        return ResponseEntity.ok(ApiResponse.success(report));
    }
}
```

### Public Redirect Controller
```java
@RestController
@RequestMapping("/api/v1/public")
@Slf4j
public class PublicController {
    
    @Autowired
    private UrlService urlService;
    
    @GetMapping("/{shortCode}")
    public ResponseEntity<Void> redirect(
            @PathVariable String shortCode,
            HttpServletRequest request) {
        
        RedirectResponse redirectResponse = urlService.handleRedirect(shortCode, request);
        
        return ResponseEntity.status(HttpStatus.MOVED_PERMANENTLY)
                .location(URI.create(redirectResponse.getOriginalUrl()))
                .build();
    }
    
    @GetMapping("/{shortCode}/preview")
    public ResponseEntity<ApiResponse<UrlPreview>> preview(@PathVariable String shortCode) {
        UrlPreview preview = urlService.getUrlPreview(shortCode);
        return ResponseEntity.ok(ApiResponse.success(preview));
    }
    
    @GetMapping("/{shortCode}/qr")
    public ResponseEntity<byte[]> getQrCode(
            @PathVariable String shortCode,
            @RequestParam(defaultValue = "200") int size) {
        
        byte[] qrCode = qrService.generateQrCode(shortCode, size);
        
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(qrCode);
    }
}
```

## 🔧 Configuration

### Application Configuration
```yaml
# application.yml
spring:
  application:
    name: bitaurl-backend
  
  data:
    mongodb:
      uri: ${MONGODB_URI:mongodb://localhost:27017/bitaurl}
      auto-index-creation: true
  
  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
    password: ${REDIS_PASSWORD:}
    timeout: 2000ms
    lettuce:
      pool:
        max-active: 8
        max-idle: 8
        min-idle: 0
  
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            scope: openid,profile,email
  
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB

server:
  port: ${PORT:8080}
  compression:
    enabled: true
  error:
    include-stacktrace: never

logging:
  level:
    com.urlshortener: ${LOG_LEVEL:INFO}
    org.springframework.security: DEBUG
  pattern:
    console: "%d{yyyy-MM-dd HH:mm:ss} - %msg%n"
    file: "%d{yyyy-MM-dd HH:mm:ss} [%thread] %-5level %logger{36} - %msg%n"

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: always

app:
  jwt:
    secret: ${JWT_SECRET:your-secret-key}
    access-token-expiration: 900000  # 15 minutes
    refresh-token-expiration: 604800000  # 7 days
  
  cors:
    allowed-origins: ${ALLOWED_ORIGINS:http://localhost:3000,http://localhost:3001}
    allowed-methods: GET,POST,PUT,DELETE,OPTIONS
    allowed-headers: "*"
  
  rate-limit:
    requests-per-minute: ${RATE_LIMIT:100}
    burst-capacity: ${BURST_CAPACITY:200}
  
  file-storage:
    provider: ${STORAGE_PROVIDER:s3}
    s3:
      bucket: ${S3_BUCKET:bitaurl-files}
      region: ${S3_REGION:us-east-1}
      access-key: ${S3_ACCESS_KEY}
      secret-key: ${S3_SECRET_KEY}
  
  payment:
    razorpay:
      key-id: ${RAZORPAY_KEY_ID}
      key-secret: ${RAZORPAY_KEY_SECRET}
      webhook-secret: ${RAZORPAY_WEBHOOK_SECRET}
  
  notification:
    email:
      provider: sendgrid
      sendgrid:
        api-key: ${SENDGRID_API_KEY}
        from-email: ${FROM_EMAIL:noreply@bitaurl.com}
```

### Production Configuration
```yaml
# application-prod.yml
spring:
  data:
    mongodb:
      uri: ${MONGODB_URI}
  
  redis:
    host: ${REDIS_HOST}
    port: ${REDIS_PORT}
    password: ${REDIS_PASSWORD}
    ssl: true

logging:
  level:
    root: WARN
    com.urlshortener: INFO
  file:
    name: /var/log/bitaurl/application.log

server:
  forward-headers-strategy: native
  tomcat:
    remoteip:
      remote-ip-header: x-forwarded-for
      protocol-header: x-forwarded-proto

management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
```

## 🧪 Testing Strategy

### Unit Testing
```java
@ExtendWith(MockitoExtension.class)
class UrlServiceTest {
    
    @Mock
    private UrlRepository urlRepository;
    
    @Mock
    private AnalyticsService analyticsService;
    
    @Mock
    private PlanPolicyService planPolicyService;
    
    @InjectMocks
    private UrlService urlService;
    
    @Test
    void createUrl_ShouldReturnUrlResponse_WhenValidRequest() {
        // Given
        CreateUrlRequest request = CreateUrlRequest.builder()
                .originalUrl("https://example.com")
                .title("Test URL")
                .build();
        
        String userId = "user123";
        
        Url savedUrl = Url.builder()
                .id("url123")
                .shortCode("abc123")
                .originalUrl("https://example.com")
                .userId(userId)
                .build();
        
        when(urlRepository.save(any(Url.class))).thenReturn(savedUrl);
        
        // When
        UrlResponse response = urlService.createUrl(request, userId);
        
        // Then
        assertThat(response.getId()).isEqualTo("url123");
        assertThat(response.getShortCode()).isEqualTo("abc123");
        assertThat(response.getOriginalUrl()).isEqualTo("https://example.com");
        
        verify(planPolicyService).validateUrlCreation(userId);
        verify(urlRepository).save(any(Url.class));
    }
    
    @Test
    void createUrl_ShouldThrowException_WhenPlanLimitExceeded() {
        // Given
        CreateUrlRequest request = CreateUrlRequest.builder()
                .originalUrl("https://example.com")
                .build();
        
        String userId = "user123";
        
        doThrow(new PlanLimitExceededException("URL limit exceeded"))
                .when(planPolicyService).validateUrlCreation(userId);
        
        // When & Then
        assertThatThrownBy(() -> urlService.createUrl(request, userId))
                .isInstanceOf(PlanLimitExceededException.class)
                .hasMessage("URL limit exceeded");
    }
}
```

### Integration Testing
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(locations = "classpath:application-test.yml")
@Testcontainers
class UrlControllerIntegrationTest {
    
    @Container
    static MongoDBContainer mongoDBContainer = new MongoDBContainer("mongo:6.0")
            .withExposedPorts(27017);
    
    @Container
    static GenericContainer<?> redisContainer = new GenericContainer<>("redis:7-alpine")
            .withExposedPorts(6379);
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Autowired
    private UrlRepository urlRepository;
    
    @Test
    void createUrl_ShouldReturn201_WhenValidRequest() {
        // Given
        CreateUrlRequest request = CreateUrlRequest.builder()
                .originalUrl("https://example.com")
                .title("Test URL")
                .build();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(getValidJwtToken());
        HttpEntity<CreateUrlRequest> entity = new HttpEntity<>(request, headers);
        
        // When
        ResponseEntity<ApiResponse<UrlResponse>> response = restTemplate.exchange(
                "/api/v1/urls",
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<ApiResponse<UrlResponse>>() {}
        );
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData().getOriginalUrl()).isEqualTo("https://example.com");
        
        // Verify database
        Optional<Url> savedUrl = urlRepository.findByShortCodeAndActive(
                response.getBody().getData().getShortCode()
        );
        assertThat(savedUrl).isPresent();
    }
}
```

## 📊 Monitoring & Observability

### Custom Metrics
```java
@Component
public class UrlMetrics {
    
    private final Counter urlCreationCounter;
    private final Counter urlRedirectCounter;
    private final Timer urlRedirectTimer;
    private final Gauge activeUrlsGauge;
    
    public UrlMetrics(MeterRegistry meterRegistry, UrlRepository urlRepository) {
        this.urlCreationCounter = Counter.builder("urls.created.total")
                .description("Total number of URLs created")
                .register(meterRegistry);
        
        this.urlRedirectCounter = Counter.builder("urls.redirects.total")
                .description("Total number of URL redirects")
                .register(meterRegistry);
        
        this.urlRedirectTimer = Timer.builder("urls.redirect.duration")
                .description("URL redirect response time")
                .register(meterRegistry);
        
        this.activeUrlsGauge = Gauge.builder("urls.active.count")
                .description("Number of active URLs")
                .register(meterRegistry, this, UrlMetrics::getActiveUrlCount);
    }
    
    public void incrementUrlCreation() {
        urlCreationCounter.increment();
    }
    
    public void recordRedirect(Duration duration) {
        urlRedirectCounter.increment();
        urlRedirectTimer.record(duration);
    }
    
    private double getActiveUrlCount() {
        return urlRepository.countByIsActiveTrue();
    }
}
```

### Health Checks
```java
@Component
public class CustomHealthIndicator implements HealthIndicator {
    
    @Autowired
    private UrlRepository urlRepository;
    
    @Autowired
    private RedisTemplate<String, Object> redisTemplate;
    
    @Override
    public Health health() {
        try {
            // Check database connectivity
            urlRepository.count();
            
            // Check Redis connectivity
            redisTemplate.opsForValue().get("health-check");
            
            return Health.up()
                    .withDetail("database", "Available")
                    .withDetail("cache", "Available")
                    .build();
                    
        } catch (Exception e) {
            return Health.down()
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}
```

## 🚀 Performance Optimization

### Caching Strategy
```java
@Configuration
@EnableCaching
public class CacheConfig {
    
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(1))
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()));
        
        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(config)
                .build();
    }
}

// Service with caching
@Service
public class UrlService {
    
    @Cacheable(value = "urls", key = "#shortCode")
    public Url findByShortCode(String shortCode) {
        return urlRepository.findByShortCodeAndActive(shortCode)
                .orElseThrow(() -> new UrlNotFoundException("URL not found"));
    }
    
    @CacheEvict(value = "urls", key = "#url.shortCode")
    public void updateUrl(Url url) {
        urlRepository.save(url);
    }
}
```

### Database Optimization
```java
@Configuration
public class MongoConfig {
    
    @EventListener
    public void initIndicesAfterStartup(ContextRefreshedEvent event) {
        MongoTemplate mongoTemplate = event.getApplicationContext().getBean(MongoTemplate.class);
        
        // Create indexes for better performance
        mongoTemplate.indexOps(Url.class)
                .ensureIndex(new Index().on("shortCode", Sort.Direction.ASC).unique());
        
        mongoTemplate.indexOps(Url.class)
                .ensureIndex(new Index().on("userId", Sort.Direction.ASC)
                        .on("createdAt", Sort.Direction.DESC));
        
        mongoTemplate.indexOps(Analytics.class)
                .ensureIndex(new Index().on("urlId", Sort.Direction.ASC)
                        .on("timestamp", Sort.Direction.DESC));
    }
}
```

---

This backend documentation provides comprehensive guidance for developing, maintaining, and scaling the BitaURL Spring Boot application. For specific implementation details, refer to the source code and inline documentation.