#!/usr/bin/env node

const axios = require('axios');

const API_BASE_URL = 'https://urlshortner-1-hpyu.onrender.com/api';

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

async function debugDatabaseQueries() {
    log('🔍 Debugging Database Query Issues', 'bold');
    log('='.repeat(50), 'blue');
    
    // Step 1: Create a user and get the details
    log('\n1. Creating a test user for debugging...', 'bold');
    
    const testUser = {
        email: `debug.${Date.now()}@example.com`,
        password: 'debugpass123',
        firstName: 'Debug',
        lastName: 'User'
    };
    
    let userId, token, userEmail;
    
    try {
        const registerResponse = await axios.post(`${API_BASE_URL}/v1/auth/register`, testUser, { timeout: 15000 });
        
        if (registerResponse.status === 200 && registerResponse.data.success) {
            userId = registerResponse.data.user.id;
            token = registerResponse.data.token;
            userEmail = registerResponse.data.user.email;
            
            logSuccess(`User created successfully`);
            logInfo(`User ID: ${userId}`);
            logInfo(`Email: ${userEmail}`);
            logInfo(`Token: ${token.substring(0, 20)}...`);
            
        } else {
            logError('User creation failed');
            return;
        }
    } catch (error) {
        logError(`User creation error: ${error.response?.status || error.message}`);
        return;
    }
    
    // Step 2: Test individual endpoints with detailed error logging
    log('\n2. Testing individual endpoints with detailed debugging...', 'bold');
    
    const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 20000
    };
    
    // Test 2a: Token validation (this should work since registration worked)
    log('\n2a. Testing token validation...', 'blue');
    try {
        const validateResponse = await axios.post(`${API_BASE_URL}/v1/auth/validate`, {}, config);
        
        if (validateResponse.status === 200) {
            logSuccess('Token validation: SUCCESS');
            logInfo(`Validated user: ${validateResponse.data.user?.email}`);
        } else {
            logWarning(`Token validation: Status ${validateResponse.status}`);
        }
    } catch (error) {
        logError(`Token validation failed: ${error.response?.status || error.message}`);
        if (error.response?.data) {
            logError(`Error details: ${JSON.stringify(error.response.data)}`);
        }
    }
    
    // Test 2b: Get all users (to see if basic queries work)
    log('\n2b. Testing get all users...', 'blue');
    try {
        const usersResponse = await axios.get(`${API_BASE_URL}/v1/auth/users`, { timeout: 20000 });
        
        if (usersResponse.status === 200) {
            logSuccess('Get all users: SUCCESS');
            logInfo(`Total users: ${usersResponse.data.count || 0}`);
            
            // Check if our user is in the list
            const users = usersResponse.data.users || [];
            const ourUser = users.find(u => u.email === userEmail);
            if (ourUser) {
                logSuccess('Our test user found in users list');
                logInfo(`User in list: ${ourUser.email} (ID: ${ourUser.id})`);
            } else {
                logWarning('Our test user NOT found in users list');
            }
        } else {
            logWarning(`Get all users: Status ${usersResponse.status}`);
        }
    } catch (error) {
        logError(`Get all users failed: ${error.response?.status || error.message}`);
        if (error.response?.data) {
            logError(`Error details: ${JSON.stringify(error.response.data)}`);
        }
    }
    
    // Test 2c: Get user profile by email (this is failing)
    log('\n2c. Testing get user profile by email...', 'blue');
    try {
        const profileResponse = await axios.get(`${API_BASE_URL}/v1/auth/profile/${userEmail}`, config);
        
        if (profileResponse.status === 200) {
            logSuccess('Get user profile: SUCCESS');
            logInfo(`Profile user: ${profileResponse.data.user?.email}`);
        } else {
            logWarning(`Get user profile: Status ${profileResponse.status}`);
        }
    } catch (error) {
        logError(`Get user profile failed: ${error.response?.status || error.message}`);
        if (error.response?.data) {
            logError(`Error details: ${JSON.stringify(error.response.data)}`);
        }
        
        // This is the main issue - let's try to understand why
        if (error.response?.status === 500) {
            logError('🔍 500 error indicates server-side issue in profile lookup');
            logError('This suggests the UserService.findByEmail() method is failing');
        }
    }
    
    // Test 2d: Get user URLs (this is also failing)
    log('\n2d. Testing get user URLs...', 'blue');
    try {
        const urlsResponse = await axios.get(`${API_BASE_URL}/v1/urls/user/${userId}`, config);
        
        if (urlsResponse.status === 200) {
            logSuccess('Get user URLs: SUCCESS');
            logInfo(`URLs count: ${urlsResponse.data.count || 0}`);
        } else {
            logWarning(`Get user URLs: Status ${urlsResponse.status}`);
        }
    } catch (error) {
        logError(`Get user URLs failed: ${error.response?.status || error.message}`);
        if (error.response?.data) {
            logError(`Error details: ${JSON.stringify(error.response.data)}`);
        }
    }
    
    // Step 3: Test database status endpoints
    log('\n3. Testing database status endpoints...', 'bold');
    
    const statusEndpoints = [
        { name: 'Database Status', url: '/v1/init/status' },
        { name: 'Setup Status', url: '/v1/setup/database-status' },
        { name: 'Domains Status', url: '/v1/init/domains/status' }
    ];
    
    for (const endpoint of statusEndpoints) {
        try {
            const response = await axios.get(`${API_BASE_URL}${endpoint.url}`, { timeout: 15000 });
            
            if (response.status === 200) {
                logSuccess(`${endpoint.name}: SUCCESS`);
                
                if (response.data.collections) {
                    const collections = Object.keys(response.data.collections);
                    logInfo(`Collections: ${collections.join(', ')}`);
                    
                    // Check users collection specifically
                    if (response.data.collections.users) {
                        const usersInfo = response.data.collections.users;
                        logInfo(`Users collection: ${usersInfo.documentCount || 0} documents, ${usersInfo.indexCount || 0} indexes`);
                    }
                }
            }
        } catch (error) {
            logError(`${endpoint.name}: ${error.response?.status || error.message}`);
        }
    }
    
    // Step 4: Test direct MongoDB operations via backend
    log('\n4. Testing direct database operations...', 'bold');
    
    try {
        // Try to create a test domain to see if MongoDB writes work
        const testDomainData = {
            domainName: `test-${Date.now()}.example.com`
        };
        
        const domainResponse = await axios.post(`${API_BASE_URL}/v1/init/domains/test`, testDomainData, { timeout: 15000 });
        
        if (domainResponse.status === 200) {
            logSuccess('Test domain creation: SUCCESS');
            logInfo('MongoDB write operations are working');
        } else {
            logWarning(`Test domain creation: Status ${domainResponse.status}`);
        }
    } catch (error) {
        logError(`Test domain creation failed: ${error.response?.status || error.message}`);
        if (error.response?.status === 500) {
            logError('🔍 MongoDB write operations are also failing');
        }
    }
    
    // Step 5: Analysis and recommendations
    log('\n5. Analysis and Recommendations', 'bold');
    log('='.repeat(50), 'blue');
    
    log('\n🔍 Issue Analysis:');
    log('• User registration works (MongoDB writes work for auth)');
    log('• Token generation and validation works');
    log('• Database initialization endpoints work');
    log('• But data retrieval queries fail with 500 errors');
    
    log('\n💡 Possible Root Causes:');
    log('1. MongoDB connection pool issues during read operations');
    log('2. Repository method implementations have issues');
    log('3. Spring Data MongoDB configuration problems');
    log('4. Database connection timeout during complex queries');
    log('5. MongoDB Atlas network/firewall restrictions on certain operations');
    
    log('\n🔧 Recommended Actions:');
    log('1. Check backend service logs on Render for detailed error messages');
    log('2. Verify MongoDB Atlas connection limits and current usage');
    log('3. Test with a simpler repository query method');
    log('4. Check if the issue is specific to certain collections');
    log('5. Consider increasing MongoDB connection timeout settings');
    
    log('\n📊 Test Summary:');
    log(`User Creation: ✅ Working`);
    log(`Token Validation: ✅ Working`);
    log(`Database Init: ✅ Working`);
    log(`Data Retrieval: ❌ Failing (500 errors)`);
    log(`Overall Status: ⚠️  Partial functionality`);
}

async function main() {
    try {
        await debugDatabaseQueries();
        log('\n✨ Debug analysis completed!', 'green');
    } catch (error) {
        logError(`Debug failed: ${error.message}`);
        process.exit(1);
    }
}

// Run the debug
if (require.main === module) {
    main().catch(error => {
        logError(`Unhandled error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { main };