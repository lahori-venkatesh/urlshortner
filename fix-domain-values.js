#!/usr/bin/env node

/**
 * Script to fix domain values in the database
 * This fixes the issue where domain field contains original URL's domain instead of custom domain
 */

const https = require('https');

async function fixDomainValues() {
  console.log('🔧 Fixing Domain Values in Database\n');
  
  const API_BASE_URL = 'https://urlshortner-1-hpyu.onrender.com/api';
  
  // This would need to be implemented as a backend endpoint
  console.log('📋 Required Backend Endpoint:');
  console.log('POST /api/admin/fix-domain-values');
  console.log('');
  console.log('This endpoint should:');
  console.log('1. Find all URLs where domain = original URL domain');
  console.log('2. For default domain URLs (shortUrl contains pebly.vercel.app):');
  console.log('   - Set domain = null');
  console.log('3. For custom domain URLs (shortUrl contains custom domain):');
  console.log('   - Extract domain from shortUrl and set domain = extracted domain');
  console.log('');
  console.log('Example fixes needed:');
  console.log('- ZyPkHb: domain "www.nslookup.io" → null (default domain)');
  console.log('- vR8iDa: domain "www.nslookup.io" → "links.pdfcircle.com" (custom domain)');
  console.log('');
  console.log('🚨 This requires backend implementation and database access.');
}

fixDomainValues().catch(console.error);