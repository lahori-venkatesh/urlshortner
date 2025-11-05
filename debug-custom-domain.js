#!/usr/bin/env node

/**
 * Debug custom domain setup
 */

const { exec } = require('child_process');
const https = require('https');

async function debugCustomDomain() {
  console.log('🔍 Debugging Custom Domain Setup\n');
  
  const domain = 'links.pdfcircle.com';
  const workerUrl = 'pebly.lahorivenkatesh709.workers.dev';
  const testCode = '8X7Bx1';
  
  console.log(`Domain: ${domain}`);
  console.log(`Worker: ${workerUrl}`);
  console.log(`Test Code: ${testCode}\n`);
  
  // 1. Check DNS
  console.log('1. 🌐 Checking DNS Configuration...');
  try {
    await execCommand(`dig ${domain} CNAME +short`);
  } catch (error) {
    console.log('❌ DNS check failed:', error.message);
  }
  
  // 2. Test Worker Health
  console.log('\n2. 🔧 Testing Worker...');
  try {
    const workerResponse = await makeRequest(`https://${workerUrl}/health`);
    console.log(`✅ Worker Health: ${workerResponse.status}`);
  } catch (error) {
    console.log('❌ Worker test failed:', error.message);
  }
  
  // 3. Test Backend Direct
  console.log('\n3. 🖥️  Testing Backend Direct...');
  try {
    const backendResponse = await makeRequest(`https://urlshortner-1-hpyu.onrender.com/${testCode}`);
    console.log(`Backend Response: ${backendResponse.status}`);
    if (backendResponse.headers.location) {
      console.log(`Redirect Location: ${backendResponse.headers.location}`);
    }
  } catch (error) {
    console.log('❌ Backend test failed:', error.message);
  }
  
  // 4. Test Through Proxy
  console.log('\n4. 🔄 Testing Through Proxy...');
  try {
    const proxyResponse = await makeRequest(`https://${workerUrl}/${testCode}`, {
      'Host': domain
    });
    console.log(`Proxy Response: ${proxyResponse.status}`);
    if (proxyResponse.headers.location) {
      console.log(`Redirect Location: ${proxyResponse.headers.location}`);
    }
  } catch (error) {
    console.log('❌ Proxy test failed:', error.message);
  }
  
  console.log('\n📋 Troubleshooting Steps:');
  console.log('1. Verify DNS: dig links.pdfcircle.com CNAME');
  console.log('2. Check if short code exists in your database');
  console.log('3. Create a new test link with custom domain');
  console.log('4. Wait 5-10 minutes for DNS propagation');
  console.log('5. Test the new link');
}

function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        console.log(stdout.trim() || 'No output');
        resolve(stdout.trim());
      }
    });
  });
}

function makeRequest(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'DebugTool/1.0',
        ...headers
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

debugCustomDomain().catch(console.error);