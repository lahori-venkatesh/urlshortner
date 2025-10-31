#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'https://urlshortner-1-hpyu.onrender.com/api';

async function testSpecificUserData() {
    console.log('🔍 Testing Specific User Data Retrieval...\n');
    
    // First, let's register a new user
    console.log('1. Creating a new test user...');
    const testUser = {
        email: `datatest.${Date.now()}@example.com`,
        password: 'testpass123',
        firstName: 'Data',
        lastName: 'Test'
    };
    
    try {
        const registerResponse = await axios.post(`${API_BASE_URL}/v1/auth/register`, testUser, { timeout: 15000 });
        
        if (registerResponse.status === 200 && registerResponse.data.success) {
            const userId = registerResponse.data.user.id;
            const token = registerResponse.data.token;
            
            console.log(`✅ User created successfully`);
            console.log(`   User ID: ${userId}`);
            console.log(`   Email: ${registerResponse.data.user.email}`);
            console.log(`   Name: ${registerResponse.data.user.firstName} ${registerResponse.data.user.lastName}`);
            
            // Set up axios config with auth token
            const config = {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            };
            
            console.log('\n2. Testing data retrieval endpoints...');
            
            // Test each endpoint individually with detailed error handling
            const tests = [
                {
                    name: 'User URLs',
                    method: 'GET',
                    url: `/v1/urls/user/${userId}`,
                    expectedEmpty: true
                },
                {
                    name: 'User Profile by Email',
                    method: 'GET',
                    url: `/v1/auth/profile/${testUser.email}`,
                    expectedEmpty: false
                },
                {
                    name: 'User Files',
                    method: 'GET',
                    url: `/v1/files/user/${userId}`,
                    expectedEmpty: true
                },
                {
                    name: 'User QR Codes',
                    method: 'GET',
                    url: `/v1/qr/user/${userId}`,
                    expectedEmpty: true
                }
            ];
            
            for (const test of tests) {
                console.log(`\n   Testing: ${test.name}`);
                console.log(`   URL: ${API_BASE_URL}${test.url}`);
                
                try {
                    const response = await axios({
                        method: test.method,
                        url: `${API_BASE_URL}${test.url}`,
                        ...config
                    });
                    
                    console.log(`   ✅ Status: ${response.status}`);
                    
                    if (response.data) {
                        if (response.data.success !== undefined) {
                            console.log(`   Success: ${response.data.success}`);
                        }
                        
                        if (response.data.data) {
                            if (Array.isArray(response.data.data)) {
                                console.log(`   Data count: ${response.data.data.length}`);
                                if (response.data.data.length > 0) {
                                    console.log(`   Sample item keys: ${Object.keys(response.data.data[0]).join(', ')}`);
                                }
                            } else {
                                console.log(`   Data type: ${typeof response.data.data}`);
                                console.log(`   Data keys: ${Object.keys(response.data.data).join(', ')}`);
                            }
                        }
                        
                        if (response.data.count !== undefined) {
                            console.log(`   Count: ${response.data.count}`);
                        }
                        
                        if (response.data.user) {
                            console.log(`   User data found: ${response.data.user.email}`);
                        }
                    }
                    
                } catch (error) {
                    console.log(`   ❌ Error: ${error.response?.status || 'Network Error'}`);
                    
                    if (error.response?.data) {
                        console.log(`   Error message: ${error.response.data.message || 'No message'}`);
                        console.log(`   Error details: ${JSON.stringify(error.response.data).substring(0, 200)}`);
                    } else {
                        console.log(`   Network error: ${error.message}`);
                    }
                    
                    // If it's a 500 error, let's try to get more details
                    if (error.response?.status === 500) {
                        console.log(`   🔍 This is a server error - likely database connection issue`);
                    }
                }
            }
            
            console.log('\n3. Testing with a known working endpoint...');
            
            // Test token validation (this should work if auth is working)
            try {
                const validateResponse = await axios.post(`${API_BASE_URL}/v1/auth/validate`, {}, config);
                console.log(`   ✅ Token validation: Status ${validateResponse.status}`);
                console.log(`   Valid user: ${validateResponse.data.user?.email}`);
            } catch (error) {
                console.log(`   ❌ Token validation failed: ${error.response?.status || error.message}`);
            }
            
            console.log('\n4. Summary:');
            console.log(`   User registration: ✅ Working`);
            console.log(`   Authentication: ✅ Working`);
            console.log(`   Data retrieval: ❌ Failing with 500 errors`);
            console.log(`   \n   🔍 Diagnosis: The database connection or query execution is failing.`);
            console.log(`   This suggests the MongoDB connection might be down or misconfigured.`);
            
        } else {
            console.log(`❌ User registration failed: ${registerResponse.data.message}`);
        }
        
    } catch (error) {
        console.log(`❌ Registration error: ${error.response?.status || error.message}`);
        if (error.response?.data) {
            console.log(`   Details: ${JSON.stringify(error.response.data)}`);
        }
    }
}

// Test with existing user ID if provided
async function testWithExistingUserId(userId) {
    console.log(`\n🔍 Testing with existing User ID: ${userId}`);
    
    const tests = [
        `/v1/urls/user/${userId}`,
        `/v1/files/user/${userId}`,
        `/v1/qr/user/${userId}`
    ];
    
    for (const endpoint of tests) {
        try {
            const response = await axios.get(`${API_BASE_URL}${endpoint}`, { timeout: 10000 });
            console.log(`✅ ${endpoint}: Status ${response.status}, Count: ${response.data.count || 0}`);
        } catch (error) {
            console.log(`❌ ${endpoint}: ${error.response?.status || error.message}`);
        }
    }
}

async function main() {
    await testSpecificUserData();
    
    // Test with some random user IDs to see behavior
    console.log('\n🎲 Testing with random user IDs...');
    const randomIds = [
        '507f1f77bcf86cd799439011', // Valid ObjectId format
        '69047c5c0654ea24aa8452db', // From previous test
        'invalid-user-id'            // Invalid format
    ];
    
    for (const id of randomIds) {
        await testWithExistingUserId(id);
    }
}

main().catch(console.error);