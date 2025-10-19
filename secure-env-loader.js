
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
                require('dotenv').config({ path: '/var/www/beautycita.com/.env' });
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
            decrypted.split('\n').forEach(line => {
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
            require('dotenv').config({ path: '/var/www/beautycita.com/.env' });
        }
    }
}

module.exports = new SecureEnvLoader();
