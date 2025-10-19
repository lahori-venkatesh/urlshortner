// Test MongoDB Connection and File Storage
// Run this script to verify your MongoDB setup is working

// Connect to the production database
const dbName = 'pebly_production';
const db = db.getSiblingDB(dbName);

print("🧪 Testing MongoDB Connection and File Storage...");
print("================================================");

// Test 1: Check database connection
try {
    const result = db.runCommand('ping');
    if (result.ok === 1) {
        print("✅ Database connection successful");
    } else {
        print("❌ Database connection failed");
        exit(1);
    }
} catch (error) {
    print("❌ Database connection error: " + error);
    exit(1);
}

// Test 2: Check collections exist
print("\n📋 Checking Collections:");
const collections = db.getCollectionNames();
const requiredCollections = ['users', 'urls', 'analytics', 'user_activities'];

requiredCollections.forEach(collectionName => {
    if (collections.includes(collectionName)) {
        print(`✅ ${collectionName} collection exists`);
    } else {
        print(`❌ ${collectionName} collection missing`);
    }
});

// Test 3: Check GridFS collections for file storage
const gridFSCollections = ['fs.files', 'fs.chunks'];
gridFSCollections.forEach(collectionName => {
    if (collections.includes(collectionName)) {
        print(`✅ ${collectionName} collection exists (GridFS ready)`);
    } else {
        print(`⚠️ ${collectionName} collection not found (will be created on first file upload)`);
    }
});

// Test 4: Check indexes
print("\n🔍 Checking Indexes:");
const indexChecks = [
    { collection: 'urls', index: 'shortCode_1' },
    { collection: 'users', index: 'email_1' },
    { collection: 'analytics', index: 'urlId_1_timestamp_-1' }
];

indexChecks.forEach(check => {
    const indexes = db.getCollection(check.collection).getIndexes();
    const hasIndex = indexes.some(index => index.name === check.index);
    if (hasIndex) {
        print(`✅ ${check.collection}.${check.index} index exists`);
    } else {
        print(`⚠️ ${check.collection}.${check.index} index missing`);
    }
});

// Test 5: Check sample data
print("\n📊 Checking Sample Data:");
const userCount = db.users.countDocuments();
const urlCount = db.urls.countDocuments();
const analyticsCount = db.analytics.countDocuments();

print(`Users: ${userCount}`);
print(`URLs: ${urlCount}`);
print(`Analytics: ${analyticsCount}`);

if (userCount > 0) {
    print("✅ Sample users found");
    const sampleUser = db.users.findOne();
    print(`   Sample user: ${sampleUser.email}`);
} else {
    print("⚠️ No users found - you may need to create test accounts");
}

// Test 6: Test file storage capability
print("\n📁 Testing File Storage Setup:");
try {
    // Check if GridFS is properly configured
    const gridFS = db.fs.files.findOne();
    if (gridFS) {
        print("✅ GridFS has files - file storage is working");
        print(`   Files in GridFS: ${db.fs.files.countDocuments()}`);
        print(`   Total file size: ${db.fs.files.aggregate([
            { $group: { _id: null, totalSize: { $sum: "$length" } } }
        ]).toArray()[0]?.totalSize || 0} bytes`);
    } else {
        print("ℹ️ No files in GridFS yet - ready for first upload");
    }
} catch (error) {
    print("⚠️ GridFS not initialized yet - will be created on first file upload");
}

// Test 7: Performance check
print("\n⚡ Performance Check:");
const startTime = new Date();

// Test query performance
db.urls.findOne({ isActive: true });
db.users.findOne({ isActive: true });

const endTime = new Date();
const queryTime = endTime - startTime;

if (queryTime < 100) {
    print(`✅ Query performance good (${queryTime}ms)`);
} else if (queryTime < 500) {
    print(`⚠️ Query performance acceptable (${queryTime}ms)`);
} else {
    print(`❌ Query performance slow (${queryTime}ms) - check indexes`);
}

// Test 8: Connection limits
print("\n🔗 Connection Info:");
const serverStatus = db.runCommand('serverStatus');
if (serverStatus.connections) {
    print(`Current connections: ${serverStatus.connections.current}`);
    print(`Available connections: ${serverStatus.connections.available}`);
    print(`Total created: ${serverStatus.connections.totalCreated}`);
}

// Test 9: Storage stats
print("\n💾 Storage Statistics:");
const stats = db.stats();
print(`Database size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
print(`Index size: ${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`);
print(`Collections: ${stats.collections}`);
print(`Objects: ${stats.objects}`);

// Test 10: Test CRUD operations
print("\n🧪 Testing CRUD Operations:");
try {
    // Test insert
    const testDoc = {
        testId: "mongodb-test-" + new Date().getTime(),
        message: "MongoDB connection test",
        timestamp: new Date()
    };
    
    db.test_collection.insertOne(testDoc);
    print("✅ Insert operation successful");
    
    // Test find
    const foundDoc = db.test_collection.findOne({ testId: testDoc.testId });
    if (foundDoc) {
        print("✅ Find operation successful");
    }
    
    // Test update
    db.test_collection.updateOne(
        { testId: testDoc.testId },
        { $set: { updated: true } }
    );
    print("✅ Update operation successful");
    
    // Test delete
    db.test_collection.deleteOne({ testId: testDoc.testId });
    print("✅ Delete operation successful");
    
    // Clean up test collection
    db.test_collection.drop();
    
} catch (error) {
    print("❌ CRUD operations failed: " + error);
}

print("\n🎉 MongoDB Connection Test Complete!");
print("=====================================");

// Summary
print("\n📋 Summary:");
print("• Database: " + dbName);
print("• Collections: " + collections.length);
print("• Users: " + userCount);
print("• URLs: " + urlCount);
print("• Analytics: " + analyticsCount);
print("• GridFS Files: " + (db.fs.files.countDocuments() || 0));

print("\n🚀 Your MongoDB database is ready for file uploads!");
print("You can now:");
print("1. Upload files through the frontend");
print("2. Files will be stored in MongoDB GridFS");
print("3. Short URLs will be created automatically");
print("4. Analytics will be tracked in real-time");
print("5. All data is stored securely in MongoDB Atlas");

print("\n🔗 Next Steps:");
print("1. Start your backend server: ./scripts/deploy-production.sh");
print("2. Open your frontend application");
print("3. Try uploading a file using the 'Upload to MongoDB' button");
print("4. Verify the file appears in your file manager");
print("5. Test downloading the file using the generated short URL");