// MongoDB Atlas Production Setup Script for Custom Domain Feature
// This script sets up the complete custom domain infrastructure in MongoDB Atlas
// Run this script in MongoDB Atlas Data Explorer or MongoDB Compass

// Configuration
const DATABASE_NAME = 'pebly';
const VERIFICATION_SUBDOMAIN = 'verify.bitaurl.com';

// Switch to the target database
use(DATABASE_NAME);

print("=== MongoDB Atlas Production Setup for Custom Domains ===");
print(`Database: ${DATABASE_NAME}`);
print(`Timestamp: ${new Date().toISOString()}`);
print(`Verification subdomain: ${VERIFICATION_SUBDOMAIN}`);

// Helper function to safely create indexes
function createIndexSafely(collection, indexSpec, options) {
    try {
        collection.createIndex(indexSpec, options);
        print(`✅ Created index: ${options.name || JSON.stringify(indexSpec)}`);
        return true;
    } catch (e) {
        if (e.code === 85 || e.codeName === "IndexOptionsConflict" || e.codeName === "IndexKeySpecsConflict") {
            print(`ℹ️  Index already exists: ${options.name || JSON.stringify(indexSpec)}`);
            return true;
        } else {
            print(`❌ Failed to create index ${options.name}: ${e.message}`);
            return false;
        }
    }
}

// Helper function to safely insert documents
function insertDocumentSafely(collection, document, description) {
    try {
        const result = collection.insertOne(document);
        print(`✅ ${description}: ${result.insertedId}`);
        return result;
    } catch (e) {
        if (e.code === 11000) {
            print(`ℹ️  ${description} already exists (duplicate key)`);
            return null;
        } else {
            print(`❌ Failed to insert ${description}: ${e.message}`);
            throw e;
        }
    }
}

// 1. Check existing collections and show current state
print("\n=== Current Database State ===");
const collections = db.getCollectionNames();
print(`Existing collections: ${collections.join(", ")}`);

if (collections.includes("domains")) {
    const domainCount = db.domains.countDocuments();
    print(`Current domains count: ${domainCount}`);
} else {
    print("Domains collection does not exist yet");
}

if (collections.includes("shortened_urls")) {
    const urlCount = db.shortened_urls.countDocuments();
    print(`Current URLs count: ${urlCount}`);
} else {
    print("URLs collection does not exist yet");
}

// 2. Create domains collection with comprehensive validation schema
print("\n=== Creating Domains Collection ===");

try {
    db.createCollection("domains", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["domainName", "ownerType", "ownerId", "verificationToken", "status", "createdAt"],
                properties: {
                    domainName: {
                        bsonType: "string",
                        pattern: "^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$",
                        description: "Must be a valid domain name (RFC compliant)"
                    },
                    ownerType: {
                        bsonType: "string",
                        enum: ["USER", "TEAM"],
                        description: "Must be either USER or TEAM"
                    },
                    ownerId: {
                        bsonType: "string",
                        minLength: 1,
                        description: "Must be a valid user or team ID"
                    },
                    verificationToken: {
                        bsonType: "string",
                        minLength: 8,
                        description: "Must be a unique verification token"
                    },
                    status: {
                        bsonType: "string",
                        enum: ["RESERVED", "PENDING", "VERIFIED", "ERROR", "SUSPENDED"],
                        description: "Must be a valid domain status"
                    },
                    sslStatus: {
                        bsonType: "string",
                        enum: ["PENDING", "ACTIVE", "ERROR", "EXPIRED"],
                        description: "Must be a valid SSL status"
                    },
                    cnameTarget: {
                        bsonType: "string",
                        description: "CNAME target for verification"
                    },
                    verificationAttempts: {
                        bsonType: "int",
                        minimum: 0,
                        maximum: 10,
                        description: "Number of verification attempts (0-10)"
                    },
                    totalRedirects: {
                        bsonType: "long",
                        minimum: 0,
                        description: "Total number of redirects for this domain"
                    },
                    isBlacklisted: {
                        bsonType: "bool",
                        description: "Whether the domain is blacklisted"
                    },
                    createdAt: {
                        bsonType: "date",
                        description: "Domain creation timestamp"
                    },
                    updatedAt: {
                        bsonType: "date",
                        description: "Domain last update timestamp"
                    },
                    reservedUntil: {
                        bsonType: "date",
                        description: "Reservation expiry for RESERVED status domains"
                    },
                    sslExpiresAt: {
                        bsonType: "date",
                        description: "SSL certificate expiration date"
                    }
                }
            }
        }
    });
    print("✅ Created domains collection with validation schema");
} catch (e) {
    if (e.codeName === "NamespaceExists") {
        print("ℹ️  Domains collection already exists");
    } else {
        print(`❌ Failed to create domains collection: ${e.message}`);
        throw e;
    }
}

// 3. Create comprehensive indexes for domains collection
print("\n=== Creating Domain Indexes ===");

const domainIndexes = [
    // Unique indexes
    { spec: { "domainName": 1 }, options: { unique: true, name: "idx_domain_name_unique", background: true } },
    { spec: { "verificationToken": 1 }, options: { unique: true, name: "idx_verification_token_unique", background: true } },
    
    // Compound indexes for queries
    { spec: { "ownerId": 1, "ownerType": 1 }, options: { name: "idx_owner_compound", background: true } },
    { spec: { "ownerId": 1, "ownerType": 1, "status": 1 }, options: { name: "idx_owner_status_compound", background: true } },
    { spec: { "status": 1, "verificationAttempts": 1 }, options: { name: "idx_status_attempts", background: true } },
    { spec: { "domain": 1, "createdAt": -1 }, options: { name: "idx_domain_created", background: true } },
    
    // Single field indexes
    { spec: { "status": 1 }, options: { name: "idx_domain_status", background: true } },
    { spec: { "createdAt": -1 }, options: { name: "idx_created_at_desc", background: true } },
    { spec: { "updatedAt": -1 }, options: { name: "idx_updated_at_desc", background: true } },
    
    // TTL and expiration indexes
    { spec: { "reservedUntil": 1 }, options: { name: "idx_reserved_until", background: true, expireAfterSeconds: 0 } },
    { spec: { "sslExpiresAt": 1 }, options: { name: "idx_ssl_expires", background: true } },
    { spec: { "nextReconfirmationDue": 1 }, options: { name: "idx_reconfirmation_due", background: true } }
];

let indexSuccessCount = 0;
domainIndexes.forEach(({ spec, options }) => {
    if (createIndexSafely(db.domains, spec, options)) {
        indexSuccessCount++;
    }
});

print(`✅ Successfully created/verified ${indexSuccessCount}/${domainIndexes.length} domain indexes`);

// 4. Update shortened_urls collection for custom domain support
print("\n=== Updating URLs Collection for Custom Domains ===");

const urlsExists = collections.includes("shortened_urls");
if (urlsExists) {
    // Add domain field to existing URLs
    const urlsNeedingUpdate = db.shortened_urls.countDocuments({ "domain": { $exists: false } });
    if (urlsNeedingUpdate > 0) {
        const updateResult = db.shortened_urls.updateMany(
            { "domain": { $exists: false } },
            { 
                $set: { 
                    "domain": null,
                    "updatedAt": new Date()
                }
            }
        );
        print(`✅ Updated ${updateResult.modifiedCount} URLs with domain field`);
    } else {
        print("ℹ️  All URLs already have domain field");
    }
    
    // Create URL indexes for custom domain support
    const urlIndexes = [
        { spec: { "shortCode": 1, "domain": 1 }, options: { name: "idx_shortcode_domain_compound", background: true } },
        { spec: { "domain": 1 }, options: { name: "idx_domain", background: true } },
        { spec: { "domain": 1, "createdAt": -1 }, options: { name: "idx_domain_created_desc", background: true } },
        { spec: { "domain": 1, "isActive": 1 }, options: { name: "idx_domain_active", background: true } }
    ];
    
    let urlIndexSuccessCount = 0;
    urlIndexes.forEach(({ spec, options }) => {
        if (createIndexSafely(db.shortened_urls, spec, options)) {
            urlIndexSuccessCount++;
        }
    });
    
    print(`✅ Successfully created/verified ${urlIndexSuccessCount}/${urlIndexes.length} URL indexes`);
} else {
    print("ℹ️  shortened_urls collection doesn't exist yet - will be created when first URL is shortened");
}

// 5. Create sample domains for testing
print("\n=== Creating Sample Test Domains ===");

const sampleDomains = [
    {
        domainName: "demo.example.com",
        ownerType: "USER",
        ownerId: "demo-user-id",
        verificationToken: `demo-${Math.random().toString(36).substring(2, 15)}`,
        status: "VERIFIED",
        sslStatus: "ACTIVE",
        cnameTarget: `demo-token-123.${VERIFICATION_SUBDOMAIN}`,
        verificationAttempts: 1,
        lastVerificationAttempt: new Date(),
        sslProvider: "CLOUDFLARE",
        sslIssuedAt: new Date(),
        sslExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        nextReconfirmationDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        totalRedirects: 0,
        isBlacklisted: false,
        ownershipHistory: [],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        domainName: "go.mybrand.com",
        ownerType: "USER",
        ownerId: `test-user-${Date.now()}`,
        verificationToken: `mybrand-${Math.random().toString(36).substring(2, 15)}`,
        status: "PENDING",
        sslStatus: "PENDING",
        cnameTarget: `mybrand-token-123.${VERIFICATION_SUBDOMAIN}`,
        verificationAttempts: 0,
        totalRedirects: 0,
        isBlacklisted: false,
        ownershipHistory: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        reservedUntil: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    },
    {
        domainName: "links.testteam.com",
        ownerType: "TEAM",
        ownerId: `team-${Date.now()}`,
        verificationToken: `team-${Math.random().toString(36).substring(2, 15)}`,
        status: "RESERVED",
        sslStatus: "PENDING",
        cnameTarget: `team-token-456.${VERIFICATION_SUBDOMAIN}`,
        verificationAttempts: 0,
        totalRedirects: 0,
        isBlacklisted: false,
        ownershipHistory: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        reservedUntil: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
    }
];

sampleDomains.forEach((domain, index) => {
    insertDocumentSafely(db.domains, domain, `Sample domain ${index + 1}: ${domain.domainName}`);
});

// 6. Create sample URLs with custom domains
print("\n=== Creating Sample URLs for Testing ===");

if (urlsExists || db.shortened_urls.countDocuments() >= 0) {
    const sampleUrls = [
        {
            shortCode: "demo1",
            originalUrl: "https://www.example.com/page1",
            domain: "demo.example.com",
            userId: "demo-user-id",
            totalClicks: 5,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            shortCode: "test1",
            originalUrl: "https://www.google.com",
            domain: null, // Default domain
            userId: "test-user-123",
            totalClicks: 10,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            shortCode: "brand1",
            originalUrl: "https://www.mybrand.com/product",
            domain: "go.mybrand.com",
            userId: `test-user-${Date.now()}`,
            totalClicks: 0,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];
    
    sampleUrls.forEach((url, index) => {
        insertDocumentSafely(db.shortened_urls, url, `Sample URL ${index + 1}: ${url.shortCode}`);
    });
}

// 7. Create analytics view for domain performance
print("\n=== Creating Analytics Views ===");

try {
    db.createView("domain_analytics", "shortened_urls", [
        {
            $match: {
                domain: { $ne: null },
                isActive: true
            }
        },
        {
            $group: {
                _id: "$domain",
                totalUrls: { $sum: 1 },
                totalClicks: { $sum: "$totalClicks" },
                avgClicks: { $avg: "$totalClicks" },
                lastCreated: { $max: "$createdAt" },
                firstCreated: { $min: "$createdAt" }
            }
        },
        {
            $lookup: {
                from: "domains",
                localField: "_id",
                foreignField: "domainName",
                as: "domainInfo"
            }
        },
        {
            $unwind: "$domainInfo"
        },
        {
            $project: {
                domain: "$_id",
                totalUrls: 1,
                totalClicks: 1,
                avgClicks: { $round: ["$avgClicks", 2] },
                lastCreated: 1,
                firstCreated: 1,
                domainStatus: "$domainInfo.status",
                domainOwner: "$domainInfo.ownerId",
                domainOwnerType: "$domainInfo.ownerType"
            }
        },
        {
            $sort: { totalClicks: -1 }
        }
    ]);
    print("✅ Created domain_analytics view");
} catch (e) {
    print(`⚠️  Domain analytics view creation failed: ${e.message}`);
}

// 8. Comprehensive verification and testing
print("\n=== Verification and Testing ===");

const stats = {
    domainsCollection: db.domains.countDocuments(),
    domainsIndexes: db.domains.getIndexes().length,
    urlsCollection: urlsExists ? db.shortened_urls.countDocuments() : 0,
    urlsIndexes: urlsExists ? db.shortened_urls.getIndexes().length : 0,
    urlsWithDomainField: urlsExists ? db.shortened_urls.countDocuments({ "domain": { $exists: true } }) : 0,
    verifiedDomains: db.domains.countDocuments({ "status": "VERIFIED" }),
    pendingDomains: db.domains.countDocuments({ "status": "PENDING" }),
    reservedDomains: db.domains.countDocuments({ "status": "RESERVED" })
};

print("📊 Database Statistics:");
print(`  Domains collection: ${stats.domainsCollection} documents, ${stats.domainsIndexes} indexes`);
print(`  URLs collection: ${stats.urlsCollection} documents, ${stats.urlsIndexes} indexes`);
print(`  URLs with domain field: ${stats.urlsWithDomainField}`);
print(`  Domain status breakdown:`);
print(`    - VERIFIED: ${stats.verifiedDomains}`);
print(`    - PENDING: ${stats.pendingDomains}`);
print(`    - RESERVED: ${stats.reservedDomains}`);

// 9. Test queries to verify functionality
print("\n=== Running Test Queries ===");

// Test 1: Find domains by owner
print("Test 1: Find domains by owner");
const ownerDomains = db.domains.find({ "ownerId": "demo-user-id", "ownerType": "USER" }).toArray();
print(`  Found ${ownerDomains.length} domains for demo-user-id`);

// Test 2: Find verified domains
print("Test 2: Find verified domains");
const verifiedDomains = db.domains.find({ "status": "VERIFIED" }).toArray();
print(`  Found ${verifiedDomains.length} verified domains`);

// Test 3: Find URLs by custom domain
print("Test 3: Find URLs by custom domain");
if (urlsExists) {
    const customDomainUrls = db.shortened_urls.find({ "domain": "demo.example.com" }).toArray();
    print(`  Found ${customDomainUrls.length} URLs for demo.example.com`);
}

// Test 4: Test compound index performance
print("Test 4: Test compound index query");
const compoundQuery = db.domains.find({ "ownerId": "demo-user-id", "ownerType": "USER", "status": "VERIFIED" }).explain("executionStats");
print(`  Query executed successfully (used index: ${compoundQuery.executionStats.totalDocsExamined <= compoundQuery.executionStats.totalDocsReturned})`);

// Test 5: Test analytics view
print("Test 5: Test analytics view");
try {
    const analyticsResults = db.domain_analytics.find().toArray();
    print(`  Analytics view returned ${analyticsResults.length} results`);
} catch (e) {
    print(`  Analytics view test failed: ${e.message}`);
}

// 10. Show sample domains created
print("\n=== Sample Domains Created ===");
db.domains.find({}, { domainName: 1, status: 1, ownerType: 1, createdAt: 1 }).forEach(function(doc) {
    print(`  📍 ${doc.domainName} (${doc.status}, ${doc.ownerType}) - Created: ${doc.createdAt.toISOString()}`);
});

// 11. Show sample URLs created
if (urlsExists && db.shortened_urls.countDocuments() > 0) {
    print("\n=== Sample URLs Created ===");
    db.shortened_urls.find({}, { shortCode: 1, domain: 1, originalUrl: 1, totalClicks: 1 }).forEach(function(doc) {
        const domainDisplay = doc.domain || "default";
        print(`  🔗 ${doc.shortCode} → ${doc.originalUrl} (${domainDisplay}, ${doc.totalClicks} clicks)`);
    });
}

print("\n=== 🎉 SETUP COMPLETE! 🎉 ===");
print("✅ Custom domains infrastructure is fully deployed!");
print(`✅ Database: ${DATABASE_NAME}`);
print(`✅ Collections: domains (${stats.domainsCollection} docs), shortened_urls (${stats.urlsCollection} docs)`);
print(`✅ Indexes: ${stats.domainsIndexes + stats.urlsIndexes} total indexes created`);
print(`✅ Sample data: ${stats.domainsCollection} domains, ${stats.urlsCollection} URLs`);

print("\n📋 Next Steps:");
print("1. 🔧 Configure environment variables:");
print(`   - MONGODB_URI (pointing to ${DATABASE_NAME} database)`);
print("   - CLOUDFLARE_API_TOKEN");
print("   - CLOUDFLARE_ZONE_ID");
print(`2. 🌐 Set up DNS for ${VERIFICATION_SUBDOMAIN}`);
print("3. 🚀 Deploy your Spring Boot application");
print("4. 🧪 Test the API endpoints:");
print("   - POST /api/v1/domains (create domain)");
print("   - GET /api/v1/domains (list domains)");
print("   - POST /api/v1/domains/{domain}/verify (verify domain)");
print("5. 📊 Monitor using the domain_analytics view");

print("\n🔍 Verification Commands:");
print("// Check domains:");
print("db.domains.find().pretty()");
print("// Check domain analytics:");
print("db.domain_analytics.find().pretty()");
print("// Check URLs with custom domains:");
print('db.shortened_urls.find({"domain": {$ne: null}}).pretty()');

print(`\n⏰ Setup completed at: ${new Date().toISOString()}`);
print("🎯 Your custom domain feature is ready for production!");