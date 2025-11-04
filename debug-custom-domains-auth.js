// Debug script to test custom domains API with authentication
const API_BASE_URL = 'https://urlshortner-1-hpyu.onrender.com/api';

async function testCustomDomainsAPI() {
    console.log('=== Custom Domains API Debug Test ===');
    
    // First, test if the API is reachable
    console.log('\n1. Testing API health...');
    try {
        const healthResponse = await fetch(`${API_BASE_URL}/v1/domains/health`);
        const healthData = await healthResponse.json();
        console.log('✅ API Health:', healthData);
    } catch (error) {
        console.error('❌ API Health failed:', error.message);
        return;
    }
    
    // Test authentication endpoint
    console.log('\n2. Testing auth heartbeat...');
    try {
        const authResponse = await fetch(`${API_BASE_URL}/v1/auth/heartbeat`);
        const authData = await authResponse.json();
        console.log('✅ Auth heartbeat:', authData);
    } catch (error) {
        console.error('❌ Auth heartbeat failed:', error.message);
    }
    
    // Test domains endpoint without auth (should fail with 401)
    console.log('\n3. Testing domains endpoint without auth...');
    try {
        const domainsResponse = await fetch(`${API_BASE_URL}/v1/domains/my`);
        const domainsData = await domainsResponse.json();
        console.log('Response status:', domainsResponse.status);
        console.log('Response data:', domainsData);
        
        if (domainsResponse.status === 401) {
            console.log('✅ Expected 401 - authentication required');
        } else {
            console.log('⚠️ Unexpected response - should require auth');
        }
    } catch (error) {
        console.error('❌ Domains test failed:', error.message);
    }
    
    // Instructions for manual testing with auth
    console.log('\n4. Manual testing instructions:');
    console.log('To test with authentication:');
    console.log('1. Open browser dev tools');
    console.log('2. Go to Application/Storage > Local Storage');
    console.log('3. Find the "token" key and copy its value');
    console.log('4. Run this command in console:');
    console.log(`
fetch('${API_BASE_URL}/v1/domains/my', {
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
    }
}).then(r => r.json()).then(console.log);
    `);
    
    // Test CORS
    console.log('\n5. Testing CORS...');
    try {
        const corsResponse = await fetch(`${API_BASE_URL}/v1/domains/health`, {
            method: 'OPTIONS'
        });
        console.log('CORS preflight status:', corsResponse.status);
        console.log('CORS headers:', Object.fromEntries(corsResponse.headers.entries()));
    } catch (error) {
        console.error('❌ CORS test failed:', error.message);
    }
}

// Run the test
testCustomDomainsAPI().catch(console.error);