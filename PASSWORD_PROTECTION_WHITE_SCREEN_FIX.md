# Password Protection White Screen Fix

## Problem
When users opened password-protected links, they saw a white screen instead of the password entry form.

## Root Cause
The `RedirectPage.tsx` component was using an incorrect API URL configuration that didn't properly handle production environments.

```typescript
// OLD - INCORRECT
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
```

In production, this would try to use `http://localhost:8080/api` which doesn't exist, causing the API call to fail silently and resulting in a white screen.

## Solution
Updated the API URL configuration to use relative paths in production:

```typescript
// NEW - CORRECT
const API_BASE_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:8080/api');
```

## How It Works Now

### 1. User Opens Password-Protected Link
```
User visits: https://pebly.vercel.app/abc123
```

### 2. Backend Detects Password Protection
```java
// In RedirectController.java
if (url.isPasswordProtected()) {
    System.out.println("🔒 Password-protected link detected - redirecting to password page");
    RedirectView redirectView = new RedirectView();
    redirectView.setUrl("https://pebly.vercel.app/redirect/" + shortCode);
    redirectView.setStatusCode(HttpStatus.TEMPORARY_REDIRECT);
    return redirectView;
}
```

### 3. Frontend Shows Password Form
```
User is redirected to: https://pebly.vercel.app/redirect/abc123
RedirectPage component loads and displays password entry form
```

### 4. User Enters Password
```typescript
// RedirectPage.tsx makes API call
const response = await fetch(`${API_BASE_URL}/v1/urls/${shortCode}/redirect`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    password: passwordInput,
    userAgent: navigator.userAgent,
    referrer: document.referrer,
  }),
});
```

### 5. Backend Validates Password
```java
// In UrlController.java
if (url.isPasswordProtected()) {
    String providedPassword = request != null ? (String) request.get("password") : null;
    
    if (providedPassword == null || !providedPassword.equals(url.getPassword())) {
        response.put("success", false);
        response.put("message", "Password required");
        response.put("passwordRequired", true);
        return ResponseEntity.status(401).body(response);
    }
}
```

### 6. Successful Redirect
```typescript
// RedirectPage.tsx handles successful response
if (data.success && data.data) {
  if (data.data.originalUrl) {
    setTimeout(() => {
      window.location.href = data.data.originalUrl;
    }, 1000);
  }
}
```

## Files Modified

1. **frontend/src/pages/RedirectPage.tsx**
   - Fixed API URL configuration for production
   - Now uses relative `/api` path in production
   - Falls back to `http://localhost:8080/api` in development

## Testing Scenarios

### ✅ Scenario 1: Create Password-Protected Link
1. Go to dashboard
2. Create new short link with password "test123"
3. Verify in database: `isPasswordProtected: true`, `password: "test123"`

### ✅ Scenario 2: Open Password-Protected Link (Correct Password)
1. Open short link in browser
2. Should see password entry form (NOT white screen)
3. Enter correct password "test123"
4. Should redirect to destination URL

### ✅ Scenario 3: Open Password-Protected Link (Wrong Password)
1. Open short link in browser
2. Should see password entry form
3. Enter wrong password "wrong"
4. Should show error message "Access denied. Please check your password."

### ✅ Scenario 4: Open Password-Protected Link (No Password)
1. Open short link in browser
2. Should see password entry form
3. Try to submit without entering password
4. Form validation should prevent submission

## Database Schema
```javascript
{
  shortCode: "abc123",
  originalUrl: "https://example.com",
  isPasswordProtected: true,
  password: "12345678",  // Plain text password
  expiresAt: ISODate("2024-12-31T23:59:59.000Z"),
  isActive: true,
  totalClicks: 0
}
```

## API Endpoints

### POST /api/v1/urls/{shortCode}/redirect
**Request:**
```json
{
  "password": "12345678",
  "userAgent": "Mozilla/5.0...",
  "referrer": "https://google.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "originalUrl": "https://example.com",
    "shortCode": "abc123",
    "title": "My Link"
  }
}
```

**Response (Password Required):**
```json
{
  "success": false,
  "message": "Password required",
  "passwordRequired": true
}
```

**Response (Wrong Password):**
```json
{
  "success": false,
  "message": "Password required",
  "passwordRequired": true
}
```

## Environment Configuration

### Production (.env.production)
```bash
REACT_APP_API_URL=/api
```

### Development (.env)
```bash
REACT_APP_API_URL=http://localhost:8080/api
```

### Vercel Configuration (vercel.json)
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://urlshortner-1-hpyu.onrender.com/api/$1"
    }
  ]
}
```

## Benefits

1. **No White Screen**: Password form displays correctly
2. **Proper Error Handling**: Shows meaningful error messages
3. **Environment Aware**: Works in both development and production
4. **Secure**: Password validation happens on backend
5. **User Friendly**: Clear UI for password entry

## Related Issues Fixed

This fix also resolves the backend URL exposure issue because:
- Uses relative paths in production
- Vercel rewrites proxy API calls to backend
- Users never see backend URL in browser
