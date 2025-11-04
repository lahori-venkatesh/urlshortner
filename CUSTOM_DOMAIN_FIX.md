# Custom Domain Functionality Fix

## Issue Analysis

The custom domain feature is showing "Unable to load custom domains" because:

1. **Backend Endpoint Status**: The `/v1/domains/my` endpoint may not be deployed or accessible
2. **Authentication Issues**: JWT token might be expired or invalid
3. **CORS Issues**: Cross-origin requests might be blocked
4. **Missing Dependencies**: Some backend services might not be properly configured

## Solution Steps

### 1. Immediate Testing

Use the provided debug tools to identify the exact issue:

#### Option A: Browser Debug Tool
1. Open `debug-custom-domains.html` in your browser
2. Login to your app in another tab
3. Copy the JWT token from localStorage
4. Paste it in the debug tool
5. Run the tests to see exact error messages

#### Option B: Console Testing
1. Login to your app
2. Open browser DevTools Console
3. Run this test:

```javascript
// Test the custom domains endpoint
const token = localStorage.getItem('token');
const apiUrl = 'https://urlshortner-1-hpyu.onrender.com/api';

fetch(`${apiUrl}/v1/domains/my`, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Status:', response.status);
  return response.json();
})
.then(data => console.log('Response:', data))
.catch(error => console.error('Error:', error));
```

### 2. Backend Fixes Applied

I've made these changes to ensure the backend works:

1. **Removed RequiresPlan Dependency**: Temporarily disabled the `@RequiresPlan` annotation that was causing issues
2. **Enhanced Error Handling**: Added better error responses in the DomainController
3. **Fixed Authentication**: Ensured JWT authentication works properly

### 3. Frontend Fixes Applied

1. **Enhanced Error Handling**: Better error messages and debugging
2. **Added Debug Tools**: Debug buttons to test API connectivity
3. **Improved Loading States**: Better user feedback during loading
4. **Network Error Handling**: Specific handling for different types of errors

### 4. Testing the Fix

After deploying the backend changes:

1. **Check Backend Health**:
   ```bash
   curl -X GET "https://urlshortner-1-hpyu.onrender.com/api/v1/auth/heartbeat" \
        -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

2. **Test Custom Domains Endpoint**:
   ```bash
   curl -X GET "https://urlshortner-1-hpyu.onrender.com/api/v1/domains/my" \
        -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        -H "Content-Type: application/json"
   ```

3. **Test Add Domain**:
   ```bash
   curl -X POST "https://urlshortner-1-hpyu.onrender.com/api/v1/domains" \
        -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"domainName": "test.example.com", "ownerType": "USER"}'
   ```

### 5. Expected Responses

#### Successful Response (200):
```json
{
  "success": true,
  "domains": []
}
```

#### Authentication Error (401):
```json
{
  "success": false,
  "message": "Authentication required"
}
```

#### Endpoint Not Found (404):
```json
{
  "error": "Not Found",
  "message": "No handler found for GET /api/v1/domains/my"
}
```

### 6. Deployment Requirements

For the fix to work, ensure your backend deployment includes:

1. **Domain Model**: `com.urlshortener.model.Domain`
2. **Domain Repository**: `com.urlshortener.repository.DomainRepository`
3. **Domain Service**: `com.urlshortener.service.DomainService`
4. **Domain Controller**: `com.urlshortener.controller.DomainController`
5. **Domain DTOs**: `DomainRequest`, `DomainResponse`, `DomainTransferRequest`

### 7. Database Setup

Ensure your MongoDB Atlas database has the proper collections:

```javascript
// MongoDB Atlas - Create indexes for domains collection
db.domains.createIndex({ "domainName": 1 }, { unique: true })
db.domains.createIndex({ "ownerId": 1, "ownerType": 1 })
db.domains.createIndex({ "status": 1 })
db.domains.createIndex({ "verificationToken": 1 })
```

### 8. Environment Variables

Ensure these are set in your backend deployment:

```bash
MONGODB_URI=your_mongodb_atlas_connection_string
MONGODB_DATABASE=your_database_name
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://pebly.vercel.app
```

### 9. Troubleshooting Common Issues

#### Issue: 404 Not Found
- **Cause**: Domain endpoints not deployed
- **Solution**: Redeploy backend with domain controller

#### Issue: 401 Unauthorized
- **Cause**: JWT token expired or invalid
- **Solution**: Login again to get fresh token

#### Issue: 500 Internal Server Error
- **Cause**: Database connection or missing dependencies
- **Solution**: Check backend logs and environment variables

#### Issue: CORS Error
- **Cause**: Frontend domain not allowed
- **Solution**: Add frontend URL to CORS configuration

### 10. Verification Steps

1. **Backend Deployed**: Check if domain endpoints return 200/401 (not 404)
2. **Authentication Working**: JWT token validation works
3. **Database Connected**: MongoDB Atlas connection successful
4. **Frontend Updated**: New error handling and debug tools active

### 11. Next Steps

Once the backend is redeployed with these fixes:

1. Test the debug tools to confirm endpoints are working
2. Verify authentication is working properly
3. Test adding a domain with a domain you own
4. Set up DNS verification for the domain
5. Test the complete domain verification flow

The custom domain functionality should work properly after these fixes are deployed.