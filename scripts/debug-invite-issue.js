const axios = require('axios');

// Configuration
const BACKEND_URL = 'https://urlshortner-1-hpyu.onrender.com/api';
const TEST_EMAIL = 'venkateshlahori970@gmail.com';

async function debugInviteIssue() {
    console.log('🔍 Debugging Invite Member Issue...\n');
    
    try {
        // Let's first check what happens when we make the invite request
        // with some test data to see the exact error
        
        console.log('Testing invite endpoint with sample data...');
        
        const testInviteData = {
            userId: 'test-user-id',
            email: TEST_EMAIL,
            role: 'MEMBER'
        };
        
        console.log('Request URL:', `${BACKEND_URL}/v1/teams/test-team-id/invite`);
        console.log('Request Data:', JSON.stringify(testInviteData, null, 2));
        
        const response = await axios.post(`${BACKEND_URL}/v1/teams/test-team-id/invite`, testInviteData, {
            headers: {
                'Content-Type': 'application/json',
                // We'll test without auth first to see the error
            }
        });
        
        console.log('✅ Response:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ Expected error occurred:');
        
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Status Text:', error.response.statusText);
            console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
            console.log('Response Headers:', JSON.stringify(error.response.headers, null, 2));
            
            // Check if it's an authentication issue
            if (error.response.status === 401) {
                console.log('\n🔍 This appears to be an authentication issue.');
                console.log('The invite endpoint requires authentication.');
            } else if (error.response.status === 400) {
                console.log('\n🔍 This is a 400 Bad Request error.');
                console.log('This could be due to:');
                console.log('- Invalid request data format');
                console.log('- Missing required fields');
                console.log('- Business logic validation failure');
            }
        } else {
            console.log('Network Error:', error.message);
        }
    }
}

async function testValidationScenarios() {
    console.log('\n🧪 Testing Different Validation Scenarios...\n');
    
    const scenarios = [
        {
            name: 'Empty userId',
            data: { userId: '', email: TEST_EMAIL, role: 'MEMBER' }
        },
        {
            name: 'Missing userId',
            data: { email: TEST_EMAIL, role: 'MEMBER' }
        },
        {
            name: 'Empty email',
            data: { userId: 'test-user', email: '', role: 'MEMBER' }
        },
        {
            name: 'Missing email',
            data: { userId: 'test-user', role: 'MEMBER' }
        },
        {
            name: 'Invalid role',
            data: { userId: 'test-user', email: TEST_EMAIL, role: 'INVALID_ROLE' }
        },
        {
            name: 'Missing role',
            data: { userId: 'test-user', email: TEST_EMAIL }
        }
    ];
    
    for (const scenario of scenarios) {
        console.log(`--- Testing: ${scenario.name} ---`);
        try {
            const response = await axios.post(`${BACKEND_URL}/v1/teams/test-team-id/invite`, scenario.data, {
                headers: { 'Content-Type': 'application/json' }
            });
            console.log('✅ Unexpected success:', response.data);
        } catch (error) {
            if (error.response) {
                console.log(`❌ Status ${error.response.status}:`, error.response.data);
            } else {
                console.log('❌ Network error:', error.message);
            }
        }
        console.log('');
    }
}

// Run the debug
debugInviteIssue()
    .then(() => testValidationScenarios())
    .catch(console.error);