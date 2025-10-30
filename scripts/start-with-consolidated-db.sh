#!/bin/bash

# Startup script for Pebly URL Shortener with consolidated database
# This ensures all data goes to pebly-database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting Pebly URL Shortener with Consolidated Database ===${NC}"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create .env file with your MongoDB configuration."
    echo "Example:"
    echo "MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority"
    echo "MONGODB_DATABASE=pebly-database"
    exit 1
fi

# Source environment variables
source .env

# Verify required environment variables
if [ -z "$MONGODB_URI" ]; then
    echo -e "${RED}❌ MONGODB_URI not set in .env file${NC}"
    exit 1
fi

if [ -z "$MONGODB_DATABASE" ]; then
    echo -e "${YELLOW}⚠️  MONGODB_DATABASE not set, using default: pebly-database${NC}"
    export MONGODB_DATABASE="pebly-database"
fi

# Ensure we're using the consolidated database
if [ "$MONGODB_DATABASE" != "pebly-database" ]; then
    echo -e "${YELLOW}⚠️  Database name is '$MONGODB_DATABASE', should be 'pebly-database'${NC}"
    echo -e "${YELLOW}   Updating to use consolidated database...${NC}"
    export MONGODB_DATABASE="pebly-database"
fi

echo -e "${GREEN}✅ Database Configuration:${NC}"
echo -e "   Database Name: ${MONGODB_DATABASE}"
echo -e "   MongoDB URI: ${MONGODB_URI:0:50}..."

# Navigate to backend directory
cd backend/url-service

echo -e "${BLUE}Building application...${NC}"

# Build the application
if command -v ./mvnw &> /dev/null; then
    ./mvnw clean package -DskipTests
elif command -v mvn &> /dev/null; then
    mvn clean package -DskipTests
else
    echo -e "${RED}❌ Maven not found! Please install Maven or use the Maven wrapper.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build completed${NC}"

# Start the application
echo -e "${BLUE}Starting Pebly URL Shortener...${NC}"
echo -e "${YELLOW}Database: ${MONGODB_DATABASE}${NC}"
echo -e "${YELLOW}Port: ${SERVER_PORT:-8080}${NC}"
echo ""

# Export all environment variables and start
export MONGODB_DATABASE="pebly-database"

if [ -f "target/url-shortener-simple-1.0.0.jar" ]; then
    java -jar target/url-shortener-simple-1.0.0.jar
elif [ -f "target/url-shortener-1.0.0.jar" ]; then
    java -jar target/url-shortener-1.0.0.jar
else
    echo -e "${RED}❌ JAR file not found in target directory${NC}"
    echo "Available files:"
    ls -la target/*.jar 2>/dev/null || echo "No JAR files found"
    exit 1
fi