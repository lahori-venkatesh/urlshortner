#!/bin/bash

# Railway Deployment Script for URL Shortener
# This script deploys the entire application to Railway

set -e

echo "🚀 Starting Railway deployment for URL Shortener..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
railway whoami || railway login

echo "📦 Deploying Backend Service..."
cd backend/url-service

# Initialize Railway project for backend (if not exists)
if [ ! -f ".railway" ]; then
    echo "🆕 Initializing Railway project for backend..."
    railway init --name "url-shortener-backend"
fi

# Add PostgreSQL database
echo "🗄️ Adding PostgreSQL database..."
railway add postgresql || echo "PostgreSQL already exists"

# Add Redis cache
echo "🔴 Adding Redis cache..."
railway add redis || echo "Redis already exists"

# Deploy backend
echo "🚀 Deploying backend..."
railway up --detach

# Get backend URL
BACKEND_URL=$(railway status --json | jq -r '.deployments[0].url')
echo "✅ Backend deployed to: $BACKEND_URL"

# Navigate to frontend
echo "📦 Deploying Frontend Service..."
cd ../../frontend

# Initialize Railway project for frontend (if not exists)
if [ ! -f ".railway" ]; then
    echo "🆕 Initializing Railway project for frontend..."
    railway init --name "url-shortener-frontend"
fi

# Set environment variables for frontend
echo "🔧 Setting frontend environment variables..."
railway variables set REACT_APP_API_URL="$BACKEND_URL"

# Deploy frontend
echo "🚀 Deploying frontend..."
railway up --detach

# Get frontend URL
FRONTEND_URL=$(railway status --json | jq -r '.deployments[0].url')
echo "✅ Frontend deployed to: $FRONTEND_URL"

# Update backend with frontend URL
echo "🔧 Updating backend environment variables..."
cd ../backend/url-service
railway variables set FRONTEND_URL="$FRONTEND_URL"
railway variables set CORS_ALLOWED_ORIGINS="$FRONTEND_URL"

echo "🎉 Deployment completed successfully!"
echo "📱 Frontend: $FRONTEND_URL"
echo "🔧 Backend: $BACKEND_URL"
echo ""
echo "Next steps:"
echo "1. Configure your Google OAuth credentials in Railway dashboard"
echo "2. Set JWT_SECRET in backend environment variables"
echo "3. Test your application"