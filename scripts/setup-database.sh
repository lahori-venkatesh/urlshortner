#!/bin/bash

# Database Setup Script for Pebly URL Shortener
# This script connects to MongoDB and creates the production database

set -e

echo "🗄️ Setting up MongoDB database for Pebly URL Shortener..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# MongoDB connection details from .env file
source .env

# Extract database name from MongoDB URI
DB_NAME="pebly_production"

echo -e "${BLUE}📋 Database Configuration:${NC}"
echo "Database Name: $DB_NAME"
echo "MongoDB URI: ${MONGODB_URI}"

# Check if mongosh is available
if command -v mongosh &> /dev/null; then
    MONGO_CMD="mongosh"
elif command -v mongo &> /dev/null; then
    MONGO_CMD="mongo"
else
    echo -e "${RED}❌ MongoDB client (mongosh or mongo) not found!${NC}"
    echo "Please install MongoDB client tools:"
    echo "- macOS: brew install mongosh"
    echo "- Ubuntu: sudo apt install mongodb-mongosh"
    echo "- Windows: Download from https://www.mongodb.com/try/download/shell"
    exit 1
fi

echo -e "${GREEN}✅ Found MongoDB client: $MONGO_CMD${NC}"

# Function to run MongoDB script
run_mongo_script() {
    echo -e "${YELLOW}🔄 Executing database creation script...${NC}"
    
    if [[ $MONGODB_URI == *"mongodb+srv"* ]]; then
        # MongoDB Atlas connection
        echo "Connecting to MongoDB Atlas..."
        $MONGO_CMD "$MONGODB_URI" --file scripts/create-database.js
    else
        # Local MongoDB connection
        echo "Connecting to local MongoDB..."
        $MONGO_CMD --file scripts/create-database.js
    fi
}

# Function to test database connection
test_connection() {
    echo -e "${YELLOW}🔄 Testing database connection...${NC}"
    
    if [[ $MONGODB_URI == *"mongodb+srv"* ]]; then
        # Test Atlas connection
        $MONGO_CMD "$MONGODB_URI" --eval "db.runCommand('ping')" > /dev/null 2>&1
    else
        # Test local connection
        $MONGO_CMD --eval "db.runCommand('ping')" > /dev/null 2>&1
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
        return 0
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        return 1
    fi
}

# Function to verify database setup
verify_setup() {
    echo -e "${YELLOW}🔄 Verifying database setup...${NC}"
    
    # Create verification script
    cat > /tmp/verify_db.js << EOF
const db = db.getSiblingDB('pebly_production');

print('📊 Database Verification Report');
print('================================');

// Check collections
const collections = db.getCollectionNames();
print('Collections found: ' + collections.length);
collections.forEach(col => print('  - ' + col));

// Check indexes
print('\\nIndexes:');
collections.forEach(function(collectionName) {
    const indexes = db.getCollection(collectionName).getIndexes();
    print(collectionName + ': ' + indexes.length + ' indexes');
});

// Check sample data
print('\\nSample Data:');
print('Users: ' + db.users.countDocuments());
print('URLs: ' + db.urls.countDocuments());
print('Analytics: ' + db.analytics.countDocuments());

// Test a sample query
const sampleUrl = db.urls.findOne();
if (sampleUrl) {
    print('\\n✅ Sample URL found: ' + sampleUrl.shortCode + ' -> ' + sampleUrl.originalUrl);
} else {
    print('\\n⚠️ No sample URLs found');
}

print('\\n🎉 Database verification completed!');
EOF

    if [[ $MONGODB_URI == *"mongodb+srv"* ]]; then
        $MONGO_CMD "$MONGODB_URI" --file /tmp/verify_db.js
    else
        $MONGO_CMD --file /tmp/verify_db.js
    fi
    
    # Clean up
    rm -f /tmp/verify_db.js
}

# Main execution
main() {
    echo -e "${BLUE}🎯 Pebly Database Setup${NC}"
    echo "======================"
    
    # Test connection first
    if ! test_connection; then
        echo -e "${RED}❌ Cannot connect to MongoDB. Please check your connection settings.${NC}"
        echo "MongoDB URI: $MONGODB_URI"
        exit 1
    fi
    
    # Ask for confirmation
    echo -e "${YELLOW}⚠️ This will create/recreate the production database.${NC}"
    echo -e "${YELLOW}⚠️ Any existing data will be lost!${NC}"
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Database setup cancelled."
        exit 0
    fi
    
    # Run the database creation script
    if run_mongo_script; then
        echo -e "${GREEN}✅ Database creation completed successfully!${NC}"
        
        # Verify the setup
        verify_setup
        
        echo ""
        echo -e "${GREEN}🎉 Database setup completed successfully!${NC}"
        echo ""
        echo -e "${BLUE}📋 What was created:${NC}"
        echo "• Database: pebly_production"
        echo "• Collections: urls, analytics, users"
        echo "• Optimized indexes for high performance"
        echo "• Sample data for testing"
        echo ""
        echo -e "${BLUE}👤 Test Accounts:${NC}"
        echo "• Admin: admin@pebly.com / admin123"
        echo "• Demo: demo@pebly.com / demo123"
        echo ""
        echo -e "${BLUE}🔗 Sample URLs:${NC}"
        echo "• http://localhost:8080/demo1 -> https://www.google.com"
        echo "• http://localhost:8080/demo2 -> https://github.com"
        echo ""
        echo -e "${GREEN}🚀 Your database is ready for production use!${NC}"
        
    else
        echo -e "${RED}❌ Database creation failed!${NC}"
        exit 1
    fi
}

# Handle script arguments
case "${1:-setup}" in
    "setup")
        main
        ;;
    "verify")
        test_connection && verify_setup
        ;;
    "test")
        test_connection
        ;;
    "help")
        echo "Usage: $0 [setup|verify|test|help]"
        echo ""
        echo "Commands:"
        echo "  setup   Create database and collections (default)"
        echo "  verify  Verify existing database setup"
        echo "  test    Test database connection"
        echo "  help    Show this help message"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac