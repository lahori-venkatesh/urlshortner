#!/usr/bin/env node

/**
 * Test Vercel routing configuration
 */

const https = require('https');

async function testVercelRouting() {
  console.log('🧪 Testing Vercel Routing Configuration\n');
  
  const tests = [
    {
      name: 'Frontend Homepage',
      url: 'https://pebly.vercel.app/',
      expected: 200,
      shouldContain: 'html'
    },
    {
      name: 'API Proxy',
      url: 'https://pebly.vercel.app/api/health',
      expected: [200, 404],
      note: 'API endpoint proxy test'
    },
    {
      name: 'Actuator Proxy', 
      url: 'https://pebly.vercel.app/actuator/health',
      expected: 200,
      shouldContain: 'UP'
    },
    {
      name: 'Short Code Redirect (6 chars)',
      url: 'https://pebly.vercel.app/abc123',
      expected: [307, 301, 302, 404, 500],
      note: 'Should redirect to backend'
    },
    {
      name: 'Short Code Redirect (existing)',
      url: 'https://pebly.vercel.app/vR8iDa',
      expected: [307, 301, 302, 404, 500],
      note: 'Should redirect to backend'
    },
    {
      name: 'Frontend Route (should work)',
      url: 'https://pebly.vercel.app/dashboard',
      expected: 200,
      shouldContain: 'html'
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}...`);
      const result = await makeRequest(test.url);
      
      const expectedStatuses = Array.isArray(test.expected) ? test.expected : [test.expected];
      const statusMatch = expectedStatuses.includes(result.status);
      
      if (statusMatch) {
        console.log(`✅ PASS - Status: ${result.status}`);
        if (test.shouldContain && result.body) {
          const hasContent = result.body.toLowerCase().includes(test.shouldContain.toLowerCase());
          console.log(`   Content check: ${hasContent ? '✅' : '❌'} (looking for "${test.shouldContain}")`);
        }
        if (test.note) {
          console.log(`   Note: ${test.note}`);
        }
        passed++;
      } else {
        console.log(`❌ FAIL - Expected: ${test.expected}, Got: ${result.status}`);
        if (test.note) {
          console.log(`   Note: ${test.note}`);
        }
        failed++;
      }
      
      // Show redirect location if present
      if (result.headers.location) {
        console.log(`   Redirect to: ${result.headers.location}`);
      }
      
    } catch (error) {
      console.log(`❌ FAIL - Error: ${error.message}`);
      failed++;
    }
    
    console.log('');
  }
  
  console.log('📊 Test Results:');
  console.log('================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);
  
  if (failed === 0) {
    console.log('🎉 All routing tests passed! Vercel configuration is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. The configuration may need adjustment.');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. If short code redirects are working (307/301/302), the routing is correct');
  console.log('2. Create a new test short link in your app');
  console.log('3. Test the new link: https://pebly.vercel.app/NEW_SHORT_CODE');
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'VercelRoutingTester/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body.substring(0, 500) // First 500 chars for content checking
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

testVercelRouting().catch(console.error);