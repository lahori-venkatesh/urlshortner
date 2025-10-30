#!/bin/bash

# Deploy Team Collaboration Indexes to MongoDB Atlas
# This script safely deploys team collaboration features to your MongoDB Atlas database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 MongoDB Atlas Team Collaboration Deployment${NC}"
echo "=============================================="

# Check if mongosh is installed
if ! command -v mongosh &> /dev/null; then
    echo -e "${RED}❌ mongosh is not installed${NC}"
    echo "Please install MongoDB Shell (mongosh) first:"
    echo "https://docs.mongodb.com/mongodb-shell/install/"
    exit 1
fi

# Check if the deployment script exists
if [ ! -f "scripts/deploy-team-collaboration-indexes.js" ]; then
    echo -e "${RED}❌ Deployment script not found${NC}"
    echo "Please ensure you're running this from the project root directory"
    exit 1
fi

# Get MongoDB Atlas connection string
if [ -z "$MONGODB_URI" ]; then
    echo -e "${YELLOW}📝 MongoDB Atlas Connection String Required${NC}"
    echo ""
    echo "Please provide your MongoDB Atlas connection string."
    echo "Format: mongodb+srv://[username]:[password]@[cluster].mongodb.net/[database]"
    echo ""
    read -p "Enter your MongoDB Atlas URI: " MONGODB_URI
    
    if [ -z "$MONGODB_URI" ]; then
        echo -e "${RED}❌ MongoDB URI is required${NC}"
        exit 1
    fi
fi

# Validate connection string format
if [[ ! "$MONGODB_URI" =~ ^mongodb(\+srv)?:// ]]; then
    echo -e "${RED}❌ Invalid MongoDB URI format${NC}"
    echo "Expected format: mongodb+srv://[username]:[password]@[cluster].mongodb.net/[database]"
    exit 1
fi

echo -e "${GREEN}✅ MongoDB URI provided${NC}"

# Test connection
echo -e "${BLUE}🔍 Testing MongoDB Atlas connection...${NC}"
if mongosh "$MONGODB_URI" --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to MongoDB Atlas${NC}"
    echo "Please check your connection string and network access"
    exit 1
fi

# Create backup directory
mkdir -p logs

# Create deployment log
LOG_FILE="logs/atlas-deployment-$(date +%Y%m%d-%H%M%S).log"
echo "📝 Deployment log: $LOG_FILE"

# Confirm deployment
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: This will modify your MongoDB Atlas database${NC}"
echo "The script will:"
echo "  ✅ Create team collaboration collections (teams, team_invites)"
echo "  ✅ Add performance indexes for team features"
echo "  ✅ Migrate existing data to support team collaboration"
echo "  ✅ Preserve all existing data"
echo ""
read -p "Do you want to proceed? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

# Run the deployment
echo -e "${BLUE}🚀 Starting deployment...${NC}"
echo "This may take a few minutes depending on your database size"
echo ""

# Execute the deployment script
if mongosh "$MONGODB_URI" --file scripts/deploy-team-collaboration-indexes.js | tee "$LOG_FILE"; then
    echo ""
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo "=============================================="
    
    # Show summary
    echo -e "${BLUE}📊 Deployment Summary:${NC}"
    echo "  ✅ Team collaboration collections created"
    echo "  ✅ Performance indexes deployed"
    echo "  ✅ Existing data migrated"
    echo "  📝 Log file: $LOG_FILE"
    
    echo ""
    echo -e "${BLUE}🔧 Next Steps:${NC}"
    echo "  1. Update your application's environment variables"
    echo "  2. Deploy your updated Spring Boot application"
    echo "  3. Test team collaboration features"
    echo "  4. Monitor database performance"
    
    echo ""
    echo -e "${BLUE}🧪 Test Team Collaboration:${NC}"
    echo "  • Create a team in your application"
    echo "  • Invite team members"
    echo "  • Create team-scoped URLs, QR codes, and files"
    echo "  • Check team analytics"
    
    echo ""
    echo -e "${GREEN}✅ Your MongoDB Atlas database is now ready for team collaboration!${NC}"
    
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "Please check the log file for details: $LOG_FILE"
    echo ""
    echo -e "${YELLOW}💡 Troubleshooting:${NC}"
    echo "  • Verify your MongoDB Atlas connection string"
    echo "  • Check network access settings in MongoDB Atlas"
    echo "  • Ensure your user has read/write permissions"
    echo "  • Check if collections already exist with different schemas"
    exit 1
fi