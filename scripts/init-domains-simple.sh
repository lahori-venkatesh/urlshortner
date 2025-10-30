#!/bin/bash

# Simple script to initialize domains database in MongoDB Atlas
# Update BACKEND_URL with your actual backend URL

BACKEND_URL="${BACKEND_URL:-https://urlshortner-mrrl.onrender.com}"

echo "=================================================="
echo "🗄️  Initialize Custom Domains Database"
echo "=================================================="
echo "Backend URL: $BACKEND_URL"
echo ""

echo "Step 1: Initialize domains database..."
echo "Command: POST $BACKEND_URL/api/v1/init/domains"
echo ""

curl -X POST "$BACKEND_URL/api/v1/init/domains" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | python3 -m json.tool 2>/dev/null || cat

echo ""
echo "=================================================="
echo ""

echo "Step 2: Check domains status..."
echo "Command: GET $BACKEND_URL/api/v1/init/domains/status"
echo ""

curl -X GET "$BACKEND_URL/api/v1/init/domains/status" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | python3 -m json.tool 2>/dev/null || cat

echo ""
echo "=================================================="
echo ""

echo "Step 3: Create test domain (go.mybrand.com)..."
echo "Command: POST $BACKEND_URL/api/v1/init/domains/test"
echo ""

curl -X POST "$BACKEND_URL/api/v1/init/domains/test" \
  -H "Content-Type: application/json" \
  -d '{"domainName": "go.mybrand.com"}' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  | python3 -m json.tool 2>/dev/null || cat

echo ""
echo "=================================================="
echo ""

echo "✅ Initialization Complete!"
echo ""
echo "If all HTTP Status codes are 200, then:"
echo "  📁 'domains' collection created in MongoDB Atlas"
echo "  🔍 Indexes created for fast queries"
echo "  📊 Sample data inserted and verified"
echo "  🚀 Custom domain feature is ready!"
echo ""
echo "Next steps:"
echo "  1. Check MongoDB Atlas → pebly database → domains collection"
echo "  2. You should see 'demo.example.com' and 'go.mybrand.com'"
echo "  3. Test custom domain creation in your app"
echo ""