const API_URL = 'https://urlshortner-1-hpyu.onrender.com/api';

async function testBackendAuth() {
    console.log('=== Testing Backend Authentication ===\n');
    
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    try {
        // Test 1: Register a new user
        console.log('1. Testing user registration...');
        const registerResponse = await fetch(`${API_URL}/v1/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword,
                firstName: 'Test',
                lastName: 'User'
            })
        });
        
        const registerData = await registerResponse.json();
        console.log('Register Response:', JSON.stringify(registerData, null, 2));
        
        if (!registerData.success) {
            console.log('❌ Registration failed');
            return;
        }
        
        console.log('✅ Registration successful');
        
        // Test 2: Login with the same user
        console.log('\n2. Testing user login...');
        const loginResponse = await fetch(`${API_URL}/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword
            })
        });
        
        const loginData = await loginResponse.json();
        console.log('Login Response:', JSON.stringify(loginData, null, 2));
        
        if (!loginData.success || !loginData.token) {
            console.log('❌ Login failed or no token received');
            return;
        }
        
        console.log('✅ Login successful with token');
        
        // Test 3: Validate token
        console.log('\n3. Testing token validation...');
        const validateResponse = await fetch(`${API_URL}/v1/auth/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginData.token}`
            }
        });
        
        const validateData = await validateResponse.json();
        console.log('Validate Response:', JSON.stringify(validateData, null, 2));
        
        if (validateData.success) {
            console.log('✅ Token validation successful');
        } else {
            console.log('❌ Token validation failed');
        }
        
        // Test 4: Test protected endpoint
        console.log('\n4. Testing protected endpoint...');
        const protectedResponse = await fetch(`${API_URL}/v1/urls/user/${loginData.user.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${loginData.token}`
            }
        });
        
        console.log('Protected endpoint status:', protectedResponse.status);
        
        if (protectedResponse.status === 200) {
            const protectedData = await protectedResponse.json();
            console.log('✅ Protected endpoint accessible');
            console.log('Protected Response:', JSON.stringify(protectedData, null, 2));
        } else if (protectedResponse.status === 401) {
            console.log('❌ Protected endpoint returned 401 Unauthorized');
        } else {
            console.log('⚠️ Protected endpoint returned status:', protectedResponse.status);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
    
    console.log('\n=== Backend Authentication Test Complete ===');
}

// Run the test
testBackendAuth();