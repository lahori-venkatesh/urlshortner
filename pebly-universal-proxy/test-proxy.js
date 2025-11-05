#!/usr/bin/env node

/**
 * Comprehensive test suite for Pebly Universal Proxy
 * Tests various scenarios and edge cases
 */

const https = require('https');
const http = require('http');

class ProxyTester {
  constructor(proxyUrl) {
    this.proxyUrl = proxyUrl;
    this.results = [];
  }

  async runTests() {
    console.log('🧪 Starting Pebly Universal Proxy Tests...\n');
    
    const tests = [
      { name: 'Health Check', test: () => this.testHealthCheck() },
      { name: 'Basic Redirect', test: () => this.testBasicRedirect() },
      { name: 'Custom Domain Headers', test: () => this.testCustomDomainHeaders() },
      { name: 'Error Handling', test: () => this.testErrorHandling() },
      { name: 'CORS Headers', test: () => this.testCorsHeaders() },
      { name: 'Analytics Headers', test: () => this.testAnalyticsHeaders() }
    ];

    for (const { name, test } of tests) {
      try {
        console.log(`🔍 Testing: ${name}...`);
        const result = await test();
        this.results.push({ name, status: 'PASS', result });
        console.log(`✅ ${name}: PASSED\n`);
      } catch (error) {
        this.results.push({ name, status: 'FAIL', error: error.message });
        console.log(`❌ ${name}: FAILED - ${error.message}\n`);
      }
    }

    this.printSummary();
  }

  async testHealthCheck() {
    const response = await this.makeRequest('/health');
    if (response.status !== 200) {
      throw new Error(`Health check failed with status ${response.status}`);
    }
    
    const data = JSON.parse(response.body);
    if (!data.healthy) {
      throw new Error('Health check reports unhealthy status');
    }
    
    return { status: response.status, healthy: data.healthy };
  }

  async testBasicRedirect() {
    // Test with a known short code (you'll need to create one first)
    const response = await this.makeRequest('/test123', {
      'Host': 'test.example.com'
    });
    
    // Should either redirect or return 404 with proper error page
    if (response.status >= 300 && response.status < 400) {
      return { type: 'redirect', location: response.headers.location };
    } else if (response.status === 404) {
      return { type: 'not_found', hasErrorPage: response.body.includes('Link Not Found') };
    }
    
    throw new Error(`Unexpected response status: ${response.status}`);
  }

  async testCustomDomainHeaders() {
    const customHost = 'links.example.com';
    const response = await this.makeRequest('/test', {
      'Host': customHost
    });
    
    const expectedHeaders = [
      'X-Powered-By',
      'X-Proxy-Host',
      'Access-Control-Allow-Origin'
    ];
    
    const missingHeaders = expectedHeaders.filter(header => 
      !response.headers[header.toLowerCase()]
    );
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing headers: ${missingHeaders.join(', ')}`);
    }
    
    return { customHost, headers: response.headers };
  }

  async testErrorHandling() {
    const response = await this.makeRequest('/nonexistent-link', {
      'Host': 'test.example.com'
    });
    
    if (response.status !== 404) {
      throw new Error(`Expected 404, got ${response.status}`);
    }
    
    if (!response.body.includes('Link Not Found')) {
      throw new Error('Error page does not contain expected content');
    }
    
    return { status: response.status, hasErrorPage: true };
  }

  async testCorsHeaders() {
    const response = await this.makeRequest('/test', {
      'Host': 'api.example.com',
      'Origin': 'https://example.com'
    });
    
    const corsHeaders = {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'access-control-allow-headers': '*'
    };
    
    for (const [header, expectedValue] of Object.entries(corsHeaders)) {
      if (response.headers[header] !== expectedValue) {
        throw new Error(`CORS header ${header} mismatch`);
      }
    }
    
    return { corsEnabled: true };
  }

  async testAnalyticsHeaders() {
    const response = await this.makeRequest('/analytics-test', {
      'Host': 'analytics.example.com',
      'CF-IPCountry': 'US',
      'CF-Ray': 'test-ray-123'
    });
    
    const analyticsHeaders = [
      'x-proxy-version',
      'x-response-time'
    ];
    
    const presentHeaders = analyticsHeaders.filter(header => 
      response.headers[header]
    );
    
    return { 
      analyticsHeaders: presentHeaders,
      hasAnalytics: presentHeaders.length > 0 
    };
  }

  async makeRequest(path, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.proxyUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'GET',
        headers: {
          'User-Agent': 'Pebly-Proxy-Tester/1.0',
          ...headers
        }
      };

      const client = url.protocol === 'https:' ? https : http;
      
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

  printSummary() {
    console.log('📊 Test Summary:');
    console.log('================');
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / this.results.length) * 100).toFixed(1)}%\n`);
    
    if (failed > 0) {
      console.log('Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
    }
    
    console.log('\n🎉 Testing complete!');
  }
}

// Run tests if called directly
if (require.main === module) {
  const proxyUrl = process.argv[2] || 'https://pebly-universal-proxy.your-subdomain.workers.dev';
  
  console.log(`🎯 Testing proxy at: ${proxyUrl}\n`);
  
  const tester = new ProxyTester(proxyUrl);
  tester.runTests().catch(console.error);
}

module.exports = ProxyTester;