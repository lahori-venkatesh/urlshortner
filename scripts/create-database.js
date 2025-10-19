// MongoDB Database Creation Script for Pebly URL Shortener
// This script creates the database, collections, and indexes for production use

// Connect to MongoDB and create the production database
const dbName = 'pebly_production';
const db = db.getSiblingDB(dbName);

print(`🗄️ Creating database: ${dbName}`);

// Drop existing collections if they exist (for fresh setup)
print("🧹 Cleaning up existing collections...");
db.urls.drop();
db.analytics.drop();
db.users.drop();
db.user_activities.drop();

// Create collections with validation schemas
print("📋 Creating collections with validation schemas...");

// URLs Collection
db.createCollection("urls", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["shortCode", "originalUrl", "userId", "isActive", "createdAt"],
            properties: {
                shortCode: {
                    bsonType: "string",
                    minLength: 4,
                    maxLength: 20,
                    description: "Short code must be a string between 4-20 characters"
                },
                originalUrl: {
                    bsonType: "string",
                    minLength: 1,
                    description: "Original URL is required"
                },
                userId: {
                    bsonType: "string",
                    description: "User ID is required"
                },
                isActive: {
                    bsonType: "bool",
                    description: "Active status is required"
                },
                clickCount: {
                    bsonType: "long",
                    minimum: 0,
                    description: "Click count must be non-negative"
                },
                isPasswordProtected: {
                    bsonType: "bool"
                },
                hasExpiry: {
                    bsonType: "bool"
                },
                isFileUrl: {
                    bsonType: "bool"
                }
            }
        }
    }
});

// Analytics Collection
db.createCollection("analytics", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["urlId", "shortCode", "timestamp"],
            properties: {
                urlId: {
                    bsonType: "string",
                    description: "URL ID is required"
                },
                shortCode: {
                    bsonType: "string",
                    description: "Short code is required"
                },
                timestamp: {
                    bsonType: "date",
                    description: "Timestamp is required"
                },
                ipAddress: {
                    bsonType: "string"
                },
                country: {
                    bsonType: "string"
                },
                deviceType: {
                    bsonType: "string",
                    enum: ["mobile", "desktop", "tablet", "unknown"]
                }
            }
        }
    }
});

// Users Collection
db.createCollection("users", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["email", "isActive", "subscriptionPlan", "createdAt"],
            properties: {
                email: {
                    bsonType: "string",
                    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
                    description: "Valid email address is required"
                },
                subscriptionPlan: {
                    bsonType: "string",
                    enum: ["FREE", "PRO", "ENTERPRISE"],
                    description: "Subscription plan must be FREE, PRO, or ENTERPRISE"
                },
                isActive: {
                    bsonType: "bool",
                    description: "Active status is required"
                },
                urlsCreated: {
                    bsonType: "int",
                    minimum: 0
                },
                maxUrls: {
                    bsonType: "int",
                    minimum: 1
                }
            }
        }
    }
});

// User Activities Collection
db.createCollection("user_activities", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["userId", "activityType", "timestamp"],
            properties: {
                userId: {
                    bsonType: "string",
                    description: "User ID is required"
                },
                activityType: {
                    bsonType: "string",
                    description: "Activity type is required"
                },
                timestamp: {
                    bsonType: "date",
                    description: "Timestamp is required"
                },
                description: {
                    bsonType: "string"
                }
            }
        }
    }
});

print("✅ Collections created successfully!");

// Create optimized indexes for high performance
print("🔍 Creating performance-optimized indexes...");

// URLs Collection Indexes
print("Creating indexes for URLs collection...");
db.urls.createIndex({ "shortCode": 1 }, { unique: true, background: true, name: "idx_shortcode_unique" });
db.urls.createIndex({ "userId": 1, "createdAt": -1 }, { background: true, name: "idx_user_created" });
db.urls.createIndex({ "shortCode": 1, "isActive": 1 }, { background: true, name: "idx_shortcode_active" });
db.urls.createIndex({ "expiresAt": 1, "isActive": 1 }, { background: true, name: "idx_expiry_active" });
db.urls.createIndex({ "userId": 1, "isActive": 1 }, { background: true, name: "idx_user_active" });
db.urls.createIndex({ "customDomain": 1, "shortCode": 1 }, { background: true, name: "idx_domain_shortcode" });
db.urls.createIndex({ "isActive": 1 }, { background: true, name: "idx_active" });
db.urls.createIndex({ "createdAt": -1 }, { background: true, name: "idx_created_desc" });
db.urls.createIndex({ "userId": 1, "isFileUrl": 1, "fileType": 1 }, { background: true, name: "idx_user_file_type" });
db.urls.createIndex({ "userId": 1, "isPasswordProtected": 1 }, { background: true, name: "idx_user_password" });

// Analytics Collection Indexes
print("Creating indexes for Analytics collection...");
db.analytics.createIndex({ "urlId": 1, "timestamp": -1 }, { background: true, name: "idx_url_timestamp" });
db.analytics.createIndex({ "userId": 1, "timestamp": -1 }, { background: true, name: "idx_user_timestamp" });
db.analytics.createIndex({ "shortCode": 1, "timestamp": -1 }, { background: true, name: "idx_shortcode_timestamp" });
db.analytics.createIndex({ "ipAddress": 1, "timestamp": -1 }, { background: true, name: "idx_ip_timestamp" });
db.analytics.createIndex({ "timestamp": -1 }, { background: true, name: "idx_timestamp_desc" });
db.analytics.createIndex({ "country": 1 }, { background: true, name: "idx_country" });
db.analytics.createIndex({ "deviceType": 1 }, { background: true, name: "idx_device_type" });
db.analytics.createIndex({ "browser": 1 }, { background: true, name: "idx_browser" });
db.analytics.createIndex({ "utmCampaign": 1 }, { background: true, name: "idx_utm_campaign" });
db.analytics.createIndex({ "urlId": 1, "isUniqueVisit": 1, "timestamp": -1 }, { background: true, name: "idx_url_unique_timestamp" });

// Users Collection Indexes
print("Creating indexes for Users collection...");
db.users.createIndex({ "email": 1 }, { unique: true, background: true, name: "idx_email_unique" });
db.users.createIndex({ "googleId": 1 }, { sparse: true, background: true, name: "idx_google_id" });
db.users.createIndex({ "apiKey": 1 }, { sparse: true, background: true, name: "idx_api_key" });
db.users.createIndex({ "isActive": 1 }, { background: true, name: "idx_user_active" });
db.users.createIndex({ "subscriptionPlan": 1 }, { background: true, name: "idx_subscription" });
db.users.createIndex({ "createdAt": -1 }, { background: true, name: "idx_user_created" });

// User Activities Collection Indexes
print("Creating indexes for User Activities collection...");
db.user_activities.createIndex({ "userId": 1, "timestamp": -1 }, { background: true, name: "idx_user_activity_timestamp" });
db.user_activities.createIndex({ "activityType": 1 }, { background: true, name: "idx_activity_type" });
db.user_activities.createIndex({ "timestamp": -1 }, { background: true, name: "idx_activity_timestamp" });

// TTL Index for user activities (keep for 1 year)
db.user_activities.createIndex({ "timestamp": 1 }, { 
    expireAfterSeconds: 31536000, // 1 year
    background: true, 
    name: "idx_user_activities_ttl" 
});

// TTL Index for analytics data (keep for 2 years)
print("Creating TTL index for analytics data retention...");
db.analytics.createIndex({ "timestamp": 1 }, { 
    expireAfterSeconds: 63072000, // 2 years
    background: true, 
    name: "idx_analytics_ttl" 
});

print("✅ All indexes created successfully!");

// Insert sample data for testing
print("📝 Inserting sample data...");

// Create admin user
const adminUser = {
    email: "admin@pebly.com",
    name: "Admin User",
    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsW5qJyEm", // password: admin123
    subscriptionPlan: "ENTERPRISE",
    isActive: true,
    urlsCreated: 0,
    maxUrls: 1000000,
    maxClicksPerMonth: 10000000,
    clicksThisMonth: 0,
    canUseCustomDomains: true,
    canUsePasswordProtection: true,
    canUseAnalytics: true,
    canUseFileUploads: true,
    canUseBulkOperations: true,
    apiCallsThisMonth: 0,
    maxApiCallsPerMonth: 1000000,
    emailNotifications: true,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date()
};

const adminResult = db.users.insertOne(adminUser);
print(`✅ Admin user created with ID: ${adminResult.insertedId}`);

// Create demo user
const demoUser = {
    email: "demo@pebly.com",
    name: "Demo User",
    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsW5qJyEm", // password: demo123
    subscriptionPlan: "PRO",
    isActive: true,
    urlsCreated: 0,
    maxUrls: 10000,
    maxClicksPerMonth: 100000,
    clicksThisMonth: 0,
    canUseCustomDomains: true,
    canUsePasswordProtection: true,
    canUseAnalytics: true,
    canUseFileUploads: true,
    canUseBulkOperations: false,
    apiCallsThisMonth: 0,
    maxApiCallsPerMonth: 10000,
    emailNotifications: true,
    twoFactorEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date()
};

const demoResult = db.users.insertOne(demoUser);
print(`✅ Demo user created with ID: ${demoResult.insertedId}`);

// Create sample URLs for demo
const sampleUrls = [
    {
        shortCode: "demo1",
        originalUrl: "https://www.google.com",
        userId: demoResult.insertedId.toString(),
        title: "Google Search",
        description: "World's most popular search engine",
        clickCount: NumberLong(0),
        uniqueClickCount: NumberLong(0),
        isPasswordProtected: false,
        hasExpiry: false,
        isFileUrl: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        shortCode: "demo2",
        originalUrl: "https://github.com",
        userId: demoResult.insertedId.toString(),
        title: "GitHub",
        description: "Code hosting platform",
        clickCount: NumberLong(0),
        uniqueClickCount: NumberLong(0),
        isPasswordProtected: false,
        hasExpiry: false,
        isFileUrl: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

const urlResults = db.urls.insertMany(sampleUrls);
print(`✅ Sample URLs created: ${urlResults.insertedIds.length} URLs`);

// Database statistics
print("\n📊 Database Statistics:");
print(`Total collections: ${db.getCollectionNames().length}`);
print(`URLs collection: ${db.urls.countDocuments()} documents`);
print(`Analytics collection: ${db.analytics.countDocuments()} documents`);
print(`Users collection: ${db.users.countDocuments()} documents`);
print(`User Activities collection: ${db.user_activities.countDocuments()} documents`);

// List all indexes
print("\n🔍 Created Indexes:");
db.getCollectionNames().forEach(function(collectionName) {
    print(`\n${collectionName} collection indexes:`);
    db.getCollection(collectionName).getIndexes().forEach(function(index) {
        print(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });
});

print("\n🎉 Database setup completed successfully!");
print("\n📋 Summary:");
print("✅ Database created: pebly_production");
print("✅ Collections created with validation schemas");
print("✅ Performance indexes created");
print("✅ Sample data inserted");
print("\n👤 Test Accounts:");
print("Admin: admin@pebly.com / admin123");
print("Demo: demo@pebly.com / demo123");
print("\n🔗 Sample URLs:");
print("http://localhost:8080/demo1 -> https://www.google.com");
print("http://localhost:8080/demo2 -> https://github.com");
print("\n🚀 Your database is ready for production use!");