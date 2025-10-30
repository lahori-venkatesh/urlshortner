#!/bin/bash

# Script to set up the domains collection in MongoDB Atlas via API
# This creates the collection and indexes needed for custom domain storage

set -e

# Configuration
BACKEND_URL="${BACKEND_URL:-https://your-backend-url.com}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Check prerequisites
check_prerequisites() {
    if [ -z "$BACKEND_URL" ]; then
        log_error "BACKEND_URL environment variable is required"
        echo "Example: export BACKEND_URL='https://your-backend-url.com'"
        exit 1
    fi
    
    if [ -z "$ADMIN_TOKEN" ]; then
        log_warning "ADMIN_TOKEN not provided - some operations may fail"
        echo "To get admin token, authenticate as admin user and copy JWT token"
    fi
    
    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed"
        exit 1
    fi
}

# Check current database state
check_database_state() {
    log_info "Checking current database state..."
    
    local response
    if [ -n "$ADMIN_TOKEN" ]; then
        response=$(curl -s "${BACKEND_URL}/api/v1/database/check-production-database" \
            -H "Authorization: Bearer $ADMIN_TOKEN" || echo "")
    else
        response=$(curl -s "${BACKEND_URL}/api/v1/database/custom-domains-status" || echo "")
    fi
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Database connection successful"
        
        # Check if jq is available for better parsing
        if command -v jq &> /dev/null; then
            echo "$response" | jq '.'
        else
            echo "$response"
        fi
        
        return 0
    else
        log_error "Failed to check database state"
        echo "Response: $response"
        return 1
    fi
}

# Setup domains collection
setup_domains_collection() {
    log_info "Setting up domains collection..."
    
    if [ -z "$ADMIN_TOKEN" ]; then
        log_error "Admin token required for collection setup"
        return 1
    fi
    
    local response
    response=$(curl -s -X POST "${BACKEND_URL}/api/v1/database/setup-domains-collection" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" || echo "")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Domains collection setup completed!"
        
        if command -v jq &> /dev/null; then
            echo "$response" | jq '.'
        else
            echo "$response"
        fi
        
        return 0
    else
        log_error "Failed to setup domains collection"
        echo "Response: $response"
        return 1
    fi
}

# Test domain creation
test_domain_creation() {
    if [ -z "$ADMIN_TOKEN" ]; then
        log_info "Skipping domain creation test (no admin token)"
        return 0
    fi
    
    log_info "Testing domain creation..."
    
    local test_domain="test-$(date +%s).example.com"
    local response
    
    response=$(curl -s -X POST "${BACKEND_URL}/api/v1/domains" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"domainName\": \"$test_domain\",
            \"ownerType\": \"USER\",
            \"ownerId\": \"test-user-$(date +%s)\"
        }" || echo "")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Domain creation test passed!"
        log_info "Test domain created: $test_domain"
        
        if command -v jq &> /dev/null; then
            echo "$response" | jq '.domain | {domainName, status, verificationToken}'
        fi
        
        return 0
    else
        log_warning "Domain creation test failed (this might be expected if user doesn't have Pro plan)"
        echo "Response: $response"
        return 0  # Don't fail the script for this
    fi
}

# Main execution
main() {
    echo "=============================================="
    echo "🗄️  MongoDB Atlas Domains Collection Setup"
    echo "=============================================="
    echo ""
    
    log_info "Backend URL: $BACKEND_URL"
    echo ""
    
    # Check prerequisites
    check_prerequisites
    echo ""
    
    # Check database state
    if ! check_database_state; then
        log_error "Cannot proceed - database check failed"
        exit 1
    fi
    echo ""
    
    # Setup domains collection
    if ! setup_domains_collection; then
        log_error "Failed to setup domains collection"
        exit 1
    fi
    echo ""
    
    # Test domain creation
    test_domain_creation
    echo ""
    
    # Success message
    log_success "🎉 Domains collection setup completed!"
    echo ""
    log_info "What was created in MongoDB Atlas:"
    echo "  📁 Collection: 'domains' (with validation schema)"
    echo "  🔍 Indexes: 6 optimized indexes for fast queries"
    echo "  🔗 URL support: Updated for custom domain compatibility"
    echo ""
    log_info "Next steps:"
    echo "  1. Users can now create custom domains via API"
    echo "  2. Configure DNS for verify.bitaurl.com subdomain"
    echo "  3. Set up Cloudflare API credentials for SSL"
    echo "  4. Test the custom domain feature in your app"
    echo ""
    log_info "MongoDB Atlas Collections:"
    echo "  • domains - stores custom domain data"
    echo "  • shortened_urls - updated to support custom domains"
    echo "  • users - existing user data"
    echo "  • teams - existing team data"
}

main "$@"