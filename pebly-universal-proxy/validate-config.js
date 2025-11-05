#!/usr/bin/env node

/**
 * Configuration validator for Pebly Universal Proxy
 * Checks if all required settings are properly configured
 */

const fs = require('fs');
const path = require('path');

class ConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  async validate() {
    console.log('🔍 Validating Pebly Universal Proxy Configuration...\n');

    this.checkWranglerConfig();
    this.checkPackageJson();
    this.checkSourceFiles();
    this.checkEnvironmentSetup();

    this.printResults();
    return this.errors.length === 0;
  }

  checkWranglerConfig() {
    console.log('📋 Checking wrangler.toml...');
    
    if (!fs.existsSync('wrangler.toml')) {
      this.errors.push('wrangler.toml not found');
      return;
    }

    const config = fs.readFileSync('wrangler.toml', 'utf8');
    
    // Check required fields
    const requiredFields = ['name', 'main', 'compatibility_date'];
    requiredFields.forEach(field => {
      if (!config.includes(field)) {
        this.errors.push(`Missing required field in wrangler.toml: ${field}`);
      }
    });

    // Check environment configuration
    if (!config.includes('[env.production]')) {
      this.warnings.push('No production environment configured');
    }

    if (!config.includes('BACKEND_URL')) {
      this.warnings.push('BACKEND_URL not configured in wrangler.toml');
    }

    console.log('✅ wrangler.toml checked\n');
  }

  checkPackageJson() {
    console.log('📦 Checking package.json...');
    
    if (!fs.existsSync('package.json')) {
      this.errors.push('package.json not found');
      return;
    }

    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (!pkg.name) {
      this.errors.push('Package name not set');
    }

    if (!pkg.scripts || !pkg.scripts.deploy) {
      this.warnings.push('Deploy script not configured');
    }

    console.log('✅ package.json checked\n');
  }

  checkSourceFiles() {
    console.log('📁 Checking source files...');
    
    const requiredFiles = [
      'src/index.js',
      'src/analytics.js'
    ];

    requiredFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        this.errors.push(`Required source file missing: ${file}`);
      }
    });

    // Check main index.js for required exports
    if (fs.existsSync('src/index.js')) {
      const indexContent = fs.readFileSync('src/index.js', 'utf8');
      
      if (!indexContent.includes('export default')) {
        this.errors.push('src/index.js missing default export');
      }

      if (!indexContent.includes('async fetch')) {
        this.errors.push('src/index.js missing fetch handler');
      }
    }

    console.log('✅ Source files checked\n');
  }

  checkEnvironmentSetup() {
    console.log('🌍 Checking environment setup...');
    
    // Check if .env.example exists
    if (!fs.existsSync('.env.example')) {
      this.warnings.push('.env.example not found - users may need configuration guidance');
    }

    // Check deployment script
    if (!fs.existsSync('deploy.sh')) {
      this.warnings.push('deploy.sh not found - manual deployment required');
    } else {
      const stats = fs.statSync('deploy.sh');
      if (!(stats.mode & parseInt('111', 8))) {
        this.warnings.push('deploy.sh is not executable - run: chmod +x deploy.sh');
      }
    }

    // Check test script
    if (!fs.existsSync('test-proxy.js')) {
      this.warnings.push('test-proxy.js not found - testing will be manual');
    }

    console.log('✅ Environment setup checked\n');
  }

  printResults() {
    console.log('📊 Validation Results:');
    console.log('=====================');

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 All checks passed! Configuration is ready for deployment.\n');
      console.log('Next steps:');
      console.log('1. Run: npm run setup');
      console.log('2. Update frontend with your worker URL');
      console.log('3. Test with: npm run test');
      return;
    }

    if (this.errors.length > 0) {
      console.log('❌ Errors (must fix):');
      this.errors.forEach(error => console.log(`  - ${error}`));
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  Warnings (recommended to fix):');
      this.warnings.forEach(warning => console.log(`  - ${warning}`));
      console.log('');
    }

    if (this.errors.length > 0) {
      console.log('❌ Configuration has errors. Please fix them before deploying.');
      process.exit(1);
    } else {
      console.log('✅ Configuration is valid with some warnings. You can proceed with deployment.');
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new ConfigValidator();
  validator.validate().catch(console.error);
}

module.exports = ConfigValidator;