-- BeautyCita Complete Service Catalog Migration
-- All categories based on Booksy/Fresha competitor research
-- Prices rounded to hundreds (USD)

-- ============================================================
-- NAILS SERVICES (UÑAS)
-- ============================================================

-- Basic Manicure
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Basic Manicure', 'Classic manicure with nail shaping, cuticle care, and polish. Perfect everyday nails.', 'UÑAS', 100.00, 45, true),
('Manicura Básica', 'Manicura clásica con forma de uñas, cuidado de cutículas y esmalte. Uñas perfectas para todos los días.', 'UÑAS', 100.00, 45, true);

-- Gel Manicure
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Gel Manicure', 'Long-lasting gel polish manicure. Chip-free nails for 2-3 weeks.', 'UÑAS', 100.00, 60, true),
('Manicura en Gel', 'Manicura de esmalte en gel de larga duración. Uñas sin astillas por 2-3 semanas.', 'UÑAS', 100.00, 60, true);

-- Acrylic Nails
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Acrylic Nails (Full Set)', 'Complete acrylic nail extension set. Strong, beautiful nails.', 'UÑAS', 100.00, 90, true),
('Uñas Acrílicas (Set Completo)', 'Set completo de extensiones de uñas acrílicas. Uñas fuertes y hermosas.', 'UÑAS', 100.00, 90, true);

-- Nail Art
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Nail Art Design', 'Custom nail art and designs. Express your unique style.', 'UÑAS', 100.00, 30, true),
('Diseño de Uñas', 'Arte y diseños personalizados de uñas. Expresa tu estilo único.', 'UÑAS', 100.00, 30, true);

-- Spa Pedicure
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Spa Pedicure', 'Luxurious pedicure with exfoliation, massage, and polish. Pamper your feet.', 'UÑAS', 100.00, 60, true),
('Pedicura Spa', 'Pedicura lujosa con exfoliación, masaje y esmalte. Consiente tus pies.', 'UÑAS', 100.00, 60, true);

-- ============================================================
-- SKINCARE SERVICES (FACIAL)
-- ============================================================

-- Classic Facial
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Classic Facial', 'Deep cleansing facial with extraction, massage, and mask. Refresh your skin.', 'FACIAL', 100.00, 60, true),
('Facial Clásico', 'Facial de limpieza profunda con extracción, masaje y mascarilla. Refresca tu piel.', 'FACIAL', 100.00, 60, true);

-- Microdermabrasion
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Microdermabrasion', 'Exfoliating treatment for smoother, brighter skin. Reduce fine lines.', 'FACIAL', 200.00, 60, true),
('Microdermoabrasión', 'Tratamiento exfoliante para piel más suave y brillante. Reduce líneas finas.', 'FACIAL', 200.00, 60, true);

-- Chemical Peel
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Chemical Peel', 'Professional chemical peel for skin renewal. Target acne, pigmentation, and aging.', 'FACIAL', 200.00, 45, true),
('Peeling Químico', 'Peeling químico profesional para renovación de piel. Trata acné, pigmentación y envejecimiento.', 'FACIAL', 200.00, 45, true);

-- HydraFacial
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('HydraFacial', 'Advanced hydrating facial treatment. Instant glow and deep hydration.', 'FACIAL', 300.00, 60, true),
('HydraFacial', 'Tratamiento facial hidratante avanzado. Brillo instantáneo e hidratación profunda.', 'FACIAL', 300.00, 60, true);

-- Anti-Aging Facial
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Anti-Aging Facial', 'Targeted anti-aging treatment with serums and massage. Turn back time.', 'FACIAL', 200.00, 75, true),
('Facial Anti-Edad', 'Tratamiento anti-edad dirigido con sueros y masaje. Retrocede el tiempo.', 'FACIAL', 200.00, 75, true);

-- ============================================================
-- MAKEUP SERVICES (MAQUILLAJE)
-- ============================================================

-- Everyday Makeup
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Everyday Makeup', 'Natural, polished makeup for daily wear. Look effortlessly beautiful.', 'MAQUILLAJE', 100.00, 45, true),
('Maquillaje Diario', 'Maquillaje natural y pulido para uso diario. Luce hermosa sin esfuerzo.', 'MAQUILLAJE', 100.00, 45, true);

-- Airbrush Makeup
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Airbrush Makeup', 'Flawless airbrush makeup application. Long-lasting, photo-perfect finish.', 'MAQUILLAJE', 200.00, 60, true),
('Maquillaje Aerógrafo', 'Aplicación de maquillaje aerográfico impecable. Acabado duradero y perfecto para fotos.', 'MAQUILLAJE', 200.00, 60, true);

-- Bridal Makeup
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Bridal Makeup', 'Glamorous bridal makeup for your special day. Includes trial session.', 'MAQUILLAJE', 300.00, 90, true),
('Maquillaje de Novia', 'Maquillaje glamoroso de novia para tu día especial. Incluye sesión de prueba.', 'MAQUILLAJE', 300.00, 90, true);

-- Special Event Makeup
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Special Event Makeup', 'Glamorous makeup for parties, proms, and events. Stand out beautifully.', 'MAQUILLAJE', 100.00, 60, true),
('Maquillaje de Evento', 'Maquillaje glamoroso para fiestas, proms y eventos. Destaca hermosamente.', 'MAQUILLAJE', 100.00, 60, true);

-- ============================================================
-- LASHES & BROWS SERVICES (PESTAÑAS Y CEJAS)
-- ============================================================

-- Classic Lash Extensions
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Classic Lash Extensions', 'Individual lash extensions for natural volume. Wake up beautiful.', 'PESTAÑAS', 200.00, 120, true),
('Extensiones de Pestañas Clásicas', 'Extensiones de pestañas individuales para volumen natural. Despierta hermosa.', 'PESTAÑAS', 200.00, 120, true);

-- Volume Lash Extensions
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Volume Lash Extensions', 'Dramatic volume lash extensions. Fuller, glamorous lashes.', 'PESTAÑAS', 300.00, 150, true),
('Extensiones de Pestañas Volumen', 'Extensiones de pestañas de volumen dramático. Pestañas más llenas y glamorosas.', 'PESTAÑAS', 300.00, 150, true);

-- Lash Lift & Tint
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Lash Lift & Tint', 'Natural lash curl and tint. Low-maintenance beautiful lashes.', 'PESTAÑAS', 100.00, 60, true),
('Lifting y Tinte de Pestañas', 'Rizo y tinte natural de pestañas. Pestañas hermosas de bajo mantenimiento.', 'PESTAÑAS', 100.00, 60, true);

-- Eyebrow Shaping & Tint
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Eyebrow Shaping & Tint', 'Professional brow shaping and tinting. Perfect brows for your face.', 'CEJAS', 100.00, 45, true),
('Diseño y Tinte de Cejas', 'Diseño y tinte profesional de cejas. Cejas perfectas para tu rostro.', 'CEJAS', 100.00, 45, true);

-- Microblading
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Microblading', 'Semi-permanent brow tattooing. Natural-looking brows that last 1-3 years.', 'CEJAS', 400.00, 120, true),
('Microblading', 'Tatuaje semipermanente de cejas. Cejas de aspecto natural que duran 1-3 años.', 'CEJAS', 400.00, 120, true);

-- Brow Lamination
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Brow Lamination', 'Brow perming for fuller, fluffier brows. Trendy feathered look.', 'CEJAS', 100.00, 45, true),
('Laminado de Cejas', 'Permanente de cejas para cejas más llenas. Look de plumas de moda.', 'CEJAS', 100.00, 45, true);

-- ============================================================
-- MASSAGE SERVICES (MASAJE)
-- ============================================================

-- Swedish Massage
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Swedish Massage (60 min)', 'Relaxing full-body massage. Reduce stress and tension.', 'MASAJE', 100.00, 60, true),
('Masaje Sueco (60 min)', 'Masaje relajante de cuerpo completo. Reduce estrés y tensión.', 'MASAJE', 100.00, 60, true);

-- Deep Tissue Massage
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Deep Tissue Massage (60 min)', 'Therapeutic deep tissue massage. Target chronic pain and knots.', 'MASAJE', 100.00, 60, true),
('Masaje de Tejido Profundo (60 min)', 'Masaje terapéutico de tejido profundo. Trata dolor crónico y nudos.', 'MASAJE', 100.00, 60, true);

-- Hot Stone Massage
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Hot Stone Massage (75 min)', 'Luxurious hot stone massage therapy. Deep relaxation and muscle relief.', 'MASAJE', 200.00, 75, true),
('Masaje con Piedras Calientes (75 min)', 'Lujosa terapia de masaje con piedras calientes. Relajación profunda y alivio muscular.', 'MASAJE', 200.00, 75, true);

-- Aromatherapy Massage
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Aromatherapy Massage (60 min)', 'Soothing massage with essential oils. Calm mind and body.', 'MASAJE', 100.00, 60, true),
('Masaje de Aromaterapia (60 min)', 'Masaje relajante con aceites esenciales. Calma mente y cuerpo.', 'MASAJE', 100.00, 60, true);

-- ============================================================
-- WAXING SERVICES (DEPILACIÓN)
-- ============================================================

-- Eyebrow Wax
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Eyebrow Waxing', 'Professional eyebrow shaping with wax. Clean, defined brows.', 'DEPILACIÓN', 100.00, 15, true),
('Depilación de Cejas', 'Diseño profesional de cejas con cera. Cejas limpias y definidas.', 'DEPILACIÓN', 100.00, 15, true);

-- Upper Lip Wax
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Upper Lip Waxing', 'Quick and gentle upper lip hair removal.', 'DEPILACIÓN', 100.00, 15, true),
('Depilación de Labio Superior', 'Rápida y suave eliminación de vello del labio superior.', 'DEPILACIÓN', 100.00, 15, true);

-- Bikini Wax
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Bikini Wax', 'Clean bikini line waxing. Beach-ready confidence.', 'DEPILACIÓN', 100.00, 30, true),
('Depilación de Bikini', 'Depilación limpia de línea de bikini. Confianza lista para la playa.', 'DEPILACIÓN', 100.00, 30, true);

-- Brazilian Wax
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Brazilian Wax', 'Complete intimate area waxing. Smooth and clean.', 'DEPILACIÓN', 100.00, 45, true),
('Depilación Brasileña', 'Depilación completa de área íntima. Suave y limpia.', 'DEPILACIÓN', 100.00, 45, true);

-- Full Leg Wax
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Full Leg Waxing', 'Complete leg hair removal. Silky smooth legs.', 'DEPILACIÓN', 100.00, 60, true),
('Depilación de Piernas Completas', 'Eliminación completa de vello de piernas. Piernas sedosas y suaves.', 'DEPILACIÓN', 100.00, 60, true);

-- Full Body Wax
INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Full Body Waxing', 'Complete body hair removal service. Ultimate smoothness.', 'DEPILACIÓN', 200.00, 120, true),
('Depilación Corporal Completa', 'Servicio completo de eliminación de vello corporal. Suavidad definitiva.', 'DEPILACIÓN', 200.00, 120, true);

-- ============================================================
-- SUMMARY
-- ============================================================

SELECT 'All service catalogs added successfully!' AS status;

-- Show service count by category
SELECT
    category,
    COUNT(*) as service_count,
    MIN(price) as min_price,
    MAX(price) as max_price
FROM services
GROUP BY category
ORDER BY category;
