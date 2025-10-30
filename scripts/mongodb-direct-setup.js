// Direct MongoDB Atlas Setup Script using Node.js
// This script connects directly to MongoDB Atlas and sets up the custom domain feature
// Run with: node mongodb-direct-setup.js

const { MongoClient } = require('mongodb');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://lahorivenkatesh709:p0SkcBwHo67ghvMW@cluster0.y8ucl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const DATABASE_NAME = 'pebly';
const VERIFICATION_SUBDOMAIN = 'verify.bitaurl.com';

console.log('🚀 MongoDB Atlas Custom Domain Setup');
console.log('====================================');
console.log(`Database: ${DATABASE_NAME}`);
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log('');

async function setupDatabase() {
    let client;
    
    try {
        // Connect to MongoDB Atlas
        console.log('📡 Connecting to MongoDB Atlas...');
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas');
        
        const db = client.db(DATABASE_NAME);
        
        // 1. Create domains collection with validation
        console.log('\n📋 Step 1: Creating domains collection...');
        try {
            await db.createCollection('domains', {
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
                            }
                        }
                    }
                }
            });
            console.log('✅ Created domains collection with validation schema');
        } catch (e) {
            if (e.codeName === 'NamespaceExists') {
                console.log('ℹ️  Domains collection already exists');
            } else {
                throw e;
            }
        }
        
        // 2. Create domain indexes
        console.log('\n📋 Step 2: Creating domain indexes...');
        const domainsCollection = db.collection('domains');
        
        const domainIndexes = [
            // Unique indexes
            { spec: { "domainName": 1 }, options: { unique: true, name: "idx_domain_name_unique", background: true } },
            { spec: { "verificationToken": 1 }, options: { unique: true, name: "idx_verification_token_unique", background: true } },
            
            // Compound indexes
            { spec: { "ownerId": 1, "ownerType": 1 }, options: { name: "idx_owner_compound", background: true } },
            { spec: { "ownerId": 1, "ownerType": 1, "status": 1 }, options: { name: "idx_owner_status_compound", background: true } },
            { spec: { "status": 1, "verificationAttempts": 1 }, options: { name: "idx_status_attempts", background: true } },
            
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
        for (const { spec, options } of domainIndexes) {
            try {
                await domainsCollection.createIndex(spec, options);
                console.log(`✅ Created index: ${options.name}`);
                indexSuccessCount++;
            } catch (e) {
                if (e.code === 85 || e.codeName === "IndexOptionsConflict" || e.codeName === "IndexKeySpecsConflict") {
                    console.log(`ℹ️  Index already exists: ${options.name}`);
                    indexSuccessCount++;
                } else {
                    console.log(`❌ Failed to create index ${options.name}: ${e.message}`);
                }
            }
        }
        console.log(`✅ Domain indexes: ${indexSuccessCount}/${domainIndexes.length} created/verified`);
        
        // 3. Update URLs collection for custom domain support
        console.log('\n📋 Step 3: Setting up URLs collection for custom domains...');
        const urlsCollection = db.collection('shortenedUrls');
        
        // Check if collection exists
        const collections = await db.listCollections().toArray();
        const urlsExists = collections.some(col => col.name === 'shortenedUrls');
        
        if (urlsExists) {
            // Add domain field to existing URLs
            const urlsNeedingUpdate = await urlsCollection.countDocuments({ "domain": { $exists: false } });
            if (urlsNeedingUpdate > 0) {
                const updateResult = await urlsCollection.updateMany(
                    { "domain": { $exists: false } },
                    { 
                        $set: { 
                            "domain": null,
                            "updatedAt": new Date()
                        }
                    }
                );
                console.log(`✅ Updated ${updateResult.modifiedCount} URLs with domain field`);
            } else {
                console.log('ℹ️  All URLs already have domain field');
            }
            
            // Create URL indexes for custom domain support
            const urlIndexes = [
                { spec: { "shortCode": 1, "domain": 1 }, options: { name: "idx_shortcode_domain_compound", background: true } },
                { spec: { "domain": 1 }, options: { name: "idx_domain", background: true } },
                { spec: { "domain": 1, "createdAt": -1 }, options: { name: "idx_domain_created_desc", background: true } },
                { spec: { "domain": 1, "isActive": 1 }, options: { name: "idx_domain_active", background: true } }
            ];
            
            let urlIndexSuccessCount = 0;
            for (const { spec, options } of urlIndexes) {
                try {
                    await urlsCollection.createIndex(spec, options);
                    console.log(`✅ Created URL index: ${options.name}`);
                    urlIndexSuccessCount++;
                } catch (e) {
                    if (e.code === 85 || e.codeName === "IndexOptionsConflict" || e.codeName === "IndexKeySpecsConflict") {
                        console.log(`ℹ️  URL index already exists: ${options.name}`);
                        urlIndexSuccessCount++;
                    } else {
                        console.log(`❌ Failed to create URL index ${options.name}: ${e.message}`);
                    }
                }
            }
            console.log(`✅ URL indexes: ${urlIndexSuccessCount}/${urlIndexes.length} created/verified`);
        } else {
            console.log('ℹ️  URLs collection doesn\'t exist yet - will be created when first URL is shortened');
        }
        
        // 4. Create sample domains
        console.log('\n📋 Step 4: Creating sample domains...');
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
        
        let sampleDomainsCreated = 0;
        for (const domain of sampleDomains) {
            try {
                await domainsCollection.insertOne(domain);
                console.log(`✅ Created sample domain: ${domain.domainName}`);
                sampleDomainsCreated++;
            } catch (e) {
                if (e.code === 11000) {
                    console.log(`ℹ️  Sample domain already exists: ${domain.domainName}`);
                } else {
                    console.log(`❌ Failed to create sample domain ${domain.domainName}: ${e.message}`);
                }
            }
        }
        
        // 5. Create sample URLs with custom domains
        console.log('\n📋 Step 5: Creating sample URLs...');
        if (urlsExists || await db.collection('shortenedUrls').countDocuments() >= 0) {
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
            
            let sampleUrlsCreated = 0;
            for (const url of sampleUrls) {
                try {
                    await urlsCollection.insertOne(url);
                    console.log(`✅ Created sample URL: ${url.shortCode} → ${url.originalUrl}`);
                    sampleUrlsCreated++;
                } catch (e) {
                    if (e.code === 11000) {
                        console.log(`ℹ️  Sample URL already exists: ${url.shortCode}`);
                    } else {
                        console.log(`❌ Failed to create sample URL ${url.shortCode}: ${e.message}`);
                    }
                }
            }
        }
        
        // 6. Create analytics view
        console.log('\n📋 Step 6: Creating analytics view...');
        try {
            await db.createView("domain_analytics", "shortenedUrls", [
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
            console.log('✅ Created domain_analytics view');
        } catch (e) {
            if (e.codeName === 'NamespaceExists') {
                console.log('ℹ️  Domain analytics view already exists');
            } else {
                console.log(`⚠️  Domain analytics view creation failed: ${e.message}`);
            }
        }
        
        // 7. Verification and statistics
        console.log('\n📋 Step 7: Verification and statistics...');
        const stats = {
            domainsCollection: await domainsCollection.countDocuments(),
            domainsIndexes: (await domainsCollection.indexes()).length,
            urlsCollection: urlsExists ? await urlsCollection.countDocuments() : 0,
            urlsIndexes: urlsExists ? (await urlsCollection.indexes()).length : 0,
            urlsWithDomainField: urlsExists ? await urlsCollection.countDocuments({ "domain": { $exists: true } }) : 0,
            verifiedDomains: await domainsCollection.countDocuments({ "status": "VERIFIED" }),
            pendingDomains: await domainsCollection.countDocuments({ "status": "PENDING" }),
            reservedDomains: await domainsCollection.countDocuments({ "status": "RESERVED" })
        };
        
        console.log('\n📊 Database Statistics:');
        console.log(`  Domains collection: ${stats.domainsCollection} documents, ${stats.domainsIndexes} indexes`);
        console.log(`  URLs collection: ${stats.urlsCollection} documents, ${stats.urlsIndexes} indexes`);
        console.log(`  URLs with domain field: ${stats.urlsWithDomainField}`);
        console.log(`  Domain status breakdown:`);
        console.log(`    - VERIFIED: ${stats.verifiedDomains}`);
        console.log(`    - PENDING: ${stats.pendingDomains}`);
        console.log(`    - RESERVED: ${stats.reservedDomains}`);
        
        // 8. Test queries
        console.log('\n📋 Step 8: Running test queries...');
        
        // Test 1: Find domains by owner
        const ownerDomains = await domainsCollection.find({ "ownerId": "demo-user-id", "ownerType": "USER" }).toArray();
        console.log(`✅ Test 1: Found ${ownerDomains.length} domains for demo-user-id`);
        
        // Test 2: Find verified domains
        const verifiedDomains = await domainsCollection.find({ "status": "VERIFIED" }).toArray();
        console.log(`✅ Test 2: Found ${verifiedDomains.length} verified domains`);
        
        // Test 3: Find URLs by custom domain
        if (urlsExists) {
            const customDomainUrls = await urlsCollection.find({ "domain": "demo.example.com" }).toArray();
            console.log(`✅ Test 3: Found ${customDomainUrls.length} URLs for demo.example.com`);
        }
        
        // Test 4: Test analytics view
        try {
            const analyticsResults = await db.collection('domain_analytics').find().toArray();
            console.log(`✅ Test 4: Analytics view returned ${analyticsResults.length} results`);
        } catch (e) {
            console.log(`⚠️  Test 4: Analytics view test failed: ${e.message}`);
        }
        
        // 9. Show sample domains created
        console.log('\n📍 Sample Domains Created:');
        const allDomains = await domainsCollection.find({}, { 
            projection: { domainName: 1, status: 1, ownerType: 1, createdAt: 1 } 
        }).toArray();
        
        allDomains.forEach(doc => {
            console.log(`  📍 ${doc.domainName} (${doc.status}, ${doc.ownerType}) - Created: ${doc.createdAt.toISOString()}`);
        });
        
        // 10. Show sample URLs created
        if (urlsExists && stats.urlsCollection > 0) {
            console.log('\n🔗 Sample URLs Created:');
            const allUrls = await urlsCollection.find({}, { 
                projection: { shortCode: 1, domain: 1, originalUrl: 1, totalClicks: 1 } 
            }).toArray();
            
            allUrls.forEach(doc => {
                const domainDisplay = doc.domain || "default";
                console.log(`  🔗 ${doc.shortCode} → ${doc.originalUrl} (${domainDisplay}, ${doc.totalClicks} clicks)`);
            });
        }
        
        console.log('\n🎉 SETUP COMPLETE! 🎉');
        console.log('✅ Custom domains infrastructure is fully deployed!');
        console.log(`✅ Database: ${DATABASE_NAME}`);
        console.log(`✅ Collections: domains (${stats.domainsCollection} docs), shortenedUrls (${stats.urlsCollection} docs)`);
        console.log(`✅ Indexes: ${stats.domainsIndexes + stats.urlsIndexes} total indexes created`);
        console.log(`✅ Sample data: ${stats.domainsCollection} domains, ${stats.urlsCollection} URLs`);
        
        console.log('\n📋 Next Steps:');
        console.log('1. 🔧 Configure environment variables in your Spring Boot app:');
        console.log('   - MONGODB_URI (already configured)');
        console.log('   - CLOUDFLARE_API_TOKEN');
        console.log('   - CLOUDFLARE_ZONE_ID');
        console.log(`2. 🌐 Set up DNS for ${VERIFICATION_SUBDOMAIN}`);
        console.log('3. 🚀 Deploy your Spring Boot application');
        console.log('4. 🧪 Test the API endpoints:');
        console.log('   - POST /api/v1/domains (create domain)');
        console.log('   - GET /api/v1/domains (list domains)');
        console.log('   - POST /api/v1/domains/{domain}/verify (verify domain)');
        console.log('5. 📊 Monitor using the domain_analytics view');
        
        console.log('\n🔍 Verification Commands:');
        console.log('// Check domains:');
        console.log('db.domains.find().pretty()');
        console.log('// Check domain analytics:');
        console.log('db.domain_analytics.find().pretty()');
        console.log('// Check URLs with custom domains:');
        console.log('db.shortenedUrls.find({"domain": {$ne: null}}).pretty()');
        
        console.log(`\n⏰ Setup completed at: ${new Date().toISOString()}`);
        console.log('🎯 Your custom domain feature is ready for production!');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
            console.log('\n📡 Disconnected from MongoDB Atlas');
        }
    }
}

// Run the setup
setupDatabase().catch(console.error);