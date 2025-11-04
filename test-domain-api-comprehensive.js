#!/usr/bin/env node

/**
 * Comprehensive Custom Domain API Test
 * Tests the deployed backend endpoints systematically
 */

const https = require('https');

const API_BASE_URL = 'https://urlshortner-1-hpyu.onrender.com/api';

console.log('🔍 Comprehensive Custom Domain API Test');
console.log('Backend URL:', API_BASE_URL);
console.log('');

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DomainAPITester/1.0',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
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
            data: data,
            parseError: e.message
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
async function testBackendConnectivity() {
  console.log('1️⃣ Testing Backend Connectivity...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/v1/auth/users`);
    
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200 && response.data.success) {
      console.log(`   ✅ Backend is online - Found ${response.data.count} users`);
      return true;
    } else {
      console.log(`   ❌ Backend connectivity issue`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testSimpleDomainEndpoints() {
  console.log('2️⃣ Testing Simple Domain Endpoints...');
  
  // Test the simple domain controller
  try {
    const response = await makeRequest(`${API_BASE_URL}/v1/domains-simple/test`);
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, response.data);
    
    if (response.status === 200) {
      console.log(`   ✅ Simple domain controller is working`);
      return true;
    } else if (response.status === 404) {
      console.log(`   ⚠️  Simple domain controller not deployed yet`);
      return false;
    } else {
      console.log(`   ❌ Simple domain controller error`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testMainDomainEndpoints() {
  console.log('3️⃣ Testing Main Domain Endpoints...');
  
  const endpoints = [
    { path: '/v1/domains/my', method: 'GET', description: 'Get My Domains' },
    { path: '/v1/domains/verified', method: 'GET', description: 'Get Verified Domains' }
  ];

  let allWorking = true;

  for (const endpoint of endpoints) {
    console.log(`   Testing ${endpoint.description}...`);
    
    try {
      const response = await makeRequest(`${API_BASE_URL}${endpoint.path}`, {
        method: endpoint.method
      });
      
      console.log(`     Status: ${response.status}`);
      
      if (response.status === 404) {
        console.log(`     ❌ Endpoint not found`);
        allWorking = false;
      } else if (response.status === 401) {
        console.log(`     ✅ Endpoint exists (needs auth)`);
      } else if (response.status === 500) {
        console.log(`     ⚠️  Server error - endpoint exists but has issues`);
        console.log(`     Error:`, response.data);
      } else {
        console.log(`     ✅ Endpoint working`);
      }
    } catch (error) {
      console.log(`     ❌ Error: ${error.message}`);
      allWorking = false;
    }
  }
  
  return allWorking;
}

async function testDatabaseConnectivity() {
  console.log('4️⃣ Testing Database Connectivity...');
  
  try {
    // Test if we can access user data (indicates DB is working)
    const response = await makeRequest(`${API_BASE_URL}/v1/auth/users`);
    
    if (response.status === 200 && response.data.success && response.data.users) {
      console.log(`   ✅ Database is connected - ${response.data.count} users found`);
      
      // Check if we have PRO users (for domain testing)
      const proUsers = response.data.users.filter(u => u.subscriptionPlan.includes('PRO'));
      console.log(`   📊 Found ${proUsers.length} PRO users who can use custom domains`);
      
      return true;
    } else {
      console.log(`   ❌ Database connectivity issue`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testDomainRepository() {
  console.log('5️⃣ Testing Domain Repository...');
  
  try {
    // Test the simple domain health endpoint
    const response = await makeRequest(`${API_BASE_URL}/v1/domains-simple/health`);
    
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log(`   Response:`, response.data);
      
      if (response.data.repositoryAvailable) {
        console.log(`   ✅ Domain repository is available`);
        if (response.data.totalDomains !== undefined) {
          console.log(`   📊 Total domains in database: ${response.data.totalDomains}`);
        }
        return true;
      } else {
        console.log(`   ❌ Domain repository not available`);
        return false;
      }
    } else if (response.status === 404) {
      console.log(`   ⚠️  Simple domain controller not deployed`);
      return false;
    } else {
      console.log(`   ❌ Health check failed`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function generateTestReport() {
  console.log('📋 Generating Test Report...');
  
  const results = {
    backendConnectivity: await testBackendConnectivity(),
    databaseConnectivity: await testDatabaseConnectivity(),
    simpleDomainEndpoints: await testSimpleDomainEndpoints(),
    mainDomainEndpoints: await testMainDomainEndpoints(),
    domainRepository: await testDomainRepository()
  };
  
  console.log('');
  console.log('📊 Test Results Summary:');
  console.log('========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });
  
  console.log('');
  
  // Provide recommendations
  console.log('🔧 Recommendations:');
  
  if (!results.backendConnectivity) {
    console.log('❌ Backend is not accessible - check deployment status');
  }
  
  if (!results.databaseConnectivity) {
    console.log('❌ Database connection failed - check MongoDB Atlas connection');
  }
  
  if (!results.simpleDomainEndpoints) {
    console.log('⚠️  Simple domain controller not deployed - redeploy backend with new files');
  }
  
  if (!results.mainDomainEndpoints) {
    console.log('❌ Main domain endpoints missing - check if DomainController is deployed');
  }
  
  if (!results.domainRepository) {
    console.log('❌ Domain repository not working - check MongoDB collections and dependencies');
  }
  
  if (Object.values(results).every(r => r)) {
    console.log('✅ All tests passed! Custom domain functionality should work.');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('1. Test with a valid JWT token from your frontend');
    console.log('2. Try adding a domain through the API');
    console.log('3. Verify the frontend can load domains successfully');
  } else {
    console.log('⚠️  Some tests failed. Fix the issues above before testing frontend integration.');
  }
  
  return results;
}

// Main execution
async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Domain API Test\n');
  
  try {
    await generateTestReport();
  } catch (error) {
    console.error('❌ Test execution failed:', error);
  }
  
  console.log('\n✅ Test completed!');
}

// Run the test
runComprehensiveTest().catch(console.error);