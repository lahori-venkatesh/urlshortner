const API_URL = 'https://urlshortner-1-hpyu.onrender.com/api';

async function testTokenValidation() {
    console.log('=== Testing Token Validation ===\n');
    
    try {
        // Step 1: Login to get a valid token
        console.log('1. Getting a valid token...');
        const loginResponse = await fetch(`${API_URL}/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test1761899495407@example.com',
                password: 'testpassword123'
            })
        });
        
        const loginData = await loginResponse.json();
        
        if (!loginData.success || !loginData.token) {
            console.log('❌ Failed to get token');
            return;
        }
        
        console.log('✅ Got token:', loginData.token.substring(0, 20) + '...');
        
        // Step 2: Validate the token
        console.log('\n2. Validating token...');
        const validateResponse = await fetch(`${API_URL}/v1/auth/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginData.token}`
            }
        });
        
        const validateData = await validateResponse.json();
        console.log('Validate Status:', validateResponse.status);
        console.log('Validate Success:', validateData.success);
        
        if (validateData.success) {
            console.log('✅ Token validation successful');
            console.log('User ID:', validateData.user.id);
            console.log('User Email:', validateData.user.email);
        } else {
            console.log('❌ Token validation failed:', validateData.message);
        }
        
        // Step 3: Test URL creation
        console.log('\n3. Testing URL creation...');
        const urlResponse = await fetch(`${API_URL}/v1/urls`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginData.token}`
            },
            body: JSON.stringify({
                originalUrl: 'https://example.com',
                userId: loginData.user.id,
                title: 'Test URL'
            })
        });
        
        console.log('URL Creation Status:', urlResponse.status);
        const urlData = await urlResponse.json();
        console.log('URL Creation Response:', JSON.stringify(urlData, null, 2));
        
        // Step 4: Test getting user URLs
        console.log('\n4. Testing get user URLs...');
        const getUserUrlsResponse = await fetch(`${API_URL}/v1/urls/user/${loginData.user.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${loginData.token}`
            }
        });
        
        console.log('Get User URLs Status:', getUserUrlsResponse.status);
        const userUrlsData = await getUserUrlsResponse.json();
        console.log('User URLs Response:', JSON.stringify(userUrlsData, null, 2));
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
    
    console.log('\n=== Token Validation Test Complete ===');
}

testTokenValidation();