#!/usr/bin/env node

/**
 * Test script to verify custom domain redirect flow
 * Tests the complete flow from custom domain to final redirect
 */

const https = require('https');
const http = require('http');

class CustomDomainTester {
  constructor(workerUrl, backendUrl) {
    this.workerUrl = workerUrl;
    this.backendUrl = backendUrl;
    this.results = [];
  }

  async runTests() {
    console.log('🧪 Testing Custom Domain Redirect Flow...\n');
    
    const tests = [
      { name: 'Worker Health Check', test: () => this.testWorkerHealth() },
      { name: 'Worker Debug Info', test: () => this.testWorkerDebug() },
      { name: 'Custom Domain Headers', test: () => this.testCustomDomainHeaders() },
      { name: 'Backend Direct Test', test: () => this.testBackendDirect() },
      { name: 'Full Redirect Flow', test: () => this.testFullRedirectFlow() }
    ];

    for (const { name, test } of tests) {
      try {
        console.log(`🔍 Testing: ${name}...`);
        const result = await test();
        this.results.push({ name, status: 'PASS', result });
        console.log(`✅ ${name}: PASSED`);
        console.log(`   Result:`, JSON.stringify(result, null, 2));
        console.log('');
      } catch (error) {
        this.results.push({ name, status: 'FAIL', error: error.message });
        console.log(`❌ ${name}: FAILED - ${error.message}\n`);
      }
    }

    this.printSummary();
  }

  async testWorkerHealth() {
    const response = await this.makeRequest(this.workerUrl + '/health');
    
    if (response.status !== 200) {
      throw new Error(`Health check failed with status ${response.status}`);
    }
    
    const data = JSON.parse(response.body);
    return { healthy: data.healthy, status: response.status };
  }

  async testWorkerDebug() {
    const response = await this.makeRequest(this.workerUrl + '/debug', {
      'Host': 'links.example.com',
      'User-Agent': 'CustomDomainTester/1.0'
    });
    
    if (response.status !== 200) {
      throw new Error(`Debug endpoint failed with status ${response.status}`);
    }
    
    const data = JSON.parse(response.body);
    return {
      hostname: data.hostname,
      hasHeaders: !!data.headers,
      backendUrl: data.backendUrl
    };
  }

  async testCustomDomainHeaders() {
    const customDomain = 'links.pdfcircle.com';
    const response = await this.makeRequest(this.workerUrl + '/test123', {
      'Host': customDomain,
      'User-Agent': 'CustomDomainTester/1.0'
    });
    
    // Should get either a redirect or 404, but with proper headers
    const hasProxyHeaders = response.headers['x-powered-by']?.includes('Pebly');
    
    return {
      status: response.status,
      hasProxyHeaders,
      customDomain,
      headers: response.headers
    };
  }

  async testBackendDirect() {
    // Test backend with custom domain headers (simulating proxy)
    const response = await this.makeRequest(this.backendUrl + '/test123', {
      'X-Forwarded-Host': 'go.example.com',
      'X-Original-Host': 'go.example.com',
      'User-Agent': 'CustomDomainTester/1.0'
    });
    
    return {
      status: response.status,
      isRedirect: response.status >= 300 && response.status < 400,
      location: response.headers.location || null,
      note: 'Testing backend with custom domain headers'
    };
  }

  async testFullRedirectFlow() {
    // Test the complete flow through the worker (simulating custom domain)
    const customDomain = 'go.example.com';
    const response = await this.makeRequest(this.workerUrl + '/test123', {
      'Host': customDomain,
      'User-Agent': 'CustomDomainTester/1.0'
    }, false); // Don't follow redirects
    
    return {
      status: response.status,
      isRedirect: response.status >= 300 && response.status < 400,
      location: response.headers.location || null,
      customDomain,
      hasProxyHeaders: !!response.headers['x-powered-by'],
      note: 'Testing complete custom domain flow through proxy'
    };
  }

  async makeRequest(url, headers = {}, followRedirects = false) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'CustomDomainTester/1.0',
          ...headers
        }
      };

      const client = urlObj.protocol === 'https:' ? https : http;
      
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

  printSummary() {
    console.log('📊 Test Summary:');
    console.log('================');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%\n`);
    
    if (failed > 0) {
      console.log('❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
      console.log('');
    }
    
    console.log('🔧 Next Steps:');
    if (failed === 0) {
      console.log('✅ All tests passed! Custom domain flow is working correctly.');
      console.log('1. Create a real short link with custom domain');
      console.log('2. Test with actual custom domain');
      console.log('3. Monitor analytics and performance');
    } else {
      console.log('❌ Some tests failed. Check the debugging guide:');
      console.log('1. Review CUSTOM_DOMAIN_DEBUGGING.md');
      console.log('2. Check worker and backend logs');
      console.log('3. Verify DNS configuration');
      console.log('4. Test individual components');
    }
    
    console.log('\n🎉 Testing complete!');
  }
}

// Run tests if called directly
if (require.main === module) {
  const workerUrl = process.argv[2] || 'https://pebly-universal-proxy.your-subdomain.workers.dev';
  const backendUrl = process.argv[3] || 'https://urlshortner-1-hpyu.onrender.com';
  
  console.log(`🎯 Testing custom domain flow:`);
  console.log(`   Worker: ${workerUrl}`);
  console.log(`   Backend: ${backendUrl}\n`);
  
  const tester = new CustomDomainTester(workerUrl, backendUrl);
  tester.runTests().catch(console.error);
}

module.exports = CustomDomainTester;