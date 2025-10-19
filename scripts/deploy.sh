#!/bin/bash

# Pebly Deployment Script (Docker-Free)
# Usage: ./scripts/deploy.sh [environment] [options]

set -e

ENVIRONMENT=${1:-development}
CLEAN=${2:-false}

echo "🚀 Starting Pebly application in $ENVIRONMENT mode..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    print_error "Java is not installed. Please install Java 17+ first."
    exit 1
fi

# Check if Maven wrapper exists
if [ ! -f "backend/url-service/mvnw" ]; then
    print_error "Maven wrapper not found. Please ensure the backend directory is properly set up."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Copying from .env.example..."
    cp .env.example .env
    print_warning "Please edit .env file with your configuration if needed."
fi

# Create data directory for H2 database
print_status "Setting up database directory..."
mkdir -p data
mkdir -p logs

# Clean up if requested
if [ "$CLEAN" = "--clean" ] || [ "$CLEAN" = "true" ]; then
    print_status "Cleaning up build artifacts..."
    rm -rf backend/url-service/target/
    rm -rf frontend/build/
    rm -rf frontend/node_modules/.cache/
    rm -rf data/urlshortener.*
fi

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ] || [ "$CLEAN" = "--clean" ] || [ "$CLEAN" = "true" ]; then
    npm install
fi
cd ..

# Build backend
print_status "Building backend application..."
cd backend/url-service
./mvnw clean compile -q
cd ../..

# Function to start backend
start_backend() {
    print_status "Starting backend server..."
    cd backend/url-service
    nohup ./mvnw spring-boot:run > ../../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../../logs/backend.pid
    cd ../..
    print_info "Backend started with PID: $BACKEND_PID"
}

# Function to start frontend
start_frontend() {
    print_status "Starting frontend development server..."
    cd frontend
    if [ "$ENVIRONMENT" = "production" ]; then
        npm run build
        print_info "Frontend built for production. Serve the 'build' directory with a web server."
    else
        nohup npm start > ../logs/frontend.log 2>&1 &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > ../logs/frontend.pid
        cd ..
        print_info "Frontend started with PID: $FRONTEND_PID"
    fi
}

# Start services
start_backend
sleep 5  # Give backend time to start

if [ "$ENVIRONMENT" != "production" ]; then
    start_frontend
    sleep 5  # Give frontend time to start
fi

# Health checks
print_status "Performing health checks..."
sleep 10

# Check backend health
if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
    print_status "✅ Backend health check passed"
else
    print_warning "⚠️  Backend health check failed - it might still be starting up"
fi

# Check frontend (only in development)
if [ "$ENVIRONMENT" != "production" ]; then
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "✅ Frontend health check passed"
    else
        print_warning "⚠️  Frontend health check failed - it might still be starting up"
    fi
fi

# Display access information
echo ""
print_status "🎉 Pebly application started successfully!"
echo ""
print_info "Access your application:"
print_info "  🌐 Frontend: http://localhost:3000"
print_info "  🔧 Backend API: http://localhost:8080"
print_info "  🗄️  H2 Database Console: http://localhost:8080/h2-console"
print_info "     - JDBC URL: jdbc:h2:file:./data/urlshortener"
print_info "     - Username: sa"
print_info "     - Password: password"
echo ""
print_info "📁 Log files:"
print_info "  Backend: logs/backend.log"
if [ "$ENVIRONMENT" != "production" ]; then
    print_info "  Frontend: logs/frontend.log"
fi
echo ""
print_info "🛑 To stop the application:"
print_info "  ./scripts/stop.sh"
echo ""

# Save process info
echo "BACKEND_PID=$(cat logs/backend.pid 2>/dev/null || echo '')" > logs/app.env
if [ "$ENVIRONMENT" != "production" ]; then
    echo "FRONTEND_PID=$(cat logs/frontend.pid 2>/dev/null || echo '')" >> logs/app.env
fi
echo "ENVIRONMENT=$ENVIRONMENT" >> logs/app.env