// MongoDB Database Setup and Optimization Script for Team Collaboration
// Run this script in MongoDB shell or MongoDB Compass

// Switch to the pebly-database
use('pebly-database');

print("🚀 Setting up Pebly Database with Team Collaboration Support...");

// ============================================================================
// 1. CREATE COLLECTIONS WITH VALIDATION SCHEMAS
// ============================================================================

// Teams Collection with Schema Validation
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
        },
        linkQuota: { bsonType: "int" }
      }
    }
  }
});

// Team Invites Collection
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

print("✅ Collections created with validation schemas");

// ============================================================================
// 2. CREATE PERFORMANCE INDEXES
// ============================================================================

print("📊 Creating performance indexes...");

// TEAMS COLLECTION INDEXES
// Primary lookup: find teams by user membership
db.teams.createIndex(
  { "members.userId": 1, "isActive": 1 },
  { 
    name: "idx_teams_member_active",
    background: true,
    partialFilterExpression: { "isActive": true }
  }
);

// Owner lookup
db.teams.createIndex(
  { "ownerId": 1, "isActive": 1 },
  { 
    name: "idx_teams_owner_active",
    background: true 
  }
);

// Team name uniqueness (case insensitive)
db.teams.createIndex(
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
db.teams.createIndex(
  { "subscriptionPlan": 1, "subscriptionExpiry": 1 },
  { 
    name: "idx_teams_subscription",
    background: true 
  }
);

// TEAM INVITES INDEXES
// Primary lookup: pending invites by email
db.team_invites.createIndex(
  { "email": 1, "isAccepted": 1, "isExpired": 1, "expiresAt": 1 },
  { 
    name: "idx_invites_email_pending",
    background: true 
  }
);

// Invite token lookup (unique)
db.team_invites.createIndex(
  { "inviteToken": 1 },
  { 
    name: "idx_invites_token_unique",
    unique: true,
    background: true 
  }
);

// Team invites lookup
db.team_invites.createIndex(
  { "teamId": 1, "isAccepted": 1, "isExpired": 1 },
  { 
    name: "idx_invites_team_status",
    background: true 
  }
);

// Cleanup expired invites
db.team_invites.createIndex(
  { "expiresAt": 1, "isExpired": 1 },
  { 
    name: "idx_invites_expiry_cleanup",
    background: true,
    expireAfterSeconds: 0
  }
);

// ENHANCED CONTENT COLLECTION INDEXES
// Shortened URLs - Scope-based queries (most important)
db.shortened_urls.createIndex(
  { "scopeType": 1, "scopeId": 1, "isActive": 1, "createdAt": -1 },
  { 
    name: "idx_urls_scope_active_created",
    background: true,
    partialFilterExpression: { "isActive": true }
  }
);

// URL lookup by short code (existing, but ensure it's optimized)
db.shortened_urls.createIndex(
  { "shortCode": 1 },
  { 
    name: "idx_urls_shortcode_unique",
    unique: true,
    background: true 
  }
);

// User's personal URLs (backward compatibility)
db.shortened_urls.createIndex(
  { "userId": 1, "isActive": 1, "createdAt": -1 },
  { 
    name: "idx_urls_user_active_created",
    background: true,
    partialFilterExpression: { "isActive": true }
  }
);

// Analytics queries
db.shortened_urls.createIndex(
  { "scopeType": 1, "scopeId": 1, "totalClicks": -1 },
  { 
    name: "idx_urls_scope_clicks",
    background: true 
  }
);

// QR Codes - Same pattern as URLs
db.qr_codes.createIndex(
  { "scopeType": 1, "scopeId": 1, "isActive": 1, "createdAt": -1 },
  { 
    name: "idx_qr_scope_active_created",
    background: true,
    partialFilterExpression: { "isActive": true }
  }
);

db.qr_codes.createIndex(
  { "qrCode": 1 },
  { 
    name: "idx_qr_code_unique",
    unique: true,
    background: true 
  }
);

db.qr_codes.createIndex(
  { "userId": 1, "isActive": 1, "createdAt": -1 },
  { 
    name: "idx_qr_user_active_created",
    background: true,
    partialFilterExpression: { "isActive": true }
  }
);

// Uploaded Files - Same pattern
db.uploaded_files.createIndex(
  { "scopeType": 1, "scopeId": 1, "isActive": 1, "uploadedAt": -1 },
  { 
    name: "idx_files_scope_active_uploaded",
    background: true,
    partialFilterExpression: { "isActive": true }
  }
);

db.uploaded_files.createIndex(
  { "fileCode": 1 },
  { 
    name: "idx_files_code_unique",
    unique: true,
    background: true 
  }
);

db.uploaded_files.createIndex(
  { "userId": 1, "isActive": 1, "uploadedAt": -1 },
  { 
    name: "idx_files_user_active_uploaded",
    background: true,
    partialFilterExpression: { "isActive": true }
  }
);

// USERS COLLECTION (existing optimizations)
db.users.createIndex(
  { "email": 1 },
  { 
    name: "idx_users_email_unique",
    unique: true,
    background: true 
  }
);

db.users.createIndex(
  { "isActive": 1, "subscriptionPlan": 1 },
  { 
    name: "idx_users_active_plan",
    background: true 
  }
);

// CLICK ANALYTICS (if separate collection)
if (db.getCollectionNames().includes("click_analytics")) {
  db.click_analytics.createIndex(
    { "shortCode": 1, "timestamp": -1 },
    { 
      name: "idx_analytics_code_time",
      background: true 
    }
  );
  
  db.click_analytics.createIndex(
    { "scopeType": 1, "scopeId": 1, "timestamp": -1 },
    { 
      name: "idx_analytics_scope_time",
      background: true 
    }
  );
}

print("✅ Performance indexes created");

// ============================================================================
// 2.5. SUPPORT SYSTEM COLLECTIONS
// ============================================================================

print("🎫 Creating support system collections...");

// Support Tickets Collection with Schema Validation
db.createCollection("support_tickets", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "userEmail", "userName", "category", "subject", "message", "priority", "status", "createdAt"],
      properties: {
        userId: {
          bsonType: "string",
          description: "User ID must be a string"
        },
        userEmail: {
          bsonType: "string",
          pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
          description: "Valid email address required"
        },
        userName: {
          bsonType: "string",
          minLength: 1,
          maxLength: 100,
          description: "User name must be between 1-100 characters"
        },
        category: {
          bsonType: "string",
          enum: ["PAYMENT", "TECHNICAL", "ACCOUNT", "GENERAL", "FEATURE_REQUEST"],
          description: "Category must be one of the predefined values"
        },
        subject: {
          bsonType: "string",
          minLength: 1,
          maxLength: 200,
          description: "Subject must be between 1-200 characters"
        },
        message: {
          bsonType: "string",
          minLength: 1,
          maxLength: 5000,
          description: "Message must be between 1-5000 characters"
        },
        priority: {
          bsonType: "string",
          enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
          description: "Priority must be one of the predefined values"
        },
        status: {
          bsonType: "string",
          enum: ["OPEN", "IN_PROGRESS", "WAITING_FOR_USER", "RESOLVED", "CLOSED"],
          description: "Status must be one of the predefined values"
        },
        assignedAgent: {
          bsonType: ["string", "null"],
          description: "Assigned agent ID (optional)"
        },
        responses: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["id", "ticketId", "message", "sender", "timestamp"],
            properties: {
              id: { bsonType: "string" },
              ticketId: { bsonType: "string" },
              message: { bsonType: "string" },
              sender: { 
                bsonType: "string",
                enum: ["USER", "AGENT", "SYSTEM"]
              },
              senderId: { bsonType: ["string", "null"] },
              senderName: { bsonType: "string" },
              senderEmail: { bsonType: ["string", "null"] },
              timestamp: { bsonType: "date" },
              attachments: { 
                bsonType: "array",
                items: { bsonType: "string" }
              },
              isInternal: { bsonType: "bool" },
              responseType: { bsonType: "string" }
            }
          }
        },
        attachments: {
          bsonType: "array",
          items: { bsonType: "string" }
        },
        tags: {
          bsonType: "array",
          items: { bsonType: "string" }
        },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
        resolvedAt: { bsonType: ["date", "null"] },
        closedAt: { bsonType: ["date", "null"] },
        userAgent: { bsonType: ["string", "null"] },
        ipAddress: { bsonType: ["string", "null"] },
        currentPage: { bsonType: ["string", "null"] },
        browserInfo: { bsonType: ["string", "null"] }
      }
    }
  }
});

print("✅ Support tickets collection created");

// Support Tickets Indexes
print("🔍 Creating support tickets indexes...");

// Primary indexes for queries
db.support_tickets.createIndex(
  { "userId": 1, "createdAt": -1 },
  { 
    name: "idx_support_user_created",
    background: true 
  }
);

db.support_tickets.createIndex(
  { "status": 1, "createdAt": -1 },
  { 
    name: "idx_support_status_created",
    background: true 
  }
);

db.support_tickets.createIndex(
  { "category": 1, "createdAt": -1 },
  { 
    name: "idx_support_category_created",
    background: true 
  }
);

db.support_tickets.createIndex(
  { "priority": 1, "status": 1, "createdAt": -1 },
  { 
    name: "idx_support_priority_status_created",
    background: true 
  }
);

db.support_tickets.createIndex(
  { "assignedAgent": 1, "status": 1, "createdAt": -1 },
  { 
    name: "idx_support_agent_status_created",
    background: true,
    partialFilterExpression: { "assignedAgent": { $ne: null } }
  }
);

// Text search index for subject and message
db.support_tickets.createIndex(
  { 
    "subject": "text", 
    "message": "text",
    "responses.message": "text"
  },
  { 
    name: "idx_support_text_search",
    background: true,
    weights: {
      "subject": 10,
      "message": 5,
      "responses.message": 1
    }
  }
);

// Compound index for overdue tickets
db.support_tickets.createIndex(
  { "status": 1, "priority": 1, "createdAt": 1 },
  { 
    name: "idx_support_overdue",
    background: true,
    partialFilterExpression: { 
      "status": { $in: ["OPEN", "IN_PROGRESS"] }
    }
  }
);

// Email index for guest support
db.support_tickets.createIndex(
  { "userEmail": 1, "createdAt": -1 },
  { 
    name: "idx_support_email_created",
    background: true 
  }
);

print("✅ Support tickets indexes created");

// ============================================================================
// 3. DATA MIGRATION FOR EXISTING RECORDS
// ============================================================================

print("🔄 Migrating existing data to support team collaboration...");

// Add scope fields to existing URLs (if they don't have them)
var urlUpdateResult = db.shortened_urls.updateMany(
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

print(`📝 Updated ${urlUpdateResult.modifiedCount} URLs with scope fields`);

// Add scope fields to existing QR codes
var qrUpdateResult = db.qr_codes.updateMany(
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

print(`📝 Updated ${qrUpdateResult.modifiedCount} QR codes with scope fields`);

// Add scope fields to existing files
var fileUpdateResult = db.uploaded_files.updateMany(
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

print(`📝 Updated ${fileUpdateResult.modifiedCount} files with scope fields`);

// ============================================================================
// 4. CREATE AGGREGATION VIEWS FOR ANALYTICS
// ============================================================================

print("📈 Creating analytics views...");

// Team Analytics View
db.createView("team_analytics", "shortened_urls", [
  {
    $match: {
      "scopeType": "TEAM",
      "isActive": true
    }
  },
  {
    $group: {
      _id: "$scopeId",
      totalUrls: { $sum: 1 },
      totalClicks: { $sum: "$totalClicks" },
      avgClicksPerUrl: { $avg: "$totalClicks" },
      lastCreated: { $max: "$createdAt" },
      topPerformer: {
        $max: {
          shortCode: "$shortCode",
          clicks: "$totalClicks"
        }
      }
    }
  }
]);

// User Analytics View (for personal workspace)
db.createView("user_analytics", "shortened_urls", [
  {
    $match: {
      "scopeType": "USER",
      "isActive": true
    }
  },
  {
    $group: {
      _id: "$userId",
      totalUrls: { $sum: 1 },
      totalClicks: { $sum: "$totalClicks" },
      avgClicksPerUrl: { $avg: "$totalClicks" },
      lastCreated: { $max: "$createdAt" }
    }
  }
]);

print("✅ Analytics views created");

// ============================================================================
// 5. PERFORMANCE MONITORING SETUP
// ============================================================================

print("🔍 Setting up performance monitoring...");

// Enable profiling for slow operations (>100ms)
db.setProfilingLevel(1, { slowms: 100 });

// Create collection for custom performance metrics
db.createCollection("performance_metrics", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["operation", "duration", "timestamp"],
      properties: {
        operation: { bsonType: "string" },
        duration: { bsonType: "number" },
        timestamp: { bsonType: "date" },
        scopeType: { bsonType: "string" },
        recordCount: { bsonType: "int" }
      }
    }
  }
});

// TTL index for performance metrics (keep only 30 days)
db.performance_metrics.createIndex(
  { "timestamp": 1 },
  { 
    name: "idx_perf_metrics_ttl",
    expireAfterSeconds: 2592000, // 30 days
    background: true 
  }
);

print("✅ Performance monitoring setup complete");

// ============================================================================
// 6. SAMPLE DATA FOR TESTING (Optional)
// ============================================================================

print("🧪 Creating sample team data for testing...");

// Sample team
var sampleTeamId = "team_sample_" + Date.now();
var sampleUserId1 = "user_sample_owner_" + Date.now();
var sampleUserId2 = "user_sample_member_" + Date.now();

// Insert sample team
db.teams.insertOne({
  _id: sampleTeamId,
  teamName: "Sample Marketing Team",
  ownerId: sampleUserId1,
  members: [
    {
      userId: sampleUserId1,
      role: "OWNER",
      joinedAt: new Date(),
      invitedBy: null,
      isActive: true
    },
    {
      userId: sampleUserId2,
      role: "MEMBER", 
      joinedAt: new Date(),
      invitedBy: sampleUserId1,
      isActive: true
    }
  ],
  description: "Sample team for testing collaboration features",
  logoUrl: null,
  subscriptionPlan: "BUSINESS_TRIAL",
  subscriptionExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  subscriptionCancelled: false,
  subscriptionId: null,
  customerId: null,
  isActive: true,
  totalUrls: 0,
  totalQrCodes: 0,
  totalFiles: 0,
  totalClicks: 0,
  monthlyUrlsCreated: 0,
  monthlyQrCodesCreated: 0,
  monthlyFilesUploaded: 0,
  lastMonthlyReset: new Date(),
  memberLimit: 10,
  linkQuota: -1, // unlimited
  createdAt: new Date(),
  updatedAt: new Date()
});

print(`✅ Sample team created with ID: ${sampleTeamId}`);

// ============================================================================
// 7. DATABASE STATISTICS AND VERIFICATION
// ============================================================================

print("📊 Database setup verification...");

// Check collections
var collections = db.getCollectionNames();
print(`📁 Collections: ${collections.join(", ")}`);

// Check indexes
print("\n🔍 Index Summary:");
collections.forEach(function(collName) {
  var indexes = db.getCollection(collName).getIndexes();
  print(`  ${collName}: ${indexes.length} indexes`);
});

// Performance recommendations
print("\n💡 Performance Recommendations:");
print("  ✅ Use compound indexes for multi-field queries");
print("  ✅ Partial indexes reduce storage for sparse data");
print("  ✅ Background index creation prevents blocking");
print("  ✅ TTL indexes automatically clean up expired data");
print("  ✅ Views provide pre-aggregated analytics");

print("\n🎉 Database setup complete! Team collaboration is ready for production.");
print("\n📝 Next steps:");
print("  1. Update application.yml with connection settings");
print("  2. Configure connection pooling");
print("  3. Set up monitoring and alerting");
print("  4. Run performance tests with sample data");

// ============================================================================
// 8. CLEANUP FUNCTIONS (for maintenance)
// ============================================================================

print("\n🧹 Cleanup functions available:");
print("  - Run cleanupExpiredInvites() to remove expired invitations");
print("  - Run optimizeCollections() to rebuild indexes and compact data");

// Function to cleanup expired invites
function cleanupExpiredInvites() {
  var result = db.team_invites.deleteMany({
    $or: [
      { "expiresAt": { $lt: new Date() } },
      { "isExpired": true }
    ]
  });
  print(`🗑️ Cleaned up ${result.deletedCount} expired invites`);
}

// Function to optimize collections
function optimizeCollections() {
  var collections = ["teams", "team_invites", "shortened_urls", "qr_codes", "uploaded_files"];
  collections.forEach(function(collName) {
    print(`🔧 Optimizing ${collName}...`);
    db.runCommand({ compact: collName });
  });
  print("✅ Collection optimization complete");
}

print("\n🚀 Team Collaboration Database Setup Complete!");