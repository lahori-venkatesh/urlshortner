#!/bin/bash

# Simple cURL commands to test MongoDB Atlas domains setup
# Update BACKEND_URL with your actual backend URL

BACKEND_URL="https://your-backend-url.com"

echo "=== Testing MongoDB Atlas Domains Setup ==="
echo "Backend URL: $BACKEND_URL"
echo ""

echo "1. Checking current domains collection state..."
curl -X GET "$BACKEND_URL/api/v1/direct-setup/check-domains-collection" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

echo "2. Creating domains collection in MongoDB Atlas..."
curl -X POST "$BACKEND_URL/api/v1/direct-setup/create-domains-collection-now" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

echo "3. Testing domain creation with go.mybrand.com..."
curl -X POST "$BACKEND_URL/api/v1/direct-setup/test-domain-creation" \
  -H "Content-Type: application/json" \
  -d '{
    "domainName": "go.mybrand.com",
    "ownerType": "USER",
    "ownerId": "test-user-123"
  }' \
  -w "\nHTTP Status: %{http_code}\n\n"

echo "4. Final verification..."
curl -X GET "$BACKEND_URL/api/v1/direct-setup/check-domains-collection" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n\n"

echo "=== Test Complete ==="
echo ""
echo "If all HTTP Status codes are 200, then:"
echo "✅ Domains collection is created in MongoDB Atlas"
echo "✅ Test domain 'go.mybrand.com' is stored"
echo "✅ Custom domain feature is ready to use"
echo ""
echo "Check MongoDB Atlas → pebly database → domains collection"