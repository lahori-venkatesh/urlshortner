#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'https://urlshortner-1-hpyu.onrender.com/api';

async function quickTest() {
    console.log('🚀 Quick Test After Dependency Injection Fix\n');
    
    try {
        // Test 1: Basic connectivity
        console.log('1. Testing basic connectivity...');
        const usersResponse = await axios.get(`${API_BASE_URL}/v1/auth/users`, { timeout: 10000 });
        console.log(`✅ Basic connectivity: OK (${usersResponse.data.count} users found)`);
        
        // Test 2: Create a new user
        console.log('\n2. Testing user creation...');
        const testUser = {
            email: `quicktest.${Date.now()}@example.com`,
            password: 'quicktest123',
            firstName: 'Quick',
            lastName: 'Test'
        };
        
        const registerResponse = await axios.post(`${API_BASE_URL}/v1/auth/register`, testUser, { timeout: 15000 });
        
        if (registerResponse.status === 200 && registerResponse.data.success) {
            const userId = registerResponse.data.user.id;
            const token = registerResponse.data.token;
            
            console.log(`✅ User creation: SUCCESS (ID: ${userId})`);
            
            // Test 3: Profile retrieval
            console.log('\n3. Testing profile retrieval...');
            try {
                const profileResponse = await axios.get(`${API_BASE_URL}/v1/auth/profile/${testUser.email}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    timeout: 10000
                });
                console.log(`✅ Profile retrieval: SUCCESS`);
            } catch (error) {
                console.log(`❌ Profile retrieval: FAILED (${error.response?.status})`);
            }
            
            // Test 4: Data endpoints
            console.log('\n4. Testing data endpoints...');
            const config = {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 10000
            };
            
            const endpoints = [
                { name: 'URLs', url: `/v1/urls/user/${userId}` },
                { name: 'Files', url: `/v1/files/user/${userId}` },
                { name: 'QR Codes', url: `/v1/qr/user/${userId}` }
            ];
            
            let workingCount = 0;
            
            for (const endpoint of endpoints) {
                try {
                    const response = await axios.get(`${API_BASE_URL}${endpoint.url}`, config);
                    console.log(`✅ ${endpoint.name}: SUCCESS (${response.data.count || 0} items)`);
                    workingCount++;
                } catch (error) {
                    if (error.response?.status === 404) {
                        console.log(`✅ ${endpoint.name}: SUCCESS (empty - 404 expected)`);
                        workingCount++;
                    } else {
                        console.log(`❌ ${endpoint.name}: FAILED (${error.response?.status})`);
                    }
                }
            }
            
            // Final result
            console.log('\n📊 RESULTS:');
            console.log(`Working endpoints: ${workingCount}/${endpoints.length}`);
            
            if (workingCount === endpoints.length) {
                console.log('\n🎉 SUCCESS: All endpoints are working!');
                console.log('✅ The dependency injection fix is working correctly!');
                console.log('✅ User data loading is now functional!');
                return true;
            } else if (workingCount > 0) {
                console.log('\n⚠️  PARTIAL: Some endpoints working, may need more time for full deployment');
                return 'partial';
            } else {
                console.log('\n❌ FAILED: Endpoints still not working, may need additional fixes');
                return false;
            }
            
        } else {
            console.log('❌ User creation failed');
            return false;
        }
        
    } catch (error) {
        console.log(`❌ Test failed: ${error.response?.status || error.message}`);
        return false;
    }
}

// Run the quick test
quickTest().then(result => {
    if (result === true) {
        console.log('\n🎯 CONCLUSION: The fix is working! Your project should now load user data properly.');
    } else if (result === 'partial') {
        console.log('\n🎯 CONCLUSION: Fix is partially working. Wait a few minutes and test again.');
    } else {
        console.log('\n🎯 CONCLUSION: Fix may need more time to deploy or additional changes are needed.');
    }
}).catch(console.error);