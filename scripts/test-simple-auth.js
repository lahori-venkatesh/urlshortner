const API_URL = 'https://urlshortner-1-hpyu.onrender.com/api';

async function testSimpleAuth() {
    console.log('=== Testing Simple Authentication ===\n');
    
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
        console.log('Register Status:', registerResponse.status);
        console.log('Register Success:', registerData.success);
        console.log('Has Token:', !!registerData.token);
        
        if (!registerData.success) {
            console.log('❌ Registration failed:', registerData.message);
            return;
        }
        
        console.log('✅ Registration successful with token');
        
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
        console.log('Login Status:', loginResponse.status);
        console.log('Login Success:', loginData.success);
        console.log('Has Token:', !!loginData.token);
        
        if (loginData.success && loginData.token) {
            console.log('✅ Login successful with token');
            console.log('User ID:', loginData.user.id);
            console.log('User Email:', loginData.user.email);
            
            // Test 3: Try to access a simple endpoint (not validate)
            console.log('\n3. Testing basic API access...');
            const usersResponse = await fetch(`${API_URL}/v1/auth/users`, {
                method: 'GET'
            });
            
            console.log('Users endpoint status:', usersResponse.status);
            
            if (usersResponse.status === 200) {
                const usersData = await usersResponse.json();
                console.log('✅ Users endpoint accessible');
                console.log('Total users:', usersData.count);
            } else {
                console.log('⚠️ Users endpoint returned status:', usersResponse.status);
            }
            
        } else {
            console.log('❌ Login failed:', loginData.message);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
    
    console.log('\n=== Simple Authentication Test Complete ===');
}

// Run the test
testSimpleAuth();