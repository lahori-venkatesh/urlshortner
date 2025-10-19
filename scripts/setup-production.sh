#!/bin/bash

# Pebly Production Setup Script
# This script sets up the production environment with MongoDB and Redis

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

echo "🚀 Setting up Pebly for Production Environment"
echo "=============================================="
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check prerequisites
print_status "Checking prerequisites..."

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    print_error "MongoDB is not installed. Please install MongoDB first."
    echo ""
    print_info "On Ubuntu/Debian: sudo apt-get install mongodb-org"
    print_info "On CentOS/RHEL: sudo yum install mongodb-org"
    print_info "On macOS: brew install mongodb-community"
    print_info "Installation guide: https://docs.mongodb.com/manual/installation/"
    exit 1
fi

# Check if Redis is installed
if ! command -v redis-cli &> /dev/null; then
    print_warning "Redis is not installed. Installing Redis is recommended for production."
    echo ""
    print_info "On Ubuntu/Debian: sudo apt-get install redis-server"
    print_info "On CentOS/RHEL: sudo yum install redis"
    print_info "On macOS: brew install redis"
    echo ""
    read -p "Continue without Redis? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create production environment file
print_status "Creating production environment configuration..."

if [ ! -f .env.production ]; then
    cat > .env.production << EOF
# Pebly Production Environment Configuration
# IMPORTANT: Change all default passwords and secrets!

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/pebly_prod
MONGODB_DATABASE=pebly_prod
MONGODB_USERNAME=pebly_user
MONGODB_PASSWORD=CHANGE_THIS_PASSWORD_IN_PRODUCTION
MONGODB_AUTH_DB=admin

# Redis Configuration (optional but recommended)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=CHANGE_THIS_REDIS_PASSWORD

# Security Configuration
JWT_SECRET=CHANGE_THIS_TO_A_VERY_LONG_AND_SECURE_SECRET_KEY_AT_LEAST_64_CHARACTERS_LONG
JWT_EXPIRATION=86400000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://your-domain.com/auth/callback

# Razorpay Payment Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_here

# Application URLs
FRONTEND_URL=https://your-domain.com
APP_BASE_URL=https://api.your-domain.com

# File Upload Configuration
FILE_STORAGE_PATH=/var/pebly/uploads
MAX_FILE_SIZE=50MB
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,gif,doc,docx,txt,zip

# Logging Configuration
LOG_FILE=/var/log/pebly/application.log

# Server Configuration
PORT=8080
SPRING_PROFILES_ACTIVE=prod
EOF

    print_status "✅ Created .env.production file"
    print_warning "⚠️  IMPORTANT: Edit .env.production and change all default passwords and secrets!"
else
    print_info "Production environment file already exists"
fi

# Create necessary directories
print_status "Creating necessary directories..."
sudo mkdir -p /var/pebly/uploads
sudo mkdir -p /var/log/pebly
sudo mkdir -p /etc/pebly

# Set proper permissions
sudo chown -R $USER:$USER /var/pebly
sudo chown -R $USER:$USER /var/log/pebly
sudo chmod 755 /var/pebly/uploads
sudo chmod 755 /var/log/pebly

print_status "✅ Created directories with proper permissions"

# MongoDB setup
print_status "Setting up MongoDB database..."

# Generate random password for database user
DB_PASSWORD=$(openssl rand -base64 32)

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Create database and user
mongosh << EOF
use admin

// Create admin user if not exists
db.createUser({
  user: "pebly_user",
  pwd: "$DB_PASSWORD",
  roles: [
    { role: "readWrite", db: "pebly_prod" },
    { role: "dbAdmin", db: "pebly_prod" }
  ]
})

use pebly_prod

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "googleId": 1 }, { unique: true })
db.users.createIndex({ "createdAt": 1 })
db.users.createIndex({ "isActive": 1 })

db.url_mappings.createIndex({ "shortCode": 1 }, { unique: true })
db.url_mappings.createIndex({ "createdBy": 1 })
db.url_mappings.createIndex({ "createdAt": 1 })
db.url_mappings.createIndex({ "expirationDate": 1 })
db.url_mappings.createIndex({ "isActive": 1 })

db.subscriptions.createIndex({ "userId": 1 })
db.subscriptions.createIndex({ "status": 1 })
db.subscriptions.createIndex({ "endDate": 1 })

db.qr_codes.createIndex({ "qrId": 1 }, { unique: true })
db.qr_codes.createIndex({ "urlMappingId": 1 })
db.qr_codes.createIndex({ "createdBy": 1 })

db.file_uploads.createIndex({ "fileId": 1 }, { unique: true })
db.file_uploads.createIndex({ "urlMappingId": 1 })
db.file_uploads.createIndex({ "createdBy": 1 })
db.file_uploads.createIndex({ "expiresAt": 1 })

db.analytics_events.createIndex({ "urlMappingId": 1 })
db.analytics_events.createIndex({ "createdAt": 1 })
db.analytics_events.createIndex({ "eventType": 1 })
db.analytics_events.createIndex({ "country": 1 })
db.analytics_events.createIndex({ "deviceType": 1 })

print("MongoDB database and indexes created successfully")
EOF

# Update the environment file with the generated password
sed -i "s/MONGODB_PASSWORD=CHANGE_THIS_PASSWORD_IN_PRODUCTION/MONGODB_PASSWORD=$DB_PASSWORD/" .env.production

print_status "✅ MongoDB database and user created successfully"

# Redis setup (if installed)
if command -v redis-cli &> /dev/null; then
    print_status "Configuring Redis..."
    
    # Generate Redis password
    REDIS_PASSWORD=$(openssl rand -base64 32)
    
    # Update Redis configuration (basic security)
    if [ -f /etc/redis/redis.conf ]; then
        sudo cp /etc/redis/redis.conf /etc/redis/redis.conf.backup
        sudo sed -i "s/# requirepass foobared/requirepass $REDIS_PASSWORD/" /etc/redis/redis.conf
        sudo sed -i "s/bind 127.0.0.1/bind 127.0.0.1/" /etc/redis/redis.conf
        
        # Update environment file
        sed -i "s/REDIS_PASSWORD=CHANGE_THIS_REDIS_PASSWORD/REDIS_PASSWORD=$REDIS_PASSWORD/" .env.production
        
        # Restart Redis
        sudo systemctl restart redis
        print_status "✅ Redis configured and restarted"
    else
        print_warning "Redis configuration file not found. Please configure Redis manually."
    fi
fi

# Create systemd service file
print_status "Creating systemd service..."

sudo tee /etc/systemd/system/pebly.service > /dev/null << EOF
[Unit]
Description=Pebly URL Shortener Service
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment=SPRING_PROFILES_ACTIVE=prod
EnvironmentFile=$(pwd)/.env.production
ExecStart=$(pwd)/backend/url-service/mvnw spring-boot:run
Restart=always
RestartSec=10

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/pebly /var/log/pebly

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
print_status "✅ Systemd service created"

# Create nginx configuration (optional)
if command -v nginx &> /dev/null; then
    print_status "Creating Nginx configuration..."
    
    sudo tee /etc/nginx/sites-available/pebly << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL configuration (you need to obtain SSL certificates)
    # ssl_certificate /path/to/your/certificate.crt;
    # ssl_certificate_key /path/to/your/private.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Frontend (serve static files)
    location / {
        root $(pwd)/frontend/build;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Short URL redirects
    location ~ ^/[a-zA-Z0-9]+$ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    print_status "✅ Nginx configuration created (disabled by default)"
    print_info "To enable: sudo ln -s /etc/nginx/sites-available/pebly /etc/nginx/sites-enabled/"
fi

# Create backup script
print_status "Creating production backup script..."

cat > scripts/backup-production.sh << 'EOF'
#!/bin/bash

# Pebly Production Backup Script

BACKUP_DIR="/var/backups/pebly"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="pebly_prod"
DB_USER="pebly_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# MongoDB backup
echo "Creating MongoDB backup..."
mongodump --host localhost --db pebly_prod --out $BACKUP_DIR/mongodb_$DATE
tar -czf $BACKUP_DIR/pebly_mongodb_$DATE.tar.gz -C $BACKUP_DIR mongodb_$DATE
rm -rf $BACKUP_DIR/mongodb_$DATE

# File uploads backup
echo "Creating file uploads backup..."
tar -czf $BACKUP_DIR/pebly_files_$DATE.tar.gz -C /var/pebly uploads/

# Application logs backup
echo "Creating logs backup..."
tar -czf $BACKUP_DIR/pebly_logs_$DATE.tar.gz -C /var/log pebly/

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "pebly_*" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x scripts/backup-production.sh
print_status "✅ Production backup script created"

# Final instructions
echo ""
print_status "🎉 Production setup completed!"
echo ""
print_info "📋 Next Steps:"
echo "1. Edit .env.production and update all configuration values"
echo "2. Obtain SSL certificates for your domain"
echo "3. Update Nginx configuration with your domain and SSL paths"
echo "4. Build the frontend: cd frontend && npm run build"
echo "5. Start the service: sudo systemctl start pebly"
echo "6. Enable auto-start: sudo systemctl enable pebly"
echo ""
print_info "🔧 Useful Commands:"
echo "• Check service status: sudo systemctl status pebly"
echo "• View logs: sudo journalctl -u pebly -f"
echo "• Restart service: sudo systemctl restart pebly"
echo "• Run backup: ./scripts/backup-production.sh"
echo ""
print_warning "⚠️  Security Reminders:"
echo "• Change all default passwords in .env.production"
echo "• Set up SSL certificates"
echo "• Configure firewall rules"
echo "• Set up monitoring and alerting"
echo "• Regular backups and security updates"
echo ""
print_info "📊 Monitoring URLs:"
echo "• Health check: https://your-domain.com/api/actuator/health"
echo "• Metrics: https://your-domain.com/api/actuator/metrics"
echo ""
EOF