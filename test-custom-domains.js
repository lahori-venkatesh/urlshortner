#!/usr/bin/env node

/**
 * Test script for Custom Domain API endpoints
 * This will test the deployed backend without needing local setup
 */

const https = require('https');
const http = require('http');

const API_BASE_URL = 'https://urlshortner-1-hpyu.onrender.com/api';

// Test configuration
const TEST_CONFIG = {
  // You'll need to replace this with a real JWT token from your app
  // Get it from localStorage after logging in to your frontend
  JWT_TOKEN: 'YOUR_JWT_TOKEN_HERE',
  
  // Test domain (use a domain you own for testing)
  TEST_DOMAIN: 'test-domain-' + Date.now() + '.example.com'
};

console.log('🔍 Testing Custom Domain API Endpoints');
console.log('Backend URL:', API_BASE_URL);
console.log('Test Domain:', TEST_CONFIG.TEST_DOMAIN);
console.log('');

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CustomDomainTester/1.0',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log('1️⃣ Testing Backend Health...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/v1/auth/heartbeat`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.JWT_TOKEN}`
      }
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
    
    if (response.status === 401) {
      console.log('   ⚠️  Need valid JWT token for authenticated endpoints');
      return false;
    }
    
    return response.status === 200;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testGetDomains() {
  console.log('2️⃣ Testing Get Domains Endpoint...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/v1/domains/my`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.JWT_TOKEN}`
      }
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
    
    return response.status === 200 || response.status === 401;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testAddDomain() {
  console.log('3️⃣ Testing Add Domain Endpoint...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/v1/domains`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.JWT_TOKEN}`
      },
      body: {
        domainName: TEST_CONFIG.TEST_DOMAIN,
        ownerType: 'USER'
      }
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
    
    return response.status === 200 || response.status === 401;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testEndpointExists(endpoint, method = 'GET') {
  console.log(`🔍 Testing ${method} ${endpoint}...`);
  try {
    const response = await makeRequest(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.JWT_TOKEN}`
      }
    });
    
    console.log(`   Status: ${response.status}`);
    
    // 404 means endpoint doesn't exist, 401/403 means it exists but needs auth
    if (response.status === 404) {
      console.log(`   ❌ Endpoint not found`);
      return false;
    } else {
      console.log(`   ✅ Endpoint exists`);
      return true;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Custom Domain API Tests\n');
  
  // Test if JWT token is provided
  if (TEST_CONFIG.JWT_TOKEN === 'YOUR_JWT_TOKEN_HERE') {
    console.log('⚠️  No JWT token provided. Some tests will show 401 errors.');
    console.log('   To get a token:');
    console.log('   1. Open your frontend app');
    console.log('   2. Login to your account');
    console.log('   3. Open browser DevTools > Console');
    console.log('   4. Run: localStorage.getItem("token")');
    console.log('   5. Copy the token and replace JWT_TOKEN in this script\n');
  }
  
  // Test basic connectivity
  console.log('📡 Testing Backend Connectivity...');
  const healthOk = await testHealthCheck();
  console.log('');
  
  // Test custom domain endpoints
  console.log('🏗️ Testing Custom Domain Endpoints...');
  
  const endpoints = [
    '/v1/domains/my',
    '/v1/domains/verified', 
    '/v1/domains',
    '/v1/domains/verify'
  ];
  
  for (const endpoint of endpoints) {
    await testEndpointExists(endpoint);
  }
  
  console.log('');
  
  // Test actual functionality (if token provided)
  if (TEST_CONFIG.JWT_TOKEN !== 'YOUR_JWT_TOKEN_HERE') {
    console.log('🧪 Testing Domain Operations...');
    await testGetDomains();
    console.log('');
    await testAddDomain();
    console.log('');
  }
  
  console.log('✅ Test completed!');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('   1. If endpoints return 404, the backend needs domain controller setup');
  console.log('   2. If endpoints return 401, provide a valid JWT token');
  console.log('   3. If endpoints return 500, check backend logs for errors');
  console.log('   4. If endpoints return 200, the API is working correctly');
}

// Run the tests
runTests().catch(console.error);