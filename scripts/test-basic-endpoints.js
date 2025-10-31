const API_URL = 'https://urlshortner-1-hpyu.onrender.com/api';

async function testBasicEndpoints() {
    console.log('=== Testing Basic Endpoints (No Auth) ===\n');
    
    try {
        // Test 1: Check if basic auth endpoints work
        console.log('1. Testing basic auth endpoints...');
        
        // Test registration (should work without JWT)
        const testEmail = `test${Date.now()}@example.com`;
        const registerResponse = await fetch(`${API_URL}/v1/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: testEmail,
                password: 'testpassword123',
                firstName: 'Test',
                lastName: 'User'
            })
        });
        
        console.log('Register Status:', registerResponse.status);
        let registerData = null;
        if (registerResponse.status === 200) {
            registerData = await registerResponse.json();
            console.log('✅ Registration works');
            console.log('Has Token:', !!registerData.token);
        } else {
            console.log('❌ Registration failed');
        }
        
        // Test 2: Check if the server is responding to basic requests
        console.log('\n2. Testing server health...');
        const healthResponse = await fetch(`${API_URL}/`, {
            method: 'GET'
        });
        
        console.log('Health Status:', healthResponse.status);
        if (healthResponse.status === 200) {
            console.log('✅ Server is responding');
        } else {
            console.log('❌ Server health check failed');
        }
        
        // Test 3: Check if protected endpoints return proper error codes
        console.log('\n3. Testing protected endpoints without auth...');
        const protectedResponse = await fetch(`${API_URL}/v1/urls`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                originalUrl: 'https://example.com',
                userId: 'test-user'
            })
        });
        
        console.log('Protected Endpoint Status:', protectedResponse.status);
        if (protectedResponse.status === 401 || protectedResponse.status === 403) {
            console.log('✅ Protected endpoints properly secured');
        } else if (protectedResponse.status === 500) {
            console.log('❌ Protected endpoints returning 500 errors');
            const errorData = await protectedResponse.json().catch(() => ({}));
            console.log('Error details:', errorData);
        } else {
            console.log('⚠️ Unexpected status for protected endpoint');
        }
        
        // Test 4: Test with a valid token from registration
        if (registerData && registerData.token) {
            console.log('\n4. Testing with valid token...');
            
            if (registerData.token) {
                const authResponse = await fetch(`${API_URL}/v1/urls`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${registerData.token}`
                    },
                    body: JSON.stringify({
                        originalUrl: 'https://example.com/test-' + Date.now(),
                        userId: registerData.user.id,
                        title: 'Test URL'
                    })
                });
                
                console.log('Authenticated Request Status:', authResponse.status);
                if (authResponse.status === 200) {
                    const urlData = await authResponse.json();
                    console.log('✅ Authenticated requests work');
                    console.log('Created URL:', urlData.data?.shortUrl);
                } else {
                    console.log('❌ Authenticated requests failing');
                    const errorData = await authResponse.json().catch(() => ({}));
                    console.log('Error details:', errorData);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
    
    console.log('\n=== Basic Endpoints Test Complete ===');
}

testBasicEndpoints();