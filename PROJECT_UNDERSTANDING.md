# Pebly - Complete Project Understanding

## Project Overview
**Pebly** is a comprehensive URL shortening platform with QR code generation, file sharing, and advanced analytics capabilities. It's a full-stack SaaS application with three main components.

---

## 🏗️ Architecture Overview

### **Stage 1: Frontend (React + TypeScript)**
**Location:** `/frontend`
**Tech Stack:**
- React 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- TanStack Query for data fetching
- Framer Motion for animations
- Axios for API communication

**Key Features:**
- URL shortening with custom aliases
- QR code generation with customization
- File upload and sharing
- Real-time analytics dashboard
- Team collaboration
- Custom domain management
- Subscription management (Free, Pro, Business plans)
- Google OAuth integration
- Password-protected links
- Link expiration and click limits

**Main Components:**
- `AuthContext.tsx` - Authentication state management
- `UrlShortener.tsx` - Main URL shortening interface
- `UnifiedDashboard.tsx` - Central dashboard for all features
- `CustomDomainManager.tsx` - Custom domain configuration
- `TeamManagement.tsx` - Team collaboration features
- `AnalyticsSection.tsx` - Analytics visualization

**User Plans:**
- **FREE**: Basic features, limited links
- **PRO**: Custom aliases, password protection, advanced analytics
- **BUSINESS**: Team collaboration, custom domains, unlimited links

---

### **Stage 2: Backend (Spring Boot + Java 17)**
**Location:** `/backend/url-service`
**Tech Stack:**
- Spring Boot 3.2.0
- MongoDB for data storage
- Redis for caching (optional)
- JWT for authentication
- Razorpay for payments
- SendGrid for emails
- Google OAuth
- Maven for dependency management

**Key Models:**

1. **User Model** (`User.java`)
   - Authentication (email/password, Google OAuth)
   - Subscription management
   - Usage tracking (daily/monthly limits)
   - API key management
   - Trial management

2. **ShortenedUrl Model** (`ShortenedUrl.java`)
   - Short code generation
   - Custom aliases
   - Password protection
   - Expiration dates
   - Click limits
   - Analytics data (clicks by country, device, browser, etc.)
   - Team/User scope support
   - Custom domain support

3. **Team Model** (`Team.java`)
   - Team ownership and members
   - Role-based access control (Owner, Admin, Editor, Viewer)
   - Team subscription management
   - Usage quotas
   - Collaborative link management

4. **QrCode Model**
   - QR code generation
   - Customization options
   - Scan tracking

5. **UploadedFile Model**
   - File storage
   - Download tracking
   - File metadata

**Key Controllers:**
- `AuthController` - User authentication and registration
- `UrlController` - URL shortening and management
- `QrCodeController` - QR code generation
- `FileController` - File upload and management
- `TeamController` - Team collaboration
- `CustomDomainController` - Custom domain management
- `AnalyticsController` - Analytics data
- `PaymentController` - Subscription and billing

**Key Services:**
- `UrlShorteningService` - Core URL shortening logic
- `AnalyticsService` - Click tracking and analytics
- `DomainService` - Custom domain verification
- `TeamService` - Team management
- `PlanValidationService` - Feature access control
- `EmailService` - Email notifications
- `PaymentService` - Payment processing

**Security Features:**
- JWT token authentication
- Password hashing with BCrypt
- CORS configuration
- Rate limiting
- Plan-based feature validation
- Role-based access control (RBAC)

---

### **Stage 3: Admin Panel (React + JavaScript)**
**Location:** `/admin-panel`
**Tech Stack:**
- React 18 with JavaScript
- Tailwind CSS
- Recharts for analytics
- Axios for API calls

**Admin Roles (RBAC System):**
1. **SUPER_ADMIN** - Full system access
2. **ADMIN** - Platform management (users, teams, domains, links)
3. **SUPPORT_ADMIN** - User support and ticket management
4. **BILLING_ADMIN** - Billing and subscription management
5. **TECH_ADMIN** - System health and technical operations
6. **MODERATOR** - Content moderation
7. **AUDITOR** - Read-only access for auditing

**Key Features:**
- **Dashboard** - Real-time platform metrics
  - Total users, active links, QR codes, file uploads
  - Revenue tracking by plan
  - Geographic distribution
  - System health monitoring
  
- **User Management**
  - User search and filtering
  - Bulk operations (email, suspend, delete)
  - User detail view with activity logs
  - Subscription management
  - Usage statistics
  
- **Team Management**
  - Team overview and search
  - Member management
  - Team transfer between users
  - Usage tracking
  
- **Domain Management**
  - Custom domain verification
  - SSL provisioning status
  - Domain transfer
  - DNS configuration help
  
- **Link Management**
  - View all shortened links
  - Bulk operations
  - Analytics overview
  
- **QR Code Management**
  - QR code gallery
  - Scan statistics
  
- **File Management**
  - Uploaded files overview
  - Storage usage tracking
  
- **Billing & Payments**
  - Revenue dashboard
  - Subscription management
  - Refund processing
  
- **Support Tickets**
  - Ticket management
  - User communication
  
- **System Health**
  - API server status
  - Database performance
  - Cache status
  - Error monitoring
  
- **Audit Logs**
  - User activity tracking
  - Admin action logs
  - Security events

**Demo Accounts:**
```
admin@pebly.com / admin123 (Super Admin)
support@pebly.com / support123 (Support Admin)
billing@pebly.com / billing123 (Billing Manager)
tech@pebly.com / tech123 (Technical Admin)
moderator@pebly.com / mod123 (Content Moderator)
auditor@pebly.com / audit123 (Read-Only Auditor)
```

---

## 🗄️ Database Schema (MongoDB)

### Collections:
1. **users** - User accounts and authentication
2. **shortened_urls** - Short links with analytics
3. **teams** - Team collaboration data
4. **team_invites** - Pending team invitations
5. **qr_codes** - Generated QR codes
6. **uploaded_files** - File uploads
7. **click_analytics** - Detailed click tracking
8. **domains** - Custom domain configurations
9. **subscriptions** - Subscription records
10. **support_tickets** - Customer support tickets

---

## 🔐 Authentication Flow

1. **User Registration**
   - Email/password or Google OAuth
   - JWT token generation
   - User profile creation
   - Default FREE plan assignment

2. **Login**
   - Credential validation
   - JWT token issuance (24-hour expiry)
   - Token refresh mechanism
   - Session management

3. **Authorization**
   - JWT token validation on each request
   - Plan-based feature access control
   - Team role verification
   - Rate limiting enforcement

---

## 💳 Subscription Plans

### **FREE Plan**
- 1,000 links/month
- Basic analytics
- Standard QR codes
- 100MB file storage

### **PRO Plan** (₹999/month or ₹9,999/year)
- 5,000 links/month
- Custom aliases
- Password protection
- Link expiration
- Advanced analytics
- Custom QR codes
- 5GB file storage

### **BUSINESS Plan** (₹2,999/month or ₹29,999/year)
- Unlimited links
- Team collaboration (up to 10 members)
- Custom domains
- Priority support
- API access
- White-label options
- 50GB file storage

---

## 🚀 Key Features

### **URL Shortening**
- Random short code generation
- Custom alias support (Pro+)
- Password protection (Pro+)
- Expiration dates (Pro+)
- Click limits (Pro+)
- Custom domains (Business+)
- Bulk operations

### **QR Code Generation**
- Text, URL, vCard, WiFi support
- Customizable colors and styles
- Logo embedding (Pro+)
- Download in multiple formats
- Scan tracking

### **File Sharing**
- Direct file upload
- Shareable links
- Download tracking
- Password protection (Pro+)
- Expiration dates (Pro+)

### **Analytics**
- Real-time click tracking
- Geographic data (country, city)
- Device and browser analytics
- Referrer tracking
- Time-based analytics
- Export capabilities

### **Team Collaboration**
- Role-based access (Owner, Admin, Editor, Viewer)
- Shared link management
- Team analytics
- Member invitations
- Permission management

### **Custom Domains**
- Domain verification via DNS
- SSL provisioning (Cloudflare)
- Automatic HTTPS
- Domain transfer

---

## 🔧 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/google` - Google OAuth
- `POST /api/v1/auth/refresh` - Token refresh
- `POST /api/v1/auth/validate` - Token validation

### URLs
- `POST /api/v1/urls` - Create short URL
- `GET /api/v1/urls/user/{userId}` - Get user URLs
- `GET /api/v1/urls/info/{shortCode}` - Get URL info
- `PUT /api/v1/urls/{shortCode}` - Update URL
- `DELETE /api/v1/urls/{shortCode}` - Delete URL
- `POST /api/v1/urls/bulk-delete` - Bulk delete
- `POST /api/v1/urls/{shortCode}/click` - Record click

### QR Codes
- `POST /api/v1/qr` - Generate QR code
- `GET /api/v1/qr/user/{userId}` - Get user QR codes
- `PUT /api/v1/qr/{qrId}` - Update QR code
- `DELETE /api/v1/qr/{qrId}` - Delete QR code

### Files
- `POST /api/v1/files/upload` - Upload file
- `GET /api/v1/files/user/{userId}` - Get user files
- `DELETE /api/v1/files/{fileCode}` - Delete file

### Teams
- `POST /api/v1/teams` - Create team
- `GET /api/v1/teams/user/{userId}` - Get user teams
- `POST /api/v1/teams/{teamId}/invite` - Invite member
- `PUT /api/v1/teams/{teamId}/member/{userId}/role` - Update role

### Domains
- `POST /api/v1/domains` - Add custom domain
- `GET /api/v1/domains/verified` - Get verified domains
- `POST /api/v1/domains/{domainId}/verify` - Verify domain

### Analytics
- `GET /api/v1/analytics/user/{userId}` - User analytics
- `GET /api/v1/analytics/url/{shortCode}` - URL analytics
- `GET /api/v1/analytics/realtime` - Real-time stats

### Admin
- `GET /api/v1/admin/users` - List all users
- `GET /api/v1/admin/teams` - List all teams
- `POST /api/v1/admin/users/{userId}/suspend` - Suspend user
- `GET /api/v1/admin/system/health` - System health

---

## 🌐 Deployment

### Frontend (Vercel)
- Automatic deployments from GitHub
- Environment variables configured
- CDN distribution
- Custom domain support

### Backend (Render)
- Docker container deployment
- Auto-scaling enabled
- Health checks configured
- Environment variables secured

### Database (MongoDB Atlas)
- Cluster configuration
- Automatic backups
- Connection pooling
- Index optimization

### Cache (Redis Cloud)
- Optional caching layer
- Session management
- Rate limiting

---

## 🔒 Security Measures

1. **Authentication**
   - JWT tokens with expiration
   - Password hashing (BCrypt)
   - OAuth 2.0 integration

2. **Authorization**
   - Role-based access control
   - Plan-based feature gating
   - Team permission validation

3. **Data Protection**
   - HTTPS enforcement
   - CORS configuration
   - Input validation
   - SQL injection prevention

4. **Rate Limiting**
   - API rate limits per plan
   - DDoS protection
   - Abuse prevention

---

## 📊 Performance Optimizations

1. **Backend**
   - MongoDB connection pooling
   - Redis caching for frequent queries
   - Async processing for analytics
   - Database indexing

2. **Frontend**
   - Code splitting with React.lazy
   - Image optimization
   - Bundle size optimization
   - CDN delivery

3. **Database**
   - Compound indexes for queries
   - Aggregation pipelines
   - TTL indexes for cleanup

---

## 🧪 Testing Strategy

- Unit tests for services
- Integration tests for APIs
- E2E tests for critical flows
- Performance testing
- Security testing

---

## 📈 Monitoring & Logging

- Spring Boot Actuator for health checks
- Prometheus metrics export
- Structured logging with Logback
- Error tracking
- Performance monitoring

---

## 🚧 Future Enhancements

1. **Features**
   - A/B testing for links
   - Link retargeting
   - Advanced QR code templates
   - Webhook integrations
   - API rate limit customization

2. **Integrations**
   - Zapier integration
   - Slack notifications
   - Google Analytics integration
   - Social media auto-posting

3. **Analytics**
   - Conversion tracking
   - Funnel analysis
   - Heatmaps
   - User journey tracking

---

## 📝 Development Workflow

1. **Local Development**
   ```bash
   # Frontend
   cd frontend && npm install && npm start
   
   # Backend
   cd backend/url-service && ./mvnw spring-boot:run
   
   # Admin Panel
   cd admin-panel && npm install && npm start
   ```

2. **Environment Variables**
   - `.env` files for each component
   - Separate configs for dev/staging/prod
   - Secrets management

3. **Git Workflow**
   - Feature branches
   - Pull request reviews
   - CI/CD pipelines

---

## 🎯 Key Business Metrics

- Monthly Active Users (MAU)
- Conversion rate (Free → Paid)
- Churn rate
- Average Revenue Per User (ARPU)
- Link creation rate
- Click-through rate
- Customer Lifetime Value (CLV)

---

## 📞 Support & Documentation

- User documentation
- API documentation
- Admin guides
- Troubleshooting guides
- Video tutorials

---

## 🏆 Competitive Advantages

1. **Comprehensive Feature Set** - URL shortening + QR codes + File sharing
2. **Team Collaboration** - Built-in team features
3. **Custom Domains** - Full branding control
4. **Advanced Analytics** - Detailed insights
5. **Flexible Pricing** - Plans for all user types
6. **Modern Tech Stack** - Scalable and maintainable
7. **Admin Panel** - Complete platform management

---

## 📊 Current Status

- ✅ Core URL shortening functionality
- ✅ User authentication (email + Google OAuth)
- ✅ QR code generation
- ✅ File upload and sharing
- ✅ Team collaboration
- ✅ Custom domain support
- ✅ Analytics dashboard
- ✅ Subscription management
- ✅ Admin panel with RBAC
- ✅ Payment integration (Razorpay)
- ✅ Email notifications (SendGrid)

---

This is a production-ready, enterprise-grade URL shortening platform with comprehensive features for individual users, teams, and administrators.
