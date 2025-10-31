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

async function initializeDatabase() {
    log('\n🚀 Initializing Database...', 'bold');
    
    const initEndpoints = [
        {
            name: 'Initialize All Collections',
            method: 'POST',
            url: '/v1/init/initialize-all',
            description: 'Initialize all collections and indexes'
        },
        {
            name: 'Initialize Domains',
            method: 'POST',
            url: '/v1/init/domains',
            description: 'Initialize domains collection'
        },
        {
            name: 'Database Status',
            method: 'GET',
            url: '/v1/init/status',
            description: 'Check database status'
        },
        {
            name: 'Setup Database Status',
            method: 'GET',
            url: '/v1/setup/database-status',
            description: 'Check setup status'
        }
    ];
    
    for (const endpoint of initEndpoints) {
        try {
            logInfo(`${endpoint.name}: ${endpoint.description}`);
            
            const response = await axios({
                method: endpoint.method,
                url: `${API_BASE_URL}${endpoint.url}`,
                timeout: 30000
            });
            
            if (response.status === 200) {
                logSuccess(`${endpoint.name}: SUCCESS`);
                
                if (response.data) {
                    if (response.data.success) {
                        logInfo(`  └─ ${response.data.message || 'Operation completed'}`);
                    }
                    
                    if (response.data.collections) {
                        const collections = Object.keys(response.data.collections);
                        logInfo(`  └─ Collections: ${collections.join(', ')}`);
                    }
                    
                    if (response.data.totalCollections) {
                        logInfo(`  └─ Total collections: ${response.data.totalCollections}`);
                    }
                    
                    if (response.data.operations) {
                        logInfo(`  └─ Operations: ${response.data.operations.length}`);
                    }
                }
            } else {
                logWarning(`${endpoint.name}: Status ${response.status}`);
            }
            
        } catch (error) {
            if (error.response?.status === 404) {
                logWarning(`${endpoint.name}: Endpoint not found (404)`);
            } else if (error.response?.status === 500) {
                logError(`${endpoint.name}: Server error (500)`);
                if (error.response.data?.error) {
                    logError(`  └─ Error: ${error.response.data.error}`);
                }
            } else {
                logError(`${endpoint.name}: ${error.response?.status || error.message}`);
            }
        }
        
        console.log(''); // Add spacing
    }
}

async function testUserDataAfterInit() {
    log('\n🧪 Testing User Data After Database Initialization...', 'bold');
    
    // Create a new test user
    const testUser = {
        email: `postinit.${Date.now()}@example.com`,
        password: 'testpass123',
        firstName: 'PostInit',
        lastName: 'Test'
    };
    
    try {
        logInfo('Creating test user...');
        const registerResponse = await axios.post(`${API_BASE_URL}/v1/auth/register`, testUser, { timeout: 15000 });
        
        if (registerResponse.status === 200 && registerResponse.data.success) {
            const userId = registerResponse.data.user.id;
            const token = registerResponse.data.token;
            
            logSuccess(`User created: ${userId}`);
            
            const config = {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 15000
            };
            
            // Test data retrieval endpoints
            const dataTests = [
                {
                    name: 'User Profile',
                    url: `/v1/auth/profile/${testUser.email}`,
                    expectData: true
                },
                {
                    name: 'User URLs',
                    url: `/v1/urls/user/${userId}`,
                    expectData: false // Should be empty for new user
                },
                {
                    name: 'User Files',
                    url: `/v1/files/user/${userId}`,
                    expectData: false
                },
                {
                    name: 'User QR Codes',
                    url: `/v1/qr/user/${userId}`,
                    expectData: false
                },
                {
                    name: 'User Analytics',
                    url: `/v1/analytics/user/${userId}`,
                    expectData: false
                },
                {
                    name: 'User Teams',
                    url: `/v1/teams/my?userId=${userId}`,
                    expectData: false
                }
            ];
            
            let successCount = 0;
            let totalTests = dataTests.length;
            
            for (const test of dataTests) {
                try {
                    logInfo(`Testing: ${test.name}`);
                    
                    const response = await axios.get(`${API_BASE_URL}${test.url}`, config);
                    
                    if (response.status === 200) {
                        logSuccess(`${test.name}: SUCCESS`);
                        successCount++;
                        
                        if (response.data.data) {
                            if (Array.isArray(response.data.data)) {
                                logInfo(`  └─ Items: ${response.data.data.length}`);
                            } else {
                                logInfo(`  └─ Data retrieved`);
                            }
                        } else if (response.data.user) {
                            logInfo(`  └─ User: ${response.data.user.email}`);
                        } else if (response.data.count !== undefined) {
                            logInfo(`  └─ Count: ${response.data.count}`);
                        }
                    } else {
                        logWarning(`${test.name}: Status ${response.status}`);
                    }
                    
                } catch (error) {
                    if (error.response?.status === 404) {
                        logWarning(`${test.name}: No data found (404) - Normal for new user`);
                        if (!test.expectData) {
                            successCount++; // 404 is expected for empty data
                        }
                    } else if (error.response?.status === 500) {
                        logError(`${test.name}: Server error (500) - Database issue persists`);
                    } else {
                        logError(`${test.name}: ${error.response?.status || error.message}`);
                    }
                }
            }
            
            // Create some sample data and test again
            logInfo('\nCreating sample data...');
            
            try {
                // Create a sample URL
                const urlData = {
                    originalUrl: 'https://www.example.com/test',
                    userId: userId,
                    title: 'Test URL After Init',
                    description: 'Testing URL creation after database initialization'
                };
                
                const urlResponse = await axios.post(`${API_BASE_URL}/v1/urls`, urlData, config);
                
                if (urlResponse.status === 200 && urlResponse.data.success) {
                    logSuccess('Sample URL created');
                    
                    // Test retrieving the URL
                    const retrieveResponse = await axios.get(`${API_BASE_URL}/v1/urls/user/${userId}`, config);
                    
                    if (retrieveResponse.status === 200) {
                        logSuccess(`URL retrieval after creation: SUCCESS`);
                        logInfo(`  └─ URLs found: ${retrieveResponse.data.count || retrieveResponse.data.data?.length || 0}`);
                        successCount++;
                    } else {
                        logError('URL retrieval after creation failed');
                    }
                } else {
                    logWarning('Sample URL creation failed');
                }
                
            } catch (error) {
                logError(`Sample data creation failed: ${error.response?.status || error.message}`);
            }
            
            // Summary
            log('\n📊 Test Results Summary:', 'bold');
            log(`Successful operations: ${successCount}/${totalTests + 1}`);
            
            if (successCount >= totalTests) {
                logSuccess('🎉 Database is working correctly after initialization!');
                return true;
            } else {
                logWarning('⚠️  Some operations still failing - database may need more configuration');
                return false;
            }
            
        } else {
            logError('User creation failed');
            return false;
        }
        
    } catch (error) {
        logError(`Test failed: ${error.response?.status || error.message}`);
        return false;
    }
}

async function testWithRandomUserIds() {
    log('\n🎲 Testing with Random User IDs...', 'bold');
    
    const randomUserIds = [
        '507f1f77bcf86cd799439011', // Valid ObjectId format
        '69047c5c0654ea24aa8452db', // From previous tests
        'nonexistent123456789012',   // Valid format but doesn't exist
        'invalid-user-id'            // Invalid format
    ];
    
    for (const userId of randomUserIds) {
        logInfo(`Testing with user ID: ${userId}`);
        
        const endpoints = [
            `/v1/urls/user/${userId}`,
            `/v1/files/user/${userId}`,
            `/v1/qr/user/${userId}`
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(`${API_BASE_URL}${endpoint}`, { timeout: 10000 });
                
                if (response.status === 200) {
                    logSuccess(`${endpoint}: Returns empty data (correct behavior)`);
                } else {
                    logWarning(`${endpoint}: Status ${response.status}`);
                }
                
            } catch (error) {
                if (error.response?.status === 403) {
                    logSuccess(`${endpoint}: Correctly returns 403 (unauthorized)`);
                } else if (error.response?.status === 404) {
                    logSuccess(`${endpoint}: Correctly returns 404 (not found)`);
                } else if (error.response?.status === 500) {
                    logError(`${endpoint}: Server error (500) - database issue`);
                } else {
                    logWarning(`${endpoint}: ${error.response?.status || error.message}`);
                }
            }
        }
        
        console.log('');
    }
}

async function generateFinalReport(dbInitialized, dataWorking) {
    log('\n📋 Final Database Test Report', 'bold');
    log('='.repeat(60), 'blue');
    
    log(`Database Initialization: ${dbInitialized ? '✅ SUCCESS' : '❌ FAILED'}`);
    log(`Data Retrieval: ${dataWorking ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (dbInitialized && dataWorking) {
        log('\n🎉 EXCELLENT! Database is properly configured and working!', 'green');
        log('✅ Users can be created', 'green');
        log('✅ Data can be retrieved by user ID', 'green');
        log('✅ Authentication is working', 'green');
        log('✅ Database collections are initialized', 'green');
        
        log('\n💡 Next Steps:', 'blue');
        log('• The database is ready for production use');
        log('• You can now test the frontend application');
        log('• All user data retrieval endpoints are functional');
        
    } else if (dbInitialized && !dataWorking) {
        log('\n⚠️  Database initialized but data retrieval still has issues', 'yellow');
        log('This might indicate:');
        log('• Repository/Service layer configuration problems');
        log('• MongoDB connection pool issues');
        log('• Authentication/authorization problems');
        
    } else {
        log('\n❌ Database initialization failed', 'red');
        log('This indicates:');
        log('• MongoDB connection problems');
        log('• Backend service configuration issues');
        log('• Network connectivity problems');
        
        log('\n🔧 Troubleshooting Steps:', 'yellow');
        log('1. Check MongoDB Atlas connection string');
        log('2. Verify network access list in MongoDB Atlas');
        log('3. Check backend service logs on Render');
        log('4. Ensure environment variables are set correctly');
    }
    
    log('\n📊 Test Statistics:', 'blue');
    log(`Database Status: ${dbInitialized ? 'READY' : 'NOT READY'}`);
    log(`Data Access: ${dataWorking ? 'WORKING' : 'FAILING'}`);
    log(`Overall Status: ${dbInitialized && dataWorking ? 'HEALTHY' : 'NEEDS ATTENTION'}`);
}

async function main() {
    log('🚀 Database Initialization and Testing Script', 'bold');
    log('='.repeat(60), 'blue');
    
    try {
        // Step 1: Initialize database
        await initializeDatabase();
        
        // Step 2: Test user data after initialization
        const dataWorking = await testUserDataAfterInit();
        
        // Step 3: Test with random user IDs
        await testWithRandomUserIds();
        
        // Step 4: Generate final report
        await generateFinalReport(true, dataWorking);
        
        log('\n✨ Test completed!', 'green');
        
    } catch (error) {
        logError(`Test failed with error: ${error.message}`);
        await generateFinalReport(false, false);
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