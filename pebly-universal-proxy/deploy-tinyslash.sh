#!/bin/bash

# TinySlash Worker Deployment Script
# This script deploys the worker to Cloudflare

echo "🚀 TinySlash Worker Deployment"
echo "================================"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found!"
    echo "📦 Install it with: npm install -g wrangler"
    exit 1
fi

echo "✅ Wrangler CLI found"
echo ""

# Check if logged in
echo "🔐 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "⚠️  Not logged in to Cloudflare"
    echo "🔑 Opening browser for authentication..."
    wrangler login
    
    if [ $? -ne 0 ]; then
        echo "❌ Login failed"
        exit 1
    fi
fi

echo "✅ Authenticated with Cloudflare"
echo ""

# Deploy to production
echo "📦 Deploying to production..."
echo ""
wrangler deploy --env production

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Test health endpoint: curl https://tinyslash.your-subdomain.workers.dev/health"
    echo "2. View logs: wrangler tail --env production"
    echo "3. Add routes when tinyslash.com is active in Cloudflare"
    echo ""
    echo "✅ Worker is live and ready!"
else
    echo ""
    echo "❌ Deployment failed"
    echo "💡 Check the error message above"
    echo "💡 Try: wrangler deploy --env production --verbose"
    exit 1
fi
