-- BeautyCita RASA Database Schema
-- Production-ready schema for conversation tracking and booking intents

-- Create dedicated RASA database (run manually by admin)
-- CREATE DATABASE beautycita_rasa;
-- CREATE USER rasa_user WITH ENCRYPTED PASSWORD 'secure_rasa_password_2025';
-- GRANT ALL PRIVILEGES ON DATABASE beautycita_rasa TO rasa_user;

-- Connect to beautycita_rasa database and run the following:

-- Conversation tracking table
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    sender_id VARCHAR(255) NOT NULL,
    user_id INTEGER, -- References users(id) from main beautycita database
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active', -- active, completed, abandoned
    language VARCHAR(5) DEFAULT 'es', -- es, en
    session_data JSONB DEFAULT '{}', -- Store session variables
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Message history table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL, -- 'user' or 'bot'
    message TEXT NOT NULL,
    intent VARCHAR(100), -- detected intent
    entities JSONB DEFAULT '[]', -- extracted entities
    confidence FLOAT, -- intent confidence score
    response_time_ms INTEGER, -- bot response time in milliseconds
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Booking intents and progress tracking
CREATE TABLE IF NOT EXISTS booking_intents (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    service_ids INTEGER[], -- Array of service IDs
    stylist_id INTEGER, -- Preferred stylist
    preferred_date DATE,
    preferred_time TIME,
    location_preference TEXT,
    special_requests TEXT,
    status VARCHAR(50) DEFAULT 'in_progress', -- in_progress, confirmed, cancelled
    booking_id INTEGER, -- References actual booking in main database
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics and performance tracking
CREATE TABLE IF NOT EXISTS conversation_metrics (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    total_messages INTEGER DEFAULT 0,
    user_messages INTEGER DEFAULT 0,
    bot_messages INTEGER DEFAULT 0,
    avg_response_time_ms FLOAT,
    successful_booking BOOLEAN DEFAULT FALSE,
    abandonment_point VARCHAR(100), -- Where user left the conversation
    satisfaction_rating INTEGER, -- 1-5 if collected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_sender_id ON conversations(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_booking_intents_conversation_id ON booking_intents(conversation_id);
CREATE INDEX IF NOT EXISTS idx_booking_intents_status ON booking_intents(status);

-- Trigger to update last_message_at in conversations
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_last_message ON messages;
CREATE TRIGGER trigger_update_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- Function to clean up old conversations (run weekly)
CREATE OR REPLACE FUNCTION cleanup_old_conversations(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM conversations
    WHERE status = 'abandoned'
    AND last_message_at < NOW() - INTERVAL '1 day' * days_to_keep;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to rasa_user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rasa_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rasa_user;