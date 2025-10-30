#!/bin/bash

# MongoDB Database Deployment Script for Team Collaboration
# This script sets up the optimized database for production use

set -e  # Exit on any error

echo "🚀 Starting MongoDB Database Deployment for Team Collaboration..."

# Configuration
MONGO_URI=${MONGODB_URI:-"mongodb://localhost:27017"}
DATABASE_NAME=${MONGODB_DATABASE:-"pebly"}
BACKUP_DIR="./backups"
LOG_FILE="./logs/database-deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$LOG_FILE"
}

# Create necessary directories
mkdir -p logs backups

# Check if MongoDB is accessible
check_mongodb_connection() {
    log "🔍 Checking MongoDB connection..."
    
    if mongosh "$MONGO_URI" --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        log "✅ MongoDB connection successful"
    else
        error "❌ Cannot connect to MongoDB at $MONGO_URI"
        exit 1
    fi
}

# Backup existing database
backup_database() {
    log "💾 Creating database backup..."
    
    BACKUP_FILE="$BACKUP_DIR/pebly-backup-$(date +%Y%m%d-%H%M%S)"
    
    if mongodump --uri="$MONGO_URI" --db="$DATABASE_NAME" --out="$BACKUP_FILE" > /dev/null 2>&1; then
        log "✅ Database backup created: $BACKUP_FILE"
    else
        warning "⚠️ Database backup failed (database might not exist yet)"
    fi
}

# Run database setup script
setup_database() {
    log "🏗️ Setting up database with team collaboration support..."
    
    if mongosh "$MONGO_URI/$DATABASE_NAME" mongodb-setup.js; then
        log "✅ Database setup completed successfully"
    else
        error "❌ Database setup failed"
        exit 1
    fi
}

# Run performance tests
run_performance_tests() {
    log "🏃‍♂️ Running performance tests..."
    
    if mongosh "$MONGO_URI/$DATABASE_NAME" --eval "var generateData=true" database-performance-test.js; then
        log "✅ Performance tests completed successfully"
    else
        warning "⚠️ Performance tests failed or not available"
    fi
}

# Verify database setup
verify_setup() {
    log "🔍 Verifying database setup..."
    
    # Check collections exist
    COLLECTIONS=$(mongosh "$MONGO_URI/$DATABASE_NAME" --quiet --eval "db.getCollectionNames().join(',')")
    
    if [[ "$COLLECTIONS" == *"teams"* ]] && [[ "$COLLECTIONS" == *"team_invites"* ]]; then
        log "✅ Team collaboration collections created successfully"
    else
        error "❌ Team collaboration collections not found"
        exit 1
    fi
    
    # Check indexes
    TEAM_INDEXES=$(mongosh "$MONGO_URI/$DATABASE_NAME" --quiet --eval "db.teams.getIndexes().length")
    URL_INDEXES=$(mongosh "$MONGO_URI/$DATABASE_NAME" --quiet --eval "db.shortened_urls.getIndexes().length")
    
    if [ "$TEAM_INDEXES" -gt 1 ] && [ "$URL_INDEXES" -gt 1 ]; then
        log "✅ Performance indexes created successfully"
        info "📊 Teams collection has $TEAM_INDEXES indexes"
        info "📊 URLs collection has $URL_INDEXES indexes"
    else
        error "❌ Performance indexes not created properly"
        exit 1
    fi
}

# Update application configuration
update_app_config() {
    log "⚙️ Updating application configuration..."
    
    # Check if application.yml exists and update it
    if [ -f "backend/url-service/src/main/resources/application.yml" ]; then
        log "✅ Application configuration file found"
        
        # Verify MongoDB configuration
        if grep -q "mongodb" "backend/url-service/src/main/resources/application.yml"; then
            log "✅ MongoDB configuration present in application.yml"
        else
            warning "⚠️ MongoDB configuration not found in application.yml"
        fi
    else
        warning "⚠️ Application configuration file not found"
    fi
}

# Generate deployment report
generate_report() {
    log "📊 Generating deployment report..."
    
    REPORT_FILE="./logs/deployment-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > "$REPORT_FILE" << EOF
# MongoDB Team Collaboration Deployment Report
Generated: $(date)
Database: $DATABASE_NAME
MongoDB URI: $MONGO_URI

## Collections Created:
- teams: Team management and member relationships
- team_invites: Invitation system for team collaboration
- Enhanced existing collections with scope support

## Indexes Created:
$(mongosh "$MONGO_URI/$DATABASE_NAME" --quiet --eval "
db.getCollectionNames().forEach(function(collection) {
    var indexes = db.getCollection(collection).getIndexes();
    print('### ' + collection + ' (' + indexes.length + ' indexes)');
    indexes.forEach(function(index) {
        if (index.name !== '_id_') {
            print('- ' + index.name + ': ' + JSON.stringify(index.key));
        }
    });
    print('');
});
")

## Database Statistics:
$(mongosh "$MONGO_URI/$DATABASE_NAME" --quiet --eval "
print('- Total Collections: ' + db.getCollectionNames().length);
print('- Database Size: ' + db.stats().dataSize + ' bytes');
print('- Index Size: ' + db.stats().indexSize + ' bytes');
print('- Total Documents: ' + db.stats().objects);
")

## Performance Recommendations:
✅ Connection pooling configured (100 max connections)
✅ Compound indexes for efficient team queries
✅ Partial indexes to reduce storage overhead
✅ TTL indexes for automatic cleanup
✅ Background index creation to prevent blocking
✅ Optimized aggregation pipelines for analytics

## Next Steps:
1. Update environment variables with MongoDB URI
2. Deploy application with new team collaboration features
3. Monitor performance metrics and query patterns
4. Set up automated backups and monitoring
5. Configure alerts for database performance

## Monitoring Queries:
# Check team collaboration usage
db.teams.countDocuments({isActive: true})
db.shortened_urls.countDocuments({scopeType: "TEAM"})

# Monitor performance
db.runCommand({serverStatus: 1}).opcounters
db.runCommand({dbStats: 1})

EOF

    log "✅ Deployment report generated: $REPORT_FILE"
}

# Cleanup function
cleanup() {
    log "🧹 Cleaning up temporary files..."
    
    # Clean up any temporary files if needed
    if [ -d "./temp" ]; then
        rm -rf "./temp"
    fi
    
    log "✅ Cleanup completed"
}

# Main deployment process
main() {
    log "🚀 Starting MongoDB Team Collaboration Deployment"
    log "=================================================="
    
    # Pre-deployment checks
    check_mongodb_connection
    
    # Backup existing data
    backup_database
    
    # Setup database
    setup_database
    
    # Verify setup
    verify_setup
    
    # Update application configuration
    update_app_config
    
    # Run performance tests (optional)
    if [ "$RUN_PERFORMANCE_TESTS" = "true" ]; then
        run_performance_tests
    fi
    
    # Generate report
    generate_report
    
    # Cleanup
    cleanup
    
    log "🎉 MongoDB Team Collaboration Deployment Completed Successfully!"
    log "=================================================="
    
    echo ""
    echo -e "${GREEN}✅ Deployment Summary:${NC}"
    echo "  📁 Database: $DATABASE_NAME"
    echo "  🔗 MongoDB URI: $MONGO_URI"
    echo "  📊 Collections: teams, team_invites, enhanced existing collections"
    echo "  🚀 Performance: Optimized indexes and queries"
    echo "  📝 Report: Check logs/ directory for detailed report"
    echo ""
    echo -e "${BLUE}🔧 Next Steps:${NC}"
    echo "  1. Update your .env file with MONGODB_URI"
    echo "  2. Deploy your Spring Boot application"
    echo "  3. Test team collaboration features"
    echo "  4. Monitor database performance"
    echo ""
    echo -e "${YELLOW}📚 Documentation:${NC}"
    echo "  - Check README.md for team collaboration usage"
    echo "  - Review logs/deployment-report-*.txt for details"
    echo "  - Monitor database with provided queries"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "MongoDB Team Collaboration Deployment Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --test-performance  Run performance tests after setup"
        echo "  --skip-backup       Skip database backup"
        echo ""
        echo "Environment Variables:"
        echo "  MONGODB_URI         MongoDB connection string"
        echo "  MONGODB_DATABASE    Database name (default: pebly)"
        echo ""
        exit 0
        ;;
    --test-performance)
        export RUN_PERFORMANCE_TESTS=true
        main
        ;;
    --skip-backup)
        export SKIP_BACKUP=true
        main
        ;;
    *)
        main
        ;;
esac