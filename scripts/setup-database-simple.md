# Simple Database Setup Guide

## 🚀 Quick Setup (No Scripts Required)

### Step 1: Connect to MongoDB
```bash
# If using MongoDB locally
mongosh

# If using MongoDB Atlas or remote
mongosh "your-mongodb-connection-string"
```

### Step 2: Switch to your database
```javascript
use pebly;
```

### Step 3: Run the setup commands directly

Copy and paste these commands one by one in MongoDB shell:

#### Create Teams Collection
```javascript
db.createCollection("teams", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["teamName", "ownerId", "members", "subscriptionPlan", "isActive"],
      properties: {
        teamName: { bsonType: "string", minLength: 1, maxLength: 100 },
        ownerId: { bsonType: "string" },
        members: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["userId", "role", "joinedAt", "isActive"],
            properties: {
              userId: { bsonType: "string" },
              role: { bsonType: "string", enum: ["OWNER", "ADMIN", "MEMBER", "VIEWER"] },
              joinedAt: { bsonType: "date" },
              isActive: { bsonType: "bool" }
            }
          }
        },
        subscriptionPlan: {
          bsonType: "string",
          enum: ["FREE", "BUSINESS_TRIAL", "BUSINESS_MONTHLY", "BUSINESS_YEARLY"]
        },
        isActive: { bsonType: "bool" }
      }
    }
  }
});
```

#### Create Team Invites Collection
```javascript
db.createCollection("team_invites", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["teamId", "email", "invitedBy", "role", "inviteToken", "expiresAt"],
      properties: {
        teamId: { bsonType: "string" },
        email: { bsonType: "string" },
        invitedBy: { bsonType: "string" },
        role: { bsonType: "string", enum: ["ADMIN", "MEMBER", "VIEWER"] },
        inviteToken: { bsonType: "string" },
        expiresAt: { bsonType: "date" }
      }
    }
  }
});
```

#### Create Essential Indexes
```javascript
// Teams indexes
db.teams.createIndex({"members.userId": 1, "isActive": 1}, {background: true});
db.teams.createIndex({"ownerId": 1, "isActive": 1}, {background: true});
db.teams.createIndex({"teamName": 1, "isActive": 1}, {unique: true, background: true});

// Team invites indexes
db.team_invites.createIndex({"email": 1, "isAccepted": 1, "isExpired": 1}, {background: true});
db.team_invites.createIndex({"inviteToken": 1}, {unique: true, background: true});
db.team_invites.createIndex({"teamId": 1, "isAccepted": 1}, {background: true});

// Enhanced content indexes
db.shortened_urls.createIndex({"scopeType": 1, "scopeId": 1, "isActive": 1, "createdAt": -1}, {background: true});
db.qr_codes.createIndex({"scopeType": 1, "scopeId": 1, "isActive": 1, "createdAt": -1}, {background: true});
db.uploaded_files.createIndex({"scopeType": 1, "scopeId": 1, "isActive": 1, "uploadedAt": -1}, {background: true});
```

#### Migrate Existing Data
```javascript
// Add scope fields to existing URLs
db.shortened_urls.updateMany(
  { $or: [{"scopeType": {$exists: false}}, {"scopeId": {$exists: false}}] },
  [{ $set: { "scopeType": "USER", "scopeId": "$userId", "updatedAt": new Date() } }]
);

// Add scope fields to existing QR codes
db.qr_codes.updateMany(
  { $or: [{"scopeType": {$exists: false}}, {"scopeId": {$exists: false}}] },
  [{ $set: { "scopeType": "USER", "scopeId": "$userId", "updatedAt": new Date() } }]
);

// Add scope fields to existing files
db.uploaded_files.updateMany(
  { $or: [{"scopeType": {$exists: false}}, {"scopeId": {$exists: false}}] },
  [{ $set: { "scopeType": "USER", "scopeId": "$userId", "updatedAt": new Date() } }]
);
```

#### Verify Setup
```javascript
// Check collections
db.getCollectionNames();

// Check indexes
db.teams.getIndexes().length;
db.shortened_urls.getIndexes().length;

// Check sample data migration
db.shortened_urls.findOne({scopeType: "USER"});
```

### Step 4: Create a Sample Team (Optional)
```javascript
// Insert a sample team for testing
db.teams.insertOne({
  _id: "team_sample_" + Date.now(),
  teamName: "Sample Team",
  ownerId: "your-user-id-here",
  members: [{
    userId: "your-user-id-here",
    role: "OWNER",
    joinedAt: new Date(),
    invitedBy: null,
    isActive: true
  }],
  description: "Sample team for testing",
  subscriptionPlan: "BUSINESS_TRIAL",
  subscriptionExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  isActive: true,
  totalUrls: 0,
  totalQrCodes: 0,
  totalFiles: 0,
  memberLimit: 10,
  linkQuota: -1,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

## ✅ Verification Commands

After setup, run these to verify everything works:

```javascript
// Check team collaboration collections exist
db.getCollectionNames().filter(name => name.includes('team'));

// Check indexes are created
print("Teams indexes: " + db.teams.getIndexes().length);
print("URLs indexes: " + db.shortened_urls.getIndexes().length);

// Check data migration worked
print("URLs with scope: " + db.shortened_urls.countDocuments({scopeType: {$exists: true}}));
print("Total teams: " + db.teams.countDocuments());
```

## 🎉 You're Done!

Your database is now ready for team collaboration! The Spring Boot application will automatically use these new collections and indexes.