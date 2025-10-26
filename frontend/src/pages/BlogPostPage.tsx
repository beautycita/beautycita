import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  ShareIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

const BlogPostPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
    const handleStorageChange = () => setIsDarkMode(localStorage.getItem('darkMode') === 'true')
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Blog post content database
  const blogPosts: Record<string, {
    title: { en: string; es: string }
    subtitle: { en: string; es: string }
    category: string
    gradient: string
    date: string
    readTime: string
    author: string
    content: { en: string[]; es: string[] }
  }> = {
    '10000-bookings-milestone': {
      title: {
        en: 'We Hit 10,000 Bookings!',
        es: 'Alcanzamos 10,000 Reservas!'
      },
      subtitle: {
        en: 'A milestone celebration and thank you to our amazing community',
        es: 'Un hito de celebración y agradecimiento a nuestra increíble comunidad'
      },
      category: 'business',
      gradient: 'from-pink-500 to-purple-600',
      date: '2025-10-20',
      readTime: '5 min',
      author: 'BeautyCita Team',
      content: {
        en: [
          'We are thrilled to announce that BeautyCita has reached an incredible milestone: 10,000 successful bookings! This achievement represents not just a number, but thousands of beauty professionals connecting with clients who trust our platform.',
          'When we started BeautyCita, our vision was simple: make beauty services accessible, trustworthy, and seamless for everyone. Today, we\'re proud to say that vision is becoming reality.',
          'This milestone wouldn\'t be possible without our dedicated stylists, barbers, nail technicians, and beauty professionals who deliver exceptional service every single day. You are the heart of our platform.',
          'To our clients: thank you for trusting us with your beauty needs. Your reviews, feedback, and loyalty drive us to improve constantly.',
          'Looking ahead, we\'re excited to announce new features coming soon: AI-powered beauty recommendations, enhanced stylist profiles, and expanded service categories. Stay tuned!',
          'Here\'s to the next 10,000 bookings and beyond. Together, we\'re transforming the beauty industry, one appointment at a time.'
        ],
        es: [
          'Estamos emocionados de anunciar que BeautyCita ha alcanzado un hito increíble: ¡10,000 reservas exitosas! Este logro representa no solo un número, sino miles de profesionales de la belleza conectando con clientes que confían en nuestra plataforma.',
          'Cuando comenzamos BeautyCita, nuestra visión era simple: hacer que los servicios de belleza sean accesibles, confiables y fluidos para todos. Hoy, nos enorgullece decir que esa visión se está haciendo realidad.',
          'Este hito no sería posible sin nuestros dedicados estilistas, barberos, técnicos de uñas y profesionales de la belleza que brindan un servicio excepcional todos los días. Ustedes son el corazón de nuestra plataforma.',
          'A nuestros clientes: gracias por confiar en nosotros con sus necesidades de belleza. Sus reseñas, comentarios y lealtad nos impulsan a mejorar constantemente.',
          'Mirando hacia adelante, estamos emocionados de anunciar nuevas funciones que llegarán pronto: recomendaciones de belleza impulsadas por IA, perfiles mejorados de estilistas y categorías de servicios ampliadas. ¡Estén atentos!',
          'Por los próximos 10,000 reservas y más allá. Juntos, estamos transformando la industria de la belleza, una cita a la vez.'
        ]
      }
    },
    'ai-beauty-recommendations': {
      title: {
        en: 'AI in Beauty Recommendations',
        es: 'IA en Recomendaciones de Belleza'
      },
      subtitle: {
        en: 'How artificial intelligence is personalizing your beauty experience',
        es: 'Cómo la inteligencia artificial está personalizando tu experiencia de belleza'
      },
      category: 'tech',
      gradient: 'from-purple-500 to-blue-600',
      date: '2025-10-18',
      readTime: '7 min',
      author: 'Dr. Sofia Martinez, CTO',
      content: {
        en: [
          'Artificial intelligence is revolutionizing the beauty industry, and BeautyCita is at the forefront of this transformation. Our AI-powered recommendation system analyzes thousands of data points to match you with the perfect stylist and services.',
          'How does it work? Our machine learning algorithms consider your beauty preferences, past bookings, stylist ratings, location, budget, and even seasonal trends to suggest the best options for you.',
          'Privacy is our top priority. All AI analysis happens securely and anonymously. We never share your personal data, and you always have full control over your information.',
          'The results speak for themselves: users who follow AI recommendations report 92% satisfaction rates, compared to 78% for manual searches. Our AI also helps stylists optimize their schedules and pricing.',
          'Looking ahead, we\'re developing even more advanced features: virtual hair color try-ons, skin tone analysis for makeup recommendations, and predictive booking suggestions based on your lifestyle.',
          'The future of beauty is intelligent, personalized, and accessible. We\'re excited to bring these innovations to you.'
        ],
        es: [
          'La inteligencia artificial está revolucionando la industria de la belleza, y BeautyCita está a la vanguardia de esta transformación. Nuestro sistema de recomendaciones impulsado por IA analiza miles de puntos de datos para emparejarte con el estilista y servicios perfectos.',
          '¿Cómo funciona? Nuestros algoritmos de aprendizaje automático consideran tus preferencias de belleza, reservas pasadas, calificaciones de estilistas, ubicación, presupuesto e incluso tendencias estacionales para sugerirte las mejores opciones.',
          'La privacidad es nuestra máxima prioridad. Todo el análisis de IA ocurre de forma segura y anónima. Nunca compartimos tus datos personales, y siempre tienes control total sobre tu información.',
          'Los resultados hablan por sí mismos: los usuarios que siguen las recomendaciones de IA reportan tasas de satisfacción del 92%, en comparación con el 78% para búsquedas manuales. Nuestra IA también ayuda a los estilistas a optimizar sus horarios y precios.',
          'Mirando hacia el futuro, estamos desarrollando características aún más avanzadas: pruebas virtuales de color de cabello, análisis de tono de piel para recomendaciones de maquillaje y sugerencias de reservas predictivas basadas en tu estilo de vida.',
          'El futuro de la belleza es inteligente, personalizado y accesible. Estamos emocionados de traerte estas innovaciones.'
        ]
      }
    },
    'summer-beauty-trends-2025': {
      title: {
        en: 'Summer Beauty Trends 2025',
        es: 'Tendencias de Belleza Verano 2025'
      },
      subtitle: {
        en: 'The hottest looks and styles for the upcoming season',
        es: 'Los looks y estilos más calientes para la próxima temporada'
      },
      category: 'beauty',
      gradient: 'from-pink-500 to-orange-500',
      date: '2025-10-15',
      readTime: '6 min',
      author: 'Isabella Rodriguez, Style Director',
      content: {
        en: [
          'Summer 2025 is all about bold colors, natural textures, and sustainable beauty. We\'ve analyzed thousands of bookings on BeautyCita to identify the top trends you\'ll want to try this season.',
          '1. **Sunset Hair Colors**: Think warm oranges, pinks, and golden yellows. These vibrant hues are perfect for summer and look stunning in natural light.',
          '2. **Minimalist Nails**: The "clean girl" aesthetic continues with nude nails, French tips with a twist, and simple geometric designs.',
          '3. **Sun-Kissed Skin**: Natural, dewy makeup that enhances rather than covers. Bronzers and highlighters are essential for this look.',
          '4. **Textured Waves**: Beachy, effortless waves are replacing sleek, straight styles. Sea salt sprays and curl creams are must-haves.',
          '5. **Sustainable Products**: Eco-friendly, vegan, and cruelty-free products are no longer optional—they\'re expected. Our stylists are increasingly using sustainable brands.',
          'Book your summer transformation on BeautyCita today. Our AI can match you with stylists who specialize in these trending looks!'
        ],
        es: [
          'El verano 2025 se trata de colores audaces, texturas naturales y belleza sostenible. Hemos analizado miles de reservas en BeautyCita para identificar las principales tendencias que querrás probar esta temporada.',
          '1. **Colores de Cabello Atardecer**: Piensa en naranjas cálidos, rosas y amarillos dorados. Estos tonos vibrantes son perfectos para el verano y se ven impresionantes con luz natural.',
          '2. **Uñas Minimalistas**: La estética "clean girl" continúa con uñas nude, puntas francesas con un giro y diseños geométricos simples.',
          '3. **Piel Besada por el Sol**: Maquillaje natural y luminoso que realza en lugar de cubrir. Los bronceadores e iluminadores son esenciales para este look.',
          '4. **Ondas Texturizadas**: Las ondas playeras y sin esfuerzo están reemplazando los estilos lisos y elegantes. Los sprays de sal marina y cremas para rizos son imprescindibles.',
          '5. **Productos Sostenibles**: Los productos ecológicos, veganos y libres de crueldad ya no son opcionales, son esperados. Nuestros estilistas están utilizando cada vez más marcas sostenibles.',
          '¡Reserva tu transformación de verano en BeautyCita hoy! ¡Nuestra IA puede emparejarte con estilistas especializados en estos looks de tendencia!'
        ]
      }
    },
    'stylist-success-stories': {
      title: {
        en: 'Stylist Success Stories',
        es: 'Historias de Éxito de Estilistas'
      },
      subtitle: {
        en: 'How BeautyCita is empowering beauty professionals to grow their business',
        es: 'Cómo BeautyCita está empoderando a los profesionales de la belleza para hacer crecer su negocio'
      },
      category: 'business',
      gradient: 'from-purple-500 to-pink-600',
      date: '2025-10-12',
      readTime: '8 min',
      author: 'Maria Santos, Community Manager',
      content: {
        en: [
          'Meet three incredible stylists who transformed their careers using BeautyCita. Their stories demonstrate the power of our platform to connect talent with opportunity.',
          '**Carmen\'s Story**: "I was working at a salon, making minimum wage with no control over my schedule. BeautyCita changed everything. Now I\'m fully booked three weeks in advance, charging premium rates, and I work when I want. In my first year, my income tripled."',
          '**Diego\'s Journey**: "As a mobile barber, finding new clients was a constant struggle. BeautyCita\'s AI recommendation system sends me clients who love my style. I\'ve gone from 5 clients per week to 30, and my ratings are consistently 5 stars."',
          '**Lucia\'s Transformation**: "I specialized in bridal makeup but couldn\'t compete with established salons. BeautyCita\'s portfolio features and verified reviews helped me stand out. Now I\'m booked solid for wedding season, and brides find me through the app."',
          'What makes these success stories possible? Our platform provides:',
          '• Smart scheduling tools that optimize your calendar',
          '• AI-powered client matching based on your specialties',
          '• Secure payments with no cash handling',
          '• Professional portfolio features to showcase your work',
          '• Marketing support through our recommendation algorithm',
          'Ready to write your own success story? Join BeautyCita today and start growing your business.'
        ],
        es: [
          'Conoce a tres estilistas increíbles que transformaron sus carreras usando BeautyCita. Sus historias demuestran el poder de nuestra plataforma para conectar el talento con la oportunidad.',
          '**La Historia de Carmen**: "Trabajaba en un salón, ganando el salario mínimo sin control sobre mi horario. BeautyCita lo cambió todo. Ahora estoy completamente reservada con tres semanas de anticipación, cobrando tarifas premium y trabajo cuando quiero. En mi primer año, mis ingresos se triplicaron."',
          '**El Viaje de Diego**: "Como barbero móvil, encontrar nuevos clientes era una lucha constante. El sistema de recomendaciones de IA de BeautyCita me envía clientes que aman mi estilo. Pasé de 5 clientes por semana a 30, y mis calificaciones son consistentemente de 5 estrellas."',
          '**La Transformación de Lucía**: "Me especialicé en maquillaje de novias pero no podía competir con salones establecidos. Las funciones de portafolio y reseñas verificadas de BeautyCita me ayudaron a destacar. Ahora estoy reservada completamente para la temporada de bodas, y las novias me encuentran a través de la app."',
          '¿Qué hace posibles estas historias de éxito? Nuestra plataforma proporciona:',
          '• Herramientas de programación inteligentes que optimizan tu calendario',
          '• Emparejamiento de clientes impulsado por IA basado en tus especialidades',
          '• Pagos seguros sin manejo de efectivo',
          '• Funciones de portafolio profesional para mostrar tu trabajo',
          '• Soporte de marketing a través de nuestro algoritmo de recomendaciones',
          '¿Listo para escribir tu propia historia de éxito? Únete a BeautyCita hoy y comienza a hacer crecer tu negocio.'
        ]
      }
    },
    'skincare-routine-guide': {
      title: {
        en: 'Skincare Routine Guide',
        es: 'Guía de Rutina de Cuidado de la Piel'
      },
      subtitle: {
        en: 'Expert tips for building the perfect skincare routine for your skin type',
        es: 'Consejos expertos para construir la rutina perfecta de cuidado de la piel para tu tipo de piel'
      },
      category: 'beauty',
      gradient: 'from-blue-500 to-purple-600',
      date: '2025-10-10',
      readTime: '10 min',
      author: 'Dr. Ana Flores, Dermatologist',
      content: {
        en: [
          'A consistent skincare routine is the foundation of healthy, glowing skin. But with so many products and conflicting advice, where do you start? This comprehensive guide breaks down everything you need to know.',
          '**Understanding Your Skin Type**',
          'Before building your routine, identify your skin type: oily, dry, combination, sensitive, or normal. Your routine should address your specific needs.',
          '**The Essential Steps**',
          '1. **Cleanse** (AM & PM): Remove dirt, oil, and makeup. Use a gentle, pH-balanced cleanser suitable for your skin type.',
          '2. **Tone** (AM & PM): Balance your skin\'s pH and prep it for treatment products. Look for alcohol-free toners with hydrating ingredients.',
          '3. **Treat** (AM & PM): Apply serums targeting specific concerns—vitamin C for brightness, hyaluronic acid for hydration, retinol for aging.',
          '4. **Moisturize** (AM & PM): Lock in hydration with a moisturizer appropriate for your skin type. Don\'t skip this even if you have oily skin!',
          '5. **Protect** (AM only): Sunscreen is non-negotiable. Use SPF 30+ daily, even when it\'s cloudy.',
          '**Common Mistakes to Avoid**',
          '• Over-exfoliating (2-3 times per week is enough)',
          '• Skipping sunscreen',
          '• Using too many products at once',
          '• Not patch testing new products',
          '• Expecting overnight results (skin cell turnover takes 28 days)',
          '**Product Recommendations by Skin Type**',
          'Book a facial or skincare consultation with our expert estheticians on BeautyCita. They can analyze your skin and recommend personalized products and treatments.',
          'Remember: consistency is key. Stick with your routine for at least 6-8 weeks before expecting visible results.'
        ],
        es: [
          'Una rutina de cuidado de la piel consistente es la base de una piel sana y radiante. Pero con tantos productos y consejos contradictorios, ¿por dónde empezar? Esta guía completa desglosa todo lo que necesitas saber.',
          '**Entendiendo Tu Tipo de Piel**',
          'Antes de construir tu rutina, identifica tu tipo de piel: grasa, seca, mixta, sensible o normal. Tu rutina debe abordar tus necesidades específicas.',
          '**Los Pasos Esenciales**',
          '1. **Limpiar** (AM y PM): Elimina suciedad, aceite y maquillaje. Usa un limpiador suave con pH balanceado adecuado para tu tipo de piel.',
          '2. **Tonificar** (AM y PM): Balancea el pH de tu piel y prepárala para productos de tratamiento. Busca tónicos sin alcohol con ingredientes hidratantes.',
          '3. **Tratar** (AM y PM): Aplica sueros dirigidos a preocupaciones específicas—vitamina C para brillo, ácido hialurónico para hidratación, retinol para envejecimiento.',
          '4. **Hidratar** (AM y PM): Sella la hidratación con una crema hidratante apropiada para tu tipo de piel. ¡No te saltes esto incluso si tienes piel grasa!',
          '5. **Proteger** (solo AM): El protector solar no es negociable. Usa SPF 30+ diariamente, incluso cuando esté nublado.',
          '**Errores Comunes a Evitar**',
          '• Exfoliación excesiva (2-3 veces por semana es suficiente)',
          '• Saltarse el protector solar',
          '• Usar demasiados productos a la vez',
          '• No hacer pruebas de parche con nuevos productos',
          '• Esperar resultados de la noche a la mañana (la renovación celular de la piel toma 28 días)',
          '**Recomendaciones de Productos por Tipo de Piel**',
          'Reserva un facial o consulta de cuidado de la piel con nuestros esteticistas expertos en BeautyCita. Pueden analizar tu piel y recomendar productos y tratamientos personalizados.',
          'Recuerda: la consistencia es clave. Mantén tu rutina durante al menos 6-8 semanas antes de esperar resultados visibles.'
        ]
      }
    },
    'platform-security-update': {
      title: {
        en: 'Platform Security Update',
        es: 'Actualización de Seguridad de la Plataforma'
      },
      subtitle: {
        en: 'New security features to protect your data and transactions',
        es: 'Nuevas funciones de seguridad para proteger tus datos y transacciones'
      },
      category: 'tech',
      gradient: 'from-pink-500 to-purple-600',
      date: '2025-10-08',
      readTime: '5 min',
      author: 'Security Team',
      content: {
        en: [
          'Your security is our top priority. Today, we\'re announcing significant upgrades to BeautyCita\'s security infrastructure to protect your personal information and financial transactions.',
          '**What\'s New**',
          '1. **End-to-End Encryption**: All messages between clients and stylists are now encrypted. Not even BeautyCita staff can read your private conversations.',
          '2. **Biometric Authentication**: Enable fingerprint or face recognition login for quick, secure access to your account.',
          '3. **Two-Factor Authentication (2FA)**: Add an extra layer of security with SMS or authenticator app verification.',
          '4. **Payment Security**: We\'ve upgraded to PCI DSS Level 1 compliance, the highest security standard for payment processing. All payment data is tokenized and never stored on our servers.',
          '5. **Fraud Detection**: Our AI now monitors for suspicious activity and automatically flags unusual booking patterns or payment attempts.',
          '**Your Privacy**',
          'We\'ve updated our privacy policy to give you more control:',
          '• Delete your account and all data with one click',
          '• Download your complete data history',
          '• Control exactly what information stylists can see',
          '• Opt out of marketing communications anytime',
          '**Best Practices**',
          '• Use a strong, unique password (we recommend a password manager)',
          '• Enable 2FA for maximum protection',
          '• Never share your login credentials',
          '• Update the app regularly to get the latest security patches',
          'Questions about security? Visit our Help Center or contact support@beautycita.com. We\'re here to help keep you safe.'
        ],
        es: [
          'Tu seguridad es nuestra máxima prioridad. Hoy, anunciamos actualizaciones significativas a la infraestructura de seguridad de BeautyCita para proteger tu información personal y transacciones financieras.',
          '**Qué Hay de Nuevo**',
          '1. **Cifrado de Extremo a Extremo**: Todos los mensajes entre clientes y estilistas ahora están cifrados. Ni siquiera el personal de BeautyCita puede leer tus conversaciones privadas.',
          '2. **Autenticación Biométrica**: Habilita el inicio de sesión con huella digital o reconocimiento facial para un acceso rápido y seguro a tu cuenta.',
          '3. **Autenticación de Dos Factores (2FA)**: Agrega una capa adicional de seguridad con verificación por SMS o aplicación de autenticación.',
          '4. **Seguridad de Pagos**: Hemos actualizado al cumplimiento PCI DSS Nivel 1, el estándar de seguridad más alto para procesamiento de pagos. Todos los datos de pago se tokenizan y nunca se almacenan en nuestros servidores.',
          '5. **Detección de Fraude**: Nuestra IA ahora monitorea actividad sospechosa y marca automáticamente patrones de reservas inusuales o intentos de pago.',
          '**Tu Privacidad**',
          'Hemos actualizado nuestra política de privacidad para darte más control:',
          '• Elimina tu cuenta y todos los datos con un clic',
          '• Descarga tu historial de datos completo',
          '• Controla exactamente qué información pueden ver los estilistas',
          '• Opta por no recibir comunicaciones de marketing en cualquier momento',
          '**Mejores Prácticas**',
          '• Usa una contraseña fuerte y única (recomendamos un administrador de contraseñas)',
          '• Habilita 2FA para máxima protección',
          '• Nunca compartas tus credenciales de inicio de sesión',
          '• Actualiza la app regularmente para obtener los últimos parches de seguridad',
          '¿Preguntas sobre seguridad? Visita nuestro Centro de Ayuda o contacta support@beautycita.com. Estamos aquí para ayudarte a mantenerte seguro.'
        ]
      }
    },
    'theme-song-launch': {
      title: {
        en: 'BeautyCita Launches Original Theme Song "Resplandece"',
        es: 'BeautyCita Lanza Canción Tema Original "Resplandece"'
      },
      subtitle: {
        en: 'An original composition celebrating beauty professionals and authentic connections',
        es: 'Una composición original celebrando profesionales de la belleza y conexiones auténticas'
      },
      category: 'business',
      gradient: 'from-purple-500 to-blue-600',
      date: '2025-09-05',
      readTime: '6 min',
      author: 'BeautyCita Creative Team',
      content: {
        en: [
          'Today marks a special milestone in BeautyCita\'s journey: the release of "Resplandece" (Shine), our original brand anthem composed, produced, and recorded entirely in-house by our creative team in Puerto Vallarta, Mexico.',
          '**The Story Behind "Resplandece"**',
          'When we set out to create a musical identity for BeautyCita, we knew we didn\'t want something generic or licensed. We wanted a piece of music that captured the essence of what makes our platform special: the transformative power of beauty services and the deep connections between professionals and clients.',
          '"Resplandece" was written over three months by our creative director working closely with our community of stylists. We interviewed beauty professionals across Mexico about what their work means to them. The recurring theme? Beauty is about helping people shine—not just physically, but emotionally and spiritually.',
          '**A Grassroots Production**',
          'True to BeautyCita\'s grassroots ethos, we produced "Resplandece" entirely without external agencies or studios. Our creative team learned music production, lyrics were refined through feedback from our stylist community, and vocals were recorded in a converted office space that became our makeshift studio.',
          'The song features layered harmonies that symbolize the collaboration between stylists and clients, uplifting melodies representing the confidence boost from a great beauty service, and rhythmic elements reflecting the vibrant energy of salons and barbershops.',
          '**Listen to "Resplandece"**',
          'You can hear "Resplandece" throughout the BeautyCita platform—during booking confirmations, in our mobile app, and on our website. We\'ve also made the full track available for download in our media kit for press and content creators.',
          'The song is more than background music—it\'s a celebration of our community. Every note represents a stylist\'s dedication, every harmony a client\'s transformation, and every beat the pulse of the beauty industry we serve.',
          '**What Our Community Says**',
          '"Hearing \'Resplandece\' when a client books with me gives me goosebumps every time. It\'s like BeautyCita understands that we\'re not just scheduling appointments—we\'re creating moments of transformation." — Carmen Ruiz, Hair Stylist, Guadalajara',
          '"The song captures exactly how I feel after a great salon visit. It\'s empowering and beautiful, just like the BeautyCita experience." — Maria L., BeautyCita Client',
          '**Looking Forward**',
          '"Resplandece" is just the beginning of our creative journey. We\'re developing more original audio elements, custom notification sounds, and even exploring a full album featuring different beauty professionals\' stories set to music.',
          'This is what happens when a tech platform remembers it\'s human first. We don\'t just connect people—we celebrate them. And now, we have a soundtrack to prove it.',
          'Download "Resplandece" from our press kit, share it with your networks, and let us know what you think. This is your song as much as it\'s ours.'
        ],
        es: [
          'Hoy marca un hito especial en el viaje de BeautyCita: el lanzamiento de "Resplandece", nuestro himno de marca original compuesto, producido y grabado enteramente internamente por nuestro equipo creativo en Puerto Vallarta, México.',
          '**La Historia Detrás de "Resplandece"**',
          'Cuando nos propusimos crear una identidad musical para BeautyCita, sabíamos que no queríamos algo genérico o licenciado. Queríamos una pieza musical que capturara la esencia de lo que hace especial a nuestra plataforma: el poder transformador de los servicios de belleza y las profundas conexiones entre profesionales y clientes.',
          '"Resplandece" fue escrita durante tres meses por nuestro director creativo trabajando estrechamente con nuestra comunidad de estilistas. Entrevistamos a profesionales de la belleza en todo México sobre qué significa su trabajo para ellos. ¿El tema recurrente? La belleza se trata de ayudar a las personas a brillar, no solo físicamente, sino emocional y espiritualmente.',
          '**Una Producción de Base**',
          'Fiel al espíritu de base de BeautyCita, produjimos "Resplandece" enteramente sin agencias externas o estudios. Nuestro equipo creativo aprendió producción musical, las letras se refinaron a través de comentarios de nuestra comunidad de estilistas, y las vocales se grabaron en un espacio de oficina convertido que se convirtió en nuestro estudio improvisado.',
          'La canción presenta armonías en capas que simbolizan la colaboración entre estilistas y clientes, melodías edificantes que representan el impulso de confianza de un gran servicio de belleza, y elementos rítmicos que reflejan la energía vibrante de salones y barberías.',
          '**Escucha "Resplandece"**',
          'Puedes escuchar "Resplandece" en toda la plataforma BeautyCita: durante confirmaciones de reservas, en nuestra aplicación móvil y en nuestro sitio web. También hemos hecho disponible la pista completa para descargar en nuestro kit de medios para prensa y creadores de contenido.',
          'La canción es más que música de fondo: es una celebración de nuestra comunidad. Cada nota representa la dedicación de un estilista, cada armonía la transformación de un cliente, y cada latido el pulso de la industria de la belleza que servimos.',
          '**Lo Que Dice Nuestra Comunidad**',
          '"Escuchar \'Resplandece\' cuando un cliente reserva conmigo me da escalofríos cada vez. Es como si BeautyCita entendiera que no solo estamos programando citas, estamos creando momentos de transformación." — Carmen Ruiz, Estilista de Cabello, Guadalajara',
          '"La canción captura exactamente cómo me siento después de una gran visita al salón. Es empoderadora y hermosa, justo como la experiencia BeautyCita." — Maria L., Cliente BeautyCita',
          '**Mirando Hacia Adelante**',
          '"Resplandece" es solo el comienzo de nuestro viaje creativo. Estamos desarrollando más elementos de audio originales, sonidos de notificación personalizados, e incluso explorando un álbum completo con historias de diferentes profesionales de la belleza puestas en música.',
          'Esto es lo que sucede cuando una plataforma tecnológica recuerda que es humana primero. No solo conectamos personas, las celebramos. Y ahora, tenemos una banda sonora para probarlo.',
          'Descarga "Resplandece" de nuestro kit de prensa, compártelo con tus redes y déjanos saber qué piensas. Esta es tu canción tanto como es nuestra.'
        ]
      }
    },
    'in-house-creative': {
      title: {
        en: '100% In-House: How BeautyCita Creates All Video & Artwork Internally',
        es: '100% Interno: Cómo BeautyCita Crea Todo el Video y Arte Internamente'
      },
      subtitle: {
        en: 'Behind the scenes of our grassroots creative production—no agencies, all heart',
        es: 'Detrás de escena de nuestra producción creativa de base—sin agencias, todo corazón'
      },
      category: 'business',
      gradient: 'from-pink-500 to-orange-500',
      date: '2025-08-18',
      readTime: '8 min',
      author: 'Creative Department, BeautyCita',
      content: {
        en: [
          'In an industry dominated by polished agency campaigns and stock photography, BeautyCita stands out: 100% of our platform videos, graphics, animations, and creative assets are produced entirely in-house by our small but mighty team in Puerto Vallarta, Mexico.',
          '**Why We Create Everything Ourselves**',
          'When BeautyCita launched, we had a choice: hire expensive marketing agencies or learn to create everything ourselves. We chose the latter, not just for budget reasons, but because outsourcing felt inauthentic to our mission.',
          'How can we claim to empower beauty professionals if our own branding is outsourced to strangers who don\'t understand the industry? If we\'re building a grassroots platform for real people, our creative work needs to come from real people who live and breathe this community.',
          '**Our DIY Creative Setup**',
          'Our "studio" is a converted office space with repurposed lighting, secondhand cameras, and free software. Our video editing suite? A desktop computer and determination. Our graphic design department? Two self-taught designers who learned Adobe Creative Suite through YouTube tutorials.',
          'Every homepage video, every promotional graphic, every animation, every icon—created by us. When you see a banner on BeautyCita, that was made by someone who interviews stylists weekly, understands their struggles, and celebrates their wins.',
          '**The Creative Process**',
          '**Video Production**: We film everything locally—salon visits, stylist interviews, client testimonials. No actors, no scripts, just real moments. Our founder often holds the camera. Our CTO manages lighting. Everyone contributes.',
          '**Graphic Design**: Our design philosophy is simple: authentic over polished. We use real photography from our stylist community instead of stock images. Our color palettes come from actual salons we\'ve visited. Our typography reflects the diversity of our user base.',
          '**Audio & Music**: Beyond our original theme song "Resplandece," we\'ve created custom notification sounds, UI audio feedback, and ambient music for the platform. All composed in-house using free digital audio workstations.',
          '**Animation & Motion Graphics**: Every loading animation, transition effect, and micro-interaction is hand-crafted by our team. We believe even the smallest details should feel personal and intentional.',
          '**The Portfolio**',
          'To date, our in-house creative team has produced:',
          '• 47 promotional videos (homepage banners, feature demos, tutorials)',
          '• 200+ custom graphics (social media posts, email templates, in-app banners)',
          '• 5 logo variations and complete brand identity package',
          '• 15 UI icon sets totaling 500+ individual icons',
          '• 1 original theme song with 7 custom notification sounds',
          '• 30+ animated sequences and loading states',
          '• Complete video editing and post-production for all content',
          '**Challenges We\'ve Overcome**',
          'Creating everything internally isn\'t easy. We\'ve had countless failed takes, design iterations that went nowhere, and audio recordings ruined by background noise. We\'ve learned video editing, sound engineering, color grading, motion graphics, and 3D modeling—all while running a tech startup.',
          'But here\'s what we\'ve gained: complete creative control, authentic storytelling, rapid iteration without agency timelines, zero licensing fees or usage restrictions, and a team that deeply understands our brand because they built it.',
          '**Why This Matters**',
          'When beauty professionals join BeautyCita, they see themselves in our content. The salons in our videos look like their salons. The stylists in our images share their struggles. The stories we tell are their stories.',
          'This authenticity isn\'t just aesthetically pleasing—it builds trust. Stylists know we\'re not a faceless corporation. We\'re people like them, working hard to build something real.',
          '**Our Creative Team**',
          'Meet the small team behind every visual element of BeautyCita:',
          '• **Creative Director** (also handles video production and audio): 1 person',
          '• **Graphic Designers**: 2 people',
          '• **Video Editor/Motion Graphics**: 1 person',
          '• **Contributing Photographers** (stylists who share their work): 50+ community members',
          'That\'s it. Four core people creating everything you see, hear, and interact with on BeautyCita. Plus our incredible community of stylists who contribute real photos and stories.',
          '**Download Our Work**',
          'We\'re proud of what we\'ve built, and we want to share it. Our complete media kit includes sample videos, high-resolution brand assets, and behind-the-scenes photos of our creative process. It\'s all available in the Press section of our website.',
          'Journalists, content creators, and partners are welcome to use our materials with attribution. Unlike most companies, we don\'t have complex licensing agreements—just download what you need and credit BeautyCita.',
          '**Looking Ahead**',
          'As we grow, we\'re committed to keeping creative production in-house. We\'re investing in better equipment, expanding our team, and pushing our creative boundaries—but never outsourcing our soul.',
          'Next up: immersive 360° salon tours, augmented reality hair color try-ons, and a documentary series featuring beauty professionals across Mexico. All created by us, for our community.',
          'Because at BeautyCita, we don\'t just use creativity to sell services. We use creativity to celebrate the artists who make our platform possible.',
          'This is beauty, unfiltered. This is BeautyCita.'
        ],
        es: [
          'En una industria dominada por campañas de agencia pulidas y fotografía de archivo, BeautyCita se destaca: el 100% de nuestros videos de plataforma, gráficos, animaciones y activos creativos son producidos enteramente internamente por nuestro pequeño pero poderoso equipo en Puerto Vallarta, México.',
          '**Por Qué Creamos Todo Nosotros Mismos**',
          'Cuando BeautyCita se lanzó, tuvimos una opción: contratar agencias de marketing caras o aprender a crear todo nosotros mismos. Elegimos lo segundo, no solo por razones presupuestarias, sino porque la subcontratación se sentía poco auténtica para nuestra misión.',
          '¿Cómo podemos afirmar que empoderamos a profesionales de la belleza si nuestra propia marca está subcontratada a extraños que no entienden la industria? Si estamos construyendo una plataforma de base para personas reales, nuestro trabajo creativo necesita venir de personas reales que viven y respiran esta comunidad.',
          '**Nuestra Configuración Creativa de Bricolaje**',
          'Nuestro "estudio" es un espacio de oficina convertido con iluminación reutilizada, cámaras de segunda mano y software gratuito. ¿Nuestra suite de edición de video? Una computadora de escritorio y determinación. ¿Nuestro departamento de diseño gráfico? Dos diseñadores autodidactas que aprendieron Adobe Creative Suite a través de tutoriales de YouTube.',
          'Cada video de página de inicio, cada gráfico promocional, cada animación, cada ícono—creado por nosotros. Cuando ves un banner en BeautyCita, fue hecho por alguien que entrevista a estilistas semanalmente, entiende sus luchas y celebra sus victorias.',
          '**El Proceso Creativo**',
          '**Producción de Video**: Filmamos todo localmente—visitas a salones, entrevistas con estilistas, testimonios de clientes. Sin actores, sin guiones, solo momentos reales. Nuestro fundador a menudo sostiene la cámara. Nuestro CTO maneja la iluminación. Todos contribuyen.',
          '**Diseño Gráfico**: Nuestra filosofía de diseño es simple: auténtico sobre pulido. Usamos fotografía real de nuestra comunidad de estilistas en lugar de imágenes de archivo. Nuestras paletas de colores provienen de salones reales que hemos visitado. Nuestra tipografía refleja la diversidad de nuestra base de usuarios.',
          '**Audio y Música**: Más allá de nuestra canción tema original "Resplandece", hemos creado sonidos de notificación personalizados, retroalimentación de audio de interfaz y música ambiente para la plataforma. Todo compuesto internamente usando estaciones de trabajo de audio digital gratuitas.',
          '**Animación y Gráficos en Movimiento**: Cada animación de carga, efecto de transición y micro-interacción está hecho a mano por nuestro equipo. Creemos que incluso los detalles más pequeños deben sentirse personales e intencionales.',
          '**El Portafolio**',
          'Hasta la fecha, nuestro equipo creativo interno ha producido:',
          '• 47 videos promocionales (banners de página de inicio, demos de características, tutoriales)',
          '• Más de 200 gráficos personalizados (publicaciones en redes sociales, plantillas de correo electrónico, banners en la aplicación)',
          '• 5 variaciones de logo y paquete de identidad de marca completo',
          '• 15 conjuntos de iconos de interfaz con más de 500 iconos individuales',
          '• 1 canción tema original con 7 sonidos de notificación personalizados',
          '• Más de 30 secuencias animadas y estados de carga',
          '• Edición de video completa y postproducción para todo el contenido',
          '**Desafíos Que Hemos Superado**',
          'Crear todo internamente no es fácil. Hemos tenido innumerables tomas fallidas, iteraciones de diseño que no llegaron a ninguna parte y grabaciones de audio arruinadas por ruido de fondo. Hemos aprendido edición de video, ingeniería de sonido, gradación de color, gráficos en movimiento y modelado 3D, todo mientras dirigimos una startup tecnológica.',
          'Pero esto es lo que hemos ganado: control creativo completo, narración auténtica, iteración rápida sin plazos de agencia, cero tarifas de licencia o restricciones de uso, y un equipo que entiende profundamente nuestra marca porque la construyeron.',
          '**Por Qué Esto Importa**',
          'Cuando los profesionales de la belleza se unen a BeautyCita, se ven a sí mismos en nuestro contenido. Los salones en nuestros videos se ven como sus salones. Los estilistas en nuestras imágenes comparten sus luchas. Las historias que contamos son sus historias.',
          'Esta autenticidad no es solo estéticamente agradable, construye confianza. Los estilistas saben que no somos una corporación sin rostro. Somos personas como ellos, trabajando duro para construir algo real.',
          '**Nuestro Equipo Creativo**',
          'Conoce al pequeño equipo detrás de cada elemento visual de BeautyCita:',
          '• **Director Creativo** (también maneja producción de video y audio): 1 persona',
          '• **Diseñadores Gráficos**: 2 personas',
          '• **Editor de Video/Gráficos en Movimiento**: 1 persona',
          '• **Fotógrafos Contribuyentes** (estilistas que comparten su trabajo): más de 50 miembros de la comunidad',
          'Eso es todo. Cuatro personas principales creando todo lo que ves, escuchas e interactúas en BeautyCita. Además de nuestra increíble comunidad de estilistas que contribuyen con fotos e historias reales.',
          '**Descarga Nuestro Trabajo**',
          'Estamos orgullosos de lo que hemos construido y queremos compartirlo. Nuestro kit de medios completo incluye videos de muestra, activos de marca de alta resolución y fotos detrás de escena de nuestro proceso creativo. Todo está disponible en la sección de Prensa de nuestro sitio web.',
          'Periodistas, creadores de contenido y socios son bienvenidos a usar nuestros materiales con atribución. A diferencia de la mayoría de las empresas, no tenemos acuerdos de licencia complejos, solo descarga lo que necesites y acredita a BeautyCita.',
          '**Mirando Hacia Adelante**',
          'A medida que crecemos, estamos comprometidos a mantener la producción creativa internamente. Estamos invirtiendo en mejor equipo, expandiendo nuestro equipo y empujando nuestros límites creativos, pero nunca subcontratando nuestra alma.',
          'Próximamente: tours de salón inmersivos de 360°, pruebas de color de cabello con realidad aumentada y una serie documental con profesionales de la belleza en todo México. Todo creado por nosotros, para nuestra comunidad.',
          'Porque en BeautyCita, no solo usamos la creatividad para vender servicios. Usamos la creatividad para celebrar a los artistas que hacen posible nuestra plataforma.',
          'Esto es belleza, sin filtros. Esto es BeautyCita.'
        ]
      }
    }
  }

  const post = slug ? blogPosts[slug] : null

  if (!post) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <h1 className={`text-4xl font-serif font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {i18n.language === 'es' ? 'Artículo No Encontrado' : 'Post Not Found'}
          </h1>
          <p className={`mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {i18n.language === 'es'
              ? 'Lo sentimos, no pudimos encontrar este artículo del blog.'
              : 'Sorry, we couldn\'t find this blog post.'}
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:shadow-lg transition-all"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            {i18n.language === 'es' ? 'Volver al Blog' : 'Back to Blog'}
          </Link>
        </div>
      </div>
    )
  }

  const lang = i18n.language === 'es' ? 'es' : 'en'

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section with Gradient */}
      <div className={`relative bg-gradient-to-r ${post.gradient} text-white py-20`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Back Button */}
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 mb-8 text-white/90 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              {i18n.language === 'es' ? 'Volver al Blog' : 'Back to Blog'}
            </Link>

            {/* Category Badge */}
            <div className="mb-4">
              <span className="px-4 py-1 rounded-full text-sm font-semibold bg-white/20 backdrop-blur-sm uppercase">
                {post.category}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4">
              {post.title[lang]}
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-white/90 mb-6">
              {post.subtitle[lang]}
            </p>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 text-white/80">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                <span>{new Date(post.date).toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                <span>{post.readTime} {i18n.language === 'es' ? 'lectura' : 'read'}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                <span>{post.author}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className={`rounded-2xl p-8 md:p-12 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}>
              <div className={`prose prose-lg max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
                {post.content[lang].map((paragraph, index) => (
                  <p key={index} className={`mb-6 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {paragraph.split('**').map((part, i) =>
                      i % 2 === 0 ? part : <strong key={i} className="font-bold">{part}</strong>
                    )}
                  </p>
                ))}
              </div>

              {/* Call to Action */}
              <div className={`mt-12 p-6 rounded-xl ${isDarkMode ? 'bg-gradient-to-r from-pink-500/20 to-purple-600/20' : 'bg-gradient-to-r from-pink-50 to-purple-50'}`}>
                <h3 className={`text-xl font-serif font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {i18n.language === 'es' ? '¿Listo para Reservar?' : 'Ready to Book?'}
                </h3>
                <p className={`mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {i18n.language === 'es'
                    ? 'Descubre profesionales de belleza increíbles en BeautyCita.'
                    : 'Discover amazing beauty professionals on BeautyCita.'}
                </p>
                <Link
                  to="/booking"
                  className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:shadow-lg transition-all hover:scale-105"
                >
                  {i18n.language === 'es' ? 'Reservar Ahora' : 'Book Now'}
                </Link>
              </div>
            </div>
          </motion.article>

          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-1"
          >
            {/* Engagement Actions */}
            <div className={`rounded-2xl p-6 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}>
              <h3 className={`text-lg font-serif font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {i18n.language === 'es' ? 'Interactuar' : 'Engage'}
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${
                    isLiked
                      ? 'bg-pink-500 text-white'
                      : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isLiked ? (
                    <HeartSolidIcon className="h-5 w-5" />
                  ) : (
                    <HeartIcon className="h-5 w-5" />
                  )}
                  <span>{i18n.language === 'es' ? 'Me Gusta' : 'Like'}</span>
                </button>

                <button
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${
                    isBookmarked
                      ? 'bg-purple-500 text-white'
                      : isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <BookmarkIcon className="h-5 w-5" />
                  <span>{i18n.language === 'es' ? 'Guardar' : 'Save'}</span>
                </button>

                <button
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ShareIcon className="h-5 w-5" />
                  <span>{i18n.language === 'es' ? 'Compartir' : 'Share'}</span>
                </button>

                <button
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ChatBubbleLeftIcon className="h-5 w-5" />
                  <span>{i18n.language === 'es' ? 'Comentar' : 'Comment'}</span>
                </button>
              </div>
            </div>

            {/* Related Posts */}
            <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}>
              <h3 className={`text-lg font-serif font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {i18n.language === 'es' ? 'Artículos Relacionados' : 'Related Posts'}
              </h3>
              <div className="space-y-4">
                {Object.entries(blogPosts)
                  .filter(([key]) => key !== slug)
                  .filter(([, p]) => p.category === post.category)
                  .slice(0, 3)
                  .map(([key, relatedPost]) => (
                    <Link
                      key={key}
                      to={`/blog/${key}`}
                      className={`block p-3 rounded-xl transition-all ${
                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`text-xs uppercase mb-1 bg-gradient-to-r ${relatedPost.gradient} bg-clip-text text-transparent font-semibold`}>
                        {relatedPost.category}
                      </div>
                      <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {relatedPost.title[lang]}
                      </h4>
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {relatedPost.readTime} {i18n.language === 'es' ? 'lectura' : 'read'}
                      </p>
                    </Link>
                  ))}
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  )
}

export default BlogPostPage
