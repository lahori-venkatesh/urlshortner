# Initialize Custom Domains Database - Simple API Commands

Use these simple API commands to create the domains collection in your MongoDB Atlas database.

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/init/domains` | POST | Initialize domains database |
| `/api/v1/init/domains/status` | GET | Check if domains are ready |
| `/api/v1/init/domains/test` | POST | Create test domain |

## Step 1: Initialize Domains Database

**Command:**
```bash
curl -X POST "https://your-backend-url.com/api/v1/init/domains" \
  -H "Content-Type: application/json"
```

**What this does:**
- Creates `domains` collection in MongoDB Atlas
- Creates 3 essential indexes
- Inserts sample domain `demo.example.com`
- Verifies everything works

**Expected Response:**
```json
{
  "success": true,
  "message": "Custom domains database initialized successfully!",
  "database_name": "pebly",
  "collection_name": "domains",
  "collection_exists": true,
  "total_domains": 1,
  "total_indexes": 4,
  "ready_for_custom_domains": true
}
```

## Step 2: Check Status

**Command:**
```bash
curl -X GET "https://your-backend-url.com/api/v1/init/domains/status" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "database_name": "pebly",
  "collection_name": "domains",
  "collection_exists": true,
  "total_domains": 1,
  "total_indexes": 4,
  "ready_for_custom_domains": true
}
```

## Step 3: Create Test Domain

**Command:**
```bash
curl -X POST "https://your-backend-url.com/api/v1/init/domains/test" \
  -H "Content-Type: application/json" \
  -d '{"domainName": "go.mybrand.com"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test domain created successfully in MongoDB Atlas!",
  "domain": {
    "domainName": "go.mybrand.com",
    "ownerType": "USER",
    "ownerId": "test-user-1730123456",
    "status": "RESERVED",
    "verificationToken": "test-token-1730123456",
    "cnameTarget": "test-token-1730123456.verify.bitaurl.com"
  },
  "collection_name": "domains",
  "database_name": "pebly"
}
```

## Verification in MongoDB Atlas

After running the commands:

1. **Go to MongoDB Atlas Dashboard**
2. **Navigate to your cluster**
3. **Click "Browse Collections"**
4. **Select `pebly` database**
5. **You should see `domains` collection**
6. **Click on `domains` to see your data**

You should see documents like:
```json
{
  "_id": ObjectId("..."),
  "domainName": "go.mybrand.com",
  "ownerType": "USER",
  "ownerId": "test-user-1730123456",
  "status": "RESERVED",
  "verificationToken": "test-token-1730123456",
  "cnameTarget": "test-token-1730123456.verify.bitaurl.com",
  "createdAt": ISODate("2025-10-30T..."),
  "updatedAt": ISODate("2025-10-30T...")
}
```

## What Gets Created

### Collection: `domains`
- **Database**: `pebly`
- **Collection**: `domains`
- **Validation**: Basic document structure
- **Sample Data**: `demo.example.com` and your test domain

### Indexes Created:
1. **`idx_domain_name_unique`** - Prevents duplicate domains
2. **`idx_owner_compound`** - Fast user/team queries  
3. **`idx_domain_status`** - Filter by verification status
4. **`_id_`** - Default MongoDB index

### Sample Documents:
1. **Demo Domain**: `demo.example.com` (VERIFIED)
2. **Your Test Domain**: `go.mybrand.com` (RESERVED)

## Troubleshooting

### If you get 404 errors:
```bash
# The endpoint doesn't exist yet - deploy the new code first
# Make sure InitializeDatabaseController.java is deployed
```

### If you get 500 errors:
```bash
# Check MongoDB connection
curl -X GET "https://your-backend-url.com/actuator/health"
```

### If collection creation fails:
- Verify MongoDB Atlas user has write permissions
- Check `MONGODB_URI` environment variable
- Ensure database name is `pebly`

## Success Indicators

✅ **HTTP 200 responses** from all endpoints  
✅ **`collection_exists: true`** in status response  
✅ **`ready_for_custom_domains: true`** in status  
✅ **Domains visible** in MongoDB Atlas  
✅ **Test domain created** successfully  

## Next Steps

Once the domains collection is initialized:

1. **Custom domain endpoints work**: `/api/v1/domains`
2. **Users can create domains** via your app
3. **Domain data stored** in MongoDB Atlas
4. **Ready for production** custom domain feature

The domains collection will be immediately available in your MongoDB Atlas database after running the initialization command!