# Set Up Custom Domains in MongoDB Atlas - Step by Step

Since your application isn't running locally, let's set up the domains collection directly in your MongoDB Atlas database.

## Method 1: Using MongoDB Atlas Web Interface (Recommended)

### Step 1: Access MongoDB Atlas
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Log in to your account
3. Navigate to your cluster
4. Click "Browse Collections"

### Step 2: Create the Domains Collection
1. Click "Create Database" (if pebly database doesn't exist) or select "pebly" database
2. Click "Create Collection"
3. Name it: `domains`
4. Click "Create"

### Step 3: Add Sample Domain Document
1. Click on the `domains` collection
2. Click "Insert Document"
3. Switch to "JSON View" and paste this:

```json
{
  "domainName": "demo.example.com",
  "ownerType": "USER",
  "ownerId": "sample-user-id",
  "verificationToken": "sample-token-123",
  "status": "VERIFIED",
  "sslStatus": "ACTIVE",
  "cnameTarget": "sample-token-123.verify.bitaurl.com",
  "verificationAttempts": 1,
  "lastVerificationAttempt": {
    "$date": "2025-10-30T10:30:00.000Z"
  },
  "sslProvider": "CLOUDFLARE",
  "sslIssuedAt": {
    "$date": "2025-10-30T10:30:00.000Z"
  },
  "sslExpiresAt": {
    "$date": "2026-01-28T10:30:00.000Z"
  },
  "nextReconfirmationDue": {
    "$date": "2026-10-30T10:30:00.000Z"
  },
  "totalRedirects": 0,
  "isBlacklisted": false,
  "ownershipHistory": [],
  "createdAt": {
    "$date": "2025-10-30T10:30:00.000Z"
  },
  "updatedAt": {
    "$date": "2025-10-30T10:30:00.000Z"
  }
}
```

4. Click "Insert"

### Step 4: Create Indexes
1. In the `domains` collection, click on "Indexes" tab
2. Click "Create Index"
3. Create these indexes one by one:

**Index 1: Unique Domain Name**
```json
{
  "domainName": 1
}
```
Options: Check "Unique"

**Index 2: Owner Compound**
```json
{
  "ownerId": 1,
  "ownerType": 1
}
```

**Index 3: Status**
```json
{
  "status": 1
}
```

**Index 4: Verification Token (Unique)**
```json
{
  "verificationToken": 1
}
```
Options: Check "Unique"

**Index 5: Owner Status Compound**
```json
{
  "ownerId": 1,
  "ownerType": 1,
  "status": 1
}
```

### Step 5: Update shortened_urls Collection (if it exists)
1. Go to your `shortened_urls` collection
2. Click "Indexes" tab
3. Create these indexes:

**Index: ShortCode Domain Compound**
```json
{
  "shortCode": 1,
  "domain": 1
}
```

**Index: Domain**
```json
{
  "domain": 1
}
```

## Method 2: Using MongoDB Compass (Desktop App)

### Step 1: Download and Install
1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Install and open it

### Step 2: Connect to Atlas
1. Get your connection string from MongoDB Atlas
2. In Compass, click "New Connection"
3. Paste your connection string
4. Connect

### Step 3: Create Collection and Data
1. Navigate to `pebly` database (create if doesn't exist)
2. Create `domains` collection
3. Insert the sample document from Method 1
4. Create the indexes from Method 1

## Method 3: Using MongoDB Shell (mongosh)

### Step 1: Install MongoDB Shell
```bash
# On macOS
brew install mongosh

# On Windows
# Download from https://www.mongodb.com/try/download/shell
```

### Step 2: Connect and Run Script
```bash
# Connect to your Atlas cluster
mongosh "your-mongodb-atlas-connection-string"
```

### Step 3: Run This Script in the Shell
```javascript
// Switch to pebly database
use('pebly');

// Create domains collection
db.createCollection("domains");

// Insert sample domain
db.domains.insertOne({
  "domainName": "demo.example.com",
  "ownerType": "USER",
  "ownerId": "sample-user-id",
  "verificationToken": "sample-token-123",
  "status": "VERIFIED",
  "sslStatus": "ACTIVE",
  "cnameTarget": "sample-token-123.verify.bitaurl.com",
  "verificationAttempts": 1,
  "lastVerificationAttempt": new Date(),
  "sslProvider": "CLOUDFLARE",
  "sslIssuedAt": new Date(),
  "sslExpiresAt": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  "nextReconfirmationDue": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  "totalRedirects": 0,
  "isBlacklisted": false,
  "ownershipHistory": [],
  "createdAt": new Date(),
  "updatedAt": new Date()
});

// Create indexes
db.domains.createIndex({"domainName": 1}, {unique: true});
db.domains.createIndex({"ownerId": 1, "ownerType": 1});
db.domains.createIndex({"status": 1});
db.domains.createIndex({"verificationToken": 1}, {unique: true});
db.domains.createIndex({"ownerId": 1, "ownerType": 1, "status": 1});

// Update shortened_urls if it exists
if (db.getCollectionNames().includes("shortened_urls")) {
  db.shortened_urls.createIndex({"shortCode": 1, "domain": 1});
  db.shortened_urls.createIndex({"domain": 1});
  
  // Add domain field to existing URLs (set to null for default domain)
  db.shortened_urls.updateMany(
    {"domain": {$exists: false}},
    {$set: {"domain": null, "updatedAt": new Date()}}
  );
}

print("✅ Custom domains setup completed!");
print("Collections created: domains");
print("Indexes created: 5 for domains, 2 for URLs");
print("Sample domain created: demo.example.com");
```

## Verification

After completing any of the above methods, verify the setup:

### Check Collections
```javascript
// List collections
show collections

// Check domains collection
db.domains.countDocuments()
db.domains.find().limit(1)

// Check indexes
db.domains.getIndexes()
```

### Expected Results
- `domains` collection exists
- 1 sample domain document
- 6+ indexes on domains collection
- If `shortened_urls` exists, it should have domain-related indexes

## What This Enables

Once the domains collection is set up in MongoDB Atlas:

1. **Users can create custom domains** via your API
2. **Domain verification system** will work
3. **SSL certificate provisioning** will be available
4. **Multi-tenant URL system** will function
5. **Team domain sharing** will be possible

## Next Steps After Setup

1. **Deploy your application** with the custom domain code
2. **Test the endpoints**:
   - `GET /api/v1/setup/database-status`
   - `POST /api/v1/domains` (with authentication)
3. **Configure DNS** for `verify.bitaurl.com`
4. **Set up Cloudflare API** credentials
5. **Enable the feature** in your frontend

## Troubleshooting

### If you get "Collection already exists" error:
- The collection exists, just add the sample document and indexes

### If indexes fail to create:
- They might already exist, check with `db.domains.getIndexes()`

### If you can't connect to Atlas:
- Check your IP whitelist in MongoDB Atlas
- Verify your connection string
- Ensure your database user has write permissions

The domains collection is now ready to store custom domain data in your MongoDB Atlas database!