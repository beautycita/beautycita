-- Migration: Pricing ranges, messaging enhancements (simplified)
-- Created: 2025-10-08

BEGIN;

-- ==================== SERVICES PRICING ENHANCEMENT ====================

ALTER TABLE services
  ADD COLUMN IF NOT EXISTS price_min numeric(8,2),
  ADD COLUMN IF NOT EXISTS price_max numeric(8,2),
  ADD COLUMN IF NOT EXISTS price_type varchar(20) DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS requires_consultation boolean DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'services_price_type_check') THEN
    ALTER TABLE services ADD CONSTRAINT services_price_type_check
      CHECK (price_type IN ('fixed', 'range', 'consultation'));
  END IF;
END$$;

UPDATE services
SET
  price_min = price,
  price_max = price,
  price_type = 'fixed'
WHERE price_min IS NULL;

-- ==================== MESSAGING ENHANCEMENTS ====================

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS contains_contact_info boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS flagged_reason varchar(500),
  ADD COLUMN IF NOT EXISTS flagged_at timestamp without time zone,
  ADD COLUMN IF NOT EXISTS flagged_by integer;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_flagged_by_fkey') THEN
    ALTER TABLE messages ADD CONSTRAINT messages_flagged_by_fkey
      FOREIGN KEY (flagged_by) REFERENCES users(id);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_messages_flagged ON messages(is_flagged) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_messages_contact_info ON messages(contains_contact_info) WHERE contains_contact_info = true;

-- ==================== RATE LIMITING ====================

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
  updated_at timestamp without time zone DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_rate_limit') THEN
    ALTER TABLE message_rate_limits ADD CONSTRAINT unique_user_rate_limit UNIQUE (user_id);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_rate_limits_user ON message_rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_limited ON message_rate_limits(is_limited) WHERE is_limited = true;

-- ==================== VIDEO CONSULTATIONS ENHANCEMENTS ====================

ALTER TABLE video_consultations
  ADD COLUMN IF NOT EXISTS service_id integer,
  ADD COLUMN IF NOT EXISTS conversation_id integer,
  ADD COLUMN IF NOT EXISTS final_price_quoted numeric(8,2),
  ADD COLUMN IF NOT EXISTS price_accepted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_accepted_at timestamp without time zone;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_consultations_service_id_fkey') THEN
    ALTER TABLE video_consultations ADD CONSTRAINT video_consultations_service_id_fkey
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_consultations_conversation_id_fkey') THEN
    ALTER TABLE video_consultations ADD CONSTRAINT video_consultations_conversation_id_fkey
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;
  END IF;
END$$;

-- ==================== CONTACT INFO DETECTION ====================

CREATE OR REPLACE FUNCTION detect_contact_info(text_content text)
RETURNS boolean AS $$
BEGIN
  IF text_content ~* '\d{10}|\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\+\d{1,3}[-.\s]?\d{10,}' THEN
    RETURN true;
  END IF;
  IF text_content ~* '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' THEN
    RETURN true;
  END IF;
  IF text_content ~* '@[a-zA-Z0-9_]{3,}|instagram\.com|whatsapp|facebook\.com|telegram|snapchat|tiktok\.com|wa\.me' THEN
    RETURN true;
  END IF;
  IF text_content ~* 'agregame|añádeme|búscame|contactame|escríbeme|llámame|mándame|envíame' THEN
    RETURN true;
  END IF;
  RETURN false;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

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

-- ==================== SERVICE CATEGORIES ENHANCEMENTS ====================

ALTER TABLE service_categories
  ADD COLUMN IF NOT EXISTS name_es varchar(100),
  ADD COLUMN IF NOT EXISTS description_es text;

UPDATE service_categories SET name_es = name WHERE name_es IS NULL;

-- ==================== SERVICE TEMPLATES ====================

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
  usage_count integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_templates_category ON service_templates(category, is_popular DESC, usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_service_templates_popular ON service_templates(is_popular, usage_count DESC) WHERE is_popular = true;

INSERT INTO service_templates (category, name, name_es, description_es, typical_duration_min, typical_duration_max, typical_price_min, typical_price_max, is_popular)
SELECT * FROM (VALUES
  ('Color', 'Balayage', 'Balayage', 'Técnica de iluminación manual con tonos naturales. Incluye tóner y tratamiento.', 120, 240, 1500, 3000, true),
  ('Color', 'Highlights', 'Highlights', 'Iluminaciones tradicionales con folios. Incluye tóner personalizado.', 90, 180, 1200, 2500, true),
  ('Color', 'Full Color', 'Color Completo', 'Color de raíz a puntas con tóner personalizado.', 90, 150, 1000, 2000, true),
  ('Corte', 'Women''s Haircut', 'Corte de Cabello Mujer', 'Corte personalizado según tu estilo. Incluye lavado y secado.', 45, 90, 400, 1200, true),
  ('Corte', 'Men''s Haircut', 'Corte de Cabello Hombre', 'Corte para caballero con acabado profesional.', 30, 60, 250, 600, true),
  ('Tratamiento', 'Deep Conditioning', 'Hidratación Profunda', 'Tratamiento de hidratación intensiva para cabello seco o dañado.', 30, 60, 400, 900, true),
  ('Tratamiento', 'Keratin Treatment', 'Tratamiento de Keratina', 'Alisado y reducción de frizz que dura 2-4 meses.', 120, 240, 1500, 4000, true),
  ('Peinado', 'Blowout', 'Secado y Peinado', 'Secado profesional con plancha u ondas.', 30, 60, 350, 800, true),
  ('Peinado', 'Bridal Hair', 'Peinado de Novia', 'Peinado especial para novias con prueba previa.', 90, 180, 1500, 3500, true),
  ('Maquillaje', 'Social Makeup', 'Maquillaje Social', 'Maquillaje para eventos diurnos o nocturnos.', 45, 90, 600, 1500, true),
  ('Maquillaje', 'Bridal Makeup', 'Maquillaje de Novia', 'Maquillaje de larga duración con prueba previa.', 60, 120, 1200, 2500, true),
  ('Uñas', 'Manicure', 'Manicure', 'Manicure básico con esmaltado regular o semipermanente.', 30, 60, 200, 600, true),
  ('Uñas', 'Pedicure', 'Pedicure', 'Pedicure spa con exfoliación y masaje.', 45, 75, 300, 800, true),
  ('Cejas y Pestañas', 'Eyebrow Shaping', 'Diseño de Cejas', 'Depilación y diseño de cejas con hilo o cera.', 15, 30, 150, 400, true),
  ('Cejas y Pestañas', 'Lash Extensions', 'Extensiones de Pestañas', 'Aplicación de pestañas pelo por pelo. Duración 3-4 semanas.', 90, 150, 800, 2000, true),
  ('Depilación', 'Full Legs Wax', 'Depilación Piernas Completas', 'Depilación con cera de piernas completas.', 30, 45, 400, 800, true),
  ('Depilación', 'Brazilian Wax', 'Depilación Brasileña', 'Depilación íntima completa con cera.', 30, 45, 500, 900, true),
  ('Facial', 'Basic Facial', 'Facial Básico', 'Limpieza facial profunda con extracción.', 45, 60, 500, 1000, true),
  ('Facial', 'Hydrating Facial', 'Facial Hidratante', 'Tratamiento facial de hidratación profunda.', 45, 60, 600, 1200, true),
  ('Masaje', 'Relaxation Massage', 'Masaje Relajante', 'Masaje de cuerpo completo para relajación.', 60, 90, 800, 1500, true)
) AS v(category, name, name_es, description_es, typical_duration_min, typical_duration_max, typical_price_min, typical_price_max, is_popular)
WHERE NOT EXISTS (SELECT 1 FROM service_templates LIMIT 1);

COMMIT;
