#!/usr/bin/env node

/**
 * Test script to check if the backend service has been restarted
 * and the cache configuration is working
 */

const https = require('https');

async function testServiceRestart() {
  console.log('🔄 Testing Backend Service Status');
  console.log('=================================\n');

  const backendUrl = 'https://urlshortner-1-hpyu.onrender.com';
  const shortCode = '7sT40m';

  // Test 1: Check if cache error is gone
  console.log('1️⃣ Testing Cache Configuration...');
  try {
    const debugResponse = await makeRequest(`${backendUrl}/debug/${shortCode}`);
    
    if (debugResponse.body.includes('Cannot find cache named')) {
      console.log('❌ Cache configuration not loaded yet');
      console.log('   The service needs to be restarted to pick up cache changes');
      console.log('   Current error:', debugResponse.body.substring(0, 100) + '...');
    } else {
      console.log('✅ Cache configuration loaded successfully');
      console.log('   Debug response:', debugResponse.body);
    }
  } catch (error) {
    console.log('❌ Debug endpoint failed:', error.message);
  }

  console.log('');

  // Test 2: Test actual redirect
  console.log('2️⃣ Testing Redirect Functionality...');
  try {
    const redirectResponse = await makeRequest(`${backendUrl}/${shortCode}`, {}, false);
    
    console.log(`   Status: ${redirectResponse.status}`);
    console.log(`   Location: ${redirectResponse.headers.location || 'None'}`);
    
    if (redirectResponse.status >= 300 && redirectResponse.status < 400) {
      const location = redirectResponse.headers.location;
      if (location && location.includes('chatgpt.com')) {
        console.log('✅ SUCCESS: Redirect is working correctly!');
        console.log('   Redirects to ChatGPT URL as expected');
      } else if (location && location.includes('404')) {
        console.log('❌ Still redirecting to 404 - cache issue persists');
      } else {
        console.log('⚠️ Unexpected redirect location');
      }
    } else if (redirectResponse.status === 500) {
      console.log('❌ Still getting 500 error - service needs restart');
    } else {
      console.log('⚠️ Unexpected status code');
    }
  } catch (error) {
    console.log('❌ Redirect test failed:', error.message);
  }

  console.log('');

  // Test 3: Full chain test
  console.log('3️⃣ Testing Full Redirect Chain...');
  try {
    const fullTest = await testFullChain('https://pebly.vercel.app/7sT40m');
    
    if (fullTest.success) {
      console.log('🎉 COMPLETE SUCCESS: Full redirect chain working!');
      console.log(`   Final URL: ${fullTest.finalUrl}`);
    } else {
      console.log('❌ Full chain test failed');
      console.log(`   Issue: ${fullTest.error}`);
    }
  } catch (error) {
    console.log('❌ Full chain test error:', error.message);
  }

  console.log('\n📋 Next Steps:');
  console.log('==============');
  console.log('If cache errors persist:');
  console.log('1. Restart/redeploy the backend service on Render');
  console.log('2. Wait 2-3 minutes for service to fully start');
  console.log('3. Run this test again: node test-service-restart.js');
  console.log('4. Test the URL: https://pebly.vercel.app/7sT40m');
}

async function testFullChain(url) {
  try {
    const response1 = await makeRequest(url, {}, false);
    
    if (response1.status === 307 && response1.headers.location) {
      const response2 = await makeRequest(response1.headers.location, {}, false);
      
      if (response2.status >= 300 && response2.status < 400 && response2.headers.location) {
        const finalUrl = response2.headers.location;
        return {
          success: finalUrl.includes('chatgpt.com'),
          finalUrl,
          error: finalUrl.includes('chatgpt.com') ? null : 'Does not redirect to ChatGPT'
        };
      } else {
        return {
          success: false,
          finalUrl: response1.headers.location,
          error: `Backend returned ${response2.status} instead of redirect`
        };
      }
    } else {
      return {
        success: false,
        finalUrl: url,
        error: `Frontend returned ${response1.status} instead of 307 redirect`
      };
    }
  } catch (error) {
    return {
      success: false,
      finalUrl: url,
      error: error.message
    };
  }
}

function makeRequest(url, headers = {}, followRedirects = true) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'ServiceRestartTester/1.0',
        ...headers
      }
    };

    const client = urlObj.protocol === 'https:' ? https : require('http');
    
    const req = client.request(options, (res) => {
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
testServiceRestart().catch(console.error);