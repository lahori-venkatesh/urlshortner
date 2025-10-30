# Team Collaboration Database Deployment Guide

This guide will help you deploy the team collaboration indexes and collections to your MongoDB Atlas database.

## 🚀 Quick Deployment

### Prerequisites
- MongoDB Shell (mongosh) installed
- Access to your MongoDB Atlas cluster
- Your MongoDB Atlas connection string

### Step 1: Install MongoDB Shell (if not already installed)
```bash
# macOS
brew install mongosh

# Windows
# Download from: https://docs.mongodb.com/mongodb-shell/install/

# Linux (Ubuntu/Debian)
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-mongosh
```

### Step 2: Get Your MongoDB Atlas Connection String
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Go to your cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/database`)

### Step 3: Deploy Team Collaboration Features
```bash
# Option 1: Set environment variable (recommended)
export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/database"
./scripts/deploy-to-atlas.sh

# Option 2: The script will prompt you for the connection string
./scripts/deploy-to-atlas.sh
```

## 📋 What Gets Deployed

### New Collections
- **`teams`** - Team management and member relationships
- **`team_invites`** - Invitation system for team collaboration

### New Indexes
- **Teams Collection:**
  - `idx_teams_member_active` - Find teams by user membership
  - `idx_teams_owner_active` - Find teams by owner
  - `idx_teams_name_unique` - Unique team names
  - `idx_teams_subscription` - Subscription management

- **Team Invites Collection:**
  - `idx_invites_email_pending` - Pending invites by email
  - `idx_invites_token_unique` - Unique invite tokens
  - `idx_invites_team_status` - Team invite status
  - `idx_invites_expiry_cleanup` - Auto-cleanup expired invites

- **Enhanced Existing Collections:**
  - `idx_urls_scope_active_created` - Team-scoped URL queries
  - `idx_qr_scope_active_created` - Team-scoped QR code queries
  - `idx_files_scope_active_uploaded` - Team-scoped file queries

### Data Migration
- Adds `scopeType` and `scopeId` fields to existing URLs, QR codes, and files
- Sets existing content to "USER" scope for backward compatibility
- Preserves all existing data

## 🔍 Verification

After deployment, verify the setup:

```javascript
// Connect to your database
mongosh "your-mongodb-atlas-connection-string"

// Check collections
db.getCollectionNames()

// Verify team collections exist
db.teams.countDocuments()
db.team_invites.countDocuments()

// Check indexes
db.teams.getIndexes()
db.team_invites.getIndexes()

// Verify data migration
db.shortened_urls.findOne({scopeType: "USER"})
```

## 🧪 Testing Team Collaboration

1. **Deploy Your Application**
   ```bash
   # Update your .env file with the MongoDB URI
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   
   # Deploy your Spring Boot application
   cd backend/url-service
   ./mvnw spring-boot:run
   ```

2. **Test Team Features**
   - Create a team in your application
   - Invite team members via email
   - Create team-scoped URLs, QR codes, and files
   - Verify team analytics and permissions

## 📊 Monitoring

### Performance Queries
```javascript
// Monitor index usage
db.teams.aggregate([{$indexStats: {}}])
db.shortened_urls.aggregate([{$indexStats: {}}])

// Check team collaboration usage
db.teams.countDocuments({isActive: true})
db.shortened_urls.countDocuments({scopeType: "TEAM"})
db.qr_codes.countDocuments({scopeType: "TEAM"})
```

### Database Statistics
```javascript
// Overall database stats
db.stats()

// Collection-specific stats
db.teams.stats()
db.team_invites.stats()
```

## 🔧 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify your MongoDB Atlas connection string
   - Check network access settings in MongoDB Atlas
   - Ensure your IP is whitelisted

2. **Permission Denied**
   - Verify your user has `readWrite` permissions
   - Check if you're connecting to the correct database

3. **Index Creation Failed**
   - Some indexes might already exist (this is normal)
   - Check for conflicting unique constraints
   - Verify collection schemas

4. **Data Migration Issues**
   - Existing data without `userId` field might cause issues
   - Check application logs for migration warnings
   - Verify data integrity after migration

### Getting Help

If you encounter issues:
1. Check the deployment log in `logs/atlas-deployment-*.log`
2. Verify your MongoDB Atlas configuration
3. Test connection with a simple ping: `mongosh "your-uri" --eval "db.adminCommand('ping')"`

## 🚀 Next Steps

After successful deployment:

1. **Update Application Configuration**
   - Ensure your Spring Boot app uses the correct MongoDB URI
   - Verify team collaboration endpoints are working

2. **Test Team Features**
   - Create test teams
   - Invite team members
   - Create team-scoped content

3. **Monitor Performance**
   - Set up MongoDB Atlas monitoring
   - Monitor query performance
   - Set up alerts for database metrics

4. **Production Considerations**
   - Set up automated backups
   - Configure monitoring and alerting
   - Plan for scaling team collaboration usage

## 📚 Additional Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Indexing Best Practices](https://docs.mongodb.com/manual/applications/indexes/)
- [Spring Boot MongoDB Configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/data.html#data.nosql.mongodb)

---

**Need Help?** Check the deployment logs or create an issue in the project repository.