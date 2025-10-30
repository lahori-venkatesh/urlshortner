// MongoDB Atlas Setup Script for Custom Domain Feature
// Run this script in MongoDB Atlas or MongoDB Compass to set up the database

// Switch to the pebly-database
use('pebly-database');

print("=== Setting up MongoDB Atlas for Custom Domain Feature ===");

// 1. Create the domains collection with validation schema
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
        cnameTarget: {
          bsonType: "string",
          description: "CNAME target for verification"
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

print("✓ Created domains collection with validation schema");

// 2. Create indexes for the domains collection
db.domains.createIndex(
  { "domainName": 1 }, 
  { 
    unique: true, 
    name: "idx_domain_name_unique",
    background: true
  }
);

db.domains.createIndex(
  { "ownerId": 1, "ownerType": 1 }, 
  { 
    name: "idx_owner_compound",
    background: true
  }
);

db.domains.createIndex(
  { "status": 1 }, 
  { 
    name: "idx_domain_status",
    background: true
  }
);

db.domains.createIndex(
  { "verificationToken": 1 }, 
  { 
    unique: true, 
    name: "idx_verification_token_unique",
    background: true
  }
);

db.domains.createIndex(
  { "ownerId": 1, "ownerType": 1, "status": 1 }, 
  { 
    name: "idx_owner_status_compound",
    background: true
  }
);

db.domains.createIndex(
  { "reservedUntil": 1 }, 
  { 
    name: "idx_reserved_until",
    background: true,
    expireAfterSeconds: 0  // TTL index for automatic cleanup
  }
);

db.domains.createIndex(
  { "nextReconfirmationDue": 1 }, 
  { 
    name: "idx_reconfirmation_due",
    background: true
  }
);

db.domains.createIndex(
  { "sslExpiresAt": 1 }, 
  { 
    name: "idx_ssl_expires",
    background: true
  }
);

db.domains.createIndex(
  { "createdAt": -1 }, 
  { 
    name: "idx_created_at_desc",
    background: true
  }
);

db.domains.createIndex(
  { "status": 1, "verificationAttempts": 1 }, 
  { 
    name: "idx_status_attempts",
    background: true
  }
);

print("✓ Created 10 indexes for domains collection");

// 3. Update shortened_urls collection for custom domain support
db.shortened_urls.createIndex(
  { "shortCode": 1, "domain": 1 }, 
  { 
    name: "idx_shortcode_domain_compound",
    background: true
  }
);

db.shortened_urls.createIndex(
  { "domain": 1 }, 
  { 
    name: "idx_domain",
    background: true
  }
);

db.shortened_urls.createIndex(
  { "domain": 1, "createdAt": -1 }, 
  { 
    name: "idx_domain_created",
    background: true
  }
);

print("✓ Added custom domain indexes to shortened_urls collection");

// 4. Migrate existing URLs to support custom domains (set domain field to null for default)
var urlUpdateResult = db.shortened_urls.updateMany(
  { "domain": { $exists: false } },
  { 
    $set: { 
      "domain": null,
      "updatedAt": new Date()
    }
  }
);

print(`✓ Migrated ${urlUpdateResult.modifiedCount} existing URLs for custom domain support`);

// 5. Create sample domain for testing (optional)
var sampleDomain = {
  domainName: "demo.example.com",
  ownerType: "USER",
  ownerId: "sample-user-id",
  verificationToken: "sample-token-123",
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
  print("✓ Created sample domain for testing");
} catch (e) {
  if (e.code === 11000) {
    print("⚠ Sample domain already exists, skipping creation");
  } else {
    print(`✗ Failed to create sample domain: ${e.message}`);
  }
}

// 6. Verify the setup
var stats = {
  domainsCollection: db.domains.countDocuments(),
  domainsIndexes: db.domains.getIndexes().length,
  urlsCollection: db.shortened_urls.countDocuments(),
  urlsIndexes: db.shortened_urls.getIndexes().length,
  urlsWithDomainField: db.shortened_urls.countDocuments({ "domain": { $exists: true } })
};

print("\n=== Setup Verification ===");
print(`Domains collection documents: ${stats.domainsCollection}`);
print(`Domains collection indexes: ${stats.domainsIndexes}`);
print(`URLs collection documents: ${stats.urlsCollection}`);
print(`URLs collection indexes: ${stats.urlsIndexes}`);
print(`URLs with domain field: ${stats.urlsWithDomainField}`);

// 7. Create a view for domain analytics (optional)
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
        lastCreated: { $max: "$createdAt" }
      }
    },
    {
      $sort: { totalClicks: -1 }
    }
  ]);
  print("✓ Created domain_analytics view");
} catch (e) {
  print(`⚠ Domain analytics view creation failed: ${e.message}`);
}

print("\n=== MongoDB Atlas Setup Complete ===");
print("Custom Domain feature is now ready to use!");
print("\nNext steps:");
print("1. Set environment variables: MONGODB_URI, CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID");
print("2. Deploy your Spring Boot application");
print("3. Test the custom domain endpoints");
print("4. Configure DNS for verify.bitaurl.com subdomain");

// 8. Show sample queries for testing
print("\n=== Sample Queries for Testing ===");
print("// Find all domains by owner:");
print('db.domains.find({"ownerId": "user123", "ownerType": "USER"})');
print("\n// Find verified domains:");
print('db.domains.find({"status": "VERIFIED"})');
print("\n// Find URLs by custom domain:");
print('db.shortened_urls.find({"domain": "demo.example.com"})');
print("\n// Get domain analytics:");
print('db.domain_analytics.find()');