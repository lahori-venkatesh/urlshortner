const axios = require('axios');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'https://urlshortner-1-hpyu.onrender.com/api';
const TEST_EMAIL = 'venkateshlahori970@gmail.com';

async function testInviteMember() {
    console.log('🧪 Testing Invite Member Functionality...\n');
    
    try {
        // Step 1: Login to get user credentials
        console.log('1. Logging in to get user credentials...');
        const loginResponse = await axios.post(`${BACKEND_URL}/v1/auth/login`, {
            email: 'test@example.com', // You'll need to use a valid test user
            password: 'testpassword'
        });
        
        if (!loginResponse.data.success) {
            throw new Error('Login failed: ' + loginResponse.data.message);
        }
        
        const token = loginResponse.data.token;
        const userId = loginResponse.data.user.id;
        
        console.log('✅ Login successful');
        console.log('User ID:', userId);
        
        // Step 2: Get or create a team
        console.log('\n2. Getting user teams...');
        const teamsResponse = await axios.get(`${BACKEND_URL}/v1/teams?userId=${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        let teamId;
        if (teamsResponse.data.teams && teamsResponse.data.teams.length > 0) {
            teamId = teamsResponse.data.teams[0].id;
            console.log('✅ Using existing team:', teamId);
        } else {
            // Create a test team
            console.log('Creating a test team...');
            const createTeamResponse = await axios.post(`${BACKEND_URL}/v1/teams`, {
                name: 'Test Team for Invite',
                description: 'Test team for debugging invite functionality',
                userId: userId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!createTeamResponse.data.success) {
                throw new Error('Team creation failed: ' + createTeamResponse.data.message);
            }
            
            teamId = createTeamResponse.data.team.id;
            console.log('✅ Created test team:', teamId);
        }
        
        // Step 3: Test the invite functionality
        console.log('\n3. Testing invite member functionality...');
        console.log('Inviting email:', TEST_EMAIL);
        
        const inviteData = {
            userId: userId,
            email: TEST_EMAIL,
            role: 'MEMBER'
        };
        
        console.log('Invite payload:', JSON.stringify(inviteData, null, 2));
        
        const inviteResponse = await axios.post(`${BACKEND_URL}/v1/teams/${teamId}/invite`, inviteData, {
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Invite sent successfully!');
        console.log('Response:', JSON.stringify(inviteResponse.data, null, 2));
        
    } catch (error) {
        console.error('❌ Error testing invite functionality:');
        
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Status Text:', error.response.statusText);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
            console.error('Request URL:', error.config?.url);
            console.error('Request Method:', error.config?.method);
            console.error('Request Data:', error.config?.data);
        } else if (error.request) {
            console.error('No response received:', error.message);
        } else {
            console.error('Error:', error.message);
        }
    }
}

// Helper function to test with different scenarios
async function testInviteScenarios() {
    console.log('🧪 Testing Multiple Invite Scenarios...\n');
    
    const scenarios = [
        {
            name: 'Valid invite with MEMBER role',
            data: { email: TEST_EMAIL, role: 'MEMBER' }
        },
        {
            name: 'Valid invite with ADMIN role',
            data: { email: TEST_EMAIL, role: 'ADMIN' }
        },
        {
            name: 'Invalid email format',
            data: { email: 'invalid-email', role: 'MEMBER' }
        },
        {
            name: 'Empty email',
            data: { email: '', role: 'MEMBER' }
        },
        {
            name: 'Missing role',
            data: { email: TEST_EMAIL }
        }
    ];
    
    for (const scenario of scenarios) {
        console.log(`\n--- Testing: ${scenario.name} ---`);
        // Implementation would go here
    }
}

// Run the test
if (require.main === module) {
    testInviteMember().catch(console.error);
}

module.exports = { testInviteMember, testInviteScenarios };