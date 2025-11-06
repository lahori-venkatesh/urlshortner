#!/usr/bin/env node

/**
 * Database migration script to fix domain values for default domain URLs
 * This script identifies URLs that should have domain="pebly.vercel.app" or domain=null
 * and fixes their domain field values.
 */

const API_BASE_URL = 'https://urlshortner-1-hpyu.onrender.com/api';

// You need to get this token from your browser's localStorage after logging in
const ADMIN_TOKEN = 'YOUR_ADMIN_TOKEN_HERE';

class DomainFixer {
  constructor() {
    this.apiUrl = API_BASE_URL;
    this.token = ADMIN_TOKEN;
    this.fixedCount = 0;
    this.errorCount = 0;
  }

  async fixDomainValues() {
    console.log('🔧 Starting Domain Value Fix for Default Domain URLs');
    console.log('==================================================\n');

    if (this.token === 'YOUR_ADMIN_TOKEN_HERE') {
      console.log('❌ Please set your admin token in the script');
      console.log('Instructions:');
      console.log('1. Log in to your app as an admin');
      console.log('2. Open Developer Tools > Application > Local Storage');
      console.log('3. Copy the "token" value');
      console.log('4. Replace YOUR_ADMIN_TOKEN_HERE in this script');
      return;
    }

    try {
      // Step 1: Get all URLs that might need fixing
      console.log('1️⃣ Identifying URLs that need domain fixes...');
      const problematicUrls = await this.findProblematicUrls();
      
      if (problematicUrls.length === 0) {
        console.log('✅ No URLs need domain fixes!');
        return;
      }

      console.log(`Found ${problematicUrls.length} URLs that may need fixing:\n`);

      // Step 2: Analyze and fix each URL
      for (const url of problematicUrls) {
        await this.analyzeAndFixUrl(url);
      }

      // Step 3: Summary
      console.log('\n📊 Fix Summary:');
      console.log('===============');
      console.log(`✅ Fixed: ${this.fixedCount} URLs`);
      console.log(`❌ Errors: ${this.errorCount} URLs`);
      console.log(`📋 Total processed: ${problematicUrls.length} URLs`);

      if (this.fixedCount > 0) {
        console.log('\n🎉 Domain fixes completed! Test your URLs now.');
      }

    } catch (error) {
      console.error('❌ Fix process failed:', error.message);
    }
  }

  async findProblematicUrls() {
    // This is a conceptual approach - you'd need to implement the actual API endpoint
    // or database query to find URLs with incorrect domain values
    
    console.log('   Looking for URLs with incorrect domain values...');
    
    // For now, we'll focus on the specific URL mentioned in the issue
    return [
      {
        shortCode: '7sT40m',
        shortUrl: 'https://pebly.vercel.app/7sT40m',
        originalUrl: 'https://chatgpt.com/c/690c7e95-69cc-8323-9494-bf3f5d93832f',
        domain: 'chatgpt.com', // This is wrong - should be 'pebly.vercel.app' or null
        userId: '6905bb489ff98a7c410c9143'
      }
    ];
  }

  async analyzeAndFixUrl(url) {
    console.log(`🔍 Analyzing URL: ${url.shortCode}`);
    console.log(`   Short URL: ${url.shortUrl}`);
    console.log(`   Current domain: ${url.domain}`);
    console.log(`   Original URL: ${url.originalUrl}`);

    // Determine correct domain value
    let correctDomain = null;
    
    if (url.shortUrl && url.shortUrl.includes('pebly.vercel.app')) {
      // This is a default domain URL
      correctDomain = 'pebly.vercel.app';
      console.log(`   ✅ Should be default domain: ${correctDomain}`);
    } else if (url.shortUrl && !url.shortUrl.includes('pebly.vercel.app')) {
      // This is a custom domain URL
      try {
        const urlObj = new URL(url.shortUrl);
        correctDomain = urlObj.hostname;
        console.log(`   ✅ Should be custom domain: ${correctDomain}`);
      } catch (e) {
        console.log(`   ❌ Invalid shortUrl format: ${url.shortUrl}`);
        this.errorCount++;
        return;
      }
    }

    // Check if fix is needed
    if (url.domain === correctDomain) {
      console.log(`   ✅ Domain is already correct: ${correctDomain}`);
      return;
    }

    // Apply fix
    console.log(`   🔧 Fixing domain: ${url.domain} → ${correctDomain}`);
    
    try {
      const success = await this.updateUrlDomain(url.shortCode, correctDomain, url.userId);
      if (success) {
        console.log(`   ✅ Fixed successfully!`);
        this.fixedCount++;
      } else {
        console.log(`   ❌ Fix failed`);
        this.errorCount++;
      }
    } catch (error) {
      console.log(`   ❌ Fix error: ${error.message}`);
      this.errorCount++;
    }

    console.log(''); // Empty line for readability
  }

  async updateUrlDomain(shortCode, newDomain, userId) {
    // This would need to be implemented as an admin API endpoint
    // For now, we'll simulate the fix
    
    console.log(`   📡 Calling API to update domain for ${shortCode}...`);
    
    // Simulated API call - you'd need to implement this endpoint
    const requestBody = {
      shortCode,
      newDomain,
      userId,
      action: 'fix_domain'
    };

    try {
      // This endpoint doesn't exist yet - you'd need to create it
      const response = await fetch(`${this.apiUrl}/admin/fix-domain`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        return data.success;
      } else {
        console.log(`   API Error: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.log(`   Network Error: ${error.message}`);
      return false;
    }
  }
}

// Manual fix instructions
console.log('🔧 Manual Domain Fix Instructions');
console.log('=================================');
console.log('');
console.log('Since the automated fix requires an admin API endpoint,');
console.log('here\'s how to fix the domain manually:');
console.log('');
console.log('1. Connect to your MongoDB database');
console.log('2. Run this query to find problematic URLs:');
console.log('');
console.log('   db.shortened_urls.find({');
console.log('     shortUrl: /pebly\\.vercel\\.app/,');
console.log('     domain: { $ne: "pebly.vercel.app", $ne: null }');
console.log('   })');
console.log('');
console.log('3. Fix the domain field for default domain URLs:');
console.log('');
console.log('   db.shortened_urls.updateMany(');
console.log('     {');
console.log('       shortUrl: /pebly\\.vercel\\.app/,');
console.log('       domain: { $ne: "pebly.vercel.app", $ne: null }');
console.log('     },');
console.log('     {');
console.log('       $set: { domain: "pebly.vercel.app" }');
console.log('     }');
console.log('   )');
console.log('');
console.log('4. Specifically for the URL 7sT40m:');
console.log('');
console.log('   db.shortened_urls.updateOne(');
console.log('     { shortCode: "7sT40m" },');
console.log('     { $set: { domain: "pebly.vercel.app" } }');
console.log('   )');
console.log('');
console.log('5. Restart your backend service to clear any caches');
console.log('');
console.log('After these fixes, test the URL: https://pebly.vercel.app/7sT40m');

// Uncomment to run the automated fixer (when admin API is implemented)
// const fixer = new DomainFixer();
// fixer.fixDomainValues().catch(console.error);