# MongoDB File Storage System for Pebly URL Shortener

## 🗄️ Complete MongoDB Integration

Your URL shortener now stores **ALL data in MongoDB**, including:
- ✅ **User accounts and profiles**
- ✅ **Shortened URLs and metadata**
- ✅ **Uploaded files (using GridFS)**
- ✅ **Real-time analytics data**
- ✅ **User activity logs**

## 🚀 Quick Start

### 1. Setup Database
```bash
# Create MongoDB database with indexes and sample data
./scripts/setup-database.sh

# Test MongoDB connection
mongosh "your-mongodb-uri" --file scripts/test-mongodb-connection.js
```

### 2. Start Backend
```bash
# Start the production backend
./scripts/deploy-production.sh backend-only
```

### 3. Upload Files
1. Open your frontend application
2. Click "Upload to MongoDB" button
3. Select files (up to 50MB each)
4. Configure options (password, expiry, etc.)
5. Upload - files are stored in MongoDB GridFS

## 📁 File Storage Features

### Supported File Types
- **Images**: JPG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX, TXT
- **Videos**: MP4, AVI, MOV, WMV
- **Audio**: MP3, WAV, FLAC, AAC
- **Archives**: ZIP, RAR
- **Spreadsheets**: XLS, XLSX, CSV

### Advanced Features
- 🔒 **Password Protection**: Secure file access
- ⏰ **Expiry Dates**: Auto-delete after specified time
- 🏷️ **Tags**: Organize files with custom tags
- 📊 **Analytics**: Track downloads and views
- 🌐 **Public/Private**: Control file visibility
- 📈 **Rate Limiting**: Control download frequency

## 🗄️ MongoDB Collections

### 1. `users` - User Accounts
```javascript
{
  email: "user@example.com",
  name: "John Doe",
  subscriptionPlan: "PRO",
  urlsCreated: 150,
  maxUrls: 10000,
  apiKey: "pk_abc123...",
  // ... more fields
}
```

### 2. `urls` - Shortened URLs
```javascript
{
  shortCode: "abc123",
  originalUrl: "https://example.com",
  userId: "user_id",
  isFileUrl: true,
  fileName: "document.pdf",
  fileStoragePath: "gridfs_file_id",
  clickCount: 1250,
  // ... more fields
}
```

### 3. `fs.files` & `fs.chunks` - GridFS File Storage
```javascript
// fs.files
{
  filename: "document.pdf",
  contentType: "application/pdf",
  length: 2048576,
  metadata: {
    userId: "user_id",
    description: "Important document",
    downloadCount: 25,
    isPublic: false
  }
}
```

### 4. `analytics` - Real-time Analytics
```javascript
{
  urlId: "url_reference",
  shortCode: "abc123",
  ipAddress: "192.168.1.100",
  country: "United States",
  deviceType: "desktop",
  browser: "Chrome",
  timestamp: ISODate("2024-01-15")
}
```

### 5. `user_activities` - Activity Logs
```javascript
{
  userId: "user_id",
  activityType: "FILE_UPLOADED",
  description: "Uploaded document.pdf",
  timestamp: ISODate("2024-01-15")
}
```

## 🔧 API Endpoints

### File Upload
```bash
POST /api/v1/files/upload
Content-Type: multipart/form-data
User-ID: {userId}

# Form data:
# - file: File to upload
# - title: Custom title (optional)
# - description: File description (optional)
# - password: Password protection (optional)
# - expiresAt: Expiry date (optional)
# - tags: Comma-separated tags (optional)
```

### File Download
```bash
GET /api/v1/files/{fileId}/download
User-ID: {userId}

# Returns file stream with proper headers
```

### User Files
```bash
GET /api/v1/files/my-files
User-ID: {userId}

# Returns list of user's uploaded files
```

### File Statistics
```bash
GET /api/v1/files/stats
User-ID: {userId}

# Returns file usage statistics
```

## 🔗 Short URL Access

When you upload a file, you get a short URL like:
```
http://localhost:8080/abc123
```

This URL:
1. ✅ **Redirects to file download**
2. ✅ **Tracks analytics** (views, downloads, location)
3. ✅ **Handles password protection**
4. ✅ **Respects expiry dates**
5. ✅ **Works from any device/browser**

## 📊 Real-time Analytics

Every file access is tracked:
- **Geographic Data**: Country, region, city
- **Device Info**: Browser, OS, device type
- **Referrer Data**: Where users came from
- **Time-based**: Hourly, daily, monthly stats
- **UTM Tracking**: Campaign parameters

## 🔒 Security Features

### File Protection
- **Password Protection**: BCrypt hashed passwords
- **Access Control**: User-based permissions
- **IP Restrictions**: Allow/block specific IPs
- **Rate Limiting**: Prevent abuse

### Data Security
- **Encrypted Storage**: MongoDB Atlas encryption
- **Secure Transmission**: HTTPS only
- **Access Logging**: Complete audit trail
- **GDPR Compliance**: Data export/deletion

## 📈 Performance Optimizations

### Database Indexes
```javascript
// Optimized indexes for fast queries
db.urls.createIndex({ "shortCode": 1 }, { unique: true })
db.urls.createIndex({ "userId": 1, "createdAt": -1 })
db.analytics.createIndex({ "urlId": 1, "timestamp": -1 })
db.fs.files.createIndex({ "metadata.userId": 1 })
```

### Caching Strategy
- **Redis Caching**: Frequently accessed URLs
- **GridFS Optimization**: Chunked file storage
- **Connection Pooling**: Efficient database connections
- **Async Processing**: Non-blocking analytics

## 🛠️ Configuration

### Environment Variables
```bash
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/pebly_production
MONGODB_DATABASE=pebly_production

# File Upload Settings
MAX_FILE_SIZE=50MB
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,gif,doc,docx,txt,zip,mp4,mp3

# Security Settings
JWT_SECRET=your-secret-key
BCRYPT_ROUNDS=12
```

### Production Settings
```yaml
# application.yml
spring:
  data:
    mongodb:
      uri: ${MONGODB_URI}
      auto-index-creation: true
  servlet:
    multipart:
      max-file-size: 50MB
      max-request-size: 50MB
```

## 🧪 Testing

### Test Database Connection
```bash
./scripts/test-mongodb-connection.js
```

### Test File Upload
```bash
curl -X POST http://localhost:8080/api/v1/files/upload \
  -H "User-ID: test-user" \
  -F "file=@test.pdf" \
  -F "title=Test Document" \
  -F "description=Testing file upload"
```

### Test File Download
```bash
curl -X GET http://localhost:8080/api/v1/files/{fileId}/download \
  -H "User-ID: test-user" \
  -o downloaded-file.pdf
```

## 📋 Monitoring

### Health Checks
```bash
# Database health
GET /actuator/health

# File storage metrics
GET /actuator/metrics

# MongoDB connection status
GET /actuator/info
```

### Key Metrics
- **File Upload Rate**: Files/minute
- **Storage Usage**: Total GB used
- **Download Rate**: Downloads/minute
- **Error Rate**: Failed operations %
- **Response Time**: Average latency

## 🔄 Backup & Recovery

### Automated Backups
- **MongoDB Atlas**: Automatic daily backups
- **Point-in-time Recovery**: Restore to any moment
- **Cross-region Replication**: Disaster recovery

### Manual Backup
```bash
# Backup database
./scripts/backup.sh

# Restore from backup
mongorestore --uri="mongodb+srv://..." backup/
```

## 🚀 Scaling

### Horizontal Scaling
- **MongoDB Sharding**: Distribute data across clusters
- **Read Replicas**: Scale read operations
- **CDN Integration**: Cache files globally
- **Load Balancing**: Multiple backend instances

### Vertical Scaling
- **Connection Pooling**: Optimize database connections
- **Index Optimization**: Fast query performance
- **Memory Caching**: Redis for hot data
- **Compression**: Reduce storage usage

## 🎯 Use Cases

### Personal Use
- Share documents securely
- Create temporary download links
- Track file access analytics
- Organize files with tags

### Business Use
- Client file sharing
- Marketing asset distribution
- Internal document management
- Analytics and reporting

### Enterprise Use
- Large file distribution
- Compliance and audit trails
- Multi-tenant file storage
- API integration

## 🔧 Troubleshooting

### Common Issues

**File Upload Fails**
```bash
# Check file size limit
echo "Current limit: 50MB"

# Check file type
echo "Allowed types: pdf,jpg,jpeg,png,gif,doc,docx,txt,zip,mp4,mp3"

# Check MongoDB connection
mongosh "your-uri" --eval "db.runCommand('ping')"
```

**File Download Fails**
```bash
# Check file exists in GridFS
mongosh "your-uri" --eval "db.fs.files.findOne({_id: ObjectId('file-id')})"

# Check user permissions
# Verify User-ID header in request
```

**Performance Issues**
```bash
# Check database indexes
mongosh "your-uri" --eval "db.urls.getIndexes()"

# Monitor connection pool
# Check application logs for connection timeouts
```

## 📞 Support

### Documentation
- [MongoDB GridFS Guide](https://docs.mongodb.com/manual/core/gridfs/)
- [Spring Data MongoDB](https://spring.io/projects/spring-data-mongodb)
- [File Upload Best Practices](./docs/file-upload-guide.md)

### Monitoring Tools
- MongoDB Atlas Dashboard
- Application Performance Monitoring
- Custom metrics and alerts

---

## 🎉 Success!

Your URL shortener now has **enterprise-grade file storage** with:
- ✅ **MongoDB GridFS** for reliable file storage
- ✅ **Real-time analytics** for every file access
- ✅ **Advanced security** with passwords and expiry
- ✅ **Scalable architecture** for millions of users
- ✅ **Complete audit trail** for compliance
- ✅ **High performance** with optimized indexes

**All your data is safely stored in MongoDB Atlas!** 🚀