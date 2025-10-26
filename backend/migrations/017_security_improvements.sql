-- Security Improvements Migration
-- Device linking, login history, and biometric enhancements

-- Device link tokens table
CREATE TABLE IF NOT EXISTS device_link_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device_link_token (token),
    INDEX idx_device_link_user (user_id)
);

-- Login history table  
CREATE TABLE IF NOT EXISTS login_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    device VARCHAR(100),
    location VARCHAR(200),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_login_history_user (user_id),
    INDEX idx_login_history_created (created_at)
);

-- Update webauthn_credentials table if it exists
DO $$ 
BEGIN
    -- Add last_used column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='webauthn_credentials' AND column_name='last_used'
    ) THEN
        ALTER TABLE webauthn_credentials ADD COLUMN last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Add device_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='webauthn_credentials' AND column_name='device_type'
    ) THEN
        ALTER TABLE webauthn_credentials ADD COLUMN device_type VARCHAR(100);
    END IF;
END $$;

-- Update users table to ensure email_verified column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Function to clean up expired device link tokens
CREATE OR REPLACE FUNCTION cleanup_expired_device_links() RETURNS void AS $func$
BEGIN
    DELETE FROM device_link_tokens 
    WHERE expires_at < NOW() OR used = TRUE;
END;
$func$ LANGUAGE plpgsql;

-- Create trigger to update last_used on webauthn credentials
CREATE OR REPLACE FUNCTION update_credential_last_used()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_used = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webauthn_credentials') THEN
        DROP TRIGGER IF EXISTS trigger_update_credential_last_used ON webauthn_credentials;
        CREATE TRIGGER trigger_update_credential_last_used
            BEFORE UPDATE ON webauthn_credentials
            FOR EACH ROW
            EXECUTE FUNCTION update_credential_last_used();
    END IF;
END $$;

COMMENT ON TABLE device_link_tokens IS 'Temporary tokens for linking biometric devices across platforms';
COMMENT ON TABLE login_history IS 'Tracks user login activity for security monitoring';
COMMENT ON FUNCTION cleanup_expired_device_links() IS 'Removes expired or used device link tokens';
