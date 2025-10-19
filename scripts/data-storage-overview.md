# MongoDB Data Storage Overview for Pebly URL Shortener

This document explains how all user data, files, links, and analytics are stored in MongoDB for production use.

## Database Structure

### Database: `pebly_production`

All data is stored in MongoDB Atlas with the following collections:

## 1. Users Collection (`users`)

Stores all user account information and subscription data.

```javascript
{
  "_id": ObjectId("..."),
  "email": "user@example.com",
  "name": "John Doe",
  "password": "$2a$12$...", // Hashed password
  "googleId": "google_oauth_id", // For OAuth users
  "profilePicture": "https://...",
  
  // Subscription & Limits
  "subscriptionPlan": "PRO", // FREE, PRO, ENTERPRISE
  "subscriptionExpiry": ISODate("2024-12-31"),
  "isActive": true,
  
  // Usage Tracking
  "urlsCreated": 150,
  "maxUrls": 10000,
  "clicksThisMonth": 5000,
  "maxClicksPerMonth": 100000,
  "apiCallsThisMonth": 200,
  "maxApiCallsPerMonth": 10000,
  
  // Feature Access
  "canUseCustomDomains": true,
  "canUsePasswordProtection": true,
  "canUseAnalytics": true,
  "canUseFileUploads": true,
  "canUseBulkOperations": true,
  
  // API & Security
  "apiKey": "pk_abc123...",
  "twoFactorEnabled": false,
  "twoFactorSecret": "...",
  "allowedIpAddresses": ["192.168.1.1"],
  
  // Preferences
  "defaultDomain": "short.ly",
  "emailNotifications": true,
  "timezone": "UTC",
  
  // Timestamps
  "createdAt": ISODate("2024-01-01"),
  "updatedAt": ISODate("2024-01-15"),
  "lastLoginAt": ISODate("2024-01-15")
}
```

## 2. URLs Collection (`urls`)

Stores all shortened URLs and their metadata.

```javascript
{
  "_id": ObjectId("..."),
  "shortCode": "abc123", // Unique short identifier
  "originalUrl": "https://example.com/very/long/url",
  "userId": "user_id_reference",
  
  // Metadata
  "title": "Example Website",
  "description": "A sample website for demonstration",
  
  // Security Features
  "password": "$2a$12$...", // Hashed password for protected links
  "isPasswordProtected": true,
  
  // Expiry Features
  "expiresAt": ISODate("2024-12-31"),
  "hasExpiry": true,
  
  // Analytics
  "clickCount": 1250,
  "uniqueClickCount": 890,
  
  // File Information (for uploaded files)
  "isFileUrl": true,
  "fileName": "document.pdf",
  "fileType": "pdf",
  "fileSize": 2048576, // Size in bytes
  "fileStoragePath": "gridfs_file_id", // Reference to GridFS
  
  // Advanced Features
  "customDomain": "custom.domain.com",
  "allowedCountries": ["US", "CA", "UK"],
  "blockedCountries": ["XX"],
  "allowedDevices": ["desktop", "mobile"],
  "maxClicksPerDay": 100,
  "maxClicksPerHour": 10,
  
  // QR Code
  "qrCodeUrl": "https://api.qrserver.com/v1/create-qr-code/?data=...",
  
  // Metadata
  "metadata": {
    "campaign": "summer2024",
    "source": "email"
  },
  
  // Status
  "isActive": true,
  "createdAt": ISODate("2024-01-01"),
  "updatedAt": ISODate("2024-01-15")
}
```

## 3. Analytics Collection (`analytics`)

Stores detailed click analytics for real-time reporting.

```javascript
{
  "_id": ObjectId("..."),
  "urlId": "url_reference_id",
  "shortCode": "abc123",
  "userId": "user_id_reference",
  
  // Request Information
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "referer": "https://google.com/search?q=...",
  
  // Geographic Data
  "country": "United States",
  "region": "California",
  "city": "San Francisco",
  "timezone": "America/Los_Angeles",
  "latitude": 37.7749,
  "longitude": -122.4194,
  
  // Device Information
  "deviceType": "desktop", // mobile, desktop, tablet
  "browser": "Chrome",
  "browserVersion": "91.0",
  "operatingSystem": "Windows",
  "osVersion": "10",
  
  // Tracking
  "timestamp": ISODate("2024-01-15T10:30:00Z"),
  "isUniqueVisit": true,
  "sessionId": "session_abc123",
  
  // UTM Parameters
  "utmSource": "google",
  "utmMedium": "cpc",
  "utmCampaign": "summer2024",
  "utmTerm": "url shortener",
  "utmContent": "ad1",
  
  // Performance
  "responseTime": 150, // milliseconds
  "statusCode": 200,
  
  // Custom Data
  "customData": {
    "experiment": "A",
    "version": "2.1"
  }
}
```

## 4. User Activities Collection (`user_activities`)

Tracks all user interactions and system events.

```javascript
{
  "_id": ObjectId("..."),
  "userId": "user_id_reference",
  "activityType": "URL_CREATED", // URL_CREATED, FILE_UPLOADED, PROFILE_UPDATED, etc.
  "description": "Created short URL for https://example.com",
  "data": {
    "shortCode": "abc123",
    "originalUrl": "https://example.com",
    "method": "API"
  },
  "timestamp": ISODate("2024-01-15T10:30:00Z")
}
```

## 5. File Storage (GridFS)

Files are stored using MongoDB GridFS for efficient handling of large files.

### GridFS Files Collection (`fs.files`)
```javascript
{
  "_id": ObjectId("..."),
  "filename": "document.pdf",
  "contentType": "application/pdf",
  "length": 2048576,
  "chunkSize": 261120,
  "uploadDate": ISODate("2024-01-15T10:30:00Z"),
  "metadata": {
    "userId": "user_id_reference",
    "originalFileName": "Important Document.pdf",
    "description": "Company financial report",
    "tags": ["finance", "report", "2024"],
    "isPublic": false,
    "downloadCount": 25,
    "uploadedAt": ISODate("2024-01-15T10:30:00Z")
  }
}
```

### GridFS Chunks Collection (`fs.chunks`)
```javascript
{
  "_id": ObjectId("..."),
  "files_id": ObjectId("file_reference"),
  "n": 0, // Chunk number
  "data": BinData(...) // Binary file data
}
```

## Data Relationships

### User → URLs
- One user can have multiple URLs
- URLs reference user via `userId` field
- User limits are enforced (maxUrls, maxClicksPerMonth)

### URLs → Analytics
- Each URL click generates analytics record
- Analytics reference URL via `urlId` and `shortCode`
- Real-time aggregation for dashboard metrics

### URLs → Files (GridFS)
- File URLs reference GridFS files via `fileStoragePath`
- File metadata stored in GridFS metadata
- Secure access control via user permissions

### User → Activities
- All user actions logged in user_activities
- Audit trail for compliance and debugging
- Activity types: URL_CREATED, FILE_UPLOADED, PROFILE_UPDATED, etc.

## Performance Optimizations

### Indexes Created
```javascript
// URLs Collection
db.urls.createIndex({ "shortCode": 1 }, { unique: true })
db.urls.createIndex({ "userId": 1, "createdAt": -1 })
db.urls.createIndex({ "shortCode": 1, "isActive": 1 })
db.urls.createIndex({ "expiresAt": 1, "isActive": 1 })

// Analytics Collection
db.analytics.createIndex({ "urlId": 1, "timestamp": -1 })
db.analytics.createIndex({ "userId": 1, "timestamp": -1 })
db.analytics.createIndex({ "shortCode": 1, "timestamp": -1 })
db.analytics.createIndex({ "ipAddress": 1, "timestamp": -1 })

// Users Collection
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "apiKey": 1 }, { sparse: true })

// User Activities Collection
db.user_activities.createIndex({ "userId": 1, "timestamp": -1 })
db.user_activities.createIndex({ "activityType": 1 })
```

### TTL (Time To Live) Indexes
```javascript
// Analytics data expires after 2 years
db.analytics.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 63072000 })

// User activities expire after 1 year
db.user_activities.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 31536000 })
```

## Data Security

### Encryption
- Passwords hashed with BCrypt (strength 12)
- API keys generated with UUID + prefix
- Sensitive data never stored in plain text

### Access Control
- User-based data isolation
- File access permissions via GridFS metadata
- IP-based restrictions for enhanced security

### Data Retention
- Analytics: 2 years (configurable)
- User activities: 1 year (configurable)
- Files: Until manually deleted by user
- URLs: Until manually deleted or expired

## Backup Strategy

### Automated Backups
- MongoDB Atlas automatic backups
- Point-in-time recovery available
- Cross-region replication for disaster recovery

### Manual Backup Script
```bash
# Run backup script
./scripts/backup.sh
```

## Monitoring

### Real-time Metrics
- Active users count
- URLs created per day
- File uploads per day
- Click analytics in real-time

### Performance Monitoring
- Database query performance
- Index usage statistics
- Connection pool monitoring
- Memory and CPU usage

## Compliance

### GDPR Compliance
- User data export functionality
- Right to be forgotten (data deletion)
- Consent tracking in user activities
- Data processing audit trail

### Data Privacy
- Personal data encryption
- Access logging
- Data minimization principles
- Regular security audits

This comprehensive data storage system ensures:
- ✅ High performance with millions of users
- ✅ Real-time analytics and reporting
- ✅ Secure file storage and access
- ✅ Complete audit trail
- ✅ Scalable architecture
- ✅ GDPR compliance
- ✅ Data integrity and backup