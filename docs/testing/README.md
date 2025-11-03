# BitaURL - Testing Documentation

## 🎯 Testing Strategy Overview

BitaURL implements a comprehensive testing strategy following the testing pyramid approach, ensuring high code quality, reliability, and maintainability. Our testing framework covers unit tests, integration tests, end-to-end tests, performance tests, and security tests across all application layers.

## 🏗️ Testing Architecture

### Testing Pyramid
```
                    ┌─────────────────┐
                    │   E2E Tests     │  ← Few, Slow, Expensive
                    │   (Cypress)     │
                    └─────────────────┘
                  ┌───────────────────────┐
                  │  Integration Tests    │  ← Some, Medium Speed
                  │  (Spring Boot Test)   │
                  └───────────────────────┘
              ┌─────────────────────────────────┐
              │        Unit Tests               │  ← Many, Fast, Cheap
              │  (JUnit, Jest, React Testing)  │
              └─────────────────────────────────┘
```

### Testing Principles
- **Fast Feedback** - Tests run quickly to provide immediate feedback
- **Reliable** - Tests are deterministic and don't produce false positives
- **Maintainable** - Tests are easy to understand and modify
- **Comprehensive** - Critical paths and edge cases are covered
- **Isolated** - Tests don't depend on external services or state

## 🧪 Backend Testing (Spring Boot)

### Unit Testing Framework

#### Test Configuration
```java
// src/test/java/com/urlshortener/TestConfiguration.java
@TestConfiguration
@EnableConfigurationProperties
public class TestConfig {
    
    @Bean
    @Primary
    public Clock testClock() {
        return Clock.fixed(Instant.parse("2024-01-30T10:15:30Z"), ZoneOffset.UTC);
    }
    
    @Bean
    @Primary
    public PasswordEncoder testPasswordEncoder() {
        // Use NoOp encoder for faster tests
        return NoOpPasswordEncoder.getInstance();
    }
}
```

#### Service Layer Unit Tests
```java
@ExtendWith(MockitoExtension.class)
class UrlServiceTest {
    
    @Mock
    private UrlRepository urlRepository;
    
    @Mock
    private AnalyticsService analyticsService;
    
    @Mock
    private PlanPolicyService planPolicyService;
    
    @Mock
    private ShortCodeGenerator shortCodeGenerator;
    
    @InjectMocks
    private UrlService urlService;
    
    @Test
    @DisplayName("Should create URL successfully with valid input")
    void createUrl_ShouldReturnUrlResponse_WhenValidInput() {
        // Given
        CreateUrlRequest request = CreateUrlRequest.builder()
            .originalUrl("https://example.com")
            .title("Test URL")
            .build();
        
        String userId = "user123";
        String shortCode = "abc123";
        
        when(shortCodeGenerator.generate()).thenReturn(shortCode);
        when(urlRepository.existsByShortCode(shortCode)).thenReturn(false);
        
        Url savedUrl = Url.builder()
            .id("url123")
            .shortCode(shortCode)
            .originalUrl("https://example.com")
            .userId(userId)
            .title("Test URL")
            .createdAt(LocalDateTime.now())
            .build();
        
        when(urlRepository.save(any(Url.class))).thenReturn(savedUrl);
        
        // When
        UrlResponse response = urlService.createUrl(request, userId);
        
        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo("url123");
        assertThat(response.getShortCode()).isEqualTo(shortCode);
        assertThat(response.getOriginalUrl()).isEqualTo("https://example.com");
        assertThat(response.getTitle()).isEqualTo("Test URL");
        
        verify(planPolicyService).validateUrlCreation(userId);
        verify(urlRepository).save(argThat(url -> 
            url.getShortCode().equals(shortCode) &&
            url.getOriginalUrl().equals("https://example.com") &&
            url.getUserId().equals(userId)
        ));
    }
    
    @Test
    @DisplayName("Should throw exception when plan limit exceeded")
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
        
        verify(urlRepository, never()).save(any());
    }
    
    @Test
    @DisplayName("Should handle duplicate short code generation")
    void createUrl_ShouldRetryShortCodeGeneration_WhenDuplicateExists() {
        // Given
        CreateUrlRequest request = CreateUrlRequest.builder()
            .originalUrl("https://example.com")
            .build();
        
        String userId = "user123";
        String firstCode = "abc123";
        String secondCode = "def456";
        
        when(shortCodeGenerator.generate())
            .thenReturn(firstCode)
            .thenReturn(secondCode);
        
        when(urlRepository.existsByShortCode(firstCode)).thenReturn(true);
        when(urlRepository.existsByShortCode(secondCode)).thenReturn(false);
        
        Url savedUrl = Url.builder()
            .shortCode(secondCode)
            .originalUrl("https://example.com")
            .userId(userId)
            .build();
        
        when(urlRepository.save(any(Url.class))).thenReturn(savedUrl);
        
        // When
        UrlResponse response = urlService.createUrl(request, userId);
        
        // Then
        assertThat(response.getShortCode()).isEqualTo(secondCode);
        verify(shortCodeGenerator, times(2)).generate();
    }
}
```

#### Repository Layer Tests
```java
@DataMongoTest
@Import(TestConfig.class)
class UrlRepositoryTest {
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private UrlRepository urlRepository;
    
    @Test
    @DisplayName("Should find URL by short code and active status")
    void findByShortCodeAndActive_ShouldReturnUrl_WhenExists() {
        // Given
        Url url = Url.builder()
            .shortCode("abc123")
            .originalUrl("https://example.com")
            .userId("user123")
            .isActive(true)
            .build();
        
        entityManager.persistAndFlush(url);
        
        // When
        Optional<Url> result = urlRepository.findByShortCodeAndActive("abc123");
        
        // Then
        assertThat(result).isPresent();
        assertThat(result.get().getShortCode()).isEqualTo("abc123");
        assertThat(result.get().getOriginalUrl()).isEqualTo("https://example.com");
    }
    
    @Test
    @DisplayName("Should not find inactive URL by short code")
    void findByShortCodeAndActive_ShouldReturnEmpty_WhenInactive() {
        // Given
        Url url = Url.builder()
            .shortCode("abc123")
            .originalUrl("https://example.com")
            .userId("user123")
            .isActive(false)
            .build();
        
        entityManager.persistAndFlush(url);
        
        // When
        Optional<Url> result = urlRepository.findByShortCodeAndActive("abc123");
        
        // Then
        assertThat(result).isEmpty();
    }
    
    @Test
    @DisplayName("Should find URLs by user with pagination")
    void findByUserIdAndActive_ShouldReturnPagedResults() {
        // Given
        String userId = "user123";
        
        for (int i = 0; i < 25; i++) {
            Url url = Url.builder()
                .shortCode("code" + i)
                .originalUrl("https://example" + i + ".com")
                .userId(userId)
                .isActive(true)
                .createdAt(LocalDateTime.now().minusDays(i))
                .build();
            
            entityManager.persistAndFlush(url);
        }
        
        Pageable pageable = PageRequest.of(0, 10, Sort.by("createdAt").descending());
        
        // When
        Page<Url> result = urlRepository.findByUserIdAndActive(userId, pageable);
        
        // Then
        assertThat(result.getContent()).hasSize(10);
        assertThat(result.getTotalElements()).isEqualTo(25);
        assertThat(result.getTotalPages()).isEqualTo(3);
        
        // Verify sorting (most recent first)
        List<Url> urls = result.getContent();
        assertThat(urls.get(0).getShortCode()).isEqualTo("code0");
        assertThat(urls.get(1).getShortCode()).isEqualTo("code1");
    }
}
```

### Integration Testing

#### Web Layer Integration Tests
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
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
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    private String authToken;
    private User testUser;
    
    @BeforeEach
    void setUp() {
        // Clean database
        urlRepository.deleteAll();
        userRepository.deleteAll();
        
        // Create test user
        testUser = User.builder()
            .email("test@example.com")
            .name("Test User")
            .plan(PlanType.PRO)
            .role(UserRole.USER)
            .build();
        
        testUser = userRepository.save(testUser);
        
        // Generate auth token
        UserDetails userDetails = new CustomUserPrincipal(testUser);
        authToken = jwtUtil.generateAccessToken(userDetails);
    }
    
    @Test
    @DisplayName("Should create URL successfully with authentication")
    void createUrl_ShouldReturn201_WhenValidRequest() {
        // Given
        CreateUrlRequest request = CreateUrlRequest.builder()
            .originalUrl("https://example.com")
            .title("Test URL")
            .description("A test URL")
            .build();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(authToken);
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
        
        UrlResponse urlResponse = response.getBody().getData();
        assertThat(urlResponse.getOriginalUrl()).isEqualTo("https://example.com");
        assertThat(urlResponse.getTitle()).isEqualTo("Test URL");
        assertThat(urlResponse.getShortCode()).isNotBlank();
        assertThat(urlResponse.getShortUrl()).contains(urlResponse.getShortCode());
        
        // Verify database
        Optional<Url> savedUrl = urlRepository.findByShortCode(urlResponse.getShortCode());
        assertThat(savedUrl).isPresent();
        assertThat(savedUrl.get().getUserId()).isEqualTo(testUser.getId());
    }
    
    @Test
    @DisplayName("Should return 401 when no authentication provided")
    void createUrl_ShouldReturn401_WhenNoAuth() {
        // Given
        CreateUrlRequest request = CreateUrlRequest.builder()
            .originalUrl("https://example.com")
            .build();
        
        HttpEntity<CreateUrlRequest> entity = new HttpEntity<>(request);
        
        // When
        ResponseEntity<ApiResponse<UrlResponse>> response = restTemplate.exchange(
            "/api/v1/urls",
            HttpMethod.POST,
            entity,
            new ParameterizedTypeReference<ApiResponse<UrlResponse>>() {}
        );
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
    
    @Test
    @DisplayName("Should validate request body and return 400")
    void createUrl_ShouldReturn400_WhenInvalidRequest() {
        // Given
        CreateUrlRequest request = CreateUrlRequest.builder()
            .originalUrl("invalid-url")
            .build();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(authToken);
        HttpEntity<CreateUrlRequest> entity = new HttpEntity<>(request, headers);
        
        // When
        ResponseEntity<ApiResponse<UrlResponse>> response = restTemplate.exchange(
            "/api/v1/urls",
            HttpMethod.POST,
            entity,
            new ParameterizedTypeReference<ApiResponse<UrlResponse>>() {}
        );
        
        // Then
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().isSuccess()).isFalse();
        assertThat(response.getBody().getError().getCode()).isEqualTo("VALIDATION_ERROR");
    }
}
```

#### Database Integration Tests
```java
@SpringBootTest
@Testcontainers
class DatabaseIntegrationTest {
    
    @Container
    static MongoDBContainer mongoDBContainer = new MongoDBContainer("mongo:6.0");
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    @Test
    @DisplayName("Should perform complex aggregation query")
    void shouldPerformComplexAggregation() {
        // Given - Create test data
        String userId = "user123";
        
        for (int i = 0; i < 10; i++) {
            Url url = Url.builder()
                .shortCode("code" + i)
                .originalUrl("https://example" + i + ".com")
                .userId(userId)
                .isActive(true)
                .createdAt(LocalDateTime.now().minusDays(i))
                .build();
            
            mongoTemplate.save(url);
            
            // Create analytics data
            for (int j = 0; j < (i + 1) * 5; j++) {
                Analytics analytics = Analytics.builder()
                    .urlId(url.getId())
                    .userId(userId)
                    .ipAddress("192.168.1." + (j % 255))
                    .timestamp(LocalDateTime.now().minusHours(j))
                    .build();
                
                mongoTemplate.save(analytics);
            }
        }
        
        // When - Perform aggregation
        Aggregation aggregation = Aggregation.newAggregation(
            Aggregation.match(Criteria.where("userId").is(userId)),
            Aggregation.lookup("analytics", "_id", "urlId", "analytics"),
            Aggregation.project()
                .and("shortCode").as("shortCode")
                .and("originalUrl").as("originalUrl")
                .and("analytics").size().as("totalClicks"),
            Aggregation.sort(Sort.Direction.DESC, "totalClicks"),
            Aggregation.limit(5)
        );
        
        List<Document> results = mongoTemplate.aggregate(
            aggregation, "urls", Document.class
        ).getMappedResults();
        
        // Then
        assertThat(results).hasSize(5);
        
        // Verify sorting (highest clicks first)
        int previousClicks = Integer.MAX_VALUE;
        for (Document result : results) {
            int clicks = result.getInteger("totalClicks");
            assertThat(clicks).isLessThanOrEqualTo(previousClicks);
            previousClicks = clicks;
        }
    }
}
```

### Performance Testing

#### Load Testing with JMeter
```xml
<!-- performance-tests/load-test.jmx -->
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="BitaURL Load Test">
      <elementProp name="TestPlan.arguments" elementType="Arguments" guiclass="ArgumentsPanel">
        <collectionProp name="Arguments.arguments"/>
      </elementProp>
      <stringProp name="TestPlan.user_define_classpath"></stringProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
    </TestPlan>
    
    <hashTree>
      <!-- Thread Group for URL Creation -->
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="URL Creation Load">
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <stringProp name="LoopController.loops">100</stringProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">50</stringProp>
        <stringProp name="ThreadGroup.ramp_time">60</stringProp>
      </ThreadGroup>
      
      <hashTree>
        <!-- HTTP Request for URL Creation -->
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Create URL">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments">
            <collectionProp name="Arguments.arguments">
              <elementProp name="" elementType="HTTPArgument">
                <boolProp name="HTTPArgument.always_encode">false</boolProp>
                <stringProp name="Argument.value">{
                  "originalUrl": "https://example.com/test-${__Random(1,10000)}",
                  "title": "Load Test URL ${__Random(1,10000)}"
                }</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
          <stringProp name="HTTPSampler.domain">api.bitaurl.com</stringProp>
          <stringProp name="HTTPSampler.port">443</stringProp>
          <stringProp name="HTTPSampler.protocol">https</stringProp>
          <stringProp name="HTTPSampler.path">/api/v1/urls</stringProp>
          <stringProp name="HTTPSampler.method">POST</stringProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
        </HTTPSamplerProxy>
        
        <!-- Response Assertions -->
        <ResponseAssertion guiclass="AssertionGui" testclass="ResponseAssertion" testname="Response Assertion">
          <collectionProp name="Asserion.test_strings">
            <stringProp name="49586">200</stringProp>
          </collectionProp>
          <stringProp name="Assertion.test_field">Assertion.response_code</stringProp>
          <boolProp name="Assertion.assume_success">false</boolProp>
          <intProp name="Assertion.test_type">1</intProp>
        </ResponseAssertion>
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
```

#### Benchmark Tests
```java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MILLISECONDS)
@State(Scope.Benchmark)
@Warmup(iterations = 5, time = 1, timeUnit = TimeUnit.SECONDS)
@Measurement(iterations = 10, time = 1, timeUnit = TimeUnit.SECONDS)
@Fork(1)
public class UrlServiceBenchmark {
    
    private UrlService urlService;
    private CreateUrlRequest request;
    
    @Setup
    public void setup() {
        // Initialize service with mocked dependencies
        urlService = new UrlService(
            mock(UrlRepository.class),
            mock(AnalyticsService.class),
            mock(PlanPolicyService.class),
            new ShortCodeGenerator()
        );
        
        request = CreateUrlRequest.builder()
            .originalUrl("https://example.com")
            .title("Benchmark Test")
            .build();
    }
    
    @Benchmark
    public UrlResponse benchmarkUrlCreation() {
        return urlService.createUrl(request, "user123");
    }
    
    @Benchmark
    public String benchmarkShortCodeGeneration() {
        return new ShortCodeGenerator().generate();
    }
    
    public static void main(String[] args) throws Exception {
        Options opt = new OptionsBuilder()
            .include(UrlServiceBenchmark.class.getSimpleName())
            .build();
        
        new Runner(opt).run();
    }
}
```

## 🎭 Frontend Testing (React)

### Unit Testing with Jest & React Testing Library

#### Component Tests
```typescript
// src/components/UrlShortener.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UrlShortener } from './UrlShortener';
import { api } from '../services/api';

// Mock the API
jest.mock('../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe('UrlShortener Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form elements correctly', () => {
    render(<UrlShortener />);
    
    expect(screen.getByLabelText(/original url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /shorten url/i })).toBeInTheDocument();
  });

  it('should create short URL successfully', async () => {
    const user = userEvent.setup();
    const mockResponse = {
      id: 'url123',
      shortCode: 'abc123',
      shortUrl: 'https://bitaurl.com/abc123',
      originalUrl: 'https://example.com',
      title: 'Test URL'
    };

    mockedApi.createUrl.mockResolvedValue(mockResponse);

    render(<UrlShortener />);

    // Fill form
    await user.type(screen.getByLabelText(/original url/i), 'https://example.com');
    await user.type(screen.getByLabelText(/title/i), 'Test URL');

    // Submit form
    await user.click(screen.getByRole('button', { name: /shorten url/i }));

    // Wait for API call and result
    await waitFor(() => {
      expect(mockedApi.createUrl).toHaveBeenCalledWith({
        originalUrl: 'https://example.com',
        title: 'Test URL'
      });
    });

    // Check if result is displayed
    expect(screen.getByText('https://bitaurl.com/abc123')).toBeInTheDocument();
  });

  it('should show validation error for invalid URL', async () => {
    const user = userEvent.setup();

    render(<UrlShortener />);

    // Enter invalid URL
    await user.type(screen.getByLabelText(/original url/i), 'invalid-url');
    await user.click(screen.getByRole('button', { name: /shorten url/i }));

    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid url/i)).toBeInTheDocument();
    });

    // API should not be called
    expect(mockedApi.createUrl).not.toHaveBeenCalled();
  });

  it('should handle API error gracefully', async () => {
    const user = userEvent.setup();
    const errorMessage = 'URL limit exceeded';

    mockedApi.createUrl.mockRejectedValue(new Error(errorMessage));

    render(<UrlShortener />);

    await user.type(screen.getByLabelText(/original url/i), 'https://example.com');
    await user.click(screen.getByRole('button', { name: /shorten url/i }));

    await waitFor(() => {
      expect(screen.getByText(/url limit exceeded/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    const user = userEvent.setup();
    
    // Mock API to return a promise that doesn't resolve immediately
    mockedApi.createUrl.mockImplementation(() => new Promise(() => {}));

    render(<UrlShortener />);

    await user.type(screen.getByLabelText(/original url/i), 'https://example.com');
    await user.click(screen.getByRole('button', { name: /shorten url/i }));

    // Check loading state
    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
  });
});
```

#### Hook Tests
```typescript
// src/hooks/useUrls.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUrls } from './useUrls';
import { api } from '../services/api';

jest.mock('../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useUrls Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch URLs successfully', async () => {
    const mockUrls = [
      {
        id: 'url1',
        shortCode: 'abc123',
        originalUrl: 'https://example1.com',
        title: 'URL 1'
      },
      {
        id: 'url2',
        shortCode: 'def456',
        originalUrl: 'https://example2.com',
        title: 'URL 2'
      }
    ];

    mockedApi.getUrls.mockResolvedValue({
      content: mockUrls,
      totalElements: 2,
      totalPages: 1
    });

    const { result } = renderHook(() => useUrls(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.content).toEqual(mockUrls);
    expect(mockedApi.getUrls).toHaveBeenCalledWith({});
  });

  it('should handle API error', async () => {
    const errorMessage = 'Failed to fetch URLs';
    mockedApi.getUrls.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useUrls(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe(errorMessage);
  });

  it('should refetch URLs when filters change', async () => {
    const mockUrls = [
      {
        id: 'url1',
        shortCode: 'abc123',
        originalUrl: 'https://example1.com',
        title: 'Filtered URL'
      }
    ];

    mockedApi.getUrls.mockResolvedValue({
      content: mockUrls,
      totalElements: 1,
      totalPages: 1
    });

    const { result, rerender } = renderHook(
      ({ filters }) => useUrls(filters),
      {
        wrapper: createWrapper(),
        initialProps: { filters: {} }
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Change filters
    rerender({ filters: { search: 'test' } });

    await waitFor(() => {
      expect(mockedApi.getUrls).toHaveBeenCalledWith({ search: 'test' });
    });
  });
});
```

### Integration Testing

#### Page Integration Tests
```typescript
// src/pages/Dashboard.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from './Dashboard';
import { AuthProvider } from '../context/AuthContext';
import { api } from '../services/api';

jest.mock('../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    plan: 'PRO'
  };

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider value={{ user: mockUser, isAuthenticated: true }}>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dashboard with user data', async () => {
    const mockDashboardData = {
      totalUrls: 25,
      totalClicks: 1250,
      recentUrls: [
        {
          id: 'url1',
          shortCode: 'abc123',
          originalUrl: 'https://example1.com',
          title: 'Recent URL 1',
          analytics: { totalClicks: 45 }
        }
      ],
      clicksOverTime: [
        { date: '2024-01-29', clicks: 45 },
        { date: '2024-01-30', clicks: 67 }
      ]
    };

    mockedApi.getDashboardData.mockResolvedValue(mockDashboardData);

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    // Check loading state
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument(); // Total URLs
      expect(screen.getByText('1,250')).toBeInTheDocument(); // Total clicks
    });

    // Check if recent URLs are displayed
    expect(screen.getByText('Recent URL 1')).toBeInTheDocument();
    expect(screen.getByText('abc123')).toBeInTheDocument();
  });

  it('should handle dashboard data loading error', async () => {
    mockedApi.getDashboardData.mockRejectedValue(new Error('Failed to load dashboard'));

    render(
      <TestWrapper>
        <Dashboard />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load dashboard/i)).toBeInTheDocument();
    });
  });
});
```

## 🎪 End-to-End Testing (Cypress)

### E2E Test Configuration
```typescript
// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      apiUrl: 'http://localhost:8080/api/v1',
      testUser: {
        email: 'test@example.com',
        password: 'testpassword123'
      }
    }
  },
});
```

### E2E Test Scenarios
```typescript
// cypress/e2e/url-shortening.cy.ts
describe('URL Shortening Flow', () => {
  beforeEach(() => {
    // Login before each test
    cy.login();
    cy.visit('/dashboard');
  });

  it('should create a short URL successfully', () => {
    // Navigate to URL shortener
    cy.get('[data-cy=create-url-button]').click();

    // Fill the form
    cy.get('[data-cy=original-url-input]')
      .type('https://example.com/very/long/url/path');
    
    cy.get('[data-cy=title-input]')
      .type('Test URL for E2E');
    
    cy.get('[data-cy=description-input]')
      .type('This is a test URL created during E2E testing');

    // Submit the form
    cy.get('[data-cy=create-url-submit]').click();

    // Verify success
    cy.get('[data-cy=success-message]')
      .should('contain', 'URL created successfully');
    
    cy.get('[data-cy=short-url-result]')
      .should('contain', 'bitaurl.com/')
      .and('be.visible');

    // Verify URL appears in the list
    cy.visit('/urls');
    cy.get('[data-cy=url-list]')
      .should('contain', 'Test URL for E2E')
      .and('contain', 'https://example.com/very/long/url/path');
  });

  it('should validate form inputs', () => {
    cy.get('[data-cy=create-url-button]').click();

    // Try to submit empty form
    cy.get('[data-cy=create-url-submit]').click();

    // Check validation errors
    cy.get('[data-cy=original-url-error]')
      .should('contain', 'Original URL is required');

    // Enter invalid URL
    cy.get('[data-cy=original-url-input]').type('invalid-url');
    cy.get('[data-cy=create-url-submit]').click();

    cy.get('[data-cy=original-url-error]')
      .should('contain', 'Please enter a valid URL');
  });

  it('should copy short URL to clipboard', () => {
    // Create a URL first
    cy.createUrl('https://example.com', 'Clipboard Test');

    // Find the copy button and click it
    cy.get('[data-cy=copy-url-button]').first().click();

    // Verify success message
    cy.get('[data-cy=copy-success]')
      .should('contain', 'Copied to clipboard');

    // Verify clipboard content (if supported by browser)
    cy.window().then((win) => {
      win.navigator.clipboard.readText().then((text) => {
        expect(text).to.include('bitaurl.com/');
      });
    });
  });

  it('should redirect to original URL', () => {
    // Create a URL
    cy.createUrl('https://httpbin.org/get', 'Redirect Test').then((shortCode) => {
      // Visit the short URL
      cy.visit(`/${shortCode}`);

      // Should redirect to original URL
      cy.url().should('include', 'httpbin.org');
      cy.contains('httpbin.org'); // Verify we're on the target site
    });
  });
});
```

### Custom Cypress Commands
```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
      createUrl(originalUrl: string, title?: string): Chainable<string>;
      deleteAllUrls(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', () => {
  const { email, password } = Cypress.env('testUser');
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { email, password }
  }).then((response) => {
    window.localStorage.setItem('accessToken', response.body.data.accessToken);
  });
});

Cypress.Commands.add('createUrl', (originalUrl: string, title?: string) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/urls`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('accessToken')}`
    },
    body: {
      originalUrl,
      title: title || 'Test URL'
    }
  }).then((response) => {
    return response.body.data.shortCode;
  });
});

Cypress.Commands.add('deleteAllUrls', () => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/urls`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('accessToken')}`
    }
  }).then((response) => {
    const urls = response.body.data.content;
    
    urls.forEach((url: any) => {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiUrl')}/urls/${url.id}`,
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem('accessToken')}`
        }
      });
    });
  });
});
```

## 🔒 Security Testing

### Security Test Suite
```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class SecurityTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    @DisplayName("Should prevent SQL injection attacks")
    void shouldPreventSqlInjection() {
        // Attempt SQL injection in URL parameter
        String maliciousInput = "'; DROP TABLE users; --";
        
        ResponseEntity<String> response = restTemplate.getForEntity(
            "/api/v1/urls?search=" + maliciousInput,
            String.class
        );
        
        // Should not cause server error
        assertThat(response.getStatusCode()).isNotEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    @Test
    @DisplayName("Should prevent XSS attacks")
    void shouldPreventXssAttacks() {
        String xssPayload = "<script>alert('XSS')</script>";
        
        CreateUrlRequest request = CreateUrlRequest.builder()
            .originalUrl("https://example.com")
            .title(xssPayload)
            .build();
        
        ResponseEntity<ApiResponse<UrlResponse>> response = restTemplate.postForEntity(
            "/api/v1/urls",
            request,
            new ParameterizedTypeReference<ApiResponse<UrlResponse>>() {}
        );
        
        // XSS payload should be sanitized
        if (response.getStatusCode().is2xxSuccessful()) {
            String title = response.getBody().getData().getTitle();
            assertThat(title).doesNotContain("<script>");
        }
    }
    
    @Test
    @DisplayName("Should enforce rate limiting")
    void shouldEnforceRateLimit() {
        // Make multiple requests rapidly
        List<ResponseEntity<String>> responses = new ArrayList<>();
        
        for (int i = 0; i < 200; i++) {
            ResponseEntity<String> response = restTemplate.getForEntity(
                "/api/v1/health",
                String.class
            );
            responses.add(response);
        }
        
        // Should eventually get rate limited
        boolean rateLimited = responses.stream()
            .anyMatch(response -> response.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS);
        
        assertThat(rateLimited).isTrue();
    }
}
```

## 📊 Test Coverage & Reporting

### Coverage Configuration
```xml
<!-- Maven Jacoco Plugin -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.8</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
        <execution>
            <id>check</id>
            <goals>
                <goal>check</goal>
            </goals>
            <configuration>
                <rules>
                    <rule>
                        <element>BUNDLE</element>
                        <limits>
                            <limit>
                                <counter>INSTRUCTION</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.80</minimum>
                            </limit>
                            <limit>
                                <counter>BRANCH</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.75</minimum>
                            </limit>
                        </limits>
                    </rule>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
```

### Test Execution Scripts
```bash
#!/bin/bash
# scripts/run-tests.sh

set -e

echo "🧪 Running BitaURL Test Suite"

# Backend tests
echo "📦 Running backend tests..."
cd backend
mvn clean test jacoco:report
cd ..

# Frontend tests
echo "🎭 Running frontend tests..."
cd frontend
npm run test:coverage
cd ..

# E2E tests
echo "🎪 Running E2E tests..."
cd frontend
npm run test:e2e:headless
cd ..

# Generate combined coverage report
echo "📊 Generating coverage reports..."
./scripts/generate-coverage-report.sh

echo "✅ All tests completed successfully!"
```

---

This testing documentation provides comprehensive guidance for implementing, maintaining, and executing tests across all layers of the BitaURL application. The testing strategy ensures high code quality, reliability, and maintainability while supporting continuous integration and deployment practices.