-- Reviews and Ratings System Migration
-- Created: 2025-09-30
-- Description: Complete review system with ratings, photos, responses, and moderation

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stylist_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Rating (1-5 stars)
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),

    -- Review content
    title VARCHAR(200),
    review_text TEXT,

    -- Service quality breakdown (optional, 1-5 each)
    quality_rating INTEGER CHECK (quality_rating IS NULL OR (quality_rating >= 1 AND quality_rating <= 5)),
    professionalism_rating INTEGER CHECK (professionalism_rating IS NULL OR (professionalism_rating >= 1 AND professionalism_rating <= 5)),
    cleanliness_rating INTEGER CHECK (cleanliness_rating IS NULL OR (cleanliness_rating >= 1 AND cleanliness_rating <= 5)),
    value_rating INTEGER CHECK (value_rating IS NULL OR (value_rating >= 1 AND value_rating <= 5)),

    -- Verification and visibility
    is_verified BOOLEAN DEFAULT true, -- Verified booking
    is_visible BOOLEAN DEFAULT true,

    -- Moderation
    is_flagged BOOLEAN DEFAULT false,
    flag_reason VARCHAR(500),
    flagged_at TIMESTAMP,
    flagged_by INTEGER REFERENCES users(id),

    is_approved BOOLEAN DEFAULT true,
    moderated_by INTEGER REFERENCES users(id),
    moderated_at TIMESTAMP,
    moderation_notes TEXT,

    -- Engagement
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,

    -- Stylist Response (stored directly in reviews table)
    stylist_response TEXT,
    stylist_response_date TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    -- Ensure one review per booking
    UNIQUE(booking_id),

    -- Ensure client can't review themselves
    CHECK (client_id != stylist_id)
);

-- Review photos (before/after)
CREATE TABLE IF NOT EXISTS review_photos (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    photo_url VARCHAR(500) NOT NULL,
    photo_type VARCHAR(20) CHECK (photo_type IN ('before', 'after', 'result')),
    caption VARCHAR(200),
    display_order INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Helpful votes tracking (prevent duplicate votes)
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_helpful BOOLEAN NOT NULL, -- true = helpful, false = not helpful
    voted_at TIMESTAMP DEFAULT NOW(),

    -- One vote per user per review
    UNIQUE(review_id, user_id)
);

-- Stylist aggregate ratings (for quick access)
CREATE TABLE IF NOT EXISTS stylist_ratings (
    id SERIAL PRIMARY KEY,
    stylist_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    -- Overall stats
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,

    -- Rating distribution
    rating_5_star INTEGER DEFAULT 0,
    rating_4_star INTEGER DEFAULT 0,
    rating_3_star INTEGER DEFAULT 0,
    rating_2_star INTEGER DEFAULT 0,
    rating_1_star INTEGER DEFAULT 0,

    -- Breakdown averages
    average_quality DECIMAL(3,2) DEFAULT 0.00,
    average_professionalism DECIMAL(3,2) DEFAULT 0.00,
    average_cleanliness DECIMAL(3,2) DEFAULT 0.00,
    average_value DECIMAL(3,2) DEFAULT 0.00,

    -- Engagement
    total_helpful_votes INTEGER DEFAULT 0,

    -- Response rate
    response_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
    average_response_time_hours DECIMAL(10,2),

    last_updated TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_stylist ON reviews(stylist_id, is_visible, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_client ON reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating, is_visible);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_flagged ON reviews(is_flagged, is_approved);

CREATE INDEX IF NOT EXISTS idx_review_photos_review ON review_photos(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_review ON review_helpful_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_helpful_user ON review_helpful_votes(user_id);

CREATE INDEX IF NOT EXISTS idx_stylist_ratings_stylist ON stylist_ratings(stylist_id);
CREATE INDEX IF NOT EXISTS idx_stylist_ratings_avg ON stylist_ratings(average_rating DESC);

-- Trigger to update stylist_ratings when review is added/updated/deleted
CREATE OR REPLACE FUNCTION update_stylist_ratings()
RETURNS TRIGGER AS $$
BEGIN
    -- Get stylist_id from the review
    DECLARE
        v_stylist_id INTEGER;
        v_total_reviews INTEGER;
        v_avg_rating DECIMAL(3,2);
        v_5star INTEGER;
        v_4star INTEGER;
        v_3star INTEGER;
        v_2star INTEGER;
        v_1star INTEGER;
        v_avg_quality DECIMAL(3,2);
        v_avg_prof DECIMAL(3,2);
        v_avg_clean DECIMAL(3,2);
        v_avg_value DECIMAL(3,2);
        v_response_rate DECIMAL(5,2);
    BEGIN
        -- Determine stylist_id based on operation
        IF TG_OP = 'DELETE' THEN
            v_stylist_id := OLD.stylist_id;
        ELSE
            v_stylist_id := NEW.stylist_id;
        END IF;

        -- Calculate aggregates (only visible, approved reviews)
        SELECT
            COUNT(*),
            COALESCE(AVG(rating), 0),
            COUNT(*) FILTER (WHERE rating = 5),
            COUNT(*) FILTER (WHERE rating = 4),
            COUNT(*) FILTER (WHERE rating = 3),
            COUNT(*) FILTER (WHERE rating = 2),
            COUNT(*) FILTER (WHERE rating = 1),
            COALESCE(AVG(quality_rating), 0),
            COALESCE(AVG(professionalism_rating), 0),
            COALESCE(AVG(cleanliness_rating), 0),
            COALESCE(AVG(value_rating), 0)
        INTO
            v_total_reviews,
            v_avg_rating,
            v_5star, v_4star, v_3star, v_2star, v_1star,
            v_avg_quality, v_avg_prof, v_avg_clean, v_avg_value
        FROM reviews
        WHERE stylist_id = v_stylist_id
          AND is_visible = true
          AND is_approved = true;

        -- Calculate response rate
        SELECT
            CASE
                WHEN v_total_reviews > 0 THEN
                    (COUNT(*) FILTER (WHERE stylist_response IS NOT NULL)::DECIMAL / v_total_reviews * 100)
                ELSE 0
            END
        INTO v_response_rate
        FROM reviews
        WHERE stylist_id = v_stylist_id
          AND is_visible = true
          AND is_approved = true;

        -- Upsert stylist_ratings
        INSERT INTO stylist_ratings (
            stylist_id,
            total_reviews,
            average_rating,
            rating_5_star,
            rating_4_star,
            rating_3_star,
            rating_2_star,
            rating_1_star,
            average_quality,
            average_professionalism,
            average_cleanliness,
            average_value,
            response_rate,
            last_updated
        ) VALUES (
            v_stylist_id,
            v_total_reviews,
            v_avg_rating,
            v_5star, v_4star, v_3star, v_2star, v_1star,
            v_avg_quality, v_avg_prof, v_avg_clean, v_avg_value,
            v_response_rate,
            NOW()
        )
        ON CONFLICT (stylist_id) DO UPDATE SET
            total_reviews = EXCLUDED.total_reviews,
            average_rating = EXCLUDED.average_rating,
            rating_5_star = EXCLUDED.rating_5_star,
            rating_4_star = EXCLUDED.rating_4_star,
            rating_3_star = EXCLUDED.rating_3_star,
            rating_2_star = EXCLUDED.rating_2_star,
            rating_1_star = EXCLUDED.rating_1_star,
            average_quality = EXCLUDED.average_quality,
            average_professionalism = EXCLUDED.average_professionalism,
            average_cleanliness = EXCLUDED.average_cleanliness,
            average_value = EXCLUDED.average_value,
            response_rate = EXCLUDED.response_rate,
            last_updated = NOW();

        RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_stylist_ratings_insert ON reviews;
CREATE TRIGGER trigger_update_stylist_ratings_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_stylist_ratings();

DROP TRIGGER IF EXISTS trigger_update_stylist_ratings_update ON reviews;
CREATE TRIGGER trigger_update_stylist_ratings_update
    AFTER UPDATE ON reviews
    FOR EACH ROW
    WHEN (OLD.rating IS DISTINCT FROM NEW.rating OR
          OLD.is_visible IS DISTINCT FROM NEW.is_visible OR
          OLD.is_approved IS DISTINCT FROM NEW.is_approved)
    EXECUTE FUNCTION update_stylist_ratings();

DROP TRIGGER IF EXISTS trigger_update_stylist_ratings_delete ON reviews;
CREATE TRIGGER trigger_update_stylist_ratings_delete
    AFTER DELETE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_stylist_ratings();

-- Trigger to update review helpful counts
CREATE OR REPLACE FUNCTION update_review_helpful_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.is_helpful = true THEN
            UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = NEW.review_id;
        ELSE
            UPDATE reviews SET not_helpful_count = not_helpful_count + 1 WHERE id = NEW.review_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_helpful != NEW.is_helpful THEN
            IF NEW.is_helpful = true THEN
                UPDATE reviews SET helpful_count = helpful_count + 1, not_helpful_count = not_helpful_count - 1 WHERE id = NEW.review_id;
            ELSE
                UPDATE reviews SET helpful_count = helpful_count - 1, not_helpful_count = not_helpful_count + 1 WHERE id = NEW.review_id;
            END IF;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.is_helpful = true THEN
            UPDATE reviews SET helpful_count = helpful_count - 1 WHERE id = OLD.review_id;
        ELSE
            UPDATE reviews SET not_helpful_count = not_helpful_count - 1 WHERE id = OLD.review_id;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_helpful_counts ON review_helpful_votes;
CREATE TRIGGER trigger_update_helpful_counts
    AFTER INSERT OR UPDATE OR DELETE ON review_helpful_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_review_helpful_counts();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_review_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reviews_updated_at ON reviews;
CREATE TRIGGER trigger_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_review_timestamp();