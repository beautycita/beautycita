-- Migration: Add Stylist Onboarding System
-- Description: Adds onboarding statuses, checklist table, and fields for streamlined stylist signup
-- Date: 2025-10-04

-- ============================================================================
-- 1. Add new user statuses for onboarding flow
-- ============================================================================

-- Drop the old CHECK constraint if it exists
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_status_check;

-- Add new CHECK constraint with additional statuses
ALTER TABLE users ADD CONSTRAINT users_user_status_check
    CHECK (user_status::text = ANY (ARRAY[
        'APPROVED'::character varying::text,
        'SUSPENDED'::character varying::text,
        'BLOCKED'::character varying::text,
        'PENDING'::character varying::text,
        'PENDING_ONBOARDING'::character varying::text,
        'PENDING_VERIFICATION'::character varying::text,
        'PENDING_APPROVAL'::character varying::text
    ]));

-- ============================================================================
-- 2. Add onboarding tracking fields to stylists table
-- ============================================================================

-- Add onboarding progress tracking
ALTER TABLE stylists
ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS onboarding_submitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_onboarding_update TIMESTAMP DEFAULT NOW();

-- Add payment verification fields
ALTER TABLE stylists
ADD COLUMN IF NOT EXISTS btcpay_store_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS btcpay_wallet_configured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS btcpay_wallet_verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS payment_setup_completed BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- 3. Create stylist_approval_checklist table
-- ============================================================================

CREATE TABLE IF NOT EXISTS stylist_approval_checklist (
    id SERIAL PRIMARY KEY,
    stylist_id INT NOT NULL REFERENCES stylists(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Profile completion checks
    profile_completed BOOLEAN DEFAULT FALSE,
    bio_completed BOOLEAN DEFAULT FALSE,
    specialties_added BOOLEAN DEFAULT FALSE,
    experience_set BOOLEAN DEFAULT FALSE,

    -- Location checks
    location_verified BOOLEAN DEFAULT FALSE,
    service_area_set BOOLEAN DEFAULT FALSE,

    -- Services checks
    minimum_services_added BOOLEAN DEFAULT FALSE, -- At least 3 services
    pricing_configured BOOLEAN DEFAULT FALSE,

    -- Portfolio checks
    portfolio_uploaded BOOLEAN DEFAULT FALSE, -- At least 3 images
    instagram_connected BOOLEAN DEFAULT FALSE,

    -- Payment system checks
    stripe_connected BOOLEAN DEFAULT FALSE,
    stripe_verified BOOLEAN DEFAULT FALSE,
    stripe_verification_date TIMESTAMP,
    bitcoin_configured BOOLEAN DEFAULT FALSE,
    bitcoin_verified BOOLEAN DEFAULT FALSE,
    bitcoin_verification_date TIMESTAMP,

    -- Computed approval readiness
    ready_for_approval BOOLEAN GENERATED ALWAYS AS (
        profile_completed AND
        location_verified AND
        minimum_services_added AND
        pricing_configured AND
        portfolio_uploaded AND
        stripe_verified AND
        bitcoin_verified
    ) STORED,

    -- Admin approval
    admin_approved BOOLEAN DEFAULT FALSE,
    admin_approved_by INT REFERENCES users(id),
    admin_approved_at TIMESTAMP,
    admin_notes TEXT,

    -- Rejection tracking
    rejection_count INT DEFAULT 0,
    last_rejection_reason TEXT,
    last_rejection_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_stylist_checklist UNIQUE (stylist_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_checklist_stylist_id ON stylist_approval_checklist(stylist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_user_id ON stylist_approval_checklist(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_ready_for_approval ON stylist_approval_checklist(ready_for_approval) WHERE ready_for_approval = TRUE;
CREATE INDEX IF NOT EXISTS idx_checklist_admin_approved ON stylist_approval_checklist(admin_approved);

-- ============================================================================
-- 4. Create onboarding_progress table for wizard state
-- ============================================================================

CREATE TABLE IF NOT EXISTS onboarding_progress (
    id SERIAL PRIMARY KEY,
    stylist_id INT NOT NULL REFERENCES stylists(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Current step (0-5: 0=not started, 1-5=wizard steps)
    current_step INT DEFAULT 0,

    -- Step completion tracking
    step1_professional_identity JSONB DEFAULT '{}',
    step1_completed BOOLEAN DEFAULT FALSE,
    step1_completed_at TIMESTAMP,

    step2_location JSONB DEFAULT '{}',
    step2_completed BOOLEAN DEFAULT FALSE,
    step2_completed_at TIMESTAMP,

    step3_services JSONB DEFAULT '{}',
    step3_completed BOOLEAN DEFAULT FALSE,
    step3_completed_at TIMESTAMP,

    step4_portfolio JSONB DEFAULT '{}',
    step4_completed BOOLEAN DEFAULT FALSE,
    step4_completed_at TIMESTAMP,

    step5_payments JSONB DEFAULT '{}',
    step5_completed BOOLEAN DEFAULT FALSE,
    step5_completed_at TIMESTAMP,

    -- Overall progress
    total_progress_percent INT GENERATED ALWAYS AS (
        (
            CASE WHEN step1_completed THEN 20 ELSE 0 END +
            CASE WHEN step2_completed THEN 20 ELSE 0 END +
            CASE WHEN step3_completed THEN 20 ELSE 0 END +
            CASE WHEN step4_completed THEN 20 ELSE 0 END +
            CASE WHEN step5_completed THEN 20 ELSE 0 END
        )
    ) STORED,

    all_steps_completed BOOLEAN GENERATED ALWAYS AS (
        step1_completed AND step2_completed AND step3_completed AND
        step4_completed AND step5_completed
    ) STORED,

    -- Aphrodite AI assistance tracking
    ai_assistance_used BOOLEAN DEFAULT FALSE,
    ai_suggestions_accepted INT DEFAULT 0,
    ai_bio_generated BOOLEAN DEFAULT FALSE,
    ai_pricing_suggested BOOLEAN DEFAULT FALSE,

    -- Timestamps
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT unique_stylist_onboarding UNIQUE (stylist_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_stylist_id ON onboarding_progress(stylist_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_user_id ON onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_current_step ON onboarding_progress(current_step);
CREATE INDEX IF NOT EXISTS idx_onboarding_all_completed ON onboarding_progress(all_steps_completed) WHERE all_steps_completed = TRUE;

-- ============================================================================
-- 5. Create trigger to auto-update checklist when onboarding progresses
-- ============================================================================

CREATE OR REPLACE FUNCTION update_onboarding_checklist()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the approval checklist based on onboarding progress
    UPDATE stylist_approval_checklist
    SET
        profile_completed = (
            NEW.step1_completed = TRUE AND
            (NEW.step1_professional_identity->>'bio' IS NOT NULL) AND
            (NEW.step1_professional_identity->>'specialties' IS NOT NULL)
        ),
        location_verified = NEW.step2_completed,
        minimum_services_added = (
            NEW.step3_completed = TRUE AND
            (NEW.step3_services->>'service_count')::INT >= 3
        ),
        pricing_configured = NEW.step3_completed,
        portfolio_uploaded = (
            NEW.step4_completed = TRUE AND
            (NEW.step4_portfolio->>'image_count')::INT >= 3
        ),
        updated_at = NOW()
    WHERE stylist_id = NEW.stylist_id;

    -- If checklist doesn't exist, create it
    IF NOT FOUND THEN
        INSERT INTO stylist_approval_checklist (stylist_id, user_id)
        VALUES (NEW.stylist_id, NEW.user_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_onboarding_checklist ON onboarding_progress;
CREATE TRIGGER trigger_update_onboarding_checklist
    AFTER INSERT OR UPDATE ON onboarding_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_onboarding_checklist();

-- ============================================================================
-- 6. Create function to auto-create onboarding records for new stylists
-- ============================================================================

CREATE OR REPLACE FUNCTION create_stylist_onboarding_records()
RETURNS TRIGGER AS $$
BEGIN
    -- Create onboarding progress record
    INSERT INTO onboarding_progress (stylist_id, user_id, started_at)
    VALUES (NEW.id, NEW.user_id, NOW())
    ON CONFLICT (stylist_id) DO NOTHING;

    -- Create approval checklist record
    INSERT INTO stylist_approval_checklist (stylist_id, user_id)
    VALUES (NEW.id, NEW.user_id)
    ON CONFLICT (stylist_id) DO NOTHING;

    -- Update stylist onboarding timestamps
    UPDATE stylists
    SET
        onboarding_started_at = NOW(),
        last_onboarding_update = NOW()
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new stylists
DROP TRIGGER IF EXISTS trigger_create_stylist_onboarding ON stylists;
CREATE TRIGGER trigger_create_stylist_onboarding
    AFTER INSERT ON stylists
    FOR EACH ROW
    EXECUTE FUNCTION create_stylist_onboarding_records();

-- ============================================================================
-- 7. Create view for easy onboarding status querying
-- ============================================================================

CREATE OR REPLACE VIEW stylist_onboarding_status AS
SELECT
    s.id as stylist_id,
    u.id as user_id,
    u.name,
    u.email,
    u.phone,
    u.user_status,
    s.business_name,

    -- Onboarding progress
    op.current_step,
    op.total_progress_percent,
    op.all_steps_completed as wizard_completed,
    op.started_at as onboarding_started,
    op.completed_at as wizard_completed_at,

    -- Approval checklist
    ac.ready_for_approval,
    ac.admin_approved,
    ac.admin_approved_at,
    ac.admin_approved_by,

    -- Individual checks
    ac.profile_completed,
    ac.location_verified,
    ac.minimum_services_added,
    ac.portfolio_uploaded,
    ac.stripe_verified,
    ac.bitcoin_verified,

    -- Payment status
    s.stripe_account_id,
    s.stripe_account_status,
    s.btcpay_store_id,
    s.btcpay_wallet_configured,

    -- Timestamps
    s.created_at,
    s.updated_at,
    ac.updated_at as checklist_updated_at

FROM stylists s
JOIN users u ON s.user_id = u.id
LEFT JOIN onboarding_progress op ON s.id = op.stylist_id
LEFT JOIN stylist_approval_checklist ac ON s.id = ac.stylist_id
WHERE u.role = 'STYLIST';

-- ============================================================================
-- 8. Migrate existing stylists to new system
-- ============================================================================

-- Set existing approved stylists to APPROVED status
UPDATE users
SET user_status = 'APPROVED'
WHERE role = 'STYLIST'
  AND is_active = TRUE
  AND (user_status IS NULL OR user_status NOT IN ('APPROVED', 'SUSPENDED', 'BLOCKED'));

-- Create onboarding records for existing stylists
INSERT INTO onboarding_progress (
    stylist_id,
    user_id,
    current_step,
    step1_completed,
    step2_completed,
    step3_completed,
    step4_completed,
    step5_completed,
    step1_completed_at,
    step2_completed_at,
    step3_completed_at,
    step4_completed_at,
    step5_completed_at,
    started_at,
    completed_at
)
SELECT
    s.id,
    s.user_id,
    5, -- All steps completed for existing stylists
    TRUE, TRUE, TRUE, TRUE, TRUE, -- All steps completed
    s.created_at, s.created_at, s.created_at, s.created_at, s.created_at, -- Completion dates
    s.created_at,
    s.created_at
FROM stylists s
ON CONFLICT (stylist_id) DO NOTHING;

-- Create approval checklists for existing approved stylists
INSERT INTO stylist_approval_checklist (
    stylist_id,
    user_id,
    profile_completed,
    location_verified,
    minimum_services_added,
    portfolio_uploaded,
    stripe_verified,
    bitcoin_verified,
    admin_approved,
    admin_approved_at
)
SELECT
    s.id,
    s.user_id,
    TRUE, -- Assume existing stylists have complete profiles
    (s.location_city IS NOT NULL AND s.location_city != 'TBD'),
    TRUE, -- Assume they have services
    TRUE, -- Assume they have portfolio
    (s.stripe_account_id IS NOT NULL), -- Stripe verified if account exists
    FALSE, -- Bitcoin not yet configured for existing stylists
    TRUE, -- Existing active stylists are approved
    s.created_at
FROM stylists s
JOIN users u ON s.user_id = u.id
WHERE u.role = 'STYLIST' AND u.is_active = TRUE
ON CONFLICT (stylist_id) DO NOTHING;

-- ============================================================================
-- 9. Add comments for documentation
-- ============================================================================

COMMENT ON TABLE stylist_approval_checklist IS 'Tracks approval requirements for stylists including payment verification';
COMMENT ON TABLE onboarding_progress IS 'Stores wizard progress and step data for stylist onboarding';
COMMENT ON COLUMN onboarding_progress.step1_professional_identity IS 'JSONB data from Step 1: business name, bio, specialties, experience';
COMMENT ON COLUMN onboarding_progress.step2_location IS 'JSONB data from Step 2: address, service area, coordinates';
COMMENT ON COLUMN onboarding_progress.step3_services IS 'JSONB data from Step 3: services, pricing, duration';
COMMENT ON COLUMN onboarding_progress.step4_portfolio IS 'JSONB data from Step 4: portfolio images, social links, certifications';
COMMENT ON COLUMN onboarding_progress.step5_payments IS 'JSONB data from Step 5: Stripe and Bitcoin setup status';

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Next steps:
-- 1. Run this migration: psql -U postgres -h localhost -d beautycita -f add_stylist_onboarding_system.sql
-- 2. Verify tables created: \dt stylist_approval_checklist onboarding_progress
-- 3. Check view: SELECT * FROM stylist_onboarding_status LIMIT 5;
