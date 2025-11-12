-- ============================================================================
-- Migration: Add Google One Tap Support and Client Onboarding Fields
-- Date: 2025-01-11
-- Description: Adds columns needed for Google One Tap authentication and
--              optimized client onboarding experience
-- ============================================================================

BEGIN;

-- Add onboarding completion tracking to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP;

-- Add location fields to clients table (for client onboarding)
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS location_city VARCHAR(255),
ADD COLUMN IF NOT EXISTS location_state VARCHAR(10),
ADD COLUMN IF NOT EXISTS location_zip VARCHAR(10),
ADD COLUMN IF NOT EXISTS service_preferences JSONB DEFAULT '[]'::jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_onboarding_completed
  ON users(onboarding_completed)
  WHERE onboarding_completed = FALSE;

CREATE INDEX IF NOT EXISTS idx_clients_location
  ON clients(location_city, location_state, location_zip)
  WHERE location_city IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_service_preferences
  ON clients USING GIN(service_preferences)
  WHERE service_preferences IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.onboarding_completed IS 'Tracks if user completed onboarding wizard';
COMMENT ON COLUMN users.onboarding_completed_at IS 'Timestamp when onboarding was completed';
COMMENT ON COLUMN clients.location_city IS 'Client location city for stylist matching';
COMMENT ON COLUMN clients.location_state IS 'Client location state (2-letter code)';
COMMENT ON COLUMN clients.location_zip IS 'Client location ZIP code (5 digits)';
COMMENT ON COLUMN clients.service_preferences IS 'JSON array of service IDs client is interested in';

-- Update existing Google OAuth users to have onboarding_completed = true if they're active
-- (Existing users don't need to go through new onboarding)
UPDATE users
SET onboarding_completed = TRUE,
    onboarding_completed_at = created_at
WHERE provider = 'google'
  AND is_active = TRUE
  AND onboarding_completed IS FALSE;

-- Summary report
DO $$
DECLARE
  total_users INTEGER;
  google_users INTEGER;
  clients_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM users;
  SELECT COUNT(*) INTO google_users FROM users WHERE provider = 'google';
  SELECT COUNT(*) INTO clients_count FROM clients;

  RAISE NOTICE '============================================';
  RAISE NOTICE 'Migration Complete: Google One Tap + Client Onboarding';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total users: %', total_users;
  RAISE NOTICE 'Google OAuth users: %', google_users;
  RAISE NOTICE 'Total clients: %', clients_count;
  RAISE NOTICE '';
  RAISE NOTICE 'New columns added:';
  RAISE NOTICE '  - users.onboarding_completed';
  RAISE NOTICE '  - users.onboarding_completed_at';
  RAISE NOTICE '  - clients.location_city';
  RAISE NOTICE '  - clients.location_state';
  RAISE NOTICE '  - clients.location_zip';
  RAISE NOTICE '  - clients.service_preferences';
  RAISE NOTICE '';
  RAISE NOTICE 'Indexes created for performance';
  RAISE NOTICE '============================================';
END $$;

COMMIT;

-- ============================================================================
-- Rollback Script (if needed)
-- ============================================================================
-- BEGIN;
-- DROP INDEX IF EXISTS idx_users_onboarding_completed;
-- DROP INDEX IF EXISTS idx_clients_location;
-- DROP INDEX IF EXISTS idx_clients_service_preferences;
-- ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed;
-- ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed_at;
-- ALTER TABLE clients DROP COLUMN IF EXISTS location_city;
-- ALTER TABLE clients DROP COLUMN IF EXISTS location_state;
-- ALTER TABLE clients DROP COLUMN IF EXISTS location_zip;
-- ALTER TABLE clients DROP COLUMN IF EXISTS service_preferences;
-- COMMIT;
