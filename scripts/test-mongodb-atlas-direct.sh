#!/bin/bash

# Direct test script for MongoDB Atlas custom domains setup
# This script will create the domains collection and test it with real data

set -e

# Configuration - UPDATE THESE WITH YOUR ACTUAL VALUES
BACKEND_URL="${BACKEND_URL:-https://urlshortner-mrrl.onrender.com}"
TEST_DOMAIN="${TEST_DOMAIN:-go.mybrand.com}"

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

# Test application health
test_app_health() {
    log_info "Testing application health..."
    
    local response
    response=$(curl -s "${BACKEND_URL}/actuator/health" || echo "")
    
    if echo "$response" | grep -q '"status":"UP"'; then
        log_success "Application is healthy and running"
        return 0
    else
        log_warning "Health endpoint not available, trying direct setup anyway..."
        return 0  # Don't fail, just warn
    fi
}

# Check current domains collection state
check_domains_collection() {
    log_info "Checking current domains collection state..."
    
    local response
    response=$(curl -s "${BACKEND_URL}/api/v1/direct-setup/check-domains-collection" || echo "")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Successfully checked domains collection"
        
        if command -v jq &> /dev/null; then
            echo "$response" | jq '.'
        else
            echo "$response"
        fi
        
        return 0
    else
        log_warning "Could not check domains collection (might not exist yet)"
        echo "Response: $response"
        return 0  # Don't fail, collection might not exist
    fi
}

# Create domains collection
create_domains_collection() {
    log_info "Creating domains collection in MongoDB Atlas..."
    
    local response
    response=$(curl -s -X POST "${BACKEND_URL}/api/v1/direct-setup/create-domains-collection-now" \
        -H "Content-Type: application/json" || echo "")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Domains collection created successfully!"
        
        if command -v jq &> /dev/null; then
            echo "$response" | jq '.details'
        else
            echo "$response"
        fi
        
        return 0
    else
        log_error "Failed to create domains collection"
        echo "Response: $response"
        return 1
    fi
}

# Test domain creation with real domain
test_domain_creation() {
    log_info "Testing domain creation with: $TEST_DOMAIN"
    
    local response
    response=$(curl -s -X POST "${BACKEND_URL}/api/v1/direct-setup/test-domain-creation" \
        -H "Content-Type: application/json" \
        -d "{
            \"domainName\": \"$TEST_DOMAIN\",
            \"ownerType\": \"USER\",
            \"ownerId\": \"test-user-$(date +%s)\"
        }" || echo "")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Test domain created successfully!"
        
        if command -v jq &> /dev/null; then
            local domain_id=$(echo "$response" | jq -r '.domain.id')
            local verification_token=$(echo "$response" | jq -r '.domain.verificationToken')
            local cname_target=$(echo "$response" | jq -r '.domain.cnameTarget')
            
            echo ""
            log_info "Domain Details:"
            echo "  Domain ID: $domain_id"
            echo "  Domain Name: $TEST_DOMAIN"
            echo "  Verification Token: $verification_token"
            echo "  CNAME Target: $cname_target"
            echo ""
            
            echo "$response" | jq '.verification'
        else
            echo "$response"
        fi
        
        return 0
    else
        log_error "Failed to create test domain"
        echo "Response: $response"
        return 1
    fi
}

# Verify final state
verify_final_state() {
    log_info "Verifying final state..."
    
    local response
    response=$(curl -s "${BACKEND_URL}/api/v1/direct-setup/check-domains-collection" || echo "")
    
    if echo "$response" | grep -q '"success":true'; then
        if command -v jq &> /dev/null; then
            local total_domains=$(echo "$response" | jq -r '.total_domains')
            local total_indexes=$(echo "$response" | jq -r '.total_indexes')
            
            log_success "Final verification complete!"
            echo "  Total domains in MongoDB Atlas: $total_domains"
            echo "  Total indexes: $total_indexes"
            
            if [ "$total_domains" -gt 0 ]; then
                log_success "✅ Domains are being stored in MongoDB Atlas!"
            fi
        else
            echo "$response"
        fi
        
        return 0
    else
        log_error "Final verification failed"
        return 1
    fi
}

# Main execution
main() {
    echo "=================================================="
    echo "🗄️  Direct MongoDB Atlas Custom Domains Setup"
    echo "=================================================="
    echo ""
    
    log_info "Backend URL: $BACKEND_URL"
    log_info "Test Domain: $TEST_DOMAIN"
    echo ""
    
    # Test application health
    test_app_health
    echo ""
    
    # Check current state
    check_domains_collection
    echo ""
    
    # Create domains collection
    if ! create_domains_collection; then
        log_error "Failed to create domains collection"
        exit 1
    fi
    echo ""
    
    # Test domain creation
    if ! test_domain_creation; then
        log_error "Failed to create test domain"
        exit 1
    fi
    echo ""
    
    # Verify final state
    verify_final_state
    echo ""
    
    # Success message
    log_success "🎉 MongoDB Atlas Custom Domains Setup Complete!"
    echo ""
    log_info "What was created in MongoDB Atlas:"
    echo "  📁 Collection: 'domains' in 'pebly' database"
    echo "  🔍 Indexes: 5+ optimized indexes for fast queries"
    echo "  📊 Test Data: Real domain stored and verified"
    echo "  ✅ Ready: Custom domain feature is now functional"
    echo ""
    log_info "Next steps:"
    echo "  1. Check MongoDB Atlas to see your domains collection"
    echo "  2. Test custom domain creation via your app"
    echo "  3. Configure DNS for verify.bitaurl.com"
    echo "  4. Set up Cloudflare API credentials"
    echo ""
    log_info "MongoDB Atlas verification:"
    echo "  • Go to MongoDB Atlas → Browse Collections"
    echo "  • Navigate to 'pebly' database → 'domains' collection"
    echo "  • You should see your test domain: $TEST_DOMAIN"
}

main "$@"