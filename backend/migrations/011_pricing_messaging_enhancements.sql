-- Migration: Pricing ranges, messaging system, and video consultations
-- Created: 2025-10-08

BEGIN;

-- ==================== SERVICES PRICING ENHANCEMENT ====================

-- Add price range columns to services
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS price_min numeric(8,2),
  ADD COLUMN IF NOT EXISTS price_max numeric(8,2),
  ADD COLUMN IF NOT EXISTS price_type varchar(20) DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'range', 'consultation')),
  ADD COLUMN IF NOT EXISTS requires_consultation boolean DEFAULT false;

-- Migrate existing fixed prices to price_min (backwards compatible)
UPDATE services
SET
  price_min = price,
  price_max = price,
  price_type = 'fixed'
WHERE price_min IS NULL;

-- ==================== MESSAGING SYSTEM ====================

-- Create messages table for client-stylist communication
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id integer NOT NULL,
  sender_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamp without time zone,
  is_flagged boolean DEFAULT false,
  flagged_reason varchar(500),
  flagged_at timestamp without time zone,
  flagged_by integer REFERENCES users(id),
  contains_contact_info boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT NOW(),
  updated_at timestamp without time zone DEFAULT NOW(),
  CONSTRAINT message_not_empty CHECK (char_length(message_text) > 0),
  CONSTRAINT message_length_limit CHECK (char_length(message_text) <= 2000)
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  client_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stylist_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id integer REFERENCES bookings(id) ON DELETE SET NULL,
  last_message_at timestamp without time zone DEFAULT NOW(),
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT NOW(),
  updated_at timestamp without time zone DEFAULT NOW(),
  CONSTRAINT unique_client_stylist_conversation UNIQUE (client_id, stylist_id)
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_messages_flagged ON messages(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_conversations_client ON conversations(client_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_stylist ON conversations(stylist_id, last_message_at DESC);

-- ==================== RATE LIMITING ====================

-- Create message rate limiting table
CREATE TABLE IF NOT EXISTS message_rate_limits (
  id SERIAL PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  messages_sent_today integer DEFAULT 0,
  last_message_at timestamp without time zone DEFAULT NOW(),
  daily_limit integer DEFAULT 50,
  is_limited boolean DEFAULT false,
  limit_reason varchar(500),
  limited_until timestamp without time zone,
  created_at timestamp without time zone DEFAULT NOW(),
  updated_at timestamp without time zone DEFAULT NOW(),
  CONSTRAINT unique_user_rate_limit UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user ON message_rate_limits(user_id);

-- ==================== VIDEO CONSULTATIONS ====================

-- Create video consultations table
CREATE TABLE IF NOT EXISTS video_consultations (
  id SERIAL PRIMARY KEY,
  booking_id integer REFERENCES bookings(id) ON DELETE CASCADE,
  client_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stylist_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id integer REFERENCES conversations(id) ON DELETE SET NULL,
  scheduled_at timestamp without time zone NOT NULL,
  duration_minutes integer DEFAULT 15,
  status varchar(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  meeting_url varchar(500),
  meeting_id varchar(255),
  meeting_password varchar(100),
  notes text,
  final_price_quoted numeric(8,2),
  price_accepted boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT NOW(),
  updated_at timestamp without time zone DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_consultations_client ON video_consultations(client_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_consultations_stylist ON video_consultations(stylist_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_consultations_status ON video_consultations(status, scheduled_at);

-- ==================== CONTACT INFO DETECTION ====================

-- Create function to detect contact information in messages
CREATE OR REPLACE FUNCTION detect_contact_info(text_content text)
RETURNS boolean AS $$
BEGIN
  -- Check for phone numbers (various formats)
  IF text_content ~* '\d{10}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\+\d{1,3}[-.\s]?\d{10,}' THEN
    RETURN true;
  END IF;

  -- Check for email addresses
  IF text_content ~* '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' THEN
    RETURN true;
  END IF;

  -- Check for social media handles
  IF text_content ~* '@[a-zA-Z0-9_]{3,}|instagram|whatsapp|facebook|telegram|snapchat|tiktok' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to auto-detect contact info in messages
CREATE OR REPLACE FUNCTION check_message_contact_info()
RETURNS TRIGGER AS $$
BEGIN
  NEW.contains_contact_info := detect_contact_info(NEW.message_text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_message_contact_info
  BEFORE INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION check_message_contact_info();

-- ==================== SERVICE CATEGORIES ====================

-- Create service categories reference table
CREATE TABLE IF NOT EXISTS service_categories (
  id SERIAL PRIMARY KEY,
  name varchar(100) NOT NULL UNIQUE,
  name_es varchar(100) NOT NULL,
  description text,
  icon varchar(50),
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT NOW()
);

-- Insert standard beauty service categories
INSERT INTO service_categories (name, name_es, description, display_order) VALUES
  ('Color', 'Color', 'Hair coloring services including highlights, balayage, and full color', 1),
  ('Corte', 'Haircut', 'Hair cutting and styling services', 2),
  ('Tratamiento', 'Treatment', 'Hair treatments and deep conditioning', 3),
  ('Peinado', 'Styling', 'Hair styling and updos for special events', 4),
  ('Maquillaje', 'Makeup', 'Professional makeup services', 5),
  ('Paquete', 'Package', 'Service packages and bundles', 6),
  ('Uñas', 'Nails', 'Manicure, pedicure, and nail art services', 7),
  ('Cejas y Pestañas', 'Brows & Lashes', 'Eyebrow shaping, tinting, and lash extensions', 8),
  ('Depilación', 'Hair Removal', 'Waxing and hair removal services', 9),
  ('Facial', 'Facial', 'Skincare and facial treatments', 10),
  ('Masaje', 'Massage', 'Massage and relaxation services', 11),
  ('Otro', 'Other', 'Other beauty services', 99)
ON CONFLICT (name) DO NOTHING;

-- Create popular services template table
CREATE TABLE IF NOT EXISTS service_templates (
  id SERIAL PRIMARY KEY,
  category varchar(100) NOT NULL,
  name varchar(255) NOT NULL,
  name_es varchar(255) NOT NULL,
  description text,
  description_es text,
  typical_duration_min integer,
  typical_duration_max integer,
  typical_price_min numeric(8,2),
  typical_price_max numeric(8,2),
  is_popular boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT NOW()
);

-- Insert popular service templates
INSERT INTO service_templates (category, name, name_es, description_es, typical_duration_min, typical_duration_max, typical_price_min, typical_price_max, is_popular) VALUES
  ('Color', 'Balayage', 'Balayage', 'Técnica de iluminación manual con tonos naturales', 120, 240, 1500, 3000, true),
  ('Color', 'Highlights', 'Highlights', 'Iluminaciones tradicionales con folios', 90, 180, 1200, 2500, true),
  ('Color', 'Full Color', 'Color Completo', 'Color de raíz a puntas', 90, 150, 1000, 2000, true),
  ('Corte', 'Women''s Haircut', 'Corte de Cabello Mujer', 'Corte personalizado para mujer', 45, 90, 400, 1200, true),
  ('Corte', 'Men''s Haircut', 'Corte de Cabello Hombre', 'Corte para caballero', 30, 60, 250, 600, true),
  ('Tratamiento', 'Deep Conditioning', 'Hidratación Profunda', 'Tratamiento de hidratación intensiva', 30, 60, 400, 900, true),
  ('Tratamiento', 'Keratin Treatment', 'Tratamiento de Keratina', 'Alisado y reducción de frizz', 120, 240, 1500, 4000, true),
  ('Peinado', 'Blowout', 'Secado y Peinado', 'Secado profesional con plancha u ondas', 30, 60, 350, 800, true),
  ('Peinado', 'Bridal Hair', 'Peinado de Novia', 'Peinado especial para novias', 90, 180, 1500, 3500, true),
  ('Maquillaje', 'Social Makeup', 'Maquillaje Social', 'Maquillaje para eventos', 45, 90, 600, 1500, true),
  ('Maquillaje', 'Bridal Makeup', 'Maquillaje de Novia', 'Maquillaje de larga duración para novias', 60, 120, 1200, 2500, true),
  ('Uñas', 'Manicure', 'Manicure', 'Manicure básico o con diseño', 30, 60, 200, 600, true),
  ('Uñas', 'Pedicure', 'Pedicure', 'Pedicure spa', 45, 75, 300, 800, true),
  ('Cejas y Pestañas', 'Eyebrow Shaping', 'Diseño de Cejas', 'Depilación y diseño de cejas', 15, 30, 150, 400, true),
  ('Cejas y Pestañas', 'Lash Extensions', 'Extensiones de Pestañas', 'Aplicación de pestañas pelo por pelo', 90, 150, 800, 2000, true)
ON CONFLICT DO NOTHING;

COMMIT;
