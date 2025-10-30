# API Commands to Set Up Custom Domains in MongoDB Atlas

Your backend service appears to be suspended. Once you restart it, use these exact API commands to set up the domains collection in MongoDB Atlas.

## Prerequisites

1. **Start your backend service** (currently suspended)
2. **Ensure MongoDB Atlas connection** is working
3. **Deploy the updated code** with the new endpoints

## API Endpoints Created

I've created these endpoints in `DirectDatabaseSetupController.java`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/direct-setup/check-domains-collection` | GET | Check current state |
| `/api/v1/direct-setup/create-domains-collection-now` | POST | Create collection & indexes |
| `/api/v1/direct-setup/test-domain-creation` | POST | Test with real domain |

## Step-by-Step API Commands

### Step 1: Check Current State
```bash
curl -X GET "https://your-backend-url.com/api/v1/direct-setup/check-domains-collection" \
  -H "Content-Type: application/json"
```

**Expected Response (if collection doesn't exist):**
```json
{
  "success": true,
  "collection_exists": false,
  "message": "Domains collection does not exist yet"
}
```

### Step 2: Create Domains Collection
```bash
curl -X POST "https://your-backend-url.com/api/v1/direct-setup/create-domains-collection-now" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "timestamp": "2025-10-30T...",
  "message": "Domains collection created and tested successfully!",
  "details": {
    "collection_exists": true,
    "total_domains": 1,
    "total_indexes": 6,
    "test_domain_created": "test-1730123456789.example.com",
    "test_domain_id": "ObjectId(...)",
    "test_query_success": true
  }
}
```

### Step 3: Test with Your Real Domain
```bash
curl -X POST "https://your-backend-url.com/api/v1/direct-setup/test-domain-creation" \
  -H "Content-Type: application/json" \
  -d '{
    "domainName": "go.mybrand.com",
    "ownerType": "USER",
    "ownerId": "your-user-id"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test domain created and verified in MongoDB Atlas!",
  "domain": {
    "id": "ObjectId(...)",
    "domainName": "go.mybrand.com",
    "ownerType": "USER",
    "ownerId": "your-user-id",
    "status": "RESERVED",
    "verificationToken": "abc123xyz789",
    "cnameTarget": "abc123xyz789.verify.bitaurl.com",
    "createdAt": "2025-10-30T..."
  },
  "verification": {
    "saved_successfully": true,
    "found_in_database": true,
    "data_matches": true
  }
}
```

### Step 4: Verify in MongoDB Atlas
```bash
curl -X GET "https://your-backend-url.com/api/v1/direct-setup/check-domains-collection" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "collection_exists": true,
  "total_domains": 2,
  "total_indexes": 6,
  "sample_domains": [
    {
      "id": "ObjectId(...)",
      "domainName": "go.mybrand.com",
      "status": "RESERVED",
      "ownerType": "USER",
      "createdAt": "2025-10-30T..."
    }
  ]
}
```

## What These Commands Do

### 1. **Creates MongoDB Collection**
- Collection name: `domains`
- Database: `pebly-database` (your consolidated database)
- Validation schema: Ensures data integrity

### 2. **Creates Optimized Indexes**
- `idx_domain_name_unique` - Prevents duplicate domains
- `idx_owner_compound` - Fast user/team queries
- `idx_domain_status` - Filter by verification status
- `idx_verification_token_unique` - Fast token lookups
- `idx_owner_status_compound` - Most common query pattern

### 3. **Tests Real Data Storage**
- Creates actual domain document
- Verifies it's stored correctly
- Tests query functionality

## Verification in MongoDB Atlas

After running the commands, check MongoDB Atlas:

1. **Go to MongoDB Atlas Dashboard**
2. **Navigate to your cluster**
3. **Click "Browse Collections"**
4. **Select `pebly-database` database**
5. **You should see `domains` collection**
6. **Click on `domains` to see your test data**

You should see documents like:
```json
{
  "_id": ObjectId("..."),
  "domainName": "go.mybrand.com",
  "ownerType": "USER",
  "ownerId": "your-user-id",
  "status": "RESERVED",
  "verificationToken": "abc123xyz789",
  "cnameTarget": "abc123xyz789.verify.bitaurl.com",
  "createdAt": ISODate("2025-10-30T..."),
  "updatedAt": ISODate("2025-10-30T...")
}
```

## Troubleshooting

### If you get 404 errors:
- The new endpoints aren't deployed yet
- Redeploy your backend with the new `DirectDatabaseSetupController.java`

### If you get 500 errors:
- Check MongoDB Atlas connection
- Verify `MONGODB_URI` environment variable
- Check application logs

### If collection creation fails:
- Verify MongoDB Atlas user has write permissions
- Check if database name is correct (`pebly`)
- Ensure IP whitelist includes your server

## Next Steps After Success

Once the domains collection is created and tested:

1. **Custom domain endpoints will work**: `/api/v1/domains`
2. **Users can create domains** via your app
3. **Domain data will be stored** in MongoDB Atlas
4. **Configure DNS** for `verify.bitaurl.com`
5. **Set up Cloudflare API** for SSL provisioning

## Alternative: Direct MongoDB Atlas Setup

If API approach doesn't work, you can also set up directly in MongoDB Atlas:

1. **Go to MongoDB Atlas → Browse Collections**
2. **Create collection named `domains`**
3. **Insert this sample document**:

```json
{
  "domainName": "go.mybrand.com",
  "ownerType": "USER",
  "ownerId": "test-user",
  "verificationToken": "abc123xyz",
  "status": "RESERVED",
  "sslStatus": "PENDING",
  "cnameTarget": "abc123xyz.verify.bitaurl.com",
  "verificationAttempts": 0,
  "totalRedirects": 0,
  "isBlacklisted": false,
  "createdAt": {"$date": "2025-10-30T10:30:00.000Z"},
  "updatedAt": {"$date": "2025-10-30T10:30:00.000Z"}
}
```

4. **Create indexes** (see previous guides)

The domains collection will then be ready for your custom domain feature!