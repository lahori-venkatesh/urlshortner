#!/usr/bin/env node

/**
 * Test script to verify the redirect fix is working
 */

const https = require('https');

async function testRedirectAfterFix() {
  console.log('🧪 Testing Redirect After Fix');
  console.log('=============================\n');

  const testUrl = 'https://pebly.vercel.app/7sT40m';
  
  console.log(`Testing URL: ${testUrl}`);
  console.log('Expected: Should redirect to the original ChatGPT URL\n');

  try {
    // Test the full redirect chain
    const result = await followRedirects(testUrl);
    
    console.log('📊 Redirect Chain:');
    console.log('==================');
    
    result.chain.forEach((step, index) => {
      console.log(`${index + 1}. ${step.url}`);
      console.log(`   Status: ${step.status}`);
      if (step.location) {
        console.log(`   Redirects to: ${step.location}`);
      }
      console.log('');
    });

    console.log('🎯 Final Result:');
    console.log('================');
    
    if (result.finalUrl.includes('chatgpt.com')) {
      console.log('✅ SUCCESS: Redirect is working correctly!');
      console.log(`   Final URL: ${result.finalUrl}`);
      console.log('   The URL now properly redirects to ChatGPT');
    } else if (result.finalUrl.includes('404')) {
      console.log('❌ FAILED: Still redirecting to 404 page');
      console.log(`   Final URL: ${result.finalUrl}`);
      console.log('   The fix may not be deployed yet or needs more work');
    } else {
      console.log('⚠️ UNEXPECTED: Redirect went to unexpected location');
      console.log(`   Final URL: ${result.finalUrl}`);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

async function followRedirects(url, maxRedirects = 5) {
  const chain = [];
  let currentUrl = url;
  
  for (let i = 0; i < maxRedirects; i++) {
    const response = await makeRequest(currentUrl);
    
    chain.push({
      url: currentUrl,
      status: response.status,
      location: response.headers.location
    });

    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      currentUrl = response.headers.location;
    } else {
      break;
    }
  }

  return {
    chain,
    finalUrl: currentUrl
  };
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'RedirectTester/1.0'
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
testRedirectAfterFix().catch(console.error);