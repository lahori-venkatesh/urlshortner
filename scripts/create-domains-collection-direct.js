// Direct MongoDB script to create domains collection
// Run this in MongoDB Atlas shell or MongoDB Compass

// Connect to your pebly-database
use('pebly-database');

print("=== Creating Custom Domains Collection in MongoDB Atlas ===");
print("Database: pebly-database");
print("Timestamp: " + new Date().toISOString());

// 1. Check existing collections
var collections = db.getCollectionNames();
print("Existing collections: " + collections.join(", "));

// 2. Create domains collection
try {
    db.createCollection("domains");
    print("✅ Created domains collection");
} catch (e) {
    if (e.codeName === "NamespaceExists") {
        print("ℹ️  Domains collection already exists");
    } else {
        print("❌ Failed to create domains collection: " + e.message);
    }
}

// 3. Create indexes
print("\nCreating indexes...");

// Unique index on domainName
try {
    db.domains.createIndex({"domainName": 1}, {unique: true, name: "idx_domain_name_unique"});
    print("✅ Created unique index on domainName");
} catch (e) {
    print("ℹ️  Index on domainName already exists or failed: " + e.message);
}

// Compound index on ownerId and ownerType
try {
    db.domains.createIndex({"ownerId": 1, "ownerType": 1}, {name: "idx_owner_compound"});
    print("✅ Created compound index on ownerId + ownerType");
} catch (e) {
    print("ℹ️  Index on owner already exists or failed: " + e.message);
}

// Index on status
try {
    db.domains.createIndex({"status": 1}, {name: "idx_domain_status"});
    print("✅ Created index on status");
} catch (e) {
    print("ℹ️  Index on status already exists or failed: " + e.message);
}

// Unique index on verificationToken
try {
    db.domains.createIndex({"verificationToken": 1}, {unique: true, name: "idx_verification_token_unique"});
    print("✅ Created unique index on verificationToken");
} catch (e) {
    print("ℹ️  Index on verificationToken already exists or failed: " + e.message);
}

// Compound index for verified domains by owner
try {
    db.domains.createIndex({"ownerId": 1, "ownerType": 1, "status": 1}, {name: "idx_owner_status_compound"});
    print("✅ Created compound index for owner + status");
} catch (e) {
    print("ℹ️  Compound index already exists or failed: " + e.message);
}

// 4. Insert sample domains
print("\nInserting sample domains...");

// Sample domain 1: demo.example.com
try {
    db.domains.insertOne({
        "domainName": "demo.example.com",
        "ownerType": "USER",
        "ownerId": "sample-user-id",
        "verificationToken": "demo-token-123",
        "status": "VERIFIED",
        "sslStatus": "ACTIVE",
        "cnameTarget": "demo-token-123.verify.bitaurl.com",
        "verificationAttempts": 1,
        "lastVerificationAttempt": new Date(),
        "sslProvider": "CLOUDFLARE",
        "sslIssuedAt": new Date(),
        "sslExpiresAt": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        "nextReconfirmationDue": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        "totalRedirects": 0,
        "isBlacklisted": false,
        "ownershipHistory": [],
        "createdAt": new Date(),
        "updatedAt": new Date()
    });
    print("✅ Created sample domain: demo.example.com");
} catch (e) {
    if (e.code === 11000) {
        print("ℹ️  Sample domain demo.example.com already exists");
    } else {
        print("❌ Failed to create sample domain: " + e.message);
    }
}

// Sample domain 2: go.mybrand.com (your test domain)
try {
    db.domains.insertOne({
        "domainName": "go.mybrand.com",
        "ownerType": "USER",
        "ownerId": "test-user-" + Date.now(),
        "verificationToken": "mybrand-token-" + Math.random().toString(36).substring(7),
        "status": "RESERVED",
        "sslStatus": "PENDING",
        "cnameTarget": "mybrand-token-123.verify.bitaurl.com",
        "verificationAttempts": 0,
        "totalRedirects": 0,
        "isBlacklisted": false,
        "ownershipHistory": [],
        "createdAt": new Date(),
        "updatedAt": new Date(),
        "reservedUntil": new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
    });
    print("✅ Created test domain: go.mybrand.com");
} catch (e) {
    if (e.code === 11000) {
        print("ℹ️  Test domain go.mybrand.com already exists");
    } else {
        print("❌ Failed to create test domain: " + e.message);
    }
}

// 5. Update shortened_urls collection for custom domain support
print("\nUpdating shortened_urls collection...");

var urlsExists = collections.includes("shortened_urls");
if (urlsExists) {
    // Add domain field to existing URLs if they don't have it
    var urlsNeedingUpdate = db.shortened_urls.countDocuments({"domain": {$exists: false}});
    if (urlsNeedingUpdate > 0) {
        var updateResult = db.shortened_urls.updateMany(
            {"domain": {$exists: false}},
            {$set: {"domain": null, "updatedAt": new Date()}}
        );
        print("✅ Updated " + updateResult.modifiedCount + " URLs with domain field");
    } else {
        print("ℹ️  All URLs already have domain field");
    }
    
    // Add custom domain indexes
    try {
        db.shortened_urls.createIndex({"shortCode": 1, "domain": 1}, {name: "idx_shortcode_domain_compound"});
        print("✅ Created compound index on shortCode + domain");
    } catch (e) {
        print("ℹ️  ShortCode domain index already exists or failed: " + e.message);
    }
    
    try {
        db.shortened_urls.createIndex({"domain": 1}, {name: "idx_domain"});
        print("✅ Created index on domain");
    } catch (e) {
        print("ℹ️  Domain index already exists or failed: " + e.message);
    }
} else {
    print("ℹ️  shortened_urls collection doesn't exist yet");
}

// 6. Verification
print("\n=== Verification ===");

var domainCount = db.domains.countDocuments();
var domainIndexes = db.domains.getIndexes().length;
var urlCount = urlsExists ? db.shortened_urls.countDocuments() : 0;
var urlsWithDomain = urlsExists ? db.shortened_urls.countDocuments({"domain": {$exists: true}}) : 0;

print("Domains collection:");
print("  - Documents: " + domainCount);
print("  - Indexes: " + domainIndexes);

print("URLs collection:");
print("  - Documents: " + urlCount);
print("  - URLs with domain field: " + urlsWithDomain);

// Show sample domains
if (domainCount > 0) {
    print("\nSample domains:");
    db.domains.find({}, {domainName: 1, status: 1, ownerType: 1}).forEach(function(doc) {
        print("  - " + doc.domainName + " (" + doc.status + ", " + doc.ownerType + ")");
    });
}

print("\n=== SETUP COMPLETE ===");
print("✅ Custom domains collection is ready!");
print("✅ " + domainCount + " domains created");
print("✅ " + domainIndexes + " indexes created");
print("✅ URLs collection updated for custom domain support");

print("\nNext steps:");
print("1. Deploy your backend with custom domain endpoints");
print("2. Test domain creation: POST /api/v1/domains");
print("3. Configure DNS for verify.bitaurl.com");
print("4. Set up Cloudflare API credentials");

print("\nTo verify in MongoDB Atlas:");
print("Go to: MongoDB Atlas → Browse Collections → pebly-database → domains");
print("You should see your domains: demo.example.com, go.mybrand.com");