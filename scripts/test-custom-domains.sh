#!/bin/bash

# Test Script for Custom Domain Feature
# This script tests the custom domain functionality after migration

set -e

# Configuration
BACKEND_URL="${BACKEND_URL:-https://your-backend-url.com}"
USER_TOKEN="${USER_TOKEN:-}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Test database status
test_database_status() {
    log_info "Testing database status..."
    
    local response
    response=$(curl -s "${BACKEND_URL}/api/v1/database/custom-domains-status" || echo "")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Database status check passed"
        return 0
    else
        log_error "Database status check failed"
        echo "$response"
        return 1
    fi
}

# Test domain creation (requires authentication)
test_domain_creation() {
    if [ -z "$USER_TOKEN" ]; then
        log_info "Skipping domain creation test (no USER_TOKEN provided)"
        return 0
    fi
    
    log_info "Testing domain creation..."
    
    local test_domain="test-$(date +%s).example.com"
    local response
    
    response=$(curl -s -X POST "${BACKEND_URL}/api/v1/domains" \
        -H "Authorization: Bearer $USER_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"domainName\": \"$test_domain\",
            \"ownerType\": \"USER\",
            \"ownerId\": \"test-user\"
        }" || echo "")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Domain creation test passed"
        return 0
    else
        log_error "Domain creation test failed"
        echo "$response"
        return 1
    fi
}

# Test URL creation with custom domain
test_url_creation() {
    if [ -z "$USER_TOKEN" ]; then
        log_info "Skipping URL creation test (no USER_TOKEN provided)"
        return 0
    fi
    
    log_info "Testing URL creation..."
    
    local response
    response=$(curl -s -X POST "${BACKEND_URL}/api/v1/urls" \
        -H "Authorization: Bearer $USER_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "originalUrl": "https://example.com/test",
            "userId": "test-user",
            "title": "Test URL"
        }' || echo "")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "URL creation test passed"
        return 0
    else
        log_error "URL creation test failed"
        echo "$response"
        return 1
    fi
}

# Main test execution
main() {
    echo "=================================="
    echo "🧪 Testing Custom Domain Feature"
    echo "=================================="
    echo ""
    
    log_info "Backend URL: $BACKEND_URL"
    if [ -n "$USER_TOKEN" ]; then
        log_info "User token provided - will test authenticated endpoints"
    else
        log_info "No user token - will test public endpoints only"
    fi
    echo ""
    
    # Run tests
    local failed=0
    
    if ! test_database_status; then
        ((failed++))
    fi
    echo ""
    
    if ! test_domain_creation; then
        ((failed++))
    fi
    echo ""
    
    if ! test_url_creation; then
        ((failed++))
    fi
    echo ""
    
    # Summary
    if [ $failed -eq 0 ]; then
        log_success "🎉 All tests passed!"
    else
        log_error "❌ $failed test(s) failed"
        exit 1
    fi
}

main "$@"