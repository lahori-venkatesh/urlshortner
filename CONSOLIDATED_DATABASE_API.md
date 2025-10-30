# Consolidated Pebly Database API Documentation

## Overview
All data is now stored in a single MongoDB database: `pebly-database`. This includes:
- **URLs** (shortened_urls collection)
- **Custom Domains** (domains collection) 
- **Users** (users collection)
- **Analytics** (analytics collection)
- **Teams** (teams collection)

## Database Configuration

### Environment Variables
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=pebly-database
```

### Application Configuration
```yaml
spring:
  data:
    mongodb:
      uri: ${MONGODB_URI}
      database: ${MONGODB_DATABASE:pebly-database}
```

## API Endpoints

### 1. Database Initialization & Management

#### Initialize Complete Database
```http
POST /api/v1/init/initialize-all
```
**Description:** Initializes all collections and indexes in the consolidated database.

**Response:**
```json
{
  "success": true,
  "message": "Complete Pebly database initialized successfully!",
  "databaseName": "pebly-database",
  "operations": [
    "Initializing domains collection",
    "Updating shortened_urls collection for custom domain support",
    "Initializing users collection indexes",
    "Initializing analytics collection",
    "Initializing teams collection"
  ],
  "totalCollections": 5,
  "collections": ["domains", "shortened_urls", "users", "analytics", "teams"],
  "timestamp": "2024-10-30T10:30:00"
}
```

#### Get Database Status
```http
GET /api/v1/init/status
```
**Description:** Get comprehensive status of all collections in the database.

**Response:**
```json
{
  "success": true,
  "databaseName": "pebly-database",
  "totalCollections": 5,
  "collections": {
    "domains": {
      "documentCount": 3,
      "indexCount": 4
    },
    "shortened_urls": {
      "documentCount": 150,
      "indexCount": 6
    },
    "users": {
      "documentCount": 25,
      "indexCount": 3
    },
    "analytics": {
      "documentCount": 500,
      "indexCount": 3
    },
    "teams": {
      "documentCount": 5,
      "indexCount": 3
    }
  },
  "customDomainsReady": true,
  "timestamp": "2024-10-30T10:30:00"
}
```

#### Initialize Domains Collection
```http
POST /api/v1/init/domains
```
**Description:** Initialize only the domains collection with indexes and sample data.

#### Check Domains Status
```http
GET /api/v1/init/domains/status
```
**Description:** Check if domains collection is properly set up.

#### Create Test Domain
```http
POST /api/v1/init/domains/test
Content-Type: application/json

{
  "domainName": "test.example.com"
}
```

#### Cleanup Test Data
```http
DELETE /api/v1/init/cleanup-test-data
```
**Description:** Remove all test data from all collections.

### 2. Custom Domain Management

#### Create Domain
```http
POST /api/v1/domains
Content-Type: application/json

{
  "domainName": "go.mybrand.com",
  "ownerType": "USER",
  "ownerId": "user-123"
}
```

#### List Domains
```http
GET /api/v1/domains
GET /api/v1/domains?ownerId=user-123&ownerType=USER
```

#### Get Domain Details
```http
GET /api/v1/domains/{domainId}
```

#### Update Domain
```http
PUT /api/v1/domains/{domainId}
Content-Type: application/json

{
  "status": "VERIFIED",
  "sslStatus": "ACTIVE"
}
```

#### Delete Domain
```http
DELETE /api/v1/domains/{domainId}
```

#### Verify Domain
```http
POST /api/v1/domains/{domainId}/verify
```

#### Get Domain Analytics
```http
GET /api/v1/domains/{domainId}/analytics
```

### 3. URL Management (with Custom Domain Support)

#### Create Shortened URL
```http
POST /api/v1/urls/shorten
Content-Type: application/json

{
  "url": "https://www.example.com/long-url",
  "customAlias": "mylink",
  "domain": "go.mybrand.com",
  "userId": "user-123"
}
```

#### Create URL without Custom Domain
```http
POST /api/v1/urls/shorten
Content-Type: application/json

{
  "url": "https://www.example.com/long-url",
  "customAlias": "mylink",
  "userId": "user-123"
}
```

#### List URLs
```http
GET /api/v1/urls
GET /api/v1/urls?userId=user-123
GET /api/v1/urls?domain=go.mybrand.com
```

#### Get URL Details
```http
GET /api/v1/urls/{shortCode}
GET /api/v1/urls/{shortCode}?domain=go.mybrand.com
```

#### Update URL
```http
PUT /api/v1/urls/{shortCode}
Content-Type: application/json

{
  "url": "https://www.updated-example.com",
  "domain": "go.mybrand.com"
}
```

#### Delete URL
```http
DELETE /api/v1/urls/{shortCode}
```

### 4. URL Resolution (Redirect)

#### Redirect via Default Domain
```http
GET /{shortCode}
```

#### Redirect via Custom Domain
```http
GET /{shortCode}
Host: go.mybrand.com
```

### 5. Analytics

#### Dashboard Analytics
```http
GET /api/v1/analytics/dashboard
GET /api/v1/analytics/dashboard?userId=user-123
```

#### URL Analytics
```http
GET /api/v1/analytics/url/{shortCode}
GET /api/v1/analytics/url/{shortCode}?domain=go.mybrand.com
```

#### Domain Analytics
```http
GET /api/v1/analytics/domain/{domainName}
```

### 6. User Management

#### Get User Profile
```http
GET /api/v1/users/profile
Authorization: Bearer {jwt-token}
```

#### Update User Profile
```http
PUT /api/v1/users/profile
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

### 7. Team Management

#### Create Team
```http
POST /api/v1/teams
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "name": "My Team",
  "description": "Team for marketing links"
}
```

#### List Teams
```http
GET /api/v1/teams
Authorization: Bearer {jwt-token}
```

#### Get Team Details
```http
GET /api/v1/teams/{teamId}
Authorization: Bearer {jwt-token}
```

### 8. Authentication

#### Google OAuth Login
```http
POST /api/v1/auth/google
Content-Type: application/json

{
  "token": "google-oauth-token"
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Authorization: Bearer {refresh-token}
```

### 9. Monitoring & Health

#### Health Check
```http
GET /actuator/health
```

#### Metrics
```http
GET /actuator/metrics
```

#### Database Metrics
```http
GET /actuator/metrics/mongodb.driver.pool.size
```

## Database Collections Schema

### domains Collection
```javascript
{
  "_id": ObjectId,
  "domainName": "go.mybrand.com",
  "ownerType": "USER", // USER or TEAM
  "ownerId": "user-123",
  "verificationToken": "token-abc123",
  "status": "VERIFIED", // RESERVED, PENDING, VERIFIED, ERROR, SUSPENDED
  "sslStatus": "ACTIVE", // PENDING, ACTIVE, ERROR, EXPIRED
  "cnameTarget": "token-abc123.verify.bitaurl.com",
  "verificationAttempts": 1,
  "lastVerificationAttempt": ISODate,
  "sslProvider": "CLOUDFLARE",
  "sslIssuedAt": ISODate,
  "sslExpiresAt": ISODate,
  "nextReconfirmationDue": ISODate,
  "totalRedirects": 1500,
  "isBlacklisted": false,
  "ownershipHistory": [],
  "reservedUntil": ISODate, // for RESERVED status
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

### shortened_urls Collection
```javascript
{
  "_id": ObjectId,
  "shortCode": "abc123",
  "originalUrl": "https://www.example.com/long-url",
  "domain": "go.mybrand.com", // null for default domain
  "userId": "user-123",
  "totalClicks": 150,
  "active": true,
  "expiresAt": ISODate, // optional
  "password": "encrypted-password", // optional
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

### users Collection
```javascript
{
  "_id": ObjectId,
  "email": "user@example.com",
  "name": "John Doe",
  "googleId": "google-user-id",
  "profilePicture": "https://...",
  "subscription": {
    "plan": "PRO",
    "status": "ACTIVE",
    "expiresAt": ISODate
  },
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

### analytics Collection
```javascript
{
  "_id": ObjectId,
  "shortCode": "abc123",
  "domain": "go.mybrand.com", // null for default domain
  "userId": "user-123",
  "timestamp": ISODate,
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "referer": "https://google.com",
  "country": "US",
  "city": "New York",
  "device": "desktop",
  "browser": "Chrome"
}
```

### teams Collection
```javascript
{
  "_id": ObjectId,
  "name": "Marketing Team",
  "description": "Team for marketing campaigns",
  "ownerId": "user-123",
  "members": [
    {
      "userId": "user-456",
      "role": "MEMBER", // OWNER, ADMIN, MEMBER
      "joinedAt": ISODate
    }
  ],
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

## Database Indexes

### domains Collection Indexes
- `idx_domain_name_unique`: Unique index on `domainName`
- `idx_owner_compound`: Compound index on `ownerId` + `ownerType`
- `idx_domain_status`: Index on `status`
- `idx_verification_token_unique`: Unique index on `verificationToken`
- `idx_owner_status_compound`: Compound index on `ownerId` + `ownerType` + `status`

### shortened_urls Collection Indexes
- `idx_shortcode_domain_compound`: Compound index on `shortCode` + `domain`
- `idx_domain`: Index on `domain`
- `idx_user_id`: Index on `userId`
- `idx_created_at`: Index on `createdAt`

### users Collection Indexes
- `idx_user_email_unique`: Unique index on `email`
- `idx_user_google_id`: Index on `googleId`

### analytics Collection Indexes
- `idx_analytics_shortcode_timestamp`: Compound index on `shortCode` + `timestamp`
- `idx_analytics_user_id`: Index on `userId`

### teams Collection Indexes
- `idx_team_name_unique`: Unique index on `name`
- `idx_team_owner`: Index on `ownerId`

## Testing

### Run Complete Database Test
```bash
./scripts/test-consolidated-database.sh
```

### Manual Testing Steps
1. **Initialize Database:**
   ```bash
   curl -X POST http://localhost:8080/api/v1/init/initialize-all
   ```

2. **Check Status:**
   ```bash
   curl http://localhost:8080/api/v1/init/status
   ```

3. **Create Domain:**
   ```bash
   curl -X POST http://localhost:8080/api/v1/domains \
     -H "Content-Type: application/json" \
     -d '{"domainName":"test.example.com","ownerType":"USER","ownerId":"test-user"}'
   ```

4. **Create URL with Custom Domain:**
   ```bash
   curl -X POST http://localhost:8080/api/v1/urls/shorten \
     -H "Content-Type: application/json" \
     -d '{"url":"https://example.com","domain":"test.example.com","userId":"test-user"}'
   ```

## Production Deployment

### Environment Setup
```bash
# Required environment variables
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=pebly-database
FRONTEND_URL=https://your-frontend-domain.com
CLOUDFLARE_API_TOKEN=your-cloudflare-token
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Deployment Checklist
- [ ] Database is set to `pebly-database`
- [ ] All collections are initialized
- [ ] Indexes are created
- [ ] Custom domain verification is configured
- [ ] SSL certificate provisioning is set up
- [ ] Analytics tracking is enabled
- [ ] Rate limiting is configured
- [ ] Monitoring is set up

## Migration from Separate Databases

If you previously had separate databases, use this endpoint to consolidate:

```http
POST /api/v1/init/initialize-all
```

This will:
1. Create all collections in `pebly-database`
2. Add missing fields to existing collections
3. Create all necessary indexes
4. Migrate data structure for custom domain support

## Support

For issues or questions:
1. Check the API response for detailed error messages
2. Verify database connection and credentials
3. Ensure all required environment variables are set
4. Check the application logs for detailed error information