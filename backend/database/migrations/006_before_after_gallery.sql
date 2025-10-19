-- Before/After Gallery System Migration
-- Created: 2025-09-30
-- Description: Visual portfolio system for stylists to showcase their work

-- Portfolio items table (before/after photo sets)
CREATE TABLE IF NOT EXISTS portfolio_items (
    id SERIAL PRIMARY KEY,
    stylist_id INTEGER NOT NULL REFERENCES stylists(id) ON DELETE CASCADE,

    -- Photo URLs
    before_photo_url VARCHAR(500) NOT NULL,
    after_photo_url VARCHAR(500) NOT NULL,

    -- Metadata
    title VARCHAR(200),
    description TEXT,
    service_category VARCHAR(100), -- hair, nails, makeup, etc.
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,

    -- Display settings
    is_featured BOOLEAN DEFAULT false,
    is_visible BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,

    -- Engagement metrics
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Portfolio likes tracking
CREATE TABLE IF NOT EXISTS portfolio_likes (
    id SERIAL PRIMARY KEY,
    portfolio_item_id INTEGER NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),

    -- One like per user per portfolio item
    UNIQUE(portfolio_item_id, user_id)
);

-- Portfolio tags for searchability
CREATE TABLE IF NOT EXISTS portfolio_tags (
    id SERIAL PRIMARY KEY,
    portfolio_item_id INTEGER NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,

    UNIQUE(portfolio_item_id, tag)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolio_stylist ON portfolio_items(stylist_id, is_visible, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_featured ON portfolio_items(is_featured, is_visible) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_portfolio_category ON portfolio_items(service_category, is_visible);
CREATE INDEX IF NOT EXISTS idx_portfolio_display ON portfolio_items(display_order, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_portfolio_likes_item ON portfolio_likes(portfolio_item_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_likes_user ON portfolio_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_tags_item ON portfolio_tags(portfolio_item_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_tags_tag ON portfolio_tags(tag);

-- Trigger to update like counts
CREATE OR REPLACE FUNCTION update_portfolio_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE portfolio_items SET like_count = like_count + 1 WHERE id = NEW.portfolio_item_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE portfolio_items SET like_count = like_count - 1 WHERE id = OLD.portfolio_item_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_portfolio_likes ON portfolio_likes;
CREATE TRIGGER trigger_update_portfolio_likes
    AFTER INSERT OR DELETE ON portfolio_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_portfolio_like_count();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_portfolio_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_portfolio_updated_at ON portfolio_items;
CREATE TRIGGER trigger_portfolio_updated_at
    BEFORE UPDATE ON portfolio_items
    FOR EACH ROW
    EXECUTE FUNCTION update_portfolio_timestamp();