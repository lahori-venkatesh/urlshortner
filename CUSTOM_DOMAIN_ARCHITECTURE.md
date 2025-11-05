# Custom Domain Architecture - How It Works

## 🏗️ System Architecture

### Default Flow (pebly.vercel.app)
```
User visits: pebly.vercel.app/abc123
    ↓ Direct DNS resolution
Backend: urlshortner-1-hpyu.onrender.com/abc123
    ↓ RedirectController processes
Original URL: https://example.com/page
```

### Custom Domain Flow (go.yourname.com)
```
User visits: go.yourname.com/abc123
    ↓ DNS CNAME points to
Cloudflare Worker: pebly-universal-proxy.workers.dev
    ↓ Proxy forwards with headers
Backend: urlshortner-1-hpyu.onrender.com/abc123
    ↓ RedirectController processes with X-Forwarded-Host
Original URL: https://example.com/page
```

## 🔄 How RedirectController Works

### 1. Domain Detection
```java
private String getOriginalHostDomain(HttpServletRequest request) {
    // Check for custom domain from proxy (X-Forwarded-Host: go.yourname.com)
    String xForwardedHost = request.getHeader("X-Forwarded-Host");
    if (xForwardedHost != null && !xForwardedHost.contains("onrender.com")) {
        return xForwardedHost; // Returns: go.yourname.com
    }
    
    // For direct access (pebly.vercel.app)
    return request.getServerName(); // Returns: urlshortner-1-hpyu.onrender.com
}
```

### 2. URL Lookup Logic
```java
// Try to find URL with specific domain first
Optional<ShortenedUrl> urlOpt = urlShorteningService.getByShortCodeAndDomain(shortCode, hostDomain);

// If not found, try default domain (backward compatibility)
if (urlOpt.isEmpty()) {
    urlOpt = urlShorteningService.getByShortCode(shortCode);
}
```

## 📊 Database Storage

### URL Creation with Custom Domain
```javascript
// Frontend sends:
{
  "originalUrl": "https://example.com/page",
  "customDomain": "go.yourname.com",
  "shortCode": "abc123"
}

// Backend stores:
{
  "_id": "...",
  "shortCode": "abc123",
  "originalUrl": "https://example.com/page",
  "domain": "go.yourname.com",        // Custom domain
  "shortUrl": "https://go.yourname.com/abc123",
  "userId": "user123"
}
```

### URL Creation with Default Domain
```javascript
// Frontend sends:
{
  "originalUrl": "https://example.com/page",
  "shortCode": "def456"
}

// Backend stores:
{
  "_id": "...",
  "shortCode": "def456",
  "originalUrl": "https://example.com/page",
  "domain": null,                     // No custom domain
  "shortUrl": "https://pebly.vercel.app/def456",
  "userId": "user123"
}
```

## 🌐 DNS Configuration

### Default Domain (pebly.vercel.app)
```
pebly.vercel.app → A record → Vercel IP → urlshortner-1-hpyu.onrender.com
```

### Custom Domain (go.yourname.com)
```
go.yourname.com → CNAME → pebly-universal-proxy.workers.dev → urlshortner-1-hpyu.onrender.com
```

## 🔍 Request Flow Examples

### Example 1: Default Domain Access
```
1. User visits: https://pebly.vercel.app/abc123
2. DNS resolves to Vercel
3. Vercel forwards to: urlshortner-1-hpyu.onrender.com/abc123
4. RedirectController:
   - getOriginalHostDomain() returns "urlshortner-1-hpyu.onrender.com"
   - Looks up shortCode "abc123" with domain null
   - Finds URL and redirects to original URL
```

### Example 2: Custom Domain Access
```
1. User visits: https://go.yourname.com/abc123
2. DNS resolves to Cloudflare Worker
3. Worker forwards to: urlshortner-1-hpyu.onrender.com/abc123
   Headers: X-Forwarded-Host: go.yourname.com
4. RedirectController:
   - getOriginalHostDomain() returns "go.yourname.com"
   - Looks up shortCode "abc123" with domain "go.yourname.com"
   - Finds URL and redirects to original URL
```

## 🛠️ Key Components

### 1. Cloudflare Worker Proxy
- **Purpose**: Handle unlimited custom domains
- **Function**: Forward requests to backend with original domain headers
- **Benefits**: No manual domain configuration needed

### 2. Backend RedirectController
- **Purpose**: Process redirects for both default and custom domains
- **Function**: Detect domain source and lookup URLs accordingly
- **Benefits**: Supports multi-tenant URL resolution

### 3. Frontend Domain Manager
- **Purpose**: Allow users to add custom domains
- **Function**: Provide DNS instructions and verification
- **Benefits**: Self-service domain setup

## ✅ Why This Architecture Works

### 1. **Scalability**
- Unlimited custom domains without backend changes
- Cloudflare handles global traffic distribution
- No manual DNS configuration required

### 2. **Backward Compatibility**
- Existing pebly.vercel.app links continue working
- Default domain users unaffected
- Gradual migration to custom domains

### 3. **Performance**
- Edge caching via Cloudflare
- Reduced backend load
- Fast global redirects

### 4. **Reliability**
- Fallback logic for URL lookup
- Error handling at multiple levels
- Monitoring and analytics built-in

## 🔧 Configuration Summary

### For Default Domain Users
- **No changes needed**
- Links work as before: `pebly.vercel.app/shortcode`
- Direct backend access

### For Custom Domain Users
- **DNS Setup**: CNAME to Cloudflare Worker
- **Link Creation**: Choose custom domain in UI
- **Access**: `go.yourname.com/shortcode` → proxy → backend → redirect

### For Developers
- **Backend**: Handles both direct and proxied requests
- **Proxy**: Forwards with proper headers
- **Frontend**: Configurable proxy domain

---

## 🎯 This Architecture Provides:

✅ **Unlimited custom domains** without backend scaling issues  
✅ **Backward compatibility** with existing links  
✅ **Self-service setup** for users  
✅ **Global performance** via Cloudflare edge network  
✅ **Comprehensive monitoring** and analytics  
✅ **Cost-effective scaling** using serverless infrastructure  

**The system correctly handles both default and custom domain scenarios! 🚀**