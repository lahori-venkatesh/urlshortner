// MongoDB Atlas Team Collaboration Index Deployment Script
// This script safely adds team collaboration indexes to your existing MongoDB Atlas database
// Run this with: mongosh "your-mongodb-atlas-connection-string" --file deploy-team-collaboration-indexes.js

// Switch to your database
use('pebly-database'); // Update this to match your actual database name

print("🚀 Deploying Team Collaboration Indexes to MongoDB Atlas...");
print("Database: " + db.getName());
print("Timestamp: " + new Date().toISOString());

// ============================================================================
// 1. CREATE TEAM COLLABORATION COLLECTIONS (if they don't exist)
// ============================================================================

print("\n📁 Creating team collaboration collections...");

// Check if teams collection exists
if (!db.getCollectionNames().includes("teams")) {
    print("Creating 'teams' collection with validation...");
    
    db.createCollection("teams", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["teamName", "ownerId", "members", "subscriptionPlan", "isActive"],
                properties: {
                    teamName: {
                        bsonType: "string",
                        minLength: 1,
                        maxLength: 100,
                        description: "Team name must be a string between 1-100 characters"
                    },
                    ownerId: {
                        bsonType: "string",
                        description: "Owner user ID must be a string"
                    },
                    members: {
                        bsonType: "array",
                        minItems: 1,
                        items: {
                            bsonType: "object",
                            required: ["userId", "role", "joinedAt", "isActive"],
                            properties: {
                                userId: { bsonType: "string" },
                                role: { 
                                    bsonType: "string",
                                    enum: ["OWNER", "ADMIN", "MEMBER", "VIEWER"]
                                },
                                joinedAt: { bsonType: "date" },
                                invitedBy: { bsonType: ["string", "null"] },
                                isActive: { bsonType: "bool" }
                            }
                        }
                    },
                    subscriptionPlan: {
                        bsonType: "string",
                        enum: ["FREE", "BUSINESS_TRIAL", "BUSINESS_MONTHLY", "BUSINESS_YEARLY"]
                    },
                    isActive: { bsonType: "bool" },
                    memberLimit: { 
                        bsonType: "int",
                        minimum: 1,
                        maximum: 100
                    }
                }
            }
        }
    });
    print("✅ Teams collection created");
} else {
    print("✅ Teams collection already exists");
}

// Check if team_invites collection exists
if (!db.getCollectionNames().includes("team_invites")) {
    print("Creating 'team_invites' collection with validation...");
    
    db.createCollection("team_invites", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["teamId", "email", "invitedBy", "role", "inviteToken", "expiresAt"],
                properties: {
                    teamId: { bsonType: "string" },
                    email: { 
                        bsonType: "string",
                        pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
                    },
                    invitedBy: { bsonType: "string" },
                    role: {
                        bsonType: "string", 
                        enum: ["ADMIN", "MEMBER", "VIEWER"]
                    },
                    inviteToken: { bsonType: "string" },
                    isAccepted: { bsonType: "bool" },
                    isExpired: { bsonType: "bool" },
                    expiresAt: { bsonType: "date" }
                }
            }
        }
    });
    print("✅ Team invites collection created");
} else {
    print("✅ Team invites collection already exists");
}

// ============================================================================
// 2. CREATE TEAM COLLABORATION INDEXES
// ============================================================================

print("\n🔍 Creating team collaboration indexes...");

// Function to safely create index
function createIndexSafely(collection, indexSpec, options, indexName) {
    try {
        // Check if index already exists
        const existingIndexes = db.getCollection(collection).getIndexes();
        const indexExists = existingIndexes.some(idx => idx.name === options.name);
        
        if (indexExists) {
            print(`  ⏭️  Index '${options.name}' already exists on ${collection}`);
            return;
        }
        
        // Create the index
        db.getCollection(collection).createIndex(indexSpec, options);
        print(`  ✅ Created index '${options.name}' on ${collection}`);
    } catch (error) {
        print(`  ❌ Failed to create index '${options.name}' on ${collection}: ${error.message}`);
    }
}

// TEAMS COLLECTION INDEXES
print("\n📊 Creating teams collection indexes...");

// Primary lookup: find teams by user membership
createIndexSafely("teams", 
    { "members.userId": 1, "isActive": 1 },
    { 
        name: "idx_teams_member_active",
        background: true,
        partialFilterExpression: { "isActive": true }
    }
);

// Owner lookup
createIndexSafely("teams",
    { "ownerId": 1, "isActive": 1 },
    { 
        name: "idx_teams_owner_active",
        background: true 
    }
);

// Team name uniqueness (case insensitive)
createIndexSafely("teams",
    { "teamName": 1, "isActive": 1 },
    { 
        name: "idx_teams_name_unique",
        unique: true,
        background: true,
        collation: { locale: "en", strength: 2 },
        partialFilterExpression: { "isActive": true }
    }
);

// Subscription management
createIndexSafely("teams",
    { "subscriptionPlan": 1, "subscriptionExpiry": 1 },
    { 
        name: "idx_teams_subscription",
        background: true 
    }
);

// TEAM INVITES INDEXES
print("\n📧 Creating team invites indexes...");

// Primary lookup: pending invites by email
createIndexSafely("team_invites",
    { "email": 1, "isAccepted": 1, "isExpired": 1, "expiresAt": 1 },
    { 
        name: "idx_invites_email_pending",
        background: true 
    }
);

// Invite token lookup (unique)
createIndexSafely("team_invites",
    { "inviteToken": 1 },
    { 
        name: "idx_invites_token_unique",
        unique: true,
        background: true 
    }
);

// Team invites lookup
createIndexSafely("team_invites",
    { "teamId": 1, "isAccepted": 1, "isExpired": 1 },
    { 
        name: "idx_invites_team_status",
        background: true 
    }
);

// Cleanup expired invites
createIndexSafely("team_invites",
    { "expiresAt": 1, "isExpired": 1 },
    { 
        name: "idx_invites_expiry_cleanup",
        background: true,
        expireAfterSeconds: 0
    }
);

// ============================================================================
// 3. ENHANCE EXISTING COLLECTIONS WITH SCOPE INDEXES
// ============================================================================

print("\n🔗 Enhancing existing collections with team scope indexes...");

// SHORTENED URLS - Add scope-based indexes
if (db.getCollectionNames().includes("shortened_urls")) {
    print("Enhancing shortened_urls collection...");
    
    // Scope-based queries (most important for team collaboration)
    createIndexSafely("shortened_urls",
        { "scopeType": 1, "scopeId": 1, "isActive": 1, "createdAt": -1 },
        { 
            name: "idx_urls_scope_active_created",
            background: true,
            partialFilterExpression: { "isActive": true }
        }
    );
    
    // Analytics queries by scope
    createIndexSafely("shortened_urls",
        { "scopeType": 1, "scopeId": 1, "totalClicks": -1 },
        { 
            name: "idx_urls_scope_clicks",
            background: true 
        }
    );
}

// QR CODES - Add scope-based indexes
if (db.getCollectionNames().includes("qr_codes")) {
    print("Enhancing qr_codes collection...");
    
    createIndexSafely("qr_codes",
        { "scopeType": 1, "scopeId": 1, "isActive": 1, "createdAt": -1 },
        { 
            name: "idx_qr_scope_active_created",
            background: true,
            partialFilterExpression: { "isActive": true }
        }
    );
}

// UPLOADED FILES - Add scope-based indexes
if (db.getCollectionNames().includes("uploaded_files")) {
    print("Enhancing uploaded_files collection...");
    
    createIndexSafely("uploaded_files",
        { "scopeType": 1, "scopeId": 1, "isActive": 1, "uploadedAt": -1 },
        { 
            name: "idx_files_scope_active_uploaded",
            background: true,
            partialFilterExpression: { "isActive": true }
        }
    );
}

// ============================================================================
// 4. DATA MIGRATION FOR EXISTING RECORDS
// ============================================================================

print("\n🔄 Migrating existing data to support team collaboration...");

// Add scope fields to existing URLs (if they don't have them)
if (db.getCollectionNames().includes("shortened_urls")) {
    try {
        const urlUpdateResult = db.shortened_urls.updateMany(
            { 
                $or: [
                    { "scopeType": { $exists: false } },
                    { "scopeId": { $exists: false } }
                ]
            },
            [
                {
                    $set: {
                        "scopeType": "USER",
                        "scopeId": "$userId",
                        "updatedAt": new Date()
                    }
                }
            ]
        );
        print(`  ✅ Updated ${urlUpdateResult.modifiedCount} URLs with scope fields`);
    } catch (error) {
        print(`  ⚠️  URL migration warning: ${error.message}`);
    }
}

// Add scope fields to existing QR codes
if (db.getCollectionNames().includes("qr_codes")) {
    try {
        const qrUpdateResult = db.qr_codes.updateMany(
            { 
                $or: [
                    { "scopeType": { $exists: false } },
                    { "scopeId": { $exists: false } }
                ]
            },
            [
                {
                    $set: {
                        "scopeType": "USER",
                        "scopeId": "$userId",
                        "updatedAt": new Date()
                    }
                }
            ]
        );
        print(`  ✅ Updated ${qrUpdateResult.modifiedCount} QR codes with scope fields`);
    } catch (error) {
        print(`  ⚠️  QR code migration warning: ${error.message}`);
    }
}

// Add scope fields to existing files
if (db.getCollectionNames().includes("uploaded_files")) {
    try {
        const fileUpdateResult = db.uploaded_files.updateMany(
            { 
                $or: [
                    { "scopeType": { $exists: false } },
                    { "scopeId": { $exists: false } }
                ]
            },
            [
                {
                    $set: {
                        "scopeType": "USER",
                        "scopeId": "$userId",
                        "updatedAt": new Date()
                    }
                }
            ]
        );
        print(`  ✅ Updated ${fileUpdateResult.modifiedCount} files with scope fields`);
    } catch (error) {
        print(`  ⚠️  File migration warning: ${error.message}`);
    }
}

// ============================================================================
// 5. VERIFICATION AND SUMMARY
// ============================================================================

print("\n🔍 Verifying deployment...");

// Check collections
const collections = db.getCollectionNames();
const hasTeams = collections.includes("teams");
const hasInvites = collections.includes("team_invites");

print(`📁 Total collections: ${collections.length}`);
print(`📊 Teams collection: ${hasTeams ? '✅ Present' : '❌ Missing'}`);
print(`📧 Team invites collection: ${hasInvites ? '✅ Present' : '❌ Missing'}`);

// Check indexes
if (hasTeams) {
    const teamIndexes = db.teams.getIndexes();
    print(`🔍 Teams indexes: ${teamIndexes.length} total`);
    teamIndexes.forEach(idx => {
        if (idx.name !== '_id_') {
            print(`    - ${idx.name}`);
        }
    });
}

if (hasInvites) {
    const inviteIndexes = db.team_invites.getIndexes();
    print(`📧 Team invite indexes: ${inviteIndexes.length} total`);
    inviteIndexes.forEach(idx => {
        if (idx.name !== '_id_') {
            print(`    - ${idx.name}`);
        }
    });
}

// Database statistics
const stats = db.stats();
print(`\n📊 Database Statistics:`);
print(`  - Database size: ${Math.round(stats.dataSize / 1024 / 1024 * 100) / 100} MB`);
print(`  - Index size: ${Math.round(stats.indexSize / 1024 / 1024 * 100) / 100} MB`);
print(`  - Total documents: ${stats.objects}`);

print("\n🎉 Team Collaboration Index Deployment Complete!");
print("================================================");

print("\n📝 Next Steps:");
print("1. ✅ Team collaboration indexes are now deployed");
print("2. 🚀 Deploy your updated Spring Boot application");
print("3. 🧪 Test team collaboration features");
print("4. 📊 Monitor database performance");
print("5. 👥 Start creating teams and inviting members!");

print("\n💡 Useful Queries for Testing:");
print("// Check if team collaboration is working:");
print("db.teams.countDocuments({isActive: true})");
print("db.team_invites.countDocuments({isAccepted: false, isExpired: false})");
print("db.shortened_urls.countDocuments({scopeType: 'TEAM'})");

print("\n🔧 Performance Monitoring:");
print("// Monitor index usage:");
print("db.teams.aggregate([{$indexStats: {}}])");
print("db.shortened_urls.aggregate([{$indexStats: {}}])");

print(`\nDeployment completed at: ${new Date().toISOString()}`);