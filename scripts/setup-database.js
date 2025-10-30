#!/usr/bin/env node

/**
 * Cross-platform Node.js script to set up MongoDB for team collaboration
 * Works on Windows, macOS, and Linux
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = process.env.MONGODB_DATABASE || 'pebly';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'green') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
    console.error(`${colors.red}❌ ${message}${colors.reset}`);
}

function info(message) {
    console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

function success(message) {
    console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function warning(message) {
    console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

// Check if MongoDB shell is available
function checkMongoShell() {
    try {
        execSync('mongosh --version', { stdio: 'ignore' });
        return true;
    } catch (e) {
        try {
            execSync('mongo --version', { stdio: 'ignore' });
            return 'legacy';
        } catch (e2) {
            return false;
        }
    }
}

// Test MongoDB connection
function testConnection() {
    log('🔍 Testing MongoDB connection...');
    
    try {
        const command = `mongosh "${MONGODB_URI}" --eval "db.adminCommand('ping')"`;
        execSync(command, { stdio: 'ignore' });
        success('MongoDB connection successful');
        return true;
    } catch (e) {
        error(`Cannot connect to MongoDB at ${MONGODB_URI}`);
        error('Please check your MongoDB connection and try again.');
        return false;
    }
}

// Run MongoDB setup script
function runSetupScript() {
    log('🏗️ Setting up database with team collaboration support...');
    
    const setupScriptPath = path.join(__dirname, 'mongodb-setup.js');
    
    if (!fs.existsSync(setupScriptPath)) {
        error('mongodb-setup.js not found in scripts directory');
        return false;
    }
    
    try {
        const command = `mongosh "${MONGODB_URI}/${DATABASE_NAME}" "${setupScriptPath}"`;
        execSync(command, { stdio: 'inherit' });
        success('Database setup completed successfully');
        return true;
    } catch (e) {
        error('Database setup failed');
        console.error(e.message);
        return false;
    }
}

// Verify setup
function verifySetup() {
    log('🔍 Verifying database setup...');
    
    try {
        // Check if team collections exist
        const checkCommand = `mongosh "${MONGODB_URI}/${DATABASE_NAME}" --quiet --eval "
            const collections = db.getCollectionNames();
            const hasTeams = collections.includes('teams');
            const hasInvites = collections.includes('team_invites');
            print(JSON.stringify({hasTeams, hasInvites, collections: collections.length}));
        "`;
        
        const result = execSync(checkCommand, { encoding: 'utf8' });
        const verification = JSON.parse(result.trim());
        
        if (verification.hasTeams && verification.hasInvites) {
            success(`Team collaboration collections created (${verification.collections} total collections)`);
            return true;
        } else {
            error('Team collaboration collections not found');
            return false;
        }
    } catch (e) {
        error('Verification failed');
        console.error(e.message);
        return false;
    }
}

// Generate environment configuration
function generateEnvConfig() {
    log('⚙️ Generating environment configuration...');
    
    const envConfig = `
# MongoDB Configuration for Team Collaboration
MONGODB_URI=${MONGODB_URI}
MONGODB_DATABASE=${DATABASE_NAME}

# Add these to your .env file if not already present
`;
    
    const envPath = path.join(process.cwd(), '.env.database');
    fs.writeFileSync(envPath, envConfig.trim());
    
    info(`Environment configuration saved to: ${envPath}`);
    info('Copy these settings to your main .env file');
}

// Main setup function
async function main() {
    console.log('🚀 MongoDB Team Collaboration Setup');
    console.log('=====================================');
    console.log('');
    
    // Check MongoDB shell
    const mongoShell = checkMongoShell();
    if (!mongoShell) {
        error('MongoDB Shell not found');
        error('Please install MongoDB Shell from: https://www.mongodb.com/try/download/shell');
        process.exit(1);
    }
    
    if (mongoShell === 'legacy') {
        warning('Using legacy mongo shell. Consider upgrading to mongosh for better performance.');
    }
    
    info(`MongoDB URI: ${MONGODB_URI}`);
    info(`Database: ${DATABASE_NAME}`);
    console.log('');
    
    // Test connection
    if (!testConnection()) {
        process.exit(1);
    }
    
    console.log('');
    
    // Run setup
    if (!runSetupScript()) {
        process.exit(1);
    }
    
    console.log('');
    
    // Verify setup
    if (!verifySetup()) {
        process.exit(1);
    }
    
    console.log('');
    
    // Generate config
    generateEnvConfig();
    
    console.log('');
    log('🎉 Team Collaboration Database Setup Complete!', 'magenta');
    console.log('');
    console.log('📊 Next steps:');
    console.log('  1. Update your .env file with the MongoDB configuration');
    console.log('  2. Start your Spring Boot application');
    console.log('  3. Test team collaboration features');
    console.log('  4. Monitor database performance');
    console.log('');
    console.log('📚 Documentation:');
    console.log('  - Check scripts/setup-database-simple.md for manual setup');
    console.log('  - Review the generated .env.database file');
    console.log('  - Test with sample team creation in your application');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log('MongoDB Team Collaboration Setup Script');
    console.log('');
    console.log('Usage: node setup-database.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --help, -h    Show this help message');
    console.log('');
    console.log('Environment Variables:');
    console.log('  MONGODB_URI        MongoDB connection string (default: mongodb://localhost:27017)');
    console.log('  MONGODB_DATABASE   Database name (default: pebly)');
    console.log('');
    console.log('Examples:');
    console.log('  node setup-database.js');
    console.log('  MONGODB_URI="mongodb://user:pass@host:port" node setup-database.js');
    process.exit(0);
}

// Run main function
main().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
});