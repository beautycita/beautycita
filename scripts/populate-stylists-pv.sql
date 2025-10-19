-- Populate BeautyCita with 20 Realistic Stylists in Puerto Vallarta, Jalisco, Mexico
-- Generated for testing the dashboard and stylist features

BEGIN;

-- Puerto Vallarta neighborhoods and areas
-- Marina Vallarta, Centro/Downtown, Zona Hotelera Norte, Zona Hotelera Sur,
-- Fluvial Vallarta, Versalles, 5 de Diciembre, Emiliano Zapata, Amapas, Conchas Chinas

-- Insert 20 users (stylists)
INSERT INTO users (first_name, last_name, name, email, phone, password_hash, role, email_verified, phone_verified, is_active, created_at, updated_at) VALUES
('Isabella', 'Moreno', 'Isabella Moreno', 'isabella.moreno@beautycita.com', '+523221234567', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, NOW() - INTERVAL '30 days', NOW()),
('Sofía', 'Ramírez', 'Sofía Ramírez', 'sofia.ramirez@beautycita.com', '+523221234568', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, NOW() - INTERVAL '28 days', NOW()),
('Camila', 'González', 'Camila González', 'camila.gonzalez@beautycita.com', '+523221234569', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, NOW() - INTERVAL '25 days', NOW()),
('Valentina', 'López', 'Valentina López', 'valentina.lopez@beautycita.com', '+523221234570', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, NOW() - INTERVAL '22 days', NOW()),
('Lucía', 'Martínez', 'Lucía Martínez', 'lucia.martinez@beautycita.com', '+523221234571', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, NOW() - INTERVAL '20 days', NOW()),
('Ximena', 'García', 'Ximena García', 'ximena.garcia@beautycita.com', '+523221234572', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, NOW() - INTERVAL '18 days', NOW()),
('Regina', 'Rodríguez', 'Regina Rodríguez', 'regina.rodriguez@beautycita.com', '+523221234573', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, NOW() - INTERVAL '16 days', NOW()),
('Fernanda', 'Hernández', 'Fernanda Hernández', 'fernanda.hernandez@beautycita.com', '+523221234574', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, NOW() - INTERVAL '14 days', NOW()),
('Daniela', 'Jiménez', 'Daniela Jiménez', 'daniela.jimenez@beautycita.com', '+523221234575', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, NOW() - INTERVAL '12 days', NOW()),
('Paulina', 'Vásquez', 'Paulina Vásquez', 'paulina.vasquez@beautycita.com', '+523221234576', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, NOW() - INTERVAL '10 days', NOW()),
('Mariana', 'Torres', 'Mariana Torres', 'mariana.torres@beautycita.com', '+523221234577', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, NOW() - INTERVAL '8 days', NOW()),
('Andrea', 'Flores', 'Andrea Flores', 'andrea.flores@beautycita.com', '+523221234578', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, NOW() - INTERVAL '6 days', NOW()),
('Carolina', 'Peña', 'Carolina Peña', 'carolina.pena@beautycita.com', '+523221234579', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, NOW() - INTERVAL '5 days', NOW()),
('Michelle', 'Castro', 'Michelle Castro', 'michelle.castro@beautycita.com', '+523221234580', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, NOW() - INTERVAL '4 days', NOW()),
('Alejandra', 'Ruiz', 'Alejandra Ruiz', 'alejandra.ruiz@beautycita.com', '+523221234581', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, NOW() - INTERVAL '3 days', NOW()),
('Natalia', 'Mendoza', 'Natalia Mendoza', 'natalia.mendoza@beautycita.com', '+523221234582', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, NOW() - INTERVAL '2 days', NOW()),
('Paola', 'Aguilar', 'Paola Aguilar', 'paola.aguilar@beautycita.com', '+523221234583', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, NOW() - INTERVAL '1 day', NOW()),
('Karla', 'Morales', 'Karla Morales', 'karla.morales@beautycita.com', '+523221234584', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, NOW() - INTERVAL '12 hours', NOW()),
('Gabriela', 'Ortiz', 'Gabriela Ortiz', 'gabriela.ortiz@beautycita.com', '+523221234585', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, NOW() - INTERVAL '6 hours', NOW()),
('Valeria', 'Delgado', 'Valeria Delgado', 'valeria.delgado@beautycita.com', '+523221234586', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, NOW() - INTERVAL '2 hours', NOW());

-- Insert SMS preferences for all new stylists
INSERT INTO sms_preferences (user_id, booking_confirmations, reminders, marketing, created_at, updated_at)
SELECT u.id, true, true, false, NOW(), NOW()
FROM users u WHERE u.role = 'STYLIST' AND u.id > 1;

-- Insert user credits for all new stylists
INSERT INTO user_credits (user_id, balance_cents, updated_at)
SELECT u.id, 0, NOW()
FROM users u WHERE u.role = 'STYLIST' AND u.id > 1;

-- Insert robust stylist profiles with detailed information
INSERT INTO stylists (user_id, business_name, bio, specialties, experience_years, location_address, location_city, location_state, location_country, location_postal_code, location_latitude, location_longitude, salon_phone, service_description, instagram_handle, working_hours, certifications, signature_styles, portfolio_published, accepts_walk_ins, travel_radius_km, base_price, premium_multiplier, created_at, updated_at)
VALUES
-- Isabella Moreno - Marina Vallarta
(2, 'Isabella Hair Studio', 'Especialista en colorimetría avanzada y cortes modernos. Con más de 8 años de experiencia, me apasiona crear looks únicos que realcen la belleza natural de cada cliente.',
 ARRAY['Colorimetría', 'Cortes Modernos', 'Balayage', 'Tratamientos Capilares'], 8,
 'Av. Paseo de la Marina 245, Marina Vallarta', 'Puerto Vallarta', 'Jalisco', 'México', '48335',
 20.6554, -105.2606, '+523221234567',
 'Transformaciones capilares completas con técnicas europeas avanzadas',
 '@isabella_hairstudio',
 '{"lunes": "9:00-18:00", "martes": "9:00-18:00", "miercoles": "9:00-18:00", "jueves": "9:00-18:00", "viernes": "9:00-19:00", "sabado": "8:00-17:00", "domingo": "cerrado"}',
 ARRAY['Certificación L''Oréal Professionnel', 'Colorimetría Avanzada Wella', 'Técnicas de Balayage'],
 ARRAY['Beach Waves', 'Rubio Californiano', 'Cortes Texturizados'],
 true, false, 15, 800.00, 1.5, NOW() - INTERVAL '30 days', NOW()),

-- Sofía Ramírez - Centro/Downtown
(3, 'Sofía Beauty Lounge', 'Maquilladora profesional especializada en novias y eventos especiales. Creo looks naturales y sofisticados que resaltan la personalidad única de cada mujer.',
 ARRAY['Maquillaje de Novias', 'Maquillaje para Eventos', 'Maquillaje Editorial', 'Cejas'], 6,
 'Calle Morelos 142, Centro', 'Puerto Vallarta', 'Jalisco', 'México', '48300',
 20.6097, -105.2292, '+523221234568',
 'Maquillaje profesional para ocasiones especiales y sesiones fotográficas',
 '@sofia_beautylounge',
 '{"lunes": "10:00-19:00", "martes": "10:00-19:00", "miercoles": "10:00-19:00", "jueves": "10:00-19:00", "viernes": "9:00-20:00", "sabado": "8:00-18:00", "domingo": "10:00-16:00"}',
 ARRAY['Certificación MAC Pro', 'Maquillaje de Novias Certificado', 'Microblading'],
 ARRAY['Natural Glow', 'Smokey Eyes', 'Delineado Perfecto'],
 true, true, 20, 1200.00, 2.0, NOW() - INTERVAL '28 days', NOW()),

-- Camila González - Zona Hotelera Norte
(4, 'Camila Nails Art', 'Nail artist con especialización en diseños artísticos y técnicas japonesas. Cada uña es una pequeña obra de arte que refleja tu estilo personal.',
 ARRAY['Nail Art', 'Manicure Japonés', 'Uñas Acrílicas', 'Diseños Personalizados'], 5,
 'Blvd. Francisco Medina Ascencio 2485, Zona Hotelera Norte', 'Puerto Vallarta', 'Jalisco', 'México', '48333',
 20.6319, -105.2521, '+523221234569',
 'Nail art exclusivo con diseños únicos y técnicas innovadoras',
 '@camila_nailsart',
 '{"lunes": "9:00-17:00", "martes": "9:00-17:00", "miercoles": "9:00-17:00", "jueves": "9:00-17:00", "viernes": "9:00-18:00", "sabado": "9:00-18:00", "domingo": "11:00-16:00"}',
 ARRAY['Certificación en Nail Art Japonés', 'Técnicas de Acrílico Avanzado', 'Diseño Digital'],
 ARRAY['Minimalista Chic', 'Arte Floral', 'Geometric Nails'],
 true, false, 25, 600.00, 1.8, NOW() - INTERVAL '25 days', NOW()),

-- Valentina López - Zona Hotelera Sur
(5, 'Valentina Spa & Beauty', 'Esteticista holística especializada en tratamientos faciales anti-edad y terapias naturales. Combino técnicas ancestrales con tecnología moderna.',
 ARRAY['Tratamientos Faciales', 'Anti-Aging', 'Limpieza Profunda', 'Terapias Naturales'], 10,
 'Blvd. Francisco Medina Ascencio 1123, Zona Hotelera Sur', 'Puerto Vallarta', 'Jalisco', 'México', '48390',
 20.6180, -105.2401, '+523221234570',
 'Tratamientos faciales personalizados con productos orgánicos certificados',
 '@valentina_spa',
 '{"lunes": "8:00-19:00", "martes": "8:00-19:00", "miercoles": "8:00-19:00", "jueves": "8:00-19:00", "viernes": "8:00-20:00", "sabado": "8:00-18:00", "domingo": "10:00-17:00"}',
 ARRAY['Certificación en Cosmetología Holística', 'Terapias Anti-Edad', 'Aromaterapia'],
 ARRAY['Facial Oro 24k', 'Hidratación Profunda', 'Lifting Natural'],
 true, false, 30, 1500.00, 1.7, NOW() - INTERVAL '22 days', NOW()),

-- Lucía Martínez - Fluvial Vallarta
(6, 'Lucía Extensions', 'Especialista en extensiones de cabello y técnicas de alargamiento capilar. Trabajo con las mejores calidades de cabello natural para resultados perfectos.',
 ARRAY['Extensiones de Cabello', 'Técnica Tape-In', 'Microlinks', 'Cabello Natural'], 7,
 'Av. Fluvial Vallarta 1445, Fluvial Vallarta', 'Puerto Vallarta', 'Jalisco', 'México', '48312',
 20.6234, -105.2156, '+523221234571',
 'Extensiones de cabello natural con técnicas no invasivas y duraderas',
 '@lucia_extensions',
 '{"lunes": "10:00-18:00", "martes": "10:00-18:00", "miercoles": "10:00-18:00", "jueves": "10:00-18:00", "viernes": "10:00-19:00", "sabado": "9:00-17:00", "domingo": "cerrado"}',
 ARRAY['Certificación en Extensiones Profesionales', 'Técnicas de Aplicación Europea'],
 ARRAY['Volumen Natural', 'Longitud Perfecta', 'Integración Invisible'],
 true, false, 20, 2000.00, 2.2, NOW() - INTERVAL '20 days', NOW()),

-- Continue with remaining stylists...
-- Ximena García - Versalles
(7, 'Ximena Studio', 'Peluquera integral especializada en peinados para eventos y styling profesional. Cada peinado cuenta una historia única.',
 ARRAY['Peinados para Eventos', 'Styling Profesional', 'Ondas', 'Recogidos'], 9,
 'Calle Versalles 234, Versalles', 'Puerto Vallarta', 'Jalisco', 'México', '48315',
 20.6156, -105.2034, '+523221234572',
 'Peinados elegantes y sofisticados para toda ocasión especial',
 '@ximena_studio',
 '{"lunes": "9:00-17:00", "martes": "9:00-17:00", "miercoles": "9:00-17:00", "jueves": "9:00-17:00", "viernes": "8:00-19:00", "sabado": "7:00-18:00", "domingo": "9:00-15:00"}',
 ARRAY['Styling Profesional Certificado', 'Peinados de Alta Costura'],
 ARRAY['Ondas Hollywood', 'Recogidos Románticos', 'Trenzas Modernas'],
 true, true, 18, 900.00, 1.6, NOW() - INTERVAL '18 days', NOW()),

-- Regina Rodríguez - 5 de Diciembre
(8, 'Regina Beauty Center', 'Cosmetóloga integral con especialización en tratamientos corporales y depilación láser. Tu belleza integral es mi prioridad.',
 ARRAY['Tratamientos Corporales', 'Depilación Láser', 'Masajes Relajantes', 'Reductivos'], 8,
 'Calle 5 de Diciembre 567, 5 de Diciembre', 'Puerto Vallarta', 'Jalisco', 'México', '48350',
 20.6078, -105.2167, '+523221234573',
 'Tratamientos corporales avanzados con tecnología de última generación',
 '@regina_beautycenter',
 '{"lunes": "8:00-19:00", "martes": "8:00-19:00", "miercoles": "8:00-19:00", "jueves": "8:00-19:00", "viernes": "8:00-20:00", "sabado": "8:00-17:00", "domingo": "cerrado"}',
 ARRAY['Certificación en Depilación Láser', 'Terapias Corporales Avanzadas'],
 ARRAY['Tratamiento Reafirmante', 'Depilación Definitiva', 'Masaje Sueco'],
 true, false, 25, 1800.00, 1.9, NOW() - INTERVAL '16 days', NOW()),

-- Fernanda Hernández - Emiliano Zapata
(9, 'Fernanda Hair Color', 'Colorista experta en técnicas de decoloración y colores fantasía. Especializada en transformaciones drásticas y colores vibrantes.',
 ARRAY['Coloración Fantasía', 'Decoloración', 'Color Correction', 'Mechas'], 6,
 'Av. Emiliano Zapata 789, Emiliano Zapata', 'Puerto Vallarta', 'Jalisco', 'México', '48380',
 20.6001, -105.2289, '+523221234574',
 'Especialista en colores únicos y corrección de color profesional',
 '@fernanda_haircolor',
 '{"lunes": "10:00-19:00", "martes": "10:00-19:00", "miercoles": "10:00-19:00", "jueves": "10:00-19:00", "viernes": "10:00-20:00", "sabado": "9:00-18:00", "domingo": "cerrado"}',
 ARRAY['Colorimetría Avanzada', 'Corrección de Color Profesional'],
 ARRAY['Color Fantasía', 'Rubio Platino', 'Arcoíris Sutil'],
 true, false, 22, 1100.00, 2.1, NOW() - INTERVAL '14 days', NOW()),

-- Daniela Jiménez - Amapas
(10, 'Daniela Lashes', 'Especialista en extensiones de pestañas y treatments de cejas. Cada mirada es única y merece el mejor cuidado profesional.',
 ARRAY['Extensiones de Pestañas', 'Lifting de Pestañas', 'Microblading', 'Laminado de Cejas'], 4,
 'Calle Amapas 321, Amapas', 'Puerto Vallarta', 'Jalisco', 'México', '48399',
 20.5956, -105.2378, '+523221234575',
 'Extensiones de pestañas naturales y tratamientos para una mirada perfecta',
 '@daniela_lashes',
 '{"lunes": "9:00-18:00", "martes": "9:00-18:00", "miercoles": "9:00-18:00", "jueves": "9:00-18:00", "viernes": "9:00-19:00", "sabado": "8:00-17:00", "domingo": "10:00-15:00"}',
 ARRAY['Certificación en Extensiones de Pestañas', 'Microblading Profesional'],
 ARRAY['Mirada Natural', 'Volume Lashes', 'Cejas HD'],
 true, true, 15, 800.00, 1.7, NOW() - INTERVAL '12 days', NOW()),

-- Continue with remaining 10 stylists...
-- Paulina Vásquez - Conchas Chinas
(11, 'Paulina Makeup Art', 'Maquilladora editorial y artística especializada en efectos especiales y caracterización. El maquillaje como forma de arte.',
 ARRAY['Maquillaje Editorial', 'Efectos Especiales', 'Caracterización', 'Maquillaje Teatral'], 7,
 'Calle Conchas Chinas 156, Conchas Chinas', 'Puerto Vallarta', 'Jalisco', 'México', '48390',
 20.5834, -105.2445, '+523221234576',
 'Maquillaje artístico y editorial para producciones y eventos únicos',
 '@paulina_makeupart',
 '{"lunes": "11:00-19:00", "martes": "11:00-19:00", "miercoles": "11:00-19:00", "jueves": "11:00-19:00", "viernes": "10:00-20:00", "sabado": "9:00-18:00", "domingo": "cerrado"}',
 ARRAY['Maquillaje Editorial Certificado', 'Efectos Especiales SFX'],
 ARRAY['Fantasy Makeup', 'Editorial High Fashion', 'Avant-garde'],
 true, false, 30, 1500.00, 2.5, NOW() - INTERVAL '10 days', NOW()),

-- Mariana Torres - Marina Vallarta
(12, 'Mariana Wellness', 'Terapeuta de belleza holística especializada en tratamientos anti-estrés y relajación profunda. Belleza desde el bienestar interior.',
 ARRAY['Tratamientos Holísticos', 'Anti-Estrés', 'Aromaterapia', 'Masajes Terapéuticos'], 11,
 'Marina del Rey 445, Marina Vallarta', 'Puerto Vallarta', 'Jalisco', 'México', '48335',
 20.6578, -105.2634, '+523221234577',
 'Tratamientos de belleza que integran bienestar físico y emocional',
 '@mariana_wellness',
 '{"lunes": "8:00-18:00", "martes": "8:00-18:00", "miercoles": "8:00-18:00", "jueves": "8:00-18:00", "viernes": "8:00-19:00", "sabado": "9:00-17:00", "domingo": "10:00-16:00"}',
 ARRAY['Terapia Holística Certificada', 'Aromaterapia Profesional'],
 ARRAY['Relajación Total', 'Equilibrio Energético', 'Detox Natural'],
 true, false, 35, 1300.00, 1.8, NOW() - INTERVAL '8 days', NOW()),

-- Andrea Flores - Centro
(13, 'Andrea Cuts', 'Estilista de vanguardia especializada en cortes geométricos y estilos urbanos. Cada corte es una declaración de estilo personal.',
 ARRAY['Cortes Geométricos', 'Estilos Urbanos', 'Pixie Cuts', 'Bob Moderno'], 8,
 'Av. Juárez 234, Centro', 'Puerto Vallarta', 'Jalisco', 'México', '48300',
 20.6112, -105.2298, '+523221234578',
 'Cortes modernos y estilos únicos que definen tu personalidad',
 '@andrea_cuts',
 '{"lunes": "9:00-18:00", "martes": "9:00-18:00", "miercoles": "9:00-18:00", "jueves": "9:00-18:00", "vieves": "9:00-19:00", "sabado": "8:00-17:00", "domingo": "cerrado"}',
 ARRAY['Técnicas de Corte Vanguardistas', 'Styling Urbano Certificado'],
 ARRAY['Geometric Bob', 'Pixie Texturizado', 'Undercut Feminine'],
 true, true, 20, 850.00, 1.6, NOW() - INTERVAL '6 days', NOW()),

-- Carolina Peña - Zona Hotelera Norte
(14, 'Carolina Bridal', 'Especialista en novias con más de una década de experiencia. Hago realidad el look perfecto para el día más importante.',
 ARRAY['Maquillaje de Novias', 'Peinados Nupciales', 'Pruebas de Maquillaje', 'Madrinas'], 12,
 'Hotel Zone Plaza 789, Zona Hotelera Norte', 'Puerto Vallarta', 'Jalisco', 'México', '48333',
 20.6289, -105.2567, '+523221234579',
 'Creando looks nupciales perfectos que perduran en tus mejores recuerdos',
 '@carolina_bridal',
 '{"lunes": "10:00-17:00", "martes": "10:00-17:00", "miercoles": "10:00-17:00", "jueves": "10:00-17:00", "viernes": "9:00-19:00", "sabado": "7:00-20:00", "domingo": "8:00-16:00"}',
 ARRAY['Especialización en Novias Certificada', 'Maquillaje Fotogénico'],
 ARRAY['Classic Bride', 'Romantic Updo', 'Natural Glow'],
 true, false, 40, 2500.00, 2.8, NOW() - INTERVAL '5 days', NOW()),

-- Michelle Castro - Versalles
(15, 'Michelle Skin Care', 'Dermatocosmetóloga especializada en tratamientos para acné y rejuvenecimiento facial. Piel sana, piel hermosa.',
 ARRAY['Tratamientos para Acné', 'Rejuvenecimiento Facial', 'Peeling Químico', 'Microneedling'], 9,
 'Av. Versalles 567, Versalles', 'Puerto Vallarta', 'Jalisco', 'México', '48315',
 20.6167, -105.2045, '+523221234580',
 'Tratamientos dermatológicos avanzados para una piel radiante y saludable',
 '@michelle_skincare',
 '{"lunes": "8:00-17:00", "martes": "8:00-17:00", "miercoles": "8:00-17:00", "jueves": "8:00-17:00", "viernes": "8:00-18:00", "sabado": "9:00-16:00", "domingo": "cerrado"}',
 ARRAY['Dermatocosmética Avanzada', 'Tratamientos Médico-Estéticos'],
 ARRAY['Clear Skin Program', 'Age Reverse', 'Glow Treatment'],
 true, false, 25, 1600.00, 2.0, NOW() - INTERVAL '4 days', NOW()),

-- Alejandra Ruiz - Fluvial Vallarta
(16, 'Alejandra Color Lab', 'Laboratorio de color especializado en técnicas avanzadas de colorimetría. Cada color es creado específicamente para ti.',
 ARRAY['Colorimetría Avanzada', 'Color Balayage', 'Ombré', 'Color Melting'], 10,
 'Fluvial Plaza 234, Fluvial Vallarta', 'Puerto Vallarta', 'Jalisco', 'México', '48312',
 20.6223, -105.2178, '+523221234581',
 'Laboratorio de color personalizado con fórmulas exclusivas',
 '@alejandra_colorlab',
 '{"lunes": "10:00-19:00", "martes": "10:00-19:00", "miercoles": "10:00-19:00", "jueves": "10:00-19:00", "viernes": "10:00-20:00", "sabado": "9:00-18:00", "domingo": "cerrado"}',
 ARRAY['Master en Colorimetría', 'Técnicas de Color Avanzadas'],
 ARRAY['Custom Color', 'Dimensional Highlights', 'Color Fusion'],
 true, false, 22, 1200.00, 2.1, NOW() - INTERVAL '3 days', NOW()),

-- Natalia Mendoza - 5 de Diciembre
(17, 'Natalia Brows', 'Especialista en diseño de cejas y micropigmentación. Cada ceja es diseñada según la forma única de tu rostro.',
 ARRAY['Diseño de Cejas', 'Micropigmentación', 'Henna para Cejas', 'Laminado'], 5,
 '5 de Diciembre Ave 890, 5 de Diciembre', 'Puerto Vallarta', 'Jalisco', 'México', '48350',
 20.6089, -105.2189, '+523221234582',
 'Diseño de cejas personalizadas que enmarcan perfectamente tu rostro',
 '@natalia_brows',
 '{"lunes": "9:00-18:00", "martes": "9:00-18:00", "miercoles": "9:00-18:00", "jueves": "9:00-18:00", "viernes": "9:00-19:00", "sabado": "8:00-17:00", "domingo": "10:00-15:00"}',
 ARRAY['Micropigmentación Certificada', 'Diseño Facial Profesional'],
 ARRAY['Perfect Arch', 'Natural Fill', 'Laminated Look'],
 true, true, 18, 700.00, 1.9, NOW() - INTERVAL '2 days', NOW()),

-- Paola Aguilar - Emiliano Zapata
(18, 'Paola Hair Therapy', 'Tricóloga especializada en tratamientos capilares reconstructivos y terapias para caída del cabello.',
 ARRAY['Tricología', 'Tratamientos Reconstructivos', 'Caída del Cabello', 'Keratina'], 13,
 'Emiliano Zapata 456, Emiliano Zapata', 'Puerto Vallarta', 'Jalisco', 'México', '48380',
 20.6012, -105.2301, '+523221234583',
 'Tratamientos capilares especializados para la salud integral del cabello',
 '@paola_hairtherapy',
 '{"lunes": "8:00-17:00", "martes": "8:00-17:00", "miercoles": "8:00-17:00", "jueves": "8:00-17:00", "viernes": "8:00-18:00", "sabado": "9:00-16:00", "domingo": "cerrado"}',
 ARRAY['Tricología Certificada', 'Terapias Capilares Avanzadas'],
 ARRAY['Hair Reconstruction', 'Growth Therapy', 'Keratin Complex'],
 true, false, 30, 1400.00, 2.2, NOW() - INTERVAL '1 day', NOW()),

-- Karla Morales - Amapas
(19, 'Karla Vintage Salon', 'Especialista en estilos vintage y retro. Revivo la elegancia clásica con un toque moderno y sofisticado.',
 ARRAY['Estilos Vintage', 'Pin-Up Hair', 'Ondas de los 40s', 'Victory Rolls'], 6,
 'Amapas Street 678, Amapas', 'Puerto Vallarta', 'Jalisco', 'México', '48399',
 20.5967, -105.2389, '+523221234584',
 'Recreando la elegancia atemporal con técnicas clásicas perfeccionadas',
 '@karla_vintage',
 '{"lunes": "10:00-18:00", "martes": "10:00-18:00", "miercoles": "10:00-18:00", "jueves": "10:00-18:00", "viernes": "10:00-19:00", "sabado": "9:00-17:00", "domingo": "11:00-16:00"}',
 ARRAY['Styling Vintage Certificado', 'Técnicas Clásicas de Peinado'],
 ARRAY['Pin-Up Perfect', 'Hollywood Waves', '50s Elegance'],
 true, true, 20, 950.00, 1.7, NOW() - INTERVAL '12 hours', NOW()),

-- Gabriela Ortiz - Conchas Chinas
(20, 'Gabriela Luxury Spa', 'Spa de lujo especializado en tratamientos premium y relajación total. Una experiencia de belleza integral.',
 ARRAY['Tratamientos Premium', 'Spa Treatments', 'Faciales de Lujo', 'Masajes Signature'], 15,
 'Luxury Resort Area, Conchas Chinas', 'Puerto Vallarta', 'Jalisco', 'México', '48390',
 20.5845, -105.2456, '+523221234585',
 'Experiencias de spa de clase mundial con productos premium exclusivos',
 '@gabriela_luxuryspa',
 '{"lunes": "9:00-20:00", "martes": "9:00-20:00", "miercoles": "9:00-20:00", "jueves": "9:00-20:00", "viernes": "9:00-21:00", "sabado": "8:00-21:00", "domingo": "10:00-19:00"}',
 ARRAY['Terapias de Spa Internacional', 'Tratamientos de Lujo Certificados'],
 ARRAY['Diamond Facial', 'Gold Treatment', 'Caviar Therapy'],
 true, false, 50, 3000.00, 3.0, NOW() - INTERVAL '6 hours', NOW()),

-- Valeria Delgado - Marina Vallarta
(21, 'Valeria Style Studio', 'Estilista integral especializada en transformaciones completas. Desde el color hasta el corte, cada cambio es una obra de arte.',
 ARRAY['Transformaciones Completas', 'Estilismo Integral', 'Asesoría de Imagen', 'Cambios de Look'], 7,
 'Marina Complex 789, Marina Vallarta', 'Puerto Vallarta', 'Jalisco', 'México', '48335',
 20.6567, -105.2623, '+523221234586',
 'Transformaciones completas de imagen con asesoría personalizada',
 '@valeria_stylestudio',
 '{"lunes": "9:00-19:00", "martes": "9:00-19:00", "miercoles": "9:00-19:00", "jueves": "9:00-19:00", "viernes": "9:00-20:00", "sabado": "8:00-18:00", "domingo": "10:00-17:00"}',
 ARRAY['Asesoría de Imagen Profesional', 'Estilismo Integral Certificado'],
 ARRAY['Total Makeover', 'Style Consultation', 'Image Transformation'],
 true, false, 25, 1800.00, 2.3, NOW() - INTERVAL '2 hours', NOW());

COMMIT;

-- Display summary
SELECT 'Puerto Vallarta Stylists Created Successfully!' as status;
SELECT COUNT(*) as total_stylists FROM stylists;
SELECT COUNT(*) as total_users FROM users WHERE role = 'STYLIST';