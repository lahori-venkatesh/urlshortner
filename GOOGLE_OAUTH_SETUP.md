# Google OAuth Setup for Production Deployment

## 🔑 Your Google OAuth Credentials

**Client ID**: `YOUR_GOOGLE_CLIENT_ID` (replace with your actual Client ID)
**Client Secret**: `YOUR_GOOGLE_CLIENT_SECRET` (replace with your actual Client Secret)

> **Note**: The actual credentials are provided separately for security reasons.

## 📋 Step-by-Step Setup

### 1. Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Find your OAuth 2.0 Client ID (provided separately)
4. Click **Edit** and update the following:

#### Authorized JavaScript Origins:
```
https://pebly.vercel.app
https://urlshortner-mrrl.onrender.com
http://localhost:3000
```

#### Authorized Redirect URIs:
```
https://pebly.vercel.app/auth/callback
https://urlshortner-mrrl.onrender.com/auth/callback
http://localhost:3000/auth/callback
```

### 2. Render Backend Environment Variables

In your Render dashboard, add these environment variables:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI=https://urlshortner-mrrl.onrender.com/auth/callback

# Application URLs
FRONTEND_URL=https://pebly.vercel.app
SHORT_URL_DOMAIN=https://pebly.vercel.app
BACKEND_URL=https://urlshortner-mrrl.onrender.com

# Database
MONGODB_URI=mongodb+srv://lahorivenkatesh709:p0SkcBwHo67ghvMW@cluster0.y8ucl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DATABASE=pebly-database

# Security
JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
JWT_EXPIRATION=24h

# Spring Profile
SPRING_PROFILES_ACTIVE=prod
```

### 3. Vercel Frontend Environment Variables

In your Vercel dashboard, add these environment variables:

```bash
# API Configuration
REACT_APP_API_URL=https://urlshortner-mrrl.onrender.com/api
REACT_APP_BACKEND_URL=https://urlshortner-mrrl.onrender.com

# Application URLs
REACT_APP_FRONTEND_URL=https://pebly.vercel.app
REACT_APP_SHORT_URL_DOMAIN=https://pebly.vercel.app

# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
REACT_APP_GOOGLE_REDIRECT_URI=https://pebly.vercel.app/auth/callback

# Payment (if using)
REACT_APP_RAZORPAY_KEY_ID=your-razorpay-key-id
```

## 🔗 OAuth Flow URLs

### Authorization URL:
```
https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_GOOGLE_CLIENT_ID&redirect_uri=https://pebly.vercel.app/auth/callback&response_type=code&scope=email%20profile
```

### Token Exchange URL:
```
POST https://oauth2.googleapis.com/token
```

### User Info URL:
```
GET https://www.googleapis.com/oauth2/v2/userinfo
```

## 🧪 Testing OAuth

### Development URLs:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8080
- **Redirect**: http://localhost:3000/auth/callback

### Production URLs:
- **Frontend**: https://pebly.vercel.app
- **Backend**: https://urlshortner-mrrl.onrender.com
- **Redirect**: https://pebly.vercel.app/auth/callback

## 🔧 Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch"**
   - Ensure redirect URIs in Google Console match exactly
   - Check for trailing slashes

2. **"invalid_client"**
   - Verify Client ID and Secret are correct
   - Check environment variables are set

3. **CORS Issues**
   - Ensure frontend domain is in allowed origins
   - Check CORS configuration in backend

### Debug Steps:

1. Check browser network tab for OAuth requests
2. Verify environment variables in deployment logs
3. Test OAuth flow in development first
4. Check Google Cloud Console audit logs

## 📝 Notes

- Keep Client Secret secure and never expose in frontend code
- Use HTTPS in production for OAuth security
- Test the complete flow after deployment
- Monitor OAuth usage in Google Cloud Console

## 🚀 Deployment Checklist

- [ ] Google Cloud Console configured with production URLs
- [ ] Render environment variables set
- [ ] Vercel environment variables set
- [ ] OAuth flow tested in development
- [ ] OAuth flow tested in production
- [ ] Error handling implemented
- [ ] User feedback for auth failures