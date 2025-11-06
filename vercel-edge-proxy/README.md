# Pebly Universal Edge Proxy

**Scalable solution for unlimited custom domains using Vercel Edge Functions**

## 🎯 Purpose

This proxy handles unlimited customer custom domains for the Pebly URL shortener platform without requiring manual configuration for each domain.

## 🏗️ Architecture

```
Customer Domain → Vercel Edge → Your Backend → Original URL
go.pdfcircle.com → proxy.pebly.com → urlshortner-1-hpyu.onrender.com → ChatGPT
```

## 🚀 Deployment

### 1. Deploy to Vercel

```bash
cd vercel-edge-proxy
npm install -g vercel
vercel login
vercel --prod
```

### 2. Configure Custom Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add custom domain: `proxy.pebly.com`
3. Configure DNS: `proxy.pebly.com` → CNAME → `your-project.vercel.app`

### 3. Update Customer Instructions

Customers should now point their domains to:
```
Type: CNAME
Name: go (or links, short, etc.)
Target: proxy.pebly.com
```

## 🧪 Testing

After deployment, test:

```bash
# Test health
curl https://proxy.pebly.com/health

# Test debug
curl https://proxy.pebly.com/debug

# Test with custom domain
curl -H "Host: go.pdfcircle.com" https://proxy.pebly.com/GkEJ91
```

## ✅ Benefits

- ✅ **Unlimited custom domains** - No manual configuration per domain
- ✅ **Automatic SSL** - Vercel handles SSL certificates
- ✅ **Global performance** - Vercel's edge network
- ✅ **Cost-effective** - Much cheaper than Cloudflare for SaaS
- ✅ **Easy maintenance** - Single deployment handles all domains
- ✅ **Scalable** - Handles thousands of customer domains

## 🔧 Configuration

Environment variables (set in Vercel dashboard):
- `BACKEND_URL`: Your backend URL (default: https://urlshortner-1-hpyu.onrender.com)

## 📊 Monitoring

- **Health endpoint**: `/health`
- **Debug endpoint**: `/debug`
- **Vercel Analytics**: Built-in performance monitoring
- **Custom logging**: All requests logged with domain info

## 🎯 Customer Setup

Update your customer onboarding to use:
```
CNAME Target: proxy.pebly.com
```

Instead of:
```
CNAME Target: pebly.lahorivenkatesh709.workers.dev
```

This solves the scalability issue and works with unlimited custom domains!