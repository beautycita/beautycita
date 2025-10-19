-- Migration: Add WebAuthn/FIDO2 Support for Passwordless Authentication
-- Description: Creates tables for storing WebAuthn credentials and challenges
-- Author: Claude Code
-- Date: 2025-10-03

-- ============================================================================
-- 1. WebAuthn Credentials Table
-- ============================================================================
-- Stores public keys and metadata for each registered passkey/authenticator

CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Credential identification (from WebAuthn spec)
  credential_id TEXT NOT NULL UNIQUE,        -- Base64URL encoded credential ID
  public_key TEXT NOT NULL,                   -- Base64URL encoded public key

  -- Security and replay protection
  counter BIGINT NOT NULL DEFAULT 0,          -- Signature counter (prevents cloned credentials)

  -- Device information
  aaguid TEXT,                                 -- Authenticator Attestation GUID
  device_name VARCHAR(255),                    -- User-friendly name (e.g., "iPhone 14 Pro")
  transports TEXT[],                           -- Supported transports: ['usb', 'nfc', 'ble', 'internal']

  -- Attestation information
  attestation_format VARCHAR(50),              -- 'packed', 'fido-u2f', 'android-key', etc.
  attested_credential_data TEXT,               -- Full attestation data

  -- Usage tracking
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Ensure each credential_id is unique globally
  UNIQUE(credential_id),

  -- Ensure user can't register same credential twice
  UNIQUE(user_id, credential_id)
);

-- Indexes for performance
CREATE INDEX idx_webauthn_user_id ON webauthn_credentials(user_id);
CREATE INDEX idx_webauthn_credential_id ON webauthn_credentials(credential_id);
CREATE INDEX idx_webauthn_last_used ON webauthn_credentials(last_used_at DESC);

-- Auto-update timestamp trigger
CREATE TRIGGER update_webauthn_credentials_updated_at
  BEFORE UPDATE ON webauthn_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE webauthn_credentials IS 'Stores WebAuthn/FIDO2 credentials (passkeys) for passwordless authentication';
COMMENT ON COLUMN webauthn_credentials.credential_id IS 'Unique identifier for the credential (from navigator.credentials.create)';
COMMENT ON COLUMN webauthn_credentials.public_key IS 'Public key for verifying authentication assertions';
COMMENT ON COLUMN webauthn_credentials.counter IS 'Signature counter to detect cloned credentials (security)';
COMMENT ON COLUMN webauthn_credentials.device_name IS 'User-friendly device name for credential management';

-- ============================================================================
-- 2. WebAuthn Challenges Table
-- ============================================================================
-- Temporary storage for WebAuthn challenges (registration and authentication)
-- Challenges are single-use and expire after 5 minutes

CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,  -- NULL for new user registration

  -- Challenge data
  challenge TEXT NOT NULL,                     -- Random challenge (base64url encoded)
  type VARCHAR(20) NOT NULL,                   -- 'registration' or 'authentication'

  -- Session tracking
  phone VARCHAR(20),                           -- Phone number for this challenge (optional)
  session_id TEXT,                             -- Optional session identifier

  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Constraint: type must be valid
  CONSTRAINT webauthn_challenges_type_check
    CHECK (type IN ('registration', 'authentication'))
);

-- Indexes
CREATE INDEX idx_webauthn_challenges_user_id ON webauthn_challenges(user_id);
CREATE INDEX idx_webauthn_challenges_challenge ON webauthn_challenges(challenge);
CREATE INDEX idx_webauthn_challenges_phone ON webauthn_challenges(phone);
CREATE INDEX idx_webauthn_challenges_expires ON webauthn_challenges(expires_at);

COMMENT ON TABLE webauthn_challenges IS 'Temporary storage for WebAuthn challenges (expires after 5 minutes)';
COMMENT ON COLUMN webauthn_challenges.challenge IS 'Cryptographically random challenge for this authentication attempt';
COMMENT ON COLUMN webauthn_challenges.type IS 'registration (new passkey) or authentication (login)';
COMMENT ON COLUMN webauthn_challenges.phone IS 'Phone number associated with this challenge';

-- ============================================================================
-- 3. Update Users Table Provider Constraint
-- ============================================================================
-- Allow 'webauthn' as a valid authentication provider

-- Drop old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_provider_check;

-- Add new constraint with webauthn support
ALTER TABLE users ADD CONSTRAINT users_provider_check
  CHECK (provider IN ('local', 'google', 'webauthn'));

COMMENT ON CONSTRAINT users_provider_check ON users IS 'Authentication providers: local (password), google (OAuth), webauthn (passkey)';

-- ============================================================================
-- 4. Challenge Cleanup Function
-- ============================================================================
-- Automatically delete expired challenges to keep table clean

CREATE OR REPLACE FUNCTION cleanup_expired_webauthn_challenges()
RETURNS void AS $$
BEGIN
  DELETE FROM webauthn_challenges
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_webauthn_challenges() IS 'Deletes expired WebAuthn challenges (run periodically)';

-- ============================================================================
-- 5. Verification Functions
-- ============================================================================

-- Check if user has any WebAuthn credentials
CREATE OR REPLACE FUNCTION user_has_webauthn_credentials(p_user_id INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM webauthn_credentials
    WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Get user's credential count
CREATE OR REPLACE FUNCTION get_user_credential_count(p_user_id INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM webauthn_credentials
    WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. Sample Queries (Documentation)
-- ============================================================================

-- Get user's credentials:
-- SELECT * FROM webauthn_credentials WHERE user_id = 123;

-- Create challenge for authentication:
-- INSERT INTO webauthn_challenges (user_id, challenge, type, expires_at)
-- VALUES (123, 'random_challenge_here', 'authentication', NOW() + INTERVAL '5 minutes')
-- RETURNING *;

-- Verify and consume challenge:
-- DELETE FROM webauthn_challenges
-- WHERE challenge = 'challenge_from_client' AND expires_at > NOW()
-- RETURNING *;

-- Update credential counter after successful auth:
-- UPDATE webauthn_credentials
-- SET counter = counter + 1, last_used_at = NOW()
-- WHERE credential_id = 'credential_id_here';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON webauthn_credentials TO beautycita_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON webauthn_challenges TO beautycita_app;
GRANT USAGE, SELECT ON SEQUENCE webauthn_credentials_id_seq TO beautycita_app;
GRANT USAGE, SELECT ON SEQUENCE webauthn_challenges_id_seq TO beautycita_app;

SELECT 'WebAuthn tables created successfully!' AS status;
