#!/bin/bash

# Test Authentication Flow
API_URL="https://urlshortner-mrrl.onrender.com/api"

echo "=== Testing Authentication Flow ==="

# Test 1: Register a new user
echo "1. Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "firstName": "Test",
    "lastName": "User"
  }')

echo "Register Response: $REGISTER_RESPONSE"

# Extract token from registration response
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Extracted Token: $TOKEN"

# Test 2: Login with the same user
echo -e "\n2. Testing user login..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }')

echo "Login Response: $LOGIN_RESPONSE"

# Extract token from login response
LOGIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Login Token: $LOGIN_TOKEN"

# Test 3: Validate token
echo -e "\n3. Testing token validation..."
if [ ! -z "$LOGIN_TOKEN" ]; then
  VALIDATE_RESPONSE=$(curl -s -X POST "$API_URL/v1/auth/validate" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $LOGIN_TOKEN")
  
  echo "Validate Response: $VALIDATE_RESPONSE"
else
  echo "No token to validate"
fi

# Test 4: Access protected endpoint
echo -e "\n4. Testing protected endpoint access..."
if [ ! -z "$LOGIN_TOKEN" ]; then
  PROTECTED_RESPONSE=$(curl -s -X GET "$API_URL/v1/urls/user/test-user-id" \
    -H "Authorization: Bearer $LOGIN_TOKEN")
  
  echo "Protected Endpoint Response: $PROTECTED_RESPONSE"
else
  echo "No token for protected endpoint test"
fi

echo -e "\n=== Authentication Flow Test Complete ==="