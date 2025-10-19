#!/usr/bin/env node

/**
 * Environment Variable Encryption Utility
 * Encrypts sensitive environment variables for secure storage
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const SALT_LENGTH = 32;

class SecureEnvManager {
    constructor() {
        this.masterKeyFile = '/var/www/beautycita.com/.master.key';
        this.encryptedEnvFile = '/var/www/beautycita.com/.env.encrypted';
        this.originalEnvFile = '/var/www/beautycita.com/.env';
    }

    // Generate or load master key
    async getMasterKey() {
        if (fs.existsSync(this.masterKeyFile)) {
            return fs.readFileSync(this.masterKeyFile, 'utf8').trim();
        } else {
            const masterKey = crypto.randomBytes(32).toString('hex');
            fs.writeFileSync(this.masterKeyFile, masterKey, { mode: 0o600 });
            console.log(`✅ Generated new master key: ${this.masterKeyFile}`);
            return masterKey;
        }
    }

    // Derive encryption key from master key
    deriveKey(masterKey, salt) {
        return crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha512');
    }

    // Encrypt environment file
    async encrypt() {
        if (!fs.existsSync(this.originalEnvFile)) {
            throw new Error(`Environment file not found: ${this.originalEnvFile}`);
        }

        const envContent = fs.readFileSync(this.originalEnvFile, 'utf8');
        const masterKey = await this.getMasterKey();

        // Generate random salt and IV
        const salt = crypto.randomBytes(SALT_LENGTH);
        const iv = crypto.randomBytes(IV_LENGTH);

        // Derive encryption key
        const key = this.deriveKey(masterKey, salt);

        // Encrypt the content
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        cipher.setAAD(Buffer.from('beautycita-env-v1'));

        let encrypted = cipher.update(envContent, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        // Combine salt, iv, authTag, and encrypted content
        const combined = {
            version: '1.0',
            algorithm: ALGORITHM,
            salt: salt.toString('hex'),
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            data: encrypted,
            timestamp: new Date().toISOString()
        };

        fs.writeFileSync(this.encryptedEnvFile, JSON.stringify(combined, null, 2), { mode: 0o600 });
        console.log(`✅ Environment variables encrypted: ${this.encryptedEnvFile}`);

        return true;
    }

    // Decrypt environment file
    async decrypt() {
        if (!fs.existsSync(this.encryptedEnvFile)) {
            throw new Error(`Encrypted environment file not found: ${this.encryptedEnvFile}`);
        }

        const encrypted = JSON.parse(fs.readFileSync(this.encryptedEnvFile, 'utf8'));
        const masterKey = await this.getMasterKey();

        // Derive decryption key
        const salt = Buffer.from(encrypted.salt, 'hex');
        const key = this.deriveKey(masterKey, salt);

        // Prepare decryption
        const iv = Buffer.from(encrypted.iv, 'hex');
        const authTag = Buffer.from(encrypted.authTag, 'hex');

        // Decrypt the content
        const decipher = crypto.createDecipheriv(encrypted.algorithm, key, iv);
        decipher.setAAD(Buffer.from('beautycita-env-v1'));
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    // Generate production-safe environment file (removes sensitive values)
    async generateProductionEnv() {
        const envContent = fs.readFileSync(this.originalEnvFile, 'utf8');
        const lines = envContent.split('\n');

        const sensitiveKeys = [
            'DB_PASSWORD', 'JWT_SECRET', 'SESSION_SECRET',
            'GOOGLE_CLIENT_SECRET', 'STRIPE_SECRET_KEY',
            'TWILIO_AUTH_TOKEN', 'OPENAI_API_KEY'
        ];

        const productionLines = lines.map(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('#') || !trimmedLine.includes('=')) {
                return line;
            }

            const [key] = trimmedLine.split('=');
            if (sensitiveKeys.some(sensitiveKey => key.includes(sensitiveKey))) {
                return `${key}=__ENCRYPTED__`;
            }

            return line;
        });

        const productionEnvFile = '/var/www/beautycita.com/.env.production';
        fs.writeFileSync(productionEnvFile, productionLines.join('\n'), { mode: 0o644 });
        console.log(`✅ Production environment file created: ${productionEnvFile}`);
    }
}

// Runtime environment loader
function createSecureLoader() {
    const loaderScript = `
const crypto = require('crypto');
const fs = require('fs');

class SecureEnvLoader {
    constructor() {
        this.masterKeyFile = '/var/www/beautycita.com/.master.key';
        this.encryptedEnvFile = '/var/www/beautycita.com/.env.encrypted';
    }

    deriveKey(masterKey, salt) {
        return crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha512');
    }

    loadSecureEnv() {
        try {
            if (!fs.existsSync(this.encryptedEnvFile)) {
                console.warn('⚠️  No encrypted environment found, falling back to .env');
                require('dotenv').config();
                return;
            }

            const masterKey = fs.readFileSync(this.masterKeyFile, 'utf8').trim();
            const encrypted = JSON.parse(fs.readFileSync(this.encryptedEnvFile, 'utf8'));

            const salt = Buffer.from(encrypted.salt, 'hex');
            const key = this.deriveKey(masterKey, salt);
            const iv = Buffer.from(encrypted.iv, 'hex');
            const authTag = Buffer.from(encrypted.authTag, 'hex');

            const decipher = crypto.createDecipheriv(encrypted.algorithm, key, iv);
            decipher.setAAD(Buffer.from('beautycita-env-v1'));
            decipher.setAuthTag(authTag);

            let decrypted = decipher.update(encrypted.data, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            // Parse and load environment variables
            decrypted.split('\\n').forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=')) {
                    const [key, ...values] = trimmedLine.split('=');
                    process.env[key] = values.join('=');
                }
            });

            console.log('✅ Secure environment variables loaded');
        } catch (error) {
            console.error('❌ Failed to load secure environment:', error.message);
            console.log('Falling back to standard .env file');
            require('dotenv').config();
        }
    }
}

module.exports = new SecureEnvLoader();
`;

    fs.writeFileSync('/var/www/beautycita.com/secure-env-loader.js', loaderScript, { mode: 0o644 });
    console.log('✅ Secure environment loader created');
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    const manager = new SecureEnvManager();

    try {
        switch (command) {
            case 'encrypt':
                await manager.encrypt();
                await manager.generateProductionEnv();
                createSecureLoader();
                console.log('\n🔐 Environment encryption complete!');
                console.log('💡 Next steps:');
                console.log('1. Update your application to use secure-env-loader.js');
                console.log('2. Secure the .master.key file (chmod 600)');
                console.log('3. Add .env.encrypted and .master.key to .gitignore');
                console.log('4. Backup the master key securely');
                break;

            case 'decrypt':
                const decrypted = await manager.decrypt();
                console.log(decrypted);
                break;

            case 'generate-prod':
                await manager.generateProductionEnv();
                break;

            default:
                console.log('Usage: node encrypt-env.js [encrypt|decrypt|generate-prod]');
                console.log('  encrypt      - Encrypt the .env file');
                console.log('  decrypt      - Decrypt and display environment variables');
                console.log('  generate-prod - Generate production-safe .env file');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = SecureEnvManager;