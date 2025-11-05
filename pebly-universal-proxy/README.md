# Pebly Universal Custom Domain Proxy

🚀 **Cloudflare Workers solution that handles UNLIMITED custom domains automatically!**

## Features

- ✅ **Unlimited Domains**: Handles any custom domain without manual setup
- ✅ **Automatic SSL**: HTTPS works for any domain instantly  
- ✅ **Global Edge**: Fast redirects via Cloudflare's global network
- ✅ **Zero Maintenance**: No manual domain addition required
- ✅ **Beautiful Errors**: Professional error pages for broken links
- ✅ **Analytics Ready**: Forwards all headers for tracking

## How It Works

```
User Domain (links.pdfcircle.com) 
    ↓ CNAME points to
Cloudflare Worker (pebly-universal-proxy.workers.dev)
    ↓ Automatically forwards to
Your Backend (urlshortner-1-hpyu.onrender.com)
    ↓ Redirects to
Original URL ✅
```

## Deployment

### Prerequisites
- Cloudflare account (free)
- Wrangler CLI installed

### Steps

1. **Install Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Deploy Worker**
   ```bash
   cd pebly-universal-proxy
   npm install
   wrangler deploy
   ```

4. **Get Worker URL**
   - Example: `pebly-universal-proxy.your-subdomain.workers.dev`

5. **Update Frontend**
   - Replace Vercel proxy URL with Worker URL
   - Users point domains to Worker URL

## User Instructions

**For ALL users (any domain provider):**

```
Type: CNAME
Name: links (or go, short, etc.)
Target: pebly-universal-proxy.your-subdomain.workers.dev
TTL: Auto
```

## Supported Providers

- ✅ **Hostinger** - CNAME → Worker URL
- ✅ **GoDaddy** - CNAME → Worker URL  
- ✅ **Namecheap** - CNAME → Worker URL
- ✅ **Cloudflare** - CNAME → Worker URL (DNS only)
- ✅ **Domain.com** - CNAME → Worker URL
- ✅ **ANY Provider** - Same instruction!

## Benefits

### For Users
- Simple one-time DNS setup
- Works with any domain provider
- Automatic HTTPS/SSL
- Fast global redirects

### For Platform
- Unlimited scalability
- Zero manual work
- No domain limits
- Professional reliability

## Configuration

Edit `src/index.js` to customize:

- **Backend URL**: Change `BACKEND_URL` constant
- **Error Pages**: Modify `createErrorPage()` function
- **Headers**: Adjust forwarded headers
- **Logging**: Add custom analytics

## Monitoring

View logs in Cloudflare Dashboard:
- Workers → pebly-universal-proxy → Logs
- Real-time request monitoring
- Error tracking and debugging

## Limits

**Cloudflare Workers Free Tier:**
- 100,000 requests/day
- 1000 requests/minute
- 10ms CPU time per request

**Paid Tier ($5/month):**
- 10 million requests/month
- No daily limits
- 50ms CPU time per request

## Custom Domain (Optional)

To use your own domain for the worker:

1. **Add domain to Cloudflare**
2. **Update wrangler.toml**:
   ```toml
   routes = [
     { pattern = "proxy.pebly.com/*", zone_name = "pebly.com" }
   ]
   ```
3. **Deploy**: `wrangler deploy`

## Support

- **Documentation**: https://developers.cloudflare.com/workers/
- **Community**: https://discord.gg/cloudflaredev
- **Issues**: Create GitHub issue in main repo