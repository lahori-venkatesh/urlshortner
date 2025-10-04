#!/bin/bash

# Pebly Deployment Script
# Usage: ./scripts/deploy.sh [environment] [options]

set -e

ENVIRONMENT=${1:-development}
CLEAN=${2:-false}

echo "🚀 Deploying Pebly to $ENVIRONMENT environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Copying from .env.example..."
    cp .env.example .env
    print_warning "Please edit .env file with your configuration before running again."
    exit 1
fi

# Clean up if requested
if [ "$CLEAN" = "--clean" ] || [ "$CLEAN" = "true" ]; then
    print_status "Cleaning up existing containers and images..."
    docker-compose down --volumes --remove-orphans
    docker system prune -f
fi

# Build and start services based on environment
if [ "$ENVIRONMENT" = "production" ]; then
    print_status "Building production images..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
    
    print_status "Starting production services..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
    
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Health check
    print_status "Performing health checks..."
    if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
        print_status "Backend health check passed ✅"
    else
        print_error "Backend health check failed ❌"
    fi
    
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "Frontend health check passed ✅"
    else
        print_error "Frontend health check failed ❌"
    fi
    
else
    print_status "Building development images..."
    docker-compose build
    
    print_status "Starting development services..."
    docker-compose up -d
    
    print_status "Waiting for services to be ready..."
    sleep 20
fi

# Display service status
print_status "Service Status:"
docker-compose ps

# Display access URLs
echo ""
print_status "🎉 Deployment completed successfully!"
echo ""
echo "Access your application:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:8080"
echo "  Database: localhost:5432"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose logs -f [service-name]"
echo "  Stop services: docker-compose down"
echo "  Restart services: docker-compose restart"
echo ""