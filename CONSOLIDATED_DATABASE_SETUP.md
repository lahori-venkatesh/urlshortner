# Consolidated Database Setup - Pebly URL Shortener

## Overview

All Pebly data is now consolidated into a single MongoDB database: **`pebly-database`**

### What Changed
- ✅ **Single Database**: All collections now live in `pebly-database`
- ✅ **Custom Domains**: Integrated with existing URL system
- ✅ **Consistent Configuration**: All scripts and configs use `pebly-database`
- ✅ **Comprehensive APIs**: Complete set of endpoints for all functionality

### Database Structure
```
pebly-database/
├── domains              # Custom domain management
├── shortened_urls       # URL shortening (with custom domain support)
├── users               # User accounts and profiles
├── analytics           # Click tracking and analytics
└── teams               # Team collaboration
```

## Quick Start

### 1. Environment Configuration
Ensure your `.env` file has:
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=pebly-database
```

### 2. Initialize Database
```bash
# Start the backend
./scripts/start-with-consolidated-db.sh

# In another terminal, initialize the database
curl -X POST http://localhost:8080/api/v1/init/initialize-all
```

### 3. Verify Setup
```bash
# Check database status
curl http://localhost:8080/api/v1/init/status

# Run comprehensive tests
./scripts/test-consolidated-database.sh
```

## Key API Endpoints

### Database Management
- `POST /api/v1/init/initialize-all` - Initialize complete database
- `GET /api/v1/init/status` - Get database status
- `DELETE /api/v1/init/cleanup-test-data` - Clean test data

### Custom Domains
- `POST /api/v1/domains` - Create custom domain
- `GET /api/v1/domains` - List domains
- `POST /api/v1/domains/{id}/verify` - Verify domain

### URLs (with Custom Domain Support)
- `POST /api/v1/urls/shorten` - Create URL (with optional custom domain)
- `GET /api/v1/urls` - List URLs
- `GET /{shortCode}` - Redirect (supports custom domains)

### Analytics
- `GET /api/v1/analytics/dashboard` - Dashboard analytics
- `GET /api/v1/analytics/url/{shortCode}` - URL analytics
- `GET /api/v1/analytics/domain/{domain}` - Domain analytics

## Database Collections

### 1. domains
Custom domain management with verification and SSL status.

**Key Fields:**
- `domainName`: The custom domain (e.g., "go.mybrand.com")
- `ownerType`: "USER" or "TEAM"
- `ownerId`: Owner identifier
- `status`: "RESERVED", "PENDING", "VERIFIED", "ERROR", "SUSPENDED"
- `sslStatus`: "PENDING", "ACTIVE", "ERROR", "EXPIRED"

### 2. shortened_urls
URL shortening with custom domain support.

**Key Fields:**
- `shortCode`: The short identifier
- `originalUrl`: The target URL
- `domain`: Custom domain (null for default domain)
- `userId`: Owner of the URL

### 3. users
User accounts and profiles.

**Key Fields:**
- `email`: User email (unique)
- `googleId`: Google OAuth ID
- `subscription`: Subscription details

### 4. analytics
Click tracking and analytics data.

**Key Fields:**
- `shortCode`: The clicked short code
- `domain`: Custom domain used (if any)
- `timestamp`: When the click occurred
- `country`, `city`, `device`, `browser`: Analytics data

### 5. teams
Team collaboration features.

**Key Fields:**
- `name`: Team name (unique)
- `ownerId`: Team owner
- `members`: Array of team members with roles

## Database Indexes

All collections have optimized indexes for performance:

### domains Collection
- Unique index on `domainName`
- Compound index on `ownerId` + `ownerType`
- Index on `status` for filtering

### shortened_urls Collection
- **Compound index on `shortCode` + `domain`** (critical for custom domain resolution)
- Index on `domain` for filtering
- Index on `userId` for user queries

### Other Collections
- Users: Unique index on `email`, index on `googleId`
- Analytics: Compound index on `shortCode` + `timestamp`
- Teams: Unique index on `name`, index on `ownerId`

## Custom Domain Integration

### How It Works
1. **Domain Creation**: User creates a custom domain via API
2. **DNS Configuration**: User sets up CNAME record
3. **Verification**: System verifies DNS configuration
4. **SSL Provisioning**: Automatic SSL certificate via Cloudflare
5. **URL Creation**: URLs can be created with custom domains
6. **Resolution**: System resolves URLs using `shortCode` + `domain` compound index

### URL Resolution Logic
```javascript
// For custom domain: go.mybrand.com/abc123
db.shortened_urls.findOne({
  shortCode: "abc123",
  domain: "go.mybrand.com"
})

// For default domain: pebly.com/abc123
db.shortened_urls.findOne({
  shortCode: "abc123",
  domain: null
})
```

## Migration from Separate Databases

If you previously had separate databases:

1. **Backup existing data**
2. **Update configuration** to use `pebly-database`
3. **Run initialization**:
   ```bash
   curl -X POST http://localhost:8080/api/v1/init/initialize-all
   ```
4. **Migrate data** (if needed) using MongoDB tools
5. **Verify** everything works with the test script

## Production Deployment

### Environment Variables
```bash
# Required
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=pebly-database

# Optional but recommended
CLOUDFLARE_API_TOKEN=your-token
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
```

### Deployment Steps
1. **Set environment variables**
2. **Deploy backend** with updated configuration
3. **Initialize database**:
   ```bash
   curl -X POST https://your-api.com/api/v1/init/initialize-all
   ```
4. **Verify setup**:
   ```bash
   curl https://your-api.com/api/v1/init/status
   ```

## Monitoring

### Health Checks
- `GET /actuator/health` - Application health
- `GET /api/v1/init/status` - Database status
- `GET /actuator/metrics` - Application metrics

### Database Monitoring
Monitor these key metrics:
- Collection document counts
- Index usage and performance
- Query response times
- Connection pool status

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `MONGODB_URI` in environment variables
   - Verify network connectivity to MongoDB Atlas
   - Check database user permissions

2. **Collections Not Found**
   - Run database initialization: `POST /api/v1/init/initialize-all`
   - Check database name in configuration

3. **Custom Domain Not Working**
   - Verify domain is in "VERIFIED" status
   - Check DNS CNAME configuration
   - Ensure SSL certificate is active

4. **URL Resolution Failed**
   - Check if URL exists with correct domain
   - Verify compound index on `shortCode` + `domain`
   - Check application logs for errors

### Debug Commands
```bash
# Check database status
curl http://localhost:8080/api/v1/init/status

# List all domains
curl http://localhost:8080/api/v1/domains

# List all URLs
curl http://localhost:8080/api/v1/urls

# Check application health
curl http://localhost:8080/actuator/health
```

## Support

For additional help:
1. Check the comprehensive API documentation: `CONSOLIDATED_DATABASE_API.md`
2. Run the test script: `./scripts/test-consolidated-database.sh`
3. Review application logs for detailed error messages
4. Verify all environment variables are correctly set

## Benefits of Consolidated Database

✅ **Simplified Management**: Single database to manage and monitor
✅ **Better Performance**: Optimized indexes and queries
✅ **Easier Deployment**: Single connection string and configuration
✅ **Cost Effective**: No need for multiple database instances
✅ **Atomic Operations**: Transactions across related data
✅ **Simplified Backup**: Single database to backup and restore