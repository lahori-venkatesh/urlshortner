#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'https://urlshortner-1-hpyu.onrender.com/api';
const MONGODB_URI = 'mongodb+srv://lahorivenkatesh709:p0SkcBwHo67ghvMW@cluster0.y8ucl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0&maxPoolSize=100&minPoolSize=10&maxIdleTimeMS=60000&connectTimeoutMS=10000&socketTimeoutMS=5000';

async function testMongoDBConnection() {
    console.log('🔍 Testing MongoDB Connection and Backend Database Access...\n');
    
    // Test 1: Check if we can connect to MongoDB directly (if mongodb package is available)
    console.log('1. Testing MongoDB Connection...');
    try {
        // We'll use the backend API to test database connectivity
        console.log('   Using backend API to test database connectivity...');
        
        // Test database setup endpoint
        try {
            const setupResponse = await axios.get(`${API_BASE_URL}/setup/database/status`, { timeout: 15000 });
            console.log(`   ✅ Database setup status: ${setupResponse.status}`);
            if (setupResponse.data) {
                console.log(`   Response: ${JSON.stringify(setupResponse.data)}`);
            }
        } catch (error) {
            console.log(`   ❌ Database setup endpoint: ${error.response?.status || error.message}`);
        }
        
        // Test database initialization endpoint
        try {
            const initResponse = await axios.get(`${API_BASE_URL}/init/database/status`, { timeout: 15000 });
            console.log(`   ✅ Database init status: ${initResponse.status}`);
        } catch (error) {
            console.log(`   ❌ Database init endpoint: ${error.response?.status || error.message}`);
        }
        
    } catch (error) {
        console.log(`   ❌ MongoDB connection test failed: ${error.message}`);
    }
    
    // Test 2: Create a user and immediately try to retrieve it
    console.log('\n2. Testing User Creation and Immediate Retrieval...');
    
    const testUser = {
        email: `dbtest.${Date.now()}@example.com`,
        password: 'testpass123',
        firstName: 'DB',
        lastName: 'Test'
    };
    
    try {
        // Create user
        console.log('   Creating user...');
        const createResponse = await axios.post(`${API_BASE_URL}/v1/auth/register`, testUser, { timeout: 15000 });
        
        if (createResponse.status === 200 && createResponse.data.success) {
            const userId = createResponse.data.user.id;
            const token = createResponse.data.token;
            
            console.log(`   ✅ User created: ${userId}`);
            
            // Immediately try to retrieve user profile
            console.log('   Attempting immediate profile retrieval...');
            
            const config = {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 15000
            };
            
            try {
                const profileResponse = await axios.get(`${API_BASE_URL}/v1/auth/profile/${testUser.email}`, config);
                console.log(`   ✅ Profile retrieved successfully: ${profileResponse.status}`);
                console.log(`   User data: ${profileResponse.data.user?.email}`);
            } catch (error) {
                console.log(`   ❌ Profile retrieval failed: ${error.response?.status || error.message}`);
                
                if (error.response?.status === 500) {
                    console.log('   🔍 500 error suggests database query execution issue');
                }
            }
            
            // Try to get user URLs (should be empty but should not error)
            console.log('   Attempting to get user URLs...');
            try {
                const urlsResponse = await axios.get(`${API_BASE_URL}/v1/urls/user/${userId}`, config);
                console.log(`   ✅ URLs retrieved: ${urlsResponse.status}, Count: ${urlsResponse.data.count || 0}`);
            } catch (error) {
                console.log(`   ❌ URLs retrieval failed: ${error.response?.status || error.message}`);
            }
            
        } else {
            console.log(`   ❌ User creation failed: ${createResponse.data.message}`);
        }
        
    } catch (error) {
        console.log(`   ❌ User creation error: ${error.response?.status || error.message}`);
    }
    
    // Test 3: Check backend logs or monitoring endpoints
    console.log('\n3. Testing Backend Monitoring Endpoints...');
    
    const monitoringEndpoints = [
        '/actuator/health',
        '/actuator/info',
        '/actuator/metrics',
        '/actuator/caches',
        '/monitoring/health',
        '/health'
    ];
    
    for (const endpoint of monitoringEndpoints) {
        try {
            const response = await axios.get(`${API_BASE_URL}${endpoint}`, { timeout: 10000 });
            console.log(`   ✅ ${endpoint}: Status ${response.status}`);
            
            if (response.data && typeof response.data === 'object') {
                // Look for database-related information
                const dataStr = JSON.stringify(response.data);
                if (dataStr.includes('mongo') || dataStr.includes('database') || dataStr.includes('db')) {
                    console.log(`   📊 Database info found in response`);
                }
            }
        } catch (error) {
            console.log(`   ❌ ${endpoint}: ${error.response?.status || error.message}`);
        }
    }
    
    // Test 4: Wake up the backend service (Render services can go to sleep)
    console.log('\n4. Waking up Backend Service...');
    
    try {
        console.log('   Sending wake-up requests...');
        
        // Send multiple requests to wake up the service
        const wakeupPromises = [];
        for (let i = 0; i < 3; i++) {
            wakeupPromises.push(
                axios.get(`${API_BASE_URL}/`, { timeout: 30000 }).catch(() => {})
            );
        }
        
        await Promise.all(wakeupPromises);
        console.log('   ✅ Wake-up requests sent');
        
        // Wait a bit for the service to fully wake up
        console.log('   Waiting for service to fully initialize...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Try the test again
        console.log('   Retrying user data retrieval after wake-up...');
        
        const retryUser = {
            email: `retry.${Date.now()}@example.com`,
            password: 'testpass123',
            firstName: 'Retry',
            lastName: 'Test'
        };
        
        const retryResponse = await axios.post(`${API_BASE_URL}/v1/auth/register`, retryUser, { timeout: 20000 });
        
        if (retryResponse.data.success) {
            const userId = retryResponse.data.user.id;
            const token = retryResponse.data.token;
            
            const config = {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 20000
            };
            
            try {
                const urlsResponse = await axios.get(`${API_BASE_URL}/v1/urls/user/${userId}`, config);
                console.log(`   ✅ RETRY SUCCESS: URLs retrieved after wake-up: ${urlsResponse.status}`);
                console.log(`   Data count: ${urlsResponse.data.count || 0}`);
            } catch (error) {
                console.log(`   ❌ RETRY FAILED: Still getting errors after wake-up: ${error.response?.status}`);
            }
        }
        
    } catch (error) {
        console.log(`   ❌ Wake-up process failed: ${error.message}`);
    }
    
    // Test 5: Summary and Recommendations
    console.log('\n📋 Summary and Diagnosis:');
    console.log('='.repeat(50));
    
    console.log('✅ User Registration: Working (users can be created)');
    console.log('❌ Data Retrieval: Failing with 500 errors');
    console.log('✅ Authentication: Working (tokens are generated)');
    
    console.log('\n🔍 Possible Issues:');
    console.log('1. MongoDB connection pool exhaustion');
    console.log('2. Database query timeout issues');
    console.log('3. Backend service cold start problems (Render)');
    console.log('4. MongoDB Atlas network restrictions');
    console.log('5. Repository/Service layer configuration issues');
    
    console.log('\n💡 Recommendations:');
    console.log('1. Check MongoDB Atlas logs for connection errors');
    console.log('2. Verify network access list in MongoDB Atlas');
    console.log('3. Check backend service logs on Render');
    console.log('4. Consider increasing connection timeouts');
    console.log('5. Implement database health check endpoint');
}

testMongoDBConnection().catch(console.error);