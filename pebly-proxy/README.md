# Pebly Universal Custom Domain Proxy

This is a universal proxy service that allows Pebly users to use their own custom domains for short links without any complex setup.

## How It Works

1. **User adds custom domain** in Pebly dashboard
2. **User points their domain** to this proxy via CNAME
3. **Proxy forwards requests** to Pebly backend
4. **Backend handles redirects** seamlessly

## DNS Setup for Users

```
Type: CNAME
Name: links (or go, short, etc.)
Target: pebly-proxy.vercel.app
TTL: Auto
```

## Supported Providers

- ✅ Hostinger
- ✅ GoDaddy
- ✅ Namecheap  
- ✅ Cloudflare (DNS only)
- ✅ Domain.com
- ✅ Any DNS provider

## Features

- 🌐 Universal compatibility
- ⚡ Fast edge functions
- 🔒 HTTPS by default
- 📊 Request logging
- 🎨 Beautiful error pages
- 🚀 Zero configuration for users

## Deployment

```bash
npm install -g vercel
vercel --prod
```

## Environment

- **Platform:** Vercel Edge Functions
- **Runtime:** Node.js 18.x
- **Regions:** Global edge network
- **Limits:** 100GB bandwidth/month (free tier)

## Backend Integration

The proxy forwards requests to: `https://urlshortner-1-hpyu.onrender.com`

Headers added:
- `X-Forwarded-Host`: Original custom domain
- `X-Original-Host`: Original custom domain  
- `X-Forwarded-Proto`: https
- `Host`: Backend domain

## Error Handling

- **404:** Link not found
- **500:** Server error
- **502:** Backend unavailable
- **503:** Service unavailable

All errors show user-friendly pages with troubleshooting info.