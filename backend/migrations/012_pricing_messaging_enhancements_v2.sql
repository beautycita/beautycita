-- Migration: Pricing ranges, messaging enhancements, and video consultations
-- Created: 2025-10-08
-- Works with existing messaging system

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

COMMENT ON COLUMN services.price_type IS 'fixed: single price, range: from-to pricing, consultation: requires video consultation for quote';
COMMENT ON COLUMN services.requires_consultation IS 'If true, client must schedule video consultation before booking';

-- ==================== MESSAGING ENHANCEMENTS ====================

-- Add contact info detection columns to existing messages table
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS contains_contact_info boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS flagged_reason varchar(500),
  ADD COLUMN IF NOT EXISTS flagged_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS flagged_by integer REFERENCES users(id);

-- Create indexes for flagged messages
CREATE INDEX IF NOT EXISTS idx_messages_flagged ON messages(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_messages_contact_info ON messages(contains_contact_info) WHERE contains_contact_info = true;

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
CREATE INDEX IF NOT EXISTS idx_rate_limits_limited ON message_rate_limits(is_limited) WHERE is_limited = true;

COMMENT ON TABLE message_rate_limits IS 'Prevents spam and encourages quality communication';

-- ==================== VIDEO CONSULTATIONS ====================

-- Create video consultations table
CREATE TABLE IF NOT EXISTS video_consultations (
  id SERIAL PRIMARY KEY,
  booking_id integer REFERENCES bookings(id) ON DELETE CASCADE,
  client_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stylist_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id integer REFERENCES conversations(id) ON DELETE SET NULL,
  service_id integer REFERENCES services(id) ON DELETE SET NULL,
  scheduled_at timestamp without time zone NOT NULL,
  duration_minutes integer DEFAULT 15,
  status varchar(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  meeting_url varchar(500),
  meeting_id varchar(255),
  meeting_password varchar(100),
  notes text,
  final_price_quoted numeric(8,2),
  price_accepted boolean DEFAULT false,
  price_accepted_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT NOW(),
  updated_at timestamp without time zone DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_consultations_client ON video_consultations(client_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_consultations_stylist ON video_consultations(stylist_id, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_consultations_status ON video_consultations(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_video_consultations_upcoming ON video_consultations(scheduled_at) WHERE status = 'scheduled';

COMMENT ON TABLE video_consultations IS 'Video calls for price consultation and client consultation';

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

  -- Check for social media handles/keywords
  IF text_content ~* '@[a-zA-Z0-9_]{3,}|instagram\.com|whatsapp|facebook\.com|telegram|snapchat|tiktok\.com|wa\.me' THEN
    RETURN true;
  END IF;

  -- Check for common phrases used to share contact info
  IF text_content ~* 'agregame|añádeme|búscame|contactame|escríbeme|llámame|mándame|envíame' THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to auto-detect contact info in messages
CREATE OR REPLACE FUNCTION check_message_contact_info()
RETURNS TRIGGER AS $$
BEGIN
  NEW.contains_contact_info := detect_contact_info(NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_message_contact_info ON messages;
CREATE TRIGGER trigger_check_message_contact_info
  BEFORE INSERT OR UPDATE OF content ON messages
  FOR EACH ROW
  EXECUTE FUNCTION check_message_contact_info();

-- ==================== SERVICE CATEGORIES ====================

-- Create service categories reference table
CREATE TABLE IF NOT EXISTS service_categories (
  id SERIAL PRIMARY KEY,
  name varchar(100) NOT NULL UNIQUE,
  name_es varchar(100) NOT NULL,
  description text,
  description_es text,
  icon varchar(50),
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_categories_active ON service_categories(is_active, display_order) WHERE is_active = true;

-- Insert standard beauty service categories
INSERT INTO service_categories (name, name_es, description_es, icon, display_order) VALUES
  ('Color', 'Color', 'Servicios de coloración capilar incluyendo mechas, balayage, y color completo', 'palette', 1),
  ('Corte', 'Corte', 'Servicios de corte y estilizado de cabello', 'scissors', 2),
  ('Tratamiento', 'Tratamiento', 'Tratamientos capilares y acondicionamiento profundo', 'sparkles', 3),
  ('Peinado', 'Peinado', 'Peinados y recogidos para eventos especiales', 'wand', 4),
  ('Maquillaje', 'Maquillaje', 'Servicios profesionales de maquillaje', 'makeup', 5),
  ('Paquete', 'Paquete', 'Paquetes y combos de servicios', 'gift', 6),
  ('Uñas', 'Uñas', 'Manicure, pedicure y arte de uñas', 'hand', 7),
  ('Cejas y Pestañas', 'Cejas y Pestañas', 'Diseño de cejas, tinte y extensiones de pestañas', 'eye', 8),
  ('Depilación', 'Depilación', 'Servicios de depilación con cera', 'leaf', 9),
  ('Facial', 'Facial', 'Tratamientos faciales y cuidado de la piel', 'face', 10),
  ('Masaje', 'Masaje', 'Servicios de masaje y relajación', 'hand', 11),
  ('Otro', 'Otro', 'Otros servicios de belleza', 'star', 99)
ON CONFLICT (name) DO UPDATE SET
  name_es = EXCLUDED.name_es,
  description_es = EXCLUDED.description_es,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order;

-- Create popular services template table
CREATE TABLE IF NOT EXISTS service_templates (
  id SERIAL PRIMARY KEY,
  category varchar(100) NOT NULL REFERENCES service_categories(name) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  name_es varchar(255) NOT NULL,
  description text,
  description_es text,
  typical_duration_min integer,
  typical_duration_max integer,
  typical_price_min numeric(8,2),
  typical_price_max numeric(8,2),
  is_popular boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_templates_category ON service_templates(category, is_popular DESC, usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_service_templates_popular ON service_templates(is_popular, usage_count DESC) WHERE is_popular = true;

COMMENT ON TABLE service_templates IS 'Popular service templates to help stylists avoid duplication and maintain consistency';

-- Insert popular service templates
INSERT INTO service_templates (category, name, name_es, description_es, typical_duration_min, typical_duration_max, typical_price_min, typical_price_max, is_popular) VALUES
  ('Color', 'Balayage', 'Balayage', 'Técnica de iluminación manual con tonos naturales. Incluye tóner y tratamiento.', 120, 240, 1500, 3000, true),
  ('Color', 'Highlights', 'Highlights', 'Iluminaciones tradicionales con folios. Incluye tóner personalizado.', 90, 180, 1200, 2500, true),
  ('Color', 'Full Color', 'Color Completo', 'Color de raíz a puntas con tóner personalizado.', 90, 150, 1000, 2000, true),
  ('Color', 'Root Touch-up', 'Retoque de Raíz', 'Aplicación de color solo en raíz para cubrir canas.', 60, 90, 600, 1200, true),
  ('Color', 'Ombre', 'Ombre', 'Degradado de color de raíces oscuras a puntas claras.', 120, 180, 1500, 2800, true),
  ('Corte', 'Women''s Haircut', 'Corte de Cabello Mujer', 'Corte personalizado según tu estilo. Incluye lavado y secado.', 45, 90, 400, 1200, true),
  ('Corte', 'Men''s Haircut', 'Corte de Cabello Hombre', 'Corte para caballero con acabado profesional.', 30, 60, 250, 600, true),
  ('Corte', 'Kids Haircut', 'Corte Infantil', 'Corte de cabello para niños.', 20, 40, 200, 400, true),
  ('Corte', 'Bangs Trim', 'Corte de Fleco', 'Retoque de fleco únicamente.', 15, 20, 100, 250, true),
  ('Tratamiento', 'Deep Conditioning', 'Hidratación Profunda', 'Tratamiento de hidratación intensiva para cabello seco o dañado.', 30, 60, 400, 900, true),
  ('Tratamiento', 'Keratin Treatment', 'Tratamiento de Keratina', 'Alisado y reducción de frizz que dura 2-4 meses.', 120, 240, 1500, 4000, true),
  ('Tratamiento', 'Hair Botox', 'Botox Capilar', 'Tratamiento de reconstrucción y nutrición profunda.', 90, 150, 1200, 2500, true),
  ('Tratamiento', 'Scalp Treatment', 'Tratamiento de Cuero Cabelludo', 'Tratamiento especializado para cuero cabelludo sensible o con caspa.', 30, 45, 400, 800, true),
  ('Peinado', 'Blowout', 'Secado y Peinado', 'Secado profesional con plancha u ondas.', 30, 60, 350, 800, true),
  ('Peinado', 'Bridal Hair', 'Peinado de Novia', 'Peinado especial para novias con prueba previa.', 90, 180, 1500, 3500, true),
  ('Peinado', 'Updo', 'Recogido', 'Recogido elegante para eventos especiales.', 60, 90, 800, 1500, true),
  ('Peinado', 'Special Event Hair', 'Peinado para Evento', 'Peinado para graduaciones, fiestas o eventos.', 45, 75, 600, 1200, true),
  ('Maquillaje', 'Social Makeup', 'Maquillaje Social', 'Maquillaje para eventos diurnos o nocturnos.', 45, 90, 600, 1500, true),
  ('Maquillaje', 'Bridal Makeup', 'Maquillaje de Novia', 'Maquillaje de larga duración con prueba previa.', 60, 120, 1200, 2500, true),
  ('Maquillaje', 'Editorial Makeup', 'Maquillaje Editorial', 'Maquillaje artístico para sesiones fotográficas.', 90, 120, 1500, 2500, true),
  ('Maquillaje', 'Natural Makeup', 'Maquillaje Natural', 'Maquillaje ligero para look diario mejorado.', 30, 45, 500, 900, true),
  ('Uñas', 'Manicure', 'Manicure', 'Manicure básico con esmaltado regular o semipermanente.', 30, 60, 200, 600, true),
  ('Uñas', 'Pedicure', 'Pedicure', 'Pedicure spa con exfoliación y masaje.', 45, 75, 300, 800, true),
  ('Uñas', 'Gel Nails', 'Uñas de Gel', 'Aplicación de uñas de gel con diseño.', 60, 90, 500, 1200, true),
  ('Uñas', 'Nail Art', 'Arte de Uñas', 'Diseños personalizados de uñas.', 45, 90, 400, 1000, true),
  ('Cejas y Pestañas', 'Eyebrow Shaping', 'Diseño de Cejas', 'Depilación y diseño de cejas con hilo o cera.', 15, 30, 150, 400, true),
  ('Cejas y Pestañas', 'Eyebrow Tinting', 'Tinte de Cejas', 'Tinte semipermanente para cejas.', 15, 25, 200, 400, true),
  ('Cejas y Pestañas', 'Lash Extensions', 'Extensiones de Pestañas', 'Aplicación de pestañas pelo por pelo. Duración 3-4 semanas.', 90, 150, 800, 2000, true),
  ('Cejas y Pestañas', 'Lash Lift', 'Lifting de Pestañas', 'Rizado y tinte de pestañas naturales.', 45, 60, 500, 900, true),
  ('Depilación', 'Full Legs Wax', 'Depilación Piernas Completas', 'Depilación con cera de piernas completas.', 30, 45, 400, 800, true),
  ('Depilación', 'Brazilian Wax', 'Depilación Brasileña', 'Depilación íntima completa con cera.', 30, 45, 500, 900, true),
  ('Depilación', 'Full Face Wax', 'Depilación Facial Completa', 'Depilación facial incluyendo cejas, labio, barbilla.', 20, 30, 300, 600, true),
  ('Facial', 'Basic Facial', 'Facial Básico', 'Limpieza facial profunda con extracción.', 45, 60, 500, 1000, true),
  ('Facial', 'Anti-Aging Facial', 'Facial Anti-Edad', 'Tratamiento facial con productos anti-edad.', 60, 90, 800, 1500, true),
  ('Facial', 'Hydrating Facial', 'Facial Hidratante', 'Tratamiento facial de hidratación profunda.', 45, 60, 600, 1200, true),
  ('Masaje', 'Relaxation Massage', 'Masaje Relajante', 'Masaje de cuerpo completo para relajación.', 60, 90, 800, 1500, true),
  ('Masaje', 'Hot Stone Massage', 'Masaje con Piedras Calientes', 'Masaje terapéutico con piedras volcánicas.', 60, 90, 1000, 1800, true)
ON CONFLICT DO NOTHING;

-- ==================== HELPER VIEWS ====================

-- View to get stylist's services with category info
CREATE OR REPLACE VIEW stylist_services_with_category AS
SELECT
  s.id,
  s.stylist_id,
  s.name,
  s.description,
  s.category,
  s.duration_minutes,
  s.price,
  s.price_min,
  s.price_max,
  s.price_type,
  s.requires_consultation,
  s.is_active,
  sc.name_es as category_name_es,
  sc.icon as category_icon,
  sc.display_order as category_order
FROM services s
LEFT JOIN service_categories sc ON s.category = sc.name
WHERE s.is_active = true;

COMMENT ON VIEW stylist_services_with_category IS 'Services with enriched category information';

COMMIT;
