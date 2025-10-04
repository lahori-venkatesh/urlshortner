# Railway + Vercel Deployment Guide

## Current Setup
- **Railway**: Backend (Spring Boot) + Database
- **Vercel**: Frontend (React)

## 🚀 Railway Backend Configuration

### 1. Environment Variables to Set in Railway Dashboard

```bash
# Database (Railway will auto-provide these)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (if using)
REDIS_URL=${{Redis.REDIS_URL}}

# Application Config
SPRING_PROFILES_ACTIVE=production
PORT=8080

# Frontend URL (update with your Vercel URL)
FRONTEND_URL=https://your-app.vercel.app
CORS_ALLOWED_ORIGINS=https://your-app.vercel.app,https://*.vercel.app

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/auth/callback

# JWT Secret
JWT_SECRET=your-super-secure-jwt-secret-key
```

### 2. Railway Services to Add

```bash
# In Railway dashboard, add these services:
railway add postgresql
railway add redis  # optional, for caching
```

## 🌐 Vercel Frontend Configuration

### 1. Environment Variables in Vercel Dashboard

```bash
# Backend API URL (update with your Railway URL)
REACT_APP_API_URL=https://your-railway-app.railway.app

# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

### 2. Vercel Build Settings

- **Framework Preset**: Create React App
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

## 🔧 Configuration Steps

### Step 1: Update Railway Environment Variables

1. Go to your Railway project dashboard
2. Click on your service
3. Go to "Variables" tab
4. Add all the environment variables listed above
5. Make sure to update the URLs with your actual Vercel app URL

### Step 2: Update Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Go to Settings → Environment Variables
3. Add the environment variables listed above
4. Make sure to update the API URL with your actual Railway app URL

### Step 3: Update Google OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Update Authorized redirect URIs:
   - Add: `https://your-vercel-app.vercel.app/auth/callback`
   - Add: `https://your-custom-domain.com/auth/callback` (if using custom domain)

### Step 4: Test the Connection

1. Deploy both services
2. Check Railway logs for any errors
3. Test API endpoints from Vercel frontend
4. Verify CORS is working properly

## 🔍 Troubleshooting

### CORS Issues
If you get CORS errors:
1. Check that `FRONTEND_URL` is set correctly in Railway
2. Verify the Vercel URL matches exactly
3. Check Railway logs for CORS-related errors

### Database Connection Issues
1. Verify `DATABASE_URL` is set in Railway
2. Check that PostgreSQL service is running
3. Look at Railway logs for database connection errors

### OAuth Issues
1. Verify Google OAuth credentials are correct
2. Check that redirect URIs match in Google Console
3. Ensure `GOOGLE_REDIRECT_URI` points to your Vercel app

## 📋 Quick Checklist

- [ ] Railway backend deployed with correct environment variables
- [ ] PostgreSQL database added to Railway
- [ ] Vercel frontend deployed with correct environment variables
- [ ] Google OAuth configured with correct redirect URIs
- [ ] CORS configured to allow Vercel domain
- [ ] API endpoints tested from frontend
- [ ] Authentication flow working end-to-end

## 🌍 URLs to Update

Replace these placeholders with your actual URLs:

- `your-railway-app.railway.app` → Your actual Railway backend URL
- `your-vercel-app.vercel.app` → Your actual Vercel frontend URL
- `your-custom-domain.com` → Your custom domain (if any)

## 🚀 Deployment Commands

### For Railway (if redeploying):
```bash
git push origin main  # Railway auto-deploys from GitHub
```

### For Vercel (if redeploying):
```bash
# Vercel auto-deploys from GitHub
# Or manually: vercel --prod
```