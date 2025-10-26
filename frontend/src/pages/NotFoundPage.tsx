import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HomeIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export default function NotFoundPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
    if (darkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  return (
    <div className={`min-h-screen relative overflow-hidden ${
      isDarkMode
        ? 'bg-gray-900'
        : 'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50'
    }`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-20 right-20 w-72 h-72 bg-gradient-to-br from-pink-500/30 to-purple-600/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
            opacity: [0.5, 0.3, 0.5]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-tr from-blue-500/30 to-purple-600/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-pink-500/20 to-blue-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-16">
        <div className="max-w-3xl w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-8"
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex justify-center mb-8"
            >
              <img loading="lazy"
                src="/media/brand/official-logo.svg"
                alt="BeautyCita"
                className="h-20 w-auto"
              />
            </motion.div>

            {/* 404 Number with Sparkle */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative"
            >
              <h1 className="font-serif text-8xl sm:text-9xl md:text-[12rem] font-bold leading-none">
                <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500 bg-clip-text text-transparent">
                  404
                </span>
              </h1>

              {/* Floating Sparkle */}
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute top-0 right-1/4 -translate-y-8"
              >
                <SparklesIcon className={`h-16 w-16 ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-500'
                }`} />
              </motion.div>
            </motion.div>

            {/* Main Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className={`backdrop-blur-xl ${
                isDarkMode
                  ? 'bg-gray-800/80 border-gray-700'
                  : 'bg-white/40 border-white/60'
              } rounded-3xl p-8 md:p-12 shadow-2xl border`}
            >
              {/* Heading */}
              <h2 className={`font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {t('errors.404.title', 'Oops! Page Not Found')}
              </h2>

              {/* Description */}
              <p className={`text-lg md:text-xl mb-8 max-w-2xl mx-auto ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {t('errors.404.message',
                  "We couldn't find the page you're looking for. It might have been moved or doesn't exist."
                )}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Link
                  to="/"
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  <HomeIcon className="h-5 w-5" />
                  <span>{t('errors.404.goHome', 'Go Home')}</span>
                </Link>

                <button
                  onClick={() => window.history.back()}
                  className={`inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-white hover:bg-gray-50 text-gray-900'
                  }`}
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  <span>{t('errors.404.goBack', 'Go Back')}</span>
                </button>
              </div>

              {/* Divider */}
              <div className={`my-8 border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`} />

              {/* Quick Links */}
              <div className="space-y-4">
                <p className={`text-sm font-semibold ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {t('errors.404.suggestions', 'Try these popular pages instead:')}
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    to="/services"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white font-medium rounded-full hover:scale-105 transition-all duration-200 shadow-md"
                  >
                    <MagnifyingGlassIcon className="h-4 w-4" />
                    {t('nav.services', 'Services')}
                  </Link>

                  <Link
                    to="/stylists"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-full hover:scale-105 transition-all duration-200 shadow-md"
                  >
                    <SparklesIcon className="h-4 w-4" />
                    {t('nav.stylists', 'Stylists')}
                  </Link>

                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-full hover:scale-105 transition-all duration-200 shadow-md"
                  >
                    {t('nav.contact', 'Contact')}
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Footer Text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className={`text-sm ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}
            >
              {t('errors.404.errorCode', 'Error Code: 404 - Page Not Found')}
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
