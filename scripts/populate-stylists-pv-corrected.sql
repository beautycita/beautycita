-- Populate BeautyCita with 20 Realistic Stylists in Puerto Vallarta, Jalisco, Mexico
-- Corrected version matching actual database schema

BEGIN;

-- Insert 20 users (stylists)
INSERT INTO users (first_name, last_name, name, email, phone, password_hash, role, email_verified, phone_verified, is_active, profile_picture_url, created_at, updated_at) VALUES
('Isabella', 'Moreno', 'Isabella Moreno', 'isabella.moreno@beautycita.com', '+523221234567', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, 'https://images.unsplash.com/photo-1494790108755-2616c96c6817?w=400', NOW() - INTERVAL '30 days', NOW()),
('Sofía', 'Ramírez', 'Sofía Ramírez', 'sofia.ramirez@beautycita.com', '+523221234568', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', NOW() - INTERVAL '28 days', NOW()),
('Camila', 'González', 'Camila González', 'camila.gonzalez@beautycita.com', '+523221234569', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', NOW() - INTERVAL '25 days', NOW()),
('Valentina', 'López', 'Valentina López', 'valentina.lopez@beautycita.com', '+523221234570', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', NOW() - INTERVAL '22 days', NOW()),
('Lucía', 'Martínez', 'Lucía Martínez', 'lucia.martinez@beautycita.com', '+523221234571', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400', NOW() - INTERVAL '20 days', NOW()),
('Ximena', 'García', 'Ximena García', 'ximena.garcia@beautycita.com', '+523221234572', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=400', NOW() - INTERVAL '18 days', NOW()),
('Regina', 'Rodríguez', 'Regina Rodríguez', 'regina.rodriguez@beautycita.com', '+523221234573', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400', NOW() - INTERVAL '16 days', NOW()),
('Fernanda', 'Hernández', 'Fernanda Hernández', 'fernanda.hernandez@beautycita.com', '+523221234574', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400', NOW() - INTERVAL '14 days', NOW()),
('Daniela', 'Jiménez', 'Daniela Jiménez', 'daniela.jimenez@beautycita.com', '+523221234575', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400', NOW() - INTERVAL '12 days', NOW()),
('Paulina', 'Vásquez', 'Paulina Vásquez', 'paulina.vasquez@beautycita.com', '+523221234576', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', NOW() - INTERVAL '10 days', NOW()),
('Mariana', 'Torres', 'Mariana Torres', 'mariana.torres@beautycita.com', '+523221234577', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400', NOW() - INTERVAL '8 days', NOW()),
('Andrea', 'Flores', 'Andrea Flores', 'andrea.flores@beautycita.com', '+523221234578', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400', NOW() - INTERVAL '6 days', NOW()),
('Carolina', 'Peña', 'Carolina Peña', 'carolina.pena@beautycita.com', '+523221234579', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, 'https://images.unsplash.com/photo-1494790108755-2616c96c6817?w=400', NOW() - INTERVAL '5 days', NOW()),
('Michelle', 'Castro', 'Michelle Castro', 'michelle.castro@beautycita.com', '+523221234580', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400', NOW() - INTERVAL '4 days', NOW()),
('Alejandra', 'Ruiz', 'Alejandra Ruiz', 'alejandra.ruiz@beautycita.com', '+523221234581', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400', NOW() - INTERVAL '3 days', NOW()),
('Natalia', 'Mendoza', 'Natalia Mendoza', 'natalia.mendoza@beautycita.com', '+523221234582', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', NOW() - INTERVAL '2 days', NOW()),
('Paola', 'Aguilar', 'Paola Aguilar', 'paola.aguilar@beautycita.com', '+523221234583', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, 'https://images.unsplash.com/photo-1542103749-8ef59b94f47e?w=400', NOW() - INTERVAL '1 day', NOW()),
('Karla', 'Morales', 'Karla Morales', 'karla.morales@beautycita.com', '+523221234584', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, 'https://images.unsplash.com/photo-1488716820095-cbe80883c496?w=400', NOW() - INTERVAL '12 hours', NOW()),
('Gabriela', 'Ortiz', 'Gabriela Ortiz', 'gabriela.ortiz@beautycita.com', '+523221234585', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', NOW() - INTERVAL '6 hours', NOW()),
('Valeria', 'Delgado', 'Valeria Delgado', 'valeria.delgado@beautycita.com', '+523221234586', '$2b$12$LQv3c1yqBwlFFzlTEgIrdeQX8UOKvF/lhd25a8DGK5yjIwu.zD/Si', 'STYLIST', true, true, true, 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400', NOW() - INTERVAL '2 hours', NOW());

-- Insert SMS preferences for all new stylists
INSERT INTO sms_preferences (user_id, booking_confirmations, reminders, marketing, created_at, updated_at)
SELECT u.id, true, true, false, NOW(), NOW()
FROM users u WHERE u.role = 'STYLIST' AND u.id > 1;

-- Insert user credits for all new stylists
INSERT INTO user_credits (user_id, balance_cents, updated_at)
SELECT u.id, 0, NOW()
FROM users u WHERE u.role = 'STYLIST' AND u.id > 1;

-- Insert robust stylist profiles with detailed information
INSERT INTO stylists (user_id, business_name, bio, specialties, experience_years, location_address, location_city, location_state, location_zip, location_coordinates, salon_phone, service_description, working_hours, certifications, signature_styles, portfolio_published, pricing_tier, base_price_range, is_verified, created_at, updated_at, social_media_links)
VALUES
-- Isabella Moreno - Marina Vallarta
(2, 'Isabella Hair Studio', 'Especialista en colorimetría avanzada y cortes modernos. Con más de 8 años de experiencia, me apasiona crear looks únicos que realcen la belleza natural de cada cliente.',
 ARRAY['Colorimetría', 'Cortes Modernos', 'Balayage', 'Tratamientos Capilares'], 8,
 'Av. Paseo de la Marina 245, Marina Vallarta', 'Puerto Vallarta', 'Jalisco', '48335',
 POINT(-105.2606, 20.6554), '+523221234567',
 'Transformaciones capilares completas con técnicas europeas avanzadas',
 '{"lunes": "9:00-18:00", "martes": "9:00-18:00", "miercoles": "9:00-18:00", "jueves": "9:00-18:00", "viernes": "9:00-19:00", "sabado": "8:00-17:00", "domingo": "cerrado"}'::json,
 ARRAY['Certificación L''Oréal Professionnel', 'Colorimetría Avanzada Wella', 'Técnicas de Balayage'],
 ARRAY['Beach Waves', 'Rubio Californiano', 'Cortes Texturizados'],
 true, 'MID_RANGE', '$800-$1200', true, NOW() - INTERVAL '30 days', NOW(),
 '{"instagram": "@isabella_hairstudio", "facebook": "IsabellaHairStudioPV"}'::json),

-- Sofía Ramírez - Centro/Downtown
(3, 'Sofía Beauty Lounge', 'Maquilladora profesional especializada en novias y eventos especiales. Creo looks naturales y sofisticados que resaltan la personalidad única de cada mujer.',
 ARRAY['Maquillaje de Novias', 'Maquillaje para Eventos', 'Maquillaje Editorial', 'Cejas'], 6,
 'Calle Morelos 142, Centro', 'Puerto Vallarta', 'Jalisco', '48300',
 POINT(-105.2292, 20.6097), '+523221234568',
 'Maquillaje profesional para ocasiones especiales y sesiones fotográficas',
 '{"lunes": "10:00-19:00", "martes": "10:00-19:00", "miercoles": "10:00-19:00", "jueves": "10:00-19:00", "viernes": "9:00-20:00", "sabado": "8:00-18:00", "domingo": "10:00-16:00"}'::json,
 ARRAY['Certificación MAC Pro', 'Maquillaje de Novias Certificado', 'Microblading'],
 ARRAY['Natural Glow', 'Smokey Eyes', 'Delineado Perfecto'],
 true, 'PREMIUM', '$1200-$2000', true, NOW() - INTERVAL '28 days', NOW(),
 '{"instagram": "@sofia_beautylounge", "tiktok": "@sofiabeautyPV"}'::json),

-- Continue with more stylists using the correct schema...
-- Camila González - Zona Hotelera Norte
(4, 'Camila Nails Art', 'Nail artist con especialización en diseños artísticos y técnicas japonesas. Cada uña es una pequeña obra de arte que refleja tu estilo personal.',
 ARRAY['Nail Art', 'Manicure Japonés', 'Uñas Acrílicas', 'Diseños Personalizados'], 5,
 'Blvd. Francisco Medina Ascencio 2485, Zona Hotelera Norte', 'Puerto Vallarta', 'Jalisco', '48333',
 POINT(-105.2521, 20.6319), '+523221234569',
 'Nail art exclusivo con diseños únicos y técnicas innovadoras',
 '{"lunes": "9:00-17:00", "martes": "9:00-17:00", "miercoles": "9:00-17:00", "jueves": "9:00-17:00", "viernes": "9:00-18:00", "sabado": "9:00-18:00", "domingo": "11:00-16:00"}'::json,
 ARRAY['Certificación en Nail Art Japonés', 'Técnicas de Acrílico Avanzado', 'Diseño Digital'],
 ARRAY['Minimalista Chic', 'Arte Floral', 'Geometric Nails'],
 true, 'MID_RANGE', '$600-$1000', true, NOW() - INTERVAL '25 days', NOW(),
 '{"instagram": "@camila_nailsart", "youtube": "CamilaNailsTV"}'::json),

-- Valentina López - Zona Hotelera Sur
(5, 'Valentina Spa & Beauty', 'Esteticista holística especializada en tratamientos faciales anti-edad y terapias naturales. Combino técnicas ancestrales con tecnología moderna.',
 ARRAY['Tratamientos Faciales', 'Anti-Aging', 'Limpieza Profunda', 'Terapias Naturales'], 10,
 'Blvd. Francisco Medina Ascencio 1123, Zona Hotelera Sur', 'Puerto Vallarta', 'Jalisco', '48390',
 POINT(-105.2401, 20.6180), '+523221234570',
 'Tratamientos faciales personalizados con productos orgánicos certificados',
 '{"lunes": "8:00-19:00", "martes": "8:00-19:00", "miercoles": "8:00-19:00", "jueves": "8:00-19:00", "viernes": "8:00-20:00", "sabado": "8:00-18:00", "domingo": "10:00-17:00"}'::json,
 ARRAY['Certificación en Cosmetología Holística', 'Terapias Anti-Edad', 'Aromaterapia'],
 ARRAY['Facial Oro 24k', 'Hidratación Profunda', 'Lifting Natural'],
 true, 'PREMIUM', '$1500-$2500', true, NOW() - INTERVAL '22 days', NOW(),
 '{"instagram": "@valentina_spa", "website": "www.valentinaspa.com"}'::json),

-- Continue with remaining stylists (abbreviated for space)...
(6, 'Lucía Extensions', 'Especialista en extensiones de cabello y técnicas de alargamiento capilar.',
 ARRAY['Extensiones de Cabello', 'Técnica Tape-In', 'Microlinks'], 7,
 'Av. Fluvial Vallarta 1445, Fluvial Vallarta', 'Puerto Vallarta', 'Jalisco', '48312',
 POINT(-105.2156, 20.6234), '+523221234571',
 'Extensiones de cabello natural con técnicas no invasivas',
 '{"lunes": "10:00-18:00", "martes": "10:00-18:00", "miercoles": "10:00-18:00", "jueves": "10:00-18:00", "viernes": "10:00-19:00", "sabado": "9:00-17:00", "domingo": "cerrado"}'::json,
 ARRAY['Certificación en Extensiones Profesionales'], ARRAY['Volumen Natural', 'Longitud Perfecta'],
 true, 'PREMIUM', '$2000-$3000', true, NOW() - INTERVAL '20 days', NOW(),
 '{"instagram": "@lucia_extensions"}'::json),

(7, 'Ximena Studio', 'Peluquera integral especializada en peinados para eventos.',
 ARRAY['Peinados para Eventos', 'Styling Profesional', 'Ondas'], 9,
 'Calle Versalles 234, Versalles', 'Puerto Vallarta', 'Jalisco', '48315',
 POINT(-105.2034, 20.6156), '+523221234572',
 'Peinados elegantes para toda ocasión especial',
 '{"lunes": "9:00-17:00", "martes": "9:00-17:00", "miercoles": "9:00-17:00", "jueves": "9:00-17:00", "viernes": "8:00-19:00", "sabado": "7:00-18:00", "domingo": "9:00-15:00"}'::json,
 ARRAY['Styling Profesional Certificado'], ARRAY['Ondas Hollywood', 'Recogidos Románticos'],
 true, 'MID_RANGE', '$900-$1400', true, NOW() - INTERVAL '18 days', NOW(),
 '{"instagram": "@ximena_studio"}'::json),

(8, 'Regina Beauty Center', 'Cosmetóloga integral con especialización en tratamientos corporales.',
 ARRAY['Tratamientos Corporales', 'Depilación Láser', 'Masajes'], 8,
 'Calle 5 de Diciembre 567, 5 de Diciembre', 'Puerto Vallarta', 'Jalisco', '48350',
 POINT(-105.2167, 20.6078), '+523221234573',
 'Tratamientos corporales avanzados con tecnología de última generación',
 '{"lunes": "8:00-19:00", "martes": "8:00-19:00", "miercoles": "8:00-19:00", "jueves": "8:00-19:00", "viernes": "8:00-20:00", "sabado": "8:00-17:00", "domingo": "cerrado"}'::json,
 ARRAY['Certificación en Depilación Láser'], ARRAY['Tratamiento Reafirmante', 'Depilación Definitiva'],
 true, 'PREMIUM', '$1800-$2800', true, NOW() - INTERVAL '16 days', NOW(),
 '{"instagram": "@regina_beautycenter"}'::json),

(9, 'Fernanda Hair Color', 'Colorista experta en técnicas de decoloración y colores fantasía.',
 ARRAY['Coloración Fantasía', 'Decoloración', 'Color Correction'], 6,
 'Av. Emiliano Zapata 789, Emiliano Zapata', 'Puerto Vallarta', 'Jalisco', '48380',
 POINT(-105.2289, 20.6001), '+523221234574',
 'Especialista en colores únicos y corrección de color profesional',
 '{"lunes": "10:00-19:00", "martes": "10:00-19:00", "miercoles": "10:00-19:00", "jueves": "10:00-19:00", "viernes": "10:00-20:00", "sabado": "9:00-18:00", "domingo": "cerrado"}'::json,
 ARRAY['Colorimetría Avanzada'], ARRAY['Color Fantasía', 'Rubio Platino'],
 true, 'MID_RANGE', '$1100-$1700', true, NOW() - INTERVAL '14 days', NOW(),
 '{"instagram": "@fernanda_haircolor"}'::json),

(10, 'Daniela Lashes', 'Especialista en extensiones de pestañas y treatments de cejas.',
 ARRAY['Extensiones de Pestañas', 'Lifting de Pestañas', 'Microblading'], 4,
 'Calle Amapas 321, Amapas', 'Puerto Vallarta', 'Jalisco', '48399',
 POINT(-105.2378, 20.5956), '+523221234575',
 'Extensiones de pestañas naturales para una mirada perfecta',
 '{"lunes": "9:00-18:00", "martes": "9:00-18:00", "miercoles": "9:00-18:00", "jueves": "9:00-18:00", "viernes": "9:00-19:00", "sabado": "8:00-17:00", "domingo": "10:00-15:00"}'::json,
 ARRAY['Certificación en Extensiones de Pestañas'], ARRAY['Mirada Natural', 'Volume Lashes'],
 true, 'MID_RANGE', '$800-$1300', true, NOW() - INTERVAL '12 days', NOW(),
 '{"instagram": "@daniela_lashes"}'::json),

-- Add remaining 10 stylists with abbreviated data for space
(11, 'Paulina Makeup Art', 'Maquilladora editorial especializada en efectos especiales.',
 ARRAY['Maquillaje Editorial', 'Efectos Especiales'], 7,
 'Calle Conchas Chinas 156', 'Puerto Vallarta', 'Jalisco', '48390',
 POINT(-105.2445, 20.5834), '+523221234576', 'Maquillaje artístico para producciones',
 '{"lunes": "11:00-19:00", "martes": "11:00-19:00", "miercoles": "11:00-19:00", "jueves": "11:00-19:00", "viernes": "10:00-20:00", "sabado": "9:00-18:00", "domingo": "cerrado"}'::json,
 ARRAY['Maquillaje Editorial Certificado'], ARRAY['Fantasy Makeup'],
 true, 'PREMIUM', '$1500-$2500', true, NOW() - INTERVAL '10 days', NOW(),
 '{"instagram": "@paulina_makeupart"}'::json),

(12, 'Mariana Wellness', 'Terapeuta de belleza holística.',
 ARRAY['Tratamientos Holísticos', 'Anti-Estrés'], 11,
 'Marina del Rey 445', 'Puerto Vallarta', 'Jalisco', '48335',
 POINT(-105.2634, 20.6578), '+523221234577', 'Belleza desde el bienestar interior',
 '{"lunes": "8:00-18:00", "martes": "8:00-18:00", "miercoles": "8:00-18:00", "jueves": "8:00-18:00", "viernes": "8:00-19:00", "sabado": "9:00-17:00", "domingo": "10:00-16:00"}'::json,
 ARRAY['Terapia Holística'], ARRAY['Relajación Total'],
 true, 'MID_RANGE', '$1300-$1900', true, NOW() - INTERVAL '8 days', NOW(),
 '{"instagram": "@mariana_wellness"}'::json),

(13, 'Andrea Cuts', 'Estilista de vanguardia especializada en cortes geométricos.',
 ARRAY['Cortes Geométricos', 'Estilos Urbanos'], 8,
 'Av. Juárez 234', 'Puerto Vallarta', 'Jalisco', '48300',
 POINT(-105.2298, 20.6112), '+523221234578', 'Cortes modernos que definen personalidad',
 '{"lunes": "9:00-18:00", "martes": "9:00-18:00", "miercoles": "9:00-18:00", "jueves": "9:00-18:00", "viernes": "9:00-19:00", "sabado": "8:00-17:00", "domingo": "cerrado"}'::json,
 ARRAY['Técnicas de Corte Vanguardistas'], ARRAY['Geometric Bob'],
 true, 'MID_RANGE', '$850-$1250', true, NOW() - INTERVAL '6 days', NOW(),
 '{"instagram": "@andrea_cuts"}'::json),

(14, 'Carolina Bridal', 'Especialista en novias con más de una década de experiencia.',
 ARRAY['Maquillaje de Novias', 'Peinados Nupciales'], 12,
 'Hotel Zone Plaza 789', 'Puerto Vallarta', 'Jalisco', '48333',
 POINT(-105.2567, 20.6289), '+523221234579', 'Creando looks nupciales perfectos',
 '{"lunes": "10:00-17:00", "martes": "10:00-17:00", "miercoles": "10:00-17:00", "jueves": "10:00-17:00", "viernes": "9:00-19:00", "sabado": "7:00-20:00", "domingo": "8:00-16:00"}'::json,
 ARRAY['Especialización en Novias'], ARRAY['Classic Bride'],
 true, 'LUXURY', '$2500-$4000', true, NOW() - INTERVAL '5 days', NOW(),
 '{"instagram": "@carolina_bridal"}'::json),

(15, 'Michelle Skin Care', 'Dermatocosmetóloga especializada en tratamientos para acné.',
 ARRAY['Tratamientos para Acné', 'Rejuvenecimiento Facial'], 9,
 'Av. Versalles 567', 'Puerto Vallarta', 'Jalisco', '48315',
 POINT(-105.2045, 20.6167), '+523221234580', 'Tratamientos dermatológicos avanzados',
 '{"lunes": "8:00-17:00", "martes": "8:00-17:00", "miercoles": "8:00-17:00", "jueves": "8:00-17:00", "viernes": "8:00-18:00", "sabado": "9:00-16:00", "domingo": "cerrado"}'::json,
 ARRAY['Dermatocosmética Avanzada'], ARRAY['Clear Skin Program'],
 true, 'PREMIUM', '$1600-$2400', true, NOW() - INTERVAL '4 days', NOW(),
 '{"instagram": "@michelle_skincare"}'::json),

(16, 'Alejandra Color Lab', 'Laboratorio de color especializado en técnicas avanzadas.',
 ARRAY['Colorimetría Avanzada', 'Color Balayage'], 10,
 'Fluvial Plaza 234', 'Puerto Vallarta', 'Jalisco', '48312',
 POINT(-105.2178, 20.6223), '+523221234581', 'Laboratorio de color personalizado',
 '{"lunes": "10:00-19:00", "martes": "10:00-19:00", "miercoles": "10:00-19:00", "jueves": "10:00-19:00", "viernes": "10:00-20:00", "sabado": "9:00-18:00", "domingo": "cerrado"}'::json,
 ARRAY['Master en Colorimetría'], ARRAY['Custom Color'],
 true, 'PREMIUM', '$1200-$2200', true, NOW() - INTERVAL '3 days', NOW(),
 '{"instagram": "@alejandra_colorlab"}'::json),

(17, 'Natalia Brows', 'Especialista en diseño de cejas y micropigmentación.',
 ARRAY['Diseño de Cejas', 'Micropigmentación'], 5,
 '5 de Diciembre Ave 890', 'Puerto Vallarta', 'Jalisco', '48350',
 POINT(-105.2189, 20.6089), '+523221234582', 'Diseño de cejas personalizadas',
 '{"lunes": "9:00-18:00", "martes": "9:00-18:00", "miercoles": "9:00-18:00", "jueves": "9:00-18:00", "viernes": "9:00-19:00", "sabado": "8:00-17:00", "domingo": "10:00-15:00"}'::json,
 ARRAY['Micropigmentación Certificada'], ARRAY['Perfect Arch'],
 true, 'MID_RANGE', '$700-$1200', true, NOW() - INTERVAL '2 days', NOW(),
 '{"instagram": "@natalia_brows"}'::json),

(18, 'Paola Hair Therapy', 'Tricóloga especializada en tratamientos capilares.',
 ARRAY['Tricología', 'Tratamientos Reconstructivos'], 13,
 'Emiliano Zapata 456', 'Puerto Vallarta', 'Jalisco', '48380',
 POINT(-105.2301, 20.6012), '+523221234583', 'Tratamientos para la salud del cabello',
 '{"lunes": "8:00-17:00", "martes": "8:00-17:00", "miercoles": "8:00-17:00", "jueves": "8:00-17:00", "viernes": "8:00-18:00", "sabado": "9:00-16:00", "domingo": "cerrado"}'::json,
 ARRAY['Tricología Certificada'], ARRAY['Hair Reconstruction'],
 true, 'PREMIUM', '$1400-$2200', true, NOW() - INTERVAL '1 day', NOW(),
 '{"instagram": "@paola_hairtherapy"}'::json),

(19, 'Karla Vintage Salon', 'Especialista en estilos vintage y retro.',
 ARRAY['Estilos Vintage', 'Pin-Up Hair'], 6,
 'Amapas Street 678', 'Puerto Vallarta', 'Jalisco', '48399',
 POINT(-105.2389, 20.5967), '+523221234584', 'Recreando la elegancia atemporal',
 '{"lunes": "10:00-18:00", "martes": "10:00-18:00", "miercoles": "10:00-18:00", "jueves": "10:00-18:00", "viernes": "10:00-19:00", "sabado": "9:00-17:00", "domingo": "11:00-16:00"}'::json,
 ARRAY['Styling Vintage'], ARRAY['Pin-Up Perfect'],
 true, 'MID_RANGE', '$950-$1450', true, NOW() - INTERVAL '12 hours', NOW(),
 '{"instagram": "@karla_vintage"}'::json),

(20, 'Gabriela Luxury Spa', 'Spa de lujo especializado en tratamientos premium.',
 ARRAY['Tratamientos Premium', 'Spa Treatments'], 15,
 'Luxury Resort Area', 'Puerto Vallarta', 'Jalisco', '48390',
 POINT(-105.2456, 20.5845), '+523221234585', 'Experiencias de spa de clase mundial',
 '{"lunes": "9:00-20:00", "martes": "9:00-20:00", "miercoles": "9:00-20:00", "jueves": "9:00-20:00", "viernes": "9:00-21:00", "sabado": "8:00-21:00", "domingo": "10:00-19:00"}'::json,
 ARRAY['Terapias de Spa Internacional'], ARRAY['Diamond Facial'],
 true, 'LUXURY', '$3000-$5000', true, NOW() - INTERVAL '6 hours', NOW(),
 '{"instagram": "@gabriela_luxuryspa"}'::json),

(21, 'Valeria Style Studio', 'Estilista integral especializada en transformaciones.',
 ARRAY['Transformaciones Completas', 'Estilismo Integral'], 7,
 'Marina Complex 789', 'Puerto Vallarta', 'Jalisco', '48335',
 POINT(-105.2623, 20.6567), '+523221234586', 'Transformaciones completas de imagen',
 '{"lunes": "9:00-19:00", "martes": "9:00-19:00", "miercoles": "9:00-19:00", "jueves": "9:00-19:00", "viernes": "9:00-20:00", "sabado": "8:00-18:00", "domingo": "10:00-17:00"}'::json,
 ARRAY['Asesoría de Imagen'], ARRAY['Total Makeover'],
 true, 'PREMIUM', '$1800-$2800', true, NOW() - INTERVAL '2 hours', NOW(),
 '{"instagram": "@valeria_stylestudio"}'::json);

COMMIT;

-- Display summary
SELECT 'Puerto Vallarta Stylists Created Successfully!' as status;
SELECT COUNT(*) as total_stylists FROM stylists;
SELECT COUNT(*) as total_users FROM users WHERE role = 'STYLIST';
SELECT business_name, location_city, pricing_tier FROM stylists ORDER BY created_at DESC;