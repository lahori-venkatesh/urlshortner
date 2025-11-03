# BitaURL - Deployment Documentation

## 🎯 Deployment Overview

BitaURL follows a modern cloud-native deployment strategy with containerized applications, automated CI/CD pipelines, and infrastructure as code. The platform is designed for high availability, scalability, and zero-downtime deployments across multiple environments.

## 🏗️ Infrastructure Architecture

### Cloud Infrastructure Stack
```
┌─────────────────────────────────────────────────────────────────┐
│                        Production Environment                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Frontend  │  │ Admin Panel │  │      CDN (CloudFlare)   │  │
│  │  (Vercel)   │  │  (Vercel)   │  │   Global Distribution   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                           │                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                 Load Balancer                               │ │
│  │              (CloudFlare + Nginx)                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                Backend Services                             │ │
│  │              (Render - Auto Scaling)                       │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │   API-1     │  │   API-2     │  │      API-N          │ │ │
│  │  │ (Container) │  │ (Container) │  │   (Container)       │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                           │                                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   Data Layer                                │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │  MongoDB    │  │    Redis    │  │      AWS S3         │ │ │
│  │  │   Atlas     │  │   Cloud     │  │   File Storage      │ │ │
│  │  │ (Primary)   │  │  (Cache)    │  │   + CloudFront      │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Environment Strategy
- **Development** - Local development environment
- **Staging** - Pre-production testing environment
- **Production** - Live production environment
- **DR (Disaster Recovery)** - Backup production environment

## 🐳 Containerization

### Docker Configuration

#### Backend Dockerfile
```dockerfile
# Multi-stage build for Spring Boot application
FROM openjdk:17-jdk-slim as builder

WORKDIR /app
COPY pom.xml .
COPY src ./src

# Download dependencies
RUN apt-get update && apt-get install -y maven
RUN mvn dependency:go-offline -B

# Build application
RUN mvn clean package -DskipTests

# Production stage
FROM openjdk:17-jre-slim

# Create non-root user
RUN groupadd -r bitaurl && useradd -r -g bitaurl bitaurl

# Install security updates
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
    curl \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy application jar
COPY --from=builder /app/target/bitaurl-backend-*.jar app.jar

# Change ownership to non-root user
RUN chown -R bitaurl:bitaurl /app
USER bitaurl

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/v1/health || exit 1

EXPOSE 8080

# JVM optimization for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

#### Frontend Dockerfile
```dockerfile
# Multi-stage build for React application
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose for Development
```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=development
      - MONGODB_URI=mongodb://mongodb:27017/bitaurl
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - mongodb
      - redis
    networks:
      - bitaurl-network
    volumes:
      - ./logs:/app/logs

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      - REACT_APP_API_URL=http://localhost:8080
    networks:
      - bitaurl-network

  admin-panel:
    build:
      context: ./admin-panel
      dockerfile: Dockerfile
    ports:
      - "3001:80"
    environment:
      - REACT_APP_API_URL=http://localhost:8080
    networks:
      - bitaurl-network

  mongodb:
    image: mongo:6.0
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
      - MONGO_INITDB_DATABASE=bitaurl
    volumes:
      - mongodb_data:/data/db
      - ./scripts/init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
    networks:
      - bitaurl-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - bitaurl-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
      - admin-panel
    networks:
      - bitaurl-network

volumes:
  mongodb_data:
  redis_data:

networks:
  bitaurl-network:
    driver: bridge
```

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow

#### Backend CI/CD
```yaml
# .github/workflows/backend-ci-cd.yml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
    paths: ['backend/**']
  pull_request:
    branches: [main]
    paths: ['backend/**']

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: bitaurl/backend

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:6.0
        ports:
          - 27017:27017
        options: >-
          --health-cmd "mongosh --eval 'db.adminCommand(\"ping\")'"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'

    - name: Cache Maven dependencies
      uses: actions/cache@v3
      with:
        path: ~/.m2
        key: ${{ runner.os }}-m2-${{ hashFiles('**/pom.xml') }}
        restore-keys: ${{ runner.os }}-m2

    - name: Run tests
      working-directory: ./backend
      run: |
        mvn clean test
        mvn jacoco:report

    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/target/site/jacoco/jacoco.xml
        flags: backend

    - name: Run security scan
      working-directory: ./backend
      run: mvn org.owasp:dependency-check-maven:check

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'

    - name: Build application
      working-directory: ./backend
      run: mvn clean package -DskipTests

    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}

    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}

    - name: Deploy to Render
      uses: johnbeynon/render-deploy-action@v0.0.8
      with:
        service-id: ${{ secrets.RENDER_SERVICE_ID }}
        api-key: ${{ secrets.RENDER_API_KEY }}
        wait-for-success: true

    - name: Run smoke tests
      run: |
        sleep 30
        curl -f ${{ secrets.BACKEND_URL }}/api/v1/health || exit 1

    - name: Notify deployment
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        channel: '#deployments'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
      if: always()
```

#### Frontend CI/CD
```yaml
# .github/workflows/frontend-ci-cd.yml
name: Frontend CI/CD

on:
  push:
    branches: [main, develop]
    paths: ['frontend/**']
  pull_request:
    branches: [main]
    paths: ['frontend/**']

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json

    - name: Install dependencies
      working-directory: ./frontend
      run: npm ci

    - name: Run linting
      working-directory: ./frontend
      run: npm run lint

    - name: Run type checking
      working-directory: ./frontend
      run: npm run type-check

    - name: Run tests
      working-directory: ./frontend
      run: npm run test:coverage

    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./frontend/coverage/lcov.info
        flags: frontend

    - name: Run security audit
      working-directory: ./frontend
      run: npm audit --audit-level high

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json

    - name: Install dependencies
      working-directory: ./frontend
      run: npm ci

    - name: Build application
      working-directory: ./frontend
      env:
        REACT_APP_API_URL: ${{ secrets.REACT_APP_API_URL }}
        REACT_APP_RAZORPAY_KEY: ${{ secrets.REACT_APP_RAZORPAY_KEY }}
        REACT_APP_GOOGLE_CLIENT_ID: ${{ secrets.REACT_APP_GOOGLE_CLIENT_ID }}
      run: npm run build

    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        working-directory: ./frontend
        vercel-args: '--prod'

    - name: Run E2E tests
      working-directory: ./frontend
      run: |
        npm run test:e2e:ci
      env:
        CYPRESS_BASE_URL: ${{ secrets.FRONTEND_URL }}

    - name: Notify deployment
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        channel: '#deployments'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
      if: always()
```

### Deployment Scripts

#### Backend Deployment Script
```bash
#!/bin/bash
# scripts/deploy-backend.sh

set -e

# Configuration
ENVIRONMENT=${1:-staging}
IMAGE_TAG=${2:-latest}
SERVICE_NAME="bitaurl-backend"

echo "🚀 Deploying BitaURL Backend to $ENVIRONMENT"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Load environment variables
source "./config/$ENVIRONMENT.env"

# Build and tag Docker image
echo "📦 Building Docker image..."
docker build -t $SERVICE_NAME:$IMAGE_TAG ./backend

# Tag for registry
docker tag $SERVICE_NAME:$IMAGE_TAG $DOCKER_REGISTRY/$SERVICE_NAME:$IMAGE_TAG

# Push to registry
echo "📤 Pushing to registry..."
docker push $DOCKER_REGISTRY/$SERVICE_NAME:$IMAGE_TAG

# Deploy to Render
echo "🚀 Deploying to Render..."
curl -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"serviceId\": \"$RENDER_SERVICE_ID\", \"imageUrl\": \"$DOCKER_REGISTRY/$SERVICE_NAME:$IMAGE_TAG\"}" \
  https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys

# Wait for deployment
echo "⏳ Waiting for deployment to complete..."
sleep 60

# Health check
echo "🏥 Running health check..."
for i in {1..10}; do
    if curl -f "$BACKEND_URL/api/v1/health"; then
        echo "✅ Health check passed"
        break
    else
        echo "⏳ Health check failed, retrying in 10 seconds..."
        sleep 10
    fi
    
    if [ $i -eq 10 ]; then
        echo "❌ Health check failed after 10 attempts"
        exit 1
    fi
done

# Run smoke tests
echo "🧪 Running smoke tests..."
./scripts/smoke-tests.sh $ENVIRONMENT

echo "✅ Deployment completed successfully!"

# Send notification
curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"✅ BitaURL Backend deployed to $ENVIRONMENT successfully!\"}" \
    $SLACK_WEBHOOK_URL
```

#### Database Migration Script
```bash
#!/bin/bash
# scripts/migrate-database.sh

set -e

ENVIRONMENT=${1:-staging}
MIGRATION_VERSION=${2:-latest}

echo "🗄️ Running database migrations for $ENVIRONMENT"

# Load environment variables
source "./config/$ENVIRONMENT.env"

# Backup database before migration
echo "💾 Creating database backup..."
mongodump --uri="$MONGODB_URI" --out="./backups/pre-migration-$(date +%Y%m%d_%H%M%S)"

# Run migrations
echo "🔄 Running migrations..."
java -jar ./backend/target/bitaurl-backend-*.jar \
    --spring.profiles.active=$ENVIRONMENT \
    --spring.liquibase.change-log=classpath:db/changelog/db.changelog-master.xml \
    --spring.liquibase.contexts=$ENVIRONMENT

echo "✅ Database migration completed successfully!"
```

## 🌐 Environment Configuration

### Environment Variables

#### Production Environment
```bash
# config/production.env

# Application
SPRING_PROFILES_ACTIVE=production
SERVER_PORT=8080

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bitaurl?retryWrites=true&w=majority
MONGODB_DATABASE=bitaurl

# Cache
REDIS_HOST=redis-cluster.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=secure_redis_password
REDIS_SSL=true

# Security
JWT_SECRET=super_secure_jwt_secret_key_256_bits_long
JWT_ACCESS_TOKEN_EXPIRATION=900000
JWT_REFRESH_TOKEN_EXPIRATION=604800000

# OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# File Storage
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=bitaurl-files-prod
AWS_S3_REGION=us-east-1
AWS_CLOUDFRONT_DOMAIN=cdn.bitaurl.com

# Payment
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Email
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@bitaurl.com

# Monitoring
SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id
NEW_RELIC_LICENSE_KEY=your_new_relic_license_key

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_BURST_CAPACITY=200

# CORS
ALLOWED_ORIGINS=https://bitaurl.com,https://admin.bitaurl.com
```

#### Staging Environment
```bash
# config/staging.env

# Application
SPRING_PROFILES_ACTIVE=staging
SERVER_PORT=8080

# Database
MONGODB_URI=mongodb+srv://username:password@staging-cluster.mongodb.net/bitaurl_staging
MONGODB_DATABASE=bitaurl_staging

# Cache
REDIS_HOST=staging-redis.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=staging_redis_password

# Security
JWT_SECRET=staging_jwt_secret_key
JWT_ACCESS_TOKEN_EXPIRATION=900000
JWT_REFRESH_TOKEN_EXPIRATION=604800000

# OAuth
GOOGLE_CLIENT_ID=staging_google_client_id
GOOGLE_CLIENT_SECRET=staging_google_client_secret

# File Storage
AWS_S3_BUCKET=bitaurl-files-staging
AWS_S3_REGION=us-east-1

# Payment
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=test_razorpay_secret

# Email
SENDGRID_API_KEY=staging_sendgrid_api_key
FROM_EMAIL=staging@bitaurl.com

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=1000
RATE_LIMIT_BURST_CAPACITY=2000

# CORS
ALLOWED_ORIGINS=https://staging.bitaurl.com,https://staging-admin.bitaurl.com
```

### Kubernetes Configuration (Future)

#### Deployment Manifest
```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bitaurl-backend
  namespace: bitaurl
  labels:
    app: bitaurl-backend
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bitaurl-backend
  template:
    metadata:
      labels:
        app: bitaurl-backend
        version: v1
    spec:
      containers:
      - name: backend
        image: ghcr.io/bitaurl/backend:latest
        ports:
        - containerPort: 8080
        env:
        - name: SPRING_PROFILES_ACTIVE
          value: "production"
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: bitaurl-secrets
              key: mongodb-uri
        - name: REDIS_HOST
          valueFrom:
            configMapKeyRef:
              name: bitaurl-config
              key: redis-host
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/v1/health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v1/health/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
          allowPrivilegeEscalation: false
          readOnlyRootFilesystem: true
---
apiVersion: v1
kind: Service
metadata:
  name: bitaurl-backend-service
  namespace: bitaurl
spec:
  selector:
    app: bitaurl-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8080
  type: ClusterIP
```

#### ConfigMap and Secrets
```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: bitaurl-config
  namespace: bitaurl
data:
  redis-host: "redis-cluster.bitaurl.svc.cluster.local"
  redis-port: "6379"
  aws-region: "us-east-1"
  s3-bucket: "bitaurl-files-prod"
---
apiVersion: v1
kind: Secret
metadata:
  name: bitaurl-secrets
  namespace: bitaurl
type: Opaque
data:
  mongodb-uri: <base64-encoded-mongodb-uri>
  jwt-secret: <base64-encoded-jwt-secret>
  razorpay-key-secret: <base64-encoded-razorpay-secret>
  sendgrid-api-key: <base64-encoded-sendgrid-key>
```

## 📊 Monitoring & Observability

### Application Monitoring

#### Prometheus Configuration
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'bitaurl-backend'
    static_configs:
      - targets: ['backend:8080']
    metrics_path: '/actuator/prometheus'
    scrape_interval: 5s

  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb-exporter:9216']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

#### Grafana Dashboard Configuration
```json
{
  "dashboard": {
    "title": "BitaURL Application Metrics",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{uri}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          }
        ]
      }
    ]
  }
}
```

### Log Management

#### Structured Logging Configuration
```yaml
# logback-spring.xml
<configuration>
    <springProfile name="production">
        <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
            <encoder class="net.logstash.logback.encoder.LoggingEventCompositeJsonEncoder">
                <providers>
                    <timestamp/>
                    <logLevel/>
                    <loggerName/>
                    <message/>
                    <mdc/>
                    <arguments/>
                    <stackTrace/>
                </providers>
            </encoder>
        </appender>
        
        <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
            <file>logs/application.log</file>
            <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
                <fileNamePattern>logs/application.%d{yyyy-MM-dd}.%i.gz</fileNamePattern>
                <maxFileSize>100MB</maxFileSize>
                <maxHistory>30</maxHistory>
                <totalSizeCap>3GB</totalSizeCap>
            </rollingPolicy>
            <encoder class="net.logstash.logback.encoder.LoggingEventCompositeJsonEncoder">
                <providers>
                    <timestamp/>
                    <logLevel/>
                    <loggerName/>
                    <message/>
                    <mdc/>
                    <arguments/>
                    <stackTrace/>
                </providers>
            </encoder>
        </appender>
        
        <root level="INFO">
            <appender-ref ref="STDOUT"/>
            <appender-ref ref="FILE"/>
        </root>
    </springProfile>
</configuration>
```

## 🔄 Backup & Disaster Recovery

### Database Backup Strategy
```bash
#!/bin/bash
# scripts/backup-database.sh

set -e

ENVIRONMENT=${1:-production}
BACKUP_TYPE=${2:-full}
RETENTION_DAYS=${3:-30}

echo "💾 Starting database backup for $ENVIRONMENT"

# Load environment variables
source "./config/$ENVIRONMENT.env"

# Create backup directory
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

# MongoDB backup
echo "📦 Creating MongoDB backup..."
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/mongodb"

# Compress backup
echo "🗜️ Compressing backup..."
tar -czf "$BACKUP_DIR.tar.gz" -C "./backups" "$(basename $BACKUP_DIR)"
rm -rf $BACKUP_DIR

# Upload to S3
echo "☁️ Uploading backup to S3..."
aws s3 cp "$BACKUP_DIR.tar.gz" "s3://bitaurl-backups/database/$ENVIRONMENT/"

# Clean up local backup
rm "$BACKUP_DIR.tar.gz"

# Clean up old backups
echo "🧹 Cleaning up old backups..."
aws s3 ls "s3://bitaurl-backups/database/$ENVIRONMENT/" | \
    awk '{print $4}' | \
    head -n -$RETENTION_DAYS | \
    xargs -I {} aws s3 rm "s3://bitaurl-backups/database/$ENVIRONMENT/{}"

echo "✅ Database backup completed successfully!"

# Send notification
curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"💾 Database backup for $ENVIRONMENT completed successfully\"}" \
    $SLACK_WEBHOOK_URL
```

### Disaster Recovery Plan
```bash
#!/bin/bash
# scripts/disaster-recovery.sh

set -e

BACKUP_DATE=${1}
ENVIRONMENT=${2:-production}

if [ -z "$BACKUP_DATE" ]; then
    echo "❌ Please provide backup date (YYYYMMDD_HHMMSS)"
    exit 1
fi

echo "🚨 Starting disaster recovery for $ENVIRONMENT using backup $BACKUP_DATE"

# Download backup from S3
echo "📥 Downloading backup from S3..."
aws s3 cp "s3://bitaurl-backups/database/$ENVIRONMENT/backup_$BACKUP_DATE.tar.gz" ./

# Extract backup
echo "📦 Extracting backup..."
tar -xzf "backup_$BACKUP_DATE.tar.gz"

# Restore MongoDB
echo "🔄 Restoring MongoDB..."
mongorestore --uri="$MONGODB_URI" --drop "./backup_$BACKUP_DATE/mongodb"

# Verify restoration
echo "✅ Verifying restoration..."
mongo "$MONGODB_URI" --eval "db.users.countDocuments()"

# Clean up
rm -rf "backup_$BACKUP_DATE.tar.gz" "backup_$BACKUP_DATE"

echo "✅ Disaster recovery completed successfully!"

# Send notification
curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"🚨 Disaster recovery for $ENVIRONMENT completed using backup $BACKUP_DATE\"}" \
    $SLACK_WEBHOOK_URL
```

## 🔧 Infrastructure as Code

### Terraform Configuration
```hcl
# infrastructure/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "bitaurl-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# S3 Bucket for file storage
resource "aws_s3_bucket" "files" {
  bucket = "bitaurl-files-${var.environment}"
}

resource "aws_s3_bucket_versioning" "files" {
  bucket = aws_s3_bucket.files.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "files" {
  bucket = aws_s3_bucket.files.id
  
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name = aws_s3_bucket.files.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.files.bucket}"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }
  
  enabled = true
  
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.files.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}
```

## 🚦 Health Checks & Monitoring

### Application Health Checks
```java
@RestController
@RequestMapping("/api/v1/health")
public class HealthController {
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", LocalDateTime.now());
        health.put("version", getClass().getPackage().getImplementationVersion());
        
        return ResponseEntity.ok(health);
    }
    
    @GetMapping("/detailed")
    public ResponseEntity<Map<String, Object>> detailedHealth() {
        Map<String, Object> health = new HashMap<>();
        Map<String, Object> components = new HashMap<>();
        
        // Database health
        try {
            mongoTemplate.getCollection("users").countDocuments();
            components.put("database", Map.of("status", "UP", "type", "MongoDB"));
        } catch (Exception e) {
            components.put("database", Map.of("status", "DOWN", "error", e.getMessage()));
        }
        
        // Cache health
        try {
            redisTemplate.opsForValue().get("health-check");
            components.put("cache", Map.of("status", "UP", "type", "Redis"));
        } catch (Exception e) {
            components.put("cache", Map.of("status", "DOWN", "error", e.getMessage()));
        }
        
        // Overall status
        boolean allUp = components.values().stream()
            .allMatch(component -> "UP".equals(((Map<?, ?>) component).get("status")));
        
        health.put("status", allUp ? "UP" : "DOWN");
        health.put("components", components);
        health.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(health);
    }
}
```

### Uptime Monitoring
```bash
#!/bin/bash
# scripts/uptime-monitor.sh

ENDPOINTS=(
    "https://api.bitaurl.com/api/v1/health"
    "https://bitaurl.com"
    "https://admin.bitaurl.com"
)

SLACK_WEBHOOK_URL="your_slack_webhook_url"

for endpoint in "${ENDPOINTS[@]}"; do
    echo "Checking $endpoint..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
    
    if [ "$response" -eq 200 ]; then
        echo "✅ $endpoint is UP"
    else
        echo "❌ $endpoint is DOWN (HTTP $response)"
        
        # Send alert to Slack
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 ALERT: $endpoint is DOWN (HTTP $response)\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
done
```

---

This deployment documentation provides comprehensive guidance for deploying, monitoring, and maintaining the BitaURL platform across different environments. The configuration supports scalable, secure, and reliable deployments with proper monitoring and disaster recovery capabilities.