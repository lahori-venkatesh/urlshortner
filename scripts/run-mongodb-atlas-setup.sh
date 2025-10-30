#!/bin/bash

# MongoDB Atlas Setup and Test Runner
# This script runs the MongoDB Atlas setup and tests it

echo "🚀 MongoDB Atlas Custom Domain Setup Runner"
echo "============================================="

# Check if MongoDB connection string is provided
if [ -z "$MONGODB_URI" ]; then
    echo "❌ Error: MONGODB_URI environment variable is not set"
    echo "Please set your MongoDB Atlas connection string:"
    echo "export MONGODB_URI='mongodb+srv://username:password@cluster.mongodb.net/pebly?retryWrites=true&w=majority'"
    exit 1
fi

# Extract database name from URI (default to 'pebly')
DATABASE_NAME="pebly"
if [[ $MONGODB_URI == *"/"* ]]; then
    DATABASE_NAME=$(echo $MONGODB_URI | sed 's/.*\/\([^?]*\).*/\1/')
fi

echo "📊 Configuration:"
echo "  Database: $DATABASE_NAME"
echo "  MongoDB URI: ${MONGODB_URI:0:30}..."
echo ""

# Check if mongosh is available
if ! command -v mongosh &> /dev/null; then
    echo "❌ Error: mongosh (MongoDB Shell) is not installed"
    echo "Please install MongoDB Shell:"
    echo "  - macOS: brew install mongosh"
    echo "  - Ubuntu: sudo apt install mongodb-mongosh"
    echo "  - Windows: Download from https://www.mongodb.com/try/download/shell"
    exit 1
fi

echo "✅ MongoDB Shell found: $(mongosh --version)"
echo ""

# Function to run MongoDB script
run_mongo_script() {
    local script_name=$1
    local description=$2
    
    echo "🔄 Running: $description"
    echo "   Script: $script_name"
    
    if [ ! -f "$script_name" ]; then
        echo "❌ Error: Script file not found: $script_name"
        return 1
    fi
    
    # Run the script with mongosh
    mongosh "$MONGODB_URI" --file "$script_name"
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo "✅ Completed: $description"
    else
        echo "❌ Failed: $description (exit code: $exit_code)"
        return $exit_code
    fi
    
    echo ""
    return 0
}

# Step 1: Run the main setup script
echo "📋 Step 1: Setting up MongoDB Atlas for Custom Domains"
echo "======================================================="

if ! run_mongo_script "scripts/mongodb-atlas-production-setup.js" "MongoDB Atlas Production Setup"; then
    echo "❌ Setup failed. Please check the error messages above."
    exit 1
fi

# Step 2: Run the test script
echo "📋 Step 2: Testing the Setup"
echo "============================="

if ! run_mongo_script "scripts/test-mongodb-atlas-setup.js" "Setup Verification Tests"; then
    echo "⚠️  Some tests failed. Please review the test results above."
    echo "The setup may still be functional, but some features might not work optimally."
else
    echo "🎉 All tests passed! Your setup is ready for production."
fi

# Step 3: Show next steps
echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. 🔧 Configure your application environment variables:"
echo "   - MONGODB_URI (already set)"
echo "   - CLOUDFLARE_API_TOKEN"
echo "   - CLOUDFLARE_ZONE_ID"
echo ""
echo "2. 🌐 Set up DNS for verification subdomain:"
echo "   - Create CNAME: verify.bitaurl.com → your-app.herokuapp.com"
echo ""
echo "3. 🚀 Deploy your Spring Boot application with custom domain endpoints"
echo ""
echo "4. 🧪 Test the API endpoints:"
echo "   - POST /api/v1/domains"
echo "   - GET /api/v1/domains"
echo "   - POST /api/v1/domains/{domain}/verify"
echo ""
echo "5. 📊 Monitor using MongoDB Atlas:"
echo "   - Browse Collections → pebly → domains"
echo "   - Use domain_analytics view for insights"
echo ""

# Show connection info for manual verification
echo "🔍 Manual Verification:"
echo "======================"
echo "You can manually verify the setup by connecting to MongoDB Atlas:"
echo "mongosh \"$MONGODB_URI\""
echo ""
echo "Then run these commands:"
echo "use('$DATABASE_NAME')"
echo "db.domains.find().pretty()"
echo "db.domain_analytics.find().pretty()"
echo ""

echo "✅ Setup and testing completed!"
echo "📅 $(date)"