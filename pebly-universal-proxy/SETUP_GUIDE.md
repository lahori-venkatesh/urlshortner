# Pebly Universal Proxy v2.0 - Complete Setup Guide

🚀 **Enhanced Cloudflare Workers solution for unlimited custom domains with analytics, caching, and monitoring**

## 🎯 What's New in v2.0

- ✅ **Enhanced Analytics** - Track redirects, performance, and usage
- ✅ **Smart Caching** - Improved performance with edge caching
- ✅ **Health Monitoring** - Built-in health checks and status monitoring
- ✅ **Better Error Handling** - More robust error pages and fallbacks
- ✅ **Environment Support** - Development and production configurations
- ✅ **Comprehensive Testing** - Automated test suite included

## 🚀 Quick Deployment

### Prerequisites
- Cloudflare account (free tier works)
- Node.js 18+ installed
- Wrangler CLI

### 1. Install Wrangler CLI
```bash
npm install -g wrangler
```

### 2. Login to Cloudflare
```bash
wrangler login
```

### 3. Clone and Deploy
```bash
cd pebly-universal-proxy
npm install
./deploy.sh
```

The deployment script will:
- Deploy to development environment first
- Test the deployment
- Ask for confirmation before production deployment
- Provide you with the final proxy URL

## 🔧 Configuration

### Environment Variables

Edit `wrangler.toml` to configure:

```toml
[vars]
BACKEND_URL = "https://your-backend.com"  # Your URL shortener backend
PROXY_VERSION = "2.0"                     # Version identifier
CACHE_TTL = "300"                         # Cache time in seconds
```

### Frontend Configuration

Update your frontend environment variables:

```bash
# .env
REACT_APP_PROXY_DOMAIN=your-worker-url.workers.dev
```

Or in your deployment platform (Vercel, Netlify, etc.):
```
REACT_APP_PROXY_DOMAIN=pebly-universal-proxy-prod.your-subdomain.workers.dev
```

## 📋 DNS Instructions for Users

After deployment, users should point their domains to:
```
Type: CNAME
Name: links (or go, short, etc.)
Target: your-worker-url.workers.dev
TTL: Auto
```

## 🧪 Testing Your Deployment

### Automated Testing
```bash
# Test your deployed worker
node test-proxy.js https://your-worker-url.workers.dev
```

### Manual Testing

1. **Health Check**
   ```bash
   curl https://your-worker-url.workers.dev/health
   ```

2. **Custom Domain Test**
   ```bash
   curl -H "Host: test.example.com" https://your-worker-url.workers.dev/test123
   ```

3. **Analytics Headers**
   ```bash
   curl -I -H "Host: analytics.example.com" https://your-worker-url.workers.dev/test
   ```

## 📊 Monitoring and Analytics

### Built-in Health Checks
- Endpoint: `https://your-worker-url.workers.dev/health`
- Returns: JSON with backend health status
- Use for uptime monitoring

### Analytics Data
The proxy automatically tracks:
- Request count and performance
- Geographic distribution (via CF-IPCountry)
- Redirect success rates
- Error rates and types

### Cloudflare Dashboard
Monitor your worker in Cloudflare Dashboard:
- Workers → pebly-universal-proxy → Analytics
- Real-time metrics and logs
- Performance insights

## 🔄 Updating Your Deployment

### Code Updates
```bash
git pull origin main
cd pebly-universal-proxy
wrangler deploy --env production
```

### Configuration Updates
1. Edit `wrangler.toml`
2. Run `wrangler deploy --env production`
3. Test with `node test-proxy.js`

## 🚨 Troubleshooting

### Common Issues

**1. "Worker not found" error**
- Check your worker URL is correct
- Ensure deployment was successful
- Verify you're using the right environment (dev/prod)

**2. DNS not resolving**
- DNS changes take 5-60 minutes to propagate
- Use `dig` or online DNS checkers to verify
- Ensure CNAME points to worker URL, not IP

**3. Backend connection issues**
- Check `BACKEND_URL` in wrangler.toml
- Verify backend is accessible from Cloudflare
- Check backend health endpoint

**4. SSL certificate issues**
- Cloudflare provides SSL automatically
- Ensure domain is not proxied through another service
- Check domain ownership in Cloudflare

### Debug Commands

```bash
# Check worker logs
wrangler tail --env production

# Test specific domain
curl -v -H "Host: yourdomain.com" https://your-worker-url.workers.dev/test

# Check DNS resolution
dig yourdomain.com CNAME
```

## 📈 Performance Optimization

### Caching Strategy
- GET requests cached for 5 minutes
- 301 redirects cached briefly
- Error pages not cached
- Cache keys include full URL path

### Rate Limiting
Cloudflare Workers Free Tier:
- 100,000 requests/day
- 1,000 requests/minute
- 10ms CPU time per request

For higher limits, upgrade to Workers Paid ($5/month):
- 10 million requests/month
- No daily limits
- 50ms CPU time per request

## 🔐 Security Features

### Headers Added
- `X-Forwarded-Host`: Original domain
- `X-Real-IP`: Client IP address
- `X-Proxy-Version`: Proxy version
- `CF-Ray`: Cloudflare request ID

### CORS Support
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: *`

## 🌍 Global Deployment

### Custom Domain (Optional)
To use your own domain for the worker:

1. Add domain to Cloudflare
2. Update `wrangler.toml`:
   ```toml
   routes = [
     { pattern = "proxy.yourdomain.com/*", zone_name = "yourdomain.com" }
   ]
   ```
3. Deploy: `wrangler deploy --env production`

### Multiple Regions
Cloudflare Workers automatically deploy to 200+ locations worldwide for optimal performance.

## 📞 Support

### Documentation
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)

### Community
- [Cloudflare Discord](https://discord.gg/cloudflaredev)
- [GitHub Issues](https://github.com/your-repo/issues)

### Monitoring
Set up alerts for:
- Worker error rate > 5%
- Response time > 1000ms
- Request volume spikes
- Backend health failures

---

## 🎉 Success Checklist

- [ ] Worker deployed successfully
- [ ] Health check returns 200 OK
- [ ] Test domain resolves correctly
- [ ] Frontend updated with new proxy URL
- [ ] DNS instructions updated for users
- [ ] Monitoring alerts configured
- [ ] Backup deployment tested

**Your universal proxy is now ready to handle unlimited custom domains! 🚀**