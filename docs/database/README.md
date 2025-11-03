# BitaURL - Database Documentation

## 🎯 Overview

BitaURL uses MongoDB as its primary database, chosen for its flexibility, scalability, and excellent performance characteristics for document-based data. The database design follows modern NoSQL patterns with careful attention to indexing, relationships, and data consistency.

## 🏗️ Database Architecture

### Technology Stack
- **MongoDB 6.0+** - Primary database with document storage
- **MongoDB Atlas** - Cloud-hosted database service
- **Spring Data MongoDB** - Java abstraction layer
- **Redis** - Caching and session storage
- **MongoDB Compass** - Database administration tool

### Design Principles

#### 1. Document-Oriented Design
- **Embedded Documents** for related data that's frequently accessed together
- **References** for data that's shared across multiple documents
- **Denormalization** for read-heavy operations
- **Atomic Operations** for data consistency

#### 2. Scalability Considerations
- **Horizontal Sharding** support for large datasets
- **Replica Sets** for high availability
- **Read Preferences** for load distribution
- **Connection Pooling** for efficient resource usage

#### 3. Performance Optimization
- **Strategic Indexing** for query performance
- **Aggregation Pipelines** for complex analytics
- **Projection Queries** to minimize data transfer
- **Compound Indexes** for multi-field queries

## 📊 Database Schema

### Core Collections

#### 1. Users Collection
```javascript
// Collection: users
{
  _id: ObjectId("..."),
  email: "user@example.com",
  name: "John Doe",
  avatar: "https://example.com/avatar.jpg",
  
  // Authentication
  passwordHash: "$2b$10$...", // BCrypt hash
  emailVerified: true,
  emailVerificationToken: null,
  passwordResetToken: null,
  passwordResetExpires: null,
  
  // Profile Information
  role: "USER", // USER, ADMIN, SUPER_ADMIN
  plan: "PRO", // FREE, PRO, BUSINESS, ENTERPRISE
  status: "ACTIVE", // ACTIVE, SUSPENDED, DELETED
  
  // OAuth Integration
  googleId: "google_oauth_id",
  githubId: "github_oauth_id",
  
  // Settings
  settings: {
    theme: "light", // light, dark
    language: "en",
    timezone: "UTC",
    notifications: {
      email: true,
      push: false,
      marketing: false
    },
    privacy: {
      profilePublic: false,
      analyticsSharing: true
    }
  },
  
  // Subscription Details
  subscription: {
    planId: "pro_monthly",
    status: "active", // active, canceled, past_due
    currentPeriodStart: ISODate("2024-01-01T00:00:00Z"),
    currentPeriodEnd: ISODate("2024-02-01T00:00:00Z"),
    cancelAtPeriodEnd: false,
    trialEnd: null,
    customerId: "cus_razorpay_id"
  },
  
  // Usage Statistics
  usage: {
    urlsCreated: 150,
    urlsThisMonth: 25,
    totalClicks: 5420,
    clicksThisMonth: 890,
    storageUsed: 1048576, // bytes
    apiCallsThisMonth: 1200
  },
  
  // Timestamps
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-30T10:15:30Z"),
  lastLoginAt: ISODate("2024-01-30T09:30:00Z"),
  
  // Soft Delete
  deletedAt: null
}
```

#### 2. URLs Collection
```javascript
// Collection: urls
{
  _id: ObjectId("..."),
  shortCode: "abc123", // Unique identifier
  originalUrl: "https://example.com/very/long/url",
  
  // Ownership
  userId: ObjectId("..."), // Reference to users collection
  teamId: ObjectId("..."), // Reference to teams collection (optional)
  
  // Metadata
  title: "Example Website",
  description: "A sample website for demonstration",
  tags: ["marketing", "campaign", "social"],
  favicon: "https://example.com/favicon.ico",
  
  // Custom Configuration
  customDomain: "short.company.com", // Custom domain (optional)
  customAlias: "my-custom-link", // Custom alias (optional)
  
  // Behavior Settings
  settings: {
    password: null, // Password protection
    expiresAt: ISODate("2024-12-31T23:59:59Z"), // Expiration date
    clickLimit: null, // Maximum clicks allowed
    geoTargeting: {
      enabled: false,
      rules: [
        {
          country: "US",
          redirectUrl: "https://us.example.com"
        }
      ]
    },
    deviceTargeting: {
      enabled: false,
      rules: [
        {
          device: "mobile",
          redirectUrl: "https://m.example.com"
        }
      ]
    }
  },
  
  // Status and Visibility
  isActive: true,
  isPublic: false, // Public in directory
  isFeatured: false, // Featured in public directory
  
  // Analytics Summary (denormalized for performance)
  analytics: {
    totalClicks: 1250,
    uniqueClicks: 890,
    lastClickAt: ISODate("2024-01-30T10:00:00Z"),
    topCountries: ["US", "UK", "CA"],
    topReferrers: ["google.com", "facebook.com", "twitter.com"],
    clicksByDay: [
      { date: "2024-01-29", clicks: 45 },
      { date: "2024-01-30", clicks: 67 }
    ]
  },
  
  // QR Code Information
  qrCode: {
    id: ObjectId("..."), // Reference to qr_codes collection
    imageUrl: "https://cdn.bitaurl.com/qr/abc123.png",
    style: {
      foregroundColor: "#000000",
      backgroundColor: "#FFFFFF",
      logo: "https://company.com/logo.png"
    }
  },
  
  // Timestamps
  createdAt: ISODate("2024-01-15T14:30:00Z"),
  updatedAt: ISODate("2024-01-30T10:15:30Z"),
  
  // Soft Delete
  deletedAt: null
}
```

#### 3. Analytics Collection
```javascript
// Collection: analytics
{
  _id: ObjectId("..."),
  
  // References
  urlId: ObjectId("..."), // Reference to urls collection
  userId: ObjectId("..."), // Reference to users collection
  
  // Request Information
  ipAddress: "192.168.1.100",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  referer: "https://google.com/search?q=example",
  
  // Geographic Information
  location: {
    country: "United States",
    countryCode: "US",
    region: "California",
    regionCode: "CA",
    city: "San Francisco",
    latitude: 37.7749,
    longitude: -122.4194,
    timezone: "America/Los_Angeles",
    isp: "Comcast Cable Communications"
  },
  
  // Device Information
  device: {
    type: "desktop", // mobile, tablet, desktop
    brand: "Apple",
    model: "MacBook Pro",
    os: "macOS",
    osVersion: "13.2.1",
    browser: "Chrome",
    browserVersion: "109.0.0.0",
    screenResolution: "1920x1080",
    language: "en-US"
  },
  
  // UTM Parameters
  utm: {
    source: "google",
    medium: "cpc",
    campaign: "summer_sale",
    term: "url shortener",
    content: "ad_variant_a"
  },
  
  // Custom Events
  events: [
    {
      type: "click",
      timestamp: ISODate("2024-01-30T10:15:30Z"),
      metadata: {}
    }
  ],
  
  // Bot Detection
  isBot: false,
  botType: null, // googlebot, bingbot, etc.
  
  // Timestamp
  timestamp: ISODate("2024-01-30T10:15:30Z"),
  
  // Session Information
  sessionId: "sess_abc123",
  isUniqueVisitor: true
}
```

#### 4. Teams Collection
```javascript
// Collection: teams
{
  _id: ObjectId("..."),
  name: "Marketing Team",
  slug: "marketing-team", // URL-friendly identifier
  description: "Team for marketing campaigns and social media",
  
  // Ownership
  ownerId: ObjectId("..."), // Reference to users collection
  
  // Team Settings
  settings: {
    visibility: "private", // public, private
    allowMemberInvites: true,
    requireApproval: false,
    defaultUrlSettings: {
      isPublic: false,
      expiresAfterDays: null
    }
  },
  
  // Members
  members: [
    {
      userId: ObjectId("..."),
      role: "admin", // owner, admin, member, viewer
      joinedAt: ISODate("2024-01-15T10:00:00Z"),
      invitedBy: ObjectId("..."),
      permissions: ["urls:create", "urls:edit", "analytics:view"]
    }
  ],
  
  // Invitations
  invitations: [
    {
      email: "newmember@company.com",
      role: "member",
      token: "inv_token_123",
      invitedBy: ObjectId("..."),
      invitedAt: ISODate("2024-01-30T09:00:00Z"),
      expiresAt: ISODate("2024-02-06T09:00:00Z"),
      status: "pending" // pending, accepted, expired
    }
  ],
  
  // Usage Statistics
  usage: {
    totalUrls: 450,
    totalClicks: 15420,
    activeMembers: 8,
    storageUsed: 5242880 // bytes
  },
  
  // Subscription (for team plans)
  subscription: {
    planId: "team_pro",
    seats: 10,
    usedSeats: 8,
    billingCycle: "monthly"
  },
  
  // Timestamps
  createdAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-30T10:15:30Z"),
  
  // Soft Delete
  deletedAt: null
}
```

#### 5. QR Codes Collection
```javascript
// Collection: qr_codes
{
  _id: ObjectId("..."),
  
  // References
  urlId: ObjectId("..."), // Reference to urls collection
  userId: ObjectId("..."), // Reference to users collection
  
  // QR Code Data
  data: "https://bitaurl.com/abc123", // The encoded URL
  format: "PNG", // PNG, SVG, PDF
  size: 200, // Size in pixels
  
  // Styling
  style: {
    foregroundColor: "#000000",
    backgroundColor: "#FFFFFF",
    errorCorrectionLevel: "M", // L, M, Q, H
    margin: 4,
    logo: {
      url: "https://company.com/logo.png",
      size: 0.2, // Percentage of QR code size
      position: "center"
    },
    shape: {
      data: "square", // square, circle
      eye: "square" // square, circle
    }
  },
  
  // File Information
  file: {
    url: "https://cdn.bitaurl.com/qr/abc123.png",
    size: 15420, // File size in bytes
    mimeType: "image/png"
  },
  
  // Analytics
  analytics: {
    totalScans: 89,
    uniqueScans: 67,
    lastScanAt: ISODate("2024-01-30T09:45:00Z"),
    scansByDay: [
      { date: "2024-01-29", scans: 12 },
      { date: "2024-01-30", scans: 8 }
    ]
  },
  
  // Timestamps
  createdAt: ISODate("2024-01-15T14:30:00Z"),
  updatedAt: ISODate("2024-01-30T10:15:30Z"),
  
  // Soft Delete
  deletedAt: null
}
```

#### 6. Files Collection
```javascript
// Collection: files
{
  _id: ObjectId("..."),
  
  // References
  userId: ObjectId("..."), // Reference to users collection
  teamId: ObjectId("..."), // Reference to teams collection (optional)
  
  // File Information
  originalName: "presentation.pdf",
  fileName: "file_abc123.pdf", // Stored filename
  mimeType: "application/pdf",
  size: 2048576, // File size in bytes
  
  // Storage Information
  storage: {
    provider: "s3", // s3, gcs, azure
    bucket: "bitaurl-files",
    key: "files/2024/01/file_abc123.pdf",
    url: "https://cdn.bitaurl.com/files/abc123",
    cdnUrl: "https://cdn.bitaurl.com/files/abc123"
  },
  
  // Access Control
  access: {
    isPublic: false,
    password: null, // Password protection
    expiresAt: ISODate("2024-12-31T23:59:59Z"),
    downloadLimit: 100, // Maximum downloads
    allowedDomains: ["company.com"], // Domain restrictions
    ipWhitelist: ["192.168.1.0/24"] // IP restrictions
  },
  
  // Short URL Information
  shortUrl: {
    shortCode: "file_abc123",
    fullUrl: "https://bitaurl.com/f/abc123"
  },
  
  // Analytics
  analytics: {
    totalDownloads: 45,
    uniqueDownloads: 32,
    lastDownloadAt: ISODate("2024-01-30T08:30:00Z"),
    downloadsByDay: [
      { date: "2024-01-29", downloads: 8 },
      { date: "2024-01-30", downloads: 5 }
    ],
    topCountries: ["US", "UK", "CA"]
  },
  
  // Metadata
  metadata: {
    title: "Q4 Sales Presentation",
    description: "Quarterly sales results and projections",
    tags: ["sales", "q4", "presentation"],
    thumbnail: "https://cdn.bitaurl.com/thumbs/abc123.jpg"
  },
  
  // Timestamps
  createdAt: ISODate("2024-01-15T16:20:00Z"),
  updatedAt: ISODate("2024-01-30T10:15:30Z"),
  
  // Soft Delete
  deletedAt: null
}
```

#### 7. Domains Collection
```javascript
// Collection: domains
{
  _id: ObjectId("..."),
  
  // Domain Information
  domain: "short.company.com",
  subdomain: "short", // Optional subdomain
  rootDomain: "company.com",
  
  // Ownership
  userId: ObjectId("..."), // Reference to users collection
  teamId: ObjectId("..."), // Reference to teams collection (optional)
  
  // Verification
  verification: {
    status: "verified", // pending, verified, failed
    method: "dns", // dns, file, email
    token: "verify_token_123",
    verifiedAt: ISODate("2024-01-16T10:30:00Z"),
    lastCheckedAt: ISODate("2024-01-30T10:00:00Z"),
    dnsRecords: [
      {
        type: "CNAME",
        name: "short",
        value: "cname.bitaurl.com",
        status: "verified"
      }
    ]
  },
  
  // SSL Certificate
  ssl: {
    status: "active", // pending, active, expired, failed
    provider: "letsencrypt",
    issuedAt: ISODate("2024-01-16T11:00:00Z"),
    expiresAt: ISODate("2024-04-16T11:00:00Z"),
    autoRenew: true,
    certificate: {
      serialNumber: "abc123...",
      fingerprint: "sha256:abc123..."
    }
  },
  
  // Configuration
  settings: {
    redirectType: 301, // 301, 302
    httpsOnly: true,
    wwwRedirect: false, // Redirect www to non-www
    defaultUrl: "https://company.com", // Fallback URL
    customHeaders: {
      "X-Frame-Options": "DENY"
    }
  },
  
  // Usage Statistics
  usage: {
    totalUrls: 125,
    totalClicks: 8950,
    clicksThisMonth: 1200,
    bandwidth: 1048576000 // bytes
  },
  
  // Timestamps
  createdAt: ISODate("2024-01-15T09:00:00Z"),
  updatedAt: ISODate("2024-01-30T10:15:30Z"),
  
  // Soft Delete
  deletedAt: null
}
```

#### 8. Support Tickets Collection
```javascript
// Collection: support_tickets
{
  _id: ObjectId("..."),
  
  // Ticket Information
  ticketNumber: "TICKET-2024-001234",
  subject: "Custom domain verification issue",
  category: "technical", // payment, technical, account, general
  priority: "high", // low, medium, high, urgent
  status: "open", // open, in-progress, resolved, closed
  
  // User Information
  userId: ObjectId("..."), // Reference to users collection
  userEmail: "user@company.com",
  userName: "John Doe",
  userPlan: "PRO",
  
  // Assignment
  assignedTo: ObjectId("..."), // Reference to admin users
  assignedBy: ObjectId("..."),
  assignedAt: ISODate("2024-01-30T09:30:00Z"),
  
  // Content
  message: "I'm having trouble verifying my custom domain...",
  attachments: [
    {
      fileName: "screenshot.png",
      fileUrl: "https://cdn.bitaurl.com/attachments/abc123.png",
      fileSize: 245760
    }
  ],
  
  // Responses
  responses: [
    {
      id: ObjectId("..."),
      message: "Thank you for contacting support...",
      sender: "agent", // user, agent, system
      senderName: "Sarah Wilson",
      senderId: ObjectId("..."),
      timestamp: ISODate("2024-01-30T10:00:00Z"),
      attachments: [],
      isInternal: false // Internal notes not visible to user
    }
  ],
  
  // Metadata
  metadata: {
    userAgent: "Mozilla/5.0...",
    ipAddress: "192.168.1.100",
    currentPage: "/domains",
    browserInfo: {
      name: "Chrome",
      version: "109.0.0.0"
    }
  },
  
  // SLA Tracking
  sla: {
    responseTime: 7200, // seconds
    resolutionTime: null,
    firstResponseAt: ISODate("2024-01-30T10:00:00Z"),
    resolvedAt: null,
    escalatedAt: null
  },
  
  // Tags and Labels
  tags: ["domain", "verification", "dns"],
  labels: ["escalated", "vip-customer"],
  
  // Satisfaction
  satisfaction: {
    rating: null, // 1-5 stars
    feedback: null,
    ratedAt: null
  },
  
  // Timestamps
  createdAt: ISODate("2024-01-30T09:15:00Z"),
  updatedAt: ISODate("2024-01-30T10:15:30Z"),
  
  // Soft Delete
  deletedAt: null
}
```

#### 9. Payments Collection
```javascript
// Collection: payments
{
  _id: ObjectId("..."),
  
  // Payment Information
  paymentId: "pay_razorpay_123", // External payment ID
  orderId: "order_123",
  invoiceId: "inv_2024_001234",
  
  // User Information
  userId: ObjectId("..."), // Reference to users collection
  customerId: "cus_razorpay_456", // External customer ID
  
  // Amount and Currency
  amount: 2999, // Amount in smallest currency unit (paise)
  currency: "INR",
  amountPaid: 2999,
  amountDue: 0,
  
  // Payment Details
  method: "card", // card, upi, netbanking, wallet
  status: "captured", // created, authorized, captured, refunded, failed
  gateway: "razorpay",
  
  // Subscription Information
  subscription: {
    subscriptionId: "sub_razorpay_789",
    planId: "pro_monthly",
    planName: "Pro Monthly",
    billingCycle: "monthly",
    currentPeriodStart: ISODate("2024-01-01T00:00:00Z"),
    currentPeriodEnd: ISODate("2024-02-01T00:00:00Z")
  },
  
  // Payment Method Details
  paymentMethod: {
    type: "card",
    card: {
      last4: "4242",
      brand: "visa",
      network: "Visa",
      type: "credit",
      issuer: "HDFC Bank"
    }
  },
  
  // Billing Address
  billingAddress: {
    name: "John Doe",
    email: "john@company.com",
    phone: "+91-9876543210",
    line1: "123 Main Street",
    line2: "Apt 4B",
    city: "Mumbai",
    state: "Maharashtra",
    postalCode: "400001",
    country: "IN"
  },
  
  // Tax Information
  tax: {
    gstNumber: "27AABCU9603R1ZX",
    taxAmount: 539, // GST amount
    taxRate: 18, // GST rate percentage
    taxType: "GST"
  },
  
  // Refund Information
  refunds: [
    {
      refundId: "rfnd_razorpay_123",
      amount: 1000,
      reason: "Customer request",
      status: "processed",
      processedAt: ISODate("2024-01-25T14:30:00Z"),
      processedBy: ObjectId("...") // Admin user ID
    }
  ],
  
  // Webhook Events
  webhookEvents: [
    {
      event: "payment.captured",
      receivedAt: ISODate("2024-01-30T10:15:30Z"),
      processed: true
    }
  ],
  
  // Timestamps
  createdAt: ISODate("2024-01-30T10:15:00Z"),
  updatedAt: ISODate("2024-01-30T10:15:30Z"),
  paidAt: ISODate("2024-01-30T10:15:30Z"),
  
  // Soft Delete
  deletedAt: null
}
```

#### 10. Audit Logs Collection
```javascript
// Collection: audit_logs
{
  _id: ObjectId("..."),
  
  // Event Information
  action: "user.login", // Hierarchical action naming
  resource: "user",
  resourceId: ObjectId("..."),
  
  // Actor Information
  actorType: "user", // user, admin, system
  actorId: ObjectId("..."),
  actorEmail: "admin@bitaurl.com",
  actorName: "Admin User",
  actorRole: "ADMIN",
  
  // Target Information (for actions on other entities)
  targetType: "user",
  targetId: ObjectId("..."),
  targetEmail: "user@company.com",
  
  // Event Details
  details: {
    oldValues: {
      status: "active",
      plan: "free"
    },
    newValues: {
      status: "suspended",
      plan: "free"
    },
    reason: "Terms of service violation",
    metadata: {
      suspensionDuration: "7 days",
      appealAllowed: true
    }
  },
  
  // Request Context
  context: {
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0...",
    sessionId: "sess_abc123",
    requestId: "req_xyz789",
    source: "admin_panel" // web, api, mobile, system
  },
  
  // Severity and Category
  severity: "medium", // low, medium, high, critical
  category: "security", // security, data, system, business
  
  // Compliance
  compliance: {
    gdprRelevant: true,
    dataSubject: ObjectId("..."), // User whose data was affected
    legalBasis: "legitimate_interest",
    retentionPeriod: "7 years"
  },
  
  // Timestamp
  timestamp: ISODate("2024-01-30T10:15:30Z"),
  
  // Additional Metadata
  tags: ["user_management", "suspension"],
  correlationId: "corr_abc123" // For tracking related events
}
```

## 🔍 Indexing Strategy

### Primary Indexes
```javascript
// Users Collection Indexes
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "googleId": 1 }, { sparse: true })
db.users.createIndex({ "plan": 1, "status": 1 })
db.users.createIndex({ "createdAt": -1 })
db.users.createIndex({ "subscription.status": 1 })

// URLs Collection Indexes
db.urls.createIndex({ "shortCode": 1 }, { unique: true })
db.urls.createIndex({ "userId": 1, "createdAt": -1 })
db.urls.createIndex({ "teamId": 1, "isActive": 1 })
db.urls.createIndex({ "customDomain": 1, "isActive": 1 })
db.urls.createIndex({ "isActive": 1, "isPublic": 1 })
db.urls.createIndex({ "tags": 1 })
db.urls.createIndex({ "analytics.totalClicks": -1 })

// Analytics Collection Indexes
db.analytics.createIndex({ "urlId": 1, "timestamp": -1 })
db.analytics.createIndex({ "userId": 1, "timestamp": -1 })
db.analytics.createIndex({ "timestamp": -1 })
db.analytics.createIndex({ "location.country": 1, "timestamp": -1 })
db.analytics.createIndex({ "device.type": 1, "timestamp": -1 })
db.analytics.createIndex({ "isBot": 1, "timestamp": -1 })

// Teams Collection Indexes
db.teams.createIndex({ "ownerId": 1 })
db.teams.createIndex({ "members.userId": 1 })
db.teams.createIndex({ "slug": 1 }, { unique: true })
db.teams.createIndex({ "invitations.email": 1 })

// Support Tickets Collection Indexes
db.support_tickets.createIndex({ "userId": 1, "createdAt": -1 })
db.support_tickets.createIndex({ "status": 1, "priority": 1 })
db.support_tickets.createIndex({ "assignedTo": 1, "status": 1 })
db.support_tickets.createIndex({ "category": 1, "createdAt": -1 })
db.support_tickets.createIndex({ "ticketNumber": 1 }, { unique: true })

// Payments Collection Indexes
db.payments.createIndex({ "userId": 1, "createdAt": -1 })
db.payments.createIndex({ "paymentId": 1 }, { unique: true })
db.payments.createIndex({ "subscription.subscriptionId": 1 })
db.payments.createIndex({ "status": 1, "createdAt": -1 })

// Audit Logs Collection Indexes
db.audit_logs.createIndex({ "actorId": 1, "timestamp": -1 })
db.audit_logs.createIndex({ "action": 1, "timestamp": -1 })
db.audit_logs.createIndex({ "resourceId": 1, "timestamp": -1 })
db.audit_logs.createIndex({ "timestamp": -1 })
db.audit_logs.createIndex({ "severity": 1, "timestamp": -1 })
```

### Compound Indexes for Complex Queries
```javascript
// Multi-field queries
db.urls.createIndex({ "userId": 1, "isActive": 1, "createdAt": -1 })
db.analytics.createIndex({ "urlId": 1, "isBot": 1, "timestamp": -1 })
db.support_tickets.createIndex({ "status": 1, "priority": 1, "createdAt": -1 })

// Text search indexes
db.urls.createIndex({ 
  "title": "text", 
  "description": "text", 
  "tags": "text" 
})
db.support_tickets.createIndex({ 
  "subject": "text", 
  "message": "text" 
})
```

## 🔄 Data Relationships

### Reference Patterns

#### 1. One-to-Many Relationships
```javascript
// User -> URLs (One user has many URLs)
// Stored as reference in URLs collection
{
  _id: ObjectId("url_id"),
  userId: ObjectId("user_id"), // Reference to users collection
  shortCode: "abc123",
  // ... other fields
}

// Team -> Members (One team has many members)
// Embedded in teams collection for performance
{
  _id: ObjectId("team_id"),
  members: [
    {
      userId: ObjectId("user_id"), // Reference to users collection
      role: "admin",
      joinedAt: ISODate("...")
    }
  ]
}
```

#### 2. Many-to-Many Relationships
```javascript
// Users <-> Teams (Users can belong to multiple teams)
// Handled through embedded members array in teams collection
// and separate query for user's teams

// Tags <-> URLs (URLs can have multiple tags, tags can be on multiple URLs)
// Embedded as array in URLs collection
{
  _id: ObjectId("url_id"),
  tags: ["marketing", "social", "campaign"]
}
```

### Denormalization for Performance
```javascript
// Analytics summary denormalized in URLs collection
{
  _id: ObjectId("url_id"),
  analytics: {
    totalClicks: 1250, // Calculated from analytics collection
    uniqueClicks: 890,
    lastClickAt: ISODate("..."),
    topCountries: ["US", "UK", "CA"] // Top 3 countries
  }
}

// User information denormalized in support tickets
{
  _id: ObjectId("ticket_id"),
  userId: ObjectId("user_id"),
  userEmail: "user@company.com", // Denormalized for quick access
  userName: "John Doe", // Denormalized for quick access
  userPlan: "PRO" // Denormalized for filtering
}
```

## 📊 Aggregation Pipelines

### Analytics Aggregations
```javascript
// Daily clicks aggregation
db.analytics.aggregate([
  {
    $match: {
      urlId: ObjectId("url_id"),
      timestamp: {
        $gte: ISODate("2024-01-01T00:00:00Z"),
        $lte: ISODate("2024-01-31T23:59:59Z")
      }
    }
  },
  {
    $group: {
      _id: {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$timestamp"
        }
      },
      clicks: { $sum: 1 },
      uniqueClicks: { $addToSet: "$ipAddress" }
    }
  },
  {
    $project: {
      date: "$_id",
      clicks: 1,
      uniqueClicks: { $size: "$uniqueClicks" }
    }
  },
  { $sort: { date: 1 } }
])

// Geographic distribution
db.analytics.aggregate([
  {
    $match: {
      urlId: ObjectId("url_id"),
      "location.country": { $exists: true }
    }
  },
  {
    $group: {
      _id: "$location.country",
      clicks: { $sum: 1 },
      cities: { $addToSet: "$location.city" }
    }
  },
  {
    $project: {
      country: "$_id",
      clicks: 1,
      cities: { $size: "$cities" }
    }
  },
  { $sort: { clicks: -1 } },
  { $limit: 10 }
])

// User engagement metrics
db.users.aggregate([
  {
    $lookup: {
      from: "urls",
      localField: "_id",
      foreignField: "userId",
      as: "urls"
    }
  },
  {
    $lookup: {
      from: "analytics",
      localField: "_id",
      foreignField: "userId",
      as: "analytics"
    }
  },
  {
    $project: {
      email: 1,
      plan: 1,
      createdAt: 1,
      totalUrls: { $size: "$urls" },
      totalClicks: { $size: "$analytics" },
      avgClicksPerUrl: {
        $cond: {
          if: { $gt: [{ $size: "$urls" }, 0] },
          then: { $divide: [{ $size: "$analytics" }, { $size: "$urls" }] },
          else: 0
        }
      }
    }
  }
])
```

### Business Intelligence Queries
```javascript
// Monthly revenue by plan
db.payments.aggregate([
  {
    $match: {
      status: "captured",
      createdAt: {
        $gte: ISODate("2024-01-01T00:00:00Z"),
        $lte: ISODate("2024-12-31T23:59:59Z")
      }
    }
  },
  {
    $group: {
      _id: {
        month: { $month: "$createdAt" },
        year: { $year: "$createdAt" },
        plan: "$subscription.planId"
      },
      revenue: { $sum: "$amount" },
      transactions: { $sum: 1 }
    }
  },
  {
    $group: {
      _id: {
        month: "$_id.month",
        year: "$_id.year"
      },
      totalRevenue: { $sum: "$revenue" },
      planBreakdown: {
        $push: {
          plan: "$_id.plan",
          revenue: "$revenue",
          transactions: "$transactions"
        }
      }
    }
  },
  { $sort: { "_id.year": 1, "_id.month": 1 } }
])

// User churn analysis
db.users.aggregate([
  {
    $match: {
      "subscription.status": { $in: ["canceled", "past_due"] }
    }
  },
  {
    $lookup: {
      from: "analytics",
      let: { userId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ["$userId", "$$userId"] },
            timestamp: {
              $gte: ISODate("2024-01-01T00:00:00Z")
            }
          }
        },
        {
          $group: {
            _id: null,
            lastActivity: { $max: "$timestamp" },
            totalActivity: { $sum: 1 }
          }
        }
      ],
      as: "activity"
    }
  },
  {
    $project: {
      email: 1,
      plan: 1,
      subscriptionStatus: "$subscription.status",
      canceledAt: "$subscription.canceledAt",
      lastActivity: { $arrayElemAt: ["$activity.lastActivity", 0] },
      totalActivity: { $arrayElemAt: ["$activity.totalActivity", 0] },
      daysSinceLastActivity: {
        $divide: [
          { $subtract: [new Date(), { $arrayElemAt: ["$activity.lastActivity", 0] }] },
          86400000 // milliseconds in a day
        ]
      }
    }
  }
])
```

## 🔧 Database Configuration

### MongoDB Configuration
```yaml
# mongod.conf
storage:
  dbPath: /var/lib/mongodb
  journal:
    enabled: true
  wiredTiger:
    engineConfig:
      cacheSizeGB: 4
      journalCompressor: snappy
    collectionConfig:
      blockCompressor: snappy
    indexConfig:
      prefixCompression: true

systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongod.log
  logRotate: reopen

net:
  port: 27017
  bindIp: 127.0.0.1

replication:
  replSetName: "bitaurl-rs"

sharding:
  clusterRole: shardsvr

operationProfiling:
  slowOpThresholdMs: 100
  mode: slowOp
```

### Connection Configuration
```java
// Spring Boot MongoDB Configuration
@Configuration
public class MongoConfig {
    
    @Value("${spring.data.mongodb.uri}")
    private String mongoUri;
    
    @Bean
    public MongoClient mongoClient() {
        ConnectionString connectionString = new ConnectionString(mongoUri);
        
        MongoClientSettings settings = MongoClientSettings.builder()
                .applyConnectionString(connectionString)
                .applyToConnectionPoolSettings(builder -> 
                    builder.maxSize(100)
                           .minSize(10)
                           .maxWaitTime(2, TimeUnit.SECONDS)
                           .maxConnectionLifeTime(30, TimeUnit.MINUTES)
                           .maxConnectionIdleTime(10, TimeUnit.MINUTES))
                .applyToSocketSettings(builder -> 
                    builder.connectTimeout(2, TimeUnit.SECONDS)
                           .readTimeout(5, TimeUnit.SECONDS))
                .readPreference(ReadPreference.secondaryPreferred())
                .writeConcern(WriteConcern.MAJORITY)
                .readConcern(ReadConcern.MAJORITY)
                .build();
        
        return MongoClients.create(settings);
    }
    
    @Bean
    public MongoTemplate mongoTemplate() {
        return new MongoTemplate(mongoClient(), "bitaurl");
    }
}
```

## 🚀 Performance Optimization

### Query Optimization
```javascript
// Use projection to limit returned fields
db.users.find(
  { plan: "PRO" },
  { email: 1, name: 1, createdAt: 1 }
)

// Use indexes for sorting
db.urls.find({ userId: ObjectId("...") })
       .sort({ createdAt: -1 })
       .limit(20)

// Use aggregation for complex queries instead of multiple queries
db.urls.aggregate([
  { $match: { userId: ObjectId("...") } },
  { $lookup: {
      from: "analytics",
      localField: "_id",
      foreignField: "urlId",
      as: "clickData"
    }
  },
  { $addFields: {
      totalClicks: { $size: "$clickData" }
    }
  },
  { $project: { clickData: 0 } }
])
```

### Caching Strategy
```java
// Redis caching for frequently accessed data
@Service
public class UrlService {
    
    @Cacheable(value = "urls", key = "#shortCode")
    public Url findByShortCode(String shortCode) {
        return urlRepository.findByShortCode(shortCode);
    }
    
    @CacheEvict(value = "urls", key = "#url.shortCode")
    public Url updateUrl(Url url) {
        return urlRepository.save(url);
    }
    
    @Cacheable(value = "analytics", key = "#urlId + '_' + #timeRange")
    public AnalyticsData getAnalytics(String urlId, String timeRange) {
        // Complex analytics calculation
        return calculateAnalytics(urlId, timeRange);
    }
}
```

## 🔒 Security Considerations

### Data Encryption
```javascript
// Encrypt sensitive fields at application level
{
  _id: ObjectId("..."),
  email: "user@example.com",
  passwordHash: "$2b$10$...", // BCrypt hash
  encryptedData: {
    // Sensitive data encrypted with AES-256
    personalInfo: "encrypted_string_here",
    paymentInfo: "encrypted_string_here"
  }
}
```

### Access Control
```javascript
// Database user roles
db.createUser({
  user: "bitaurl_app",
  pwd: "secure_password",
  roles: [
    {
      role: "readWrite",
      db: "bitaurl"
    }
  ]
})

db.createUser({
  user: "bitaurl_readonly",
  pwd: "readonly_password",
  roles: [
    {
      role: "read",
      db: "bitaurl"
    }
  ]
})
```

## 📈 Monitoring & Maintenance

### Database Monitoring
```javascript
// Monitor slow queries
db.setProfilingLevel(2, { slowms: 100 })

// Check index usage
db.urls.aggregate([
  { $indexStats: {} }
])

// Monitor collection statistics
db.stats()
db.urls.stats()

// Check replication lag
rs.printSlaveReplicationInfo()
```

### Backup Strategy
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/mongodb"

# Create backup
mongodump --uri="mongodb://username:password@host:port/bitaurl" \
          --out="$BACKUP_DIR/backup_$DATE"

# Compress backup
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" \
    -C "$BACKUP_DIR" "backup_$DATE"

# Remove uncompressed backup
rm -rf "$BACKUP_DIR/backup_$DATE"

# Upload to cloud storage
aws s3 cp "$BACKUP_DIR/backup_$DATE.tar.gz" \
    "s3://bitaurl-backups/mongodb/"

# Clean up old backups (keep last 30 days)
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +30 -delete
```

---

This database documentation provides comprehensive guidance for designing, implementing, and maintaining the MongoDB database for BitaURL. The schema is designed for scalability, performance, and data integrity while supporting all the platform's features and requirements.