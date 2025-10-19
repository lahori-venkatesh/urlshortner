#!/bin/bash

# Pebly Status Check Script
# Usage: ./scripts/status.sh

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo "🔍 Checking Pebly Application Status..."
echo ""

# Check backend
print_info "Backend (Port 8080):"
if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
    print_status "✅ Backend is running and healthy"
    BACKEND_STATUS="UP"
else
    print_error "❌ Backend is not responding"
    BACKEND_STATUS="DOWN"
fi

# Check frontend
print_info "Frontend (Port 3000):"
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "✅ Frontend is running"
    FRONTEND_STATUS="UP"
else
    print_error "❌ Frontend is not responding"
    FRONTEND_STATUS="DOWN"
fi

# Check database
print_info "Database:"
if [ -f "data/urlshortener.mv.db" ]; then
    print_status "✅ H2 Database file exists"
    DB_SIZE=$(du -h data/urlshortener.mv.db | cut -f1)
    print_info "   Database size: $DB_SIZE"
    DATABASE_STATUS="UP"
else
    print_warning "⚠️  Database file not found (will be created on first use)"
    DATABASE_STATUS="PENDING"
fi

# Check process IDs
print_info "Process Information:"
if [ -f "logs/app.env" ]; then
    source logs/app.env
    if [ ! -z "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
        print_status "   Backend PID: $BACKEND_PID (running)"
    fi
    if [ ! -z "$FRONTEND_PID" ] && kill -0 $FRONTEND_PID 2>/dev/null; then
        print_status "   Frontend PID: $FRONTEND_PID (running)"
    fi
fi

# Check ports
print_info "Port Usage:"
BACKEND_PORT=$(lsof -ti:8080 2>/dev/null || echo "")
FRONTEND_PORT=$(lsof -ti:3000 2>/dev/null || echo "")

if [ ! -z "$BACKEND_PORT" ]; then
    print_status "   Port 8080: In use (PID: $BACKEND_PORT)"
else
    print_error "   Port 8080: Not in use"
fi

if [ ! -z "$FRONTEND_PORT" ]; then
    print_status "   Port 3000: In use (PID: $FRONTEND_PORT)"
else
    print_error "   Port 3000: Not in use"
fi

echo ""
print_info "📊 Summary:"
echo "   Backend:  $BACKEND_STATUS"
echo "   Frontend: $FRONTEND_STATUS"
echo "   Database: $DATABASE_STATUS"

echo ""
if [ "$BACKEND_STATUS" = "UP" ] && [ "$FRONTEND_STATUS" = "UP" ]; then
    print_status "🎉 Pebly is running successfully!"
    echo ""
    print_info "🌐 Access URLs:"
    echo "   Frontend:  http://localhost:3000"
    echo "   Backend:   http://localhost:8080"
    echo "   H2 Console: http://localhost:8080/h2-console"
    echo ""
    print_info "📁 Log files:"
    echo "   Backend:   logs/backend.log"
    echo "   Frontend:  logs/frontend.log"
else
    print_error "⚠️  Some services are not running properly"
    echo ""
    print_info "🚀 To start the application:"
    echo "   ./scripts/deploy.sh"
fi

echo ""