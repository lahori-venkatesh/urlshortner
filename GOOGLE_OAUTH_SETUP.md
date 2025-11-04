# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication for the URL Shortener application.

## Issue: "Authentication Failed - Google authentication failed"

This error occurs when Google OAuth is not properly configured. Follow these steps to resolve it:

## 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API and Google OAuth2 API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure the OAuth consent screen first if prompted
6. For Application type, select "Web application"
7. Add authorized redirect URIs:
   - For development: `http://localhost:3000/auth/callback`
   - For production: `https://pebly.vercel.app/auth/callback`
8. Save and note down the Client ID and Client Secret

## 2. Frontend Configuration

Update `frontend/.env`:

```env
# Google OAuth Configuration
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here
REACT_APP_GOOGLE_REDIRECT_URI=https://pebly.vercel.app/auth/callback
```

## 3. Backend Configuration

The backend needs environment variables set on your hosting platform (Render, Heroku, etc.):

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## 4. Deployment Platform Setup

### For Render.com:
1. Go to your service dashboard
2. Navigate to "Environment" tab
3. Add the environment variables:
   - `GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret

### For Vercel (Frontend):
1. Go to your project dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add:
   - `REACT_APP_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID
   - `REACT_APP_GOOGLE_REDIRECT_URI`: Your callback URL

## 5. Testing the Setup

1. Deploy both frontend and backend with the new environment variables
2. Try logging in with Google
3. Check the browser console and server logs for any errors

## 6. Troubleshooting

### Common Issues:

1. **"Client ID missing"**: Backend environment variable `GOOGLE_CLIENT_ID` not set
2. **"Client Secret missing"**: Backend environment variable `GOOGLE_CLIENT_SECRET` not set
3. **"Invalid redirect URI"**: The redirect URI in Google Console doesn't match the one being used
4. **"Access blocked"**: OAuth consent screen not properly configured

### Debug Steps:

1. Check browser console for detailed error messages
2. Check server logs for authentication errors
3. Verify environment variables are properly set
4. Ensure redirect URIs match exactly in Google Console

## 7. Security Notes

- Never commit the Client Secret to version control
- Use environment variables for all sensitive configuration
- Regularly rotate OAuth credentials
- Ensure redirect URIs are properly configured to prevent attacks

## Current Configuration Status

Based on the current setup:
- ✅ Frontend Client ID: Configured
- ❌ Backend Client ID: Needs to be set as environment variable
- ❌ Backend Client Secret: Needs to be set as environment variable

## Next Steps

1. Set the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` environment variables on your backend hosting platform
2. Redeploy the backend service
3. Test Google authentication

The authentication should work once these environment variables are properly configured.