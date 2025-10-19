-- Location Tracking System Migration
-- Adds tables and columns needed for comprehensive location tracking

BEGIN;

-- Create user_locations table for general location tracking
CREATE TABLE IF NOT EXISTS user_locations (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(8, 2), -- Accuracy in meters
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_latitude CHECK (latitude >= -90 AND latitude <= 90),
    CONSTRAINT valid_longitude CHECK (longitude >= -180 AND longitude <= 180),
    CONSTRAINT valid_accuracy CHECK (accuracy IS NULL OR accuracy >= 0)
);

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_user_locations_coords ON user_locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_user_locations_updated ON user_locations(updated_at);

-- Update booking_location_tracking table if it exists, or create it
CREATE TABLE IF NOT EXISTS booking_location_tracking (
    booking_id UUID PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    accuracy DECIMAL(8, 2),
    timestamp TIMESTAMP WITH TIME ZONE,
    tracking_started_at TIMESTAMP WITH TIME ZONE,
    tracking_ended_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT false,
    continuous_tracking BOOLEAN DEFAULT false,
    last_latitude DECIMAL(10, 8),
    last_longitude DECIMAL(11, 8),
    last_update TIMESTAMP WITH TIME ZONE,
    estimated_arrival_minutes INTEGER,
    last_eta_check TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_booking_latitude CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),
    CONSTRAINT valid_booking_longitude CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),
    CONSTRAINT valid_last_latitude CHECK (last_latitude IS NULL OR (last_latitude >= -90 AND last_latitude <= 90)),
    CONSTRAINT valid_last_longitude CHECK (last_longitude IS NULL OR (last_longitude >= -180 AND last_longitude <= 180)),
    CONSTRAINT valid_booking_accuracy CHECK (accuracy IS NULL OR accuracy >= 0),
    CONSTRAINT valid_eta CHECK (estimated_arrival_minutes IS NULL OR estimated_arrival_minutes >= 0)
);

-- Add columns to booking_location_tracking if they don't exist
DO $$
BEGIN
    -- Add continuous_tracking column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'booking_location_tracking'
                   AND column_name = 'continuous_tracking') THEN
        ALTER TABLE booking_location_tracking ADD COLUMN continuous_tracking BOOLEAN DEFAULT false;
    END IF;

    -- Add last_latitude column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'booking_location_tracking'
                   AND column_name = 'last_latitude') THEN
        ALTER TABLE booking_location_tracking ADD COLUMN last_latitude DECIMAL(10, 8);
    END IF;

    -- Add last_longitude column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'booking_location_tracking'
                   AND column_name = 'last_longitude') THEN
        ALTER TABLE booking_location_tracking ADD COLUMN last_longitude DECIMAL(11, 8);
    END IF;

    -- Add last_update column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'booking_location_tracking'
                   AND column_name = 'last_update') THEN
        ALTER TABLE booking_location_tracking ADD COLUMN last_update TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add estimated_arrival_minutes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'booking_location_tracking'
                   AND column_name = 'estimated_arrival_minutes') THEN
        ALTER TABLE booking_location_tracking ADD COLUMN estimated_arrival_minutes INTEGER;
    END IF;

    -- Add last_eta_check column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'booking_location_tracking'
                   AND column_name = 'last_eta_check') THEN
        ALTER TABLE booking_location_tracking ADD COLUMN last_eta_check TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Create indexes for booking location tracking
CREATE INDEX IF NOT EXISTS idx_booking_location_active ON booking_location_tracking(is_active, continuous_tracking);
CREATE INDEX IF NOT EXISTS idx_booking_location_coords ON booking_location_tracking(last_latitude, last_longitude);
CREATE INDEX IF NOT EXISTS idx_booking_location_update ON booking_location_tracking(last_update);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes
    INDEX idx_notifications_user_sent (user_id, sent_at),
    INDEX idx_notifications_booking (booking_id),
    INDEX idx_notifications_type (type),
    INDEX idx_notifications_unread (user_id, read_at) WHERE read_at IS NULL
);

-- Create scheduled_notifications table for future notifications
CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Indexes
    INDEX idx_scheduled_notifications_time (scheduled_for, sent_at),
    INDEX idx_scheduled_notifications_booking (booking_id),
    INDEX idx_scheduled_notifications_pending (scheduled_for) WHERE sent_at IS NULL AND failed_at IS NULL
);

-- Add timezone column to users table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'users'
                   AND column_name = 'timezone') THEN
        ALTER TABLE users ADD COLUMN timezone VARCHAR(50) DEFAULT 'America/Mexico_City';
    END IF;
END $$;

-- Add location coordinates to stylists table if they don't exist
DO $$
BEGIN
    -- Add location_latitude column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'stylists'
                   AND column_name = 'location_latitude') THEN
        ALTER TABLE stylists ADD COLUMN location_latitude DECIMAL(10, 8);
    END IF;

    -- Add location_longitude column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'stylists'
                   AND column_name = 'location_longitude') THEN
        ALTER TABLE stylists ADD COLUMN location_longitude DECIMAL(11, 8);
    END IF;
END $$;

-- Create trigger to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_user_locations_updated_at
    BEFORE UPDATE ON user_locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_location_tracking_updated_at
    BEFORE UPDATE ON booking_location_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (only in development)
DO $$
BEGIN
    -- Insert sample stylist locations if in development mode
    IF current_setting('application_name', true) = 'beautycita_dev' THEN

        -- Update existing stylists with Puerto Vallarta locations
        UPDATE stylists SET
            location_latitude = 20.6077 + (random() - 0.5) * 0.02,  -- Centro area with some variation
            location_longitude = -105.2400 + (random() - 0.5) * 0.02
        WHERE location_latitude IS NULL;

        RAISE NOTICE 'Sample location data inserted for development';
    END IF;
END $$;

COMMIT;

-- Verification queries
DO $$
BEGIN
    RAISE NOTICE 'Location tracking system migration completed successfully';
    RAISE NOTICE 'Tables created/updated: user_locations, booking_location_tracking, notifications, scheduled_notifications';
    RAISE NOTICE 'Columns added: timezone to users, location coordinates to stylists';
    RAISE NOTICE 'Indexes and triggers created for optimal performance';
END $$;