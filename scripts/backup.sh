#!/bin/bash

# Pebly Database Backup Script
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

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Set default values
POSTGRES_DB=${POSTGRES_DB:-urlshortener}
POSTGRES_USER=${POSTGRES_USER:-admin}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-password}

# Create backup directory
BACKUP_DIR="backups"
mkdir -p $BACKUP_DIR

# Generate backup filename with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/pebly_backup_$TIMESTAMP.sql"

print_status "Starting database backup..."

# Create database backup
if docker-compose ps postgres | grep -q "Up"; then
    print_status "Creating backup using Docker container..."
    docker-compose exec -T postgres pg_dump -U $POSTGRES_USER -d $POSTGRES_DB > $BACKUP_FILE
else
    print_warning "Docker container not running. Attempting local backup..."
    pg_dump -h localhost -U $POSTGRES_USER -d $POSTGRES_DB > $BACKUP_FILE
fi

# Check if backup was successful
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
    print_status "Backup completed successfully: $BACKUP_FILE"
    
    # Compress backup
    gzip $BACKUP_FILE
    print_status "Backup compressed: $BACKUP_FILE.gz"
    
    # Clean up old backups (keep last 7 days)
    find $BACKUP_DIR -name "pebly_backup_*.sql.gz" -mtime +7 -delete
    print_status "Old backups cleaned up (kept last 7 days)"
    
else
    print_error "Backup failed!"
    exit 1
fi

print_status "Backup process completed successfully! 🎉"