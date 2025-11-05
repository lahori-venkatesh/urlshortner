# Custom Domain Debugging Guide

## 🔍 Issue: Custom Domain Links Not Redirecting

### Problem Description
When users create short links with custom domains (e.g., `links.pdfcircle.com/abc123`), the links show "Page Not Found" instead of redirecting to the original URL.

### Root Cause Analysis
The issue was in the backend redirect controller not properly handling the custom domain headers sent by the Cloudflare Worker proxy.

## 🛠️ Fixes Applied

### 1. Backend Fix (RedirectController.java)
**Problem**: Backend was using `request.getServerName()` which returns the backend domain, not the original custom domain.

**Solution**: Added `getOriginalHostDomain()` method to check proxy headers first:

```java
private String getOriginalHostDomain(HttpServletRequest request) {
    // Check for custom domain from proxy headers (Cloudflare Worker)
    String xForwardedHost = request.getHeader("X-Forwarded-Host");
    if (xForwardedHost != null && !xForwardedHost.isEmpty()) {
        return xForwardedHost;
    }
    
    String xOriginalHost = request.getHeader("X-Original-Host");
    if (xOriginalHost != null && !xOriginalHost.isEmpty()) {
        return xOriginalHost;
    }
    
    // Fallback to server name (direct access)
    return request.getServerName();
}
```

### 2. Enhanced Proxy Debugging
**Added**: Debug endpoint and enhanced logging in Cloudflare Worker:

```javascript
// Debug endpoint: https://your-worker.workers.dev/debug
if (pathname === '/debug' || pathname === '/_debug') {
  // Returns detailed request information
}
```

### 3. Enhanced Logging
**Added**: Comprehensive logging in both proxy and backend to track the flow:

- Proxy logs: Request details, headers, backend responses
- Backend logs: Domain resolution, URL lookup results

## 🧪 Testing Steps

### 1. Test Proxy Health
```bash
curl https://your-worker-url.workers.dev/health
```

### 2. Test Custom Domain Debug
```bash
curl -H "Host: links.pdfcircle.com" https://your-worker-url.workers.dev/debug
```

### 3. Test Custom Domain Redirect
```bash
# Replace with actual short code
curl -I -H "Host: links.pdfcircle.com" https://your-worker-url.workers.dev/abc123
```

### 4. Test Backend Direct Access
```bash
curl -I -H "X-Forwarded-Host: links.pdfcircle.com" https://urlshortner-1-hpyu.onrender.com/abc123
```

## 🔄 Complete Flow Verification

### Step 1: Create Custom Domain Link
1. User adds custom domain `links.pdfcircle.com`
2. DNS points to Cloudflare Worker
3. User creates short link with custom domain
4. Backend stores URL with `domain: "links.pdfcircle.com"`

### Step 2: Access Custom Domain Link
1. User visits `links.pdfcircle.com/abc123`
2. DNS resolves to Cloudflare Worker
3. Worker forwards to backend with headers:
   - `X-Forwarded-Host: links.pdfcircle.com`
   - `X-Original-Host: links.pdfcircle.com`
   - `Host: urlshortner-1-hpyu.onrender.com`

### Step 3: Backend Processing
1. Backend receives request at `/abc123`
2. `getOriginalHostDomain()` returns `links.pdfcircle.com`
3. `getByShortCodeAndDomain("abc123", "links.pdfcircle.com")` finds URL
4. Backend returns 301 redirect to original URL
5. Worker forwards redirect response to user

## 🐛 Debugging Commands

### Check DNS Resolution
```bash
dig links.pdfcircle.com CNAME
nslookup links.pdfcircle.com
```

### Test Proxy Headers
```bash
curl -v -H "Host: links.pdfcircle.com" \
  -H "User-Agent: Test-Browser/1.0" \
  https://your-worker-url.workers.dev/test123
```

### Check Backend Logs
```bash
# If using Render.com
# Check logs in Render dashboard

# If using local development
tail -f backend/logs/application.log
```

### Check Worker Logs
```bash
wrangler tail --env production
```

## 🔧 Common Issues & Solutions

### Issue 1: DNS Not Propagating
**Symptoms**: Domain doesn't resolve to worker
**Solution**: 
- Wait 5-60 minutes for DNS propagation
- Use `dig` to verify CNAME record
- Check TTL settings (should be Auto or 300)

### Issue 2: Worker Not Receiving Requests
**Symptoms**: No logs in Cloudflare dashboard
**Solution**:
- Verify worker deployment: `wrangler whoami`
- Check worker URL is correct
- Test health endpoint

### Issue 3: Backend Not Finding URLs
**Symptoms**: 404 errors in backend logs
**Solution**:
- Verify URL was created with correct custom domain
- Check database for domain field: `db.shortened_urls.find({shortCode: "abc123"})`
- Ensure backend is using fixed redirect controller

### Issue 4: Headers Not Passed Correctly
**Symptoms**: Backend logs show wrong domain
**Solution**:
- Check proxy headers in debug endpoint
- Verify `X-Forwarded-Host` is set correctly
- Update backend to use `getOriginalHostDomain()`

## 📊 Monitoring & Alerts

### Key Metrics to Monitor
1. **Redirect Success Rate**: Should be >95%
2. **Response Time**: Should be <500ms
3. **Error Rate**: Should be <5%
4. **Custom Domain Resolution**: Track DNS lookup success

### Recommended Alerts
```bash
# Cloudflare Worker errors > 5%
# Backend 404 rate > 10% 
# Response time > 1000ms
# Health check failures
```

## 🎯 Verification Checklist

- [ ] Proxy deployed and healthy
- [ ] Backend updated with domain header fix
- [ ] DNS configured correctly
- [ ] Test link created with custom domain
- [ ] Test link redirects successfully
- [ ] Analytics tracking works
- [ ] Error pages display correctly
- [ ] Monitoring alerts configured

## 📞 Support Commands

### Quick Health Check
```bash
# Test entire flow
curl -L -H "Host: links.pdfcircle.com" https://your-worker-url.workers.dev/test123
```

### Debug Information
```bash
# Get debug info
curl https://your-worker-url.workers.dev/debug

# Test backend directly
curl -H "X-Forwarded-Host: links.pdfcircle.com" https://urlshortner-1-hpyu.onrender.com/test123
```

---

**✅ With these fixes, custom domain links should now redirect properly!**