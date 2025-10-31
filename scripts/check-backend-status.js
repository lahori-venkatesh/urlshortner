#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'https://urlshortner-1-hpyu.onrender.com/api';

async function checkBackendStatus() {
    console.log('🔍 Checking Backend Status...\n');
    
    const endpoints = [
        { name: 'Root API', url: `${API_BASE_URL}` },
        { name: 'Health Check', url: `${API_BASE_URL}/health` },
        { name: 'Auth Health', url: `${API_BASE_URL}/v1/auth/health` },
        { name: 'Database Setup', url: `${API_BASE_URL}/setup/database` },
        { name: 'Simple Test', url: `${API_BASE_URL}/test` }
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`Testing: ${endpoint.name}`);
            const response = await axios.get(endpoint.url, { timeout: 10000 });
            console.log(`✅ ${endpoint.name}: Status ${response.status}`);
            if (response.data) {
                console.log(`   Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
            }
        } catch (error) {
            if (error.response) {
                console.log(`❌ ${endpoint.name}: Status ${error.response.status} - ${error.response.statusText}`);
                if (error.response.data) {
                    console.log(`   Error: ${JSON.stringify(error.response.data).substring(0, 100)}...`);
                }
            } else if (error.code === 'ECONNABORTED') {
                console.log(`⏰ ${endpoint.name}: Timeout`);
            } else {
                console.log(`❌ ${endpoint.name}: ${error.message}`);
            }
        }
        console.log('');
    }
    
    // Test a simple registration to see if the service is working
    console.log('🧪 Testing User Registration...');
    try {
        const testUser = {
            email: `test.${Date.now()}@example.com`,
            password: 'testpass123',
            firstName: 'Test',
            lastName: 'User'
        };
        
        const response = await axios.post(`${API_BASE_URL}/v1/auth/register`, testUser, { timeout: 15000 });
        console.log(`✅ Registration: Status ${response.status}`);
        console.log(`   User ID: ${response.data.user?.id}`);
        
        // Test getting user data
        if (response.data.user?.id) {
            console.log('\n🔍 Testing Data Retrieval...');
            const userId = response.data.user.id;
            const token = response.data.token;
            
            const config = {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 10000
            };
            
            try {
                const urlsResponse = await axios.get(`${API_BASE_URL}/v1/urls/user/${userId}`, config);
                console.log(`✅ Get User URLs: Status ${urlsResponse.status}, Count: ${urlsResponse.data.count || 0}`);
            } catch (error) {
                console.log(`❌ Get User URLs: ${error.response?.status || error.message}`);
            }
        }
        
    } catch (error) {
        console.log(`❌ Registration failed: ${error.response?.status || error.message}`);
        if (error.response?.data) {
            console.log(`   Error details: ${JSON.stringify(error.response.data)}`);
        }
    }
}

checkBackendStatus().catch(console.error);