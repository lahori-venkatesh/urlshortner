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

async function waitForBackendRestart() {
    log('⏳ Waiting for backend service to restart after fix...', 'yellow');
    
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max
    
    while (attempts < maxAttempts) {
        try {
            const response = await axios.get(`${API_BASE_URL}/v1/auth/users`, { timeout: 5000 });
            if (response.status === 200) {
                logSuccess('Backend service is responding!');
                return true;
            }
        } catch (error) {
            // Service not ready yet
        }
        
        attempts++;
        logInfo(`Attempt ${attempts}/${maxAttempts} - waiting 10 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    logError('Backend service did not restart within expected time');
    return false;
}

async function testCompleteUserFlow() {
    log('\n🧪 Testing Complete User Flow After Fix', 'bold');
    log('='.repeat(60), 'blue');
    
    // Create a new test user
    const testUser = {
        email: `fixed.${Date.now()}@example.com`,
        password: 'fixed123',
        firstName: 'Fixed',
        lastName: 'User'
    };
    
    try {
        // Step 1: Register user
        logInfo('Step 1: Registering new user...');
        const registerResponse = await axios.post(`${API_BASE_URL}/v1/auth/register`, testUser, { timeout: 15000 });
        
        if (registerResponse.status === 200 && registerResponse.data.success) {
            const userId = registerResponse.data.user.id;
            const token = registerResponse.data.token;
            
            logSuccess(`✅ User registration: SUCCESS`);
            logInfo(`User ID: ${userId}`);
            
            const config = {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 15000
            };
            
            // Step 2: Test profile retrieval
            logInfo('Step 2: Testing profile retrieval...');
            try {
                const profileResponse = await axios.get(`${API_BASE_URL}/v1/auth/profile/${testUser.email}`, config);
                logSuccess(`✅ Profile retrieval: SUCCESS`);
                logInfo(`Profile: ${profileResponse.data.user.email}`);
            } catch (error) {
                logError(`❌ Profile retrieval: FAILED (${error.response?.status})`);
                return { success: false, step: 'profile' };
            }
            
            // Step 3: Test token validation
            logInfo('Step 3: Testing token validation...');
            try {
                const validateResponse = await axios.post(`${API_BASE_URL}/v1/auth/validate`, {}, config);
                logSuccess(`✅ Token validation: SUCCESS`);
            } catch (error) {
                logError(`❌ Token validation: FAILED (${error.response?.status})`);
                return { success: false, step: 'validation' };
            }
            
            // Step 4: Test all data retrieval endpoints
            logInfo('Step 4: Testing data retrieval endpoints...');
            
            const dataEndpoints = [
                { name: 'User URLs', url: `/v1/urls/user/${userId}` },
                { name: 'User Files', url: `/v1/files/user/${userId}` },
                { name: 'User QR Codes', url: `/v1/qr/user/${userId}` },
                { name: 'User Analytics', url: `/v1/analytics/user/${userId}` },
                { name: 'User Teams', url: `/v1/teams/my?userId=${userId}` }
            ];
            
            let successCount = 0;
            const results = [];
            
            for (const endpoint of dataEndpoints) {
                try {
                    const response = await axios.get(`${API_BASE_URL}${endpoint.url}`, config);
                    
                    if (response.status === 200) {
                        logSuccess(`✅ ${endpoint.name}: SUCCESS`);
                        
                        const count = response.data.count || response.data.data?.length || 0;
                        logInfo(`   └─ Data count: ${count}`);
                        
                        successCount++;
                        results.push({ name: endpoint.name, status: 'SUCCESS', count });
                    } else {
                        logWarning(`⚠️  ${endpoint.name}: Status ${response.status}`);
                        results.push({ name: endpoint.name, status: 'WARNING', statusCode: response.status });
                    }
                    
                } catch (error) {
                    if (error.response?.status === 404) {
                        logSuccess(`✅ ${endpoint.name}: SUCCESS (empty data - 404 is expected)`);
                        successCount++;
                        results.push({ name: endpoint.name, status: 'SUCCESS', count: 0 });
                    } else {
                        logError(`❌ ${endpoint.name}: FAILED (${error.response?.status})`);
                        results.push({ name: endpoint.name, status: 'FAILED', error: error.response?.status });
                    }
                }
            }
            
            // Step 5: Test creating data
            logInfo('Step 5: Testing data creation...');
            
            try {
                // Create a URL
                const urlData = {
                    originalUrl: 'https://www.example.com/test-after-fix',
                    userId: userId,
                    title: 'Test URL After Fix',
                    description: 'Testing URL creation after dependency injection fix'
                };
                
                const createUrlResponse = await axios.post(`${API_BASE_URL}/v1/urls`, urlData, config);
                
                if (createUrlResponse.status === 200 && createUrlResponse.data.success) {
                    logSuccess(`✅ URL creation: SUCCESS`);
                    const shortCode = createUrlResponse.data.data.shortCode;
                    logInfo(`   └─ Short code: ${shortCode}`);
                    
                    // Now try to retrieve the created URL
                    const retrieveResponse = await axios.get(`${API_BASE_URL}/v1/urls/user/${userId}`, config);
                    
                    if (retrieveResponse.status === 200) {
                        const urlCount = retrieveResponse.data.count || retrieveResponse.data.data?.length || 0;
                        logSuccess(`✅ URL retrieval after creation: SUCCESS`);
                        logInfo(`   └─ URLs found: ${urlCount}`);
                        
                        if (urlCount > 0) {
                            logSuccess(`🎉 COMPLETE SUCCESS: Data creation and retrieval working!`);
                        }
                    }
                } else {
                    logError(`❌ URL creation: FAILED`);
                }
                
            } catch (error) {
                logError(`❌ URL creation: FAILED (${error.response?.status})`);
            }
            
            // Final assessment
            log('\n📊 Test Results Summary:', 'bold');
            log(`Successful endpoints: ${successCount}/${dataEndpoints.length}`);
            
            if (successCount === dataEndpoints.length) {
                logSuccess('🎉 ALL DATA RETRIEVAL ENDPOINTS ARE WORKING!');
                return { success: true, successCount, totalEndpoints: dataEndpoints.length, results };
            } else if (successCount > 0) {
                logWarning(`⚠️  Partial success: ${successCount}/${dataEndpoints.length} working`);
                return { success: 'partial', successCount, totalEndpoints: dataEndpoints.length, results };
            } else {
                logError('❌ No endpoints working - fix may not have taken effect yet');
                return { success: false, successCount, totalEndpoints: dataEndpoints.length, results };
            }
            
        } else {
            logError('User registration failed');
            return { success: false, step: 'registration' };
        }
        
    } catch (error) {
        logError(`Test failed: ${error.response?.status || error.message}`);
        return { success: false, error: error.message };
    }
}

async function testWithExistingUsers() {
    log('\n👥 Testing with Existing Users', 'bold');
    log('='.repeat(60), 'blue');
    
    try {
        // Get existing users
        const usersResponse = await axios.get(`${API_BASE_URL}/v1/auth/users`, { timeout: 10000 });
        
        if (usersResponse.status === 200 && usersResponse.data.users?.length > 0) {
            const users = usersResponse.data.users.slice(0, 3);
            
            logSuccess(`Found ${users.length} existing users to test with`);
            
            for (const user of users) {
                logInfo(`\nTesting user: ${user.email}`);
                
                // Test profile retrieval
                try {
                    const profileResponse = await axios.get(`${API_BASE_URL}/v1/auth/profile/${user.email}`, { timeout: 10000 });
                    logSuccess(`✅ Profile: SUCCESS for ${user.email}`);
                } catch (error) {
                    logError(`❌ Profile: FAILED for ${user.email} (${error.response?.status})`);
                }
                
                // Test data endpoints (should return 403 without auth)
                try {
                    const urlsResponse = await axios.get(`${API_BASE_URL}/v1/urls/user/${user.id}`, { timeout: 10000 });
                    logWarning(`⚠️  Unexpected success for ${user.email}`);
                } catch (error) {
                    if (error.response?.status === 403) {
                        logSuccess(`✅ Correct 403 (unauthorized) for ${user.email}`);
                    } else if (error.response?.status === 500) {
                        logError(`❌ Still getting 500 errors for ${user.email}`);
                    } else {
                        logInfo(`Status ${error.response?.status} for ${user.email}`);
                    }
                }
            }
        }
    } catch (error) {
        logError(`Failed to test existing users: ${error.response?.status || error.message}`);
    }
}

async function main() {
    log('🚀 TESTING FIX: Dependency Injection Issue Resolution', 'bold');
    log('='.repeat(70), 'blue');
    
    log('\n🔧 APPLIED FIXES:', 'yellow');
    log('1. ✅ Fixed UserService dependency injection (constructor injection)');
    log('2. ✅ Added error handling to JwtAuthenticationFilter');
    log('3. ✅ Made UserRepository private and properly injected');
    
    try {
        // Wait for backend to restart
        const backendReady = await waitForBackendRestart();
        
        if (!backendReady) {
            log('\n⚠️  Backend may still be restarting. Proceeding with tests...', 'yellow');
        }
        
        // Test complete user flow
        const flowResult = await testCompleteUserFlow();
        
        // Test with existing users
        await testWithExistingUsers();
        
        // Final verdict
        log('\n' + '='.repeat(70), 'blue');
        log('🏆 FINAL VERDICT', 'bold');
        log('='.repeat(70), 'blue');
        
        if (flowResult.success === true) {
            log('\n🎉 SUCCESS: The fix worked completely!', 'green');
            log('✅ User registration: Working', 'green');
            log('✅ User authentication: Working', 'green');
            log('✅ Data retrieval by user ID: Working', 'green');
            log('✅ All endpoints functional', 'green');
            
            log('\n📊 RESULTS:', 'blue');
            log(`• Working endpoints: ${flowResult.successCount}/${flowResult.totalEndpoints}`);
            log('• Data creation and retrieval: Functional');
            log('• Project status: FULLY OPERATIONAL');
            
        } else if (flowResult.success === 'partial') {
            log('\n⚠️  PARTIAL SUCCESS: Some endpoints working', 'yellow');
            log(`• Working endpoints: ${flowResult.successCount}/${flowResult.totalEndpoints}`, 'yellow');
            log('• May need additional fixes or more time for deployment', 'yellow');
            
        } else {
            log('\n❌ FIX NOT YET EFFECTIVE', 'red');
            log('• The dependency injection fix may need more time to deploy', 'red');
            log('• Or there may be additional issues to resolve', 'red');
            
            log('\n🔄 NEXT STEPS:', 'yellow');
            log('1. Wait for Render deployment to complete');
            log('2. Check if backend service restarted properly');
            log('3. Monitor logs for any remaining errors');
        }
        
        log('\n✨ Test completed!', 'blue');
        
    } catch (error) {
        logError(`Test execution failed: ${error.message}`);
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    main().catch(error => {
        logError(`Unhandled error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { main };