#!/bin/bash

# Pebly Stop Script
# Usage: ./scripts/stop.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "🛑 Stopping Pebly application..."

# Load process IDs if they exist
if [ -f "logs/app.env" ]; then
    source logs/app.env
fi

# Stop backend
if [ ! -z "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
    print_status "Stopping backend server (PID: $BACKEND_PID)..."
    kill $BACKEND_PID
    sleep 2
    if kill -0 $BACKEND_PID 2>/dev/null; then
        print_warning "Backend didn't stop gracefully, force killing..."
        kill -9 $BACKEND_PID
    fi
    print_status "✅ Backend stopped"
else
    print_warning "Backend process not found or already stopped"
fi

# Stop frontend
if [ ! -z "$FRONTEND_PID" ] && kill -0 $FRONTEND_PID 2>/dev/null; then
    print_status "Stopping frontend server (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID
    sleep 2
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        print_warning "Frontend didn't stop gracefully, force killing..."
        kill -9 $FRONTEND_PID
    fi
    print_status "✅ Frontend stopped"
else
    print_warning "Frontend process not found or already stopped"
fi

# Alternative: Kill by port (fallback)
print_status "Checking for any remaining processes on ports 3000 and 8080..."

# Kill process on port 3000 (frontend)
FRONTEND_PORT_PID=$(lsof -ti:3000 2>/dev/null || echo "")
if [ ! -z "$FRONTEND_PORT_PID" ]; then
    print_status "Found process on port 3000 (PID: $FRONTEND_PORT_PID), stopping..."
    kill $FRONTEND_PORT_PID 2>/dev/null || true
fi

# Kill process on port 8080 (backend)
BACKEND_PORT_PID=$(lsof -ti:8080 2>/dev/null || echo "")
if [ ! -z "$BACKEND_PORT_PID" ]; then
    print_status "Found process on port 8080 (PID: $BACKEND_PORT_PID), stopping..."
    kill $BACKEND_PORT_PID 2>/dev/null || true
fi

# Clean up PID files
rm -f logs/backend.pid logs/frontend.pid logs/app.env

print_status "🎉 Pebly application stopped successfully!"
echo ""
print_status "To start the application again, run:"
echo "  ./scripts/deploy.sh"