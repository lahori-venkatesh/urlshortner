#!/usr/bin/env node

/**
 * Test both default and custom domain functionality
 */

const https = require('https');
const { exec } = require('child_process');

async function testDomains() {
  console.log('🧪 Testing Domain Functionality\n');
  
  // Test 1: Check DNS resolution
  console.log('1. 🌐 Testing DNS Resolution...');
  try {
    await execCommand('nslookup links.pdfcircle.com');
    console.log('✅ Custom domain resolves');
  } catch (error) {
    console.log('❌ Custom domain DNS issue:', error.message);
  }
  
  // Test 2: Check worker directly
  console.log('\n2. 🔧 Testing Worker Direct Access...');
  try {
    const response = await makeRequest('https://pebly.lahorivenkatesh709.workers.dev/');
    console.log(`✅ Worker responds: ${response.status}`);
  } catch (error) {
    console.log('❌ Worker error:', error.message);
  }
  
  // Test 3: Test backend direct
  console.log('\n3. 🖥️  Testing Backend Direct...');
  try {
    const response = await makeRequest('https://urlshortner-1-hpyu.onrender.com/actuator/health');
    console.log(`✅ Backend health: ${response.status}`);
  } catch (error) {
    console.log('❌ Backend error:', error.message);
  }
  
  // Test 4: Test default domain
  console.log('\n4. 🏠 Testing Default Domain...');
  try {
    const response = await makeRequest('https://pebly.vercel.app/');
    console.log(`Default domain status: ${response.status}`);
    console.log(`Content type: ${response.headers['content-type']}`);
  } catch (error) {
    console.log('❌ Default domain error:', error.message);
  }
  
  console.log('\n📋 Recommendations:');
  console.log('1. For custom domain: Check DNS propagation (may take up to 24 hours)');
  console.log('2. For default domain: Redeploy frontend with updated vercel.json');
  console.log('3. Create a new test short link and try both domains');
}

function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        console.log(stdout.trim());
        resolve(stdout.trim());
      }
    });
  });
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
        'User-Agent': 'DomainTester/1.0'
      }
    };

    const req = https.request(options, (res) => {
      resolve({
        status: res.statusCode,
        headers: res.headers
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

testDomains().catch(console.error);