#!/usr/bin/env node

/**
 * Test the Working Domain Controller
 */

const https = require('https');

const API_BASE_URL = 'https://urlshortner-1-hpyu.onrender.com/api';

console.log('🔍 Testing Working Domain Controller');
console.log('Backend URL:', API_BASE_URL);
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
        'User-Agent': 'WorkingDomainTester/1.0',
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

async function testHealthEndpoint() {
  console.log('1️⃣ Testing Health Endpoint...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/v1/domains/health`);
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      console.log(`   ✅ Health endpoint working`);
      return true;
    } else if (response.status === 404) {
      console.log(`   ❌ Working controller not deployed yet`);
      return false;
    } else {
      console.log(`   ⚠️  Health endpoint has issues`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testGetDomainsWithoutAuth() {
  console.log('2️⃣ Testing Get Domains (No Auth)...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/v1/domains/my`);
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 401) {
      console.log(`   ✅ Correctly requires authentication`);
      return true;
    } else if (response.status === 404) {
      console.log(`   ❌ Endpoint not found`);
      return false;
    } else {
      console.log(`   ⚠️  Unexpected response`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function testAddDomainWithoutAuth() {
  console.log('3️⃣ Testing Add Domain (No Auth)...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/v1/domains`, {
      method: 'POST',
      body: {
        domainName: 'test.example.com',
        ownerType: 'USER'
      }
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 401) {
      console.log(`   ✅ Correctly requires authentication`);
      return true;
    } else if (response.status === 404) {
      console.log(`   ❌ Endpoint not found`);
      return false;
    } else {
      console.log(`   ⚠️  Unexpected response`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function runWorkingControllerTest() {
  console.log('🚀 Testing Working Domain Controller\n');
  
  const results = {
    health: await testHealthEndpoint(),
    getDomains: await testGetDomainsWithoutAuth(),
    addDomain: await testAddDomainWithoutAuth()
  };
  
  console.log('\n📊 Test Results:');
  console.log('================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });
  
  console.log('\n🔧 Status:');
  
  if (Object.values(results).every(r => r)) {
    console.log('✅ Working Domain Controller is deployed and functional!');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('1. The backend endpoints are working correctly');
    console.log('2. Frontend should now be able to load domains');
    console.log('3. Test with a real JWT token to add/manage domains');
  } else {
    console.log('⚠️  Working Domain Controller needs to be deployed');
    console.log('');
    console.log('📋 Required Actions:');
    console.log('1. Deploy the backend with WorkingDomainController.java');
    console.log('2. Ensure the original DomainController is disabled');
    console.log('3. Restart the backend service');
  }
  
  return results;
}

runWorkingControllerTest().catch(console.error);