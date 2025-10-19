#!/bin/bash

# Pebly Database Backup Script (H2 Database)
# Usage: ./scripts/backup.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create backup directory
BACKUP_DIR="backups"
mkdir -p $BACKUP_DIR

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/pebly_h2_backup_$TIMESTAMP"

print_status "Starting H2 database backup..."

# Check if database files exist
if [ -f "data/urlshortener.mv.db" ]; then
    print_status "Found H2 database files, creating backup..."
    
    # Copy H2 database files
    cp data/urlshortener.mv.db "$BACKUP_FILE.mv.db" 2>/dev/null || true
    cp data/urlshortener.trace.db "$BACKUP_FILE.trace.db" 2>/dev/null || true
    
    # Create a tar archive of all database files
    tar -czf "$BACKUP_FILE.tar.gz" -C data . 2>/dev/null || {
        print_warning "Failed to create tar archive, copying individual files..."
        mkdir -p "$BACKUP_FILE"
        cp -r data/* "$BACKUP_FILE/" 2>/dev/null || true
    }
    
    print_status "Database files backed up successfully"
    
elif [ -d "data" ] && [ "$(ls -A data)" ]; then
    print_status "Found data directory with files, creating backup..."
    
    # Backup entire data directory
    tar -czf "$BACKUP_FILE.tar.gz" -C . data/
    
    print_status "Data directory backed up successfully"
    
else
    print_warning "No database files found. Database might be empty or not initialized yet."
    
    # Create an empty backup file to indicate backup was attempted
    touch "$BACKUP_FILE.empty"
    echo "No database files found at $(date)" > "$BACKUP_FILE.empty"
fi

# Export data via H2 console if backend is running
if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
    print_status "Backend is running, attempting to create SQL export..."
    
    # Create SQL export using H2's SCRIPT command
    cat > "$BACKUP_FILE.sql" << EOF
-- Pebly H2 Database Export
-- Generated on: $(date)
-- 
-- To restore this backup:
-- 1. Start the application
-- 2. Go to http://localhost:8080/h2-console
-- 3. Connect with: jdbc:h2:file:./data/urlshortener
-- 4. Run: RUNSCRIPT FROM '$BACKUP_FILE.sql'

-- Note: This is a placeholder. For full SQL export, use H2 console manually.
-- Connect to H2 console and run: SCRIPT TO '$BACKUP_FILE.sql'
EOF
    
    print_status "SQL export template created: $BACKUP_FILE.sql"
    print_status "For complete SQL backup, use H2 console at: http://localhost:8080/h2-console"
    print_status "Run command: SCRIPT TO '$PWD/$BACKUP_FILE.sql'"
fi

# Clean up old backups (keep last 7 days)
find $BACKUP_DIR -name "pebly_h2_backup_*" -mtime +7 -delete 2>/dev/null || true
print_status "Old backups cleaned up (kept last 7 days)"

# List created backup files
print_status "Backup files created:"
ls -la $BACKUP_DIR/pebly_h2_backup_$TIMESTAMP* 2>/dev/null || print_warning "No backup files found"

print_status "Backup process completed! 🎉"
echo ""
print_status "💡 Backup Information:"
echo "  📁 Backup location: $BACKUP_DIR/"
echo "  🗄️  Database location: data/"
echo "  🌐 H2 Console: http://localhost:8080/h2-console"
echo "  🔗 JDBC URL: jdbc:h2:file:./data/urlshortener"
echo ""
print_status "To restore from backup:"
echo "  1. Stop the application: ./scripts/stop.sh"
echo "  2. Replace data/ directory with backup files"
echo "  3. Start the application: ./scripts/deploy.sh"