-- BeautyCita Platform Monetization System
-- Created: October 27, 2025
-- Purpose: Subscription tiers, application fees, loyalty rewards

-- ============================================================================
-- PLATFORM SETTINGS (Feature Toggles)
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    data_type VARCHAR(20) NOT NULL, -- 'boolean', 'number', 'string', 'json'
    category VARCHAR(50) NOT NULL, -- 'monetization', 'features', 'limits', etc.
    description TEXT,
    requires_restart BOOLEAN DEFAULT FALSE,
    updated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default monetization settings (ALL OFF by default)
INSERT INTO platform_settings (setting_key, setting_value, data_type, category, description) VALUES
('monetization.application_fees.enabled', 'false', 'boolean', 'monetization', 'Enable/disable application fees on bookings'),
('monetization.application_fees.default_percentage', '10.00', 'number', 'monetization', 'Default application fee percentage (if tiers disabled)'),
('monetization.subscription_tiers.enabled', 'false', 'boolean', 'monetization', 'Enable/disable subscription tier system'),
('monetization.loyalty_rewards.enabled', 'false', 'boolean', 'monetization', 'Enable/disable loyalty rewards program'),
('monetization.instant_payouts.enabled', 'false', 'boolean', 'monetization', 'Enable instant payouts for premium tiers'),
('monetization.free_trial_days', '30', 'number', 'monetization', 'Free trial days for new stylists'),
('features.bitcoin_payments.enabled', 'true', 'boolean', 'features', 'Accept Bitcoin payments via BTCPay'),
('features.stripe_payments.enabled', 'true', 'boolean', 'features', 'Accept card payments via Stripe'),
('limits.max_services_per_stylist', '50', 'number', 'limits', 'Maximum services per stylist account'),
('limits.max_bookings_per_day', '20', 'number', 'limits', 'Maximum bookings per stylist per day')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- SUBSCRIPTION TIERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_tiers (
    id SERIAL PRIMARY KEY,
    tier_name VARCHAR(50) UNIQUE NOT NULL, -- 'free', 'basic', 'pro', 'premium', 'enterprise'
    tier_slug VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    monthly_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    yearly_price DECIMAL(10,2), -- Annual billing (discounted)
    currency VARCHAR(3) DEFAULT 'USD',

    -- Commission structure
    commission_percentage DECIMAL(5,2) NOT NULL, -- Platform commission %

    -- Features and limits
    max_services INTEGER, -- NULL = unlimited
    max_bookings_per_month INTEGER,
    max_photos_portfolio INTEGER,
    max_video_portfolio INTEGER,
    featured_listing BOOLEAN DEFAULT FALSE,
    priority_support BOOLEAN DEFAULT FALSE,
    instant_payouts BOOLEAN DEFAULT FALSE,
    custom_branding BOOLEAN DEFAULT FALSE,
    advanced_analytics BOOLEAN DEFAULT FALSE,
    api_access BOOLEAN DEFAULT FALSE,

    -- Display and ordering
    display_order INTEGER DEFAULT 0,
    badge_color VARCHAR(50), -- 'gray', 'blue', 'purple', 'gold'
    badge_icon VARCHAR(50), -- Icon name for UI
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert subscription tiers
INSERT INTO subscription_tiers (
    tier_name, tier_slug, display_name, description,
    monthly_price, yearly_price, commission_percentage,
    max_services, max_bookings_per_month, max_photos_portfolio, max_video_portfolio,
    featured_listing, priority_support, instant_payouts, custom_branding, advanced_analytics, api_access,
    display_order, badge_color, badge_icon, is_featured
) VALUES
-- FREE TIER (Highest Commission)
(
    'free', 'free', 'Free',
    'Perfect for getting started. Try BeautyCita with zero upfront cost.',
    0.00, 0.00, 15.00, -- 15% commission
    10, 30, 10, 0, -- Limits
    FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, -- No premium features
    1, 'gray', 'SparklesIcon', FALSE
),

-- BASIC TIER (Medium Commission)
(
    'basic', 'basic', 'Basic',
    'Grow your business with more features and lower fees.',
    19.00, 199.00, 12.00, -- 12% commission, save $29/year with annual
    25, 100, 30, 2, -- More limits
    FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, -- Basic features only
    2, 'blue', 'StarIcon', FALSE
),

-- PRO TIER (Low Commission) - MOST POPULAR
(
    'pro', 'pro', 'Pro',
    'Best for active professionals. Lower fees + premium features.',
    49.00, 499.00, 8.00, -- 8% commission, save $89/year with annual
    50, 300, 100, 10, -- Generous limits
    TRUE, TRUE, FALSE, TRUE, TRUE, FALSE, -- Premium features
    3, 'purple', 'FireIcon', TRUE
),

-- PREMIUM TIER (Lowest Commission)
(
    'premium', 'premium', 'Premium',
    'Maximum earnings with instant payouts and unlimited everything.',
    99.00, 999.00, 5.00, -- 5% commission, save $189/year with annual
    NULL, NULL, NULL, NULL, -- Unlimited
    TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, -- All features
    4, 'gold', 'BoltIcon', FALSE
),

-- ENTERPRISE TIER (Negotiated)
(
    'enterprise', 'enterprise', 'Enterprise',
    'Custom solutions for salons and multi-location businesses.',
    NULL, NULL, 3.00, -- 3% commission (negotiated)
    NULL, NULL, NULL, NULL, -- Unlimited
    TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, -- All features + API
    5, 'gold', 'BuildingOfficeIcon', FALSE
);

-- ============================================================================
-- STYLIST SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS stylist_subscriptions (
    id SERIAL PRIMARY KEY,
    stylist_id INTEGER NOT NULL REFERENCES stylists(id) ON DELETE CASCADE,
    tier_id INTEGER NOT NULL REFERENCES subscription_tiers(id),

    -- Subscription details
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'paused', 'expired'
    billing_period VARCHAR(20) NOT NULL, -- 'monthly', 'yearly', 'lifetime'

    -- Pricing at time of subscription (for historical accuracy)
    subscribed_price DECIMAL(10,2) NOT NULL,
    subscribed_commission DECIMAL(5,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',

    -- Stripe subscription info (if paid via Stripe)
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    stripe_price_id VARCHAR(255),

    -- Trial and dates
    trial_ends_at TIMESTAMP,
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP,

    -- Auto-renewal
    auto_renew BOOLEAN DEFAULT TRUE,

    -- Metadata
    upgraded_from_tier_id INTEGER REFERENCES subscription_tiers(id),
    downgraded_from_tier_id INTEGER REFERENCES subscription_tiers(id),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_stylist_subscriptions_stylist ON stylist_subscriptions(stylist_id);
CREATE INDEX idx_stylist_subscriptions_status ON stylist_subscriptions(status);
CREATE INDEX idx_stylist_subscriptions_period_end ON stylist_subscriptions(current_period_end);

-- ============================================================================
-- LOYALTY REWARDS PROGRAM
-- ============================================================================

CREATE TABLE IF NOT EXISTS loyalty_levels (
    id SERIAL PRIMARY KEY,
    level_name VARCHAR(50) UNIQUE NOT NULL, -- 'bronze', 'silver', 'gold', 'platinum', 'diamond'
    min_bookings INTEGER NOT NULL, -- Minimum bookings to reach this level
    commission_discount DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- Additional discount %
    display_order INTEGER DEFAULT 0,
    badge_color VARCHAR(50),
    badge_icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert loyalty levels
INSERT INTO loyalty_levels (level_name, min_bookings, commission_discount, display_order, badge_color, badge_icon) VALUES
('bronze', 10, 0.50, 1, 'orange', 'ShieldCheckIcon'),
('silver', 50, 1.00, 2, 'gray', 'StarIcon'),
('gold', 150, 1.50, 3, 'yellow', 'TrophyIcon'),
('platinum', 300, 2.00, 4, 'purple', 'SparklesIcon'),
('diamond', 500, 2.50, 5, 'blue', 'BoltIcon');

CREATE TABLE IF NOT EXISTS stylist_loyalty (
    id SERIAL PRIMARY KEY,
    stylist_id INTEGER NOT NULL UNIQUE REFERENCES stylists(id) ON DELETE CASCADE,
    loyalty_level_id INTEGER REFERENCES loyalty_levels(id),

    -- Statistics
    total_completed_bookings INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0.00,
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,

    -- Rewards earned
    commission_discount_earned DECIMAL(5,2) DEFAULT 0.00, -- Total discount %

    -- Milestones
    last_milestone_reached TIMESTAMP,
    next_milestone_bookings INTEGER,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stylist_loyalty_stylist ON stylist_loyalty(stylist_id);
CREATE INDEX idx_stylist_loyalty_level ON stylist_loyalty(loyalty_level_id);

-- ============================================================================
-- APPLICATION FEE TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS booking_fees (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,

    -- Pricing breakdown
    subtotal DECIMAL(10,2) NOT NULL, -- Service price
    platform_fee DECIMAL(10,2) NOT NULL, -- Application fee
    processing_fee DECIMAL(10,2) DEFAULT 0.00, -- Stripe/payment processing fee
    total DECIMAL(10,2) NOT NULL, -- Total charged to client

    -- Fee calculation details
    base_commission_rate DECIMAL(5,2) NOT NULL, -- From subscription tier
    loyalty_discount DECIMAL(5,2) DEFAULT 0.00, -- From loyalty program
    effective_commission_rate DECIMAL(5,2) NOT NULL, -- Final rate applied

    -- Subscription context
    subscription_tier_id INTEGER REFERENCES subscription_tiers(id),
    loyalty_level_id INTEGER REFERENCES loyalty_levels(id),

    -- Payout details
    stylist_payout DECIMAL(10,2) NOT NULL, -- What stylist receives
    platform_revenue DECIMAL(10,2) NOT NULL, -- What platform keeps

    -- Stripe details
    stripe_application_fee_id VARCHAR(255),

    -- Status
    fee_collected BOOLEAN DEFAULT FALSE,
    collected_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_booking_fees_booking ON booking_fees(booking_id);
CREATE INDEX idx_booking_fees_tier ON booking_fees(subscription_tier_id);

-- ============================================================================
-- SUBSCRIPTION HISTORY & AUDIT LOG
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_history (
    id SERIAL PRIMARY KEY,
    stylist_id INTEGER NOT NULL REFERENCES stylists(id) ON DELETE CASCADE,

    -- Event details
    event_type VARCHAR(50) NOT NULL, -- 'subscribed', 'upgraded', 'downgraded', 'canceled', 'renewed', 'expired'
    from_tier_id INTEGER REFERENCES subscription_tiers(id),
    to_tier_id INTEGER REFERENCES subscription_tiers(id),

    -- Pricing at time of event
    old_price DECIMAL(10,2),
    new_price DECIMAL(10,2),
    old_commission DECIMAL(5,2),
    new_commission DECIMAL(5,2),

    -- Context
    reason TEXT,
    initiated_by VARCHAR(20), -- 'stylist', 'admin', 'system'

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscription_history_stylist ON subscription_history(stylist_id);
CREATE INDEX idx_subscription_history_event ON subscription_history(event_type);

-- ============================================================================
-- PLATFORM REVENUE ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_revenue_daily (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,

    -- Subscription revenue
    subscription_revenue DECIMAL(12,2) DEFAULT 0.00,
    new_subscriptions INTEGER DEFAULT 0,
    canceled_subscriptions INTEGER DEFAULT 0,
    active_subscriptions INTEGER DEFAULT 0,

    -- Application fee revenue
    application_fee_revenue DECIMAL(12,2) DEFAULT 0.00,
    total_bookings INTEGER DEFAULT 0,
    total_booking_value DECIMAL(12,2) DEFAULT 0.00,

    -- Payouts
    total_payouts DECIMAL(12,2) DEFAULT 0.00,

    -- Net revenue
    net_revenue DECIMAL(12,2) DEFAULT 0.00,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_platform_revenue_date ON platform_revenue_daily(date);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get effective commission rate for a stylist
CREATE OR REPLACE FUNCTION get_stylist_commission_rate(p_stylist_id INTEGER)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_base_rate DECIMAL(5,2);
    v_loyalty_discount DECIMAL(5,2);
    v_effective_rate DECIMAL(5,2);
    v_fees_enabled BOOLEAN;
BEGIN
    -- Check if application fees are enabled
    SELECT setting_value::boolean INTO v_fees_enabled
    FROM platform_settings
    WHERE setting_key = 'monetization.application_fees.enabled';

    IF NOT v_fees_enabled THEN
        RETURN 0.00; -- No fees if disabled
    END IF;

    -- Get base commission rate from subscription
    SELECT st.commission_percentage INTO v_base_rate
    FROM stylist_subscriptions ss
    JOIN subscription_tiers st ON ss.tier_id = st.id
    WHERE ss.stylist_id = p_stylist_id
      AND ss.status = 'active'
      AND ss.current_period_end > NOW()
    ORDER BY ss.created_at DESC
    LIMIT 1;

    -- If no subscription, use default rate
    IF v_base_rate IS NULL THEN
        SELECT setting_value::numeric INTO v_base_rate
        FROM platform_settings
        WHERE setting_key = 'monetization.application_fees.default_percentage';
    END IF;

    -- Get loyalty discount
    SELECT COALESCE(commission_discount_earned, 0.00) INTO v_loyalty_discount
    FROM stylist_loyalty
    WHERE stylist_id = p_stylist_id;

    -- Calculate effective rate (can't go below 0)
    v_effective_rate := GREATEST(v_base_rate - COALESCE(v_loyalty_discount, 0.00), 0.00);

    RETURN v_effective_rate;
END;
$$ LANGUAGE plpgsql;

-- Function to update loyalty level
CREATE OR REPLACE FUNCTION update_stylist_loyalty_level(p_stylist_id INTEGER)
RETURNS VOID AS $$
DECLARE
    v_total_bookings INTEGER;
    v_new_level_id INTEGER;
BEGIN
    -- Get completed bookings count
    SELECT COUNT(*) INTO v_total_bookings
    FROM bookings
    WHERE stylist_id = p_stylist_id
      AND status = 'COMPLETED';

    -- Find appropriate loyalty level
    SELECT id INTO v_new_level_id
    FROM loyalty_levels
    WHERE min_bookings <= v_total_bookings
      AND is_active = TRUE
    ORDER BY min_bookings DESC
    LIMIT 1;

    -- Update loyalty record
    INSERT INTO stylist_loyalty (
        stylist_id,
        loyalty_level_id,
        total_completed_bookings,
        commission_discount_earned
    )
    VALUES (
        p_stylist_id,
        v_new_level_id,
        v_total_bookings,
        (SELECT commission_discount FROM loyalty_levels WHERE id = v_new_level_id)
    )
    ON CONFLICT (stylist_id) DO UPDATE SET
        loyalty_level_id = v_new_level_id,
        total_completed_bookings = v_total_bookings,
        commission_discount_earned = (
            SELECT commission_discount FROM loyalty_levels WHERE id = v_new_level_id
        ),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update loyalty level when booking is completed
CREATE OR REPLACE FUNCTION trigger_update_loyalty_on_booking_complete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN
        PERFORM update_stylist_loyalty_level(NEW.stylist_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_completed_update_loyalty
AFTER UPDATE OF status ON bookings
FOR EACH ROW
EXECUTE FUNCTION trigger_update_loyalty_on_booking_complete();

-- Auto-assign free tier to new stylists
CREATE OR REPLACE FUNCTION trigger_assign_free_tier_to_new_stylist()
RETURNS TRIGGER AS $$
DECLARE
    v_free_tier_id INTEGER;
    v_trial_days INTEGER;
BEGIN
    -- Get free tier ID
    SELECT id INTO v_free_tier_id
    FROM subscription_tiers
    WHERE tier_slug = 'free'
    LIMIT 1;

    -- Get trial days setting
    SELECT setting_value::integer INTO v_trial_days
    FROM platform_settings
    WHERE setting_key = 'monetization.free_trial_days';

    -- Create subscription
    INSERT INTO stylist_subscriptions (
        stylist_id,
        tier_id,
        status,
        billing_period,
        subscribed_price,
        subscribed_commission,
        trial_ends_at,
        current_period_start,
        current_period_end
    )
    SELECT
        NEW.id,
        v_free_tier_id,
        'active',
        'monthly',
        0.00,
        (SELECT commission_percentage FROM subscription_tiers WHERE id = v_free_tier_id),
        NOW() + (v_trial_days || ' days')::INTERVAL,
        NOW(),
        NOW() + INTERVAL '1 year' -- Free tier never expires
    WHERE v_free_tier_id IS NOT NULL;

    -- Initialize loyalty record
    INSERT INTO stylist_loyalty (stylist_id, total_completed_bookings)
    VALUES (NEW.id, 0);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stylist_created_assign_free_tier
AFTER INSERT ON stylists
FOR EACH ROW
EXECUTE FUNCTION trigger_assign_free_tier_to_new_stylist();

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- View: Active subscriptions with tier details
CREATE OR REPLACE VIEW v_active_subscriptions AS
SELECT
    ss.id AS subscription_id,
    ss.stylist_id,
    s.business_name,
    u.email,
    st.tier_name,
    st.display_name,
    st.commission_percentage,
    ss.subscribed_price,
    ss.billing_period,
    ss.current_period_end,
    ss.auto_renew,
    CASE
        WHEN ss.trial_ends_at > NOW() THEN 'trial'
        ELSE 'active'
    END AS subscription_status
FROM stylist_subscriptions ss
JOIN stylists s ON ss.stylist_id = s.id
JOIN users u ON s.user_id = u.id
JOIN subscription_tiers st ON ss.tier_id = st.id
WHERE ss.status = 'active'
  AND ss.current_period_end > NOW();

-- View: Stylist revenue summary
CREATE OR REPLACE VIEW v_stylist_revenue_summary AS
SELECT
    s.id AS stylist_id,
    s.business_name,
    st.tier_name,
    sl.total_completed_bookings,
    sl.total_revenue,
    sl.average_rating,
    ll.level_name AS loyalty_level,
    get_stylist_commission_rate(s.id) AS current_commission_rate,
    COUNT(b.id) FILTER (WHERE b.created_at > NOW() - INTERVAL '30 days') AS bookings_last_30_days,
    COALESCE(SUM(bf.platform_revenue), 0) AS platform_revenue_lifetime
FROM stylists s
LEFT JOIN stylist_subscriptions ss ON s.id = ss.stylist_id AND ss.status = 'active'
LEFT JOIN subscription_tiers st ON ss.tier_id = st.id
LEFT JOIN stylist_loyalty sl ON s.id = sl.stylist_id
LEFT JOIN loyalty_levels ll ON sl.loyalty_level_id = ll.id
LEFT JOIN bookings b ON s.id = b.stylist_id
LEFT JOIN booking_fees bf ON b.id = bf.booking_id
GROUP BY s.id, s.business_name, st.tier_name, sl.total_completed_bookings,
         sl.total_revenue, sl.average_rating, ll.level_name;

-- ============================================================================
-- INITIAL DATA - Assign free tier to existing stylists
-- ============================================================================

DO $$
DECLARE
    v_free_tier_id INTEGER;
    v_trial_days INTEGER;
    r RECORD;
BEGIN
    -- Get free tier ID
    SELECT id INTO v_free_tier_id
    FROM subscription_tiers
    WHERE tier_slug = 'free'
    LIMIT 1;

    -- Get trial days
    SELECT setting_value::integer INTO v_trial_days
    FROM platform_settings
    WHERE setting_key = 'monetization.free_trial_days';

    -- Assign free tier to all existing stylists without subscriptions
    FOR r IN (
        SELECT s.id
        FROM stylists s
        LEFT JOIN stylist_subscriptions ss ON s.id = ss.stylist_id
        WHERE ss.id IS NULL
    ) LOOP
        INSERT INTO stylist_subscriptions (
            stylist_id,
            tier_id,
            status,
            billing_period,
            subscribed_price,
            subscribed_commission,
            trial_ends_at,
            current_period_start,
            current_period_end
        ) VALUES (
            r.id,
            v_free_tier_id,
            'active',
            'monthly',
            0.00,
            15.00,
            NOW() + (v_trial_days || ' days')::INTERVAL,
            NOW(),
            NOW() + INTERVAL '1 year'
        );

        INSERT INTO stylist_loyalty (stylist_id, total_completed_bookings)
        VALUES (r.id, 0)
        ON CONFLICT (stylist_id) DO NOTHING;
    END LOOP;
END $$;

COMMENT ON TABLE platform_settings IS 'Global platform feature toggles and settings';
COMMENT ON TABLE subscription_tiers IS 'Stylist subscription tier definitions';
COMMENT ON TABLE stylist_subscriptions IS 'Active stylist subscriptions';
COMMENT ON TABLE loyalty_levels IS 'Loyalty program level definitions';
COMMENT ON TABLE stylist_loyalty IS 'Stylist loyalty program progress';
COMMENT ON TABLE booking_fees IS 'Application fee tracking per booking';
COMMENT ON TABLE subscription_history IS 'Audit log of subscription changes';
