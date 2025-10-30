// MongoDB Atlas Setup Test Script
// This script tests the custom domain setup and verifies all functionality
// Run this AFTER running mongodb-atlas-production-setup.js

const DATABASE_NAME = 'pebly';

// Switch to the target database
use(DATABASE_NAME);

print("=== MongoDB Atlas Custom Domain Setup Test ===");
print(`Database: ${DATABASE_NAME}`);
print(`Test started: ${new Date().toISOString()}`);

// Test results tracking
let testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
};

function runTest(testName, testFunction) {
    try {
        print(`\n🧪 Running: ${testName}`);
        const result = testFunction();
        if (result.success) {
            testResults.passed++;
            print(`✅ PASSED: ${testName} - ${result.message}`);
        } else {
            testResults.failed++;
            print(`❌ FAILED: ${testName} - ${result.message}`);
        }
        testResults.tests.push({ name: testName, ...result });
    } catch (e) {
        testResults.failed++;
        print(`❌ ERROR: ${testName} - ${e.message}`);
        testResults.tests.push({ name: testName, success: false, message: e.message });
    }
}

function runWarningTest(testName, testFunction) {
    try {
        print(`\n⚠️  Checking: ${testName}`);
        const result = testFunction();
        if (result.success) {
            print(`✅ OK: ${testName} - ${result.message}`);
        } else {
            testResults.warnings++;
            print(`⚠️  WARNING: ${testName} - ${result.message}`);
        }
        testResults.tests.push({ name: testName, ...result, type: 'warning' });
    } catch (e) {
        testResults.warnings++;
        print(`⚠️  WARNING: ${testName} - ${e.message}`);
        testResults.tests.push({ name: testName, success: false, message: e.message, type: 'warning' });
    }
}

// Test 1: Verify collections exist
runTest("Collections Existence", function() {
    const collections = db.getCollectionNames();
    const hasDomainsCollection = collections.includes("domains");
    const hasUrlsCollection = collections.includes("shortened_urls");
    
    if (hasDomainsCollection && hasUrlsCollection) {
        return { success: true, message: "Both domains and shortened_urls collections exist" };
    } else if (hasDomainsCollection) {
        return { success: true, message: "Domains collection exists, URLs collection will be created on first use" };
    } else {
        return { success: false, message: "Domains collection is missing" };
    }
});

// Test 2: Verify domain collection schema validation
runTest("Domain Schema Validation", function() {
    try {
        // Try to insert an invalid domain (should fail)
        db.domains.insertOne({
            domainName: "invalid..domain",  // Invalid domain name
            ownerType: "INVALID",           // Invalid owner type
            ownerId: "",                    // Empty owner ID
            verificationToken: "short",     // Too short token
            status: "INVALID_STATUS"        // Invalid status
        });
        return { success: false, message: "Schema validation is not working - invalid document was inserted" };
    } catch (e) {
        if (e.code === 121) { // Document validation failure
            return { success: true, message: "Schema validation is working correctly" };
        } else {
            return { success: false, message: `Unexpected error: ${e.message}` };
        }
    }
});

// Test 3: Verify domain indexes
runTest("Domain Indexes", function() {
    const indexes = db.domains.getIndexes();
    const requiredIndexes = [
        "idx_domain_name_unique",
        "idx_verification_token_unique",
        "idx_owner_compound",
        "idx_owner_status_compound",
        "idx_domain_status"
    ];
    
    const existingIndexNames = indexes.map(idx => idx.name);
    const missingIndexes = requiredIndexes.filter(name => !existingIndexNames.includes(name));
    
    if (missingIndexes.length === 0) {
        return { success: true, message: `All ${requiredIndexes.length} required indexes exist (${indexes.length} total)` };
    } else {
        return { success: false, message: `Missing indexes: ${missingIndexes.join(", ")}` };
    }
});

// Test 4: Test unique constraints
runTest("Unique Constraints", function() {
    const testDomain = {
        domainName: `test-unique-${Date.now()}.com`,
        ownerType: "USER",
        ownerId: "test-user-unique",
        verificationToken: `unique-token-${Math.random().toString(36).substring(7)}`,
        status: "RESERVED",
        createdAt: new Date()
    };
    
    // Insert first domain
    const result1 = db.domains.insertOne(testDomain);
    
    try {
        // Try to insert duplicate domain name (should fail)
        db.domains.insertOne({
            ...testDomain,
            ownerId: "different-user",
            verificationToken: "different-token"
        });
        
        // Clean up
        db.domains.deleteOne({ _id: result1.insertedId });
        return { success: false, message: "Unique constraint on domainName is not working" };
    } catch (e) {
        // Clean up
        db.domains.deleteOne({ _id: result1.insertedId });
        
        if (e.code === 11000) { // Duplicate key error
            return { success: true, message: "Unique constraints are working correctly" };
        } else {
            return { success: false, message: `Unexpected error: ${e.message}` };
        }
    }
});

// Test 5: Test domain CRUD operations
runTest("Domain CRUD Operations", function() {
    const testDomainName = `crud-test-${Date.now()}.com`;
    const testToken = `crud-token-${Math.random().toString(36).substring(7)}`;
    
    // CREATE
    const insertResult = db.domains.insertOne({
        domainName: testDomainName,
        ownerType: "USER",
        ownerId: "crud-test-user",
        verificationToken: testToken,
        status: "RESERVED",
        totalRedirects: 0,
        isBlacklisted: false,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    
    if (!insertResult.insertedId) {
        return { success: false, message: "Failed to create domain" };
    }
    
    // READ
    const foundDomain = db.domains.findOne({ domainName: testDomainName });
    if (!foundDomain) {
        return { success: false, message: "Failed to read created domain" };
    }
    
    // UPDATE
    const updateResult = db.domains.updateOne(
        { domainName: testDomainName },
        { 
            $set: { 
                status: "VERIFIED",
                totalRedirects: 5,
                updatedAt: new Date()
            }
        }
    );
    
    if (updateResult.modifiedCount !== 1) {
        return { success: false, message: "Failed to update domain" };
    }
    
    // Verify update
    const updatedDomain = db.domains.findOne({ domainName: testDomainName });
    if (updatedDomain.status !== "VERIFIED" || updatedDomain.totalRedirects !== 5) {
        return { success: false, message: "Domain update was not applied correctly" };
    }
    
    // DELETE
    const deleteResult = db.domains.deleteOne({ domainName: testDomainName });
    if (deleteResult.deletedCount !== 1) {
        return { success: false, message: "Failed to delete domain" };
    }
    
    return { success: true, message: "All CRUD operations completed successfully" };
});

// Test 6: Test URL collection integration
runTest("URL Collection Integration", function() {
    const collections = db.getCollectionNames();
    if (!collections.includes("shortened_urls")) {
        return { success: true, message: "URLs collection will be created on first URL creation" };
    }
    
    const urlsWithDomainField = db.shortened_urls.countDocuments({ "domain": { $exists: true } });
    const totalUrls = db.shortened_urls.countDocuments();
    
    if (totalUrls === 0) {
        return { success: true, message: "No URLs exist yet - integration will work when URLs are created" };
    }
    
    if (urlsWithDomainField === totalUrls) {
        return { success: true, message: `All ${totalUrls} URLs have domain field for custom domain support` };
    } else {
        return { success: false, message: `Only ${urlsWithDomainField}/${totalUrls} URLs have domain field` };
    }
});

// Test 7: Test compound queries (performance)
runTest("Compound Query Performance", function() {
    // Test owner + status query
    const startTime = new Date();
    const results = db.domains.find({ 
        "ownerType": "USER", 
        "status": "VERIFIED" 
    }).explain("executionStats");
    const endTime = new Date();
    
    const executionTime = endTime - startTime;
    const docsExamined = results.executionStats.totalDocsExamined;
    const docsReturned = results.executionStats.totalDocsReturned;
    
    // Check if index was used efficiently
    const indexUsed = docsExamined <= docsReturned * 2; // Allow some overhead
    
    if (indexUsed && executionTime < 100) {
        return { success: true, message: `Query efficient: ${docsExamined} examined, ${docsReturned} returned, ${executionTime}ms` };
    } else {
        return { success: false, message: `Query inefficient: ${docsExamined} examined, ${docsReturned} returned, ${executionTime}ms` };
    }
});

// Test 8: Test analytics view
runTest("Analytics View", function() {
    try {
        const analyticsResults = db.domain_analytics.find().toArray();
        return { success: true, message: `Analytics view working - returned ${analyticsResults.length} results` };
    } catch (e) {
        return { success: false, message: `Analytics view failed: ${e.message}` };
    }
});

// Test 9: Test TTL index functionality
runWarningTest("TTL Index Configuration", function() {
    const indexes = db.domains.getIndexes();
    const ttlIndex = indexes.find(idx => idx.name === "idx_reserved_until");
    
    if (ttlIndex && ttlIndex.expireAfterSeconds === 0) {
        return { success: true, message: "TTL index configured correctly for automatic cleanup" };
    } else {
        return { success: false, message: "TTL index not configured - reserved domains won't auto-expire" };
    }
});

// Test 10: Test sample data
runTest("Sample Data Verification", function() {
    const sampleDomains = db.domains.find({
        domainName: { $in: ["demo.example.com", "go.mybrand.com", "links.testteam.com"] }
    }).toArray();
    
    if (sampleDomains.length >= 2) {
        return { success: true, message: `Found ${sampleDomains.length} sample domains for testing` };
    } else {
        return { success: false, message: `Only found ${sampleDomains.length} sample domains - may need to re-run setup` };
    }
});

// Test 11: Test domain status transitions
runTest("Domain Status Transitions", function() {
    const testDomainName = `status-test-${Date.now()}.com`;
    
    // Create domain in RESERVED status
    const insertResult = db.domains.insertOne({
        domainName: testDomainName,
        ownerType: "USER",
        ownerId: "status-test-user",
        verificationToken: `status-token-${Math.random().toString(36).substring(7)}`,
        status: "RESERVED",
        totalRedirects: 0,
        isBlacklisted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        reservedUntil: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });
    
    // Transition to PENDING
    db.domains.updateOne(
        { domainName: testDomainName },
        { 
            $set: { 
                status: "PENDING",
                verificationAttempts: 1,
                lastVerificationAttempt: new Date(),
                updatedAt: new Date()
            },
            $unset: { reservedUntil: "" }
        }
    );
    
    // Transition to VERIFIED
    db.domains.updateOne(
        { domainName: testDomainName },
        { 
            $set: { 
                status: "VERIFIED",
                sslStatus: "ACTIVE",
                sslProvider: "CLOUDFLARE",
                sslIssuedAt: new Date(),
                sslExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                updatedAt: new Date()
            }
        }
    );
    
    // Verify final state
    const finalDomain = db.domains.findOne({ domainName: testDomainName });
    
    // Clean up
    db.domains.deleteOne({ domainName: testDomainName });
    
    if (finalDomain && finalDomain.status === "VERIFIED" && finalDomain.sslStatus === "ACTIVE") {
        return { success: true, message: "Domain status transitions working correctly" };
    } else {
        return { success: false, message: "Domain status transitions failed" };
    }
});

// Test 12: Test URL shortening with custom domains
runTest("Custom Domain URL Integration", function() {
    const collections = db.getCollectionNames();
    if (!collections.includes("shortened_urls")) {
        // Create the collection for testing
        db.createCollection("shortened_urls");
    }
    
    const testShortCode = `test-${Date.now()}`;
    const testDomain = "demo.example.com";
    
    // Insert test URL with custom domain
    const insertResult = db.shortened_urls.insertOne({
        shortCode: testShortCode,
        originalUrl: "https://www.example.com/test",
        domain: testDomain,
        userId: "test-user-integration",
        totalClicks: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    
    // Test compound query (shortCode + domain)
    const foundUrl = db.shortened_urls.findOne({
        shortCode: testShortCode,
        domain: testDomain
    });
    
    // Clean up
    db.shortened_urls.deleteOne({ _id: insertResult.insertedId });
    
    if (foundUrl && foundUrl.shortCode === testShortCode && foundUrl.domain === testDomain) {
        return { success: true, message: "Custom domain URL integration working correctly" };
    } else {
        return { success: false, message: "Custom domain URL integration failed" };
    }
});

// Run all tests
print("\n" + "=".repeat(60));
print("🚀 STARTING COMPREHENSIVE TESTS");
print("=".repeat(60));

// Execute all tests
const testStartTime = new Date();

// Core functionality tests
runTest("Collections Existence", function() {
    const collections = db.getCollectionNames();
    const hasDomainsCollection = collections.includes("domains");
    const hasUrlsCollection = collections.includes("shortened_urls");
    
    if (hasDomainsCollection && hasUrlsCollection) {
        return { success: true, message: "Both domains and shortened_urls collections exist" };
    } else if (hasDomainsCollection) {
        return { success: true, message: "Domains collection exists, URLs collection will be created on first use" };
    } else {
        return { success: false, message: "Domains collection is missing" };
    }
});

// Run the rest of the tests...
[
    "Domain Schema Validation",
    "Domain Indexes", 
    "Unique Constraints",
    "Domain CRUD Operations",
    "URL Collection Integration",
    "Compound Query Performance",
    "Analytics View",
    "Sample Data Verification",
    "Domain Status Transitions",
    "Custom Domain URL Integration"
].forEach(testName => {
    // Tests are already defined above, this is just for organization
});

const testEndTime = new Date();
const totalTestTime = testEndTime - testStartTime;

// Print final results
print("\n" + "=".repeat(60));
print("📊 TEST RESULTS SUMMARY");
print("=".repeat(60));

print(`⏱️  Total test time: ${totalTestTime}ms`);
print(`✅ Passed: ${testResults.passed}`);
print(`❌ Failed: ${testResults.failed}`);
print(`⚠️  Warnings: ${testResults.warnings}`);
print(`📝 Total tests: ${testResults.tests.length}`);

const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
print(`📈 Success rate: ${successRate}%`);

if (testResults.failed === 0) {
    print("\n🎉 ALL TESTS PASSED! 🎉");
    print("✅ Your MongoDB Atlas custom domain setup is working perfectly!");
    print("🚀 Ready for production deployment!");
} else {
    print("\n⚠️  SOME TESTS FAILED");
    print("❌ Please review the failed tests above and fix the issues");
    print("🔧 You may need to re-run the setup script");
}

if (testResults.warnings > 0) {
    print(`\n⚠️  ${testResults.warnings} warnings detected - review for optimal performance`);
}

// Show detailed results for failed tests
const failedTests = testResults.tests.filter(test => !test.success && test.type !== 'warning');
if (failedTests.length > 0) {
    print("\n❌ FAILED TESTS DETAILS:");
    failedTests.forEach(test => {
        print(`  • ${test.name}: ${test.message}`);
    });
}

// Show warnings
const warningTests = testResults.tests.filter(test => test.type === 'warning' && !test.success);
if (warningTests.length > 0) {
    print("\n⚠️  WARNINGS:");
    warningTests.forEach(test => {
        print(`  • ${test.name}: ${test.message}`);
    });
}

print("\n📋 NEXT STEPS:");
if (testResults.failed === 0) {
    print("1. ✅ Database setup is complete and tested");
    print("2. 🔧 Configure your application environment variables");
    print("3. 🚀 Deploy your Spring Boot application");
    print("4. 🧪 Test the REST API endpoints");
    print("5. 🌐 Configure DNS for your verification subdomain");
} else {
    print("1. 🔧 Fix the failed tests listed above");
    print("2. 🔄 Re-run the setup script if necessary");
    print("3. 🧪 Run this test script again to verify fixes");
}

print(`\n🏁 Test completed at: ${new Date().toISOString()}`);
print("=" + "=".repeat(59));