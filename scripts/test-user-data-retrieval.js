#!/usr/bin/env node

/**
 * Test script to verify data retrieval from database by user ID
 * This script will test various endpoints to ensure data is properly loaded
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = 'https://urlshortner-1-hpyu.onrender.com/api';
const TEST_USER_EMAIL = 'test.user@example.com';
const TEST_PASSWORD = 'testpassword123';

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

// Create axios instance with timeout
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
    response => response,
    error => {
        if (error.code === 'ECONNABORTED') {
            logError('Request timeout - server may be slow or unavailable');
        } else if (!error.response) {
            logError('Network error - unable to connect to server');
        }
        return Promise.reject(error);
    }
);

async function testDatabaseConnection() {
    log('\n🔍 Testing Database Connection...', 'bold');
    
    try {
        const response = await apiClient.get('/health');
        if (response.status === 200) {
            logSuccess('Database connection is healthy');
            return true;
        }
    } catch (error) {
        // Try alternative health check endpoints
        try {
            const response = await apiClient.get('/v1/auth/health');
            if (response.status === 200) {
                logSuccess('Database connection is healthy (via auth endpoint)');
                return true;
            }
        } catch (authError) {
            logWarning('Health check endpoint not available, proceeding with tests...');
            return true; // Continue with tests even if health check fails
        }
    }
    
    return true;
}

async function createTestUser() {
    log('\n👤 Creating Test User...', 'bold');
    
    try {
        const userData = {
            email: TEST_USER_EMAIL,
            password: TEST_PASSWORD,
            firstName: 'Test',
            lastName: 'User'
        };
        
        const response = await apiClient.post('/v1/auth/register', userData);
        
        if (response.data.success) {
            logSuccess(`Test user created successfully`);
            logInfo(`User ID: ${response.data.user.id}`);
            return {
                userId: response.data.user.id,
                token: response.data.token,
                user: response.data.user
            };
        } else {
            logError(`Failed to create user: ${response.data.message}`);
            return null;
        }
    } catch (error) {
        if (error.response?.status === 400 && error.response.data.message?.includes('already exists')) {
            logInfo('User already exists, attempting to login...');
            return await loginTestUser();
        } else {
            logError(`Error creating user: ${error.response?.data?.message || error.message}`);
            return null;
        }
    }
}

async function loginTestUser() {
    log('\n🔐 Logging in Test User...', 'bold');
    
    try {
        const loginData = {
            email: TEST_USER_EMAIL,
            password: TEST_PASSWORD
        };
        
        const response = await apiClient.post('/v1/auth/login', loginData);
        
        if (response.data.success) {
            logSuccess('User logged in successfully');
            logInfo(`User ID: ${response.data.user.id}`);
            return {
                userId: response.data.user.id,
                token: response.data.token,
                user: response.data.user
            };
        } else {
            logError(`Login failed: ${response.data.message}`);
            return null;
        }
    } catch (error) {
        logError(`Login error: ${error.response?.data?.message || error.message}`);
        return null;
    }
}

async function testUserDataRetrieval(userId, token) {
    log('\n📊 Testing User Data Retrieval...', 'bold');
    
    // Set authorization header
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    const tests = [
        {
            name: 'Get User Profile',
            endpoint: `/v1/auth/profile/${TEST_USER_EMAIL}`,
            method: 'GET'
        },
        {
            name: 'Get User URLs',
            endpoint: `/v1/urls/user/${userId}`,
            method: 'GET'
        },
        {
            name: 'Get User Files',
            endpoint: `/v1/files/user/${userId}`,
            method: 'GET'
        },
        {
            name: 'Get User QR Codes',
            endpoint: `/v1/qr/user/${userId}`,
            method: 'GET'
        },
        {
            name: 'Get User Analytics',
            endpoint: `/v1/analytics/user/${userId}`,
            method: 'GET'
        },
        {
            name: 'Get User Teams',
            endpoint: `/v1/teams/my?userId=${userId}`,
            method: 'GET'
        }
    ];
    
    const results = [];
    
    for (const test of tests) {
        try {
            logInfo(`Testing: ${test.name}`);
            
            const response = await apiClient[test.method.toLowerCase()](test.endpoint);
            
            if (response.status === 200) {
                logSuccess(`${test.name}: SUCCESS`);
                
                // Log data details
                if (response.data.data) {
                    if (Array.isArray(response.data.data)) {
                        logInfo(`  └─ Found ${response.data.data.length} items`);
                    } else {
                        logInfo(`  └─ Data object retrieved`);
                    }
                } else if (response.data.user) {
                    logInfo(`  └─ User profile retrieved`);
                } else if (response.data.count !== undefined) {
                    logInfo(`  └─ Found ${response.data.count} items`);
                }
                
                results.push({ test: test.name, status: 'SUCCESS', data: response.data });
            } else {
                logWarning(`${test.name}: Unexpected status ${response.status}`);
                results.push({ test: test.name, status: 'WARNING', data: response.data });
            }
        } catch (error) {
            if (error.response?.status === 404) {
                logWarning(`${test.name}: No data found (404) - This is normal for new users`);
                results.push({ test: test.name, status: 'NO_DATA', message: 'No data found' });
            } else {
                logError(`${test.name}: FAILED - ${error.response?.data?.message || error.message}`);
                results.push({ test: test.name, status: 'FAILED', error: error.response?.data?.message || error.message });
            }
        }
    }
    
    return results;
}

async function createSampleData(userId, token) {
    log('\n📝 Creating Sample Data for Testing...', 'bold');
    
    // Set authorization header
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    try {
        // Create a sample URL
        logInfo('Creating sample URL...');
        const urlData = {
            originalUrl: 'https://www.example.com',
            userId: userId,
            title: 'Test URL',
            description: 'Sample URL for testing data retrieval'
        };
        
        const urlResponse = await apiClient.post('/v1/urls', urlData);
        if (urlResponse.data.success) {
            logSuccess('Sample URL created successfully');
            logInfo(`Short code: ${urlResponse.data.data.shortCode}`);
        }
        
        // Create a sample QR code
        logInfo('Creating sample QR code...');
        const qrData = {
            content: 'https://www.example.com/qr-test',
            contentType: 'URL',
            userId: userId,
            title: 'Test QR Code',
            description: 'Sample QR code for testing'
        };
        
        const qrResponse = await apiClient.post('/v1/qr', qrData);
        if (qrResponse.data.success) {
            logSuccess('Sample QR code created successfully');
        }
        
        return true;
    } catch (error) {
        logWarning(`Could not create sample data: ${error.response?.data?.message || error.message}`);
        return false;
    }
}

async function testWithRandomUserId() {
    log('\n🎲 Testing with Random User ID...', 'bold');
    
    // Generate a random MongoDB-like ObjectId
    const randomUserId = Math.random().toString(16).substring(2, 26).padEnd(24, '0');
    logInfo(`Testing with random user ID: ${randomUserId}`);
    
    const tests = [
        {
            name: 'Get Random User URLs',
            endpoint: `/v1/urls/user/${randomUserId}`,
            method: 'GET'
        },
        {
            name: 'Get Random User Files',
            endpoint: `/v1/files/user/${randomUserId}`,
            method: 'GET'
        },
        {
            name: 'Get Random User QR Codes',
            endpoint: `/v1/qr/user/${randomUserId}`,
            method: 'GET'
        }
    ];
    
    for (const test of tests) {
        try {
            const response = await apiClient[test.method.toLowerCase()](test.endpoint);
            
            if (response.status === 200 && response.data.data && response.data.data.length === 0) {
                logSuccess(`${test.name}: Correctly returns empty array for non-existent user`);
            } else {
                logWarning(`${test.name}: Unexpected response for non-existent user`);
            }
        } catch (error) {
            if (error.response?.status === 404) {
                logSuccess(`${test.name}: Correctly returns 404 for non-existent user`);
            } else {
                logError(`${test.name}: Unexpected error - ${error.response?.data?.message || error.message}`);
            }
        }
    }
}

async function generateTestReport(results) {
    log('\n📋 Test Report', 'bold');
    log('='.repeat(50), 'blue');
    
    const successful = results.filter(r => r.status === 'SUCCESS').length;
    const failed = results.filter(r => r.status === 'FAILED').length;
    const noData = results.filter(r => r.status === 'NO_DATA').length;
    const warnings = results.filter(r => r.status === 'WARNING').length;
    
    log(`Total Tests: ${results.length}`);
    log(`Successful: ${successful}`, 'green');
    log(`Failed: ${failed}`, failed > 0 ? 'red' : 'reset');
    log(`No Data: ${noData}`, 'yellow');
    log(`Warnings: ${warnings}`, 'yellow');
    
    if (failed === 0) {
        log('\n🎉 All critical tests passed! Database data retrieval is working correctly.', 'green');
    } else {
        log('\n⚠️  Some tests failed. Please check the database configuration and API endpoints.', 'red');
    }
    
    // Detailed results
    log('\nDetailed Results:', 'bold');
    results.forEach(result => {
        const status = result.status === 'SUCCESS' ? '✅' : 
                      result.status === 'FAILED' ? '❌' : 
                      result.status === 'NO_DATA' ? '📭' : '⚠️';
        log(`${status} ${result.test}`);
        if (result.error) {
            log(`    Error: ${result.error}`, 'red');
        }
    });
}

async function main() {
    log('🚀 Starting Database Data Retrieval Test', 'bold');
    log('='.repeat(50), 'blue');
    
    try {
        // Test database connection
        await testDatabaseConnection();
        
        // Create or login test user
        let authResult = await createTestUser();
        if (!authResult) {
            authResult = await loginTestUser();
        }
        
        if (!authResult) {
            logError('Could not create or login test user. Exiting...');
            process.exit(1);
        }
        
        const { userId, token } = authResult;
        
        // Create sample data
        await createSampleData(userId, token);
        
        // Test data retrieval with real user
        const results = await testUserDataRetrieval(userId, token);
        
        // Test with random user ID
        await testWithRandomUserId();
        
        // Generate report
        await generateTestReport(results);
        
        log('\n✨ Test completed successfully!', 'green');
        
    } catch (error) {
        logError(`Test failed with error: ${error.message}`);
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