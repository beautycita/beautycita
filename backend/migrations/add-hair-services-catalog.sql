-- BeautyCita Hair Services Catalog Migration
-- Based on competitor research (Booksy, Fresha) and Mexico market pricing
-- Prices rounded to hundreds (USD)

-- Clean up existing generic hair services (optional - comment out if you want to keep existing)
-- DELETE FROM services WHERE category IN ('CORTE', 'COLORACIÓN', 'PEINADOS') AND name LIKE '%Generic%';

-- Women's Haircut
INSERT INTO services (name, description, category, price, duration_minutes, is_active)
VALUES
('Women''s Haircut', 'Precision haircut with consultation, wash, and style. Transform your look with our expert stylists.', 'CORTE', 150.00, 60, true),
('Corte de Mujer', 'Corte de precisión con consulta, lavado y peinado. Transforma tu look con nuestros estilistas expertos.', 'CORTE', 150.00, 60, true);

-- Men's Haircut
INSERT INTO services (name, description, category, price, duration_minutes, is_active)
VALUES
('Men''s Haircut', 'Classic or modern cut with professional styling. Look sharp and confident.', 'CORTE', 100.00, 45, true),
('Corte de Hombre', 'Corte clásico o moderno con peinado profesional. Luce elegante y seguro.', 'CORTE', 100.00, 45, true);

-- Blowout & Styling
INSERT INTO services (name, description, category, price, duration_minutes, is_active)
VALUES
('Blowout & Styling', 'Professional blow dry with voluminous styling. Perfect for any occasion.', 'PEINADOS', 100.00, 45, true),
('Secado y Peinado', 'Secado profesional con peinado voluminoso. Perfecto para cualquier ocasión.', 'PEINADOS', 100.00, 45, true);

-- Full Hair Color
INSERT INTO services (name, description, category, price, duration_minutes, is_active)
VALUES
('Full Hair Color', 'All-over single process color with premium products. Complete color transformation.', 'COLORACIÓN', 250.00, 120, true),
('Coloración Completa', 'Color de proceso único con productos premium. Transformación completa de color.', 'COLORACIÓN', 250.00, 120, true);

-- Root Touch-Up
INSERT INTO services (name, description, category, price, duration_minutes, is_active)
VALUES
('Root Touch-Up', 'Color retouch for roots only. Maintain your perfect color between full services.', 'COLORACIÓN', 200.00, 90, true),
('Retoque de Raíces', 'Retoque de color solo en raíces. Mantén tu color perfecto entre servicios completos.', 'COLORACIÓN', 200.00, 90, true);

-- Partial Highlights
INSERT INTO services (name, description, category, price, duration_minutes, is_active)
VALUES
('Partial Highlights', 'Face-framing or half-head highlights for a sun-kissed glow.', 'COLORACIÓN', 250.00, 120, true),
('Mechas Parciales', 'Mechas en marco facial o media cabeza para un brillo natural.', 'COLORACIÓN', 250.00, 120, true);

-- Full Highlights
INSERT INTO services (name, description, category, price, duration_minutes, is_active)
VALUES
('Full Highlights', 'Complete highlighting service for dimensional, radiant color.', 'COLORACIÓN', 350.00, 150, true),
('Mechas Completas', 'Servicio completo de mechas para color radiante y dimensional.', 'COLORACIÓN', 350.00, 150, true);

-- Balayage
INSERT INTO services (name, description, category, price, duration_minutes, is_active)
VALUES
('Balayage', 'Hand-painted highlights for natural, low-maintenance color. The hottest trend in hair coloring.', 'COLORACIÓN', 300.00, 180, true),
('Balayage', 'Mechas pintadas a mano para color natural de bajo mantenimiento. La tendencia más popular.', 'COLORACIÓN', 300.00, 180, true);

-- Ombré
INSERT INTO services (name, description, category, price, duration_minutes, is_active)
VALUES
('Ombré Color', 'Beautiful gradient color technique from dark to light. Stunning dimensional look.', 'COLORACIÓN', 300.00, 180, true),
('Color Ombré', 'Hermosa técnica de degradado de oscuro a claro. Look dimensional impresionante.', 'COLORACIÓN', 300.00, 180, true);

-- Keratin Treatment
INSERT INTO services (name, description, category, price, duration_minutes, is_active)
VALUES
('Keratin Treatment', 'Smoothing and straightening treatment for frizz-free, silky hair. Lasts up to 12 weeks.', 'TRATAMIENTOS', 350.00, 180, true),
('Tratamiento de Keratina', 'Tratamiento alisador para cabello sedoso sin frizz. Dura hasta 12 semanas.', 'TRATAMIENTOS', 350.00, 180, true);

-- Hair Extensions
INSERT INTO services (name, description, category, price, duration_minutes, is_active)
VALUES
('Hair Extensions', 'Premium tape-in or clip-in extensions for instant length and volume.', 'PEINADOS', 450.00, 120, true),
('Extensiones de Cabello', 'Extensiones premium de cinta o clip para largo y volumen instantáneo.', 'PEINADOS', 450.00, 120, true);

-- Updo/Special Styling
INSERT INTO services (name, description, category, price, duration_minutes, is_active)
VALUES
('Updo & Special Event Styling', 'Elegant formal hairstyles for weddings, quinceañeras, and special occasions.', 'PEINADOS', 150.00, 90, true),
('Peinado de Fiesta', 'Peinados formales elegantes para bodas, quinceañeras y ocasiones especiales.', 'PEINADOS', 150.00, 90, true);

-- Braids & Styling
INSERT INTO services (name, description, category, price, duration_minutes, is_active)
VALUES
('Braids & Protective Styling', 'Box braids, cornrows, and protective styles. Beautiful and long-lasting.', 'PEINADOS', 150.00, 180, true),
('Trenzas y Peinados Protectores', 'Trenzas africanas, cornrows y estilos protectores. Hermosos y duraderos.', 'PEINADOS', 150.00, 180, true);

-- Perm/Chemical Relaxer
INSERT INTO services (name, description, category, price, duration_minutes, is_active)
VALUES
('Perm or Chemical Relaxer', 'Permanent wave or smoothing relaxer treatment for lasting style transformation.', 'TRATAMIENTOS', 250.00, 150, true),
('Permanente o Alisado Químico', 'Tratamiento de ondas permanentes o alisado para transformación de estilo duradera.', 'TRATAMIENTOS', 250.00, 150, true);

-- Summary
SELECT 'Hair services catalog added successfully!' AS status;
SELECT
    category,
    COUNT(*) as service_count,
    MIN(price) as min_price,
    MAX(price) as max_price
FROM services
WHERE category IN ('CORTE', 'COLORACIÓN', 'PEINADOS', 'TRATAMIENTOS')
GROUP BY category
ORDER BY category;
