import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  CloudIcon,
  ShieldCheckIcon,
  BoltIcon,
  SparklesIcon,
  CalendarDaysIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  LockClosedIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

const R2_PUBLIC_URL = 'https://pub-56305a12c77043c9bd5de9db79a5e542.r2.dev'

export default function PlatformPage() {
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

  const features = [
    {
      icon: <DevicePhoneMobileIcon className="h-8 w-8" />,
      title: t('pages.platform.features.feature1.title'),
      description: t('pages.platform.features.feature1.description'),
      gradient: 'from-pink-500 to-purple-600'
    },
    {
      icon: <CalendarDaysIcon className="h-8 w-8" />,
      title: t('pages.platform.features.feature2.title'),
      description: t('pages.platform.features.feature2.description'),
      gradient: 'from-purple-500 to-blue-600'
    },
    {
      icon: <CreditCardIcon className="h-8 w-8" />,
      title: t('pages.platform.features.feature3.title'),
      description: t('pages.platform.features.feature3.description'),
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      icon: <ChatBubbleLeftRightIcon className="h-8 w-8" />,
      title: t('pages.platform.features.feature4.title'),
      description: t('pages.platform.features.feature4.description'),
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      icon: <ChartBarIcon className="h-8 w-8" />,
      title: t('pages.platform.features.feature5.title'),
      description: t('pages.platform.features.feature5.description'),
      gradient: 'from-pink-600 to-purple-700'
    },
    {
      icon: <SparklesIcon className="h-8 w-8" />,
      title: t('pages.platform.features.feature6.title'),
      description: t('pages.platform.features.feature6.description'),
      gradient: 'from-purple-600 to-pink-500'
    }
  ]

  const techStack = [
    {
      icon: <BoltIcon className="h-10 w-10" />,
      title: t('pages.platform.tech.tech1.title'),
      description: t('pages.platform.tech.tech1.description'),
      gradient: 'from-yellow-400 to-orange-500'
    },
    {
      icon: <CloudIcon className="h-10 w-10" />,
      title: t('pages.platform.tech.tech2.title'),
      description: t('pages.platform.tech.tech2.description'),
      gradient: 'from-blue-400 to-cyan-500'
    },
    {
      icon: <ShieldCheckIcon className="h-10 w-10" />,
      title: t('pages.platform.tech.tech3.title'),
      description: t('pages.platform.tech.tech3.description'),
      gradient: 'from-green-400 to-emerald-500'
    },
    {
      icon: <LockClosedIcon className="h-10 w-10" />,
      title: t('pages.platform.tech.tech4.title'),
      description: t('pages.platform.tech.tech4.description'),
      gradient: 'from-purple-400 to-pink-500'
    }
  ]

  const platforms = [
    {
      icon: <DevicePhoneMobileIcon className="h-12 w-12" />,
      name: 'iOS & Android',
      description: t('pages.platform.platforms.mobile'),
      gradient: 'from-pink-500 to-purple-600'
    },
    {
      icon: <ComputerDesktopIcon className="h-12 w-12" />,
      name: 'Web App',
      description: t('pages.platform.platforms.web'),
      gradient: 'from-purple-500 to-blue-600'
    },
    {
      icon: <GlobeAltIcon className="h-12 w-12" />,
      name: 'Progressive Web App',
      description: t('pages.platform.platforms.pwa'),
      gradient: 'from-blue-500 to-indigo-600'
    }
  ]

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero with Video Background */}
      <div className="relative text-white py-24 overflow-hidden">
        {/* Video Background - App Demo */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src={`${R2_PUBLIC_URL}/beautycita/videos/banner5.mp4`} type="video/mp4" />
        </video>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-pink-900/90 to-blue-900/90" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6 drop-shadow-lg">
              {t('pages.platform.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8 drop-shadow-md">
              {t('pages.platform.hero.subtitle')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/register/client"
                className="px-8 py-4 bg-white text-purple-600 font-semibold rounded-full hover:bg-gray-50 transition-all hover:scale-105 shadow-lg"
              >
                {t('pages.platform.hero.cta1')}
              </a>
              <a
                href="/register/stylist"
                className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-full hover:shadow-xl transition-all hover:scale-105"
              >
                {t('pages.platform.hero.cta2')}
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
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
              {t('pages.platform.features.title')}
            </h2>
            <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('pages.platform.features.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-2xl p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'} hover:shadow-2xl transition-all hover:-translate-y-1`}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${feature.gradient} text-white mb-6`}>
                  {feature.icon}
                </div>
                <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                <p className={`leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className={`py-16 md:py-20 ${isDarkMode ? 'bg-gray-800/30' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {t('pages.platform.tech.title')}
            </h2>
            <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('pages.platform.tech.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {techStack.map((tech, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-2xl p-6 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-br from-gray-50 to-white shadow-md'}`}
              >
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r ${tech.gradient} text-white mb-4`}>
                  {tech.icon}
                </div>
                <h3 className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {tech.title}
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {tech.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Platforms */}
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
              {t('pages.platform.platforms.title')}
            </h2>
            <p className={`text-xl ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {t('pages.platform.platforms.subtitle')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {platforms.map((platform, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-2xl p-8 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-xl'}`}
              >
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r ${platform.gradient} text-white mb-6`}>
                  {platform.icon}
                </div>
                <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {platform.name}
                </h3>
                <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {platform.description}
                </p>
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
            className={`rounded-2xl p-12 bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 text-white`}
          >
            <SparklesIcon className="h-16 w-16 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              {t('pages.platform.cta.title')}
            </h2>
            <p className="text-xl mb-8 text-white/90">
              {t('pages.platform.cta.subtitle')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/register/client"
                className="px-8 py-4 bg-white text-purple-600 font-semibold rounded-full hover:bg-gray-50 transition-all hover:scale-105 shadow-lg"
              >
                {t('pages.platform.cta.button1')}
              </a>
              <a
                href="/contact"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-full hover:bg-white/20 transition-all hover:scale-105 border-2 border-white"
              >
                {t('pages.platform.cta.button2')}
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
