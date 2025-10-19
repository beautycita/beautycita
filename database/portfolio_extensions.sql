-- Portfolio System Extensions for BeautyCita
-- Adds username system and enhanced stylist portfolio capabilities

-- Extend users table for username system and profile visibility
ALTER TABLE users ADD COLUMN username VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN profile_visibility VARCHAR(20) DEFAULT 'private' CHECK (profile_visibility IN ('private', 'public'));

-- Create unique index on username for fast lookups
CREATE UNIQUE INDEX idx_users_username ON users(username) WHERE username IS NOT NULL;

-- Extend stylists table for enhanced portfolio features
ALTER TABLE stylists ADD COLUMN brand_story TEXT;
ALTER TABLE stylists ADD COLUMN signature_styles TEXT[];
ALTER TABLE stylists ADD COLUMN portfolio_theme VARCHAR(50) DEFAULT 'minimal' CHECK (portfolio_theme IN ('minimal', 'modern', 'artistic'));
ALTER TABLE stylists ADD COLUMN custom_sections JSON;
ALTER TABLE stylists ADD COLUMN portfolio_published BOOLEAN DEFAULT FALSE;
ALTER TABLE stylists ADD COLUMN portfolio_views INTEGER DEFAULT 0;
ALTER TABLE stylists ADD COLUMN last_portfolio_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Create stylist work samples table for portfolio content
CREATE TABLE stylist_work_samples (
    id SERIAL PRIMARY KEY,
    stylist_id INTEGER REFERENCES stylists(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    service_category VARCHAR(100), -- e.g., 'haircut', 'coloring', 'styling'
    before_images TEXT[], -- Array of before image URLs
    after_images TEXT[], -- Array of after image URLs
    techniques_used TEXT[], -- Array of techniques like ['balayage', 'layered cut']
    products_used TEXT[], -- Array of products used
    client_hair_type VARCHAR(100), -- Optional client hair type info
    time_investment INTEGER, -- Minutes spent on this work
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    is_featured BOOLEAN DEFAULT FALSE, -- Featured work samples appear first
    display_order INTEGER DEFAULT 0, -- For custom ordering
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for work samples
CREATE INDEX idx_work_samples_stylist ON stylist_work_samples(stylist_id);
CREATE INDEX idx_work_samples_featured ON stylist_work_samples(stylist_id, is_featured, display_order);
CREATE INDEX idx_work_samples_category ON stylist_work_samples(service_category);
CREATE INDEX idx_work_samples_visible ON stylist_work_samples(stylist_id, is_visible, display_order);

-- Create portfolio analytics table for tracking views and engagement
CREATE TABLE portfolio_analytics (
    id SERIAL PRIMARY KEY,
    stylist_id INTEGER REFERENCES stylists(id) ON DELETE CASCADE,
    view_date DATE NOT NULL,
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    average_time_on_page INTEGER DEFAULT 0, -- in seconds
    bounce_rate DECIMAL(5,2) DEFAULT 0.00,
    referrer_sources JSON, -- {"direct": 10, "instagram": 5, "google": 3}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stylist_id, view_date)
);

-- Create portfolio sharing table for tracking shared links and QR codes
CREATE TABLE portfolio_shares (
    id SERIAL PRIMARY KEY,
    stylist_id INTEGER REFERENCES stylists(id) ON DELETE CASCADE,
    share_type VARCHAR(20) NOT NULL CHECK (share_type IN ('url', 'qr_code', 'pdf', 'social')),
    share_medium VARCHAR(50), -- e.g., 'instagram', 'whatsapp', 'email', 'print'
    share_count INTEGER DEFAULT 1,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reserved usernames table to prevent conflicts
CREATE TABLE reserved_usernames (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    reason VARCHAR(255), -- Why this username is reserved
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert common reserved usernames
INSERT INTO reserved_usernames (username, reason) VALUES
('admin', 'Administrative interface'),
('api', 'API endpoints'),
('www', 'Web subdomain'),
('app', 'Application routes'),
('mobile', 'Mobile app routes'),
('help', 'Help pages'),
('support', 'Support pages'),
('blog', 'Blog section'),
('about', 'About pages'),
('contact', 'Contact pages'),
('terms', 'Terms of service'),
('privacy', 'Privacy policy'),
('legal', 'Legal pages'),
('auth', 'Authentication routes'),
('login', 'Login pages'),
('register', 'Registration pages'),
('signup', 'Signup pages'),
('dashboard', 'Dashboard routes'),
('profile', 'Profile routes'),
('settings', 'Settings pages'),
('account', 'Account pages'),
('billing', 'Billing pages'),
('payment', 'Payment routes'),
('checkout', 'Checkout process'),
('book', 'Booking routes'),
('booking', 'Booking system'),
('search', 'Search functionality'),
('discover', 'Discovery pages'),
('explore', 'Explore pages'),
('stylists', 'Stylists listing'),
('services', 'Services pages'),
('reviews', 'Reviews system'),
('gallery', 'Gallery pages'),
('portfolio', 'Portfolio routes'),
('static', 'Static assets'),
('assets', 'Asset files'),
('images', 'Image assets'),
('css', 'Stylesheets'),
('js', 'JavaScript files'),
('fonts', 'Font files'),
('downloads', 'Download files'),
('uploads', 'Upload handling'),
('cdn', 'CDN routes'),
('mail', 'Email routes'),
('notifications', 'Notification system'),
('webhooks', 'Webhook endpoints'),
('robots', 'robots.txt'),
('sitemap', 'sitemap.xml'),
('favicon', 'favicon routes'),
('manifest', 'PWA manifest'),
('test', 'Testing routes'),
('dev', 'Development routes'),
('stage', 'Staging routes'),
('demo', 'Demo accounts'),
('example', 'Example content'),
('sample', 'Sample data'),
('beautycita', 'Brand name'),
('root', 'Root user'),
('system', 'System accounts'),
('null', 'Null values'),
('undefined', 'Undefined values'),
('anonymous', 'Anonymous users'),
('guest', 'Guest users'),
('public', 'Public content');

-- Create trigger to update stylist updated_at timestamp
CREATE OR REPLACE FUNCTION update_stylist_portfolio_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_portfolio_update = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stylist_portfolio_trigger
    BEFORE UPDATE ON stylists
    FOR EACH ROW
    WHEN (OLD.brand_story IS DISTINCT FROM NEW.brand_story OR
          OLD.signature_styles IS DISTINCT FROM NEW.signature_styles OR
          OLD.portfolio_theme IS DISTINCT FROM NEW.portfolio_theme OR
          OLD.custom_sections IS DISTINCT FROM NEW.custom_sections OR
          OLD.portfolio_published IS DISTINCT FROM NEW.portfolio_published)
    EXECUTE FUNCTION update_stylist_portfolio_timestamp();

-- Create trigger to update work samples updated_at timestamp
CREATE TRIGGER update_work_samples_updated_at
    BEFORE UPDATE ON stylist_work_samples
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate unique username suggestions
CREATE OR REPLACE FUNCTION generate_username_suggestions(base_name TEXT)
RETURNS TEXT[] AS $$
DECLARE
    suggestions TEXT[] := '{}';
    clean_name TEXT;
    i INTEGER := 1;
    candidate TEXT;
BEGIN
    -- Clean the base name (remove spaces, special chars, convert to lowercase)
    clean_name := lower(regexp_replace(base_name, '[^a-zA-Z0-9]', '', 'g'));

    -- Limit length to 30 characters
    IF length(clean_name) > 30 THEN
        clean_name := substring(clean_name, 1, 30);
    END IF;

    -- Add the clean base name as first suggestion
    IF NOT EXISTS (
        SELECT 1 FROM users WHERE username = clean_name
        UNION
        SELECT 1 FROM reserved_usernames WHERE username = clean_name
    ) THEN
        suggestions := array_append(suggestions, clean_name);
    END IF;

    -- Generate numbered variations
    WHILE array_length(suggestions, 1) < 5 AND i <= 999 LOOP
        candidate := clean_name || i::TEXT;

        IF NOT EXISTS (
            SELECT 1 FROM users WHERE username = candidate
            UNION
            SELECT 1 FROM reserved_usernames WHERE username = candidate
        ) THEN
            suggestions := array_append(suggestions, candidate);
        END IF;

        i := i + 1;
    END LOOP;

    RETURN suggestions;
END;
$$ LANGUAGE plpgsql;

-- Create function to check username availability
CREATE OR REPLACE FUNCTION is_username_available(check_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if username is reserved
    IF EXISTS (SELECT 1 FROM reserved_usernames WHERE username = lower(check_username)) THEN
        RETURN FALSE;
    END IF;

    -- Check if username is already taken
    IF EXISTS (SELECT 1 FROM users WHERE username = lower(check_username)) THEN
        RETURN FALSE;
    END IF;

    -- Check basic validation rules
    IF length(check_username) < 3 OR length(check_username) > 50 THEN
        RETURN FALSE;
    END IF;

    -- Must start with letter or number
    IF NOT (check_username ~ '^[a-zA-Z0-9]') THEN
        RETURN FALSE;
    END IF;

    -- Can only contain letters, numbers, underscores, hyphens
    IF NOT (check_username ~ '^[a-zA-Z0-9_-]+$') THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;