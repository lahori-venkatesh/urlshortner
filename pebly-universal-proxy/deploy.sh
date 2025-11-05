#!/bin/bash

# Pebly Universal Proxy Deployment Script
# Deploys to Cloudflare Workers with proper environment configuration

set -e

echo "🚀 Deploying Pebly Universal Proxy..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Check if user is logged in
if ! wrangler whoami &> /dev/null; then
    echo "🔐 Please login to Cloudflare..."
    wrangler login
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Deploy to development first
echo "🧪 Deploying to development environment..."
wrangler deploy --env development

# Test development deployment
DEV_URL=$(wrangler subdomain get 2>/dev/null || echo "pebly-universal-proxy-dev.your-subdomain.workers.dev")
echo "🔍 Testing development deployment at: https://$DEV_URL"

# Ask for production deployment confirmation
read -p "✅ Development deployment successful. Deploy to production? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Deploying to production..."
    wrangler deploy --env production
    
    PROD_URL=$(wrangler subdomain get 2>/dev/null || echo "pebly-universal-proxy-prod.your-subdomain.workers.dev")
    echo "✅ Production deployment complete!"
    echo "🌐 Production URL: https://$PROD_URL"
    
    # Update frontend configuration
    echo ""
    echo "📝 Next steps:"
    echo "1. Update your frontend to use: https://$PROD_URL"
    echo "2. Update DNS instructions to point to: $PROD_URL"
    echo "3. Test with a custom domain setup"
    echo ""
    echo "🔧 Frontend update needed in:"
    echo "   - CustomDomainOnboarding.tsx (DNS instructions)"
    echo "   - Any hardcoded proxy URLs"
else
    echo "⏸️  Production deployment skipped"
fi

echo "🎉 Deployment process complete!"