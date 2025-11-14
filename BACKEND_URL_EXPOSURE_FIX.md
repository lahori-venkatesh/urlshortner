# Backend URL Exposure Fix

## Problem
Users were seeing the backend URL (`https://urlshortner-1-hpyu.onrender.com/dashboard`) in their browser after refreshing the page, instead of staying on the frontend URL (`https://pebly.vercel.app/dashboard`).

## Root Causes Identified

### 1. Vercel.json Redirect Configuration
- Had a 307 redirect rule that exposed the backend URL
- Missing SPA fallback route for React Router
- Redirect rules were causing browser to show backend URL

### 2. Hardcoded Backend URLs
- Multiple frontend files had hardcoded backend URLs as fallbacks
- `.env` and `.env.production` files pointed directly to backend
- Components like `CreateSection.tsx` and `CustomDomainOnboarding.tsx` had hardcoded URLs

### 3. Backend Redirect Controller
- Used 301 (Permanent) redirect which gets cached by browsers
- Should use 302 (Temporary) redirect to avoid caching issues

### 4. API Service Configuration
- `api.ts` had hardcoded backend URLs as fallbacks
- No environment-aware URL handling

## Changes Made

### 1. Updated `frontend/vercel.json`
**Before:**
```json
{
  "redirects": [
    {
      "source": "/([a-zA-Z0-9]{4,12})",
      "destination": "https://urlshortner-1-hpyu.onrender.com/$1",
      "statusCode": 307
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://urlshortner-1-hpyu.onrender.com/api/$1"
    }
  ]
}
```

**After:**
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://urlshortner-1-hpyu.onrender.com/api/$1"
    },
    {
      "source": "/actuator/(.*)",
      "destination": "https://urlshortner-1-hpyu.onrender.com/actuator/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

**Key Changes:**
- ✅ Removed redirect rules that exposed backend URL
- ✅ Added SPA fallback route `"/(.*)" → "/index.html"` for React Router
- ✅ Kept API rewrites to proxy backend calls transparently
- ✅ Added security headers

### 2. Updated Environment Files

**`frontend/.env`:**
```env
# Before
REACT_APP_API_URL=https://urlshortner-1-hpyu.onrender.com/api

# After
REACT_APP_API_URL=/api
```

**`frontend/.env.production`:**
```env
# Before
REACT_APP_API_URL=https://urlshortner-1-hpyu.onrender.com/api

# After
REACT_APP_API_URL=/api
```

### 3. Updated `frontend/src/services/api.ts`

**Before:**
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://urlshortner-mrrl.onrender.com/api';
```

**After:**
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8080/api');
```

### 4. Updated Frontend Components

**Files Updated:**
- `frontend/src/components/CustomDomainOnboarding.tsx`
- `frontend/src/components/dashboard/CreateSection.tsx`

**Change:**
```typescript
// Before
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://urlshortner-1-hpyu.onrender.com/api';

// After
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
```

### 5. Updated Backend Redirect Controller

**File:** `backend/url-service/src/main/java/com/urlshortener/controller/FrontendRedirectController.java`

**Before:**
```java
redirectView.setStatusCode(HttpStatus.MOVED_PERMANENTLY); // 301 redirect
```

**After:**
```java
redirectView.setStatusCode(HttpStatus.FOUND); // 302 redirect (temporary, not cached)
```

### 6. Updated `frontend/src/context/AuthContext.tsx`

**Before:**
```typescript
const refreshResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/v1/auth/refresh`, {
```

**After:**
```typescript
const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8080/api');
const refreshResponse = await fetch(`${apiUrl}/v1/auth/refresh`, {
```

## How It Works Now

### Production Flow (Vercel)
1. User visits `https://pebly.vercel.app/dashboard`
2. Vercel serves the React app from `/index.html`
3. React Router handles the `/dashboard` route client-side
4. When API calls are made to `/api/*`, Vercel rewrites them to backend
5. Backend URL is never exposed to the user
6. On refresh, Vercel serves `/index.html` again (SPA fallback)
7. React Router re-initializes and shows `/dashboard`

### Development Flow (Local)
1. User visits `http://localhost:3000/dashboard`
2. React dev server serves the app
3. API calls go to `http://localhost:8080/api` (local backend)
4. No URL exposure issues in development

### Backend Redirect Flow
1. If someone directly accesses `https://urlshortner-1-hpyu.onrender.com/dashboard`
2. Backend `FrontendRedirectController` catches it
3. Returns 302 redirect to `https://pebly.vercel.app/dashboard`
4. User ends up on frontend URL

## Benefits

✅ **No Backend URL Exposure:** Users always see `pebly.vercel.app` in their browser
✅ **SPA Routing Works:** Refresh on any route works correctly
✅ **Transparent API Proxying:** API calls are proxied without exposing backend
✅ **Better Security:** Added security headers (X-Frame-Options, X-Content-Type-Options)
✅ **No Browser Caching Issues:** Using 302 instead of 301 prevents redirect caching
✅ **Environment-Aware:** Different behavior for development vs production

## Testing Checklist

- [ ] Visit `https://pebly.vercel.app/dashboard` - should stay on pebly.vercel.app
- [ ] Refresh on `/dashboard` - should stay on pebly.vercel.app
- [ ] Navigate to `/dashboard/links` and refresh - should stay on pebly.vercel.app
- [ ] Navigate to `/dashboard/analytics` and refresh - should stay on pebly.vercel.app
- [ ] Check browser network tab - API calls should go to `/api/*` (proxied)
- [ ] Direct access to `https://urlshortner-1-hpyu.onrender.com/dashboard` - should redirect to pebly.vercel.app
- [ ] Login/logout flow - should stay on pebly.vercel.app
- [ ] All API functionality works (create links, QR codes, files)

## Deployment Steps

### Frontend (Vercel)
1. Commit and push changes to Git
2. Vercel will auto-deploy
3. Wait for deployment to complete
4. Test the production URL

### Backend (Render)
1. Build the backend:
   ```bash
   cd backend/url-service
   mvn clean package -DskipTests
   ```
2. Commit and push changes
3. Render will auto-deploy
4. Wait for deployment to complete

## Rollback Plan

If issues occur, revert these commits:
- Frontend: Revert `vercel.json`, `.env`, `.env.production`, `api.ts`, component files
- Backend: Revert `FrontendRedirectController.java`

## Notes

- The SPA fallback route `"/(.*)" → "/index.html"` must be the LAST rewrite rule
- API rewrites must come BEFORE the SPA fallback
- Relative URLs (`/api`) only work because Vercel rewrites them to the backend
- In development, we still use absolute URLs for the local backend

## Related Issues Fixed

- ✅ Backend URL exposure on page refresh
- ✅ React Router not working on direct URL access
- ✅ 404 errors on refresh for nested routes
- ✅ Browser caching backend redirects
