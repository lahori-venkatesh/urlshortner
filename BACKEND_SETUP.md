# Backend Setup Guide

## 🚀 Quick Start

### Option 1: Using Docker (Recommended)
```bash
# Start all services with Docker
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Option 2: Manual Setup
```bash
# Make scripts executable
chmod +x start-backend.sh stop-backend.sh

# Start all backend services
./start-backend.sh

# Stop all services
./stop-backend.sh
```

## 📋 Prerequisites

### For Docker Setup:
- Docker Desktop installed
- Docker Compose installed

### For Manual Setup:
- Java 17 or higher
- Node.js 16 or higher
- Maven (or use included wrapper)
- PostgreSQL (optional - can use H2 for development)
- Redis (optional - for caching)
- MongoDB (optional - for analytics)

## 🏗️ Architecture

### Services:
1. **URL Service** (Spring Boot) - Port 8080
   - Main URL shortening logic
   - User authentication
   - QR code generation
   - PostgreSQL database

2. **Analytics Service** (Node.js) - Port 3001
   - Click tracking
   - Analytics data processing
   - MongoDB database

3. **Databases:**
   - PostgreSQL (Port 5432) - Main data
   - MongoDB (Port 27017) - Analytics
   - Redis (Port 6379) - Caching

## 🔧 Configuration

### Environment Variables (.env):
```env
# Database Configuration
POSTGRES_DB=urlshortener
POSTGRES_USER=admin
POSTGRES_PASSWORD=password

# MongoDB Configuration
MONGODB_URI=mongodb://admin:password@localhost:27017/analytics?authSource=admin

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Application URLs
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:8080
ANALYTICS_URL=http://localhost:3001
```

## 🧪 Testing the Backend

### Health Checks:
```bash
# URL Service
curl http://localhost:8080/actuator/health

# Analytics Service
curl http://localhost:3001/health

# Test URL shortening
curl -X POST http://localhost:8080/api/urls \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.google.com"}'
```

### API Endpoints:

#### URL Service (http://localhost:8080):
- `POST /api/auth/google` - Google OAuth
- `POST /api/urls` - Create short URL
- `GET /api/urls` - Get user URLs
- `GET /{shortCode}` - Redirect to original URL
- `POST /api/qr` - Generate QR code

#### Analytics Service (http://localhost:3001):
- `POST /api/analytics/click` - Track click
- `GET /api/analytics/stats/{shortCode}` - Get stats
- `GET /health` - Health check

## 🐛 Troubleshooting

### Common Issues:

#### Port Already in Use:
```bash
# Check what's using the port
lsof -i :8080
lsof -i :3001

# Kill the process
kill -9 <PID>
```

#### Database Connection Issues:
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres
```

#### Java/Maven Issues:
```bash
# Check Java version
java -version

# Use Maven wrapper instead of system Maven
cd backend/url-service
./mvnw clean compile
```

### Logs Location:
- Docker: `docker-compose logs <service-name>`
- Manual: `logs/` directory

## 🔄 Development Workflow

### Making Changes:

#### URL Service (Java):
```bash
cd backend/url-service
./mvnw spring-boot:run
```

#### Analytics Service (Node.js):
```bash
cd backend/analytics-service
npm run dev
```

### Database Migrations:
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U admin -d urlshortener

# Run custom SQL
\i /path/to/your/migration.sql
```

## 📊 Monitoring

### Service Status:
```bash
# Check all services
docker-compose ps

# Check specific service
docker-compose ps url-service

# View resource usage
docker stats
```

### Database Access:
```bash
# PostgreSQL
docker-compose exec postgres psql -U admin -d urlshortener

# MongoDB
docker-compose exec mongodb mongosh -u admin -p password

# Redis
docker-compose exec redis redis-cli
```

## 🛑 Stopping Services

### Docker:
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Manual:
```bash
# Use the stop script
./stop-backend.sh

# Or manually kill processes
pkill -f "spring-boot:run"
pkill -f "analytics-service"
```