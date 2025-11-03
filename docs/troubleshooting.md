# BitaURL - Troubleshooting Guide

## 🎯 Overview

This guide helps you diagnose and resolve common issues when developing, deploying, or using BitaURL. Issues are organized by component and include step-by-step solutions.

## 🔧 General Troubleshooting Steps

### 1. Check System Status
```bash
# Check if all services are running
docker-compose ps

# Check service logs
docker-compose logs [service-name]

# Check system resources
top
df -h
```

### 2. Verify Environment Variables
```bash
# Backend environment
cat backend/src/main/resources/application-dev.yml

# Frontend environment
cat frontend/.env.local

# Admin panel environment
cat admin-panel/.env.local
```

### 3. Clear Cache and Restart
```bash
# Clear Redis cache
redis-cli FLUSHALL

# Restart services
docker-compose restart

# Or restart specific service
docker-compose restart backend
```

## 🖥️ Backend Issues (Spring Boot)

### Application Won't Start

#### Issue: Port Already in Use
```
Error: Port 8080 is already in use
```

**Solution:**
```bash
# Find process using port 8080
lsof -i :8080
# or
netstat -tulpn | grep 8080

# Kill the process
kill -9 <PID>

# Or use a different port
mvn spring-boot:run -Dserver.port=8081
```

#### Issue: MongoDB Connection Failed
```
Error: MongoSocketOpenException: Exception opening socket
```

**Solution:**
```bash
# Check MongoDB status
brew services list | grep mongodb
# or
systemctl status mongod

# Start MongoDB
brew services start mongodb/brew/mongodb-community
# or
sudo systemctl start mongod

# Check MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log

# Test connection
mongosh mongodb://localhost:27017/bitaurl
```

#### Issue: Redis Connection Failed
```
Error: Unable to connect to Redis at localhost:6379
```

**Solution:**
```bash
# Check Redis status
brew services list | grep redis
# or
systemctl status redis

# Start Redis
brew services start redis
# or
sudo systemctl start redis

# Test connection
redis-cli ping
# Should return: PONG
```

#### Issue: Java Version Mismatch
```
Error: Unsupported class file major version
```

**Solution:**
```bash
# Check Java version
java -version
javac -version

# Set correct JAVA_HOME (macOS)
export JAVA_HOME=$(/usr/libexec/java_home -v 17)

# Add to shell profile
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
source ~/.zshrc

# Verify Maven uses correct Java
mvn -version
```

### Database Issues

#### Issue: Collection Not Found
```
Error: Collection 'users' doesn't exist
```

**Solution:**
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/bitaurl

# Create collections manually
db.createCollection("users")
db.createCollection("urls")
db.createCollection("analytics")

# Or run database initialization
mvn spring-boot:run -Dspring-boot.run.arguments="--seed-data=true"
```

#### Issue: Index Creation Failed
```
Error: Index with name already exists with different options
```

**Solution:**
```javascript
// Connect to MongoDB
mongosh mongodb://localhost:27017/bitaurl

// Drop existing indexes
db.urls.dropIndex("shortCode_1")

// Recreate with correct options
db.urls.createIndex({shortCode: 1}, {unique: true})

// List all indexes
db.urls.getIndexes()
```

#### Issue: Authentication Failed
```
Error: Authentication failed for user 'bitaurl_user'
```

**Solution:**
```javascript
// Connect as admin
mongosh mongodb://localhost:27017/admin

// Create user with correct permissions
use bitaurl
db.createUser({
  user: "bitaurl_user",
  pwd: "bitaurl_password",
  roles: [
    { role: "readWrite", db: "bitaurl" },
    { role: "dbAdmin", db: "bitaurl" }
  ]
})

// Test authentication
mongosh mongodb://bitaurl_user:bitaurl_password@localhost:27017/bitaurl
```

### API Issues

#### Issue: 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Solution:**
```bash
# Check JWT token validity
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:8080/api/v1/user/profile

# Generate new token
curl -X POST http://localhost:8080/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"password"}'

# Check token expiration
echo "YOUR_JWT_TOKEN" | cut -d. -f2 | base64 -d | jq .exp
```

#### Issue: 403 Forbidden
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

**Solution:**
```javascript
// Check user permissions in MongoDB
mongosh mongodb://localhost:27017/bitaurl

db.users.findOne({email: "user@example.com"})

// Update user role if needed
db.users.updateOne(
  {email: "user@example.com"},
  {$set: {role: "ADMIN"}}
)
```

#### Issue: 429 Too Many Requests
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded"
  }
}
```

**Solution:**
```bash
# Check Redis for rate limit keys
redis-cli KEYS "rate_limit:*"

# Clear rate limit for specific IP
redis-cli DEL "rate_limit:192.168.1.100"

# Or clear all rate limits
redis-cli KEYS "rate_limit:*" | xargs redis-cli DEL

# Adjust rate limits in configuration
# Edit application-dev.yml:
# app.rate-limit.requests-per-minute: 1000
```

### Performance Issues

#### Issue: Slow Database Queries
```
Slow query detected: db.urls.find() took 5000ms
```

**Solution:**
```javascript
// Check query performance
mongosh mongodb://localhost:27017/bitaurl

// Enable profiling
db.setProfilingLevel(2, {slowms: 100})

// Check slow queries
db.system.profile.find().sort({ts: -1}).limit(5)

// Create missing indexes
db.urls.createIndex({userId: 1, createdAt: -1})
db.analytics.createIndex({urlId: 1, timestamp: -1})

// Check index usage
db.urls.find({userId: "user123"}).explain("executionStats")
```

#### Issue: High Memory Usage
```
OutOfMemoryError: Java heap space
```

**Solution:**
```bash
# Increase JVM heap size
export JAVA_OPTS="-Xmx2g -Xms1g"
mvn spring-boot:run

# Or in application.yml
# server:
#   tomcat:
#     max-threads: 200
#     max-connections: 8192

# Monitor memory usage
jstat -gc <PID>
jmap -histo <PID>
```

## 🎭 Frontend Issues (React)

### Build and Start Issues

#### Issue: Node.js Version Mismatch
```
Error: Node.js version 16.x is not supported
```

**Solution:**
```bash
# Check Node.js version
node --version

# Install correct version with nvm
nvm install 18
nvm use 18

# Or update Node.js directly
brew upgrade node  # macOS
```

#### Issue: Dependency Installation Failed
```
Error: npm ERR! peer dep missing
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# Or use yarn
yarn install
```

#### Issue: Build Failed
```
Error: Module not found: Can't resolve './component'
```

**Solution:**
```bash
# Check file paths and imports
# Ensure correct case sensitivity
# Example: './Component' not './component'

# Check TypeScript configuration
npx tsc --noEmit

# Clear build cache
rm -rf build/
npm run build
```

### Runtime Issues

#### Issue: API Connection Failed
```
Error: Network Error - Unable to connect to API
```

**Solution:**
```bash
# Check API URL in environment
echo $REACT_APP_API_URL

# Test API connectivity
curl http://localhost:8080/api/v1/health

# Check CORS configuration
# In backend application.yml:
# app.cors.allowed-origins: http://localhost:3000

# Check browser network tab for detailed error
```

#### Issue: Authentication Not Working
```
Error: Token expired or invalid
```

**Solution:**
```javascript
// Check localStorage for tokens
console.log(localStorage.getItem('accessToken'));
console.log(localStorage.getItem('refreshToken'));

// Clear stored tokens
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');

// Check token format
const token = localStorage.getItem('accessToken');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token expires at:', new Date(payload.exp * 1000));
}
```

#### Issue: Components Not Rendering
```
Error: Cannot read property 'map' of undefined
```

**Solution:**
```typescript
// Add proper null checks
const urls = data?.urls || [];

// Use optional chaining
const title = url?.title ?? 'Untitled';

// Add loading states
if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error.message}</div>;
if (!data) return <div>No data available</div>;
```

### Styling Issues

#### Issue: Tailwind CSS Not Working
```
Styles not applying correctly
```

**Solution:**
```bash
# Check Tailwind configuration
cat tailwind.config.js

# Ensure content paths are correct
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  // ...
}

# Rebuild CSS
npm run build:css

# Check for conflicting styles
# Remove any global CSS that might override Tailwind
```

#### Issue: Dark Mode Not Working
```
Dark mode toggle not functioning
```

**Solution:**
```typescript
// Check theme context implementation
const { theme, toggleTheme } = useTheme();

// Ensure dark class is added to document
useEffect(() => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}, [theme]);

// Check Tailwind dark mode configuration
// tailwind.config.js:
// darkMode: 'class'
```

## 🎛️ Admin Panel Issues

### Access Issues

#### Issue: Cannot Access Admin Panel
```
Error: 403 Forbidden - Admin access required
```

**Solution:**
```javascript
// Check user role in database
mongosh mongodb://localhost:27017/bitaurl

db.users.findOne({email: "admin@example.com"})

// Update user to admin role
db.users.updateOne(
  {email: "admin@example.com"},
  {$set: {role: "SUPER_ADMIN"}}
)

// Create admin user if doesn't exist
db.users.insertOne({
  email: "admin@bitaurl.com",
  name: "Admin User",
  passwordHash: "$2b$10$...", // Use proper hash
  role: "SUPER_ADMIN",
  plan: "ENTERPRISE",
  emailVerified: true,
  active: true,
  createdAt: new Date()
})
```

#### Issue: Admin Dashboard Not Loading Data
```
Error: Failed to fetch dashboard metrics
```

**Solution:**
```bash
# Check admin API endpoints
curl -H "Authorization: Bearer ADMIN_TOKEN" \
     http://localhost:8080/api/v1/admin/dashboard/metrics

# Verify admin permissions
# Check if user has admin role and required permissions

# Check backend logs for errors
docker-compose logs backend | grep ERROR
```

### Data Display Issues

#### Issue: Charts Not Rendering
```
Error: Cannot read property 'data' of undefined
```

**Solution:**
```typescript
// Add proper data validation
const chartData = useMemo(() => {
  if (!rawData || !Array.isArray(rawData)) {
    return [];
  }
  
  return rawData.map(item => ({
    date: item.date,
    value: item.value || 0
  }));
}, [rawData]);

// Add loading and error states
if (loading) return <ChartSkeleton />;
if (error) return <ChartError error={error} />;
if (!chartData.length) return <EmptyChart />;
```

## 🗄️ Database Issues

### MongoDB Issues

#### Issue: Database Connection Timeout
```
Error: MongoTimeoutError: Server selection timed out
```

**Solution:**
```bash
# Check MongoDB service status
sudo systemctl status mongod

# Check MongoDB configuration
cat /etc/mongod.conf

# Increase timeout in connection string
mongodb://localhost:27017/bitaurl?serverSelectionTimeoutMS=5000

# Check network connectivity
telnet localhost 27017
```

#### Issue: Disk Space Full
```
Error: No space left on device
```

**Solution:**
```bash
# Check disk usage
df -h

# Clean MongoDB logs
sudo rm /var/log/mongodb/mongod.log.*

# Compact database
mongosh mongodb://localhost:27017/bitaurl
db.runCommand({compact: "urls"})

# Set up log rotation
sudo logrotate -f /etc/logrotate.d/mongodb
```

#### Issue: Index Build Failed
```
Error: Index build failed due to duplicate key
```

**Solution:**
```javascript
// Find duplicate entries
mongosh mongodb://localhost:27017/bitaurl

db.urls.aggregate([
  {$group: {_id: "$shortCode", count: {$sum: 1}}},
  {$match: {count: {$gt: 1}}}
])

// Remove duplicates (keep first occurrence)
db.urls.aggregate([
  {$group: {
    _id: "$shortCode",
    firstId: {$first: "$_id"},
    count: {$sum: 1}
  }},
  {$match: {count: {$gt: 1}}}
]).forEach(function(doc) {
  db.urls.deleteMany({
    shortCode: doc._id,
    _id: {$ne: doc.firstId}
  });
});

// Create unique index
db.urls.createIndex({shortCode: 1}, {unique: true})
```

### Redis Issues

#### Issue: Redis Memory Limit Reached
```
Error: OOM command not allowed when used memory > 'maxmemory'
```

**Solution:**
```bash
# Check Redis memory usage
redis-cli INFO memory

# Increase memory limit
redis-cli CONFIG SET maxmemory 2gb

# Set eviction policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Or edit redis.conf
echo "maxmemory 2gb" >> /etc/redis/redis.conf
echo "maxmemory-policy allkeys-lru" >> /etc/redis/redis.conf

# Restart Redis
sudo systemctl restart redis
```

#### Issue: Redis Persistence Failed
```
Error: Background saving error
```

**Solution:**
```bash
# Check Redis logs
tail -f /var/log/redis/redis-server.log

# Check disk space
df -h

# Check Redis directory permissions
ls -la /var/lib/redis/

# Fix permissions
sudo chown redis:redis /var/lib/redis/
sudo chmod 755 /var/lib/redis/

# Restart Redis
sudo systemctl restart redis
```

## 🔐 Security Issues

### Authentication Issues

#### Issue: JWT Token Invalid
```
Error: JWT signature verification failed
```

**Solution:**
```bash
# Check JWT secret configuration
grep -r "jwt.secret" backend/src/main/resources/

# Ensure secret is properly set
# In application-dev.yml:
# app.jwt.secret: your_secret_key_here

# Regenerate tokens after secret change
# Users will need to log in again
```

#### Issue: CORS Errors
```
Error: Access to fetch blocked by CORS policy
```

**Solution:**
```yaml
# Update CORS configuration in application.yml
app:
  cors:
    allowed-origins: 
      - http://localhost:3000
      - http://localhost:3001
      - https://yourdomain.com
    allowed-methods: GET,POST,PUT,DELETE,OPTIONS
    allowed-headers: "*"
    allow-credentials: true
```

### SSL/TLS Issues

#### Issue: SSL Certificate Invalid
```
Error: SSL certificate verification failed
```

**Solution:**
```bash
# Check certificate validity
openssl x509 -in certificate.crt -text -noout

# Renew Let's Encrypt certificate
certbot renew

# Update certificate in configuration
# nginx.conf:
# ssl_certificate /path/to/certificate.crt;
# ssl_certificate_key /path/to/private.key;
```

## 🚀 Deployment Issues

### Docker Issues

#### Issue: Container Won't Start
```
Error: Container exited with code 1
```

**Solution:**
```bash
# Check container logs
docker logs bitaurl-backend

# Check Dockerfile syntax
docker build --no-cache -t bitaurl-backend ./backend

# Check resource limits
docker stats

# Increase memory limit
docker run -m 2g bitaurl-backend
```

#### Issue: Docker Compose Services Not Communicating
```
Error: Connection refused to service
```

**Solution:**
```yaml
# Check network configuration in docker-compose.yml
networks:
  bitaurl-network:
    driver: bridge

# Ensure services are on same network
services:
  backend:
    networks:
      - bitaurl-network
  frontend:
    networks:
      - bitaurl-network

# Use service names for internal communication
# backend connects to: mongodb:27017
# frontend connects to: backend:8080
```

### Production Issues

#### Issue: High CPU Usage
```
System load average: 15.0
```

**Solution:**
```bash
# Identify resource-intensive processes
top -p $(pgrep java)

# Check application metrics
curl http://localhost:8080/actuator/metrics

# Optimize JVM settings
export JAVA_OPTS="-XX:+UseG1GC -XX:MaxGCPauseMillis=200"

# Scale horizontally
docker-compose up --scale backend=3
```

#### Issue: Memory Leaks
```
OutOfMemoryError after running for several hours
```

**Solution:**
```bash
# Generate heap dump
jcmd <PID> GC.run_finalization
jcmd <PID> VM.gc
jmap -dump:format=b,file=heapdump.hprof <PID>

# Analyze with tools like Eclipse MAT
# Check for:
# - Unclosed database connections
# - Large object retention
# - Memory leaks in caches

# Add monitoring
# -XX:+HeapDumpOnOutOfMemoryError
# -XX:HeapDumpPath=/tmp/heapdump.hprof
```

## 🔍 Debugging Tools

### Backend Debugging
```bash
# Enable debug logging
export LOGGING_LEVEL_COM_URLSHORTENER=DEBUG

# Remote debugging
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"

# Profile application
java -XX:+FlightRecorder -XX:StartFlightRecording=duration=60s,filename=profile.jfr -jar app.jar

# Monitor JVM
jstat -gc <PID> 1s
jstack <PID>
```

### Frontend Debugging
```bash
# Enable React DevTools
npm install -g react-devtools

# Debug network requests
# Open browser DevTools > Network tab

# Debug state management
console.log('State:', state);

# Performance profiling
# DevTools > Performance tab
```

### Database Debugging
```javascript
// MongoDB query profiling
db.setProfilingLevel(2, {slowms: 100})
db.system.profile.find().sort({ts: -1}).limit(5)

// Explain query execution
db.urls.find({userId: "user123"}).explain("executionStats")

// Monitor operations
db.currentOp()
```

## 💳 Payment and Billing Issues

### Payment Failed or Stuck
- **Check your internet connection** - Ensure stable connectivity during payment
- **Verify payment details** - Double-check card information and billing address
- **Try different payment method** - Use another card or payment option
- **Clear browser cache** - Sometimes cached data can interfere with payments
- **Disable ad blockers** - They might block payment processing scripts

### Subscription Not Activated After Payment (CRITICAL ISSUE RESOLVED)
**If your payment was successful but your profile still shows FREE plan:**

1. **Immediate Steps:**
   - Log out completely and log back in
   - Clear browser cache and cookies
   - Check if payment was actually processed in your bank/card statement

2. **Backend Verification:**
   - Payment details are stored in MongoDB database
   - Subscription activation should happen automatically
   - User's `subscriptionPlan` field should be updated to `PRO_MONTHLY`, `PRO_YEARLY`, etc.

3. **Common Causes & Solutions:**
   - **Plan Type Mismatch**: Fixed mapping between payment plan types and user subscription plans
   - **Frontend Context Not Updated**: Added automatic user context refresh after payment
   - **Missing Customer Details**: Updated payment form to include actual user information
   - **Token Refresh Issues**: Enhanced token refresh mechanism

4. **Technical Resolution Applied:**
   - Fixed `PaymentService.activateSubscription()` to properly map plan types
   - Updated payment verification to return updated user data
   - Added automatic user context refresh in frontend
   - Enhanced error logging for payment debugging

5. **If Issue Persists:**
   - Contact support with your payment transaction ID
   - Provide your user email and payment timestamp
   - We can manually verify and activate your subscription

### Customer Details Missing in Payment
**Fixed Issues:**
- Payment form now includes actual user name and email
- Customer information is properly captured during payment
- Razorpay prefill data uses real user details instead of placeholders

### Refund Requests
- **Within 7 days** - Full refund available for unused subscriptions
- **Provide transaction ID** - Include payment reference in your request
- **Contact support** - Use the support widget or email us

## 📞 Getting Help

### Log Collection
```bash
# Collect all logs
mkdir -p debug-logs
docker-compose logs > debug-logs/docker-compose.log
cp backend/logs/*.log debug-logs/
cp frontend/build/static/js/*.map debug-logs/

# System information
uname -a > debug-logs/system-info.txt
docker version >> debug-logs/system-info.txt
docker-compose version >> debug-logs/system-info.txt
```

### Support Channels
- **GitHub Issues**: For bugs and feature requests
- **Discord**: Real-time community support
- **Email**: support@bitaurl.com for critical issues
- **Documentation**: Check other docs for detailed guides

### Before Asking for Help
1. Check this troubleshooting guide
2. Search existing GitHub issues
3. Collect relevant logs and error messages
4. Provide steps to reproduce the issue
5. Include system information and versions

---

If you can't find a solution here, please create a GitHub issue with detailed information about your problem, including error messages, logs, and steps to reproduce.