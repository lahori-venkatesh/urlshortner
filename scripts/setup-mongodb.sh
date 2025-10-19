#!/bin/bash

# Pebly MongoDB Setup Script for Development
# This script sets up MongoDB for local development

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

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

echo "🍃 Setting up MongoDB for Pebly Development"
echo "==========================================="
echo ""

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    print_error "MongoDB is not installed."
    echo ""
    print_info "Installation options:"
    echo ""
    print_info "🍺 macOS (using Homebrew):"
    echo "   brew tap mongodb/brew"
    echo "   brew install mongodb-community"
    echo ""
    print_info "🐧 Ubuntu/Debian:"
    echo "   wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -"
    echo "   echo 'deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse' | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list"
    echo "   sudo apt-get update"
    echo "   sudo apt-get install -y mongodb-org"
    echo ""
    print_info "🎩 CentOS/RHEL:"
    echo "   sudo yum install -y mongodb-org"
    echo ""
    print_info "🐳 Docker (Alternative):"
    echo "   docker run --name pebly-mongo -p 27017:27017 -d mongo:latest"
    echo ""
    exit 1
fi

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    print_status "Starting MongoDB..."
    
    # Try different methods to start MongoDB
    if command -v brew &> /dev/null && brew services list | grep -q mongodb-community; then
        # macOS with Homebrew
        brew services start mongodb-community
    elif command -v systemctl &> /dev/null; then
        # Linux with systemd
        sudo systemctl start mongod
        sudo systemctl enable mongod
    else
        # Manual start
        print_warning "Please start MongoDB manually:"
        print_info "mongod --dbpath /usr/local/var/mongodb --logpath /usr/local/var/log/mongodb/mongo.log --fork"
        exit 1
    fi
    
    # Wait for MongoDB to start
    sleep 3
fi

# Check if MongoDB is accessible
if ! mongosh --eval "db.runCommand('ping').ok" --quiet > /dev/null 2>&1; then
    print_error "Cannot connect to MongoDB. Please ensure MongoDB is running on localhost:27017"
    exit 1
fi

print_status "✅ MongoDB is running and accessible"

# Create development database and setup indexes
print_status "Setting up Pebly development database..."

mongosh << 'EOF'
use pebly

// Create collections and indexes for better performance
print("Creating indexes for users collection...")
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "googleId": 1 }, { unique: true, sparse: true })
db.users.createIndex({ "createdAt": 1 })
db.users.createIndex({ "isActive": 1 })

print("Creating indexes for url_mappings collection...")
db.url_mappings.createIndex({ "shortCode": 1 }, { unique: true })
db.url_mappings.createIndex({ "createdBy": 1 })
db.url_mappings.createIndex({ "createdAt": 1 })
db.url_mappings.createIndex({ "expirationDate": 1 })
db.url_mappings.createIndex({ "isActive": 1 })

print("Creating indexes for subscriptions collection...")
db.subscriptions.createIndex({ "userId": 1 })
db.subscriptions.createIndex({ "status": 1 })
db.subscriptions.createIndex({ "endDate": 1 })

print("Creating indexes for qr_codes collection...")
db.qr_codes.createIndex({ "qrId": 1 }, { unique: true })
db.qr_codes.createIndex({ "urlMappingId": 1 })
db.qr_codes.createIndex({ "createdBy": 1 })

print("Creating indexes for file_uploads collection...")
db.file_uploads.createIndex({ "fileId": 1 }, { unique: true })
db.file_uploads.createIndex({ "urlMappingId": 1 })
db.file_uploads.createIndex({ "createdBy": 1 })
db.file_uploads.createIndex({ "expiresAt": 1 })

print("Creating indexes for analytics_events collection...")
db.analytics_events.createIndex({ "urlMappingId": 1 })
db.analytics_events.createIndex({ "createdAt": 1 })
db.analytics_events.createIndex({ "eventType": 1 })
db.analytics_events.createIndex({ "country": 1 })
db.analytics_events.createIndex({ "deviceType": 1 })
db.analytics_events.createIndex({ "sessionId": 1 })

// Create a sample admin user for development
print("Creating sample admin user...")
db.users.insertOne({
    email: "admin@pebly.dev",
    name: "Admin User",
    role: "ADMIN",
    isActive: true,
    createdAt: new Date(),
    stats: {
        totalLinks: 0,
        totalClicks: 0,
        totalQrCodes: 0,
        totalFiles: 0
    }
})

print("✅ Pebly development database setup completed!")
print("")
print("📊 Database Information:")
print("  Database: pebly")
print("  Connection: mongodb://localhost:27017/pebly")
print("  Admin User: admin@pebly.dev")
print("")
print("🔧 Useful MongoDB Commands:")
print("  Connect: mongosh")
print("  Use database: use pebly")
print("  List collections: show collections")
print("  View users: db.users.find().pretty()")
print("  View URLs: db.url_mappings.find().pretty()")
EOF

print_status "✅ MongoDB setup completed successfully!"
echo ""
print_info "🚀 Next Steps:"
echo "1. Start your Pebly application: ./scripts/deploy.sh"
echo "2. Access MongoDB shell: mongosh"
echo "3. View database: use pebly"
echo ""
print_info "📊 MongoDB Management Tools:"
echo "• MongoDB Compass (GUI): https://www.mongodb.com/products/compass"
echo "• Studio 3T (Advanced): https://studio3t.com/"
echo "• Robo 3T (Lightweight): https://robomongo.org/"
echo ""
print_info "📚 Useful Resources:"
echo "• MongoDB Documentation: https://docs.mongodb.com/"
echo "• Spring Data MongoDB: https://spring.io/projects/spring-data-mongodb"
echo ""