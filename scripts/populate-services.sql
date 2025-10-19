-- Insert services for all stylists
INSERT INTO services (stylist_id, name, description, duration_minutes, price, category, is_active) VALUES
-- Isabella Moreno (Bella Studio) - Coloración specialist
(50, 'Coloración Completa', 'Cambio de color completo con productos L''Oréal Professional', 180, 1200.00, 'COLOR', true),
(50, 'Mechas Tradicionales', 'Mechas clásicas para iluminar el cabello', 120, 800.00, 'COLOR', true),
(50, 'Tratamiento Capilar Profundo', 'Hidratación y reparación intensiva', 60, 450.00, 'TREATMENT', true),
(50, 'Corte y Peinado', 'Corte moderno con peinado incluido', 90, 350.00, 'CUT', true),

-- Sofia Ramirez (Sofia Beauty Bar) - Maquillaje
(51, 'Maquillaje de Novia', 'Maquillaje completo para el día más especial', 120, 1800.00, 'MAKEUP', true),
(51, 'Maquillaje para Eventos', 'Look perfecto para cualquier ocasión especial', 90, 1200.00, 'MAKEUP', true),
(51, 'Maquillaje Editorial', 'Técnicas profesionales para fotografía', 60, 950.00, 'MAKEUP', true),
(51, 'Prueba de Maquillaje', 'Sesión para definir el look perfecto', 45, 400.00, 'MAKEUP', true),

-- Camila Gonzalez (Camila Nail Studio) - Nail art
(52, 'Manicura Rusa', 'Técnica de manicura con cuticulas perfectas', 90, 500.00, 'NAILS', true),
(52, 'Nail Art Personalizado', 'Diseños únicos según tu estilo', 60, 400.00, 'NAILS', true),
(52, 'Uñas de Gel', 'Esmaltado semi-permanente de larga duración', 45, 300.00, 'NAILS', true),
(52, 'Uñas Acrílicas', 'Extensiones con diseño incluido', 120, 650.00, 'NAILS', true),

-- Valentina Lopez (Valentina Spa & Beauty) - Tratamientos faciales
(53, 'Hidrafacial Completo', 'Limpieza profunda con tecnología avanzada', 75, 1400.00, 'FACIAL', true),
(53, 'Tratamiento Anti-edad', 'Radiofrecuencia y productos premium', 90, 1600.00, 'FACIAL', true),
(53, 'Limpieza Facial Profunda', 'Extracción y hidratación profesional', 60, 800.00, 'FACIAL', true),
(53, 'Peeling Químico', 'Renovación celular con ácidos', 45, 1200.00, 'FACIAL', true),

-- Lucia Martinez (Lucia Hair Design) - Cortes modernos
(54, 'Corte Pixie', 'Corte corto moderno y versátil', 60, 600.00, 'CUT', true),
(54, 'Color Fantasía', 'Colores vibrantes y creativos', 150, 1200.00, 'COLOR', true),
(54, 'Corte y Color', 'Transformación completa de look', 180, 1400.00, 'STYLING', true),
(54, 'Peinado de Evento', 'Peinados únicos para ocasiones especiales', 90, 500.00, 'STYLING', true),

-- Ximena Garcia (Ximena Brow Studio) - Cejas
(55, 'Micropigmentación de Cejas', 'Cejas perfectas que duran años', 120, 2500.00, 'BROWS', true),
(55, 'Diseño de Cejas', 'Depilación y forma perfecta', 30, 200.00, 'BROWS', true),
(55, 'Laminado de Cejas', 'Cejas ordenadas y con volumen', 45, 350.00, 'BROWS', true),
(55, 'Tinte de Cejas', 'Color natural y duradero', 20, 150.00, 'BROWS', true),

-- Regina Rodriguez (Regina Glamour) - Novias
(56, 'Peinado de Novia', 'Peinado romántico para el gran día', 90, 1200.00, 'STYLING', true),
(56, 'Maquillaje y Peinado Quinceañera', 'Look completo para celebrar 15 años', 150, 1600.00, 'STYLING', true),
(56, 'Prueba de Peinado', 'Sesión para definir el peinado perfecto', 60, 400.00, 'STYLING', true),
(56, 'Peinado para Madrina', 'Elegancia para acompañantes especiales', 75, 800.00, 'STYLING', true),

-- Fernanda Hernandez (Fer Beauty Lounge) - Masajes
(57, 'Masaje Relajante Completo', 'Relajación total de cuerpo y mente', 90, 800.00, 'MASSAGE', true),
(57, 'Tratamiento Corporal Hidratante', 'Hidratación profunda de la piel', 75, 650.00, 'TREATMENT', true),
(57, 'Aromaterapia', 'Masaje con aceites esenciales', 60, 550.00, 'MASSAGE', true),
(57, 'Reflexología', 'Masaje terapéutico de pies', 45, 400.00, 'MASSAGE', true),

-- Daniela Jimenez (Dani Color Studio) - Balayage
(58, 'Balayage Premium', 'Técnica francesa para rubios naturales', 180, 1500.00, 'COLOR', true),
(58, 'Mechas Californianas', 'Look playero y natural', 150, 1200.00, 'COLOR', true),
(58, 'Corrección de Color', 'Reparación de coloraciones previas', 240, 1800.00, 'COLOR', true),
(58, 'Mantenimiento de Balayage', 'Retoque de raíces y brillo', 90, 800.00, 'COLOR', true),

-- Paulina Vasquez (Paulina Lash Studio) - Pestañas
(59, 'Extensiones de Pestañas Clásicas', 'Volumen natural y elegante', 120, 600.00, 'LASHES', true),
(59, 'Volumen Ruso', 'Técnica avanzada para máximo volumen', 150, 800.00, 'LASHES', true),
(59, 'Lash Lifting', 'Curvatura natural sin extensiones', 60, 450.00, 'LASHES', true),
(59, 'Retoque de Extensiones', 'Mantenimiento cada 2-3 semanas', 75, 350.00, 'LASHES', true),

-- Mariana Torres (Mari Skin Care) - Cuidado de piel
(60, 'Tratamiento para Acné', 'Protocolo especializado anti-acné', 75, 900.00, 'FACIAL', true),
(60, 'Consulta Dermatológica', 'Evaluación personalizada de la piel', 45, 500.00, 'CONSULTATION', true),
(60, 'Hidratación Intensiva', 'Tratamiento para piel seca', 60, 700.00, 'FACIAL', true),
(60, 'Limpieza Anti-edad', 'Prevención y tratamiento de arrugas', 90, 1100.00, 'FACIAL', true),

-- Andrea Flores (Andrea Style) - Cambios de look
(61, 'Cambio de Look Completo', 'Transformación total con asesoramiento', 240, 2000.00, 'STYLING', true),
(61, 'Asesoramiento de Imagen', 'Consulta para definir tu estilo', 90, 800.00, 'CONSULTATION', true),
(61, 'Corte + Color + Styling', 'Servicio integral de transformación', 180, 1600.00, 'STYLING', true),
(61, 'Sesión de Fotos de Belleza', 'Maquillaje y peinado para fotos', 120, 1200.00, 'STYLING', true),

-- Carolina Pena (Caro Beauty Room) - Tecnología estética
(62, 'Radiofrecuencia Facial', 'Rejuvenecimiento con tecnología avanzada', 60, 1500.00, 'FACIAL', true),
(62, 'Tratamiento Anti-edad Integral', 'Protocolo completo anti-envejecimiento', 90, 2000.00, 'FACIAL', true),
(62, 'Hidratación con Ácido Hialurónico', 'Hidratación profunda profesional', 75, 1800.00, 'FACIAL', true),
(62, 'Limpieza con Ultrasonido', 'Tecnología de punta para limpieza', 45, 1200.00, 'FACIAL', true),

-- Michelle Castro (Michelle Nails & More) - Pedicura spa
(63, 'Pedicura Spa Completa', 'Relajación total para tus pies', 90, 500.00, 'NAILS', true),
(63, 'Manicura con Diseño', 'Uñas perfectas con arte personalizado', 75, 400.00, 'NAILS', true),
(63, 'Tratamiento de Manos', 'Hidratación y cuidado profesional', 45, 300.00, 'TREATMENT', true),
(63, 'Pedicura Express', 'Cuidado rápido y efectivo', 45, 250.00, 'NAILS', true),

-- Alejandra Ruiz (Ale Hair Boutique) - Cabello rizado
(64, 'Tratamiento para Cabello Rizado', 'Cuidado especializado para rizos', 90, 800.00, 'TREATMENT', true),
(64, 'Alisado con Keratina', 'Alisado duradero y natural', 180, 1400.00, 'TREATMENT', true),
(64, 'Corte para Rizos', 'Corte especializado que realza tus rizos', 60, 450.00, 'CUT', true),
(64, 'Hidratación Profunda', 'Tratamiento intensivo para cabello dañado', 75, 600.00, 'TREATMENT', true),

-- Natalia Mendoza (Nat Makeup Studio) - Fotografía
(65, 'Maquillaje para Fotografía', 'Look perfecto para sesiones profesionales', 75, 1200.00, 'MAKEUP', true),
(65, 'Maquillaje HD', 'Técnica de alta definición', 60, 950.00, 'MAKEUP', true),
(65, 'Maquillaje para Video', 'Resistente y duradero para grabaciones', 90, 1300.00, 'MAKEUP', true),
(65, 'Maquillaje Corporativo', 'Look profesional para eventos empresariales', 45, 700.00, 'MAKEUP', true),

-- Paola Aguilar (Paola Wellness Spa) - Masajes terapéuticos
(66, 'Masaje Terapéutico', 'Alivio de tensiones y contracturas', 75, 900.00, 'MASSAGE', true),
(66, 'Reflexología Completa', 'Equilibrio energético a través de los pies', 60, 700.00, 'MASSAGE', true),
(66, 'Masaje de Relajación Profunda', 'Desconexión total del estrés', 90, 1100.00, 'MASSAGE', true),
(66, 'Sesión de Aromaterapia', 'Bienestar integral con aceites esenciales', 75, 850.00, 'TREATMENT', true),

-- Karla Morales (Karla Beauty Lab) - Pestañas y cejas
(67, 'Laminado de Cejas y Pestañas', 'Tratamiento completo para mirada perfecta', 75, 650.00, 'BROWS', true),
(67, 'Tinte de Pestañas', 'Color duradero y natural', 30, 200.00, 'LASHES', true),
(67, 'Diseño Personalizado de Cejas', 'Forma única según tu rostro', 45, 300.00, 'BROWS', true),
(67, 'Mantenimiento de Cejas', 'Retoque semanal para look perfecto', 20, 150.00, 'BROWS', true),

-- Gabriela Ortiz (Gaby Color House) - Colores fantasía
(68, 'Color Fantasía Completo', 'Colores vibrantes y únicos', 180, 1300.00, 'COLOR', true),
(68, 'Decoloración Segura', 'Técnica profesional para bases claras', 120, 800.00, 'COLOR', true),
(68, 'Look Creativo', 'Diseños únicos con múltiples colores', 240, 1500.00, 'COLOR', true),
(68, 'Mantenimiento de Color', 'Retoque de raíces y vivacidad', 90, 600.00, 'COLOR', true),

-- Valeria Delgado (Vale Glam Studio) - Quinceañeras
(69, 'Maquillaje y Peinado Quinceañera', 'Look completo para tu celebración', 180, 1600.00, 'STYLING', true),
(69, 'Maquillaje para Graduación', 'Elegancia juvenil para tu gran día', 90, 800.00, 'MAKEUP', true),
(69, 'Peinado Juvenil', 'Estilos modernos para jóvenes', 75, 500.00, 'STYLING', true),
(69, 'Prueba de Look', 'Sesión para definir tu estilo perfecto', 60, 350.00, 'CONSULTATION', true);