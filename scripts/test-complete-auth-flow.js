const API_URL = 'https://urlshortner-1-hpyu.onrender.com/api';

async function testCompleteAuthFlow() {
    console.log('=== Testing Complete Authentication Flow ===\n');
    
    let authToken = '';
    let userId = '';
    
    try {
        // Step 1: Register or Login
        console.log('1. Testing user login...');
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
        
        if (loginData.success && loginData.token) {
            authToken = loginData.token;
            userId = loginData.user.id;
            console.log('✅ Login successful');
            console.log('User ID:', userId);
            console.log('Token:', authToken.substring(0, 20) + '...');
        } else {
            console.log('❌ Login failed:', loginData.message);
            return;
        }
        
        // Step 2: Test Token Validation
        console.log('\n2. Testing token validation...');
        const validateResponse = await fetch(`${API_URL}/v1/auth/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        console.log('Validate Status:', validateResponse.status);
        if (validateResponse.status === 200) {
            const validateData = await validateResponse.json();
            if (validateData.success) {
                console.log('✅ Token validation successful');
            } else {
                console.log('❌ Token validation failed:', validateData.message);
            }
        } else {
            console.log('⚠️ Token validation endpoint returned:', validateResponse.status);
        }
        
        // Step 3: Test URL Creation
        console.log('\n3. Testing URL creation...');
        const urlResponse = await fetch(`${API_URL}/v1/urls`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                originalUrl: 'https://example.com/test-' + Date.now(),
                userId: userId,
                title: 'Test URL from Script',
                description: 'Created via test script'
            })
        });
        
        console.log('URL Creation Status:', urlResponse.status);
        if (urlResponse.status === 200) {
            const urlData = await urlResponse.json();
            if (urlData.success) {
                console.log('✅ URL creation successful');
                console.log('Short URL:', urlData.data.shortUrl);
                console.log('Short Code:', urlData.data.shortCode);
            } else {
                console.log('❌ URL creation failed:', urlData.message);
            }
        } else {
            const errorData = await urlResponse.json().catch(() => ({}));
            console.log('❌ URL creation failed with status:', urlResponse.status);
            console.log('Error:', errorData);
        }
        
        // Step 4: Test Get User URLs
        console.log('\n4. Testing get user URLs...');
        const getUserUrlsResponse = await fetch(`${API_URL}/v1/urls/user/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        console.log('Get User URLs Status:', getUserUrlsResponse.status);
        if (getUserUrlsResponse.status === 200) {
            const userUrlsData = await getUserUrlsResponse.json();
            if (userUrlsData.success) {
                console.log('✅ Get user URLs successful');
                console.log('Total URLs:', userUrlsData.data ? userUrlsData.data.length : 0);
                if (userUrlsData.data && userUrlsData.data.length > 0) {
                    console.log('Latest URL:', userUrlsData.data[0].shortUrl);
                }
            } else {
                console.log('❌ Get user URLs failed:', userUrlsData.message);
            }
        } else {
            const errorData = await getUserUrlsResponse.json().catch(() => ({}));
            console.log('❌ Get user URLs failed with status:', getUserUrlsResponse.status);
            console.log('Error:', errorData);
        }
        
        // Step 5: Test QR Code Creation
        console.log('\n5. Testing QR code creation...');
        const qrResponse = await fetch(`${API_URL}/v1/qr`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                content: 'https://example.com/qr-test-' + Date.now(),
                contentType: 'TEXT',
                userId: userId,
                title: 'Test QR Code',
                description: 'Created via test script',
                foregroundColor: '#000000',
                backgroundColor: '#FFFFFF',
                size: 200
            })
        });
        
        console.log('QR Creation Status:', qrResponse.status);
        if (qrResponse.status === 200) {
            const qrData = await qrResponse.json();
            if (qrData.success) {
                console.log('✅ QR code creation successful');
                console.log('QR Code ID:', qrData.data.id);
            } else {
                console.log('❌ QR code creation failed:', qrData.message);
            }
        } else {
            const errorData = await qrResponse.json().catch(() => ({}));
            console.log('❌ QR code creation failed with status:', qrResponse.status);
            console.log('Error:', errorData);
        }
        
        // Step 6: Test Get User QR Codes
        console.log('\n6. Testing get user QR codes...');
        const getUserQRResponse = await fetch(`${API_URL}/v1/qr/user/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        console.log('Get User QR Codes Status:', getUserQRResponse.status);
        if (getUserQRResponse.status === 200) {
            const userQRData = await getUserQRResponse.json();
            if (userQRData.success) {
                console.log('✅ Get user QR codes successful');
                console.log('Total QR Codes:', userQRData.data ? userQRData.data.length : 0);
            } else {
                console.log('❌ Get user QR codes failed:', userQRData.message);
            }
        } else {
            const errorData = await getUserQRResponse.json().catch(() => ({}));
            console.log('❌ Get user QR codes failed with status:', getUserQRResponse.status);
            console.log('Error:', errorData);
        }
        
    } catch (error) {
        console.error('❌ Test error:', error.message);
    }
    
    console.log('\n=== Complete Authentication Flow Test Complete ===');
}

testCompleteAuthFlow();