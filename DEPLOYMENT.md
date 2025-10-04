# Production Deployment Guide (No Local Docker Required)

## Option 1: Railway Deployment (Recommended)

Railway is perfect for your microservices architecture and requires zero Docker setup locally.

### Step 1: Prepare Your Project

1. **Install Railway CLI:**
```bash
npm install -g @railway/cli
```

2. **Login to Railway:**
```bash
railway login
```

### Step 2: Deploy Backend (Spring Boot)

1. **Navigate to backend:**
```bash
cd backend/url-service
```

2. **Initialize Railway project:**
```bash
railway init
```

3. **Add PostgreSQL database:**
```bash
railway add postgresql
```

4. **Add Redis:**
```bash
railway add redis
```

5. **Deploy backend:**
```bash
railway up
```

### Step 3: Deploy Frontend

1. **Navigate to frontend:**
```bash
cd ../../frontend
```

2. **Create new Railway service:**
```bash
railway init
```

3. **Deploy frontend:**
```bash
railway up
```

### Step 4: Configure Environment Variables

In Railway dashboard, set these variables for your backend service:

```
SPRING_DATASOURCE_URL=${{Postgres.DATABASE_URL}}
SPRING_REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=your-secure-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

For frontend service:
```
REACT_APP_API_URL=https://your-backend-url.railway.app
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## Option 2: Vercel + PlanetScale + Upstash

### Step 1: Deploy Frontend to Vercel

```bash
npm install -g vercel
cd frontend
vercel --prod
```

### Step 2: Setup PlanetScale Database

1. Go to [planetscale.com](https://planetscale.com)
2. Create new database
3. Get connection string
4. Update your `application.yml`:

```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
```

### Step 3: Setup Upstash Redis

1. Go to [upstash.com](https://upstash.com)
2. Create Redis database
3. Get connection URL
4. Update Redis configuration

### Step 4: Deploy Backend

You can deploy the Spring Boot app to:
- **Heroku**: `git push heroku main`
- **Railway**: `railway up`
- **DigitalOcean**: Use App Platform

---

## Option 3: DigitalOcean App Platform

### Step 1: Create App Spec

Create `.do/app.yaml`:

```yaml
name: url-shortener
services:
- name: backend
  source_dir: backend/url-service
  github:
    repo: your-username/url-shortener
    branch: main
  build_command: ./mvnw clean package -DskipTests
  run_command: java -jar target/*.jar
  environment_slug: java
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: SPRING_PROFILES_ACTIVE
    value: production
  
- name: frontend
  source_dir: frontend
  github:
    repo: your-username/url-shortener
    branch: main
  build_command: npm run build
  run_command: npx serve -s build -l 3000
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs

databases:
- name: postgres
  engine: PG
  version: "15"
  
- name: redis
  engine: REDIS
  version: "7"
```

### Step 2: Deploy

```bash
doctl apps create --spec .do/app.yaml
```

---

## Option 4: AWS Amplify (Serverless)

### Step 1: Install Amplify CLI

```bash
npm install -g @aws-amplify/cli
amplify configure
```

### Step 2: Initialize Project

```bash
cd frontend
amplify init
```

### Step 3: Add Services

```bash
amplify add hosting
amplify add storage
amplify add api
amplify push
```

---

## Recommended: Railway Setup (Detailed)

Railway is the best option for your project because:
- ✅ No Docker required locally
- ✅ Automatic deployments from Git
- ✅ Built-in PostgreSQL and Redis
- ✅ Microservices friendly
- ✅ Generous free tier
- ✅ Easy environment management

### Complete Railway Setup:

1. **Create Railway account** at [railway.app](https://railway.app)

2. **Deploy backend:**
```bash
cd backend/url-service
railway login
railway init
railway add postgresql
railway add redis
railway up
```

3. **Get service URLs from Railway dashboard**

4. **Deploy frontend:**
```bash
cd ../../frontend
railway init
# Update .env with backend URL
railway up
```

5. **Configure custom domains** (optional):
   - Go to Railway dashboard
   - Add custom domain for each service
   - Update DNS records

### Environment Variables for Railway:

**Backend Service:**
```
SPRING_DATASOURCE_URL=${{Postgres.DATABASE_URL}}
SPRING_REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=your-jwt-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FRONTEND_URL=${{frontend.RAILWAY_STATIC_URL}}
```

**Frontend Service:**
```
REACT_APP_API_URL=${{backend.RAILWAY_STATIC_URL}}
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id
```

### Cost Estimation:

**Railway (Recommended):**
- Free tier: $0/month (500 hours)
- Pro: $20/month (unlimited)

**Vercel + PlanetScale + Upstash:**
- Vercel: Free tier available
- PlanetScale: $29/month
- Upstash: $0.2/100K requests

**DigitalOcean:**
- App Platform: $12/month per service
- Managed Database: $15/month

Railway offers the best value and developer experience for your use case.