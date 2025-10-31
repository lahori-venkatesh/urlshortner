// Frontend Debug Helper
// This script can be run in the browser console to debug invite issues

console.log('🔍 Frontend Invite Debug Helper');

// Function to check authentication state
function checkAuthState() {
    console.log('\n=== Authentication State ===');
    
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('Token exists:', !!token);
    console.log('Token length:', token?.length || 0);
    console.log('Token preview:', token?.substring(0, 20) + '...' || 'None');
    
    console.log('User data exists:', !!user);
    
    if (user) {
        try {
            const userData = JSON.parse(user);
            console.log('User ID:', userData.id);
            console.log('User email:', userData.email);
            console.log('User name:', userData.firstName, userData.lastName);
        } catch (e) {
            console.log('❌ Error parsing user data:', e.message);
        }
    }
}

// Function to test API connectivity
async function testAPIConnectivity() {
    console.log('\n=== API Connectivity Test ===');
    
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user.id) {
        console.log('❌ Missing authentication data');
        return;
    }
    
    try {
        // Test getting user teams
        console.log('Testing teams endpoint...');
        const response = await fetch(`/api/v1/teams/my?userId=${user.id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        console.log('Teams response status:', response.status);
        console.log('Teams response:', data);
        
        if (data.success && data.teams.length > 0) {
            const teamId = data.teams[0].id;
            console.log('Using team ID:', teamId);
            
            // Test invite endpoint
            console.log('\nTesting invite endpoint...');
            const inviteResponse = await fetch(`/api/v1/teams/${teamId}/invite`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user.id,
                    email: 'venkateshlahori970@gmail.com',
                    role: 'MEMBER'
                })
            });
            
            const inviteData = await inviteResponse.json();
            console.log('Invite response status:', inviteResponse.status);
            console.log('Invite response:', inviteData);
            
            if (inviteResponse.status === 400) {
                console.log('🔍 400 Error Analysis:');
                console.log('Error message:', inviteData.message);
                console.log('This suggests a validation issue in the request data');
            }
        } else {
            console.log('❌ No teams found or teams request failed');
        }
        
    } catch (error) {
        console.log('❌ API test error:', error.message);
    }
}

// Function to check current page context
function checkPageContext() {
    console.log('\n=== Page Context ===');
    console.log('Current URL:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
    
    // Check if we're on a team page
    const teamIdMatch = window.location.pathname.match(/\/teams\/([^\/]+)/);
    if (teamIdMatch) {
        console.log('Current team ID from URL:', teamIdMatch[1]);
    }
    
    // Check React context if available
    if (window.React) {
        console.log('React is available');
    }
}

// Function to simulate the invite request
async function simulateInviteRequest(teamId, email = 'venkateshlahori970@gmail.com') {
    console.log('\n=== Simulating Invite Request ===');
    console.log('Team ID:', teamId);
    console.log('Email:', email);
    
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token || !user.id) {
        console.log('❌ Missing authentication data');
        return;
    }
    
    const payload = {
        userId: user.id,
        email: email,
        role: 'MEMBER'
    };
    
    console.log('Request payload:', payload);
    
    try {
        const response = await fetch(`/api/v1/teams/${teamId}/invite`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        console.log('Response data:', data);
        
        if (response.status === 400) {
            console.log('\n🔍 Detailed 400 Error Analysis:');
            console.log('- Check if userId is valid:', !!payload.userId);
            console.log('- Check if email is valid:', !!payload.email);
            console.log('- Check if role is valid:', payload.role);
            console.log('- Check if teamId is valid:', !!teamId);
        }
        
        return { status: response.status, data };
        
    } catch (error) {
        console.log('❌ Request error:', error.message);
        return { error: error.message };
    }
}

// Main debug function
async function runFullDebug() {
    console.log('🚀 Running Full Frontend Debug...\n');
    
    checkAuthState();
    checkPageContext();
    await testAPIConnectivity();
    
    console.log('\n✅ Debug complete. Check the logs above for issues.');
    console.log('\n💡 To test invite with a specific team:');
    console.log('   simulateInviteRequest("your-team-id", "email@example.com")');
}

// Export functions to global scope for easy access
window.debugInvite = {
    checkAuthState,
    testAPIConnectivity,
    checkPageContext,
    simulateInviteRequest,
    runFullDebug
};

console.log('\n💡 Available debug functions:');
console.log('- debugInvite.checkAuthState()');
console.log('- debugInvite.testAPIConnectivity()');
console.log('- debugInvite.checkPageContext()');
console.log('- debugInvite.simulateInviteRequest(teamId, email)');
console.log('- debugInvite.runFullDebug()');
console.log('\nRun debugInvite.runFullDebug() to start debugging!');