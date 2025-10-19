-- BeautyCita Database Schema
-- Beauty booking platform connecting clients with stylists

-- Users table with role-based access
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL for OAuth users
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    profile_picture_url TEXT,
    role VARCHAR(20) NOT NULL CHECK (role IN ('CLIENT', 'STYLIST', 'ADMIN')),
    provider VARCHAR(20) DEFAULT 'local' CHECK (provider IN ('local', 'google')),
    provider_id VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stylist profiles and business information
CREATE TABLE stylists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    bio TEXT,
    specialties TEXT[], -- Array of specialties like ['haircuts', 'coloring', 'styling']
    experience_years INTEGER,
    location_address TEXT,
    location_city VARCHAR(100),
    location_state VARCHAR(50),
    location_zip VARCHAR(20),
    location_coordinates POINT, -- For geo-based search
    pricing_tier VARCHAR(20) CHECK (pricing_tier IN ('BUDGET', 'MID_RANGE', 'PREMIUM', 'LUXURY')),
    base_price_range VARCHAR(50), -- e.g., "$50-100"
    portfolio_images TEXT[], -- Array of image URLs
    social_media_links JSON, -- {"instagram": "url", "tiktok": "url"}
    certifications TEXT[],
    working_hours JSON, -- {"monday": {"start": "09:00", "end": "17:00"}, ...}
    is_verified BOOLEAN DEFAULT FALSE,
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Services offered by stylists
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    stylist_id INTEGER REFERENCES stylists(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- e.g., "Women's Haircut", "Full Color", "Highlights"
    description TEXT,
    category VARCHAR(100) NOT NULL, -- e.g., "HAIRCUT", "COLOR", "STYLING", "TREATMENTS"
    duration_minutes INTEGER NOT NULL, -- Service duration
    price DECIMAL(8,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Client booking appointments
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stylist_id INTEGER REFERENCES stylists(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    total_price DECIMAL(8,2) NOT NULL,
    notes TEXT, -- Special requests from client
    stylist_notes TEXT, -- Internal notes from stylist
    cancellation_reason TEXT,
    cancelled_by INTEGER REFERENCES users(id),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment transactions
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    amount DECIMAL(8,2) NOT NULL,
    platform_fee DECIMAL(8,2) NOT NULL, -- Commission taken by platform
    stylist_payout DECIMAL(8,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED')),
    payment_method VARCHAR(50), -- e.g., 'card', 'apple_pay'
    refund_amount DECIMAL(8,2) DEFAULT 0.00,
    refund_reason TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reviews and ratings
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stylist_id INTEGER REFERENCES stylists(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    review_text TEXT,
    before_images TEXT[], -- Before photos
    after_images TEXT[], -- After photos
    is_verified BOOLEAN DEFAULT FALSE, -- Verified as legitimate booking
    is_featured BOOLEAN DEFAULT FALSE, -- Featured review
    stylist_response TEXT, -- Optional response from stylist
    stylist_response_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications for users
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- e.g., 'BOOKING_CONFIRMED', 'PAYMENT_RECEIVED', 'REVIEW_RECEIVED'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_booking_id INTEGER REFERENCES bookings(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Favorites/saved stylists for clients
CREATE TABLE client_favorites (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    stylist_id INTEGER REFERENCES stylists(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, stylist_id)
);

-- Stylist availability/blocked times
CREATE TABLE stylist_availability (
    id SERIAL PRIMARY KEY,
    stylist_id INTEGER REFERENCES stylists(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE, -- FALSE for blocked times
    reason VARCHAR(255), -- Optional reason for blocking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_stylists_location ON stylists USING GIST(location_coordinates);
CREATE INDEX idx_stylists_city ON stylists(location_city);
CREATE INDEX idx_stylists_specialties ON stylists USING GIN(specialties);
CREATE INDEX idx_services_stylist ON services(stylist_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_stylist ON bookings(stylist_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_reviews_stylist ON reviews(stylist_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_availability_stylist_date ON stylist_availability(stylist_id, date);

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stylists_updated_at BEFORE UPDATE ON stylists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update stylist ratings
CREATE OR REPLACE FUNCTION update_stylist_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE stylists
    SET
        rating_average = (
            SELECT ROUND(AVG(rating)::numeric, 2)
            FROM reviews
            WHERE stylist_id = NEW.stylist_id
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM reviews
            WHERE stylist_id = NEW.stylist_id
        )
    WHERE id = NEW.stylist_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stylist_rating_trigger
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_stylist_rating();