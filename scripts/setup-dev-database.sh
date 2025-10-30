#!/bin/bash

# Development Database Setup Script for Custom Domain Feature
# This script sets up a local MongoDB instance for development

echo "=== Setting up Development Database for Custom Domain Feature ==="

# Check if MongoDB is installed
if ! command -v mongosh &> /dev/null; then
    echo "❌ MongoDB Shell (mongosh) is not installed"
    echo "Please install MongoDB: https://docs.mongodb.com/manual/installation/"
    exit 1
fi

# Default MongoDB connection
MONGODB_URI=${MONGODB_URI:-"mongodb://localhost:27017/pebly"}
echo "📡 Connecting to: $MONGODB_URI"

# Create the setup script content
cat > /tmp/mongodb-setup.js << 'EOF'
// Switch to the pebly-database
use('pebly-database');

print("=== Setting up Development Database ===");

// 1. Drop existing collections if they exist (development only)
try {
  db.domains.drop();
  print("✓ Dropped existing domains collection");
} catch (e) {
  print("ℹ No existing domains collection to drop");
}

// 2. Create the domains collection
db.createCollection("domains");
print("✓ Created domains collection");

// 3. Create indexes for the domains collection
db.domains.createIndex({ "domainName": 1 }, { unique: true, name: "idx_domain_name_unique" });
db.domains.createIndex({ "ownerId": 1, "ownerType": 1 }, { name: "idx_owner_compound" });
db.domains.createIndex({ "status": 1 }, { name: "idx_domain_status" });
db.domains.createIndex({ "verificationToken": 1 }, { unique: true, name: "idx_verification_token_unique" });
db.domains.createIndex({ "ownerId": 1, "ownerType": 1, "status": 1 }, { name: "idx_owner_status_compound" });

print("✓ Created 5 indexes for domains collection");

// 4. Update shortened_urls collection for custom domain support
db.shortened_urls.createIndex({ "shortCode": 1, "domain": 1 }, { name: "idx_shortcode_domain_compound" });
db.shortened_urls.createIndex({ "domain": 1 }, { name: "idx_domain" });

print("✓ Added custom domain indexes to shortened_urls collection");

// 5. Migrate existing URLs to support custom domains
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

// 6. Create sample domains for development
var sampleDomains = [
  {
    domainName: "dev.example.com",
    ownerType: "USER",
    ownerId: "dev-user-1",
    verificationToken: "dev-token-123",
    status: "VERIFIED",
    sslStatus: "ACTIVE",
    cnameTarget: "dev-token-123.verify.bitaurl.com",
    verificationAttempts: 1,
    lastVerificationAttempt: new Date(),
    sslProvider: "CLOUDFLARE",
    sslIssuedAt: new Date(),
    sslExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    nextReconfirmationDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    totalRedirects: 42,
    isBlacklisted: false,
    ownershipHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    domainName: "team.example.com",
    ownerType: "TEAM",
    ownerId: "dev-team-1",
    verificationToken: "team-token-456",
    status: "VERIFIED",
    sslStatus: "ACTIVE",
    cnameTarget: "team-token-456.verify.bitaurl.com",
    verificationAttempts: 1,
    lastVerificationAttempt: new Date(),
    sslProvider: "LETS_ENCRYPT",
    sslIssuedAt: new Date(),
    sslExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    nextReconfirmationDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    totalRedirects: 128,
    isBlacklisted: false,
    ownershipHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    domainName: "pending.example.com",
    ownerType: "USER",
    ownerId: "dev-user-2",
    verificationToken: "pending-token-789",
    status: "PENDING",
    sslStatus: "PENDING",
    cnameTarget: "pending-token-789.verify.bitaurl.com",
    verificationAttempts: 2,
    lastVerificationAttempt: new Date(),
    verificationError: "DNS CNAME record not found",
    totalRedirects: 0,
    isBlacklisted: false,
    ownershipHistory: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

try {
  db.domains.insertMany(sampleDomains);
  print("✓ Created 3 sample domains for development");
} catch (e) {
  print(`⚠ Failed to create sample domains: ${e.message}`);
}

// 7. Create sample URLs with custom domains
var sampleUrls = [
  {
    shortCode: "dev001",
    originalUrl: "https://github.com/example/repo",
    shortUrl: "https://dev.example.com/dev001",
    domain: "dev.example.com",
    userId: "dev-user-1",
    scopeType: "USER",
    scopeId: "dev-user-1",
    title: "Development Repository",
    totalClicks: 15,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    shortCode: "team001",
    originalUrl: "https://docs.example.com/api",
    shortUrl: "https://team.example.com/team001",
    domain: "team.example.com",
    userId: "dev-user-1",
    scopeType: "TEAM",
    scopeId: "dev-team-1",
    title: "API Documentation",
    totalClicks: 87,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

try {
  db.shortened_urls.insertMany(sampleUrls);
  print("✓ Created 2 sample URLs with custom domains");
} catch (e) {
  print(`⚠ Failed to create sample URLs: ${e.message}`);
}

// 8. Verify the setup
var stats = {
  domainsCollection: db.domains.countDocuments(),
  domainsIndexes: db.domains.getIndexes().length,
  urlsCollection: db.shortened_urls.countDocuments(),
  urlsIndexes: db.shortened_urls.getIndexes().length,
  urlsWithDomainField: db.shortened_urls.countDocuments({ "domain": { $exists: true } }),
  verifiedDomains: db.domains.countDocuments({ "status": "VERIFIED" }),
  pendingDomains: db.domains.countDocuments({ "status": "PENDING" })
};

print("\n=== Setup Verification ===");
print(`Domains collection documents: ${stats.domainsCollection}`);
print(`Domains collection indexes: ${stats.domainsIndexes}`);
print(`URLs collection documents: ${stats.urlsCollection}`);
print(`URLs collection indexes: ${stats.urlsIndexes}`);
print(`URLs with domain field: ${stats.urlsWithDomainField}`);
print(`Verified domains: ${stats.verifiedDomains}`);
print(`Pending domains: ${stats.pendingDomains}`);

print("\n=== Development Database Setup Complete ===");
print("Custom Domain feature is ready for development!");

print("\n=== Sample Data Created ===");
print("Domains:");
db.domains.find({}, {domainName: 1, status: 1, ownerType: 1}).forEach(printjson);

print("\nURLs with Custom Domains:");
db.shortened_urls.find({domain: {$ne: null}}, {shortCode: 1, domain: 1, originalUrl: 1}).forEach(printjson);
EOF

# Run the setup script
echo "🚀 Running database setup..."
mongosh "$MONGODB_URI" /tmp/mongodb-setup.js

# Clean up temporary file
rm /tmp/mongodb-setup.js

echo ""
echo "✅ Development database setup complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Start your Spring Boot application"
echo "2. Test the endpoints:"
echo "   GET  http://localhost:8080/api/v1/database/custom-domains-status"
echo "   POST http://localhost:8080/api/v1/domains (with auth)"
echo "3. Check the sample data in your database"
echo ""
echo "📊 Sample domains created:"
echo "   - dev.example.com (VERIFIED, USER)"
echo "   - team.example.com (VERIFIED, TEAM)"
echo "   - pending.example.com (PENDING, USER)"
echo ""
echo "🔗 Sample URLs created:"
echo "   - https://dev.example.com/dev001"
echo "   - https://team.example.com/team001"