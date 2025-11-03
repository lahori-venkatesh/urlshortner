# BitaURL - System Architecture

## 🏗️ Architecture Overview

BitaURL follows a modern, cloud-native architecture designed for scalability, security, and maintainability. The system is built using a layered approach with clear separation of concerns and well-defined interfaces between components.

## 🎯 Architectural Principles

### 1. Microservices-Ready Design
- Modular service architecture
- Independent deployment capabilities
- Service-to-service communication via REST APIs
- Event-driven architecture for async operations

### 2. Security by Design
- Zero-trust security model
- End-to-end encryption for sensitive data
- Role-based access control (RBAC)
- Comprehensive audit logging

### 3. Cloud-Native & Scalable
- Containerized applications
- Horizontal scaling capabilities
- Auto-scaling based on demand
- Multi-region deployment support

### 4. API-First Approach
- RESTful API design
- Comprehensive API documentation
- Versioned APIs for backward compatibility
- Rate limiting and throttling

## 🏛️ System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Client Layer                                    │
├─────────────────┬─────────────────┬─────────────────┬─────────────────────┤
│   Web App       │   Admin Panel   │   Mobile App    │   Third-party       │
│   (React)       │   (React)       │   (Future)      │   Integrations      │
└─────────┬───────┴─────────┬───────┴─────────┬───────┴─────────┬───────────┘
          │                 │                 │                 │
          └─────────────────┼─────────────────┼─────────────────┘
                            │                 │
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API Gateway Layer                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                     Load Balancer (Nginx/CloudFlare)                        │
└─────────────────────────┬───────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Application Layer                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                      Spring Boot Application                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Auth      │  │    URL      │  │    File     │  │       Admin         │ │
│  │  Service    │  │  Service    │  │  Service    │  │      Service        │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │    QR       │  │   Team      │  │   Domain    │  │      Support        │ │
│  │  Service    │  │  Service    │  │  Service    │  │      Service        │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Payment    │  │ Analytics   │  │   Audit     │  │    Notification     │ │
│  │  Service    │  │  Service    │  │  Service    │  │      Service        │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────┬───────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Data Layer                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   MongoDB   │  │    Redis    │  │   AWS S3    │  │    External APIs    │ │
│  │  (Primary)  │  │   (Cache)   │  │ (Storage)   │  │  (Razorpay, etc.)   │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Architecture

### 1. Request Flow
```
User Request → Load Balancer → API Gateway → Authentication → 
Service Layer → Data Layer → Response Processing → User Response
```

### 2. URL Redirect Flow
```
Short URL Request → Cache Check (Redis) → Database Lookup (MongoDB) → 
Analytics Recording → Redirect Response
```

### 3. Authentication Flow
```
Login Request → OAuth Provider → JWT Generation → Token Storage → 
Protected Resource Access → Token Validation → Resource Response
```

## 🏢 Service Architecture

### Core Services

#### 1. Authentication Service
**Responsibility**: User authentication, authorization, and session management
- JWT token generation and validation
- Google OAuth2 integration
- Role-based access control
- Session management with Redis

#### 2. URL Service
**Responsibility**: URL shortening, management, and redirect handling
- Short URL generation and validation
- Custom alias support
- Bulk URL operations
- URL analytics and tracking

#### 3. QR Service
**Responsibility**: QR code generation and management
- Dynamic QR code generation
- Custom branding and styling
- QR code analytics
- Batch QR generation

#### 4. File Service
**Responsibility**: File upload, storage, and link generation
- Secure file upload handling
- File-to-link conversion
- Expirable file links
- File analytics and download tracking

#### 5. Team Service
**Responsibility**: Team collaboration and workspace management
- Team creation and management
- Member invitation and role assignment
- Team analytics and reporting
- Workspace isolation

#### 6. Domain Service
**Responsibility**: Custom domain management and verification
- Domain registration and verification
- SSL certificate management
- DNS configuration validation
- Domain analytics

#### 7. Payment Service
**Responsibility**: Billing, subscriptions, and payment processing
- Razorpay integration
- Subscription management
- Invoice generation
- Payment analytics

#### 8. Analytics Service
**Responsibility**: Data collection, processing, and reporting
- Real-time analytics processing
- Geographic and demographic insights
- Custom event tracking
- Report generation and exports

#### 9. Admin Service
**Responsibility**: Platform administration and monitoring
- User management and impersonation
- System health monitoring
- Audit log management
- Platform configuration

#### 10. Support Service
**Responsibility**: Customer support and ticket management
- Support ticket creation and management
- Agent assignment and routing
- Knowledge base management
- Support analytics

#### 11. Notification Service
**Responsibility**: Email, SMS, and push notifications
- Transactional email sending
- Notification templates
- Delivery tracking
- Notification preferences

#### 12. Audit Service
**Responsibility**: Security auditing and compliance
- Comprehensive audit logging
- Security event monitoring
- Compliance reporting
- Data retention management

## 🗄️ Data Architecture

### Database Design

#### Primary Database: MongoDB
- **Document-based storage** for flexible schema evolution
- **Horizontal scaling** with sharding support
- **Replica sets** for high availability
- **Indexes** optimized for query performance

#### Cache Layer: Redis
- **Session storage** for user authentication
- **URL redirect caching** for performance
- **Rate limiting** counters and quotas
- **Real-time analytics** temporary storage

#### File Storage: AWS S3 Compatible
- **Secure file storage** with encryption at rest
- **CDN integration** for global file delivery
- **Lifecycle policies** for cost optimization
- **Backup and versioning** for data protection

### Data Models

#### Core Collections
```javascript
// Users Collection
{
  _id: ObjectId,
  email: String,
  name: String,
  avatar: String,
  plan: String,
  role: String,
  createdAt: Date,
  updatedAt: Date,
  settings: Object,
  subscription: Object
}

// URLs Collection
{
  _id: ObjectId,
  shortCode: String,
  originalUrl: String,
  userId: ObjectId,
  teamId: ObjectId,
  title: String,
  description: String,
  tags: [String],
  customDomain: String,
  expiresAt: Date,
  isActive: Boolean,
  analytics: Object,
  createdAt: Date,
  updatedAt: Date
}

// Teams Collection
{
  _id: ObjectId,
  name: String,
  ownerId: ObjectId,
  members: [Object],
  settings: Object,
  plan: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔐 Security Architecture

### Authentication & Authorization

#### JWT-Based Authentication
- **Stateless tokens** for scalability
- **Short-lived access tokens** (15 minutes)
- **Long-lived refresh tokens** (7 days)
- **Token rotation** for enhanced security

#### Role-Based Access Control (RBAC)
```javascript
// Role Hierarchy
SUPER_ADMIN > ADMIN > SUPPORT_ADMIN > BILLING_ADMIN > 
TECH_ADMIN > CONTENT_MODERATOR > AUDITOR > USER
```

#### Permission System
```javascript
// Permission Format: resource:action
permissions: [
  'users:read', 'users:write', 'users:delete',
  'urls:read', 'urls:write', 'urls:delete',
  'teams:read', 'teams:write', 'teams:delete',
  'analytics:read', 'billing:read', 'support:*'
]
```

### Data Security

#### Encryption
- **Data at rest**: AES-256 encryption for sensitive data
- **Data in transit**: TLS 1.3 for all communications
- **Database encryption**: MongoDB encryption at rest
- **File encryption**: S3 server-side encryption

#### Security Headers
```javascript
// Security Headers Configuration
{
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}
```

## 🚀 Performance Architecture

### Caching Strategy

#### Multi-Level Caching
1. **CDN Caching** - Static assets and file downloads
2. **Application Caching** - Redis for frequently accessed data
3. **Database Caching** - MongoDB query result caching
4. **Browser Caching** - Client-side caching headers

#### Cache Invalidation
- **Time-based expiration** for temporary data
- **Event-based invalidation** for real-time updates
- **Cache warming** for predictable access patterns
- **Distributed cache** for multi-instance deployments

### Database Optimization

#### Indexing Strategy
```javascript
// Critical Indexes
db.urls.createIndex({ shortCode: 1 }, { unique: true })
db.urls.createIndex({ userId: 1, createdAt: -1 })
db.users.createIndex({ email: 1 }, { unique: true })
db.analytics.createIndex({ urlId: 1, timestamp: -1 })
```

#### Query Optimization
- **Aggregation pipelines** for complex analytics
- **Projection queries** to minimize data transfer
- **Compound indexes** for multi-field queries
- **Read preferences** for replica set optimization

## 🌐 Deployment Architecture

### Infrastructure Components

#### Production Environment
```yaml
# Infrastructure Stack
Load Balancer: CloudFlare + Nginx
Application: Docker containers on Render
Database: MongoDB Atlas (Multi-region)
Cache: Redis Cloud (High Availability)
Storage: AWS S3 with CloudFront CDN
Monitoring: Grafana + Prometheus
Logging: ELK Stack (Elasticsearch, Logstash, Kibana)
```

#### Development Environment
```yaml
# Local Development Stack
Application: Spring Boot (localhost:8080)
Frontend: React Dev Server (localhost:3000)
Admin Panel: React Dev Server (localhost:3001)
Database: MongoDB (localhost:27017)
Cache: Redis (localhost:6379)
```

### Scaling Strategy

#### Horizontal Scaling
- **Stateless application design** for easy scaling
- **Load balancer distribution** across multiple instances
- **Database sharding** for data distribution
- **CDN distribution** for global performance

#### Auto-Scaling Configuration
```yaml
# Auto-scaling Rules
CPU Utilization: > 70% (Scale Up)
Memory Usage: > 80% (Scale Up)
Request Rate: > 1000 RPS (Scale Up)
Response Time: > 500ms (Scale Up)
```

## 📊 Monitoring & Observability

### Application Monitoring
- **Health checks** for service availability
- **Performance metrics** for response times
- **Error tracking** for exception monitoring
- **Business metrics** for KPI tracking

### Infrastructure Monitoring
- **System metrics** (CPU, memory, disk, network)
- **Database performance** (query times, connections)
- **Cache performance** (hit rates, memory usage)
- **Network monitoring** (latency, throughput)

### Logging Strategy
```javascript
// Structured Logging Format
{
  timestamp: "2024-01-30T10:15:30Z",
  level: "INFO",
  service: "url-service",
  traceId: "abc123",
  userId: "user_123",
  action: "create_url",
  metadata: {
    shortCode: "abc123",
    originalUrl: "https://example.com"
  }
}
```

## 🔄 Integration Architecture

### External Integrations
- **Payment Gateway**: Razorpay for payment processing
- **Email Service**: SendGrid for transactional emails
- **SMS Service**: Twilio for SMS notifications
- **Analytics**: Google Analytics for web analytics
- **Monitoring**: Sentry for error tracking

### API Integration Patterns
- **REST APIs** for synchronous operations
- **Webhooks** for real-time notifications
- **Rate limiting** for API protection
- **API versioning** for backward compatibility

---

This architecture documentation provides a comprehensive overview of BitaURL's system design. For implementation details, refer to the specific service documentation in their respective sections.