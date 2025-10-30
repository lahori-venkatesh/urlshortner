#!/bin/bash

# Production Migration Script for Custom Domain Feature
# This script safely migrates your production MongoDB Atlas database

set -e  # Exit on any error

# Configuration
BACKEND_URL="${BACKEND_URL:-https://your-backend-url.com}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if [ -z "$BACKEND_URL" ]; then
        log_error "BACKEND_URL environment variable is required"
        exit 1
    fi
    
    if [ -z "$ADMIN_TOKEN" ]; then
        log_error "ADMIN_TOKEN environment variable is required"
        exit 1
    fi
    
    # Check if curl is available
    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed"
        exit 1
    fi
    
    # Check if jq is available (optional but helpful)
    if ! command -v jq &> /dev/null; then
        log_warning "jq is not installed - output will be less formatted"
        JQ_AVAILABLE=false
    else
        JQ_AVAILABLE=true
    fi
    
    log_success "Prerequisites check passed"
}

# Make API request with error handling
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    local url="${BACKEND_URL}${endpoint}"
    local response
    local http_code
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$url")
    else
        response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            "$url")
    fi
    
    http_code=$(echo "$response" | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo "$response" | sed -e 's/HTTPSTATUS:.*//g')
    
    if [ "$http_code" -ne 200 ]; then
        log_error "API request failed with status $http_code"
        if [ "$JQ_AVAILABLE" = true ]; then
            echo "$body" | jq .
        else
            echo "$body"
        fi
        return 1
    fi
    
    echo "$body"
}

# Check database state
check_database_state() {
    log_info "Checking current database state..."
    
    local response
    response=$(make_request "GET" "/api/v1/database/check-production-database")
    
    if [ $? -eq 0 ]; then
        log_success "Database state retrieved successfully"
        
        if [ "$JQ_AVAILABLE" = true ]; then
            echo "$response" | jq '.database_state'
            
            # Extract key metrics
            local urls_need_migration
            urls_need_migration=$(echo "$response" | jq -r '.database_state.migration_status.urls_need_migration // 0')
            
            if [ "$urls_need_migration" -gt 0 ]; then
                log_warning "$urls_need_migration URLs need migration"
            else
                log_info "All URLs already migrated"
            fi
        else
            echo "$response"
        fi
        
        return 0
    else
        log_error "Failed to check database state"
        return 1
    fi
}

# Run full migration
run_migration() {
    log_info "Starting full production migration..."
    
    local response
    response=$(make_request "POST" "/api/v1/database/full-production-migration")
    
    if [ $? -eq 0 ]; then
        log_success "Migration completed successfully!"
        
        if [ "$JQ_AVAILABLE" = true ]; then
            echo "$response" | jq '.steps'
        else
            echo "$response"
        fi
        
        return 0
    else
        log_error "Migration failed"
        return 1
    fi
}

# Validate migration
validate_migration() {
    log_info "Validating migration..."
    
    local response
    response=$(make_request "GET" "/api/v1/database/validate-production-migration")
    
    if [ $? -eq 0 ]; then
        if [ "$JQ_AVAILABLE" = true ]; then
            local migration_successful
            migration_successful=$(echo "$response" | jq -r '.validation.migration_successful')
            
            if [ "$migration_successful" = "true" ]; then
                log_success "Migration validation passed!"
                echo "$response" | jq '.validation'
            else
                log_error "Migration validation failed!"
                echo "$response" | jq '.validation'
                return 1
            fi
        else
            echo "$response"
            log_success "Migration validation completed"
        fi
        
        return 0
    else
        log_error "Failed to validate migration"
        return 1
    fi
}

# Test basic functionality
test_functionality() {
    log_info "Testing basic functionality..."
    
    # Test health endpoint
    local health_response
    health_response=$(curl -s "${BACKEND_URL}/actuator/health" || echo "")
    
    if echo "$health_response" | grep -q '"status":"UP"'; then
        log_success "Application health check passed"
    else
        log_warning "Application health check failed or returned unexpected response"
    fi
    
    # Test custom domains status
    local domains_response
    domains_response=$(make_request "GET" "/api/v1/database/custom-domains-status")
    
    if [ $? -eq 0 ]; then
        if [ "$JQ_AVAILABLE" = true ]; then
            local is_deployed
            is_deployed=$(echo "$domains_response" | jq -r '.isDeployed')
            
            if [ "$is_deployed" = "true" ]; then
                log_success "Custom domains feature is deployed and ready"
            else
                log_warning "Custom domains feature may not be fully deployed"
            fi
        else
            log_success "Custom domains status retrieved"
        fi
    else
        log_warning "Could not retrieve custom domains status"
    fi
}

# Main execution
main() {
    echo "=================================================="
    echo "🚀 Production Migration for Custom Domain Feature"
    echo "=================================================="
    echo ""
    
    # Check prerequisites
    check_prerequisites
    echo ""
    
    # Confirm with user
    log_warning "This will modify your production database!"
    log_info "Backend URL: $BACKEND_URL"
    echo ""
    read -p "Are you sure you want to proceed? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        log_info "Migration cancelled by user"
        exit 0
    fi
    echo ""
    
    # Step 1: Check current state
    if ! check_database_state; then
        log_error "Failed to check database state. Aborting migration."
        exit 1
    fi
    echo ""
    
    # Step 2: Run migration
    if ! run_migration; then
        log_error "Migration failed. Please check the logs and consider rollback."
        exit 1
    fi
    echo ""
    
    # Step 3: Validate migration
    if ! validate_migration; then
        log_error "Migration validation failed. Please investigate."
        exit 1
    fi
    echo ""
    
    # Step 4: Test functionality
    test_functionality
    echo ""
    
    # Success message
    echo "=================================================="
    log_success "🎉 Migration completed successfully!"
    echo "=================================================="
    echo ""
    log_info "Next steps:"
    echo "1. Monitor your application logs for any issues"
    echo "2. Test custom domain functionality with a test domain"
    echo "3. Configure DNS for verify.bitaurl.com subdomain"
    echo "4. Set up Cloudflare API credentials for SSL provisioning"
    echo "5. Announce the new feature to your users"
    echo ""
    log_info "Custom domain endpoints are now available:"
    echo "- POST /api/v1/domains (create domain)"
    echo "- GET  /api/v1/domains/my (list domains)"
    echo "- POST /api/v1/domains/verify (verify domain)"
    echo ""
}

# Handle script interruption
trap 'log_error "Script interrupted"; exit 1' INT TERM

# Run main function
main "$@"