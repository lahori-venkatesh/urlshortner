# BitaURL - Getting Started Guide

## 🎯 Quick Start Overview

This guide will help you set up the BitaURL development environment and get the application running locally. BitaURL consists of three main components: the backend API (Spring Boot), frontend web application (React), and admin panel (React).

## 📋 Prerequisites

### Required Software
- **Node.js** 18+ and npm/yarn
- **Java** 17+ (OpenJDK recommended)
- **Maven** 3.8+
- **MongoDB** 6.0+
- **Redis** 7.0+
- **Git** for version control

### Optional Tools
- **Docker** and Docker Compose (for containerized development)
- **MongoDB Compass** (database GUI)
- **Postman** (API testing)
- **VS Code** or **IntelliJ IDEA** (recommended IDEs)

## 🚀 Quick Setup (Docker Compose)

The fastest way to get BitaURL running locally is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/bitaurl/bitaurl.git
cd bitaurl

# Start all services with Docker Compose
docker-compose up -d

# Wait for services to start (about 2-3 minutes)
docker-compose logs -f

# Access the applications
# Frontend: http://localhost:3000
# Admin Panel: http://localhost:3001
# Backend API: http://localhost:8080
# MongoDB: localhost:27017
# Redis: localhost:6379
```

## 🔧 Manual Setup

### 1. Clone and Setup Repository

```bash
# Clone the repository
git clone https://github.com/bitaurl/bitaurl.git
cd bitaurl

# Create environment files
cp frontend/.env.example frontend/.env.local
cp backend/src/main/resources/application-dev.yml.example backend/src/main/resources/application-dev.yml
```

### 2. Database Setup

#### MongoDB Setup
```bash
# Install MongoDB (macOS with Homebrew)
brew tap mongodb/brew
brew install mongodb-community@6.0

# Start MongoDB
brew services start mongodb/brew/mongodb-community

# Create database and user
mongosh
> use bitaurl
> db.createUser({
    user: "bitaurl_user",
    pwd: "bitaurl_password",
    roles: ["readWrite"]
  })
```

#### Redis Setup
```bash
# Install Redis (macOS with Homebrew)
brew install redis

# Start Redis
brew services start redis

# Test Redis connection
redis-cli ping
# Should return: PONG
```

### 3. Backend Setup (Spring Boot)

```bash
cd backend

# Install dependencies and run tests
mvn clean install

# Run the application in development mode
mvn spring-boot:run -Dspring-boot.run.profiles=development

# Or run with specific configuration
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=development"
```

The backend will start on `http://localhost:8080`

#### Backend Environment Configuration
```yaml
# backend/src/main/resources/application-dev.yml
spring:
  profiles:
    active: development
  
  data:
    mongodb:
      uri: mongodb://bitaurl_user:bitaurl_password@localhost:27017/bitaurl
      database: bitaurl
  
  redis:
    host: localhost
    port: 6379
    timeout: 2000ms
  
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: your_google_client_id
            client-secret: your_google_client_secret

server:
  port: 8080

app:
  jwt:
    secret: your_jwt_secret_key_for_development
    access-token-expiration: 900000  # 15 minutes
    refresh-token-expiration: 604800000  # 7 days
  
  cors:
    allowed-origins: http://localhost:3000,http://localhost:3001
  
  file-storage:
    provider: local
    local:
      upload-dir: ./uploads
  
  rate-limit:
    requests-per-minute: 1000
    burst-capacity: 2000

logging:
  level:
    com.urlshortener: DEBUG
    org.springframework.security: DEBUG
```

### 4. Frontend Setup (React)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will start on `http://localhost:3000`

#### Frontend Environment Configuration
```bash
# frontend/.env.local
REACT_APP_API_URL=http://localhost:8080
REACT_APP_RAZORPAY_KEY=rzp_test_your_key_here
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
REACT_APP_SENTRY_DSN=your_sentry_dsn_for_error_tracking
REACT_APP_ENVIRONMENT=development
```

### 5. Admin Panel Setup (React)

```bash
cd admin-panel

# Install dependencies
npm install

# Start development server
npm start
```

The admin panel will start on `http://localhost:3001`

#### Admin Panel Environment Configuration
```bash
# admin-panel/.env.local
REACT_APP_API_URL=http://localhost:8080
REACT_APP_ENVIRONMENT=development
```

## 🔑 Initial Data Setup

### Create Admin User
```bash
# Run the database seeder script
cd backend
mvn spring-boot:run -Dspring-boot.run.arguments="--spring.profiles.active=development --seed-data=true"
```

Or manually create an admin user:
```javascript
// Connect to MongoDB
mongosh mongodb://localhost:27017/bitaurl

// Create admin user
db.users.insertOne({
  email: "admin@bitaurl.com",
  name: "Admin User",
  passwordHash: "$2b$10$rZ8Q8Q8Q8Q8Q8Q8Q8Q8Q8O", // password: admin123
  role: "SUPER_ADMIN",
  plan: "ENTERPRISE",
  emailVerified: true,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

### Test Data (Optional)
```bash
# Load sample data for development
cd scripts
./load-sample-data.sh
```

## 🧪 Verify Installation

### 1. Backend Health Check
```bash
curl http://localhost:8080/api/v1/health
```

Expected response:
```json
{
  "status": "UP",
  "timestamp": "2024-01-30T10:15:30Z",
  "components": {
    "database": {"status": "UP"},
    "cache": {"status": "UP"}
  }
}
```

### 2. Frontend Access
- Open `http://localhost:3000` in your browser
- You should see the BitaURL homepage
- Try creating an account or logging in

### 3. Admin Panel Access
- Open `http://localhost:3001` in your browser
- Login with admin credentials: `admin@bitaurl.com` / `admin123`
- You should see the admin dashboard

### 4. API Testing
```bash
# Test user registration
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'

# Test URL creation (after getting auth token)
curl -X POST http://localhost:8080/api/v1/urls \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "originalUrl": "https://example.com",
    "title": "Test URL"
  }'
```

## 🛠️ Development Workflow

### 1. Code Structure
```
bitaurl/
├── backend/                 # Spring Boot API
│   ├── src/main/java/      # Java source code
│   ├── src/main/resources/ # Configuration files
│   └── src/test/           # Test files
├── frontend/               # React web application
│   ├── src/                # React source code
│   ├── public/             # Static assets
│   └── package.json        # Dependencies
├── admin-panel/            # React admin interface
│   ├── src/                # React source code
│   └── package.json        # Dependencies
├── docs/                   # Documentation
├── scripts/                # Utility scripts
└── docker-compose.yml      # Docker setup
```

### 2. Development Commands

#### Backend Development
```bash
cd backend

# Run with hot reload
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dspring.profiles.active=development"

# Run tests
mvn test

# Run specific test class
mvn test -Dtest=UrlServiceTest

# Generate test coverage report
mvn jacoco:report

# Build for production
mvn clean package -DskipTests
```

#### Frontend Development
```bash
cd frontend

# Start development server with hot reload
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

### 3. Database Management

#### MongoDB Operations
```bash
# Connect to database
mongosh mongodb://localhost:27017/bitaurl

# View collections
show collections

# Query users
db.users.find().pretty()

# Query URLs
db.urls.find({userId: ObjectId("...")}).pretty()

# Create index
db.urls.createIndex({shortCode: 1}, {unique: true})

# Drop collection (be careful!)
db.analytics.drop()
```

#### Redis Operations
```bash
# Connect to Redis
redis-cli

# View all keys
KEYS *

# Get cached URL
GET url:abc123

# Clear all cache
FLUSHALL

# Monitor Redis commands
MONITOR
```

## 🔧 Common Issues & Solutions

### 1. Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>

# Or use different port
mvn spring-boot:run -Dserver.port=8081
```

### 2. MongoDB Connection Issues
```bash
# Check MongoDB status
brew services list | grep mongodb

# Restart MongoDB
brew services restart mongodb/brew/mongodb-community

# Check MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log
```

### 3. Redis Connection Issues
```bash
# Check Redis status
brew services list | grep redis

# Restart Redis
brew services restart redis

# Test connection
redis-cli ping
```

### 4. Node.js Version Issues
```bash
# Check Node.js version
node --version

# Use Node Version Manager (nvm)
nvm install 18
nvm use 18
```

### 5. Java Version Issues
```bash
# Check Java version
java -version

# Set JAVA_HOME (macOS)
export JAVA_HOME=$(/usr/libexec/java_home -v 17)

# Add to ~/.zshrc or ~/.bash_profile
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
```

## 🧪 Testing Setup

### Run All Tests
```bash
# Backend tests
cd backend && mvn test

# Frontend tests
cd frontend && npm test

# E2E tests (requires all services running)
cd frontend && npm run test:e2e
```

### Test Database Setup
```bash
# Create test database
mongosh
> use bitaurl_test
> db.createUser({
    user: "bitaurl_test_user",
    pwd: "bitaurl_test_password",
    roles: ["readWrite"]
  })
```

## 📚 Next Steps

### 1. Explore the Codebase
- Review the [Architecture Documentation](architecture/README.md)
- Understand the [API Documentation](api/README.md)
- Check out the [Frontend Documentation](frontend/README.md)

### 2. Development Best Practices
- Follow the [Contributing Guidelines](contributing.md)
- Review the [Security Documentation](security/README.md)
- Understand the [Testing Strategy](testing/README.md)

### 3. Deployment
- Learn about [Deployment Options](deployment/README.md)
- Set up [Monitoring & Analytics](monitoring/README.md)

## 🆘 Getting Help

### Documentation
- [Complete Documentation](README.md)
- [API Reference](api/README.md)
- [Troubleshooting Guide](troubleshooting.md)

### Community
- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas
- **Discord**: Join our developer community
- **Email**: developers@bitaurl.com

### Development Resources
- **Postman Collection**: [Download API Collection](https://api.bitaurl.com/postman/collection.json)
- **Sample Data**: Use `scripts/load-sample-data.sh`
- **Database Schema**: See [Database Documentation](database/README.md)

---

You're now ready to start developing with BitaURL! If you encounter any issues, please check the troubleshooting section or reach out to our community for help.