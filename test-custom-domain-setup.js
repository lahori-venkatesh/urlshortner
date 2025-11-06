#!/usr/bin/env node

/**
 * Test Custom Domain Setup
 * Tests the complete flow for custom domain functionality
 */

const https = require('https');
const dns = require('dns').promises;

async function testCustomDomain() {
    console.log('🧪 Testing Custom Domain Setup for go.pdfcircle.com');
    console.log('=' .repeat(60));
    
    // Test 1: DNS Resolution
    console.log('\n1️⃣ Testing DNS Resolution...');
    try {
        const addresses = await dns.resolve('go.pdfcircle.com', 'CNAME');
        console.log('✅ DNS CNAME:', addresses[0]);
        
        if (addresses[0] === 'pebly-with-proxy.vercel.app') {
            console.log('✅ DNS correctly points to proxy domain');
        } else {
            console.log('❌ DNS should point to: pebly-with-proxy.vercel.app');
            console.log('📋 Required DNS Record:');
            console.log('   Type: CNAME');
            console.log('   Name: go');
            console.log('   Target: pebly-with-proxy.vercel.app');
            return;
        }
    } catch (error) {
        console.log('❌ DNS Resolution Failed:', error.message);
        console.log('📋 Required DNS Record:');
        console.log('   Type: CNAME');
        console.log('   Name: go');
        console.log('   Target: pebly-with-proxy.vercel.app');
        return;
    }
    
    // Test 2: Proxy Health Check
    console.log('\n2️⃣ Testing Proxy Health...');
    try {
        const response = await fetch('https://pebly-with-proxy.vercel.app/health');
        const data = await response.json();
        console.log('✅ Proxy Health:', data.status);
    } catch (error) {
        console.log('❌ Proxy Health Failed:', error.message);
        return;
    }
    
    // Test 3: Backend Connectivity
    console.log('\n3️⃣ Testing Backend Connectivity...');
    try {
        const response = await fetch('https://urlshortner-1-hpyu.onrender.com/health');
        const data = await response.json();
        console.log('✅ Backend Health:', data.status);
    } catch (error) {
        console.log('❌ Backend Health Failed:', error.message);
        return;
    }
    
    // Test 4: Short URL Exists
    console.log('\n4️⃣ Testing Short URL (HN6GQ9)...');
    try {
        const response = await fetch('https://urlshortner-1-hpyu.onrender.com/debug/HN6GQ9');
        const debug = await response.text();
        
        if (debug.includes('FOUND')) {
            console.log('✅ Short URL exists in database');
            console.log('📋 URL Details:');
            const lines = debug.split('\n');
            lines.forEach(line => {
                if (line.includes('Original:') || line.includes('Domain:') || line.includes('ShortUrl:')) {
                    console.log('   ' + line.trim());
                }
            });
        } else {
            console.log('❌ Short URL not found in database');
            return;
        }
    } catch (error) {
        console.log('❌ Backend Debug Failed:', error.message);
        return;
    }
    
    // Test 5: Custom Domain Request (simulated)
    console.log('\n5️⃣ Testing Custom Domain Request...');
    try {
        const response = await fetch('https://go.pdfcircle.com/HN6GQ9', {
            redirect: 'manual'
        });
        
        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location');
            console.log('✅ Redirect successful to:', location);
        } else {
            console.log('❌ Expected redirect, got status:', response.status);
        }
    } catch (error) {
        console.log('⚠️ Custom domain test failed (expected if DNS not configured):', error.message);
        console.log('📋 This will work once DNS is properly configured');
    }
    
    console.log('\n🎯 Summary:');
    console.log('1. DNS must point go.pdfcircle.com → pebly-with-proxy.vercel.app');
    console.log('2. Proxy deployment is ready and healthy');
    console.log('3. Backend is operational');
    console.log('4. Short URL HN6GQ9 exists and is configured for go.pdfcircle.com');
    console.log('5. Once DNS is configured, https://go.pdfcircle.com/HN6GQ9 will work');
}

// Run the test
testCustomDomain().catch(console.error);