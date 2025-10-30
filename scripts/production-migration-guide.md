# Production Database Migration Guide for Custom Domains

This guide provides step-by-step instructions for safely migrating your production MongoDB Atlas database to support the custom domain feature.

## ⚠️ IMPORTANT: Pre-Migration Checklist

Before starting the migration, ensure you have:

1. **Database Backup**: Create a backup of your production database
2. **Maintenance Window**: Schedule during low-traffic hours
3. **Environment Variables**: Ensure all required env vars are set
4. **Testing**: Test the migration on a staging environment first
5. **Rollback Plan**: Have a rollback strategy ready

## Step 1: Create Database Backup

### Using MongoDB Atlas UI
1. Go to your MongoDB Atlas dashboard
2. Navigate to your cluster
3. Click "..." → "Create Snapshot"
4. Name it: `pre-custom-domain-migration-YYYY-MM-DD`

### Using MongoDB Tools
```bash
# Export current collections
mongodump --uri="your-production-connection-string" --out=backup-$(date +%Y%m%d)

# Specific collections backup
mongoexport --uri="your-connection-string" --collection=users --out=users-backup.json
mongoexport --uri="your-connection-string" --collection=shortened_urls --out=urls-backup.json
mongoexport --uri="your-connection-string" --collection=teams --out=teams-backup.json
```

## Step 2: Check Current Database State

First, check your current production database state:

```bash
curl -X GET "https://your-backend-url.com/api/v1/database/check-production-database" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "database_state": {
    "collections": {
      "users": true,
      "shortened_urls": true,
      "teams": true,
      "domains": false
    },
    "counts": {
      "users": 1250,
      "urls": 45000,
      "teams": 85,
      "domains": 0
    },
    "migration_status": {
      "urls_with_domain_field": 0,
      "urls_need_migration": 45000,
      "migration_required": true
    }
  }
}
```

## Step 3: Deploy Updated Application

1. **Deploy the new version** with custom domain code
2. **Verify deployment** - the app should start successfully
3. **Check health endpoint**:
   ```bash
   curl https://your-backend-url.com/actuator/health
   ```

## Step 4: Run Production Migration

### Option A: Full Automated Migration (Recommended)

Run the complete migration in one step:

```bash
curl -X POST "https://your-backend-url.com/api/v1/database/full-production-migration" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

This will:
1. Initialize the domains collection
2. Migrate existing URLs
3. Create all necessary indexes
4. Validate the migration

### Option B: Step-by-Step Migration

If you prefer more control, run each step individually:

#### Step 4.1: Initialize Domains Collection
```bash
curl -X POST "https://your-backend-url.com/api/v1/database/initialize-domains-production" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Step 4.2: Migrate URLs for Custom Domain Support
```bash
curl -X POST "https://your-backend-url.com/api/v1/database/migrate-urls-production" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

#### Step 4.3: Add Custom Domain Indexes
```bash
curl -X POST "https://your-backend-url.com/api/v1/database/add-domain-indexes-production" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Step 5: Validate Migration

Verify that the migration was successful:

```bash
curl -X GET "https://your-backend-url.com/api/v1/database/validate-production-migration" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "validation": {
    "collections": {
      "domains_exists": true,
      "urls_exists": true
    },
    "data": {
      "domain_count": 0,
      "url_count": 45000,
      "urls_with_domain_field": 45000,
      "migration_complete": true
    },
    "indexes": {
      "domain_indexes": 10,
      "url_indexes": 8
    },
    "migration_successful": true
  }
}
```

## Step 6: Test Custom Domain Functionality

### 6.1 Test Domain Creation
```bash
curl -X POST "https://your-backend-url.com/api/v1/domains" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domainName": "test.yourdomain.com",
    "ownerType": "USER",
    "ownerId": "test-user-id"
  }'
```

### 6.2 Test URL Creation with Custom Domain
```bash
curl -X POST "https://your-backend-url.com/api/v1/urls" \
  -H "Authorization: Bearer USER_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://example.com/test",
    "customDomain": "test.yourdomain.com",
    "userId": "test-user-id"
  }'
```

### 6.3 Test Existing URLs Still Work
```bash
# Test an existing short URL
curl -I "https://your-domain.com/existing-short-code"
```

## Step 7: Monitor and Verify

### 7.1 Check Application Logs
Monitor your application logs for any errors:
- Domain creation/verification
- URL shortening with custom domains
- Database query performance

### 7.2 Monitor Database Performance
In MongoDB Atlas:
1. Go to Metrics tab
2. Monitor query performance
3. Check index usage
4. Watch for slow queries

### 7.3 Test User Workflows
1. **User Registration/Login** - Should work normally
2. **URL Shortening** - Should work with default domain
3. **Custom Domain Addition** - Should work for Pro/Business users
4. **Team Functionality** - Should work normally

## Rollback Plan (If Needed)

If something goes wrong, you can rollback:

### Option 1: Restore from Backup
1. Go to MongoDB Atlas
2. Restore from the snapshot created in Step 1
3. Redeploy the previous version of your application

### Option 2: Manual Rollback
```bash
# Remove the domain field from URLs (if needed)
db.shortened_urls.updateMany(
  {},
  { $unset: { "domain": "" } }
)

# Drop the domains collection
db.domains.drop()

# Remove custom domain indexes
db.shortened_urls.dropIndex("idx_shortcode_domain_compound")
db.shortened_urls.dropIndex("idx_domain")
db.shortened_urls.dropIndex("idx_domain_created")
```

## Post-Migration Tasks

### 1. Update Documentation
- Update API documentation
- Update user guides
- Update team onboarding

### 2. Configure DNS
Set up the verification subdomain:
```
Type: CNAME
Name: *.verify.bitaurl.com
Value: your-backend-domain.com
TTL: 300
```

### 3. Set Up Monitoring
- Set up alerts for domain verification failures
- Monitor SSL certificate provisioning
- Track custom domain usage metrics

### 4. User Communication
- Announce the new feature to users
- Update pricing pages
- Create help documentation

## Environment Variables Checklist

Ensure these are set in production:

```bash
# Database
MONGODB_URI=mongodb+srv://...
MONGODB_DATABASE=pebly

# Custom Domains
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ZONE_ID=your_zone_id
SSL_PROVIDER=CLOUDFLARE

# Application
SHORT_URL_DOMAIN=https://pebly.vercel.app
FRONTEND_URL=https://pebly.vercel.app
```

## Troubleshooting

### Common Issues

1. **Migration Timeout**
   - The migration runs in batches to avoid timeouts
   - Check MongoDB Atlas metrics for performance

2. **Index Creation Fails**
   - Indexes are created in background mode
   - Check MongoDB Atlas for index build progress

3. **Existing URLs Not Working**
   - Verify the domain field migration completed
   - Check redirect controller logic

4. **Performance Issues**
   - Monitor query performance in Atlas
   - Verify indexes are being used

### Debug Commands

```javascript
// Check migration status
db.shortened_urls.countDocuments({domain: {$exists: true}})
db.shortened_urls.countDocuments({domain: {$exists: false}})

// Check indexes
db.domains.getIndexes()
db.shortened_urls.getIndexes()

// Sample queries to test performance
db.shortened_urls.find({shortCode: "abc123", domain: null}).explain("executionStats")
db.domains.find({ownerId: "user123", ownerType: "USER", status: "VERIFIED"}).explain("executionStats")
```

## Success Criteria

The migration is successful when:

✅ All existing URLs have the `domain` field (set to `null` for default)  
✅ Domains collection exists with proper indexes  
✅ Custom domain indexes are created on URLs collection  
✅ Existing functionality works normally  
✅ New custom domain endpoints work  
✅ No performance degradation  
✅ All tests pass  

## Support

If you encounter issues during migration:

1. **Check the logs** in your application and MongoDB Atlas
2. **Run validation endpoint** to see current state
3. **Contact support** with specific error messages
4. **Have rollback plan ready** if critical issues occur

Remember: This migration is designed to be non-destructive and backward-compatible. Your existing URLs and functionality will continue to work normally.