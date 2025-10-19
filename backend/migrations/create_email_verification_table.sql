-- Email Verification Tokens Table
-- Created: October 5, 2025
-- Purpose: Store email verification tokens for new user registrations

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  used_at TIMESTAMP
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_email_verification_token ON email_verification_tokens(token);

-- Index for cleanup queries (remove expired tokens)
CREATE INDEX IF NOT EXISTS idx_email_verification_expires ON email_verification_tokens(expires_at);

-- Add comments for documentation
COMMENT ON TABLE email_verification_tokens IS 'Stores email verification tokens sent to users';
COMMENT ON COLUMN email_verification_tokens.token IS 'Unique verification token (32-byte hex string)';
COMMENT ON COLUMN email_verification_tokens.expires_at IS 'Token expiration timestamp (24 hours from creation)';
COMMENT ON COLUMN email_verification_tokens.used IS 'Whether the token has been used for verification';
