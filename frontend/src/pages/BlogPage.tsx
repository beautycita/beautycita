import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  NewspaperIcon,
  CalendarIcon,
  UserIcon,
  ArrowRightIcon,
  SparklesIcon,
  BeakerIcon,
  HeartIcon
} from '@heroicons/react/24/outline'

const BlogPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
    const handleStorageChange = () => setIsDarkMode(localStorage.getItem('darkMode') === 'true')
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const categories = [
    { key: 'all', icon: SparklesIcon, gradient: 'from-pink-500 to-purple-600' },
    { key: 'beauty', icon: HeartIcon, gradient: 'from-purple-500 to-pink-600' },
    { key: 'tech', icon: BeakerIcon, gradient: 'from-blue-500 to-purple-600' },
    { key: 'business', icon: NewspaperIcon, gradient: 'from-pink-500 to-orange-500' }
  ]

  const [selectedCategory, setSelectedCategory] = useState('all')

  // Featured blog posts
  const blogPosts = [
    {
      slug: '10000-bookings-milestone',
      category: 'business',
      gradient: 'from-pink-500 to-purple-600',
      image: 'https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/beautycita/blog/milestone.jpg'
    },
    {
      slug: 'theme-song-launch',
      category: 'business',
      gradient: 'from-purple-500 to-blue-600',
      image: 'https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/beautycita/blog/music.jpg'
    },
    {
      slug: 'in-house-creative',
      category: 'business',
      gradient: 'from-pink-500 to-orange-500',
      image: 'https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/beautycita/blog/creative.jpg'
    },
    {
      slug: 'ai-beauty-recommendations',
      category: 'tech',
      gradient: 'from-purple-500 to-blue-600',
      image: 'https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/beautycita/blog/ai-tech.jpg'
    },
    {
      slug: 'summer-beauty-trends-2025',
      category: 'beauty',
      gradient: 'from-pink-500 to-orange-500',
      image: 'https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/beautycita/blog/trends.jpg'
    },
    {
      slug: 'stylist-success-stories',
      category: 'business',
      gradient: 'from-purple-500 to-pink-600',
      image: 'https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/beautycita/blog/success.jpg'
    },
    {
      slug: 'skincare-routine-guide',
      category: 'beauty',
      gradient: 'from-blue-500 to-purple-600',
      image: 'https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/beautycita/blog/skincare.jpg'
    },
    {
      slug: 'platform-security-update',
      category: 'tech',
      gradient: 'from-pink-500 to-purple-600',
      image: 'https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev/beautycita/blog/security.jpg'
    }
  ]

  const filteredPosts = selectedCategory === 'all'
    ? blogPosts
    : blogPosts.filter(post => post.category === selectedCategory)

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <NewspaperIcon className="h-20 w-20 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
              {i18n.language === 'es' ? 'Blog de BeautyCita' : 'BeautyCita Blog'}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              {i18n.language === 'es'
                ? 'Tendencias de belleza, noticias de la plataforma y consejos de expertos'
                : 'Beauty trends, platform news, and expert tips'}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}
        >
          <div className="flex flex-wrap gap-4 justify-center">
            {categories.map((category) => (
              <button
                key={category.key}
                onClick={() => setSelectedCategory(category.key)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                  selectedCategory === category.key
                    ? `bg-gradient-to-r ${category.gradient} text-white shadow-lg`
                    : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <category.icon className="h-5 w-5" />
                {i18n.language === 'es'
                  ? category.key === 'all' ? 'Todos' : category.key === 'beauty' ? 'Belleza' : category.key === 'tech' ? 'Tecnología' : 'Negocios'
                  : category.key === 'all' ? 'All' : category.key === 'beauty' ? 'Beauty' : category.key === 'tech' ? 'Tech' : 'Business'}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Blog Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post, index) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'
              }`}
            >
              {/* Post Image */}
              <div className={`h-48 bg-gradient-to-r ${post.gradient} relative overflow-hidden`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <NewspaperIcon className="h-24 w-24 text-white/20" />
                </div>
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isDarkMode ? 'bg-gray-900/50' : 'bg-white/90'
                  } backdrop-blur-sm`}>
                    {post.category.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Post Content */}
              <div className="p-6">
                <div className="flex items-center gap-4 mb-3 text-sm">
                  <div className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <CalendarIcon className="h-4 w-4" />
                    <span>{i18n.language === 'es' ? 'Hace 2 días' : '2 days ago'}</span>
                  </div>
                  <div className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <UserIcon className="h-4 w-4" />
                    <span>BeautyCita</span>
                  </div>
                </div>

                <h3 className={`text-xl font-serif font-bold mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {i18n.language === 'es'
                    ? post.slug === '10000-bookings-milestone' ? 'Alcanzamos 10,000 Reservas'
                      : post.slug === 'theme-song-launch' ? 'BeautyCita Lanza Canción Tema Original "Resplandece"'
                      : post.slug === 'in-house-creative' ? '100% Interno: Cómo BeautyCita Crea Todo el Video y Arte Internamente'
                      : post.slug === 'ai-beauty-recommendations' ? 'IA en Recomendaciones de Belleza'
                      : post.slug === 'summer-beauty-trends-2025' ? 'Tendencias de Belleza Verano 2025'
                      : post.slug === 'stylist-success-stories' ? 'Historias de Éxito de Estilistas'
                      : post.slug === 'skincare-routine-guide' ? 'Guía de Rutina de Cuidado de la Piel'
                      : 'Actualización de Seguridad de la Plataforma'
                    : post.slug === '10000-bookings-milestone' ? 'We Hit 10,000 Bookings'
                      : post.slug === 'theme-song-launch' ? 'BeautyCita Launches Original Theme Song "Resplandece"'
                      : post.slug === 'in-house-creative' ? '100% In-House: How BeautyCita Creates All Video & Artwork Internally'
                      : post.slug === 'ai-beauty-recommendations' ? 'AI in Beauty Recommendations'
                      : post.slug === 'summer-beauty-trends-2025' ? 'Summer Beauty Trends 2025'
                      : post.slug === 'stylist-success-stories' ? 'Stylist Success Stories'
                      : post.slug === 'skincare-routine-guide' ? 'Skincare Routine Guide'
                      : 'Platform Security Update'}
                </h3>

                <p className={`leading-relaxed mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {i18n.language === 'es'
                    ? 'Descubre las últimas noticias, tendencias y consejos del equipo de BeautyCita y nuestra comunidad de profesionales de la belleza.'
                    : 'Discover the latest news, trends, and tips from the BeautyCita team and our community of beauty professionals.'}
                </p>

                <Link
                  to={`/blog/${post.slug}`}
                  className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold bg-gradient-to-r ${post.gradient} text-white hover:shadow-lg transition-all`}
                >
                  {i18n.language === 'es' ? 'Leer Más' : 'Read More'}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {/* Coming Soon Section */}
      <div className={`py-16 ${isDarkMode ? 'bg-gray-800/30' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className={`rounded-2xl p-12 ${
              isDarkMode ? 'bg-gradient-to-br from-pink-500/20 to-purple-600/20' : 'bg-gradient-to-br from-pink-50 to-purple-50'
            }`}
          >
            <SparklesIcon className="h-16 w-16 mx-auto mb-6 text-pink-600" />
            <h2 className="text-3xl font-serif font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {i18n.language === 'es' ? '¡Más Contenido Próximamente!' : 'More Content Coming Soon!'}
            </h2>
            <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {i18n.language === 'es'
                ? 'Estamos trabajando en más artículos increíbles. Suscríbete para mantenerte actualizado.'
                : 'We\'re working on more amazing articles. Subscribe to stay updated.'}
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              {i18n.language === 'es' ? 'Contáctanos' : 'Contact Us'}
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default BlogPage
