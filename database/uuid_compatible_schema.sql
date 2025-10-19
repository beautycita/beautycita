-- BeautyCita Database Schema with UUID Support
-- Beauty booking platform connecting clients with stylists
-- Updated for time-sensitive booking system compatibility

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with UUID and enhanced registration fields
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL for OAuth users
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    profile_image_url TEXT,
    role VARCHAR(20) NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'stylist', 'admin')),
    provider VARCHAR(20) DEFAULT 'local' CHECK (provider IN ('local', 'google')),
    provider_id VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    phone_verified BOOLEAN DEFAULT FALSE,
    phone_verified_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    language_preference VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'America/Mexico_City',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stylist profiles and business information
CREATE TABLE stylist_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    bio TEXT,
    specialties JSONB, -- Array of specialties as JSON
    experience_years INTEGER DEFAULT 0,
    location_address TEXT,
    location_city VARCHAR(100),
    location_state VARCHAR(50),
    location_zip VARCHAR(20),
    location_coordinates POINT, -- For geo-based search
    pricing_tier VARCHAR(20) CHECK (pricing_tier IN ('BUDGET', 'MID_RANGE', 'PREMIUM', 'LUXURY')),
    base_price_range VARCHAR(50), -- e.g., "$50-100"
    portfolio_images TEXT[], -- Array of image URLs
    social_media_links JSONB, -- {"instagram": "url", "tiktok": "url"}
    certifications TEXT[],
    working_hours JSONB, -- {"monday": {"start": "09:00", "end": "17:00"}, ...}
    is_verified BOOLEAN DEFAULT FALSE,
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Services offered by stylists
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stylist_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Reference to user, not stylist_profiles
    name VARCHAR(255) NOT NULL, -- e.g., "Women's Haircut", "Full Color", "Highlights"
    description TEXT,
    category VARCHAR(100), -- e.g., "HAIRCUT", "COLOR", "STYLING", "TREATMENTS"
    duration INTEGER NOT NULL, -- Duration in minutes
    price INTEGER NOT NULL, -- Price in cents
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Client booking appointments with time-sensitive workflow
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stylist_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verify_acceptance', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show', 'expired', 'paid_confirmed')),
    total_price_cents INTEGER NOT NULL, -- Price in cents
    notes TEXT, -- Special requests from client
    stylist_notes TEXT, -- Internal notes from stylist
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES users(id),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    -- Time-sensitive booking fields
    request_expires_at TIMESTAMP WITH TIME ZONE,
    acceptance_expires_at TIMESTAMP WITH TIME ZONE,
    last_status_change TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment transactions
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    amount_cents INTEGER NOT NULL, -- Amount in cents
    platform_fee_cents INTEGER NOT NULL, -- Commission in cents
    stylist_payout_cents INTEGER NOT NULL, -- Payout in cents
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded')),
    payment_method VARCHAR(50), -- e.g., 'card', 'apple_pay'
    refund_amount_cents INTEGER DEFAULT 0,
    refund_reason TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reviews and ratings
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stylist_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- e.g., 'BOOKING_CONFIRMED', 'PAYMENT_RECEIVED', 'REVIEW_RECEIVED'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_booking_id UUID REFERENCES bookings(id),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Favorites/saved stylists for clients
CREATE TABLE client_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stylist_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_id, stylist_id)
);

-- Stylist availability/blocked times
CREATE TABLE stylist_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stylist_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_stylist_profiles_user ON stylist_profiles(user_id);
CREATE INDEX idx_stylist_profiles_location ON stylist_profiles USING GIST(location_coordinates) WHERE location_coordinates IS NOT NULL;
CREATE INDEX idx_stylist_profiles_city ON stylist_profiles(location_city);
CREATE INDEX idx_stylist_profiles_specialties ON stylist_profiles USING GIN(specialties) WHERE specialties IS NOT NULL;
CREATE INDEX idx_services_stylist ON services(stylist_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_stylist ON bookings(stylist_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_expires_at ON bookings(request_expires_at) WHERE request_expires_at IS NOT NULL;
CREATE INDEX idx_bookings_acceptance_expires ON bookings(acceptance_expires_at) WHERE acceptance_expires_at IS NOT NULL;
CREATE INDEX idx_bookings_status_created ON bookings(status, created_at);
CREATE INDEX idx_bookings_expiration_check ON bookings(status, request_expires_at, acceptance_expires_at);
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

CREATE TRIGGER update_stylist_profiles_updated_at BEFORE UPDATE ON stylist_profiles
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
    UPDATE stylist_profiles
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
    WHERE user_id = NEW.stylist_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stylist_rating_trigger
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_stylist_rating();