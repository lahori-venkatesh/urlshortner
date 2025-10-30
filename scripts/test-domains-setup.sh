#!/bin/bash

# Test script to verify domains collection setup
# This script tests the database setup for custom domains

set -e

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:8080}"

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

# Test database status
test_database_status() {
    log_info "Testing database status..."
    
    local response
    response=$(curl -s "${BACKEND_URL}/api/v1/setup/database-status" || echo "")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Database status check passed"
        
        # Check if jq is available
        if command -v jq &> /dev/null; then
            echo "$response" | jq '.collections'
            
            local domains_ready
            domains_ready=$(echo "$response" | jq -r '.custom_domains_ready')
            
            if [ "$domains_ready" = "true" ]; then
                log_success "Custom domains are ready!"
                return 0
            else
                log_warning "Custom domains not ready yet"
                return 1
            fi
        else
            echo "$response"
            return 0
        fi
    else
        log_error "Database status check failed"
        echo "Response: $response"
        return 1
    fi
}

# Create domains collection
create_domains_collection() {
    log_info "Creating domains collection..."
    
    local response
    response=$(curl -s -X POST "${BACKEND_URL}/api/v1/setup/create-domains-collection" \
        -H "Content-Type: application/json" || echo "")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Domains collection created successfully!"
        
        if command -v jq &> /dev/null; then
            echo "$response" | jq '{collection_created, domain_count, index_count, message}'
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

# Create sample domain
create_sample_domain() {
    log_info "Creating sample domain..."
    
    local response
    response=$(curl -s -X POST "${BACKEND_URL}/api/v1/setup/create-sample-domain" \
        -H "Content-Type: application/json" || echo "")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Sample domain created successfully!"
        
        if command -v jq &> /dev/null; then
            echo "$response" | jq '.sample_domain'
        else
            echo "$response"
        fi
        
        return 0
    else
        log_error "Failed to create sample domain"
        echo "Response: $response"
        return 1
    fi
}

# Test domain queries
test_domain_queries() {
    log_info "Testing domain queries..."
    
    local response
    response=$(curl -s "${BACKEND_URL}/api/v1/setup/test-domain-query" || echo "")
    
    if echo "$response" | grep -q '"success":true'; then
        log_success "Domain queries working!"
        
        if command -v jq &> /dev/null; then
            echo "$response" | jq '{total_domains, verified_domains, sample_domains}'
        else
            echo "$response"
        fi
        
        return 0
    else
        log_error "Domain queries failed"
        echo "Response: $response"
        return 1
    fi
}

# Test application health
test_app_health() {
    log_info "Testing application health..."
    
    local response
    response=$(curl -s "${BACKEND_URL}/actuator/health" || echo "")
    
    if echo "$response" | grep -q '"status":"UP"'; then
        log_success "Application is healthy"
        return 0
    else
        log_warning "Application health check failed or not available"
        return 1
    fi
}

# Main execution
main() {
    echo "============================================"
    echo "🧪 Testing Custom Domains Database Setup"
    echo "============================================"
    echo ""
    
    log_info "Backend URL: $BACKEND_URL"
    echo ""
    
    # Test application health first
    if ! test_app_health; then
        log_error "Application is not running or not healthy"
        log_info "Please start your Spring Boot application first"
        exit 1
    fi
    echo ""
    
    # Test database status
    local domains_ready=false
    if test_database_status; then
        domains_ready=true
    fi
    echo ""
    
    # Create domains collection if not ready
    if [ "$domains_ready" = false ]; then
        if ! create_domains_collection; then
            log_error "Failed to create domains collection"
            exit 1
        fi
        echo ""
    fi
    
    # Create sample domain
    if ! create_sample_domain; then
        log_warning "Failed to create sample domain (might already exist)"
    fi
    echo ""
    
    # Test domain queries
    if ! test_domain_queries; then
        log_error "Domain queries failed"
        exit 1
    fi
    echo ""
    
    # Final verification
    log_success "🎉 Custom domains database setup is working!"
    echo ""
    log_info "What's now available in MongoDB Atlas:"
    echo "  📁 Collection: 'domains' with validation schema"
    echo "  🔍 Indexes: Optimized for fast domain queries"
    echo "  📊 Sample data: Test domain for verification"
    echo ""
    log_info "Next steps:"
    echo "  1. Test custom domain creation via API"
    echo "  2. Configure DNS for verify.bitaurl.com"
    echo "  3. Set up Cloudflare API credentials"
    echo "  4. Enable custom domains in your frontend"
    echo ""
    log_info "Test endpoints:"
    echo "  GET  ${BACKEND_URL}/api/v1/setup/database-status"
    echo "  POST ${BACKEND_URL}/api/v1/domains (requires auth)"
    echo "  GET  ${BACKEND_URL}/api/v1/domains/my (requires auth)"
}

main "$@"