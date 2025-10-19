-- Migration: Dispute System and Messaging
-- Description: Creates tables for dispute management and real-time messaging

-- ============================================
-- DISPUTE SYSTEM
-- ============================================

-- Disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  initiator_id INTEGER NOT NULL REFERENCES users(id),
  respondent_id INTEGER NOT NULL REFERENCES users(id),
  dispute_type VARCHAR(50) NOT NULL CHECK (dispute_type IN ('SERVICE_QUALITY', 'NO_SHOW', 'PAYMENT', 'CANCELLATION', 'OTHER')),
  status VARCHAR(30) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REFUNDED', 'CLOSED')),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  requested_resolution VARCHAR(100) CHECK (requested_resolution IN ('FULL_REFUND', 'PARTIAL_REFUND', 'REDO_SERVICE', 'APOLOGY', 'OTHER')),
  resolution_details TEXT,
  admin_notes TEXT,
  resolved_at TIMESTAMP,
  resolved_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dispute messages/communication thread
CREATE TABLE IF NOT EXISTS dispute_messages (
  id SERIAL PRIMARY KEY,
  dispute_id INTEGER NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  is_admin_message BOOLEAN DEFAULT FALSE,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dispute evidence/attachments
CREATE TABLE IF NOT EXISTS dispute_evidence (
  id SERIAL PRIMARY KEY,
  dispute_id INTEGER NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  uploaded_by INTEGER NOT NULL REFERENCES users(id),
  file_type VARCHAR(50) NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dispute resolution actions
CREATE TABLE IF NOT EXISTS dispute_resolutions (
  id SERIAL PRIMARY KEY,
  dispute_id INTEGER NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  resolution_type VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2),
  notes TEXT,
  executed_by INTEGER REFERENCES users(id),
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MESSAGING SYSTEM
-- ============================================

-- Conversations (1-on-1 or group chats)
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  conversation_type VARCHAR(20) NOT NULL DEFAULT 'DIRECT' CHECK (conversation_type IN ('DIRECT', 'GROUP', 'SUPPORT')),
  title VARCHAR(200),
  created_by INTEGER REFERENCES users(id),
  related_booking_id INTEGER REFERENCES bookings(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversation participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER')),
  last_read_at TIMESTAMP,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP,
  UNIQUE(conversation_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id),
  message_type VARCHAR(20) DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'IMAGE', 'FILE', 'VOICE', 'SYSTEM')),
  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  reply_to_message_id INTEGER REFERENCES messages(id),
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  read_by JSONB DEFAULT '[]', -- Array of user IDs who have read this message
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Message reactions (like, love, etc.)
CREATE TABLE IF NOT EXISTS message_reactions (
  id SERIAL PRIMARY KEY,
  message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('LIKE', 'LOVE', 'LAUGH', 'SURPRISED', 'SAD', 'ANGRY')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id, reaction_type)
);

-- ============================================
-- VIDEO CONSULTATIONS
-- ============================================

-- Video consultation sessions
CREATE TABLE IF NOT EXISTS video_consultations (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  host_id INTEGER NOT NULL REFERENCES users(id),
  client_id INTEGER NOT NULL REFERENCES users(id),
  twilio_room_sid VARCHAR(100) UNIQUE,
  room_name VARCHAR(100) NOT NULL,
  status VARCHAR(30) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
  scheduled_at TIMESTAMP NOT NULL,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_minutes INTEGER,
  recording_url TEXT,
  consultation_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Video consultation participants (for multi-party calls)
CREATE TABLE IF NOT EXISTS video_participants (
  id SERIAL PRIMARY KEY,
  consultation_id INTEGER NOT NULL REFERENCES video_consultations(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  twilio_identity VARCHAR(100),
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  connection_quality VARCHAR(20) CHECK (connection_quality IN ('EXCELLENT', 'GOOD', 'FAIR', 'POOR')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Dispute indexes
CREATE INDEX IF NOT EXISTS idx_disputes_booking_id ON disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_initiator_id ON disputes(initiator_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute_id ON dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_evidence_dispute_id ON dispute_evidence(dispute_id);

-- Messaging indexes
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_booking_id ON conversations(related_booking_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Video consultation indexes
CREATE INDEX IF NOT EXISTS idx_video_consultations_booking_id ON video_consultations(booking_id);
CREATE INDEX IF NOT EXISTS idx_video_consultations_host_id ON video_consultations(host_id);
CREATE INDEX IF NOT EXISTS idx_video_consultations_client_id ON video_consultations(client_id);
CREATE INDEX IF NOT EXISTS idx_video_consultations_scheduled_at ON video_consultations(scheduled_at);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_video_consultations_updated_at BEFORE UPDATE ON video_consultations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get unread message count for a user in a conversation
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id INTEGER, p_conversation_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  last_read TIMESTAMP;
  unread_count INTEGER;
BEGIN
  -- Get last_read_at for this user in this conversation
  SELECT last_read_at INTO last_read
  FROM conversation_participants
  WHERE user_id = p_user_id AND conversation_id = p_conversation_id;

  -- Count messages created after last_read_at
  SELECT COUNT(*) INTO unread_count
  FROM messages
  WHERE conversation_id = p_conversation_id
    AND created_at > COALESCE(last_read, '1970-01-01'::TIMESTAMP)
    AND sender_id != p_user_id
    AND is_deleted = FALSE;

  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(p_user_id INTEGER, p_conversation_id INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE conversation_participants
  SET last_read_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id AND conversation_id = p_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create or get direct conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(p_user1_id INTEGER, p_user2_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  conversation_id INTEGER;
BEGIN
  -- Try to find existing conversation
  SELECT c.id INTO conversation_id
  FROM conversations c
  INNER JOIN conversation_participants cp1 ON c.id = cp1.conversation_id AND cp1.user_id = p_user1_id
  INNER JOIN conversation_participants cp2 ON c.id = cp2.conversation_id AND cp2.user_id = p_user2_id
  WHERE c.conversation_type = 'DIRECT'
    AND c.is_active = TRUE
  LIMIT 1;

  -- If no conversation exists, create one
  IF conversation_id IS NULL THEN
    INSERT INTO conversations (conversation_type, created_by)
    VALUES ('DIRECT', p_user1_id)
    RETURNING id INTO conversation_id;

    -- Add both participants
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES (conversation_id, p_user1_id), (conversation_id, p_user2_id);
  END IF;

  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE disputes IS 'Stores dispute cases between clients and stylists';
COMMENT ON TABLE dispute_messages IS 'Communication thread for each dispute';
COMMENT ON TABLE conversations IS 'Chat conversations between users';
COMMENT ON TABLE messages IS 'Individual messages in conversations';
COMMENT ON TABLE video_consultations IS 'Video consultation sessions using Twilio Video';
