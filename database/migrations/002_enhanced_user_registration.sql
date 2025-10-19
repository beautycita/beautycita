-- Migration: Enhanced user registration requirements
-- Date: 2025-01-20
-- Purpose: Add mandatory fields for comprehensive user registration with ToS agreement and phone verification

-- ===========================
-- 1. ENHANCE USERS TABLE
-- ===========================

-- Add date of birth (mandatory, not displayed in profile)
ALTER TABLE users ADD COLUMN date_of_birth DATE;

-- Add first and last name (split from existing name field)
ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN last_name VARCHAR(100);

-- Add phone verification status (already added in previous migration, ensure it exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;

-- Add terms of service acceptance tracking
ALTER TABLE users ADD COLUMN tos_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN tos_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN tos_version VARCHAR(20) DEFAULT '1.0';

-- Update role constraint to include ADMIN
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('CLIENT', 'STYLIST', 'ADMIN'));

-- ===========================
-- 2. ENHANCE STYLISTS TABLE
-- ===========================

-- Add salon phone number (optional, no verification required)
ALTER TABLE stylists ADD COLUMN salon_phone VARCHAR(20);

-- Add service description (different from personal bio)
ALTER TABLE stylists ADD COLUMN service_description TEXT;

-- Add profile picture requirement tracking
ALTER TABLE stylists ADD COLUMN profile_picture_required BOOLEAN DEFAULT TRUE;

-- Ensure location fields are properly set up for requirements
ALTER TABLE stylists ALTER COLUMN location_address SET NOT NULL;
ALTER TABLE stylists ALTER COLUMN location_city SET NOT NULL;

-- ===========================
-- 3. SERVICES TABLE ENHANCEMENTS
-- ===========================

-- Ensure services table has proper pricing and duration fields
-- (Check if these exist from previous schema)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'services' AND column_name = 'price_cents') THEN
        ALTER TABLE services ADD COLUMN price_cents INTEGER; -- Price in cents
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'services' AND column_name = 'duration_minutes') THEN
        ALTER TABLE services ADD COLUMN duration_minutes INTEGER; -- Duration in minutes
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'services' AND column_name = 'is_active') THEN
        ALTER TABLE services ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END
$$;

-- ===========================
-- 4. PREDEFINED SERVICE TYPES
-- ===========================

-- Create table for predefined service categories
CREATE TABLE IF NOT EXISTS service_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- emoji or icon name
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard beauty service categories
INSERT INTO service_categories (name, description, icon, sort_order) VALUES
('Hair Cutting', 'Haircuts, trims, and styling', '✂️', 1),
('Hair Coloring', 'Hair dyeing, highlights, balayage', '🎨', 2),
('Hair Styling', 'Blowouts, updos, special occasion styling', '💇‍♀️', 3),
('Nail Services', 'Manicures, pedicures, nail art', '💅', 4),
('Makeup', 'Makeup application, special events', '💄', 5),
('Skincare', 'Facials, skin treatments', '✨', 6),
('Eyebrows & Lashes', 'Brow shaping, lash extensions', '👁️', 7),
('Hair Extensions', 'Hair extension installation and maintenance', '💁‍♀️', 8),
('Bridal Services', 'Wedding hair and makeup', '👰', 9),
('Men\'s Grooming', 'Haircuts and grooming for men', '🧔', 10)
ON CONFLICT (name) DO NOTHING;

-- ===========================
-- 5. USER ONBOARDING TRACKING
-- ===========================

-- Track registration completion status
CREATE TABLE user_onboarding_status (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    basic_info_completed BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    tos_accepted BOOLEAN DEFAULT FALSE,
    role_specific_completed BOOLEAN DEFAULT FALSE,
    profile_completed BOOLEAN DEFAULT FALSE,
    registration_step INTEGER DEFAULT 1, -- Current step (1-5)
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- ===========================
-- 6. ADMIN USER ENHANCEMENTS
-- ===========================

-- Admin-specific profile information
CREATE TABLE admin_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(100),
    permissions JSON, -- {"manage_users": true, "manage_bookings": true, etc.}
    access_level VARCHAR(20) CHECK (access_level IN ('SUPER_ADMIN', 'ADMIN', 'MODERATOR')) DEFAULT 'ADMIN',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- ===========================
-- 7. INDEXES FOR PERFORMANCE
-- ===========================

-- Index on phone verification for quick lookups
CREATE INDEX IF NOT EXISTS idx_users_phone_verified ON users(phone_verified);

-- Index on ToS acceptance for compliance tracking
CREATE INDEX IF NOT EXISTS idx_users_tos_accepted ON users(tos_accepted, tos_accepted_at);

-- Index on registration completion
CREATE INDEX IF NOT EXISTS idx_onboarding_completion ON user_onboarding_status(user_id, registration_step);

-- Index on service categories
CREATE INDEX IF NOT EXISTS idx_service_categories_active ON service_categories(is_active, sort_order);

-- ===========================
-- 8. TRIGGERS
-- ===========================

-- Auto-create onboarding status for new users
CREATE OR REPLACE FUNCTION create_user_onboarding_status()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_onboarding_status (user_id, phone_verified, tos_accepted)
    VALUES (NEW.id, NEW.phone_verified, NEW.tos_accepted);

    -- Create role-specific profile if needed
    IF NEW.role = 'ADMIN' THEN
        INSERT INTO admin_profiles (user_id) VALUES (NEW.id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user onboarding
DROP TRIGGER IF EXISTS user_onboarding_trigger ON users;
CREATE TRIGGER user_onboarding_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_onboarding_status();

-- Trigger to update onboarding status when user fields change
CREATE OR REPLACE FUNCTION update_onboarding_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update onboarding status based on user changes
    UPDATE user_onboarding_status
    SET
        phone_verified = NEW.phone_verified,
        tos_accepted = NEW.tos_accepted,
        basic_info_completed = (
            NEW.first_name IS NOT NULL AND
            NEW.last_name IS NOT NULL AND
            NEW.date_of_birth IS NOT NULL AND
            NEW.email IS NOT NULL
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_onboarding_trigger ON users;
CREATE TRIGGER update_onboarding_trigger
    AFTER UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_onboarding_status();

-- ===========================
-- 9. DATA MIGRATION
-- ===========================

-- Split existing name field into first_name and last_name
UPDATE users
SET
    first_name = TRIM(SPLIT_PART(name, ' ', 1)),
    last_name = CASE
        WHEN POSITION(' ' IN name) > 0 THEN
            TRIM(SUBSTRING(name FROM POSITION(' ' IN name) + 1))
        ELSE ''
    END
WHERE first_name IS NULL AND name IS NOT NULL;

-- Set default values for existing users
UPDATE users
SET
    tos_accepted = TRUE,
    tos_accepted_at = created_at,
    tos_version = '1.0'
WHERE tos_accepted IS NULL OR tos_accepted = FALSE;

-- ===========================
-- 10. CONSTRAINTS
-- ===========================

-- Make essential fields required for new registrations
-- (Don't break existing data, but ensure new registrations have these)
ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE users ALTER COLUMN last_name SET NOT NULL;
ALTER TABLE users ALTER COLUMN tos_accepted SET NOT NULL;

-- ===========================
-- RECORD MIGRATION
-- ===========================

-- Log migration completion
INSERT INTO schema_migrations (version, applied_at)
VALUES ('002_enhanced_user_registration', CURRENT_TIMESTAMP)
ON CONFLICT (version) DO NOTHING;