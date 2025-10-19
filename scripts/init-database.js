// MongoDB Database Initialization Script for Production
// Run this script to create optimized indexes for high performance

// Connect to the production database
use('pebly_production');

// Create indexes for URLs collection
db.urls.createIndex({ "shortCode": 1 }, { unique: true, background: true });
db.urls.createIndex({ "userId": 1, "createdAt": -1 }, { background: true });
db.urls.createIndex({ "shortCode": 1, "isActive": 1 }, { background: true });
db.urls.createIndex({ "expiresAt": 1, "isActive": 1 }, { background: true });
db.urls.createIndex({ "userId": 1, "isActive": 1 }, { background: true });
db.urls.createIndex({ "customDomain": 1, "shortCode": 1 }, { background: true });
db.urls.createIndex({ "isActive": 1 }, { background: true });
db.urls.createIndex({ "createdAt": -1 }, { background: true });

// Create indexes for Analytics collection
db.analytics.createIndex({ "urlId": 1, "timestamp": -1 }, { background: true });
db.analytics.createIndex({ "userId": 1, "timestamp": -1 }, { background: true });
db.analytics.createIndex({ "shortCode": 1, "timestamp": -1 }, { background: true });
db.analytics.createIndex({ "ipAddress": 1, "timestamp": -1 }, { background: true });
db.analytics.createIndex({ "timestamp": -1 }, { background: true });
db.analytics.createIndex({ "country": 1 }, { background: true });
db.analytics.createIndex({ "deviceType": 1 }, { background: true });
db.analytics.createIndex({ "browser": 1 }, { background: true });
db.analytics.createIndex({ "utmCampaign": 1 }, { background: true });

// Create indexes for Users collection
db.users.createIndex({ "email": 1 }, { unique: true, background: true });
db.users.createIndex({ "googleId": 1 }, { sparse: true, background: true });
db.users.createIndex({ "apiKey": 1 }, { sparse: true, background: true });
db.users.createIndex({ "isActive": 1 }, { background: true });
db.users.createIndex({ "subscriptionPlan": 1 }, { background: true });
db.users.createIndex({ "createdAt": -1 }, { background: true });

// Create TTL index for analytics data (optional - keep data for 2 years)
db.analytics.createIndex({ "timestamp": 1 }, { expireAfterSeconds: 63072000, background: true }); // 2 years

// Create compound indexes for complex queries
db.urls.createIndex({ "userId": 1, "isFileUrl": 1, "fileType": 1 }, { background: true });
db.urls.createIndex({ "userId": 1, "isPasswordProtected": 1 }, { background: true });
db.analytics.createIndex({ "urlId": 1, "isUniqueVisit": 1, "timestamp": -1 }, { background: true });

print("Database indexes created successfully for production optimization!");

// Create sample admin user (optional)
db.users.insertOne({
    email: "admin@pebly.com",
    name: "Admin User",
    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsW5qJyEm", // password: admin123
    subscriptionPlan: "ENTERPRISE",
    isActive: true,
    canUseCustomDomains: true,
    canUsePasswordProtection: true,
    canUseAnalytics: true,
    canUseFileUploads: true,
    canUseBulkOperations: true,
    maxUrls: 1000000,
    maxClicksPerMonth: 10000000,
    maxApiCallsPerMonth: 1000000,
    createdAt: new Date(),
    updatedAt: new Date()
});

print("Sample admin user created!");
print("Email: admin@pebly.com");
print("Password: admin123");
print("Database initialization completed successfully!");