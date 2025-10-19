#!/bin/bash

# Production Deployment Script for Pebly URL Shortener
# This script builds and deploys the application for production use

set -e

echo "🚀 Starting Production Deployment for Pebly URL Shortener..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_requirements() {
    echo "📋 Checking requirements..."
    
    if ! command -v java &> /dev/null; then
        echo -e "${RED}❌ Java 17+ is required but not installed${NC}"
        exit 1
    fi
    
    if ! command -v mvn &> /dev/null; then
        echo -e "${RED}❌ Maven is required but not installed${NC}"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is required but not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All requirements satisfied${NC}"
}

# Build backend
build_backend() {
    echo "🔨 Building backend service..."
    cd backend/url-service
    
    # Clean and compile
    mvn clean compile
    
    # Run tests
    echo "🧪 Running backend tests..."
    mvn test
    
    # Package application
    echo "📦 Packaging backend application..."
    mvn package -DskipTests
    
    cd ../..
    echo -e "${GREEN}✅ Backend build completed${NC}"
}

# Build frontend
build_frontend() {
    echo "🔨 Building frontend application..."
    cd frontend
    
    # Install dependencies
    echo "📦 Installing frontend dependencies..."
    npm ci --production
    
    # Build for production
    echo "🏗️ Building frontend for production..."
    npm run build
    
    cd ..
    echo -e "${GREEN}✅ Frontend build completed${NC}"
}

# Initialize database
init_database() {
    echo "🗄️ Initializing production database..."
    
    if command -v mongosh &> /dev/null; then
        mongosh --file scripts/init-database.js
        echo -e "${GREEN}✅ Database initialized${NC}"
    else
        echo -e "${YELLOW}⚠️ mongosh not found. Please run scripts/init-database.js manually${NC}"
    fi
}

# Create production directories
setup_directories() {
    echo "📁 Setting up production directories..."
    
    mkdir -p logs
    mkdir -p uploads
    mkdir -p backups
    
    # Set permissions
    chmod 755 logs uploads backups
    
    echo -e "${GREEN}✅ Directories created${NC}"
}

# Copy configuration files
setup_config() {
    echo "⚙️ Setting up production configuration..."
    
    # Copy environment file
    if [ ! -f .env.production ]; then
        cp .env .env.production
        echo -e "${YELLOW}⚠️ Please review and update .env.production for production settings${NC}"
    fi
    
    echo -e "${GREEN}✅ Configuration setup completed${NC}"
}

# Start services
start_services() {
    echo "🚀 Starting production services..."
    
    # Start backend service
    echo "Starting backend service..."
    cd backend/url-service
    nohup java -jar -Dspring.profiles.active=production target/url-service-1.0.0.jar > ../../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../../logs/backend.pid
    cd ../..
    
    # Wait for backend to start
    echo "Waiting for backend to start..."
    sleep 10
    
    # Check if backend is running
    if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend service started successfully${NC}"
    else
        echo -e "${RED}❌ Backend service failed to start${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}🎉 Production deployment completed successfully!${NC}"
    echo ""
    echo "📊 Service Status:"
    echo "Backend: http://localhost:8080"
    echo "Health Check: http://localhost:8080/actuator/health"
    echo "Metrics: http://localhost:8080/actuator/metrics"
    echo ""
    echo "📝 Logs:"
    echo "Backend: logs/backend.log"
    echo ""
    echo "🛑 To stop services:"
    echo "kill \$(cat logs/backend.pid)"
}

# Performance optimization
optimize_performance() {
    echo "⚡ Applying performance optimizations..."
    
    # Set JVM options for production
    export JAVA_OPTS="-Xms512m -Xmx2g -XX:+UseG1GC -XX:+UseStringDeduplication -XX:+OptimizeStringConcat"
    
    # Set MongoDB connection pool settings
    export MONGODB_MAX_POOL_SIZE=100
    export MONGODB_MIN_POOL_SIZE=10
    
    # Set Redis connection pool settings
    export REDIS_MAX_ACTIVE=50
    export REDIS_MAX_IDLE=20
    
    echo -e "${GREEN}✅ Performance optimizations applied${NC}"
}

# Main deployment process
main() {
    echo "🎯 Pebly URL Shortener - Production Deployment"
    echo "=============================================="
    
    check_requirements
    setup_directories
    setup_config
    optimize_performance
    build_backend
    build_frontend
    init_database
    start_services
    
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo ""
    echo "🔗 Your URL shortener is now running in production mode"
    echo "📈 Monitor performance at: http://localhost:8080/actuator"
    echo "📊 View metrics at: http://localhost:8080/actuator/prometheus"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "backend-only")
        check_requirements
        build_backend
        ;;
    "frontend-only")
        check_requirements
        build_frontend
        ;;
    "init-db")
        init_database
        ;;
    "help")
        echo "Usage: $0 [deploy|backend-only|frontend-only|init-db|help]"
        echo ""
        echo "Commands:"
        echo "  deploy        Full production deployment (default)"
        echo "  backend-only  Build and deploy backend only"
        echo "  frontend-only Build frontend only"
        echo "  init-db       Initialize database with indexes"
        echo "  help          Show this help message"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac