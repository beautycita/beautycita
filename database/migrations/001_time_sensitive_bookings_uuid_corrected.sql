-- Migration: Time-sensitive bookings for UUID-based schema
-- Date: 2025-09-19
-- Purpose: Add time-sensitive booking workflow, SMS notifications, and location features

-- ===========================
-- 1. ENHANCE EXISTING TABLES
-- ===========================

-- Update users table (phone already exists, add verification fields)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;

-- Enhance bookings table with time-sensitive workflow
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS request_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS acceptance_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS last_status_change TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update booking status enum to include new states
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
    CHECK (status IN ('pending', 'verify_acceptance', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'expired', 'paid_confirmed'));

-- ===========================
-- 2. PHONE VERIFICATION SYSTEM
-- ===========================

-- Phone verification tracking
CREATE TABLE IF NOT EXISTS user_phone_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    verification_code VARCHAR(6),
    is_verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes')
);

CREATE INDEX IF NOT EXISTS idx_phone_verification_user ON user_phone_verification(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_verification_phone ON user_phone_verification(phone_number);
CREATE INDEX IF NOT EXISTS idx_phone_verification_expires ON user_phone_verification(expires_at);

-- ===========================
-- 3. SMS NOTIFICATION SYSTEM
-- ===========================

-- SMS preferences for each user
CREATE TABLE IF NOT EXISTS sms_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    booking_requests BOOLEAN DEFAULT TRUE,
    booking_confirmations BOOLEAN DEFAULT TRUE,
    proximity_alerts BOOLEAN DEFAULT TRUE,
    payment_notifications BOOLEAN DEFAULT TRUE,
    reminders BOOLEAN DEFAULT TRUE,
    cancellations BOOLEAN DEFAULT TRUE,
    marketing BOOLEAN DEFAULT FALSE,
    emergency_only BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- SMS delivery log and tracking
CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    phone_number VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) NOT NULL, -- 'BOOKING_REQUEST', 'PROXIMITY_ALERT', etc.
    message_content TEXT NOT NULL,
    twilio_sid VARCHAR(100), -- Twilio message SID for tracking
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, SENT, DELIVERED, FAILED, UNDELIVERED
    error_message TEXT,
    cost_cents INTEGER, -- Cost in cents for analytics
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_user ON sms_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_booking ON sms_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_type ON sms_logs(message_type);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_sent_at ON sms_logs(sent_at);

-- Scheduled SMS for countdown alerts and reminders
CREATE TABLE IF NOT EXISTS scheduled_sms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(50) NOT NULL,
    message_content TEXT NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, SENT, CANCELLED, FAILED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_scheduled_sms_booking ON scheduled_sms(booking_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_sms_user ON scheduled_sms(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_sms_scheduled_for ON scheduled_sms(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_sms_status ON scheduled_sms(status);

-- ===========================
-- 4. BOOKING STATUS TRACKING
-- ===========================

-- Track all booking status changes for analytics and debugging
CREATE TABLE IF NOT EXISTS booking_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- When this status expires
    triggered_by UUID REFERENCES users(id), -- Who caused the status change
    trigger_type VARCHAR(30), -- 'USER_ACTION', 'AUTO_EXPIRY', 'SYSTEM'
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking ON booking_status_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_status_history_changed_at ON booking_status_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_booking_status_history_expires_at ON booking_status_history(expires_at);

-- ===========================
-- 5. PAYMENT TRACKING
-- ===========================

-- Platform fees and credit tracking
CREATE TABLE IF NOT EXISTS platform_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    transaction_type VARCHAR(20) NOT NULL, -- 'PLATFORM_FEE', 'PAYOUT', 'CREDIT', 'REFUND'
    amount_cents INTEGER NOT NULL,
    stripe_transaction_id VARCHAR(200),
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_platform_transactions_booking ON platform_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_platform_transactions_user ON platform_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_transactions_type ON platform_transactions(transaction_type);

-- User credit balances
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    balance_cents INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- ===========================
-- 6. TRIGGERS AND AUTOMATION
-- ===========================

-- Trigger to update updated_at on sms_preferences
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER IF NOT EXISTS update_sms_preferences_updated_at
    BEFORE UPDATE ON sms_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to log booking status changes
CREATE OR REPLACE FUNCTION log_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO booking_status_history (
            booking_id,
            previous_status,
            new_status,
            expires_at,
            trigger_type
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            CASE
                WHEN NEW.status = 'pending' THEN NEW.request_expires_at
                WHEN NEW.status = 'verify_acceptance' THEN NEW.acceptance_expires_at
                ELSE NULL
            END,
            'USER_ACTION'
        );

        NEW.last_status_change = CURRENT_TIMESTAMP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS booking_status_change_trigger ON bookings;
CREATE TRIGGER booking_status_change_trigger
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION log_booking_status_change();

-- ===========================
-- 7. DEFAULT DATA
-- ===========================

-- Create default SMS preferences for existing users
INSERT INTO sms_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM sms_preferences WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Create default credit records for existing users
INSERT INTO user_credits (user_id, balance_cents)
SELECT id, 0 FROM users
WHERE id NOT IN (SELECT user_id FROM user_credits WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- ===========================
-- 8. INDEXES FOR PERFORMANCE
-- ===========================

-- Additional indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_expires_at ON bookings(request_expires_at) WHERE request_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_acceptance_expires ON bookings(acceptance_expires_at) WHERE acceptance_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_status_created ON bookings(status, created_at);

-- Composite index for finding expired bookings
CREATE INDEX IF NOT EXISTS idx_bookings_expiration_check ON bookings(status, request_expires_at, acceptance_expires_at);

-- ===========================
-- COMPLETED MIGRATION
-- ===========================

-- Note: Migration applied successfully for UUID-based schema