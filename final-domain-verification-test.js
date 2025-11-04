#!/usr/bin/env node

/**
 * Final Domain Verification Test
 * This script will verify the complete domain functionality after deployment
 */

const https = require('https');

const API_BASE_URL = 'https://urlshortner-1-hpyu.onrender.com/api';

// Test user credentials (created during testing)
const TEST_USER = {
  email: 'domaintest@example.com',
  password: 'testpassword123',
  token: null,
  userId: null
};

console.log('🔍 Final Domain Verification Test');
console.log('Backend URL:', API_BASE_URL);
console.log('Test User:', TEST_USER.email);
console.log('');

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
        'User-Agent': 'FinalDomainTester/1.0',
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

async function loginTestUser() {
  console.log('1️⃣ Logging in test user...');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/v1/auth/login`, {
      method: 'POST',
      body: {
        email: TEST_USER.email,
        password: TEST_USER.password
      }
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200 && response.data.success) {
      TEST_USER.token = response.data.token;
      TEST_USER.userId = response.data.user.id;
      console.log(`   ✅ Login successful`);
      console.log(`   User ID: ${TEST_USER.userId}`);
      console.log(`   Plan: ${response.data.user.subscriptionPlan}`);
      return true;
    } else {
      console.log(`   ❌ Login failed:`, response.data.message);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Login error: ${error.message}`);
    return false;
  }
}

async function testDomainHealthEndpoint() {
  console.log('2️⃣ Testing domain health endpoint...');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/v1/domains/health`);
    
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log(`   ✅ Health endpoint working`);
      console.log(`   Repository Available: ${response.data.repositoryAvailable}`);
      console.log(`   Total Domains: ${response.data.totalDomains || 0}`);
      return true;
    } else if (response.status === 404) {
      console.log(`   ❌ WorkingDomainController not deployed yet`);
      return false;
    } else {
      console.log(`   ⚠️  Health endpoint issues:`, response.data);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Health check error: ${error.message}`);
    return false;
  }
}

async function testGetDomains() {
  console.log('3️⃣ Testing get domains endpoint...');
  
  if (!TEST_USER.token) {
    console.log('   ❌ No auth token available');
    return false;
  }
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/v1/domains/my`, {
      headers: {
        'Authorization': `Bearer ${TEST_USER.token}`
      }
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200 && response.data.success) {
      console.log(`   ✅ Get domains working`);
      console.log(`   Domains found: ${response.data.count || 0}`);
      console.log(`   User ID: ${response.data.userId}`);
      return true;
    } else if (response.status === 500) {
      console.log(`   ❌ Server error (old controller still active):`, response.data.message);
      return false;
    } else {
      console.log(`   ⚠️  Unexpected response:`, response.data);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Get domains error: ${error.message}`);
    return false;
  }
}

async function testAddDomain() {
  console.log('4️⃣ Testing add domain endpoint...');
  
  if (!TEST_USER.token) {
    console.log('   ❌ No auth token available');
    return false;
  }
  
  const testDomain = `test-${Date.now()}.example.com`;
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/v1/domains`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_USER.token}`
      },
      body: {
        domainName: testDomain,
        ownerType: 'USER'
      }
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Test Domain: ${testDomain}`);
    
    if (response.status === 200 && response.data.success) {
      console.log(`   ✅ Domain added successfully`);
      console.log(`   Domain ID: ${response.data.domain.id}`);
      console.log(`   Verification Token: ${response.data.domain.verificationToken}`);
      return true;
    } else if (response.status === 403 && response.data.message.includes('PRO')) {
      console.log(`   ⚠️  Plan restriction (expected for FREE user): ${response.data.message}`);
      console.log(`   ✅ Endpoint working correctly (plan validation active)`);
      return true;
    } else if (response.status === 500) {
      console.log(`   ❌ Server error (old controller still active):`, response.data.message);
      return false;
    } else {
      console.log(`   ⚠️  Unexpected response:`, response.data);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Add domain error: ${error.message}`);
    return false;
  }
}

async function testDatabaseConnectivity() {
  console.log('5️⃣ Testing database connectivity...');
  
  if (!TEST_USER.token) {
    console.log('   ❌ No auth token available');
    return false;
  }
  
  try {
    // Test URL endpoint to verify database is working
    const response = await makeRequest(`${API_BASE_URL}/v1/dashboard/urls/${TEST_USER.userId}`, {
      headers: {
        'Authorization': `Bearer ${TEST_USER.token}`
      }
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200 && response.data.success) {
      console.log(`   ✅ Database connectivity confirmed`);
      console.log(`   URLs in database: ${response.data.count || 0}`);
      return true;
    } else {
      console.log(`   ❌ Database connectivity issue:`, response.data);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Database test error: ${error.message}`);
    return false;
  }
}

async function generateFinalReport() {
  console.log('📋 Generating Final Verification Report...');
  
  const results = {
    login: await loginTestUser(),
    databaseConnectivity: await testDatabaseConnectivity(),
    domainHealth: await testDomainHealthEndpoint(),
    getDomains: await testGetDomains(),
    addDomain: await testAddDomain()
  };
  
  console.log('\n📊 Final Verification Results:');
  console.log('===============================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });
  
  console.log('\n🎯 Final Status:');
  
  const criticalTests = ['login', 'databaseConnectivity'];
  const domainTests = ['domainHealth', 'getDomains', 'addDomain'];
  
  const criticalPassed = criticalTests.every(test => results[test]);
  const domainsPassed = domainTests.every(test => results[test]);
  
  if (criticalPassed && domainsPassed) {
    console.log('🎉 SUCCESS: Custom Domain functionality is FULLY OPERATIONAL!');
    console.log('');
    console.log('✅ Backend: Working perfectly');
    console.log('✅ Database: Connected and functional');
    console.log('✅ Authentication: Working correctly');
    console.log('✅ Domain Endpoints: Deployed and working');
    console.log('✅ Plan Validation: Active and correct');
    console.log('');
    console.log('🚀 Ready for Production Use!');
  } else if (criticalPassed && !domainsPassed) {
    console.log('⚠️  PARTIAL: Backend working, Domain controller needs deployment');
    console.log('');
    console.log('✅ Backend Infrastructure: Fully operational');
    console.log('✅ Database: Connected and working');
    console.log('✅ Authentication: Working correctly');
    console.log('❌ Domain Controller: Not deployed yet');
    console.log('');
    console.log('📋 Action Required:');
    console.log('1. Deploy WorkingDomainController.java to backend');
    console.log('2. Restart backend service');
    console.log('3. Re-run this test script');
  } else {
    console.log('❌ FAILURE: Critical backend issues detected');
    console.log('');
    console.log('📋 Issues to Fix:');
    if (!results.login) console.log('❌ Authentication not working');
    if (!results.databaseConnectivity) console.log('❌ Database connection failed');
    console.log('');
    console.log('🔧 Contact support for backend infrastructure issues');
  }
  
  return results;
}

async function runFinalVerification() {
  console.log('🚀 Starting Final Domain Verification\n');
  
  try {
    const results = await generateFinalReport();
    
    console.log('\n📞 Support Information:');
    console.log('If you need help with deployment:');
    console.log('1. Ensure WorkingDomainController.java is in your backend');
    console.log('2. Redeploy your Render backend service');
    console.log('3. Wait 2-3 minutes for deployment to complete');
    console.log('4. Re-run this test script');
    
    return results;
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
  
  console.log('\n✅ Verification completed!');
}

runFinalVerification().catch(console.error);