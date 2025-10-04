# Google OAuth Setup Guide

## 1. Google Cloud Console Setup

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API

### Step 2: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Choose **Web application**
4. Configure the OAuth consent screen if prompted

### Step 3: Configure OAuth Client
**Application type:** Web application

**Authorized JavaScript origins:**
```
http://localhost:3000
https://yourdomain.com (for production)
```

**Authorized redirect URIs:**
```
http://localhost:3000/auth/callback
https://yourdomain.com/auth/callback (for production)
```

## 2. Environment Configuration

### Update your `.env` file:
```env
# Replace with your actual Google OAuth credentials
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
REACT_APP_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
```

## 3. OAuth Flow

### How it works:
1. User clicks "Continue with Google"
2. Redirected to Google OAuth consent screen
3. User grants permissions
4. Google redirects back to `/auth/callback` with authorization code
5. Frontend exchanges code for access token
6. User info is fetched and stored
7. User is redirected to dashboard

### Security Notes:
- Client secret should be kept secure (in production, handle token exchange on backend)
- Tokens are stored in localStorage (consider more secure storage for production)
- HTTPS is required for production OAuth

## 4. Testing

### Local Development:
1. Start your React app: `npm start`
2. Navigate to `http://localhost:3000`
3. Click "Continue with Google"
4. Complete OAuth flow
5. Should redirect to `/app` dashboard

### Production Deployment:
1. Update redirect URIs in Google Console
2. Update environment variables
3. Ensure HTTPS is enabled
4. Test OAuth flow

## 5. Troubleshooting

### Common Issues:
- **redirect_uri_mismatch**: Check that redirect URI in Google Console matches exactly
- **invalid_client**: Verify client ID and secret are correct
- **access_denied**: User denied permissions or OAuth consent screen not configured

### Debug Steps:
1. Check browser console for errors
2. Verify environment variables are loaded
3. Check Google Console OAuth settings
4. Test with different browsers/incognito mode