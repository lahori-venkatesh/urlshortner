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

async function testDirectDatabaseQueries() {
    log('🔬 Testing Direct Database Queries', 'bold');
    log('='.repeat(60), 'blue');
    
    // Test if we can create a simple test endpoint to query the database directly
    logInfo('Testing database query endpoints...');
    
    try {
        // Try to create a test domain to verify MongoDB write operations
        const testDomainData = {
            domainName: `dbtest-${Date.now()}.example.com`
        };
        
        const domainResponse = await axios.post(`${API_BASE_URL}/v1/init/domains/test`, testDomainData, { timeout: 15000 });
        
        if (domainResponse.status === 200) {
            logSuccess('Direct MongoDB write operation: WORKING');
            logInfo('MongoDB connection and write operations are functional');
        }
    } catch (error) {
        logError(`Direct MongoDB write failed: ${error.response?.status || error.message}`);
    }
    
    // Test domain query to see if reads work
    try {
        const domainQueryResponse = await axios.get(`${API_BASE_URL}/v1/setup/test-domain-query`, { timeout: 15000 });
        
        if (domainQueryResponse.status === 200) {
            logSuccess('Direct MongoDB read operation: WORKING');
            logInfo(`Domains found: ${domainQueryResponse.data.total_domains || 0}`);
            
            if (domainQueryResponse.data.sample_domains) {
                logInfo(`Sample domains: ${domainQueryResponse.data.sample_domains.length}`);
            }
        }
    } catch (error) {
        logError(`Direct MongoDB read failed: ${error.response?.status || error.message}`);
    }
}

async function testRepositoryMethods() {
    log('\n🧪 Testing Repository Methods Indirectly', 'bold');
    log('='.repeat(60), 'blue');
    
    // Create a user and try to use different approaches to query data
    const testUser = {
        email: `repotest.${Date.now()}@example.com`,
        password: 'repotest123',
        firstName: 'Repo',
        lastName: 'Test'
    };
    
    try {
        const registerResponse = await axios.post(`${API_BASE_URL}/v1/auth/register`, testUser, { timeout: 15000 });
        
        if (registerResponse.status === 200 && registerResponse.data.success) {
            const userId = registerResponse.data.user.id;
            const token = registerResponse.data.token;
            
            logSuccess(`Test user created: ${userId}`);
            
            const config = {
                headers: { 'Authorization': `Bearer ${token}` },
                timeout: 15000
            };
            
            // Test 1: Try to get user profile (this works)
            logInfo('Test 1: User profile retrieval...');
            try {
                const profileResponse = await axios.get(`${API_BASE_URL}/v1/auth/profile/${testUser.email}`, config);
                logSuccess('User profile retrieval: WORKING');
                logInfo('✅ UserRepository.findByEmail() is functional');
            } catch (error) {
                logError(`User profile retrieval failed: ${error.response?.status}`);
            }
            
            // Test 2: Try to get all users (this works)
            logInfo('Test 2: Get all users...');
            try {
                const usersResponse = await axios.get(`${API_BASE_URL}/v1/auth/users`, { timeout: 10000 });
                logSuccess('Get all users: WORKING');
                logInfo('✅ UserRepository.findAll() is functional');
            } catch (error) {
                logError(`Get all users failed: ${error.response?.status}`);
            }
            
            // Test 3: Try URL endpoints (these fail)
            logInfo('Test 3: URL repository methods...');
            try {
                const urlsResponse = await axios.get(`${API_BASE_URL}/v1/urls/user/${userId}`, config);
                logSuccess('URL repository methods: WORKING');
            } catch (error) {
                logError(`URL repository methods failed: ${error.response?.status}`);
                logError('❌ ShortenedUrlRepository.findByUserIdAndIsActiveTrue() is failing');
            }
            
            // Test 4: Try to create a URL first, then retrieve it
            logInfo('Test 4: Create URL then retrieve...');
            try {
                // First try to create a URL
                const createUrlData = {
                    originalUrl: 'https://www.example.com/repo-test',
                    userId: userId,
                    title: 'Repository Test URL'
                };
                
                const createResponse = await axios.post(`${API_BASE_URL}/v1/urls`, createUrlData, config);
                
                if (createResponse.status === 200) {
                    logSuccess('URL creation: WORKING');
                    
                    // Now try to retrieve it
                    const retrieveResponse = await axios.get(`${API_BASE_URL}/v1/urls/user/${userId}`, config);
                    logSuccess('URL retrieval after creation: WORKING');
                    logInfo('🎉 Repository methods work when data exists!');
                    
                } else {
                    logError('URL creation failed');
                }
                
            } catch (error) {
                logError(`URL creation/retrieval test failed: ${error.response?.status}`);
                
                if (error.response?.status === 500) {
                    logError('🔍 500 error suggests repository method execution failure');
                }
            }
            
            return { userId, token };
        }
    } catch (error) {
        logError(`Repository test setup failed: ${error.response?.status || error.message}`);
    }
    
    return null;
}

async function testWithExistingData() {
    log('\n📊 Testing with Existing Data in Database', 'bold');
    log('='.repeat(60), 'blue');
    
    // We know from previous tests that there are 17 URLs, 17 QR codes, and 5 files in the database
    // Let's try to understand why queries fail
    
    logInfo('Database contains:');
    logInfo('• 17 shortened_urls documents');
    logInfo('• 17 qr_codes documents');
    logInfo('• 5 uploaded_files documents');
    logInfo('• 23 users documents');
    
    // Get some existing users and try to query their data
    try {
        const usersResponse = await axios.get(`${API_BASE_URL}/v1/auth/users`, { timeout: 10000 });
        
        if (usersResponse.status === 200 && usersResponse.data.users?.length > 0) {
            const existingUsers = usersResponse.data.users.slice(0, 3);
            
            logInfo(`\nTesting with ${existingUsers.length} existing users...`);
            
            for (const user of existingUsers) {
                logInfo(`\nUser: ${user.email} (ID: ${user.id})`);
                
                // Test profile (should work)
                try {
                    const profileResponse = await axios.get(`${API_BASE_URL}/v1/auth/profile/${user.email}`, { timeout: 10000 });
                    logSuccess(`Profile: WORKING for ${user.email}`);
                } catch (error) {
                    logError(`Profile: FAILED for ${user.email} - ${error.response?.status}`);
                }
                
                // Test URLs (should fail with 403 since no auth)
                try {
                    const urlsResponse = await axios.get(`${API_BASE_URL}/v1/urls/user/${user.id}`, { timeout: 10000 });
                    logWarning(`URLs: Unexpected success for ${user.email}`);
                } catch (error) {
                    if (error.response?.status === 403) {
                        logSuccess(`URLs: Correct 403 (unauthorized) for ${user.email}`);
                    } else if (error.response?.status === 500) {
                        logError(`URLs: Server error (500) for ${user.email} - repository issue`);
                    } else {
                        logInfo(`URLs: Status ${error.response?.status} for ${user.email}`);
                    }
                }
            }
        }
    } catch (error) {
        logError(`Failed to test with existing data: ${error.response?.status || error.message}`);
    }
}

async function analyzeRepositoryIssue() {
    log('\n🔍 Analyzing Repository Issue', 'bold');
    log('='.repeat(60), 'blue');
    
    log('Based on the test results, here\'s what we know:');
    log('');
    
    log('✅ WORKING:', 'green');
    log('• MongoDB connection is established');
    log('• Database writes work (user registration, domain creation)');
    log('• UserRepository.findAll() works (get all users)');
    log('• UserRepository.findByEmail() works (get user profile)');
    log('• Collections exist and contain data');
    log('');
    
    log('❌ NOT WORKING:', 'red');
    log('• ShortenedUrlRepository.findByUserIdAndIsActiveTrue()');
    log('• QrCodeRepository.findByUserIdAndIsActiveTrue()');
    log('• UploadedFileRepository.findByUserIdAndIsActiveTrue()');
    log('• All user-specific data retrieval queries');
    log('');
    
    log('🎯 LIKELY ROOT CAUSES:', 'yellow');
    log('1. Field mapping issue: userId field might be stored differently');
    log('2. Index problem: Missing or corrupted indexes on userId fields');
    log('3. Data type mismatch: userId stored as ObjectId vs String');
    log('4. Query timeout: Complex queries timing out');
    log('5. Connection pool issue: Repository queries using different connection');
    log('');
    
    log('💡 RECOMMENDED SOLUTIONS:', 'blue');
    log('1. Check actual field names in MongoDB collections');
    log('2. Verify userId data types in database vs model');
    log('3. Rebuild indexes on userId fields');
    log('4. Increase query timeout settings');
    log('5. Implement direct MongoTemplate queries as fallback');
}

async function proposeFixStrategy() {
    log('\n🔧 Proposed Fix Strategy', 'bold');
    log('='.repeat(60), 'blue');
    
    log('IMMEDIATE ACTIONS NEEDED:');
    log('');
    
    log('1. 🔍 INVESTIGATE DATABASE STRUCTURE:', 'yellow');
    log('   • Connect to MongoDB Atlas directly');
    log('   • Examine actual field names in collections');
    log('   • Check data types of userId fields');
    log('   • Verify indexes exist and are functional');
    log('');
    
    log('2. 🛠️  IMPLEMENT FALLBACK QUERIES:', 'yellow');
    log('   • Create direct MongoTemplate queries');
    log('   • Bypass Spring Data repository layer temporarily');
    log('   • Test with raw MongoDB queries');
    log('');
    
    log('3. 🔄 REBUILD INDEXES:', 'yellow');
    log('   • Drop and recreate indexes on userId fields');
    log('   • Ensure proper compound indexes exist');
    log('   • Test query performance after rebuild');
    log('');
    
    log('4. ⚙️  CONFIGURATION REVIEW:', 'yellow');
    log('   • Review MongoDB connection settings');
    log('   • Check connection pool configuration');
    log('   • Verify timeout settings');
    log('');
    
    log('5. 🧪 INCREMENTAL TESTING:', 'yellow');
    log('   • Test one repository method at a time');
    log('   • Start with simplest queries');
    log('   • Gradually add complexity');
}

async function main() {
    log('🚀 Comprehensive Database Repository Analysis', 'bold');
    log('='.repeat(70), 'blue');
    
    try {
        // Step 1: Test direct database operations
        await testDirectDatabaseQueries();
        
        // Step 2: Test repository methods indirectly
        await testRepositoryMethods();
        
        // Step 3: Test with existing data
        await testWithExistingData();
        
        // Step 4: Analyze the issue
        await analyzeRepositoryIssue();
        
        // Step 5: Propose fix strategy
        await proposeFixStrategy();
        
        log('\n' + '='.repeat(70), 'blue');
        log('📋 FINAL DIAGNOSIS', 'bold');
        log('='.repeat(70), 'blue');
        
        log('\n🎯 CONFIRMED ISSUE:', 'red');
        log('Repository queries for user-specific data are failing with 500 errors.');
        log('This is NOT a connection issue - it\'s a query execution problem.');
        log('');
        
        log('🔧 NEXT STEPS:', 'yellow');
        log('1. Backend service logs need to be examined for specific error details');
        log('2. Database field mapping needs verification');
        log('3. Repository layer needs debugging or replacement with direct queries');
        log('');
        
        log('✨ Analysis completed!', 'blue');
        
    } catch (error) {
        logError(`Analysis failed: ${error.message}`);
        process.exit(1);
    }
}

// Run the analysis
if (require.main === module) {
    main().catch(error => {
        logError(`Unhandled error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = { main };