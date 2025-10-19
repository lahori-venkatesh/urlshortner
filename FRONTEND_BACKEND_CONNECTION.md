# 🔗 Frontend ↔ Backend Connection Guide

## 🎯 **Current Setup**

### **Frontend (Vercel)**
- **Repository**: `lahori-venkatesh/urlshortner`
- **Folder**: `frontend/`
- **Framework**: React + TypeScript

### **Backend (Render)**
- **Repository**: `lahori-venkatesh/urlshortner`
- **Folder**: `backend/`
- **Framework**: Spring Boot + Java

## 🔧 **Step-by-Step Connection Setup**

### **1. Get Your Deployment URLs**

#### **Backend URL (Render)**
After deploying to Render, you'll get a URL like:
```
https://your-backend-name.onrender.com
```

#### **Frontend URL (Vercel)**
After deploying to Vercel, you'll get a URL like:
```
https://your-frontend-name.vercel.app
```

### **2. Configure Backend Environment Variables (Render)**

In your **Render dashboard** → **Environment** tab, add:

```bash
# CORS - Allow your frontend to connect
FRONTEND_URL=https://your-frontend-name.vercel.app

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pebly-database
MONGODB_DATABASE=pebly-database

# OAuth (update redirect URI)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-backend-name.onrender.com/auth/callback

# Other settings
JWT_SECRET=your-jwt-secret
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
SPRING_PROFILES_ACTIVE=prod
PORT=8080
```

### **3. Configure Frontend Environment Variables (Vercel)**

In your **Vercel dashboard** → **Settings** → **Environment Variables**, add:

```bash
# Backend API URL (IMPORTANT: include /api at the end)
REACT_APP_API_URL=https://your-backend-name.onrender.com/api

# Frontend URL (for redirects)
REACT_APP_FRONTEND_URL=https://your-frontend-name.vercel.app

# Client-side keys (safe to expose)
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_RAZORPAY_KEY_ID=your-razorpay-key-id
```

### **4. Test the Connection**

#### **Backend Health Check**
```bash
curl https://your-backend-name.onrender.com/actuator/health
```
Should return:
```json
{"status":"UP"}
```

#### **Frontend API Test**
Open browser console on your frontend and check:
```javascript
console.log(process.env.REACT_APP_API_URL);
// Should show: https://your-backend-name.onrender.com/api
```

### **5. Common Connection Issues & Fixes**

#### **❌ CORS Error**
```
Access to XMLHttpRequest at 'https://backend.onrender.com' from origin 'https://frontend.vercel.app' has been blocked by CORS policy
```

**Fix**: Update `FRONTEND_URL` in Render backend environment variables

#### **❌ 404 Not Found**
```
GET https://backend.onrender.com/api/v1/auth/login 404
```

**Fix**: Check if backend is running and endpoints are correct

#### **❌ Network Error**
```
Network Error
```

**Fix**: Check `REACT_APP_API_URL` in Vercel environment variables

#### **❌ Timeout Error**
```
timeout of 10000ms exceeded
```

**Fix**: Backend might be sleeping (Render free tier), wait 30 seconds and retry

## 🧪 **Testing Checklist**

### **✅ Backend Tests**
- [ ] Health check: `GET /actuator/health`
- [ ] CORS headers present in response
- [ ] Environment variables loaded correctly
- [ ] Database connection working

### **✅ Frontend Tests**
- [ ] Environment variables loaded: `console.log(process.env.REACT_APP_API_URL)`
- [ ] API calls reaching backend
- [ ] No CORS errors in browser console
- [ ] Authentication flow working

### **✅ Integration Tests**
- [ ] User registration works
- [ ] User login works
- [ ] URL shortening works
- [ ] QR code generation works
- [ ] File upload works

## 🔄 **Deployment Workflow**

### **When you update code:**

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Update: description"
   git push origin main
   ```

2. **Auto-deployment**:
   - Vercel automatically deploys frontend changes
   - Render automatically deploys backend changes

3. **Test connection** after both deployments complete

## 🚨 **Troubleshooting**

### **Check Backend Logs (Render)**
1. Go to Render dashboard
2. Click your backend service
3. Check "Logs" tab for errors

### **Check Frontend Logs (Vercel)**
1. Go to Vercel dashboard
2. Click your frontend project
3. Check "Functions" tab for errors

### **Check Browser Console**
1. Open your frontend URL
2. Press F12 → Console tab
3. Look for network errors or CORS issues

## 📞 **Quick Debug Commands**

```bash
# Test backend directly
curl https://your-backend-name.onrender.com/actuator/health

# Test API endpoint
curl https://your-backend-name.onrender.com/api/v1/auth/profile/test@example.com

# Check CORS headers
curl -H "Origin: https://your-frontend-name.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://your-backend-name.onrender.com/api/v1/auth/login
```

Your frontend and backend should now be properly connected! 🎉