# 🚀 Production Deployment Guide

## Backend Deployment (Render)

### 1. **Prepare Environment Variables**
Set these in Render dashboard:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pebly-database
MONGODB_DATABASE=pebly-database

# Redis (Render Redis add-on)
REDIS_HOST=your-redis-host.render.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Frontend URL
FRONTEND_URL=https://your-frontend-app.vercel.app

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-backend-app.onrender.com/auth/callback

# Payment
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Security
JWT_SECRET=your-very-long-and-secure-jwt-secret-key-here

# File Upload
MAX_FILE_SIZE=10MB
MAX_REQUEST_SIZE=10MB

# Logging
LOG_FILE=/tmp/application.log
```

### 2. **Deploy Steps**
1. Push code to GitHub
2. Connect GitHub repo to Render
3. Set environment variables
4. Deploy!

## Frontend Deployment (Vercel)

### 1. **Environment Variables**
Set in Vercel dashboard:

```bash
REACT_APP_API_URL=https://your-backend-app.onrender.com/api
REACT_APP_FRONTEND_URL=https://your-frontend-app.vercel.app
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
REACT_APP_RAZORPAY_KEY_ID=your-razorpay-key-id
```

### 2. **Deploy Steps**
1. Push frontend to GitHub
2. Connect GitHub repo to Vercel
3. Set environment variables
4. Deploy!

## Database Setup (MongoDB Atlas)

### 1. **Create Cluster**
- Go to MongoDB Atlas
- Create new cluster
- Get connection string

### 2. **Database Configuration**
- Database name: `pebly-database`
- Collections will be auto-created

## Redis Setup (Render Redis)

### 1. **Add Redis Service**
- In Render dashboard
- Add Redis service
- Get connection details

## Post-Deployment Checklist

### ✅ **Backend Health Check**
```bash
curl https://your-backend-app.onrender.com/actuator/health
```

### ✅ **Frontend Check**
- Visit your frontend URL
- Test login/signup
- Test URL shortening
- Test QR generation
- Test file upload

### ✅ **Database Check**
- Verify MongoDB connection
- Check collections are created
- Test data persistence

### ✅ **Redis Check**
- Verify caching works
- Check session storage

## Monitoring

### **Backend Monitoring**
- Health: `/actuator/health`
- Metrics: `/actuator/metrics`
- Logs: Render dashboard

### **Frontend Monitoring**
- Vercel analytics
- Browser console
- Network requests

## Troubleshooting

### **Common Issues**
1. **CORS errors**: Check FRONTEND_URL in backend
2. **Database connection**: Verify MONGODB_URI
3. **File uploads**: Check MAX_FILE_SIZE
4. **OAuth**: Verify redirect URIs

### **Logs**
- Backend: Render dashboard logs
- Frontend: Vercel function logs
- Database: MongoDB Atlas logs

## Performance Optimization

### **Backend**
- Connection pooling: ✅ Configured
- Caching: ✅ Redis enabled
- Compression: ✅ Enabled
- Health checks: ✅ Configured

### **Frontend**
- Build optimization: ✅ Configured
- Code splitting: ✅ React default
- Asset optimization: ✅ Vercel default

## Security

### **Backend Security**
- HTTPS: ✅ Render default
- CORS: ✅ Configured
- Rate limiting: ✅ Configured
- Input validation: ✅ Implemented

### **Frontend Security**
- HTTPS: ✅ Vercel default
- Environment variables: ✅ Secured
- API keys: ✅ Client-side only safe keys

Your app is production-ready! 🎉