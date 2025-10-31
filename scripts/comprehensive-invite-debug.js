const axios = require('axios');

// Configuration
const BACKEND_URL = 'https://urlshortner-1-hpyu.onrender.com/api';
const TEST_EMAIL = 'venkateshlahori970@gmail.com';

async function debugInviteIssueComprehensive() {
    console.log('🔍 Comprehensive Invite Member Debug...\n');
    
    // Step 1: Test authentication endpoints
    console.log('=== STEP 1: Testing Authentication ===');
    
    // Create a unique test user for this session
    const timestamp = Date.now();
    const testUserEmail = `invitetest.${timestamp}@example.com`;
    const testUserPassword = 'InviteTest123!';
    
    let authToken = null;
    let currentUserId = null;
    
    try {
        // Register a new test user
        console.log('Registering new test user:', testUserEmail);
        const registerResponse = await axios.post(`${BACKEND_URL}/v1/auth/register`, {
            email: testUserEmail,
            password: testUserPassword,
            firstName: 'Invite',
            lastName: 'Test'
        });
        
        if (registerResponse.data.success) {
            console.log('✅ Registration successful');
            authToken = registerResponse.data.token;
            currentUserId = registerResponse.data.user.id;
            console.log('User ID:', currentUserId);
            console.log('Token length:', authToken?.length);
        } else {
            console.log('❌ Registration failed:', registerResponse.data);
            return;
        }
    } catch (error) {
        console.log('❌ Registration error:', error.response?.data || error.message);
        
        // If registration failed, try to login (user might already exist)
        try {
            console.log('Attempting to login with existing credentials...');
            const loginResponse = await axios.post(`${BACKEND_URL}/v1/auth/login`, {
                email: testUserEmail,
                password: testUserPassword
            });
            
            if (loginResponse.data.success) {
                authToken = loginResponse.data.token;
                currentUserId = loginResponse.data.user.id;
                console.log('✅ Login successful');
                console.log('User ID:', currentUserId);
            } else {
                console.log('❌ Login also failed:', loginResponse.data);
                return;
            }
        } catch (loginError) {
            console.log('❌ Both registration and login failed');
            return;
        }
    }
    
    // Step 2: Test team operations
    console.log('\n=== STEP 2: Testing Team Operations ===');
    
    let testTeamId = null;
    
    try {
        // Get existing teams
        console.log('Getting user teams...');
        const teamsResponse = await axios.get(`${BACKEND_URL}/v1/teams/my?userId=${currentUserId}`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        
        console.log('Teams response:', teamsResponse.data);
        
        if (teamsResponse.data.teams && teamsResponse.data.teams.length > 0) {
            testTeamId = teamsResponse.data.teams[0].id;
            console.log('✅ Using existing team:', testTeamId);
        } else {
            // Create a test team
            console.log('Creating a test team...');
            const createTeamResponse = await axios.post(`${BACKEND_URL}/v1/teams`, {
                teamName: 'Debug Test Team',
                description: 'Team for debugging invite functionality',
                userId: currentUserId
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            
            console.log('Create team response:', createTeamResponse.data);
            
            if (createTeamResponse.data.success) {
                testTeamId = createTeamResponse.data.team.id;
                console.log('✅ Created test team:', testTeamId);
            } else {
                console.log('❌ Team creation failed:', createTeamResponse.data);
                return;
            }
        }
    } catch (error) {
        console.log('❌ Team operations error:', error.response?.data || error.message);
        return;
    }
    
    // Step 3: Test the invite functionality with detailed logging
    console.log('\n=== STEP 3: Testing Invite Functionality ===');
    
    const invitePayload = {
        userId: currentUserId,
        email: TEST_EMAIL,
        role: 'MEMBER'
    };
    
    console.log('Invite payload:', JSON.stringify(invitePayload, null, 2));
    console.log('Request URL:', `${BACKEND_URL}/v1/teams/${testTeamId}/invite`);
    console.log('Auth token (first 20 chars):', authToken?.substring(0, 20) + '...');
    
    try {
        const inviteResponse = await axios.post(`${BACKEND_URL}/v1/teams/${testTeamId}/invite`, invitePayload, {
            headers: { 
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Invite sent successfully!');
        console.log('Response:', JSON.stringify(inviteResponse.data, null, 2));
        
    } catch (error) {
        console.log('❌ Invite failed with detailed error:');
        
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Status Text:', error.response.statusText);
            console.log('Response Data:', JSON.stringify(error.response.data, null, 2));
            console.log('Response Headers:', JSON.stringify(error.response.headers, null, 2));
            
            // Analyze the error
            if (error.response.status === 400) {
                console.log('\n🔍 400 Bad Request Analysis:');
                const errorMessage = error.response.data?.message || 'No error message';
                console.log('Error message:', errorMessage);
                
                // Check for common issues
                if (errorMessage.includes('User ID is required')) {
                    console.log('❌ Issue: Missing or empty userId');
                } else if (errorMessage.includes('Email is required')) {
                    console.log('❌ Issue: Missing or empty email');
                } else if (errorMessage.includes('Team not found')) {
                    console.log('❌ Issue: Invalid team ID');
                } else if (errorMessage.includes('Insufficient permissions')) {
                    console.log('❌ Issue: User lacks permission to invite members');
                } else if (errorMessage.includes('already a team member')) {
                    console.log('❌ Issue: User is already a member of this team');
                } else if (errorMessage.includes('Invite already sent')) {
                    console.log('❌ Issue: Pending invite already exists for this email');
                } else if (errorMessage.includes('member limit reached')) {
                    console.log('❌ Issue: Team has reached its member limit');
                } else {
                    console.log('❌ Issue: Unknown validation error');
                }
            } else if (error.response.status === 403) {
                console.log('\n🔍 403 Forbidden Analysis:');
                console.log('❌ Issue: Authentication/Authorization problem');
            } else if (error.response.status === 401) {
                console.log('\n🔍 401 Unauthorized Analysis:');
                console.log('❌ Issue: Invalid or expired token');
            }
        } else {
            console.log('Network Error:', error.message);
        }
    }
    
    // Step 4: Test with different email formats
    console.log('\n=== STEP 4: Testing Different Email Scenarios ===');
    
    const emailTests = [
        { name: 'Valid Gmail', email: 'test.invite@gmail.com' },
        { name: 'Valid Yahoo', email: 'test.invite@yahoo.com' },
        { name: 'Valid Corporate', email: 'test.invite@company.com' },
        { name: 'Email with plus', email: 'test+invite@gmail.com' },
        { name: 'Email with dots', email: 'test.invite.user@gmail.com' }
    ];
    
    for (const test of emailTests) {
        console.log(`\n--- Testing: ${test.name} (${test.email}) ---`);
        
        try {
            const testPayload = {
                userId: currentUserId,
                email: test.email,
                role: 'MEMBER'
            };
            
            const response = await axios.post(`${BACKEND_URL}/v1/teams/${testTeamId}/invite`, testPayload, {
                headers: { 
                    Authorization: `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ Success:', response.data.message);
            
        } catch (error) {
            if (error.response?.status === 400) {
                console.log('❌ 400 Error:', error.response.data?.message || 'Unknown error');
            } else {
                console.log('❌ Other Error:', error.response?.status, error.response?.data?.message || error.message);
            }
        }
    }
}

// Run the comprehensive debug
debugInviteIssueComprehensive().catch(console.error);