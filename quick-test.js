#!/usr/bin/env node

/**
 * Quick test script to verify the custom domain system
 * Run this after deploying the Cloudflare Worker
 */

const https = require('https');

async function quickTest() {
  console.log('🧪 Quick Custom Domain System Test\n');
  
  // Get URLs from command line or use defaults
  const workerUrl = process.argv[2] || 'https://pebly-universal-proxy.your-subdomain.workers.dev';
  const backendUrl = process.argv[3] || 'https://urlshortner-1-hpyu.onrender.com';
  
  console.log(`🎯 Testing URLs:`);
  console.log(`   Worker: ${workerUrl}`);
  console.log(`   Backend: ${backendUrl}\n`);
  
  const tests = [
    {
      name: 'Worker Health Check',
      url: `${workerUrl}/health`,
      expected: 200
    },
    {
      name: 'Worker Debug Info',
      url: `${workerUrl}/debug`,
      headers: { 'Host': 'test.example.com' },
      expected: 200
    },
    {
      name: 'Backend Health Check',
      url: `${backendUrl}/api/health`,
      expected: 200
    },
    {
      name: 'Custom Domain Simulation',
      url: `${workerUrl}/nonexistent`,
      headers: { 'Host': 'go.example.com' },
      expected: [404, 301, 302] // Any of these is fine
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}...`);
      const result = await makeRequest(test.url, test.headers);
      
      const expectedStatuses = Array.isArray(test.expected) ? test.expected : [test.expected];
      
      if (expectedStatuses.includes(result.status)) {
        console.log(`✅ PASS - Status: ${result.status}`);
        passed++;
      } else {
        console.log(`❌ FAIL - Expected: ${test.expected}, Got: ${result.status}`);
        failed++;
      }
      
      // Show some response details for debug endpoint
      if (test.name.includes('Debug') && result.status === 200) {
        try {
          const data = JSON.parse(result.body);
          console.log(`   📋 Hostname: ${data.hostname}`);
          console.log(`   📋 Backend URL: ${data.backendUrl}`);
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
      
    } catch (error) {
      console.log(`❌ FAIL - Error: ${error.message}`);
      failed++;
    }
    
    console.log('');
  }
  
  // Summary
  console.log('📊 Test Results:');
  console.log('================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Your custom domain system is working correctly.');
    console.log('\n🔧 Next steps:');
    console.log('1. Update your frontend with the worker URL');
    console.log('2. Add a real custom domain for testing');
    console.log('3. Create a short link with custom domain');
    console.log('4. Test the complete flow');
  } else {
    console.log('⚠️  Some tests failed. Check the deployment guide:');
    console.log('1. Ensure Cloudflare Worker is deployed correctly');
    console.log('2. Verify backend is accessible');
    console.log('3. Check network connectivity');
    console.log('4. Review error messages above');
  }
  
  console.log('\n📖 For detailed testing: node test-custom-domain-flow.js [worker-url] [backend-url]');
}

function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'QuickTest/1.0',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Run the test
if (require.main === module) {
  quickTest().catch(console.error);
}

module.exports = quickTest;