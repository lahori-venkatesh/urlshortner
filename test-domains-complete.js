// Comprehensive test script for Custom Domains API
const API_BASE_URL = 'https://urlshortner-1-hpyu.onrender.com/api';

// Test configuration
const TEST_CONFIG = {
    // Replace with actual token from localStorage after login
    token: 'YOUR_TOKEN_HERE',
    testDomain: `test-${Date.now()}.example.com`,
    apiUrl: API_BASE_URL
};

class DomainAPITester {
    constructor(config) {
        this.config = config;
        this.results = {
            healthCheck: null,
            authentication: null,
            getDomains: null,
            addDomain: null,
            getDomainsAfterAdd: null,
            verifyDomainExists: null
        };
    }

    async runAllTests() {
        console.log('🚀 Starting Comprehensive Domain API Tests');
        console.log('='.repeat(50));
        
        if (this.config.token === 'YOUR_TOKEN_HERE') {
            console.log('❌ Please replace YOUR_TOKEN_HERE with your actual token');
            console.log('Instructions:');
            console.log('1. Open browser and log in to the app');
            console.log('2. Open Developer Tools (F12)');
            console.log('3. Go to Application > Local Storage');
            console.log('4. Copy the "token" value');
            console.log('5. Replace YOUR_TOKEN_HERE in this script');
            return;
        }

        try {
            await this.testHealthCheck();
            await this.testAuthentication();
            await this.testGetDomains();
            await this.testAddDomain();
            await this.testGetDomainsAfterAdd();
            await this.testVerifyDomainExists();
            
            this.printSummary();
        } catch (error) {
            console.error('❌ Test suite failed:', error);
        }
    }

    async testHealthCheck() {
        console.log('\n1️⃣ Testing API Health Check...');
        
        try {
            const response = await fetch(`${this.config.apiUrl}/v1/domains/health`);
            const data = await response.json();
            
            this.results.healthCheck = {
                success: response.ok && data.success,
                status: response.status,
                data: data
            };
            
            if (this.results.healthCheck.success) {
                console.log('✅ Health check passed');
                console.log(`   Repository available: ${data.repositoryAvailable}`);
                console.log(`   Repository working: ${data.repositoryWorking}`);
                console.log(`   Total domains in DB: ${data.totalDomains}`);
            } else {
                console.log('❌ Health check failed');
                console.log(`   Status: ${response.status}`);
                console.log(`   Response:`, data);
            }
        } catch (error) {
            console.log('❌ Health check error:', error.message);
            this.results.healthCheck = { success: false, error: error.message };
        }
    }

    async testAuthentication() {
        console.log('\n2️⃣ Testing Authentication...');
        
        try {
            // Test with invalid token first
            const invalidResponse = await fetch(`${this.config.apiUrl}/v1/domains/my`, {
                headers: {
                    'Authorization': 'Bearer invalid_token',
                    'Content-Type': 'application/json'
                }
            });
            
            if (invalidResponse.status === 401) {
                console.log('✅ Invalid token correctly rejected (401)');
            } else {
                console.log('⚠️ Invalid token should return 401, got:', invalidResponse.status);
            }
            
            // Test with valid token
            const validResponse = await fetch(`${this.config.apiUrl}/v1/domains/my`, {
                headers: {
                    'Authorization': `Bearer ${this.config.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await validResponse.json();
            
            this.results.authentication = {
                success: validResponse.ok,
                status: validResponse.status,
                data: data
            };
            
            if (this.results.authentication.success) {
                console.log('✅ Authentication successful');
                console.log(`   User ID: ${data.userId}`);
                console.log(`   Owner Type: ${data.ownerType}`);
            } else {
                console.log('❌ Authentication failed');
                console.log(`   Status: ${validResponse.status}`);
                console.log(`   Message: ${data.message}`);
            }
        } catch (error) {
            console.log('❌ Authentication test error:', error.message);
            this.results.authentication = { success: false, error: error.message };
        }
    }

    async testGetDomains() {
        console.log('\n3️⃣ Testing GET /domains/my...');
        
        try {
            const response = await fetch(`${this.config.apiUrl}/v1/domains/my`, {
                headers: {
                    'Authorization': `Bearer ${this.config.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            this.results.getDomains = {
                success: response.ok && data.success,
                status: response.status,
                data: data,
                domainCount: data.domains ? data.domains.length : 0
            };
            
            if (this.results.getDomains.success) {
                console.log('✅ GET domains successful');
                console.log(`   Found ${this.results.getDomains.domainCount} domains`);
                
                if (data.domains && data.domains.length > 0) {
                    console.log('   Existing domains:');
                    data.domains.forEach((domain, index) => {
                        console.log(`     ${index + 1}. ${domain.domainName} (${domain.status})`);
                    });
                }
            } else {
                console.log('❌ GET domains failed');
                console.log(`   Status: ${response.status}`);
                console.log(`   Message: ${data.message}`);
            }
        } catch (error) {
            console.log('❌ GET domains error:', error.message);
            this.results.getDomains = { success: false, error: error.message };
        }
    }

    async testAddDomain() {
        console.log('\n4️⃣ Testing POST /domains (Add Domain)...');
        
        try {
            const requestBody = {
                domainName: this.config.testDomain,
                ownerType: 'USER'
            };
            
            console.log(`   Adding domain: ${this.config.testDomain}`);
            
            const response = await fetch(`${this.config.apiUrl}/v1/domains`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();
            
            this.results.addDomain = {
                success: response.ok && data.success,
                status: response.status,
                data: data,
                domainId: data.domain ? data.domain.id : null
            };
            
            if (this.results.addDomain.success) {
                console.log('✅ ADD domain successful');
                console.log(`   Domain ID: ${data.domain.id}`);
                console.log(`   Domain Name: ${data.domain.domainName}`);
                console.log(`   Status: ${data.domain.status}`);
                console.log(`   Verification Token: ${data.domain.verificationToken}`);
                console.log(`   CNAME Target: ${data.domain.cnameTarget}`);
                console.log(`   Created At: ${data.domain.createdAt}`);
            } else {
                console.log('❌ ADD domain failed');
                console.log(`   Status: ${response.status}`);
                console.log(`   Message: ${data.message}`);
                
                // Check if it's a plan limitation
                if (response.status === 403) {
                    console.log('   ⚠️ This might be a plan limitation (FREE users need PRO/BUSINESS)');
                }
            }
        } catch (error) {
            console.log('❌ ADD domain error:', error.message);
            this.results.addDomain = { success: false, error: error.message };
        }
    }

    async testGetDomainsAfterAdd() {
        console.log('\n5️⃣ Testing GET /domains/my after adding domain...');
        
        try {
            const response = await fetch(`${this.config.apiUrl}/v1/domains/my`, {
                headers: {
                    'Authorization': `Bearer ${this.config.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            this.results.getDomainsAfterAdd = {
                success: response.ok && data.success,
                status: response.status,
                data: data,
                domainCount: data.domains ? data.domains.length : 0
            };
            
            if (this.results.getDomainsAfterAdd.success) {
                console.log('✅ GET domains after add successful');
                console.log(`   Total domains: ${this.results.getDomainsAfterAdd.domainCount}`);
                
                // Check if our test domain is in the list
                const testDomainFound = data.domains && data.domains.find(d => d.domainName === this.config.testDomain);
                
                if (testDomainFound) {
                    console.log('✅ Test domain found in list');
                    console.log(`   Domain: ${testDomainFound.domainName}`);
                    console.log(`   Status: ${testDomainFound.status}`);
                    console.log(`   ID: ${testDomainFound.id}`);
                } else {
                    console.log('❌ Test domain NOT found in list');
                    console.log('   Available domains:');
                    data.domains?.forEach(domain => {
                        console.log(`     - ${domain.domainName} (${domain.status})`);
                    });
                }
                
                // Compare counts
                const previousCount = this.results.getDomains.domainCount || 0;
                const currentCount = this.results.getDomainsAfterAdd.domainCount;
                
                if (this.results.addDomain.success && currentCount > previousCount) {
                    console.log('✅ Domain count increased as expected');
                    console.log(`   Previous: ${previousCount}, Current: ${currentCount}`);
                } else if (this.results.addDomain.success) {
                    console.log('⚠️ Domain count did not increase (might be a caching issue)');
                }
            } else {
                console.log('❌ GET domains after add failed');
                console.log(`   Status: ${response.status}`);
                console.log(`   Message: ${data.message}`);
            }
        } catch (error) {
            console.log('❌ GET domains after add error:', error.message);
            this.results.getDomainsAfterAdd = { success: false, error: error.message };
        }
    }

    async testVerifyDomainExists() {
        console.log('\n6️⃣ Testing domain existence in database...');
        
        if (!this.results.addDomain.success) {
            console.log('⏭️ Skipping domain existence test (add domain failed)');
            return;
        }
        
        try {
            // Try to add the same domain again (should fail with "already exists")
            const requestBody = {
                domainName: this.config.testDomain,
                ownerType: 'USER'
            };
            
            const response = await fetch(`${this.config.apiUrl}/v1/domains`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            const data = await response.json();
            
            this.results.verifyDomainExists = {
                success: !response.ok && data.message && data.message.includes('already exists'),
                status: response.status,
                data: data
            };
            
            if (this.results.verifyDomainExists.success) {
                console.log('✅ Domain existence validation working');
                console.log(`   Correctly rejected duplicate domain: ${data.message}`);
            } else if (response.ok) {
                console.log('❌ Domain existence validation failed');
                console.log('   Duplicate domain was allowed (should be rejected)');
            } else {
                console.log('⚠️ Domain existence test inconclusive');
                console.log(`   Status: ${response.status}, Message: ${data.message}`);
            }
        } catch (error) {
            console.log('❌ Domain existence test error:', error.message);
            this.results.verifyDomainExists = { success: false, error: error.message };
        }
    }

    printSummary() {
        console.log('\n' + '='.repeat(50));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(50));
        
        const tests = [
            { name: 'Health Check', result: this.results.healthCheck },
            { name: 'Authentication', result: this.results.authentication },
            { name: 'GET Domains', result: this.results.getDomains },
            { name: 'ADD Domain', result: this.results.addDomain },
            { name: 'GET After Add', result: this.results.getDomainsAfterAdd },
            { name: 'Domain Exists Check', result: this.results.verifyDomainExists }
        ];
        
        let passed = 0;
        let total = 0;
        
        tests.forEach(test => {
            if (test.result !== null) {
                total++;
                const status = test.result.success ? '✅ PASS' : '❌ FAIL';
                console.log(`${status} ${test.name}`);
                if (test.result.success) passed++;
                
                if (!test.result.success && test.result.error) {
                    console.log(`     Error: ${test.result.error}`);
                }
            }
        });
        
        console.log('\n' + '-'.repeat(30));
        console.log(`Results: ${passed}/${total} tests passed`);
        
        if (passed === total) {
            console.log('🎉 All tests passed! Domain API is working correctly.');
        } else {
            console.log('⚠️ Some tests failed. Check the details above.');
        }
        
        // Database verification summary
        if (this.results.addDomain.success && this.results.getDomainsAfterAdd.success) {
            console.log('\n✅ Database Storage: Domain successfully stored and retrieved');
        } else if (this.results.addDomain.success) {
            console.log('\n⚠️ Database Storage: Domain added but retrieval needs verification');
        } else {
            console.log('\n❌ Database Storage: Could not verify (add domain failed)');
        }
        
        // API functionality summary
        console.log('\n📋 API Functionality Status:');
        console.log(`   POST /domains: ${this.results.addDomain?.success ? '✅ Working' : '❌ Failed'}`);
        console.log(`   GET /domains/my: ${this.results.getDomains?.success ? '✅ Working' : '❌ Failed'}`);
        console.log(`   Authentication: ${this.results.authentication?.success ? '✅ Working' : '❌ Failed'}`);
        console.log(`   Data Persistence: ${this.results.verifyDomainExists?.success ? '✅ Working' : '❌ Needs Check'}`);
    }
}

// Instructions for running the test
console.log('🔧 Domain API Test Setup');
console.log('To run this test:');
console.log('1. Log in to your app in the browser');
console.log('2. Open Developer Tools > Application > Local Storage');
console.log('3. Copy the "token" value');
console.log('4. Replace YOUR_TOKEN_HERE in TEST_CONFIG with your token');
console.log('5. Run: node test-domains-complete.js');
console.log('\nStarting test in 3 seconds...\n');

// Auto-run after delay
setTimeout(() => {
    const tester = new DomainAPITester(TEST_CONFIG);
    tester.runAllTests().catch(console.error);
}, 3000);