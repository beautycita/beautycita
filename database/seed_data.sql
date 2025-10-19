-- Sample data for BeautyCita platform testing

-- Sample admin user
INSERT INTO users (email, name, role, is_active, email_verified) VALUES
('admin@beautycita.com', 'Platform Admin', 'ADMIN', true, true);

-- Sample client users
INSERT INTO users (email, password_hash, name, phone, role, is_active, email_verified) VALUES
('maria.garcia@email.com', '$2b$10$example_hash_1', 'María García', '+1-555-0101', 'CLIENT', true, true),
('anna.smith@email.com', '$2b$10$example_hash_2', 'Anna Smith', '+1-555-0102', 'CLIENT', true, true),
('sophie.chen@email.com', '$2b$10$example_hash_3', 'Sophie Chen', '+1-555-0103', 'CLIENT', true, true),
('isabel.rodriguez@email.com', '$2b$10$example_hash_4', 'Isabel Rodríguez', '+1-555-0104', 'CLIENT', true, true);

-- Sample stylist users
INSERT INTO users (email, password_hash, name, phone, role, is_active, email_verified) VALUES
('lucia.beauty@email.com', '$2b$10$example_hash_5', 'Lucia Hernández', '+1-555-0201', 'STYLIST', true, true),
('mia.styles@email.com', '$2b$10$example_hash_6', 'Mia Thompson', '+1-555-0202', 'STYLIST', true, true),
('valentina.hair@email.com', '$2b$10$example_hash_7', 'Valentina Morales', '+1-555-0203', 'STYLIST', true, true),
('carmen.color@email.com', '$2b$10$example_hash_8', 'Carmen López', '+1-555-0204', 'STYLIST', true, true),
('sofia.salon@email.com', '$2b$10$example_hash_9', 'Sofia Ramirez', '+1-555-0205', 'STYLIST', true, true);

-- Sample stylist profiles
INSERT INTO stylists (user_id, business_name, bio, specialties, experience_years, location_address, location_city, location_state, location_zip, pricing_tier, base_price_range, portfolio_images, social_media_links, certifications, working_hours, is_verified, rating_average, rating_count) VALUES
(
    5, -- Lucia
    'Lucia Beauty Studio',
    'Especialista en cortes modernos y coloración. Más de 8 años transformando looks y realzando la belleza natural de mis clientas.',
    ARRAY['haircuts', 'coloring', 'highlights', 'balayage'],
    8,
    '123 Beauty Ave, Suite 101',
    'Miami',
    'FL',
    '33101',
    'MID_RANGE',
    '$80-150',
    ARRAY['https://images.unsplash.com/photo-1562004760-aceed7bb0fe3', 'https://images.unsplash.com/photo-1521490878785-4ac2b60d5936'],
    '{"instagram": "@lucia_beauty_studio", "tiktok": "@lucia_styles"}',
    ARRAY['Certified Colorist', 'Balayage Specialist'],
    '{"monday": {"start": "09:00", "end": "18:00"}, "tuesday": {"start": "09:00", "end": "18:00"}, "wednesday": {"start": "09:00", "end": "18:00"}, "thursday": {"start": "09:00", "end": "19:00"}, "friday": {"start": "09:00", "end": "19:00"}, "saturday": {"start": "08:00", "end": "17:00"}, "sunday": {"closed": true}}',
    true,
    4.8,
    47
),
(
    6, -- Mia
    'Mia Styles Boutique',
    'Creative hairstylist passionate about trendy cuts and vibrant colors. I love helping clients express their personality through their hair!',
    ARRAY['haircuts', 'styling', 'coloring', 'extensions'],
    5,
    '456 Fashion Blvd',
    'Los Angeles',
    'CA',
    '90210',
    'PREMIUM',
    '$120-200',
    ARRAY['https://images.unsplash.com/photo-1492106087820-71f1a00d2b11', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e'],
    '{"instagram": "@mia_styles_la", "tiktok": "@miastyles"}',
    ARRAY['Advanced Cutting Techniques', 'Extension Specialist'],
    '{"tuesday": {"start": "10:00", "end": "19:00"}, "wednesday": {"start": "10:00", "end": "19:00"}, "thursday": {"start": "10:00", "end": "19:00"}, "friday": {"start": "10:00", "end": "20:00"}, "saturday": {"start": "09:00", "end": "18:00"}, "sunday": {"start": "10:00", "end": "16:00"}, "monday": {"closed": true}}',
    true,
    4.9,
    63
),
(
    7, -- Valentina
    'Valentina Hair Art',
    'Artista capilar especializada en técnicas de coloración avanzada. Creo looks únicos que resaltan tu personalidad y estilo.',
    ARRAY['coloring', 'balayage', 'ombre', 'highlights'],
    6,
    '789 Trendy St',
    'Austin',
    'TX',
    '78701',
    'PREMIUM',
    '$100-180',
    ARRAY['https://images.unsplash.com/photo-1605497788044-5a32c7078486', 'https://images.unsplash.com/photo-1512690729408-027e5fd7b6c0'],
    '{"instagram": "@valentina_hair_art", "facebook": "ValentinaHairArt"}',
    ARRAY['Master Colorist', 'Balayage Expert', 'Olaplex Certified'],
    '{"monday": {"start": "09:00", "end": "17:00"}, "tuesday": {"start": "09:00", "end": "17:00"}, "wednesday": {"start": "09:00", "end": "17:00"}, "thursday": {"start": "09:00", "end": "18:00"}, "friday": {"start": "09:00", "end": "18:00"}, "saturday": {"start": "08:00", "end": "16:00"}, "sunday": {"closed": true}}',
    true,
    4.7,
    38
),
(
    8, -- Carmen
    'Carmen Color Studio',
    'Especialista en coloración y tratamientos capilares. Me enfoco en mantener la salud del cabello mientras creo colores espectaculares.',
    ARRAY['coloring', 'treatments', 'keratin', 'highlights'],
    10,
    '321 Salon Row',
    'Chicago',
    'IL',
    '60601',
    'MID_RANGE',
    '$70-140',
    ARRAY['https://images.unsplash.com/photo-1634449571010-02389ed0f9b0', 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f'],
    '{"instagram": "@carmen_color_studio"}',
    ARRAY['Master Colorist', 'Keratin Specialist', 'Hair Health Expert'],
    '{"tuesday": {"start": "09:00", "end": "18:00"}, "wednesday": {"start": "09:00", "end": "18:00"}, "thursday": {"start": "09:00", "end": "18:00"}, "friday": {"start": "09:00", "end": "19:00"}, "saturday": {"start": "08:00", "end": "17:00"}, "sunday": {"start": "10:00", "end": "15:00"}, "monday": {"closed": true}}',
    true,
    4.6,
    52
),
(
    9, -- Sofia
    'Sofia Salon Experience',
    'Full-service beauty experience specializing in cuts, color, and special occasion styling. Creating beautiful looks for over 7 years.',
    ARRAY['haircuts', 'coloring', 'styling', 'updos', 'bridal'],
    7,
    '654 Beauty Plaza',
    'New York',
    'NY',
    '10001',
    'LUXURY',
    '$150-300',
    ARRAY['https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e'],
    '{"instagram": "@sofia_salon_nyc", "website": "sofiasalonnyc.com"}',
    ARRAY['Master Stylist', 'Bridal Specialist', 'Aveda Certified'],
    '{"monday": {"start": "10:00", "end": "19:00"}, "tuesday": {"start": "10:00", "end": "19:00"}, "wednesday": {"start": "10:00", "end": "19:00"}, "thursday": {"start": "10:00", "end": "20:00"}, "friday": {"start": "10:00", "end": "20:00"}, "saturday": {"start": "09:00", "end": "18:00"}, "sunday": {"start": "11:00", "end": "17:00"}}',
    true,
    4.9,
    78
);

-- Sample services for each stylist
-- Lucia's services
INSERT INTO services (stylist_id, name, description, category, duration_minutes, price) VALUES
(1, 'Corte de Mujer', 'Corte moderno personalizado según tu estilo y tipo de rostro', 'HAIRCUT', 60, 85.00),
(1, 'Color Completo', 'Coloración completa con productos premium y tratamiento incluido', 'COLOR', 120, 135.00),
(1, 'Mechas Balayage', 'Técnica balayage para un look natural y luminoso', 'HIGHLIGHTS', 150, 165.00),
(1, 'Retoque de Raíz', 'Retoque de color en raíces y refrescar el tono', 'COLOR', 90, 95.00);

-- Mia's services
INSERT INTO services (stylist_id, name, description, category, duration_minutes, price) VALUES
(2, 'Trendy Cut & Style', 'Modern haircut with professional styling', 'HAIRCUT', 75, 140.00),
(2, 'Vibrant Color', 'Bold fashion colors and creative techniques', 'COLOR', 180, 200.00),
(2, 'Hair Extensions', 'Premium tape-in or clip-in extensions application', 'STYLING', 120, 180.00),
(2, 'Special Event Styling', 'Glamorous styling for special occasions', 'STYLING', 90, 125.00);

-- Valentina's services
INSERT INTO services (stylist_id, name, description, category, duration_minutes, price) VALUES
(3, 'Balayage Artístico', 'Técnica balayage personalizada con transiciones naturales', 'HIGHLIGHTS', 180, 175.00),
(3, 'Ombré Premium', 'Degradado ombré con colores personalizados', 'COLOR', 150, 155.00),
(3, 'Color Correction', 'Corrección profesional de color previo', 'COLOR', 240, 220.00),
(3, 'Mechas Tradicionales', 'Mechas clásicas con técnica de papel aluminio', 'HIGHLIGHTS', 120, 125.00);

-- Carmen's services
INSERT INTO services (stylist_id, name, description, category, duration_minutes, price) VALUES
(4, 'Tratamiento Keratina', 'Tratamiento alisador con keratina brasileña', 'TREATMENTS', 180, 180.00),
(4, 'Color Natural', 'Coloración con productos orgánicos y naturales', 'COLOR', 105, 110.00),
(4, 'Tratamiento Reparador', 'Mascarilla intensiva para cabello dañado', 'TREATMENTS', 45, 65.00),
(4, 'Mechas Suaves', 'Mechas sutiles para iluminar el rostro', 'HIGHLIGHTS', 90, 95.00);

-- Sofia's services
INSERT INTO services (stylist_id, name, description, category, duration_minutes, price) VALUES
(5, 'Signature Cut', 'Premium haircut consultation and styling', 'HAIRCUT', 90, 175.00),
(5, 'Bridal Package', 'Complete bridal hair styling with trial', 'BRIDAL', 120, 280.00),
(5, 'Luxury Color Service', 'High-end color treatment with Olaplex', 'COLOR', 150, 225.00),
(5, 'Special Occasion Updo', 'Elegant updo for formal events', 'STYLING', 75, 150.00);

-- Sample bookings (past and upcoming)
INSERT INTO bookings (client_id, stylist_id, service_id, booking_date, booking_time, duration_minutes, status, total_price, notes, confirmed_at, completed_at) VALUES
(1, 1, 1, '2025-09-15', '14:00', 60, 'COMPLETED', 85.00, 'Primera vez, quiero un cambio pero no muy drástico', '2025-09-14 10:30:00', '2025-09-15 15:15:00'),
(2, 2, 5, '2025-09-16', '11:00', 75, 'COMPLETED', 140.00, 'Need a fresh look for job interviews', '2025-09-15 16:20:00', '2025-09-16 12:30:00'),
(3, 3, 9, '2025-09-17', '13:30', 180, 'COMPLETED', 175.00, 'Want natural-looking highlights', '2025-09-16 09:15:00', '2025-09-17 17:00:00'),
(1, 5, 17, '2025-09-20', '15:00', 90, 'CONFIRMED', 175.00, 'Wedding guest, need elegant cut', '2025-09-18 14:22:00', NULL),
(4, 4, 13, '2025-09-21', '10:00', 105, 'CONFIRMED', 110.00, 'Cubrir algunas canas, color natural', '2025-09-19 11:45:00', NULL),
(2, 1, 3, '2025-09-22', '16:00', 150, 'PENDING', 165.00, 'Interested in balayage technique', NULL, NULL);

-- Sample payments for completed bookings
INSERT INTO payments (booking_id, stripe_payment_intent_id, amount, platform_fee, stylist_payout, status, payment_method, processed_at) VALUES
(1, 'pi_1234567890abcdef', 85.00, 8.50, 76.50, 'SUCCEEDED', 'card', '2025-09-15 14:05:00'),
(2, 'pi_abcdef1234567890', 140.00, 14.00, 126.00, 'SUCCEEDED', 'apple_pay', '2025-09-16 11:10:00'),
(3, 'pi_fedcba0987654321', 175.00, 17.50, 157.50, 'SUCCEEDED', 'card', '2025-09-17 13:35:00');

-- Sample reviews
INSERT INTO reviews (booking_id, client_id, stylist_id, rating, title, review_text, is_verified, created_at) VALUES
(1, 1, 1, 5, 'Excelente servicio!', 'Lucia es increíble! Me escuchó perfectamente y el corte quedó exactamente como quería. El salón es muy limpio y profesional. Definitivamente regresaré.', true, '2025-09-15 20:30:00'),
(2, 2, 2, 5, 'Amazing transformation!', 'Mia completely transformed my look! She was so creative and professional. The cut is perfect and I''ve gotten so many compliments. Worth every penny!', true, '2025-09-16 19:45:00'),
(3, 3, 3, 4, 'Beautiful balayage', 'Valentina did an amazing job with my balayage. The color looks so natural and blends perfectly. Only minor issue was the appointment ran a bit long, but the results were worth it.', true, '2025-09-17 21:15:00');

-- Sample favorites
INSERT INTO client_favorites (client_id, stylist_id) VALUES
(1, 1), -- Maria likes Lucia
(1, 5), -- Maria likes Sofia
(2, 2), -- Anna likes Mia
(3, 3), -- Sophie likes Valentina
(4, 4); -- Isabel likes Carmen

-- Sample availability blocks (for stylists taking time off)
INSERT INTO stylist_availability (stylist_id, date, start_time, end_time, is_available, reason) VALUES
(1, '2025-09-25', '09:00', '18:00', false, 'Personal day off'),
(2, '2025-09-23', '10:00', '19:00', false, 'Training workshop'),
(3, '2025-09-24', '14:00', '17:00', false, 'Doctor appointment');