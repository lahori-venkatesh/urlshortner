# ⚡ Quick Commands Reference

## 🚀 **Deployment Commands**

### **Cloudflare Worker**
```bash
cd pebly-universal-proxy
wrangler login
wrangler deploy --env production
wrangler tail --env production  # View logs
```

### **Frontend (Local Build)**
```bash
cd frontend
npm install
npm run build
# Deploy via Vercel Dashboard or CLI
```

### **Backend (Local Build)**
```bash
cd backend/url-service
mvn clean package -DskipTests
# Deploy via Render Dashboard
```

---

## 🧪 **Testing Commands**

### **DNS Testing**
```bash
# Check CNAME record
dig go.example.com CNAME

# Check A record
dig tinyslash.com A

# Check nameservers
dig tinyslash.com NS
```

### **SSL Testing**
```bash
# Test HTTPS
curl -I https://go.example.com

# Check certificate
openssl s_client -connect go.example.com:443 -servername go.example.com

# Test SSL endpoint
curl https://urlshortner-1-hpyu.onrender.com/api/v1/admin/ssl/usage
```

### **Health Checks**
```bash
# Backend health
curl https://urlshortner-1-hpyu.onrender.com/actuator/health

# Worker health
curl https://tinyslash.com/health

# Frontend
curl -I https://tinyslash.com
```

---

## 📊 **Monitoring Commands**

### **Check SSL Usage**
```bash
curl https://urlshortner-1-hpyu.onrender.com/api/v1/admin/ssl/usage | jq
```

### **List Custom Hostnames**
```bash
curl https://urlshortner-1-hpyu.onrender.com/api/v1/admin/ssl/hostnames | jq
```

### **Check Limit**
```bash
curl https://urlshortner-1-hpyu.onrender.com/api/v1/admin/ssl/limit-check | jq
```

### **Worker Logs**
```bash
cd pebly-universal-proxy
wrangler tail --env production
```

---

## 🔧 **Troubleshooting Commands**

### **Clear Caches**
```bash
# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend/url-service
mvn clean
```

### **Check Versions**
```bash
node -v          # Should be 18+
npm -v
java -version    # Should be 17+
mvn -version
wrangler version
```

### **DNS Flush**
```bash
# macOS
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# Linux
sudo systemd-resolve --flush-caches

# Windows
ipconfig /flushdns
```

---

## 🎯 **Quick Fixes**

### **Worker Not Responding**
```bash
cd pebly-universal-proxy
wrangler deploy --env production --force
```

### **Frontend Build Errors**
```bash
cd frontend
rm -rf node_modules build
npm install
npm run build
```

### **Backend Compile Errors**
```bash
cd backend/url-service
mvn clean compile -DskipTests
```

---

## 📝 **Environment Variable Commands**

### **Check Current Env (Backend)**
```bash
# On Render Dashboard → Environment tab
# Or via CLI if configured
```

### **Check Current Env (Frontend)**
```bash
# On Vercel Dashboard → Settings → Environment Variables
# Or via CLI
vercel env ls
```

---

## 🎨 **Development Commands**

### **Run Frontend Locally**
```bash
cd frontend
npm start
# Opens http://localhost:3000
```

### **Run Backend Locally**
```bash
cd backend/url-service
./mvnw spring-boot:run
# Runs on http://localhost:8080
```

### **Run Worker Locally**
```bash
cd pebly-universal-proxy
wrangler dev
# Test locally before deploying
```

---

## 📦 **Backup Commands**

### **Backup Database**
```bash
# MongoDB Atlas - use Atlas UI for backups
# Or use mongodump
mongodump --uri="your_mongodb_uri" --out=./backup
```

### **Backup Code**
```bash
# Create git tag
git tag -a v1.0.0 -m "TinySlash launch"
git push origin v1.0.0
```

---

## 🔍 **Debugging Commands**

### **Check API Response**
```bash
# Test URL creation
curl -X POST https://urlshortner-1-hpyu.onrender.com/api/v1/urls \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "https://google.com"}'
```

### **Check Custom Domain**
```bash
# Get domain info
curl https://urlshortner-1-hpyu.onrender.com/api/v1/domains/user/USER_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### **Test Redirect**
```bash
# Follow redirects
curl -L https://tinyslash.com/abc123
```

---

## 🎯 **One-Line Deployment**

### **Deploy Everything**
```bash
# Worker
cd pebly-universal-proxy && wrangler deploy --env production && cd ..

# Frontend (via Vercel CLI)
cd frontend && vercel --prod && cd ..

# Backend (manual via Render Dashboard)
```

---

## 📊 **Status Check Script**

```bash
#!/bin/bash
echo "🔍 TinySlash Status Check"
echo ""
echo "Frontend:"
curl -I https://tinyslash.com 2>&1 | head -1
echo ""
echo "Backend:"
curl -s https://urlshortner-1-hpyu.onrender.com/actuator/health | jq -r '.status'
echo ""
echo "Worker:"
curl -s https://tinyslash.com/health | jq -r '.status'
echo ""
echo "SSL Usage:"
curl -s https://urlshortner-1-hpyu.onrender.com/api/v1/admin/ssl/usage | jq -r '.stats.total'
echo ""
```

Save as `check-status.sh`, make executable: `chmod +x check-status.sh`

---

## 🎉 **Launch Checklist Commands**

```bash
# 1. Check builds
cd frontend && npm run build && cd ..
cd backend/url-service && mvn clean compile -DskipTests && cd ../..

# 2. Deploy worker
cd pebly-universal-proxy && wrangler deploy --env production && cd ..

# 3. Test health
curl https://urlshortner-1-hpyu.onrender.com/actuator/health
curl https://tinyslash.com/health

# 4. Check SSL
curl https://urlshortner-1-hpyu.onrender.com/api/v1/admin/ssl/health

# 5. Test DNS
dig tinyslash.com

# 6. All good? Launch! 🚀
```

---

**Save this file for quick reference during deployment!** 📌
