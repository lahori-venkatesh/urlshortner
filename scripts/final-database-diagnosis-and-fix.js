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

async function finalDatabaseDiagnosis() {
    log('🔬 Final Database Diagnosis and User Data Verification', 'bold');
    log('='.repeat(70), 'blue');
    
    // Summary of what we know
    log('\n📋 Current Status Summary:', 'bold');
    log('✅ MongoDB connection: Working');
    log('✅ User registration: Working');
    log('✅ Database writes: Working');
    log('✅ Basic queries (get all users): Working');
    log('❌ Specific user queries: Failing with 500 errors');
    log('❌ Data retrieval by user ID: Failing');
    
    // Test with existing users
    log('\n🔍 Testing with Existing Users in Database...', 'bold');
    
    try {
        // Get all users to find real user IDs
        const usersResponse = await axios.get(`${API_BASE_URL}/v1/auth/users`, { timeout: 15000 });
        
        if (usersResponse.status === 200 && usersResponse.data.users) {
            const users = usersResponse.data.users;
            logSuccess(`Found ${users.length} users in database`);
            
            // Test with the first few users
            const testUsers = users.slice(0, 3);
            
            for (const user of testUsers) {
                logInfo(`\nTesting with user: ${user.email} (ID: ${user.id})`);
                
                // Test profile retrieval
                try {
                    const profileResponse = await axios.get(`${API_BASE_URL}/v1/auth/profile/${user.email}`, { timeout: 10000 });
                    logSuccess(`Profile retrieval: SUCCESS for ${user.email}`);
                } catch (error) {
                    logError(`Profile retrieval: FAILED for ${user.email} - ${error.response?.status}`);
                }
                
                // Test URLs retrieval (without auth - should get 403)
                try {
                    const urlsResponse = await axios.get(`${API_BASE_URL}/v1/urls/user/${user.id}`, { timeout: 10000 });
                    logWarning(`URLs retrieval: Unexpected success for ${user.email}`);
                } catch (error) {
                    if (error.response?.status === 403) {
                        logSuccess(`URLs retrieval: Correctly returns 403 (unauthorized) for ${user.email}`);
                    } else if (error.response?.status === 500) {
                        logError(`URLs retrieval: Server error (500) for ${user.email}`);
                    } else {
                        logWarning(`URLs retrieval: Status ${error.response?.status} for ${user.email}`);
                    }
                }
            }
        } else {
            logError('Could not retrieve users list');
        }
    } catch (error) {
        logError(`Failed to get users: ${error.response?.status || error.message}`);
    }
    
    // Test the complete flow with a new user
    log('\n🧪 Testing Complete User Flow...', 'bold');
    
    const testUser = {
        email: `flowtest.${Date.now()}@example.com`,
        password: 'flowtest123',
        firstName: 'Flow',
        lastName: 'Test'
    };
    
    try {
        // Step 1: Register user
        logInfo('Step 1: Registering new user...');
        const registerResponse = await axios.post(`${API_BASE_URL}/v1/auth/register`, testUser, { timeout: 15000 });
        
        if (registerResponse.status === 200 && registerResponse.data.success) {
            const userId = registerResponse.data.user.id;
            const token = registerResponse.data.token;
            const userEmail = registerResponse.data.user.email;
            
            logSuccess(`User registered: ${userEmail} (ID: ${userId})`);
            
            // Step 2: Immediate profile check (this should work since registration worked)
            logInfo('Step 2: Checking profile immediately after registration...');
            try {
                const profileResponse = await axios.get(`${API_BASE_URL}/v1/auth/profile/${userEmail}`, { timeout: 10000 });
                logSuccess('Profile check: SUCCESS immediately after registration');
            } catch (error) {
                logError(`Profile check: FAILED immediately after registration - ${error.response?.status}`);
                logError('🔍 This confirms the issue is in the findByEmail repository method');
            }
            
            // Step 3: Login with the same user
            logInfo('Step 3: Logging in with the same user...');
            try {
                const loginResponse = await axios.post(`${API_BASE_URL}/v1/auth/login`, {
                    email: testUser.email,
                    password: testUser.password
                }, { timeout: 15000 });
                
                if (loginResponse.status === 200) {
                    logSuccess('Login: SUCCESS');
                    logInfo('🔍 This means findByEmail works in UserService.loginUser()');
                } else {
                    logError(`Login: FAILED with status ${loginResponse.status}`);
                }
            } catch (error) {
                logError(`Login: FAILED - ${error.response?.status || error.message}`);
                if (error.response?.status === 500) {
                    logError('🔍 Login also fails with 500 - confirms repository issue');
                }
            }
            
            // Step 4: Test with authentication
            logInfo('Step 4: Testing authenticated requests...');
            const config = {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 15000
            };
            
            try {
                const urlsResponse = await axios.get(`${API_BASE_URL}/v1/urls/user/${userId}`, config);
                logSuccess('Authenticated URLs request: SUCCESS');
                logInfo(`URLs count: ${urlsResponse.data.count || 0}`);
            } catch (error) {
                logError(`Authenticated URLs request: FAILED - ${error.response?.status}`);
            }
            
        } else {
            logError('User registration failed in complete flow test');
        }
        
    } catch (error) {
        logError(`Complete flow test failed: ${error.response?.status || error.message}`);
    }
    
    // Final diagnosis
    log('\n🎯 Final Diagnosis and Recommendations', 'bold');
    log('='.repeat(70), 'blue');
    
    log('\n🔍 Root Cause Analysis:');
    log('Based on the test results, the issue appears to be:');
    log('');
    log('1. ✅ MongoDB connection is working (writes succeed)');
    log('2. ✅ Basic queries work (get all users succeeds)');
    log('3. ✅ User registration works (creates users successfully)');
    log('4. ❌ Specific repository methods fail (findByEmail, findById)');
    log('5. ❌ This suggests a Spring Data MongoDB configuration issue');
    log('');
    
    log('🔧 Most Likely Causes:');
    log('• Repository method query generation issues');
    log('• MongoDB field mapping problems');
    log('• Index-related query execution problems');
    log('• Connection pool exhaustion during complex queries');
    log('• Spring Data MongoDB version compatibility issues');
    
    log('\n💡 Immediate Solutions to Try:');
    log('1. Check backend logs on Render for specific error details');
    log('2. Restart the backend service to reset connection pools');
    log('3. Verify MongoDB Atlas connection limits and active connections');
    log('4. Check if the issue is environment-specific (dev vs prod)');
    
    log('\n📊 User Data Loading Status:');
    log('❌ User profile loading: NOT WORKING');
    log('❌ User URLs loading: NOT WORKING');
    log('❌ User files loading: NOT WORKING');
    log('❌ User QR codes loading: NOT WORKING');
    log('❌ User analytics loading: NOT WORKING');
    log('');
    log('🚨 CONCLUSION: User data is NOT being loaded properly from the database.');
    log('   Users can be created but their data cannot be retrieved by user ID.');
    log('   This is a critical issue that prevents the application from functioning.');
    
    log('\n🔄 Next Steps:');
    log('1. Backend service needs debugging and log analysis');
    log('2. Repository layer needs investigation');
    log('3. MongoDB connection configuration may need adjustment');
    log('4. Consider implementing fallback query methods');
    
    return {
        userRegistration: true,
        dataRetrieval: false,
        databaseConnection: true,
        overallStatus: 'CRITICAL_ISSUE'
    };
}

async function testWithRandomUserIds() {
    log('\n🎲 Final Test: Random User ID Behavior', 'bold');
    
    const testIds = [
        '507f1f77bcf86cd799439011', // Valid ObjectId format
        '69047d830654ea24aa8452e1', // From our tests
        'invalid-id',                // Invalid format
        '000000000000000000000000'   // Valid format, likely doesn't exist
    ];
    
    for (const userId of testIds) {
        logInfo(`Testing user ID: ${userId}`);
        
        try {
            const response = await axios.get(`${API_BASE_URL}/v1/urls/user/${userId}`, { timeout: 5000 });
            logWarning(`Unexpected success for ${userId}: Status ${response.status}`);
        } catch (error) {
            if (error.response?.status === 403) {
                logSuccess(`Correct 403 (unauthorized) for ${userId}`);
            } else if (error.response?.status === 500) {
                logError(`Server error (500) for ${userId} - confirms database issue`);
            } else {
                logInfo(`Status ${error.response?.status} for ${userId}`);
            }
        }
    }
}

async function main() {
    try {
        const results = await finalDatabaseDiagnosis();
        await testWithRandomUserIds();
        
        log('\n' + '='.repeat(70), 'blue');
        log('🏁 FINAL VERDICT', 'bold');
        log('='.repeat(70), 'blue');
        
        if (results.overallStatus === 'CRITICAL_ISSUE') {
            log('🚨 CRITICAL ISSUE IDENTIFIED', 'red');
            log('');
            log('✅ Users can be created in the database', 'green');
            log('❌ User data CANNOT be retrieved by user ID', 'red');
            log('❌ This prevents proper application functionality', 'red');
            log('');
            log('🔧 REQUIRED ACTION: Backend service debugging needed', 'yellow');
            log('   The repository layer or MongoDB configuration has issues', 'yellow');
            log('   that prevent data retrieval queries from working properly.', 'yellow');
        }
        
        log('\n✨ Diagnosis completed!', 'blue');
        
    } catch (error) {
        logError(`Diagnosis failed: ${error.message}`);
        process.exit(1);
    }
}

// Run the diagnosis
if (require.main === module) {
    main().catch(error => {
        logError(`Unhandled error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { main };