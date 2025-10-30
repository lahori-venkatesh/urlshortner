#!/bin/bash

# Test script to run once your backend service is active
BACKEND_URL="https://urlshortner-mrrl.onrender.com"

echo "Testing if backend service is active..."

# Test health endpoint first
echo "1. Checking service health..."
curl -s "$BACKEND_URL/actuator/health" | head -5

echo -e "\n\n2. Testing domains initialization..."
curl -X POST "$BACKEND_URL/api/v1/init/domains" \
  -H "Content-Type: application/json" \
  -s | python3 -m json.tool 2>/dev/null || echo "Service still suspended or endpoint not available"

echo -e "\n\n3. If successful, check domains status..."
curl -X GET "$BACKEND_URL/api/v1/init/domains/status" \
  -H "Content-Type: application/json" \
  -s | python3 -m json.tool 2>/dev/null || echo "Status check failed"

echo -e "\n\nIf you see JSON responses above, the service is working!"
echo "If you see HTML or errors, the service is still suspended."