# Backend URL Exposure Fix

## Problem
Users were seeing the backend URL (`https://urlshortner-1-hpyu.onrender.com/dashboard`) after refreshing the page instead of staying on the frontend URL (`https://pebly.vercel.app/dashboard`).

Additionally, password-protected links were showing a white screen instead of the password entry form.

## Root Causes

### 1. Vercel.json Redirect Configuration
- Had a 307 redirect rule that was exposing the backend URL
- Missing SPA fallback route for React Router

### 2. Hardcoded Backend URLs
- Multiple components had hardcoded backend URLs as fallbacks
- API service was using absolute backend URLs instead of relative paths

### 3. Backend Redirect Controller
- Was using 301 (permanent) redirect which gets cached by browsers
- Should use 302 (temporary) redirect

### 4. Password-Protected Links White Screen
- RedirectPage component was using wrong API URL configuration
- Not properly handling the production environment

## Solutions Implemented

### 1. Updated `frontend/vercel.json`
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
  ]
}
```

**Changes:**
- Removed problematic redirect rules
- Added catch-all rewrite to `/index.html` for SPA routing
- Kept API rewrites to proxy backend calls

### 2. Updated `frontend/src/services/api.ts`
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8080/api');
```

**Changes:**
- Use relative `/api` path in production
- Vercel rewrites will proxy these to the backend
- Prevents backend URL from being exposed in browser

### 3. Updated `backend/.../FrontendRedirectController.java`
```java
redirectView.setStatusCode(HttpStatus.FOUND); // 302 redirect (temporary, not cached)
```

**Changes:**
- Changed from 301 (MOVED_PERMANENTLY) to 302 (FOUND)
- Prevents browser from caching the redirect
- Ensures fresh redirects on each request

### 4. Updated `frontend/src/pages/RedirectPage.tsx`
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8080/api');
```

**Changes:**
- Fixed API URL configuration for production
- Now uses relative `/api` path in production
- Fixes white screen issue for password-protected links

### 5. Updated `frontend/src/components/CustomDomainOnboarding.tsx`
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8080/api');
```

**Changes:**
- Removed hardcoded backend URL
- Uses environment-aware API URL

### 6. Updated `frontend/src/components/dashboard/CreateSection.tsx`
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8080/api');
```

**Changes:**
- Removed hardcoded backend URL
- Uses environment-aware API URL

## How It Works Now

### Frontend Routing (React Router)
1. User visits `https://pebly.vercel.app/dashboard`
2. Vercel serves `index.html` (via catch-all rewrite)
3. React Router handles the `/dashboard` route
4. User stays on `pebly.vercel.app` domain

### API Calls
1. Frontend makes API call to `/api/v1/...` (relative path)
2. Vercel rewrites to `https://urlshortner-1-hpyu.onrender.com/api/v1/...`
3. Backend processes request and returns response
4. User never sees backend URL

### Password-Protected Links
1. User visits short link (e.g., `https://pebly.vercel.app/abc123`)
2. Backend detects password protection
3. Redirects to `https://pebly.vercel.app/redirect/abc123`
4. RedirectPage component loads and shows password form
5. User enters password
6. Frontend calls `/api/v1/urls/abc123/redirect` with password
7. Backend validates and returns original URL
8. User is redirected to destination

### Page Refresh
1. User refreshes on `https://pebly.vercel.app/dashboard`
2. Vercel serves `index.html` (via catch-all rewrite)
3. React Router initializes and renders `/dashboard`
4. User stays on `pebly.vercel.app` domain
5. No backend URL exposure

## Testing Checklist

- [x] Navigate to `/dashboard` - should stay on pebly.vercel.app
- [x] Refresh on `/dashboard` - should stay on pebly.vercel.app
- [x] Create password-protected link - should save to database
- [x] Open password-protected link - should show password form (not white screen)
- [x] Enter correct password - should redirect to destination
- [x] Enter wrong password - should show error
- [x] API calls should work without exposing backend URL
- [x] Short links should redirect properly

## Deployment Steps

1. **Frontend (Vercel)**
   ```bash
   cd frontend
   npm run build
   # Vercel will auto-deploy on push to main
   ```

2. **Backend (Render)**
   ```bash
   cd backend/url-service
   mvn clean package
   # Render will auto-deploy on push to main
   ```

3. **Verify Environment Variables**
   - Vercel: No REACT_APP_API_URL needed (uses relative paths)
   - Local: REACT_APP_API_URL=http://localhost:8080/api

## Benefits

1. **Security**: Backend URL is never exposed to users
2. **SEO**: All URLs stay on the main domain
3. **User Experience**: No confusing URL changes
4. **Caching**: 302 redirects prevent browser caching issues
5. **SPA Support**: React Router works properly on refresh
6. **Password Protection**: Works correctly without white screen

## Notes

- The catch-all rewrite `"source": "/(.*)"` must be LAST in the rewrites array
- API rewrites must come BEFORE the catch-all
- Relative paths (`/api`) only work in production with Vercel rewrites
- Local development still uses `http://localhost:8080/api`
