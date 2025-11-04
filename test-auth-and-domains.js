// Test script to verify authentication and domains API
const API_BASE_URL = 'https://urlshortner-1-hpyu.onrender.com/api';

async function testAuthAndDomains() {
    console.log('=== Authentication and Domains Test ===');
    
    // Instructions for getting token from browser
    console.log('\n📋 Instructions:');
    console.log('1. Open your browser and go to the app');
    console.log('2. Log in to your account');
    console.log('3. Open Developer Tools (F12)');
    console.log('4. Go to Application/Storage > Local Storage');
    console.log('5. Find the "token" key and copy its value');
    console.log('6. Replace YOUR_TOKEN_HERE in this script with your actual token');
    console.log('7. Run: node test-auth-and-domains.js');
    
    // Replace this with your actual token from localStorage
    const token = 'YOUR_TOKEN_HERE';
    
    if (token === 'YOUR_TOKEN_HERE') {
        console.log('\n❌ Please replace YOUR_TOKEN_HERE with your actual token from localStorage');
        return;
    }
    
    console.log('\n🔍 Testing with token:', token.substring(0, 20) + '...');
    
    try {
        // Test 1: Health check
        console.log('\n1. Testing API health...');
        const healthResponse = await fetch(`${API_BASE_URL}/v1/domains/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData);
        
        // Test 2: Domains endpoint with auth
        console.log('\n2. Testing domains endpoint with authentication...');
        const domainsResponse = await fetch(`${API_BASE_URL}/v1/domains/my`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        console.log('Response status:', domainsResponse.status);
        console.log('Response headers:', Object.fromEntries(domainsResponse.headers.entries()));
        
        const domainsData = await domainsResponse.json();
        console.log('Response data:', domainsData);
        
        if (domainsResponse.ok && domainsData.success) {
            console.log('✅ Domains API working correctly!');
            console.log(`Found ${domainsData.domains?.length || 0} domains for user ${domainsData.userId}`);
            
            if (domainsData.domains && domainsData.domains.length > 0) {
                console.log('Domains:', domainsData.domains.map(d => ({
                    name: d.domainName,
                    status: d.status,
                    created: d.createdAt
                })));
            }
        } else {
            console.log('❌ Domains API failed:', domainsData.message);
            
            if (domainsResponse.status === 401) {
                console.log('🔍 Authentication issue - token may be expired or invalid');
            } else if (domainsResponse.status === 403) {
                console.log('🔍 Permission issue - user may not have access to custom domains');
            }
        }
        
        // Test 3: Try to add a test domain (if user has access)
        if (domainsResponse.ok && domainsData.success) {
            console.log('\n3. Testing domain creation...');
            const testDomain = `test-${Date.now()}.example.com`;
            
            const addResponse = await fetch(`${API_BASE_URL}/v1/domains`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    domainName: testDomain,
                    ownerType: 'USER'
                })
            });
            
            const addData = await addResponse.json();
            console.log('Add domain response:', addResponse.status, addData);
            
            if (addResponse.ok && addData.success) {
                console.log('✅ Domain creation working!');
                console.log('Created domain:', addData.domain);
            } else {
                console.log('❌ Domain creation failed:', addData.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testAuthAndDomains().catch(console.error);