-- Add Waxing and Special Occasions Services
-- These didn't get added in the main migration due to duplicate key errors

-- ============================================================
-- WAXING SERVICES (DEPILACIÓN)
-- ============================================================

INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Eyebrow Waxing', 'Professional eyebrow shaping with wax. Clean, defined brows.', 'DEPILACIÓN', 100.00, 15, true),
('Depilación de Cejas', 'Diseño profesional de cejas con cera. Cejas limpias y definidas.', 'DEPILACIÓN', 100.00, 15, true),
('Upper Lip Waxing', 'Quick and gentle upper lip hair removal.', 'DEPILACIÓN', 100.00, 15, true),
('Depilación de Labio Superior', 'Rápida y suave eliminación de vello del labio superior.', 'DEPILACIÓN', 100.00, 15, true),
('Bikini Wax', 'Clean bikini line waxing. Beach-ready confidence.', 'DEPILACIÓN', 100.00, 30, true),
('Depilación de Bikini', 'Depilación limpia de línea de bikini. Confianza lista para la playa.', 'DEPILACIÓN', 100.00, 30, true),
('Brazilian Wax', 'Complete intimate area waxing. Smooth and clean.', 'DEPILACIÓN', 100.00, 45, true),
('Depilación Brasileña', 'Depilación completa de área íntima. Suave y limpia.', 'DEPILACIÓN', 100.00, 45, true),
('Half Leg Waxing', 'Lower or upper leg hair removal. Smooth, silky legs.', 'DEPILACIÓN', 100.00, 30, true),
('Depilación de Media Pierna', 'Eliminación de vello de pierna inferior o superior. Piernas suaves y sedosas.', 'DEPILACIÓN', 100.00, 30, true),
('Full Leg Waxing', 'Complete leg hair removal. Silky smooth legs.', 'DEPILACIÓN', 100.00, 60, true),
('Depilación de Piernas Completas', 'Eliminación completa de vello de piernas. Piernas sedosas y suaves.', 'DEPILACIÓN', 100.00, 60, true),
('Full Body Waxing', 'Complete body hair removal service. Ultimate smoothness.', 'DEPILACIÓN', 200.00, 120, true),
('Depilación Corporal Completa', 'Servicio completo de eliminación de vello corporal. Suavidad definitiva.', 'DEPILACIÓN', 200.00, 120, true);

-- ============================================================
-- SPECIAL OCCASIONS SERVICES (EVENTOS)
-- ============================================================

INSERT INTO services (name, description, category, price, duration_minutes, is_active) VALUES
('Bridal Hair & Makeup Package', 'Complete bridal beauty package. Hair, makeup, and trial session.', 'EVENTOS', 500.00, 180, true),
('Paquete de Novia Completo', 'Paquete de belleza de novia completo. Cabello, maquillaje y sesión de prueba.', 'EVENTOS', 500.00, 180, true),
('Quinceañera Package', 'Full beauty service for quinceañera. Hair, makeup, and nails.', 'EVENTOS', 400.00, 150, true),
('Paquete de Quinceañera', 'Servicio de belleza completo para quinceañera. Cabello, maquillaje y uñas.', 'EVENTOS', 400.00, 150, true),
('Prom/Graduation Glam', 'Special event styling for prom or graduation. Look stunning.', 'EVENTOS', 200.00, 90, true),
('Glamour para Prom/Graduación', 'Peinado de evento especial para prom o graduación. Luce impresionante.', 'EVENTOS', 200.00, 90, true),
('Mother of Bride/Groom Package', 'Elegant styling for wedding mothers. Hair and makeup.', 'EVENTOS', 300.00, 120, true),
('Paquete Madre de Novia/Novio', 'Peinado elegante para madres de bodas. Cabello y maquillaje.', 'EVENTOS', 300.00, 120, true),
('Photo Shoot Styling', 'Professional styling for photo shoots. Camera-ready beauty.', 'EVENTOS', 200.00, 90, true),
('Peinado para Sesión Fotográfica', 'Peinado profesional para sesiones de fotos. Belleza lista para cámara.', 'EVENTOS', 200.00, 90, true);

-- Summary
SELECT 'Waxing and Special Occasions services added!' AS status;

SELECT category, COUNT(*) as count FROM services
WHERE category IN ('DEPILACIÓN', 'EVENTOS')
GROUP BY category;
