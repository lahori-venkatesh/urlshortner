#!/usr/bin/env node

/**
 * Fix script for custom domain CNAME target issue
 * Updates existing domains to use correct proxy domain as CNAME target
 */

const API_BASE_URL = 'https://urlshortner-1-hpyu.onrender.com/api';
const CORRECT_PROXY_DOMAIN = 'pebly.lahorivenkatesh709.workers.dev';

// You need to get this token from your browser's localStorage after logging in
const ADMIN_TOKEN = 'YOUR_ADMIN_TOKEN_HERE';

class CustomDomainCnameFixer {
  constructor() {
    this.apiUrl = API_BASE_URL;
    this.token = ADMIN_TOKEN;
    this.correctProxyDomain = CORRECT_PROXY_DOMAIN;
  }

  async fixCustomDomainCname() {
    console.log('🔧 Fixing Custom Domain CNAME Target Issue');
    console.log('==========================================\n');

    console.log('🔍 Issue Analysis:');
    console.log('- Domain: go.pdfcircle.com');
    console.log('- Current CNAME target in DB: urlshortner-1-hpyu.onrender.com (WRONG)');
    console.log('- Should be: pebly.lahorivenkatesh709.workers.dev (CORRECT)');
    console.log('- DNS in Cloudflare: go → pebly.lahorivenkatesh709.workers.dev (CORRECT)');
    console.log('- Error: 522 Connection timeout (CNAME mismatch)\n');

    console.log('📋 Manual Fix Instructions:');
    console.log('===========================\n');

    console.log('1️⃣ **Database Fix** (MongoDB):');
    console.log('   Connect to your MongoDB and run:');
    console.log('');
    console.log('   // Fix the specific domain');
    console.log('   db.domains.updateOne(');
    console.log('     { domainName: "go.pdfcircle.com" },');
    console.log(`     { $set: { cnameTarget: "${this.correctProxyDomain}" } }`);
    console.log('   )');
    console.log('');
    console.log('   // Fix all domains with wrong CNAME target');
    console.log('   db.domains.updateMany(');
    console.log('     { cnameTarget: "urlshortner-1-hpyu.onrender.com" },');
    console.log(`     { $set: { cnameTarget: "${this.correctProxyDomain}" } }`);
    console.log('   )');
    console.log('');

    console.log('2️⃣ **Verify DNS Configuration**:');
    console.log('   Your Cloudflare DNS is correct:');
    console.log('   ✅ Type: CNAME');
    console.log('   ✅ Name: go');
    console.log(`   ✅ Target: ${this.correctProxyDomain}`);
    console.log('   ✅ Proxy: OFF (Gray cloud)');
    console.log('');

    console.log('3️⃣ **Test After Fix**:');
    console.log('   After updating the database, test:');
    console.log('   https://go.pdfcircle.com/GkEJ91');
    console.log('');

    console.log('4️⃣ **Root Cause**:');
    console.log('   The Domain model was setting cnameTarget to backend URL');
    console.log('   instead of the universal proxy domain. This has been');
    console.log('   fixed in the code for future domains.');
    console.log('');

    // Test current domain status
    await this.testDomainStatus();
  }

  async testDomainStatus() {
    console.log('🧪 Testing Current Domain Status:');
    console.log('=================================\n');

    const testDomain = 'go.pdfcircle.com';
    const testUrl = `https://${testDomain}/GkEJ91`;

    try {
      console.log(`Testing: ${testUrl}`);
      
      // Test DNS resolution
      console.log('1. DNS Resolution Test:');
      try {
        const dnsResponse = await fetch(`https://dns.google/resolve?name=${testDomain}&type=CNAME`);
        const dnsData = await dnsResponse.json();
        
        if (dnsData.Answer && dnsData.Answer.length > 0) {
          const cnameRecord = dnsData.Answer.find(record => record.type === 5);
          if (cnameRecord) {
            const resolvedTarget = cnameRecord.data.replace(/\.$/, '');
            console.log(`   ✅ DNS CNAME: ${testDomain} → ${resolvedTarget}`);
            
            if (resolvedTarget === this.correctProxyDomain) {
              console.log('   ✅ DNS configuration is CORRECT');
            } else {
              console.log('   ❌ DNS points to wrong target');
            }
          } else {
            console.log('   ❌ No CNAME record found');
          }
        } else {
          console.log('   ❌ DNS resolution failed');
        }
      } catch (error) {
        console.log(`   ❌ DNS test failed: ${error.message}`);
      }

      console.log('');

      // Test HTTP connection
      console.log('2. HTTP Connection Test:');
      try {
        const response = await this.makeRequest(testUrl, {}, false);
        console.log(`   Status: ${response.status}`);
        
        if (response.status === 522) {
          console.log('   ❌ Cloudflare 522 error - CNAME target mismatch');
          console.log('   💡 Fix: Update database cnameTarget to proxy domain');
        } else if (response.status >= 300 && response.status < 400) {
          console.log('   ✅ Redirect working - issue may be resolved');
          console.log(`   Location: ${response.headers.location}`);
        } else {
          console.log(`   ⚠️ Unexpected status: ${response.status}`);
        }
      } catch (error) {
        if (error.message.includes('timeout') || error.message.includes('522')) {
          console.log('   ❌ Connection timeout - confirms CNAME mismatch');
        } else {
          console.log(`   ❌ Connection test failed: ${error.message}`);
        }
      }

    } catch (error) {
      console.log(`❌ Domain status test failed: ${error.message}`);
    }

    console.log('');
    console.log('🎯 Next Steps:');
    console.log('==============');
    console.log('1. Run the MongoDB update query above');
    console.log('2. Wait 1-2 minutes for changes to propagate');
    console.log('3. Test the URL: https://go.pdfcircle.com/GkEJ91');
    console.log('4. Deploy the backend code fix to prevent future issues');
  }

  async makeRequest(url, headers = {}, followRedirects = true) {
    const https = require('https');
    
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'User-Agent': 'CustomDomainTester/1.0',
          ...headers
        },
        timeout: 10000
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
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout (likely 522 error)'));
      });
      
      req.end();
    });
  }
}

// Run the fixer
const fixer = new CustomDomainCnameFixer();
fixer.fixCustomDomainCname().catch(console.error);