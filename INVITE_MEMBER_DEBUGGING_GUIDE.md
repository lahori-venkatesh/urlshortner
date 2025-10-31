# 🔍 Invite Member Debugging Guide

## Issue Summary
You're experiencing a **400 Bad Request** error when trying to invite `venkateshlahori970@gmail.com` to a team. Our backend testing shows the API is working correctly, so this is likely a frontend issue.

## ✅ What We've Confirmed
- ✅ Backend API is working correctly
- ✅ Authentication system is functional
- ✅ Team creation works
- ✅ Invite endpoint accepts the email `venkateshlahori970@gmail.com`
- ✅ Various email formats work fine

## 🔍 Debugging Steps

### Step 1: Check Browser Console
1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Try to invite the member again
4. Look for any error messages or failed network requests

### Step 2: Check Network Tab
1. In Developer Tools, go to the **Network** tab
2. Try to invite the member again
3. Look for the POST request to `/api/v1/teams/{teamId}/invite`
4. Check the request payload and response

### Step 3: Run Frontend Debug Script
1. Copy and paste this code into your browser console:

```javascript
// Quick debug function
async function debugInviteIssue() {
    console.log('🔍 Debugging Invite Issue...');
    
    // Check authentication
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('Token exists:', !!token);
    console.log('User exists:', !!user);
    
    if (user) {
        const userData = JSON.parse(user);
        console.log('User ID:', userData.id);
        console.log('User email:', userData.email);
        
        // Get teams
        try {
            const response = await fetch(`/api/v1/teams/my?userId=${userData.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            console.log('Teams:', data);
            
            if (data.success && data.teams.length > 0) {
                const teamId = data.teams[0].id;
                console.log('Testing invite with team:', teamId);
                
                // Test invite
                const inviteResponse = await fetch(`/api/v1/teams/${teamId}/invite`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        userId: userData.id,
                        email: 'venkateshlahori970@gmail.com',
                        role: 'MEMBER'
                    })
                });
                
                const inviteData = await inviteResponse.json();
                console.log('Invite response status:', inviteResponse.status);
                console.log('Invite response:', inviteData);
                
                if (inviteResponse.status === 400) {
                    console.log('❌ 400 Error Details:', inviteData.message);
                }
            }
        } catch (error) {
            console.error('Debug error:', error);
        }
    }
}

// Run the debug
debugInviteIssue();
```

## 🚨 Common Issues & Solutions

### Issue 1: Missing Authentication Token
**Symptoms:** 403 Forbidden error
**Solution:** 
- Log out and log back in
- Clear browser cache and localStorage

### Issue 2: Invalid User ID
**Symptoms:** 400 Bad Request with "User ID is required"
**Solution:**
- Check if `user.id` is available in localStorage
- Refresh the page to reload user data

### Issue 3: Invalid Team ID
**Symptoms:** 400 Bad Request with "Team not found"
**Solution:**
- Make sure you're on the correct team page
- Check the URL for the correct team ID

### Issue 4: Duplicate Invite
**Symptoms:** 400 Bad Request with "Invite already sent"
**Solution:**
- Check if there's already a pending invite for this email
- Wait for the previous invite to expire or be accepted

### Issue 5: Permission Issues
**Symptoms:** 400 Bad Request with "Insufficient permissions"
**Solution:**
- Make sure you're the team owner or admin
- Check your role in the team

## 🔧 Quick Fixes

### Fix 1: Clear Authentication Data
```javascript
// Run in browser console
localStorage.removeItem('token');
localStorage.removeItem('user');
location.reload();
// Then log in again
```

### Fix 2: Check Current Team Context
```javascript
// Run in browser console
console.log('Current URL:', window.location.href);
console.log('Team ID from URL:', window.location.pathname.match(/\/teams\/([^\/]+)/)?.[1]);
```

### Fix 3: Verify API Endpoint
```javascript
// Run in browser console
console.log('API Base URL:', process.env.REACT_APP_API_URL || 'Not set');
```

## 📋 Information to Collect

When reporting the issue, please provide:

1. **Browser Console Errors:** Any red error messages
2. **Network Request Details:** 
   - Request URL
   - Request payload
   - Response status and body
3. **User Context:**
   - Are you logged in?
   - What's your role in the team?
   - Which team are you trying to invite to?
4. **Environment:**
   - Browser type and version
   - Any browser extensions that might interfere

## 🎯 Most Likely Causes

Based on our analysis, the issue is most likely:

1. **Frontend Authentication State** - The user ID or token might not be properly available
2. **Team Context** - The team ID might be incorrect or missing
3. **Browser Cache** - Stale authentication data
4. **Network Issues** - Intermittent connectivity problems

## 📞 Next Steps

1. Run the debug script above
2. Check the browser console for errors
3. Try the quick fixes
4. If the issue persists, provide the debug output for further analysis

The backend is confirmed working, so this should be resolvable with frontend debugging! 🚀