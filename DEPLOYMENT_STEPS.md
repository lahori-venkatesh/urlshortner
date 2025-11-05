# 🚀 Complete Deployment & Testing Guide

## Step 1: Cloudflare Setup & Login

### 1.1 Login to Cloudflare
```bash
cd pebly-universal-proxy
wrangler login
```
**Note**: This will open a browser window. Complete the OAuth flow in the browser.

If login fails, try:
```bash
wrangler auth login
```

### 1.2 Verify Login
```bash
wrangler whoami
```
Should show your Cloudflare account email.

## Step 2: Deploy Cloudflare Worker

### 2.1 Install Dependencies
```bash
npm install
```

### 2.2 Deploy to Development
```bash
wrangler deploy --env development
```

### 2.3 Deploy to Production
```bash
wrangler deploy --env production
```

### 2.4 Get Your Worker URL
After deployment, you'll see output like:
```
✨ Successfully published your Worker to the following routes:
  - https://pebly-universal-proxy-prod.your-subdomain.workers.dev
```

**Save this URL - you'll need it for frontend configuration!**

## Step 3: Test Worker Deployment

### 3.1 Test Health Check
```bash
curl https://your-worker-url.workers.dev/health
```
Expected response:
```json
{
  "healthy": true,
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 3.2 Test Debug Endpoint
```bash
curl -H "Host: test.example.com" https://your-worker-url.workers.dev/debug
```
Expected response: JSON with request details and headers.

### 3.3 Test Custom Domain Simulation
```bash
curl -I -H "Host: go.example.com" https://your-worker-url.workers.dev/test123
```
Expected: Either 404 (if no test link) or redirect response.

## Step 4: Update Frontend Configuration

### 4.1 Set Environment Variable
```bash
# In your frontend directory
echo "REACT_APP_PROXY_DOMAIN=your-worker-url.workers.dev" >> .env
```

### 4.2 For Vercel Deployment
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add: `REACT_APP_PROXY_DOMAIN` = `your-worker-url.workers.dev`
5. Redeploy frontend

### 4.3 For Netlify Deployment
1. Go to Netlify Dashboard
2. Select your site
3. Go to Site Settings → Environment Variables
4. Add: `REACT_APP_PROXY_DOMAIN` = `your-worker-url.workers.dev`
5. Redeploy frontend

## Step 5: Test Complete Flow

### 5.1 Run Automated Tests
```bash
# From project root
node test-custom-domain-flow.js https://your-worker-url.workers.dev https://urlshortner-1-hpyu.onrender.com
```

### 5.2 Test Backend Changes
The backend should already be deployed with the RedirectController fixes. Test it:
```bash
curl -I -H "X-Forwarded-Host: go.example.com" https://urlshortner-1-hpyu.onrender.com/test123
```

## Step 6: Create Real Test

### 6.1 Add Custom Domain in Frontend
1. Login to your app
2. Go to Custom Domains section
3. Add a test domain like `links.yourdomain.com`
4. Follow DNS setup instructions

### 6.2 Configure DNS
In your domain provider:
```
Type: CNAME
Name: links
Target: your-worker-url.workers.dev
TTL: Auto (or 300)
```

### 6.3 Create Test Link
1. Create a new short link
2. Select your custom domain
3. Note the generated link: `links.yourdomain.com/abc123`

### 6.4 Test the Link
Wait 5-10 minutes for DNS propagation, then:
```bash
curl -L https://links.yourdomain.com/abc123
```
Should redirect to your original URL!

## Step 7: Monitor & Debug

### 7.1 Check Worker Logs
```bash
wrangler tail --env production
```

### 7.2 Check Backend Logs
- If using Render.com: Check logs in dashboard
- Look for domain resolution messages

### 7.3 Debug DNS Issues
```bash
dig links.yourdomain.com CNAME
nslookup links.yourdomain.com
```

## 🧪 Testing Checklist

- [ ] Wrangler installed and logged in
- [ ] Worker deployed successfully
- [ ] Health check returns 200 OK
- [ ] Debug endpoint shows request details
- [ ] Frontend environment variable updated
- [ ] Backend RedirectController deployed
- [ ] Custom domain DNS configured
- [ ] Test link created with custom domain
- [ ] Custom domain link redirects correctly
- [ ] Analytics tracking works
- [ ] Error pages display properly

## 🐛 Common Issues & Solutions

### Issue: Worker deployment fails
**Solution**: 
```bash
wrangler logout
wrangler login
wrangler deploy --env production
```

### Issue: DNS not resolving
**Solution**: 
- Wait 5-60 minutes for propagation
- Check CNAME record is correct
- Ensure no conflicting A records

### Issue: Links show 404
**Solution**:
- Check backend logs for domain detection
- Verify short code exists in database
- Test backend directly with headers

### Issue: Frontend not using new proxy
**Solution**:
- Clear browser cache
- Verify environment variable is set
- Redeploy frontend application

## 📊 Success Indicators

✅ **Worker Health**: `/health` returns 200  
✅ **DNS Resolution**: Custom domain resolves to worker  
✅ **Backend Integration**: Headers passed correctly  
✅ **Link Creation**: Custom domain links generated  
✅ **Redirect Success**: Links redirect to original URLs  
✅ **Analytics**: Request tracking works  

## 🎯 Next Steps After Success

1. **Monitor Performance**: Check Cloudflare Analytics
2. **User Testing**: Have team members test the flow
3. **Documentation**: Update user guides with actual URLs
4. **Scaling**: Monitor usage and adjust limits if needed
5. **Support**: Prepare for user questions about DNS setup

---

## 🚀 You're Ready!

Follow these steps in order, and you'll have a fully functional custom domain system that can handle unlimited domains with professional performance and monitoring! 🎉