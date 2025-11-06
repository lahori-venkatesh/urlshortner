#!/usr/bin/env node

/**
 * Test script to verify the redirect fix for default domain URLs
 */

const https = require('https');

class RedirectTester {
  constructor() {
    this.backendUrl = 'https://urlshortner-1-hpyu.onrender.com';
    this.frontendUrl = 'https://pebly.vercel.app';
  }

  async testRedirectFlow() {
    console.log('🔍 Testing Default Domain Redirect Flow');
    console.log('=====================================\n');

    const shortCode = '7sT40m';
    
    // Test 1: Frontend redirect (Vercel)
    console.log('1️⃣ Testing Frontend Redirect (Vercel)...');
    try {
      const frontendResponse = await this.makeRequest(`${this.frontendUrl}/${shortCode}`, {}, false);
      console.log(`   Status: ${frontendResponse.status}`);
      console.log(`   Location: ${frontendResponse.headers.location || 'None'}`);
      
      if (frontendResponse.status === 307 && frontendResponse.headers.location) {
        console.log('   ✅ Frontend redirect working correctly');
      } else {
        console.log('   ❌ Frontend redirect issue');
      }
    } catch (error) {
      console.log(`   ❌ Frontend test failed: ${error.message}`);
    }

    console.log('');

    // Test 2: Backend direct access
    console.log('2️⃣ Testing Backend Direct Access...');
    try {
      const backendResponse = await this.makeRequest(`${this.backendUrl}/${shortCode}`, {}, false);
      console.log(`   Status: ${backendResponse.status}`);
      console.log(`   Location: ${backendResponse.headers.location || 'None'}`);
      
      if (backendResponse.status >= 300 && backendResponse.status < 400) {
        console.log('   ✅ Backend redirect working');
      } else {
        console.log('   ❌ Backend redirect failed');
        console.log(`   Response body: ${backendResponse.body.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`   ❌ Backend test failed: ${error.message}`);
    }

    console.log('');

    // Test 3: Backend with correct headers (simulating Vercel proxy)
    console.log('3️⃣ Testing Backend with Vercel Headers...');
    try {
      const backendWithHeadersResponse = await this.makeRequest(`${this.backendUrl}/${shortCode}`, {
        'Host': 'urlshortner-1-hpyu.onrender.com',
        'X-Forwarded-Host': 'pebly.vercel.app',
        'X-Original-Host': 'pebly.vercel.app',
        'User-Agent': 'Vercel-Proxy/1.0'
      }, false);
      
      console.log(`   Status: ${backendWithHeadersResponse.status}`);
      console.log(`   Location: ${backendWithHeadersResponse.headers.location || 'None'}`);
      
      if (backendWithHeadersResponse.status >= 300 && backendWithHeadersResponse.status < 400) {
        console.log('   ✅ Backend with headers working');
      } else {
        console.log('   ❌ Backend with headers failed');
        console.log(`   Response body: ${backendWithHeadersResponse.body.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`   ❌ Backend with headers test failed: ${error.message}`);
    }

    console.log('');

    // Test 4: Debug endpoint
    console.log('4️⃣ Testing Debug Endpoint...');
    try {
      const debugResponse = await this.makeRequest(`${this.backendUrl}/debug/${shortCode}`);
      console.log(`   Status: ${debugResponse.status}`);
      console.log(`   Debug info:`);
      console.log(`   ${debugResponse.body}`);
    } catch (error) {
      console.log(`   ❌ Debug test failed: ${error.message}`);
    }

    console.log('');
    console.log('🔧 Analysis and Recommendations:');
    console.log('================================');
    console.log('1. If frontend redirect (307) works but backend fails (500), it\'s a backend issue');
    console.log('2. Check if the cache configuration is deployed');
    console.log('3. Verify the domain field in the database for this URL');
    console.log('4. The URL should have domain="pebly.vercel.app" or domain=null for default domain');
  }

  async makeRequest(url, headers = {}, followRedirects = true) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'RedirectTester/1.0',
          ...headers
        }
      };

      const client = urlObj.protocol === 'https:' ? https : require('http');
      
      const req = client.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          // Handle redirects if requested
          if (followRedirects && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            this.makeRequest(res.headers.location, headers, followRedirects)
              .then(resolve)
              .catch(reject);
            return;
          }
          
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
}

// Run the test
const tester = new RedirectTester();
tester.testRedirectFlow().catch(console.error);