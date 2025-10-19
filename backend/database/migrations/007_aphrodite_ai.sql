-- Aphrodite AI System Migration
-- Created: 2025-09-30
-- Description: AI-powered beauty recommendations, chatbot, and insights

-- AI Conversations (Aphrodite chatbot)
CREATE TABLE IF NOT EXISTS ai_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(100) UNIQUE NOT NULL,

    -- Conversation metadata
    conversation_type VARCHAR(50), -- 'style_consultation', 'booking_help', 'trend_inquiry', 'general'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'abandoned'

    -- AI context
    user_preferences JSONB, -- Stored preferences learned from conversation
    conversation_summary TEXT,

    -- Timestamps
    started_at TIMESTAMP DEFAULT NOW(),
    last_message_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- AI Messages
CREATE TABLE IF NOT EXISTS ai_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,

    -- Message details
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,

    -- AI metadata
    model VARCHAR(50), -- Which AI model was used
    tokens_used INTEGER,
    response_time_ms INTEGER,

    -- Contextual data
    context_data JSONB, -- Additional context like stylist suggestions, service recommendations

    created_at TIMESTAMP DEFAULT NOW()
);

-- AI Recommendations (stylist matching, service suggestions)
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

    -- Recommendation type
    recommendation_type VARCHAR(50) NOT NULL, -- 'stylist_match', 'service_suggestion', 'trend_alert', 'price_range'

    -- Recommendation data
    recommended_stylist_id INTEGER REFERENCES stylists(id) ON DELETE CASCADE,
    recommended_service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    reasoning TEXT, -- Why this was recommended
    recommendation_data JSONB, -- Additional structured data

    -- User interaction
    was_viewed BOOLEAN DEFAULT false,
    was_clicked BOOLEAN DEFAULT false,
    was_booked BOOLEAN DEFAULT false,
    user_feedback VARCHAR(20), -- 'liked', 'dismissed', 'not_interested'

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    interacted_at TIMESTAMP
);

-- Beauty Trends (AI-analyzed trends)
CREATE TABLE IF NOT EXISTS beauty_trends (
    id SERIAL PRIMARY KEY,

    -- Trend details
    trend_name VARCHAR(200) NOT NULL,
    trend_category VARCHAR(50), -- 'hair', 'nails', 'makeup', 'skincare'
    description TEXT,

    -- Trend metrics
    popularity_score DECIMAL(5,2), -- 0.00 to 100.00
    growth_rate DECIMAL(5,2), -- Percentage growth
    search_volume INTEGER,

    -- Geographic relevance
    region VARCHAR(100), -- 'global', 'mexico', 'latin_america', etc.

    -- Related data
    related_services INTEGER[], -- Array of service IDs
    related_tags TEXT[],

    -- AI metadata
    detected_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Market Insights (for stylists)
CREATE TABLE IF NOT EXISTS market_insights (
    id SERIAL PRIMARY KEY,
    stylist_id INTEGER REFERENCES stylists(id) ON DELETE CASCADE,

    -- Insight type
    insight_type VARCHAR(50) NOT NULL, -- 'pricing', 'demand', 'competition', 'opportunity', 'trend'

    -- Insight details
    title VARCHAR(200),
    description TEXT,
    insight_data JSONB,

    -- Priority and actionability
    priority VARCHAR(20), -- 'high', 'medium', 'low'
    is_actionable BOOLEAN DEFAULT true,
    action_suggestion TEXT,

    -- Metrics
    potential_impact_score DECIMAL(5,2), -- Estimated impact

    -- User interaction
    was_viewed BOOLEAN DEFAULT false,
    was_acted_on BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- User Preferences (learned by AI)
CREATE TABLE IF NOT EXISTS ai_user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Preference categories
    preferred_services TEXT[],
    preferred_stylists INTEGER[], -- Array of stylist IDs
    preferred_price_range VARCHAR(50), -- 'budget', 'mid', 'luxury'
    preferred_location_radius INTEGER, -- In kilometers

    -- Style preferences
    style_preferences JSONB, -- Hair color preferences, nail styles, etc.
    avoid_preferences JSONB, -- Things user wants to avoid

    -- Behavioral data
    booking_frequency VARCHAR(20), -- 'weekly', 'monthly', 'occasional'
    preferred_booking_times JSONB, -- Preferred days/times

    -- AI learning
    confidence_level DECIMAL(3,2), -- How confident AI is about these preferences
    last_learned_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_status ON ai_conversations(status, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_messages_role ON ai_messages(role);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user ON ai_recommendations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_type ON ai_recommendations(recommendation_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_stylist ON ai_recommendations(recommended_stylist_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_active ON ai_recommendations(user_id, expires_at) WHERE expires_at > NOW();

CREATE INDEX IF NOT EXISTS idx_beauty_trends_category ON beauty_trends(trend_category, popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_beauty_trends_active ON beauty_trends(is_active, popularity_score DESC);
CREATE INDEX IF NOT EXISTS idx_beauty_trends_region ON beauty_trends(region, popularity_score DESC);

CREATE INDEX IF NOT EXISTS idx_market_insights_stylist ON market_insights(stylist_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_market_insights_type ON market_insights(insight_type, priority);
CREATE INDEX IF NOT EXISTS idx_market_insights_active ON market_insights(stylist_id, expires_at) WHERE expires_at > NOW();

CREATE INDEX IF NOT EXISTS idx_ai_user_preferences_user ON ai_user_preferences(user_id);

-- Update last_message_at trigger
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ai_conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON ai_messages;
CREATE TRIGGER trigger_update_conversation_last_message
    AFTER INSERT ON ai_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_last_message();

-- Update beauty trends timestamp
CREATE OR REPLACE FUNCTION update_trend_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_trend_timestamp ON beauty_trends;
CREATE TRIGGER trigger_update_trend_timestamp
    BEFORE UPDATE ON beauty_trends
    FOR EACH ROW
    EXECUTE FUNCTION update_trend_timestamp();