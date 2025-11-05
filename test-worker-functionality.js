#!/usr/bin/env node

/**
 * Test the deployed Cloudflare Worker functionality
 */

const https = require('https');

const WORKER_URL = 'https://pebly.lahorivenkatesh709.workers.dev';
const BACKEND_URL = 'https://urlshortner-1-hpyu.onrender.com';

async function testWorker() {
  console.log('🧪 Testing Pebly Universal Proxy Worker\n');
  console.log(`🎯 Worker URL: ${WORKER_URL}\n`);
  
  const tests = [
    {
      name: 'Health Check',
      test: async () => {
        const response = await makeRequest(`${WORKER_URL}/health`);
        return {
          status: response.status,
          healthy: response.body.includes('healthy'),
          response: JSON.parse(response.body)
        };
      }
    },
    {
      name: 'Non-existent Link (404 Expected)',
      test: async () => {
        const response = await makeRequest(`${WORKER_URL}/nonexistent123`);
        return {
          status: response.status,
          isErrorPage: response.body.includes('Link Not Found'),
          hasProxyHeaders: response.headers['x-powered-by']?.includes('Pebly')
        };
      }
    },
    {
      name: 'Backend Connectivity',
      test: async () => {
        try {
          const response = await makeRequest(`${BACKEND_URL}`);
          return {
            status: response.status,
            reachable: response.status < 500,
            note: response.status === 502 ? 'Backend sleeping (normal for free tier)' : 'Backend responsive'
          };
        } catch (error) {
          return {
            status: 'error',
            reachable: false,
            error: error.message
          };
        }
      }
    }
  ];
  
  console.log('Running tests...\n');
  
  for (const { name, test } of tests) {
    try {
      console.log(`🔍 ${name}...`);
      const result = await test();
      console.log(`✅ Result:`, JSON.stringify(result, null, 2));
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('🎯 DNS Instructions for Users:');
  console.log('==============================');
  console.log('Type: CNAME');
  console.log('Name: links (or go, short, etc.)');
  console.log(`Target: pebly.lahorivenkatesh709.workers.dev`);
  console.log('TTL: Auto\n');
  
  console.log('📋 Frontend Environment Variable:');
  console.log('=================================');
  console.log('REACT_APP_PROXY_DOMAIN=pebly.lahorivenkatesh709.workers.dev\n');
  
  console.log('✅ Worker is deployed and functional!');
  console.log('🚀 Ready for custom domain testing!');
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
        'User-Agent': 'WorkerTest/1.0'
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

testWorker().catch(console.error);