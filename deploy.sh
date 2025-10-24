#!/bin/bash

# Pebly Production Deployment Script
# This script prepares and deploys the application to production

set -e  # Exit on any error

echo "🚀 Starting Pebly Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v java &> /dev/null; then
        print_error "Java is not installed"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    
    print_success "All dependencies are installed"
}

# Clean previous builds
clean_builds() {
    print_status "Cleaning previous builds..."
    
    # Clean frontend build
    if [ -d "frontend/build" ]; then
        rm -rf frontend/build
        print_status "Cleaned frontend build directory"
    fi
    
    # Clean backend build
    if [ -d "backend/url-service/target" ]; then
        rm -rf backend/url-service/target
        print_status "Cleaned backend build directory"
    fi
    
    print_success "Build directories cleaned"
}

# Install frontend dependencies
install_frontend_deps() {
    print_status "Installing frontend dependencies..."
    cd frontend
    npm ci --production=false
    cd ..
    print_success "Frontend dependencies installed"
}

# Build frontend for production
build_frontend() {
    print_status "Building frontend for production..."
    cd frontend
    
    # Set production environment
    export NODE_ENV=production
    
    # Build the application
    npm run build
    
    # Check if build was successful
    if [ ! -d "build" ]; then
        print_error "Frontend build failed"
        exit 1
    fi
    
    cd ..
    print_success "Frontend built successfully"
}

# Build backend for production
build_backend() {
    print_status "Building backend for production..."
    cd backend/url-service
    
    # Clean and compile
    ./mvnw clean compile
    
    # Run tests
    print_status "Running backend tests..."
    ./mvnw test
    
    # Package the application
    ./mvnw package -DskipTests
    
    # Check if JAR was created
    if [ ! -f "target/url-service-1.0.0.jar" ]; then
        print_error "Backend build failed"
        exit 1
    fi
    
    cd ../..
    print_success "Backend built successfully"
}

# Run security checks
security_checks() {
    print_status "Running security checks..."
    
    # Check for sensitive files
    if [ -f ".env" ]; then
        print_warning "Found .env file in root directory"
    fi
    
    # Check frontend for security issues
    cd frontend
    if command -v npm audit &> /dev/null; then
        npm audit --audit-level moderate
    fi
    cd ..
    
    print_success "Security checks completed"
}

# Optimize for production
optimize_production() {
    print_status "Optimizing for production..."
    
    # Compress frontend assets
    cd frontend/build
    if command -v gzip &> /dev/null; then
        find . -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) -exec gzip -k {} \;
        print_status "Frontend assets compressed"
    fi
    cd ../..
    
    print_success "Production optimization completed"
}

# Create deployment package
create_deployment_package() {
    print_status "Creating deployment package..."
    
    # Create deployment directory
    mkdir -p deployment
    
    # Copy frontend build
    cp -r frontend/build deployment/frontend
    
    # Copy backend JAR
    cp backend/url-service/target/url-service-1.0.0.jar deployment/
    
    # Copy configuration files
    cp backend/url-service/src/main/resources/application.yml deployment/
    cp frontend/.env.production deployment/frontend.env
    
    # Create deployment info
    cat > deployment/deployment-info.txt << EOF
Pebly Deployment Package
========================
Build Date: $(date)
Git Commit: $(git rev-parse HEAD)
Git Branch: $(git branch --show-current)
Node Version: $(node --version)
Java Version: $(java -version 2>&1 | head -n 1)

Frontend Build: deployment/frontend/
Backend JAR: url-service-1.0.0.jar
Configuration: application.yml

Deployment Instructions:
1. Deploy frontend to Vercel or similar static hosting
2. Deploy backend JAR to Render, Railway, or similar platform
3. Set environment variables from frontend.env and application.yml
4. Configure MongoDB and Redis connections
5. Update DNS settings if using custom domain
EOF
    
    print_success "Deployment package created in ./deployment/"
}

# Git operations
git_operations() {
    print_status "Performing git operations..."
    
    # Check if there are uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_warning "There are uncommitted changes"
        read -p "Do you want to commit them? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add .
            git commit -m "Production deployment - $(date)"
        fi
    fi
    
    # Push to main branch
    git push origin main
    
    print_success "Code pushed to repository"
}

# Main deployment function
main() {
    echo "🎯 Pebly Production Deployment"
    echo "=============================="
    
    check_dependencies
    clean_builds
    install_frontend_deps
    build_frontend
    build_backend
    security_checks
    optimize_production
    create_deployment_package
    git_operations
    
    echo ""
    echo "🎉 Deployment preparation completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Deploy frontend from ./deployment/frontend/ to Vercel"
    echo "2. Deploy backend JAR to your hosting platform"
    echo "3. Configure environment variables"
    echo "4. Test the deployment"
    echo ""
    echo "For detailed instructions, check ./deployment/deployment-info.txt"
}

# Run main function
main "$@"