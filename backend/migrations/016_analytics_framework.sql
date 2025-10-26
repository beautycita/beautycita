-- Analytics Framework Migration
-- Comprehensive analytics, A/B testing, and user tracking system

-- 1. Analytics Events Table - Track all user actions
CREATE TABLE IF NOT EXISTS analytics_events (
    id SERIAL PRIMARY KEY,
    event_id UUID DEFAULT gen_random_uuid() UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    event_name VARCHAR(100) NOT NULL,
    event_category VARCHAR(50),
    event_properties JSONB DEFAULT '{}',
    page_url TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    device_type VARCHAR(50),
    browser VARCHAR(50),
    os VARCHAR(50),
    country VARCHAR(2),
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_events_user_id (user_id),
    INDEX idx_events_session (session_id),
    INDEX idx_events_name (event_name),
    INDEX idx_events_created_at (created_at),
    INDEX idx_events_category (event_category)
);

-- 2. Experiments (A/B Tests) Table
CREATE TABLE IF NOT EXISTS experiments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    hypothesis TEXT,
    metric_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
    traffic_allocation DECIMAL(5,2) DEFAULT 100.00,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    winning_variant_id INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- 3. Experiment Variants Table
CREATE TABLE IF NOT EXISTS experiment_variants (
    id SERIAL PRIMARY KEY,
    experiment_id INTEGER REFERENCES experiments(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    weight INTEGER DEFAULT 50 CHECK (weight >= 0 AND weight <= 100),
    config JSONB DEFAULT '{}',
    is_control BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(experiment_id, name)
);

-- 4. User Experiments Assignment Table
CREATE TABLE IF NOT EXISTS user_experiments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    experiment_id INTEGER REFERENCES experiments(id) ON DELETE CASCADE,
    variant_id INTEGER REFERENCES experiment_variants(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    converted BOOLEAN DEFAULT FALSE,
    conversion_value DECIMAL(10,2),
    converted_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, experiment_id),
    INDEX idx_user_experiments_user (user_id),
    INDEX idx_user_experiments_experiment (experiment_id)
);

-- 5. Feature Flags Table
CREATE TABLE IF NOT EXISTS feature_flags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    target_users JSONB DEFAULT '[]',
    target_segments JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- 6. User Cohorts Table
CREATE TABLE IF NOT EXISTS cohorts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    criteria JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_dynamic BOOLEAN DEFAULT TRUE
);

-- 7. Cohort Membership Table
CREATE TABLE IF NOT EXISTS cohort_membership (
    id SERIAL PRIMARY KEY,
    cohort_id INTEGER REFERENCES cohorts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP,
    UNIQUE(cohort_id, user_id),
    INDEX idx_cohort_membership_cohort (cohort_id),
    INDEX idx_cohort_membership_user (user_id)
);

-- 8. Funnel Definitions Table
CREATE TABLE IF NOT EXISTS funnels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 9. Funnel Steps Table
CREATE TABLE IF NOT EXISTS funnel_steps (
    id SERIAL PRIMARY KEY,
    funnel_id INTEGER REFERENCES funnels(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    conditions JSONB DEFAULT '{}',
    UNIQUE(funnel_id, step_order)
);

-- 10. User Funnel Progress Table
CREATE TABLE IF NOT EXISTS user_funnel_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    funnel_id INTEGER REFERENCES funnels(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    current_step INTEGER,
    completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    dropped_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    INDEX idx_funnel_progress_user (user_id),
    INDEX idx_funnel_progress_funnel (funnel_id),
    INDEX idx_funnel_progress_session (session_id)
);

-- 11. Heatmap Clicks Table
CREATE TABLE IF NOT EXISTS heatmap_clicks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255),
    page_url TEXT NOT NULL,
    element_selector TEXT,
    element_text TEXT,
    x_position INTEGER,
    y_position INTEGER,
    viewport_width INTEGER,
    viewport_height INTEGER,
    click_type VARCHAR(20),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_heatmap_page (page_url),
    INDEX idx_heatmap_session (session_id),
    INDEX idx_heatmap_timestamp (timestamp)
);

-- 12. Revenue Metrics Table
CREATE TABLE IF NOT EXISTS revenue_metrics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    new_customer_revenue DECIMAL(10,2) DEFAULT 0,
    returning_customer_revenue DECIMAL(10,2) DEFAULT 0,
    refunds DECIMAL(10,2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date),
    INDEX idx_revenue_date (date)
);

-- 13. User Lifetime Value Table
CREATE TABLE IF NOT EXISTS user_lifetime_value (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    total_spent DECIMAL(10,2) DEFAULT 0,
    booking_count INTEGER DEFAULT 0,
    average_booking_value DECIMAL(10,2) DEFAULT 0,
    predicted_ltv DECIMAL(10,2),
    ltv_segment VARCHAR(50),
    first_purchase_date TIMESTAMP,
    last_purchase_date TIMESTAMP,
    days_since_last_purchase INTEGER,
    churn_probability DECIMAL(5,2),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ltv_user (user_id),
    INDEX idx_ltv_segment (ltv_segment)
);

-- 14. Session Recordings Metadata Table (for LogRocket/FullStory integration)
CREATE TABLE IF NOT EXISTS session_recordings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    recording_url TEXT,
    duration_seconds INTEGER,
    page_views INTEGER,
    events_count INTEGER,
    has_errors BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session_user (user_id),
    INDEX idx_session_created (created_at)
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_experiments_updated_at BEFORE UPDATE ON experiments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cohorts_updated_at BEFORE UPDATE ON cohorts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_funnels_updated_at BEFORE UPDATE ON funnels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default booking funnel
INSERT INTO funnels (name, description) VALUES 
    ('Booking Flow', 'Main booking conversion funnel')
ON CONFLICT (name) DO NOTHING;

-- Insert funnel steps for booking flow
INSERT INTO funnel_steps (funnel_id, step_order, step_name, event_name) VALUES
    ((SELECT id FROM funnels WHERE name = 'Booking Flow'), 1, 'Service Selection', 'service_selected'),
    ((SELECT id FROM funnels WHERE name = 'Booking Flow'), 2, 'Stylist Selection', 'stylist_selected'),
    ((SELECT id FROM funnels WHERE name = 'Booking Flow'), 3, 'Date & Time Selection', 'datetime_selected'),
    ((SELECT id FROM funnels WHERE name = 'Booking Flow'), 4, 'Payment Details', 'payment_info_entered'),
    ((SELECT id FROM funnels WHERE name = 'Booking Flow'), 5, 'Booking Completed', 'booking_completed')
ON CONFLICT DO NOTHING;

-- Create default cohorts
INSERT INTO cohorts (name, description, criteria, is_dynamic) VALUES
    ('New Users - This Week', 'Users who signed up this week', '{"signup_period": "this_week"}', TRUE),
    ('Active Bookers', 'Users who made a booking in last 30 days', '{"last_booking_days": 30}', TRUE),
    ('High Value Customers', 'Users with LTV > $500', '{"min_ltv": 500}', TRUE),
    ('At Risk Churn', 'Users with high churn probability', '{"min_churn_probability": 0.7}', TRUE)
ON CONFLICT (name) DO NOTHING;

COMMENT ON TABLE analytics_events IS 'Stores all user interaction events for behavior tracking';
COMMENT ON TABLE experiments IS 'A/B test experiment configurations';
COMMENT ON TABLE feature_flags IS 'Feature flag configurations for gradual rollouts';
COMMENT ON TABLE cohorts IS 'User segmentation for cohort analysis';
COMMENT ON TABLE funnels IS 'Conversion funnel definitions';
COMMENT ON TABLE heatmap_clicks IS 'Click tracking data for heatmap generation';
COMMENT ON TABLE user_lifetime_value IS 'Customer lifetime value predictions and metrics';
