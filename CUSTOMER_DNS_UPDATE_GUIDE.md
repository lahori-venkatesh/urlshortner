# 🚀 Custom Domain Setup Guide - go.pdfcircle.com

## 📋 **DNS Configuration Update Required**

Your custom domain `go.pdfcircle.com` needs a DNS update to use our new **unlimited custom domain system**.

---

## 🔧 **DNS Configuration**

### **Update Your DNS Record:**

```
Type: CNAME
Name: go
Target: pebly-proxy.lahorivenkatesh709.workers.dev  ← NEW TARGET
TTL: Auto (or 300)
```

### **Previous vs New Configuration:**

| Setting | Previous (Not Working) | New (SaaS Solution) |
|---------|----------------------|-------------------|
| **Type** | CNAME | CNAME |
| **Name** | go | go |
| **Target** | ~~pebly-with-proxy.vercel.app~~ | **pebly-proxy.lahorivenkatesh709.workers.dev** |
| **TTL** | Auto | Auto |

---

## 🌐 **DNS Provider Instructions**

### **For Hostinger:**
1. Login to Hostinger Control Panel
2. Go to **DNS Zone Editor**
3. Find the existing CNAME record for `go`
4. **Edit** the record:
   - Type: `CNAME`
   - Name: `go`
   - Target: `pebly-proxy.lahorivenkatesh709.workers.dev`
5. **Save** changes

### **For GoDaddy:**
1. Login to GoDaddy Account
2. Go to **DNS Management**
3. Find the CNAME record for `go`
4. **Edit** the record:
   - Type: `CNAME`
   - Host: `go`
   - Points to: `pebly-proxy.lahorivenkatesh709.workers.dev`
5. **Save** changes

### **For Cloudflare:**
1. Login to Cloudflare Dashboard
2. Select your domain `pdfcircle.com`
3. Go to **DNS** tab
4. Find the CNAME record for `go`
5. **Edit** the record:
   - Type: `CNAME`
   - Name: `go`
   - Target: `pebly-proxy.lahorivenkatesh709.workers.dev`
   - Proxy status: **DNS only** (gray cloud)
6. **Save** changes

---

## ✅ **Verification Steps**

### **Step 1: Check DNS Propagation**
```bash
nslookup go.pdfcircle.com
# Expected result: pebly-proxy.lahorivenkatesh709.workers.dev
```

### **Step 2: Test Domain Verification**
```bash
curl https://go.pdfcircle.com/verify-domain
# Expected: {"domain": "go.pdfcircle.com", "verified": true}
```

### **Step 3: Test Your Short URL**
```bash
curl -I https://go.pdfcircle.com/HN6GQ9
# Expected: 301 redirect to ChatGPT URL
```

### **Step 4: Browser Test**
Open in browser: `https://go.pdfcircle.com/HN6GQ9`
Should redirect to: `https://chatgpt.com/c/690cdcd7-caa4-8320-89e1-54a9a3d0d79b`

---

## 🚀 **Benefits of New System**

### **✅ Unlimited Custom Domains**
- No manual configuration needed
- Instant domain activation
- Supports any number of domains

### **✅ Global Performance**
- Cloudflare's global edge network
- Sub-100ms response times worldwide
- Automatic SSL certificates

### **✅ Enterprise Features**
- Advanced analytics
- Custom error pages
- Branded experience

### **✅ Easy Management**
- Simple DNS setup
- Automatic verification
- Real-time status updates

---

## 🕐 **Timeline**

| Step | Time | Status |
|------|------|--------|
| **DNS Update** | 2 minutes | ⏳ Pending |
| **DNS Propagation** | 5-15 minutes | ⏳ Waiting |
| **Domain Verification** | Automatic | ⏳ Waiting |
| **Go Live** | Immediate after verification | ⏳ Waiting |

---

## 🆘 **Troubleshooting**

### **Issue: DNS not propagating**
- **Solution**: Wait 15-30 minutes for global propagation
- **Check**: Use different DNS servers (8.8.8.8, 1.1.1.1)

### **Issue: SSL certificate error**
- **Solution**: Cloudflare automatically provides SSL
- **Wait**: 5-10 minutes for certificate provisioning

### **Issue: 404 error on custom domain**
- **Solution**: Verify DNS points to correct worker URL
- **Check**: `nslookup go.pdfcircle.com`

---

## 📞 **Support**

If you need help with DNS configuration:
1. **Check our documentation**: [Custom Domain Setup Guide]
2. **Contact support**: Include your domain name and DNS provider
3. **Live chat**: Available 24/7 for premium customers

---

## 🎯 **Next Steps**

1. **Update DNS** → Change CNAME target to worker URL
2. **Wait for propagation** → 5-15 minutes
3. **Test domain** → Verify https://go.pdfcircle.com/HN6GQ9 works
4. **Create more URLs** → Use your custom domain for all short links
5. **Monitor analytics** → Track clicks and performance

**Your custom domain will be live within 15 minutes of DNS update!** 🚀