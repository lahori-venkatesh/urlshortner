// MongoDB Atlas Production Setup Script for Custom Domain Feature
// Run this script in MongoDB Atlas shell or MongoDB Compass

// Connect to your production database
use('pebly');

print("=== Setting up Custom Domain Storage in Production MongoDB Atlas ===");
print("Database: pebly");
print("Timestamp: " + new Date().toISOString());

// 1. Check current collections
print("\n1. Checking existing collections...");
var existingCollections = db.getCollectionNames();
print("Existing collections: " + existingCollections.join(", "));

// Check if domains collection already exists
var domainsExists = existingCollections.includes("domains");
print("Domains collection exists: " + domainsExists);

// 2. Create the domains collection with validation schema
if (!domainsExists) {
    print("\n2. Creating domains collection with validation schema...");
    
    db.createCollection("domains", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["domainName", "ownerType", "ownerId", "verificationToken", "status", "createdAt"],
                properties: {
                    domainName: {
                        bsonType: "string",
                        pattern: "^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$",
                        description: "Must be a valid domain name"
                    },
                    ownerType: {
                        bsonType: "string",
                        enum: ["USER", "TEAM"],
                        description: "Must be either USER or TEAM"
                    },
                    ownerId: {
                        bsonType: "string",
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
                    verificationAttempts: {
                        bsonType: "int",
                        minimum: 0,
                        maximum: 10,
                        description: "Number of verification attempts"
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
                    }
                }
            }
        }
    });
    
    print("✅ Created domains collection with validation schema");
} else {
    print("\n2. Domains collection already exists, skipping creation");
}

// 3. Create indexes for optimal performance
print("\n3. Creating indexes for domains collection...");

// Unique index on domainName (prevents duplicate domains)
try {
    db.domains.createIndex(
        { "domainName": 1 }, 
        { 
            unique: true, 
            name: "idx_domain_name_unique",
            background: true
        }
    );
    print("✅ Created unique index on domainName");
} catch (e) {
    if (e.code === 85) {
        print("ℹ️  Index idx_domain_name_unique already exists");
    } else {
        print("❌ Failed to create domainName index: " + e.message);
    }
}

// Compound index on ownerId and ownerType (for user/team queries)
try {
    db.domains.createIndex(
        { "ownerId": 1, "ownerType": 1 }, 
        { 
            name: "idx_owner_compound",
            background: true
        }
    );
    print("✅ Created compound index on ownerId + ownerType");
} catch (e) {
    if (e.code === 85) {
        print("ℹ️  Index idx_owner_compound already exists");
    } else {
        print("❌ Failed to create owner compound index: " + e.message);
    }
}

// Index on status (for filtering by verification status)
try {
    db.domains.createIndex(
        { "status": 1 }, 
        { 
            name: "idx_domain_status",
            background: true
        }
    );
    print("✅ Created index on status");
} catch (e) {
    if (e.code === 85) {
        print("ℹ️  Index idx_domain_status already exists");
    } else {
        print("❌ Failed to create status index: " + e.message);
    }
}

// Unique index on verificationToken
try {
    db.domains.createIndex(
        { "verificationToken": 1 }, 
        { 
            unique: true, 
            name: "idx_verification_token_unique",
            background: true
        }
    );
    print("✅ Created unique index on verificationToken");
} catch (e) {
    if (e.code === 85) {
        print("ℹ️  Index idx_verification_token_unique already exists");
    } else {
        print("❌ Failed to create verificationToken index: " + e.message);
    }
}

// Compound index for verified domains by owner (most common query)
try {
    db.domains.createIndex(
        { "ownerId": 1, "ownerType": 1, "status": 1 }, 
        { 
            name: "idx_owner_status_compound",
            background: true
        }
    );
    print("✅ Created compound index for owner + status queries");
} catch (e) {
    if (e.code === 85) {
        print("ℹ️  Index idx_owner_status_compound already exists");
    } else {
        print("❌ Failed to create owner status compound index: " + e.message);
    }
}

// Index on createdAt for sorting
try {
    db.domains.createIndex(
        { "createdAt": -1 }, 
        { 
            name: "idx_created_at_desc",
            background: true
        }
    );
    print("✅ Created index on createdAt");
} catch (e) {
    if (e.code === 85) {
        print("ℹ️  Index idx_created_at_desc already exists");
    } else {
        print("❌ Failed to create createdAt index: " + e.message);
    }
}

// 4. Update shortened_urls collection for custom domain support
print("\n4. Updating shortened_urls collection for custom domain support...");

// Check if shortened_urls collection exists
var urlsExists = existingCollections.includes("shortened_urls");
if (urlsExists) {
    // Add custom domain indexes to URLs collection
    try {
        db.shortened_urls.createIndex(
            { "shortCode": 1, "domain": 1 }, 
            { 
                name: "idx_shortcode_domain_compound",
                background: true
            }
        );
        print("✅ Created compound index on shortCode + domain");
    } catch (e) {
        if (e.code === 85) {
            print("ℹ️  Index idx_shortcode_domain_compound already exists");
        } else {
            print("❌ Failed to create shortCode domain compound index: " + e.message);
        }
    }

    try {
        db.shortened_urls.createIndex(
            { "domain": 1 }, 
            { 
                name: "idx_domain",
                background: true
            }
        );
        print("✅ Created index on domain field");
    } catch (e) {
        if (e.code === 85) {
            print("ℹ️  Index idx_domain already exists");
        } else {
            print("❌ Failed to create domain index: " + e.message);
        }
    }

    // Migrate existing URLs to have domain field (set to null for default domain)
    var urlsNeedingMigration = db.shortened_urls.countDocuments({ "domain": { $exists: false } });
    if (urlsNeedingMigration > 0) {
        print("📊 Found " + urlsNeedingMigration + " URLs that need migration");
        
        var updateResult = db.shortened_urls.updateMany(
            { "domain": { $exists: false } },
            { 
                $set: { 
                    "domain": null,  // null means default domain
                    "updatedAt": new Date()
                }
            }
        );
        
        print("✅ Migrated " + updateResult.modifiedCount + " URLs with domain field");
    } else {
        print("ℹ️  All URLs already have domain field");
    }
} else {
    print("⚠️  shortened_urls collection not found - will be created when first URL is shortened");
}

// 5. Create a sample domain for testing (optional - only if no domains exist)
print("\n5. Creating sample domain for testing...");

var existingDomains = db.domains.countDocuments();
if (existingDomains === 0) {
    var sampleDomain = {
        domainName: "demo.example.com",
        ownerType: "USER",
        ownerId: "sample-user-id",
        verificationToken: "sample-token-" + Math.random().toString(36).substring(7),
        status: "VERIFIED",
        sslStatus: "ACTIVE",
        cnameTarget: "sample-token-123.verify.bitaurl.com",
        verificationAttempts: 1,
        lastVerificationAttempt: new Date(),
        sslProvider: "CLOUDFLARE",
        sslIssuedAt: new Date(),
        sslExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        nextReconfirmationDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        totalRedirects: 0,
        isBlacklisted: false,
        ownershipHistory: [],
        createdAt: new Date(),
        updatedAt: new Date()
    };

    try {
        db.domains.insertOne(sampleDomain);
        print("✅ Created sample domain: demo.example.com");
    } catch (e) {
        print("⚠️  Could not create sample domain: " + e.message);
    }
} else {
    print("ℹ️  Domains already exist (" + existingDomains + "), skipping sample creation");
}

// 6. Verify the setup
print("\n6. Verifying setup...");

var verification = {
    domainsCollection: {
        exists: db.getCollectionNames().includes("domains"),
        count: db.domains.countDocuments(),
        indexes: db.domains.getIndexes().length
    },
    urlsCollection: {
        exists: db.getCollectionNames().includes("shortened_urls"),
        count: urlsExists ? db.shortened_urls.countDocuments() : 0,
        urlsWithDomainField: urlsExists ? db.shortened_urls.countDocuments({ "domain": { $exists: true } }) : 0,
        indexes: urlsExists ? db.shortened_urls.getIndexes().length : 0
    }
};

print("\n=== Verification Results ===");
print("Domains Collection:");
print("  - Exists: " + verification.domainsCollection.exists);
print("  - Documents: " + verification.domainsCollection.count);
print("  - Indexes: " + verification.domainsCollection.indexes);

print("URLs Collection:");
print("  - Exists: " + verification.urlsCollection.exists);
print("  - Documents: " + verification.urlsCollection.count);
print("  - URLs with domain field: " + verification.urlsCollection.urlsWithDomainField);
print("  - Indexes: " + verification.urlsCollection.indexes);

// 7. Show sample queries for testing
print("\n=== Sample Queries for Testing ===");
print("// Check domains collection:");
print('db.domains.find().limit(5)');
print("\n// Find domains by user:");
print('db.domains.find({"ownerId": "your-user-id", "ownerType": "USER"})');
print("\n// Find verified domains:");
print('db.domains.find({"status": "VERIFIED"})');
print("\n// Check URLs with custom domains:");
print('db.shortened_urls.find({"domain": {$ne: null}}).limit(5)');

print("\n=== Setup Complete ===");
print("✅ Custom domain storage is now ready in MongoDB Atlas!");
print("✅ Collection 'domains' created with validation and indexes");
print("✅ Collection 'shortened_urls' updated for custom domain support");
print("\nNext steps:");
print("1. Deploy your Spring Boot application with custom domain code");
print("2. Test domain creation via API: POST /api/v1/domains");
print("3. Configure DNS for verify.bitaurl.com subdomain");
print("4. Set up Cloudflare API credentials for SSL provisioning");

// 8. Create a view for domain analytics
try {
    db.createView("domain_analytics", "domains", [
        {
            $match: {
                status: "VERIFIED"
            }
        },
        {
            $group: {
                _id: "$ownerType",
                totalDomains: { $sum: 1 },
                totalRedirects: { $sum: "$totalRedirects" },
                avgRedirects: { $avg: "$totalRedirects" }
            }
        }
    ]);
    print("✅ Created domain_analytics view");
} catch (e) {
    if (e.codeName === "NamespaceExists") {
        print("ℹ️  domain_analytics view already exists");
    } else {
        print("⚠️  Could not create analytics view: " + e.message);
    }
}