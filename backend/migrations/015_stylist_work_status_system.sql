-- Migration: Stylist Work Status and Booking Request System
-- Created: 2025-10-13
-- Purpose: Real-time stylist availability tracking with booking request workflow

BEGIN;

-- ==================== STYLIST WORK STATUS ====================
-- Tracks real-time work status (working, available, unavailable with ETA)
CREATE TABLE IF NOT EXISTS stylist_work_status (
  id SERIAL PRIMARY KEY,
  stylist_id INTEGER NOT NULL REFERENCES stylists(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'offline'
    CHECK (status IN ('offline', 'working', 'available', 'unavailable')),

  -- Work session tracking
  work_started_at TIMESTAMP WITH TIME ZONE,
  estimated_available_at TIMESTAMP WITH TIME ZONE, -- ETA for when they'll be available
  actual_available_at TIMESTAMP WITH TIME ZONE,

  -- Alert tracking
  alert_sent BOOLEAN DEFAULT FALSE,
  alert_sent_at TIMESTAMP WITH TIME ZONE,
  work_extended_count INTEGER DEFAULT 0, -- Number of times they extended work hours

  -- Notes
  status_note VARCHAR(500), -- Optional note about current status

  -- Timestamps
  last_status_change TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Ensure one status per stylist
  CONSTRAINT unique_stylist_status UNIQUE (stylist_id)
);

CREATE INDEX IF NOT EXISTS idx_work_status_stylist ON stylist_work_status(stylist_id);
CREATE INDEX IF NOT EXISTS idx_work_status_available ON stylist_work_status(status) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_work_status_eta ON stylist_work_status(estimated_available_at) WHERE estimated_available_at IS NOT NULL;

-- ==================== BOOKING REQUESTS ====================
-- Handles booking request flow with auto-book and expiration
CREATE TABLE IF NOT EXISTS booking_requests (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stylist_id INTEGER NOT NULL REFERENCES stylists(id) ON DELETE CASCADE,
  service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,

  -- Request details
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  total_price NUMERIC(8,2) NOT NULL,
  notes TEXT, -- Special requests from client

  -- Status tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'auto_booked', 'awaiting_client_confirmation', 'confirmed', 'expired', 'declined', 'cancelled')),

  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 15 minutes after creation
  stylist_responded_at TIMESTAMP WITH TIME ZONE,
  client_confirmed_at TIMESTAMP WITH TIME ZONE,
  auto_book_window_ends_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 5 minutes after creation

  -- Response tracking
  stylist_response VARCHAR(20) CHECK (stylist_response IN ('accept', 'decline')),
  stylist_decline_reason TEXT,

  -- Booking reference (if confirmed/auto-booked)
  booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,

  -- Timestamps
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_booking_requests_client ON booking_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_booking_requests_stylist ON booking_requests(stylist_id, status);
CREATE INDEX IF NOT EXISTS idx_booking_requests_expires ON booking_requests(expires_at) WHERE status = 'pending' OR status = 'awaiting_client_confirmation';
CREATE INDEX IF NOT EXISTS idx_booking_requests_auto_book ON booking_requests(auto_book_window_ends_at) WHERE status = 'pending';

-- ==================== WORK STATUS HISTORY ====================
-- Track history of work status changes for analytics
CREATE TABLE IF NOT EXISTS stylist_work_status_history (
  id SERIAL PRIMARY KEY,
  stylist_id INTEGER NOT NULL REFERENCES stylists(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL,
  work_started_at TIMESTAMP WITH TIME ZONE,
  work_ended_at TIMESTAMP WITH TIME ZONE,
  total_work_duration_minutes INTEGER,
  estimated_available_at TIMESTAMP WITH TIME ZONE,
  actual_available_at TIMESTAMP WITH TIME ZONE,
  work_extended_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_work_history_stylist ON stylist_work_status_history(stylist_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_history_date ON stylist_work_status_history(work_started_at);

-- ==================== TRIGGERS ====================

-- Update updated_at timestamp
CREATE TRIGGER update_work_status_updated_at
  BEFORE UPDATE ON stylist_work_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_requests_updated_at
  BEFORE UPDATE ON booking_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Archive work status to history when status changes
CREATE OR REPLACE FUNCTION archive_work_status()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'working' AND NEW.status != 'working' THEN
    INSERT INTO stylist_work_status_history (
      stylist_id,
      status,
      work_started_at,
      work_ended_at,
      total_work_duration_minutes,
      estimated_available_at,
      actual_available_at,
      work_extended_count
    ) VALUES (
      OLD.stylist_id,
      OLD.status,
      OLD.work_started_at,
      CURRENT_TIMESTAMP,
      EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - OLD.work_started_at)) / 60,
      OLD.estimated_available_at,
      NEW.actual_available_at,
      OLD.work_extended_count
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_archive_work_status ON stylist_work_status;
CREATE TRIGGER trigger_archive_work_status
  AFTER UPDATE OF status ON stylist_work_status
  FOR EACH ROW
  EXECUTE FUNCTION archive_work_status();

-- Auto-create booking when request is accepted within 5-minute window
CREATE OR REPLACE FUNCTION auto_create_booking()
RETURNS TRIGGER AS $$
DECLARE
  new_booking_id INTEGER;
BEGIN
  -- Only auto-book if accepted within window and status is changing to auto_booked
  IF NEW.status = 'auto_booked' AND NEW.stylist_response = 'accept' AND OLD.status = 'pending' THEN
    -- Create the booking
    INSERT INTO bookings (
      client_id,
      stylist_id,
      service_id,
      booking_date,
      booking_time,
      duration_minutes,
      status,
      total_price,
      notes,
      confirmed_at
    ) VALUES (
      NEW.client_id,
      NEW.stylist_id,
      NEW.service_id,
      NEW.requested_date,
      NEW.requested_time,
      NEW.duration_minutes,
      'CONFIRMED',
      NEW.total_price,
      NEW.notes,
      CURRENT_TIMESTAMP
    ) RETURNING id INTO new_booking_id;

    -- Link booking to request
    NEW.booking_id := new_booking_id;

    -- Create notification for client
    INSERT INTO notifications (user_id, type, title, message, related_booking_id)
    VALUES (
      NEW.client_id,
      'BOOKING_AUTO_CONFIRMED',
      'Booking Auto-Confirmed!',
      'Your booking request was accepted by the stylist and automatically confirmed.',
      new_booking_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_booking ON booking_requests;
CREATE TRIGGER trigger_auto_create_booking
  BEFORE UPDATE OF status ON booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_booking();

-- ==================== FUNCTIONS ====================

-- Function to check if stylist is currently available for booking
CREATE OR REPLACE FUNCTION is_stylist_available(p_stylist_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_status VARCHAR(20);
BEGIN
  SELECT status INTO v_status
  FROM stylist_work_status
  WHERE stylist_id = p_stylist_id;

  RETURN v_status = 'available';
END;
$$ LANGUAGE plpgsql;

-- Function to expire old booking requests
CREATE OR REPLACE FUNCTION expire_old_booking_requests()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  UPDATE booking_requests
  SET status = 'expired', updated_at = CURRENT_TIMESTAMP
  WHERE (status = 'pending' OR status = 'awaiting_client_confirmation')
    AND expires_at < CURRENT_TIMESTAMP;

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- ==================== INITIAL DATA ====================

-- Create work status entries for all existing stylists (offline by default)
INSERT INTO stylist_work_status (stylist_id, status)
SELECT id, 'offline'
FROM stylists
WHERE NOT EXISTS (
  SELECT 1 FROM stylist_work_status WHERE stylist_id = stylists.id
);

COMMIT;
