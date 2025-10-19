-- BeautyCita Complete Database Schema
-- Production-ready beauty booking platform

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table with comprehensive role management
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    profile_picture_url TEXT,
    role VARCHAR(20) NOT NULL CHECK (role IN ('CLIENT', 'STYLIST', 'ADMIN')),
    provider VARCHAR(20) DEFAULT 'local' CHECK (provider IN ('local', 'google')),
    provider_id VARCHAR(255),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    language_preference VARCHAR(5) DEFAULT 'es-MX',
    timezone VARCHAR(50) DEFAULT 'America/Mexico_City',
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Client profiles
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender VARCHAR(20),
    skin_type VARCHAR(50),
    hair_type VARCHAR(50),
    preferred_styles TEXT[],
    budget_range VARCHAR(20) CHECK (budget_range IN ('BUDGET', 'MID_RANGE', 'PREMIUM', 'LUXURY')),
    location_address TEXT,
    location_city VARCHAR(100),
    location_state VARCHAR(50),
    location_coordinates POINT,
    notification_preferences JSON DEFAULT '{"email": true, "sms": true, "push": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stylist profiles with comprehensive business information
CREATE TABLE stylists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    bio TEXT,
    specialties TEXT[],
    experience_years INTEGER,
    education TEXT[],
    certifications TEXT[],
    location_address TEXT,
    location_city VARCHAR(100),
    location_state VARCHAR(50),
    location_zip VARCHAR(20),
    location_coordinates POINT,
    service_radius_km INTEGER DEFAULT 25,
    pricing_tier VARCHAR(20) CHECK (pricing_tier IN ('BUDGET', 'MID_RANGE', 'PREMIUM', 'LUXURY')),
    base_price_range VARCHAR(50),
    portfolio_images TEXT[],
    social_media_links JSON,
    working_hours JSON,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP WITH TIME ZONE,
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0.00,
    stripe_account_id VARCHAR(255),
    is_accepting_bookings BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Service categories
CREATE TABLE service_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    name_es VARCHAR(100) NOT NULL,
    description TEXT,
    description_es TEXT,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Services offered by stylists
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stylist_id UUID REFERENCES stylists(id) ON DELETE CASCADE,
    category_id UUID REFERENCES service_categories(id),
    name VARCHAR(255) NOT NULL,
    name_es VARCHAR(255) NOT NULL,
    description TEXT,
    description_es TEXT,
    duration_minutes INTEGER NOT NULL,
    price DECIMAL(8,2) NOT NULL,
    is_addon BOOLEAN DEFAULT FALSE,
    requires_consultation BOOLEAN DEFAULT FALSE,
    preparation_time_minutes INTEGER DEFAULT 0,
    cleanup_time_minutes INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stylist availability
CREATE TABLE availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stylist_id UUID REFERENCES stylists(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Special availability/unavailability periods
CREATE TABLE availability_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stylist_id UUID REFERENCES stylists(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT FALSE, -- FALSE = unavailable, TRUE = special availability
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id),
    stylist_id UUID REFERENCES stylists(id),
    service_id UUID REFERENCES services(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    total_price DECIMAL(8,2) NOT NULL,
    commission_rate DECIMAL(5,4) DEFAULT 0.15, -- 15% default commission
    commission_amount DECIMAL(8,2),
    notes TEXT,
    special_requests TEXT,
    cancellation_reason TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    confirmation_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Booking add-ons
CREATE TABLE booking_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id),
    price DECIMAL(8,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id),
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    amount DECIMAL(8,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MXN',
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED')),
    payment_method VARCHAR(50),
    failure_reason TEXT,
    refund_amount DECIMAL(8,2) DEFAULT 0.00,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Stylist payouts
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stylist_id UUID REFERENCES stylists(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_earnings DECIMAL(10,2) NOT NULL,
    commission_deducted DECIMAL(10,2) NOT NULL,
    net_payout DECIMAL(10,2) NOT NULL,
    stripe_transfer_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Reviews and ratings
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id),
    client_id UUID REFERENCES clients(id),
    stylist_id UUID REFERENCES stylists(id),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    response_from_stylist TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat conversations (RASA integration)
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(255) NOT NULL,
    intent VARCHAR(100),
    confidence DECIMAL(5,4),
    message_count INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) CHECK (sender_type IN ('USER', 'BOT')),
    message_text TEXT NOT NULL,
    message_data JSON,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    is_read BOOLEAN DEFAULT FALSE,
    sent_via JSON DEFAULT '{"email": false, "sms": false, "push": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System settings
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_stylists_location ON stylists USING GIST(location_coordinates);
CREATE INDEX idx_stylists_city ON stylists(location_city);
CREATE INDEX idx_stylists_verified ON stylists(is_verified) WHERE is_verified = true;
CREATE INDEX idx_services_stylist ON services(stylist_id);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_active ON services(is_active) WHERE is_active = true;
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_stylist ON bookings(stylist_id);
CREATE INDEX idx_bookings_date ON bookings(appointment_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_reviews_stylist ON reviews(stylist_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stylists_updated_at BEFORE UPDATE ON stylists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default service categories
INSERT INTO service_categories (name, name_es, description, description_es, icon, sort_order) VALUES
('Hair Cut & Style', 'Corte y Peinado', 'Professional hair cutting and styling services', 'Servicios profesionales de corte y peinado', 'scissors', 1),
('Hair Color', 'Coloración', 'Hair coloring, highlights, and color treatments', 'Coloración, mechas y tratamientos de color', 'palette', 2),
('Hair Treatment', 'Tratamiento Capilar', 'Deep conditioning, keratin, and hair recovery treatments', 'Acondicionamiento profundo, keratina y tratamientos de recuperación', 'droplets', 3),
('Manicure & Pedicure', 'Manicura y Pedicura', 'Complete nail care and design services', 'Servicios completos de cuidado y diseño de uñas', 'hand', 4),
('Facial Treatments', 'Tratamientos Faciales', 'Skincare, cleansing, and facial rejuvenation', 'Cuidado de la piel, limpieza y rejuvenecimiento facial', 'user', 5),
('Makeup', 'Maquillaje', 'Professional makeup for events and occasions', 'Maquillaje profesional para eventos y ocasiones', 'eye', 6),
('Eyebrows & Lashes', 'Cejas y Pestañas', 'Eyebrow shaping, lash extensions, and treatments', 'Diseño de cejas, extensiones de pestañas y tratamientos', 'eye', 7),
('Body Treatments', 'Tratamientos Corporales', 'Massages, body wraps, and wellness treatments', 'Masajes, envolturas corporales y tratamientos de bienestar', 'heart', 8);

-- Insert system settings
INSERT INTO system_settings (key, value, description) VALUES
('platform_commission_rate', '0.15', 'Default platform commission rate (15%)'),
('booking_advance_days', '60', 'Maximum days in advance for bookings'),
('cancellation_hours', '24', 'Minimum hours before appointment for free cancellation'),
('review_deadline_hours', '168', 'Hours after service completion to leave a review (7 days)'),
('payout_schedule', 'weekly', 'Stylist payout schedule (weekly, biweekly, monthly)'),
('min_booking_duration', '30', 'Minimum booking duration in minutes'),
('max_booking_duration', '480', 'Maximum booking duration in minutes (8 hours)');