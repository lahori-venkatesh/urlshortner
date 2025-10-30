#!/bin/bash

# MongoDB Atlas Database Initialization Test Script
# This script tests all the database initialization endpoints

# Configuration
API_BASE_URL="http://localhost:8080"
API_PATH="/api/v1/admin/database"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to make API calls
make_api_call() {
    local endpoint=$1
    local method=$2
    local description=$3
    
    print_status $BLUE "🔄 Testing: $description"
    print_status $YELLOW "   Endpoint: $method $API_BASE_URL$API_PATH$endpoint"
    
    echo "   Response:"
    if [ "$method" = "GET" ]; then
        curl -s -w "\n   HTTP Status: %{http_code}\n" \
             -H "Content-Type: application/json" \
             "$API_BASE_URL$API_PATH$endpoint" | jq '.' 2>/dev/null || cat
    else
        curl -s -w "\n   HTTP Status: %{http_code}\n" \
             -X "$method" \
             -H "Content-Type: application/json" \
             "$API_BASE_URL$API_PATH$endpoint" | jq '.' 2>/dev/null || cat
    fi
    
    echo ""
}

# Function to check if server is running
check_server() {
    print_status $BLUE "🔍 Checking if Spring Boot server is running..."
    
    if curl -s --connect-timeout 5 "$API_BASE_URL/actuator/health" > /dev/null 2>&1; then
        print_status $GREEN "✅ Server is running at $API_BASE_URL"
        return 0
    elif curl -s --connect-timeout 5 "$API_BASE_URL" > /dev/null 2>&1; then
        print_status $GREEN "✅ Server is running at $API_BASE_URL (health endpoint not available)"
        return 0
    else
        print_status $RED "❌ Server is not running at $API_BASE_URL"
        print_status $YELLOW "   Please start your Spring Boot application first:"
        print_status $YELLOW "   cd backend/url-service && ./mvnw spring-boot:run"
        return 1
    fi
}

# Function to check if jq is available
check_jq() {
    if ! command -v jq &> /dev/null; then
        print_status $YELLOW "⚠️  jq is not installed. JSON responses will not be formatted."
        print_status $YELLOW "   Install jq for better output: brew install jq (macOS) or apt install jq (Ubuntu)"
    else
        print_status $GREEN "✅ jq is available for JSON formatting"
    fi
}

# Main execution
main() {
    print_status $GREEN "🚀 MongoDB Atlas Database Initialization Test"
    print_status $GREEN "=============================================="
    echo ""
    
    # Check prerequisites
    check_jq
    echo ""
    
    if ! check_server; then
        exit 1
    fi
    echo ""
    
    print_status $BLUE "📋 Running Database Initialization Tests"
    print_status $BLUE "========================================"
    echo ""
    
    # Test 1: Get Database Status
    make_api_call "/status" "GET" "Get Database Status"
    
    # Test 2: Initialize Database
    make_api_call "/initialize" "POST" "Initialize Database"
    
    # Test 3: Test Database Setup
    make_api_call "/test" "POST" "Test Database Setup"
    
    # Test 4: Create Sample Data
    make_api_call "/sample-data" "POST" "Create Sample Data"
    
    # Test 5: Migrate URLs
    make_api_call "/migrate-urls" "POST" "Migrate URLs for Custom Domain Support"
    
    # Test 6: Get Status Again (to see changes)
    make_api_call "/status" "GET" "Get Updated Database Status"
    
    print_status $GREEN "🎉 All tests completed!"
    print_status $BLUE "📊 Summary:"
    print_status $BLUE "   - Database initialization endpoints tested"
    print_status $BLUE "   - Custom domain feature should now be ready"
    print_status $BLUE "   - Check the responses above for any errors"
    echo ""
    
    print_status $YELLOW "📋 Next Steps:"
    print_status $YELLOW "   1. Review the test results above"
    print_status $YELLOW "   2. If initialization was successful, test the domain endpoints:"
    print_status $YELLOW "      curl -X POST $API_BASE_URL/api/v1/domains \\"
    print_status $YELLOW "           -H 'Content-Type: application/json' \\"
    print_status $YELLOW "           -d '{\"domainName\":\"test.example.com\"}'"
    print_status $YELLOW "   3. Check MongoDB Atlas to verify collections and data"
    print_status $YELLOW "   4. Configure DNS for verify.bitaurl.com"
    echo ""
    
    # Optional: Cleanup test data
    read -p "Do you want to cleanup test data? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        make_api_call "/cleanup-test-data" "DELETE" "Cleanup Test Data"
    fi
}

# Check if curl is available
if ! command -v curl &> /dev/null; then
    print_status $RED "❌ curl is not installed. Please install curl to run this script."
    exit 1
fi

# Run main function
main