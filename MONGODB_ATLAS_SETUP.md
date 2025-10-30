# MongoDB Atlas Setup for Custom Domain Feature

This guide will help you set up MongoDB Atlas to support the custom domain feature in your URL shortener application.

## Prerequisites

1. MongoDB Atlas account
2. A cluster created in MongoDB Atlas
3. Database user with read/write permissions
4. Network access configured (IP whitelist)

## Step 1: Database Configuration

### 1.1 Get Your MongoDB Connection String

1. Go to your MongoDB Atlas dashboard
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string (it should look like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority
   ```

### 1.2 Set Environment Variables

Add these environment variables to your application:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/pebly?retryWrites=true&w=majority
MONGODB_DATABASE=pebly

# Custom Domain Configuration
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ZONE_ID=your_cloudflare_zone_id
SSL_PROVIDER=CLOUDFLARE

# Application Configuration
SHORT_URL_DOMAIN=https://pebly.vercel.app
FRONTEND_URL=https://pebly.vercel.app
```

## Step 2: Run Database Setup Script

### Option A: Using MongoDB Compass

1. Open MongoDB Compass
2. Connect to your Atlas cluster
3. Open the `pebly` database (create if it doesn't exist)
4. Go to the "MongoSH" tab at the bottom
5. Copy and paste the contents of `scripts/mongodb-atlas-setup.js`
6. Run the script

### Option B: Using MongoDB Atlas Web Interface

1. Go to your MongoDB Atlas dashboard
2. Click "Browse Collections" on your cluster
3. Click the ">" icon to open the MongoDB shell
4. Copy and paste the contents of `scripts/mongodb-atlas-setup.js`
5. Run the script

### Option C: Using MongoDB Shell (mongosh)

```bash
# Connect to your Atlas cluster
mongosh "mongodb+srv://cluster0.xxxxx.mongodb.net/pebly" --username <your-username>

# Run the setup script
load('scripts/mongodb-atlas-setup.js')
```

## Step 3: Verify Database Setup

After running the setup script, you should see:

```
=== Setup Verification ===
Domains collection documents: 1
Domains collection indexes: 10
URLs collection documents: X
URLs collection indexes: Y
URLs with domain field: X
```

### Manual Verification

You can also verify the setup manually:

```javascript
// Check if domains collection exists
db.domains.countDocuments()

// Check indexes
db.domains.getIndexes()

// Check sample domain
db.domains.findOne({"domainName": "demo.example.com"})

// Check URL migration
db.shortened_urls.findOne({"domain": {$exists: true}})
```

## Step 4: Application Deployment

### 4.1 Deploy Backend

1. Ensure your Spring Boot application has the environment variables set
2. Deploy to your hosting platform (Render, Heroku, etc.)
3. The application will automatically connect to MongoDB Atlas

### 4.2 Test Database Connection

Make a request to the health endpoint:
```bash
curl https://your-backend-url.com/actuator/health
```

### 4.3 Run Database Migration (Optional)

If you have existing data, run the migration endpoint:
```bash
curl -X POST https://your-backend-url.com/api/v1/database/deploy-custom-domains
```

## Step 5: DNS Configuration

### 5.1 Set up Verification Subdomain

Configure your DNS to support domain verification:

1. Add a CNAME record for the verification subdomain:
   ```
   Type: CNAME
   Name: *.verify.bitaurl.com
   Value: your-backend-domain.com
   TTL: 300
   ```

2. Or use a wildcard A record:
   ```
   Type: A
   Name: *.verify.bitaurl.com
   Value: your-server-ip
   TTL: 300
   ```

### 5.2 Cloudflare Configuration (Recommended)

If using Cloudflare for SSL provisioning:

1. Get your Cloudflare API token:
   - Go to Cloudflare dashboard
   - My Profile → API Tokens
   - Create Token → Custom token
   - Permissions: Zone:Edit, DNS:Edit
   - Zone Resources: Include → Specific zone → your-domain.com

2. Get your Zone ID:
   - Go to your domain in Cloudflare
   - Right sidebar → Zone ID

3. Set environment variables:
   ```bash
   CLOUDFLARE_API_TOKEN=your_api_token
   CLOUDFLARE_ZONE_ID=your_zone_id
   ```

## Step 6: Testing the Setup

### 6.1 Test Database Connection

```bash
# Check custom domains status
curl https://your-backend-url.com/api/v1/database/custom-domains-status
```

Expected response:
```json
{
  "success": true,
  "isDeployed": true,
  "status": {
    "domainsCollectionExists": true,
    "domainsIndexCount": 10
  },
  "statistics": {
    "totalDomains": 1,
    "verifiedDomains": 1,
    "pendingDomains": 0
  }
}
```

### 6.2 Test Domain Creation

```bash
# Create a test domain (requires authentication)
curl -X POST https://your-backend-url.com/api/v1/domains \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domainName": "test.yourdomain.com",
    "ownerType": "USER",
    "ownerId": "your-user-id"
  }'
```

### 6.3 Test URL Creation with Custom Domain

```bash
# Create a URL with custom domain
curl -X POST https://your-backend-url.com/api/v1/urls \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://example.com",
    "customDomain": "test.yourdomain.com",
    "userId": "your-user-id"
  }'
```

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check IP whitelist in MongoDB Atlas
   - Verify connection string format
   - Check network connectivity

2. **Authentication Failed**
   - Verify username/password in connection string
   - Check database user permissions
   - Ensure user has access to the `pebly` database

3. **Index Creation Failed**
   - Check if you have write permissions
   - Verify database name is correct
   - Try running indexes creation manually

4. **SSL Issues**
   - Verify Cloudflare API token permissions
   - Check Zone ID is correct
   - Ensure domain is added to Cloudflare

### Debug Commands

```javascript
// Check database connection
db.runCommand({ping: 1})

// List all collections
show collections

// Check collection stats
db.domains.stats()
db.shortened_urls.stats()

// Check index usage
db.domains.explain().find({"ownerId": "test"})
```

## Performance Optimization

### Recommended Settings

1. **Connection Pool Settings** (already configured in application.yml):
   ```yaml
   spring:
     data:
       mongodb:
         options:
           max-connection-pool-size: 100
           min-connection-pool-size: 10
   ```

2. **Index Monitoring**:
   - Monitor index usage in MongoDB Atlas
   - Use Atlas Performance Advisor for recommendations

3. **Caching**:
   - Redis is configured for caching domain lookups
   - Consider enabling Redis in production

## Monitoring and Maintenance

### Atlas Monitoring

1. Set up alerts for:
   - High connection count
   - Slow queries
   - Index usage
   - Storage usage

2. Use Atlas Charts for:
   - Domain creation trends
   - URL creation by domain
   - Performance metrics

### Application Monitoring

1. Check application logs for:
   - Domain verification failures
   - SSL provisioning issues
   - Database connection errors

2. Monitor endpoints:
   - `/actuator/health` - Application health
   - `/api/v1/database/custom-domains-status` - Feature status

## Security Considerations

1. **Network Security**:
   - Use IP whitelist in MongoDB Atlas
   - Enable VPC peering if available

2. **Authentication**:
   - Use strong passwords for database users
   - Rotate credentials regularly
   - Use connection string with SSL

3. **Data Protection**:
   - Enable encryption at rest in Atlas
   - Use field-level encryption for sensitive data
   - Regular backups (Atlas handles this automatically)

## Backup and Recovery

MongoDB Atlas provides automatic backups, but you can also:

1. **Export Domain Data**:
   ```bash
   mongoexport --uri="your-connection-string" --collection=domains --out=domains-backup.json
   ```

2. **Import Domain Data**:
   ```bash
   mongoimport --uri="your-connection-string" --collection=domains --file=domains-backup.json
   ```

This completes the MongoDB Atlas setup for the custom domain feature. Your application should now be able to store and manage custom domains efficiently.