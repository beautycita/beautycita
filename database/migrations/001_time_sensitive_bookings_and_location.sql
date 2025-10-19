-- Migration: Time-sensitive bookings and location tracking enhancements
-- Date: 2025-01-20
-- Purpose: Add support for time-sensitive booking workflow, SMS notifications, and location features

-- ===========================
-- 1. ENHANCE EXISTING TABLES
-- ===========================

-- Update users table to require phone verification
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN phone_verified_at TIMESTAMP WITH TIME ZONE;

-- Enhance bookings table with time-sensitive workflow
ALTER TABLE bookings ADD COLUMN request_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN acceptance_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN last_status_change TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Update booking status enum to include new states
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
    CHECK (status IN ('PENDING', 'VERIFY_ACCEPTANCE', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'EXPIRED'));

-- Make stylist location fields required (they should set work location during registration)
ALTER TABLE stylists ALTER COLUMN location_address SET NOT NULL;
ALTER TABLE stylists ALTER COLUMN location_city SET NOT NULL;
ALTER TABLE stylists ALTER COLUMN location_coordinates SET NOT NULL;

-- ===========================
-- 2. PHONE VERIFICATION SYSTEM
-- ===========================

-- Phone verification tracking
CREATE TABLE user_phone_verification (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    verification_code VARCHAR(6),
    is_verified BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '10 minutes')
);

CREATE INDEX idx_phone_verification_user ON user_phone_verification(user_id);
CREATE INDEX idx_phone_verification_phone ON user_phone_verification(phone_number);
CREATE INDEX idx_phone_verification_expires ON user_phone_verification(expires_at);

-- ===========================
-- 3. SMS NOTIFICATION SYSTEM
-- ===========================

-- SMS preferences for each user
CREATE TABLE sms_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
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
CREATE TABLE sms_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
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

CREATE INDEX idx_sms_logs_user ON sms_logs(user_id);
CREATE INDEX idx_sms_logs_booking ON sms_logs(booking_id);
CREATE INDEX idx_sms_logs_type ON sms_logs(message_type);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_sms_logs_sent_at ON sms_logs(sent_at);

-- Scheduled SMS for countdown alerts and reminders
CREATE TABLE scheduled_sms (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message_type VARCHAR(50) NOT NULL,
    message_content TEXT NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, SENT, CANCELLED, FAILED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_scheduled_sms_booking ON scheduled_sms(booking_id);
CREATE INDEX idx_scheduled_sms_user ON scheduled_sms(user_id);
CREATE INDEX idx_scheduled_sms_scheduled_for ON scheduled_sms(scheduled_for);
CREATE INDEX idx_scheduled_sms_status ON scheduled_sms(status);

-- ===========================
-- 4. BOOKING STATUS TRACKING
-- ===========================

-- Track all booking status changes for analytics and debugging
CREATE TABLE booking_status_history (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE, -- When this status expires
    triggered_by INTEGER REFERENCES users(id), -- Who caused the status change
    trigger_type VARCHAR(30), -- 'USER_ACTION', 'AUTO_EXPIRY', 'SYSTEM'
    notes TEXT
);

CREATE INDEX idx_booking_status_history_booking ON booking_status_history(booking_id);
CREATE INDEX idx_booking_status_history_changed_at ON booking_status_history(changed_at);
CREATE INDEX idx_booking_status_history_expires_at ON booking_status_history(expires_at);

-- ===========================
-- 5. CLIENT LOCATION MANAGEMENT
-- ===========================

-- Client location preferences (home, work, etc.)
CREATE TABLE client_locations (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    address_type VARCHAR(20) CHECK (address_type IN ('HOME', 'WORK', 'OTHER')) DEFAULT 'HOME',
    label VARCHAR(100), -- Custom label like "Sarah's Apartment"
    street_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'US',
    coordinates POINT NOT NULL, -- PostGIS point for lat/lng
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_client_locations_client ON client_locations(client_id);
CREATE INDEX idx_client_locations_coordinates ON client_locations USING GIST(coordinates);
CREATE INDEX idx_client_locations_primary ON client_locations(client_id, is_primary) WHERE is_primary = TRUE;

-- ===========================
-- 6. REAL-TIME LOCATION TRACKING
-- ===========================

-- Real-time location tracking for arrival notifications
CREATE TABLE booking_location_tracking (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    client_latitude DECIMAL(10, 8),
    client_longitude DECIMAL(11, 8),
    stylist_coordinates POINT, -- Cached stylist location for quick distance calc
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    actual_travel_time INTEGER, -- Minutes from start to arrival
    distance_remaining INTEGER, -- Meters remaining to destination
    is_en_route BOOLEAN DEFAULT FALSE,
    journey_started_at TIMESTAMP WITH TIME ZONE,

    -- Alert tracking
    en_route_alert_sent BOOLEAN DEFAULT FALSE,
    five_minute_alert_sent BOOLEAN DEFAULT FALSE,
    arrival_alert_sent BOOLEAN DEFAULT FALSE,
    running_late_alert_sent BOOLEAN DEFAULT FALSE,

    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_location_tracking_booking ON booking_location_tracking(booking_id);
CREATE INDEX idx_location_tracking_client ON booking_location_tracking(client_id);
CREATE INDEX idx_location_tracking_en_route ON booking_location_tracking(is_en_route) WHERE is_en_route = TRUE;
CREATE INDEX idx_location_tracking_updated ON booking_location_tracking(last_updated);

-- ===========================
-- 7. DISTANCE CALCULATION FUNCTIONS
-- ===========================

-- Function to calculate distance between two points in meters
CREATE OR REPLACE FUNCTION calculate_distance_meters(lat1 DECIMAL, lng1 DECIMAL, lat2 DECIMAL, lng2 DECIMAL)
RETURNS INTEGER AS $$
BEGIN
    -- Using Haversine formula to calculate distance in meters
    RETURN (
        6371000 * acos(
            cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lng2) - radians(lng1)) +
            sin(radians(lat1)) * sin(radians(lat2))
        )
    )::INTEGER;
END;
$$ LANGUAGE plpgsql;

-- Function to find nearby stylists within a radius
CREATE OR REPLACE FUNCTION find_nearby_stylists(
    client_lat DECIMAL,
    client_lng DECIMAL,
    radius_meters INTEGER DEFAULT 50000
)
RETURNS TABLE (
    stylist_id INTEGER,
    user_id INTEGER,
    business_name VARCHAR(255),
    distance_meters INTEGER,
    latitude DECIMAL,
    longitude DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id as stylist_id,
        s.user_id,
        s.business_name,
        calculate_distance_meters(
            client_lat,
            client_lng,
            ST_Y(s.location_coordinates),
            ST_X(s.location_coordinates)
        ) as distance_meters,
        ST_Y(s.location_coordinates) as latitude,
        ST_X(s.location_coordinates) as longitude
    FROM stylists s
    WHERE s.is_active = TRUE
    AND calculate_distance_meters(
        client_lat,
        client_lng,
        ST_Y(s.location_coordinates),
        ST_X(s.location_coordinates)
    ) <= radius_meters
    ORDER BY distance_meters ASC;
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- 8. TRIGGERS AND AUTOMATION
-- ===========================

-- Trigger to update updated_at on client_locations
CREATE TRIGGER update_client_locations_updated_at
    BEFORE UPDATE ON client_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at on sms_preferences
CREATE TRIGGER update_sms_preferences_updated_at
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
                WHEN NEW.status = 'PENDING' THEN NEW.request_expires_at
                WHEN NEW.status = 'VERIFY_ACCEPTANCE' THEN NEW.acceptance_expires_at
                ELSE NULL
            END,
            'USER_ACTION'
        );

        NEW.last_status_change = CURRENT_TIMESTAMP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_status_change_trigger
    BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION log_booking_status_change();

-- ===========================
-- 9. DEFAULT DATA
-- ===========================

-- Create default SMS preferences for existing users
INSERT INTO sms_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM sms_preferences);

-- ===========================
-- 10. INDEXES FOR PERFORMANCE
-- ===========================

-- Additional indexes for common queries
CREATE INDEX idx_bookings_expires_at ON bookings(request_expires_at) WHERE request_expires_at IS NOT NULL;
CREATE INDEX idx_bookings_acceptance_expires ON bookings(acceptance_expires_at) WHERE acceptance_expires_at IS NOT NULL;
CREATE INDEX idx_bookings_status_created ON bookings(status, created_at);

-- Composite index for finding expired bookings
CREATE INDEX idx_bookings_expiration_check ON bookings(status, request_expires_at, acceptance_expires_at);

-- ===========================
-- COMPLETED MIGRATION
-- ===========================

-- Log migration completion
INSERT INTO schema_migrations (version, applied_at)
VALUES ('001_time_sensitive_bookings_and_location', CURRENT_TIMESTAMP)
ON CONFLICT (version) DO NOTHING;