#!/usr/bin/env node

/**
 * Complete Custom Domain Flow Debugger
 * Tests: Custom Domain → Proxy → Backend → Original URL
 */

const https = require('https');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class CustomDomainFlowDebugger {
  constructor() {
    this.customDomain = 'go.pdfcircle.com';
    this.shortCode = 'GkEJ91';
    this.proxyDomain = 'pebly.lahorivenkatesh709.workers.dev';
    this.backendUrl = 'https://urlshortner-1-hpyu.onrender.com';
    this.customUrl = `https://${this.customDomain}/${this.shortCode}`;
  }

  async debugCompleteFlow() {
    console.log('🔍 Custom Domain Flow Debugger');
    console.log('==============================\n');
    
    console.log(`Testing URL: ${this.customUrl}`);
    console.log(`Expected flow: ${this.customDomain} → ${this.proxyDomain} → backend → original URL\n`);

    // Step 1: DNS Resolution Tests
    await this.testDNSResolution();
    
    // Step 2: Proxy Worker Tests
    await this.testProxyWorker();
    
    // Step 3: Backend Tests
    await this.testBackend();
    
    // Step 4: Complete Flow Test
    await this.testCompleteFlow();
    
    // Step 5: Recommendations
    this.provideRecommendations();
  }

  async testDNSResolution() {
    console.log('1️⃣ DNS Resolution Tests');
    console.log('=======================');
    
    try {
      // Test with different DNS servers
      const dnsServers = ['8.8.8.8', '1.1.1.1', '208.67.222.222'];
      
      for (const server of dnsServers) {
        try {
          const { stdout } = await execAsync(`dig @${server} ${this.customDomain} CNAME +short`);
          const result = stdout.trim();
          console.log(`   ${server}: ${result || 'No CNAME record'}`);
        } catch (error) {
          console.log(`   ${server}: Error - ${error.message}`);
        }
      }
      
      // Test A record resolution
      try {
        const { stdout } = await execAsync(`dig @8.8.8.8 ${this.customDomain} A +short`);
        const ips = stdout.trim().split('\n').filter(ip => ip);
        console.log(`   A Records: ${ips.join(', ') || 'None'}`);
      } catch (error) {
        console.log(`   A Records: Error - ${error.message}`);
      }
      
    } catch (error) {
      console.log(`   DNS Test Error: ${error.message}`);
    }
    
    console.log('');
  }

  async testProxyWorker() {
    console.log('2️⃣ Proxy Worker Tests');
    console.log('=====================');
    
    // Test 1: Worker health
    try {
      const healthResponse = await this.makeRequest(`https://${this.proxyDomain}/health`);
      console.log(`   Health Check: ${healthResponse.status} - ${healthResponse.body}`);
    } catch (error) {
      console.log(`   Health Check: Error - ${error.message}`);
    }
    
    // Test 2: Worker debug
    try {
      const debugResponse = await this.makeRequest(`https://${this.proxyDomain}/debug`);
      console.log(`   Debug Endpoint: ${debugResponse.status}`);
      if (debugResponse.status === 200) {
        const debug = JSON.parse(debugResponse.body);
        console.log(`   Backend URL: ${debug.backendUrl}`);
        console.log(`   Proxy Version: ${debug.proxyVersion}`);
      }
    } catch (error) {
      console.log(`   Debug Endpoint: Error - ${error.message}`);
    }
    
    // Test 3: Worker with custom host header
    try {
      const customHostResponse = await this.makeRequest(
        `https://${this.proxyDomain}/${this.shortCode}`,
        { 'Host': this.customDomain },
        false
      );
      console.log(`   Custom Host Header: ${customHostResponse.status}`);
      if (customHostResponse.headers.location) {
        console.log(`   Redirect Location: ${customHostResponse.headers.location}`);
      }
    } catch (error) {
      console.log(`   Custom Host Header: Error - ${error.message}`);
    }
    
    console.log('');
  }

  async testBackend() {
    console.log('3️⃣ Backend Tests');
    console.log('================');
    
    // Test 1: Backend health
    try {
      const healthResponse = await this.makeRequest(`${this.backendUrl}/actuator/health`);
      console.log(`   Backend Health: ${healthResponse.status}`);
    } catch (error) {
      console.log(`   Backend Health: Error - ${error.message}`);
    }
    
    // Test 2: Direct backend access
    try {
      const directResponse = await this.makeRequest(
        `${this.backendUrl}/${this.shortCode}`,
        {},
        false
      );
      console.log(`   Direct Backend: ${directResponse.status}`);
      if (directResponse.headers.location) {
        console.log(`   Direct Redirect: ${directResponse.headers.location}`);
      }
    } catch (error) {
      console.log(`   Direct Backend: Error - ${error.message}`);
    }
    
    // Test 3: Backend with custom domain headers
    try {
      const customDomainResponse = await this.makeRequest(
        `${this.backendUrl}/${this.shortCode}`,
        {
          'X-Forwarded-Host': this.customDomain,
          'X-Original-Host': this.customDomain,
          'Host': new URL(this.backendUrl).hostname
        },
        false
      );
      console.log(`   Backend w/ Custom Headers: ${customDomainResponse.status}`);
      if (customDomainResponse.headers.location) {
        console.log(`   Custom Domain Redirect: ${customDomainResponse.headers.location}`);
      }
    } catch (error) {
      console.log(`   Backend w/ Custom Headers: Error - ${error.message}`);
    }
    
    // Test 4: Debug endpoint
    try {
      const debugResponse = await this.makeRequest(`${this.backendUrl}/debug/${this.shortCode}`);
      console.log(`   Backend Debug: ${debugResponse.status}`);
      if (debugResponse.body && debugResponse.body.length < 500) {
        console.log(`   Debug Info: ${debugResponse.body.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`   Backend Debug: Error - ${error.message}`);
    }
    
    console.log('');
  }

  async testCompleteFlow() {
    console.log('4️⃣ Complete Flow Test');
    console.log('=====================');
    
    // Test using the actual custom domain (if DNS works)
    try {
      console.log(`   Testing: ${this.customUrl}`);
      const response = await this.makeRequest(this.customUrl, {}, false);
      console.log(`   Status: ${response.status}`);
      
      if (response.status >= 300 && response.status < 400) {
        console.log(`   ✅ Redirect working: ${response.headers.location}`);
      } else if (response.status === 522) {
        console.log(`   ❌ Cloudflare 522 error - connection timeout`);
      } else if (response.status === 403) {
        console.log(`   ❌ Cloudflare 403 error - access denied`);
      } else {
        console.log(`   ⚠️ Unexpected status: ${response.status}`);
      }
      
    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        console.log(`   ❌ DNS Resolution Failed: ${this.customDomain} not found`);
        console.log(`   💡 This is the main issue - DNS record doesn't exist or hasn't propagated`);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`   ❌ Connection Refused: Server not responding`);
      } else if (error.code === 'ETIMEDOUT') {
        console.log(`   ❌ Connection Timeout: Server took too long to respond`);
      } else {
        console.log(`   ❌ Network Error: ${error.message}`);
      }
    }
    
    console.log('');
  }

  provideRecommendations() {
    console.log('5️⃣ Recommendations & Next Steps');
    console.log('===============================');
    
    console.log('Based on the test results above:');
    console.log('');
    
    console.log('🔧 **If DNS Resolution Failed:**');
    console.log('   1. Check Cloudflare DNS settings for pdfcircle.com');
    console.log('   2. Ensure CNAME record exists: go → pebly.lahorivenkatesh709.workers.dev');
    console.log('   3. Ensure Proxy Status is OFF (Gray Cloud)');
    console.log('   4. Wait 5-10 minutes for DNS propagation');
    console.log('');
    
    console.log('🔧 **If Worker Issues:**');
    console.log('   1. Check if worker is deployed correctly');
    console.log('   2. Verify environment variables are set');
    console.log('   3. Check Cloudflare Worker logs');
    console.log('');
    
    console.log('🔧 **If Backend Issues:**');
    console.log('   1. Verify backend is running and accessible');
    console.log('   2. Check database has correct cnameTarget');
    console.log('   3. Ensure URL exists in database');
    console.log('');
    
    console.log('🧪 **Manual Tests:**');
    console.log(`   1. Test worker directly: https://${this.proxyDomain}/health`);
    console.log(`   2. Test backend directly: ${this.backendUrl}/${this.shortCode}`);
    console.log(`   3. Check DNS: dig ${this.customDomain} CNAME +short`);
    console.log(`   4. Test custom domain: ${this.customUrl}`);
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
          'User-Agent': 'CustomDomainDebugger/1.0',
          ...headers
        },
        timeout: 10000
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
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }
}

// Run the debugger
const flowDebugger = new CustomDomainFlowDebugger();
flowDebugger.debugCompleteFlow().catch(console.error);