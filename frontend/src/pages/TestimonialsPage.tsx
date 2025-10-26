import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  StarIcon,
  HeartIcon,
  SparklesIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/solid'

const R2_PUBLIC_URL = 'https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev'

export default function TestimonialsPage() {
  const { t } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)

    const handleStorageChange = () => {
      const newDarkMode = localStorage.getItem('darkMode') === 'true'
      setIsDarkMode(newDarkMode)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const stats = [
    { icon: <UserGroupIcon className="h-8 w-8" />, number: '10,000+', label: t('pages.testimonials.stats.clients'), gradient: 'from-pink-500 to-purple-600' },
    { icon: <StarIcon className="h-8 w-8" />, number: '4.9/5', label: t('pages.testimonials.stats.rating'), gradient: 'from-purple-500 to-blue-600' },
    { icon: <HeartIcon className="h-8 w-8" />, number: '98%', label: t('pages.testimonials.stats.satisfaction'), gradient: 'from-blue-500 to-pink-600' },
    { icon: <SparklesIcon className="h-8 w-8" />, number: '25,000+', label: t('pages.testimonials.stats.bookings'), gradient: 'from-pink-600 to-purple-500' }
  ]

  const testimonials = [
    {
      name: 'María González',
      role: t('pages.testimonials.testimonial1.role'),
      image: '👩‍💼',
      rating: 5,
      quote: t('pages.testimonials.testimonial1.quote'),
      gradient: 'from-pink-500 to-purple-600'
    },
    {
      name: 'Sofia Rodríguez',
      role: t('pages.testimonials.testimonial2.role'),
      image: '💇‍♀️',
      rating: 5,
      quote: t('pages.testimonials.testimonial2.quote'),
      gradient: 'from-purple-500 to-blue-600'
    },
    {
      name: 'Ana Martínez',
      role: t('pages.testimonials.testimonial3.role'),
      image: '👩‍🎨',
      rating: 5,
      quote: t('pages.testimonials.testimonial3.quote'),
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      name: 'Carlos Hernández',
      role: t('pages.testimonials.testimonial4.role'),
      image: '👨‍💼',
      rating: 5,
      quote: t('pages.testimonials.testimonial4.quote'),
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      name: 'Laura Torres',
      role: t('pages.testimonials.testimonial5.role'),
      image: '👩',
      rating: 5,
      quote: t('pages.testimonials.testimonial5.quote'),
      gradient: 'from-pink-600 to-purple-700'
    },
    {
      name: 'Diego Ramírez',
      role: t('pages.testimonials.testimonial6.role'),
      image: '💅',
      rating: 5,
      quote: t('pages.testimonials.testimonial6.quote'),
      gradient: 'from-purple-600 to-pink-500'
    }
  ]

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero with Video Background */}
      <div className="relative text-white py-24 overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={`${R2_PUBLIC_URL}/beautycita/videos/banner4.mp4`} type="video/mp4" />
        </video>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-500/80 via-purple-500/80 to-blue-500/80" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 drop-shadow-lg">
              {t('pages.testimonials.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto drop-shadow-md">
              {t('pages.testimonials.hero.subtitle')}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Stats Section */}
      <section className={`py-16 ${isDarkMode ? 'bg-gray-800/30' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-2xl p-6 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-purple-50 to-pink-50'}`}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${stat.gradient} text-white mb-4`}>
                  {stat.icon}
                </div>
                <h3 className={`text-3xl font-bold mb-2 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                  {stat.number}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {t('pages.testimonials.section.title')}
            </h2>
            <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('pages.testimonials.section.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-2xl p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'} relative overflow-hidden hover:shadow-2xl transition-shadow`}
              >
                {/* Gradient accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${testimonial.gradient}`} />

                {/* Quote icon */}
                <ChatBubbleLeftRightIcon className={`h-10 w-10 mb-4 ${isDarkMode ? 'text-purple-400/30' : 'text-purple-200'}`} />

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className={`text-lg leading-relaxed mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} italic`}>
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{testimonial.image}</div>
                  <div>
                    <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {testimonial.name}
                    </h4>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {testimonial.role}
                    </p>
                  </div>
                  <CheckBadgeIcon className={`h-6 w-6 ml-auto text-blue-500`} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-16 ${isDarkMode ? 'bg-gray-800/30' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className={`rounded-2xl p-12 bg-gradient-to-br from-pink-500 to-purple-600 text-white`}
          >
            <ChatBubbleLeftRightIcon className="h-16 w-16 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              {t('pages.testimonials.cta.title')}
            </h2>
            <p className="text-xl mb-8 text-white/90">
              {t('pages.testimonials.cta.subtitle')}
            </p>
            <a
              href="/stylists"
              className="inline-block px-8 py-4 bg-white text-purple-600 font-semibold rounded-full hover:bg-gray-50 transition-all hover:scale-105 shadow-lg"
            >
              {t('pages.testimonials.cta.button')}
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
