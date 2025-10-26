import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ShieldExclamationIcon,
  HomeIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'

export default function UnauthorizedPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { t } = useTranslation()
  const { user } = useAuthStore()

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
        : 'bg-gradient-to-br from-red-50 via-orange-50 to-pink-50'
    }`}>
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 90, 180],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-10 right-10 w-80 h-80 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.3, 1, 1.3],
            rotate: [180, 90, 0],
            opacity: [0.4, 0.2, 0.4]
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-10 left-10 w-96 h-96 bg-gradient-to-tr from-orange-500/20 to-pink-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full">
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

            {/* Shield Icon with Pulse Animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
              className="flex justify-center"
            >
              <div className="relative">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className={`absolute inset-0 rounded-full blur-xl ${
                    isDarkMode
                      ? 'bg-red-500/30'
                      : 'bg-red-500/40'
                  }`}
                />
                <div className={`relative w-24 h-24 rounded-full flex items-center justify-center ${
                  isDarkMode
                    ? 'bg-red-900/50'
                    : 'bg-red-100'
                }`}>
                  <ShieldExclamationIcon className={`h-14 w-14 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`} />
                </div>
              </div>
            </motion.div>

            {/* 403 Number */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <h1 className="font-serif text-7xl md:text-8xl font-bold leading-none mb-2">
                <span className="bg-gradient-to-r from-red-500 via-orange-500 to-pink-500 bg-clip-text text-transparent">
                  403
                </span>
              </h1>
            </motion.div>

            {/* Main Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className={`backdrop-blur-xl ${
                isDarkMode
                  ? 'bg-gray-800/80 border-gray-700'
                  : 'bg-white/60 border-white/80'
              } rounded-3xl p-8 md:p-12 shadow-2xl border`}
            >
              {/* Heading */}
              <div className="mb-6">
                <h2 className={`font-serif text-3xl md:text-4xl font-bold mb-3 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {t('errors.403.title', 'Access Denied')}
                </h2>
                <div className="flex items-center justify-center gap-2">
                  <LockClosedIcon className={`h-5 w-5 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`} />
                  <p className={`text-sm font-semibold ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`}>
                    {t('errors.403.subtitle', 'Authorization Required')}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p className={`text-lg mb-6 max-w-xl mx-auto ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {t('errors.403.message',
                  "You don't have permission to access this area. This section is restricted to authorized users only."
                )}
              </p>

              {/* Warning Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className={`rounded-2xl p-5 mb-8 ${
                  isDarkMode
                    ? 'bg-yellow-900/20 border border-yellow-700/50'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className={`h-6 w-6 flex-shrink-0 mt-0.5 ${
                    isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  }`} />
                  <div className="text-left">
                    <p className={`font-semibold mb-1 ${
                      isDarkMode ? 'text-yellow-400' : 'text-yellow-800'
                    }`}>
                      {t('errors.403.adminRequired', 'Administrator Access Required')}
                    </p>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-yellow-300' : 'text-yellow-700'
                    }`}>
                      {t('errors.403.adminMessage',
                        'This content requires administrator privileges. Contact support if you believe this is an error.'
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* User Info (if logged in) */}
              {user && (
                <div className={`text-sm mb-6 p-4 rounded-2xl ${
                  isDarkMode
                    ? 'bg-gray-700/50'
                    : 'bg-gray-100'
                }`}>
                  <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                    {t('errors.403.loggedInAs', 'Logged in as:')}{' '}
                    <span className="font-semibold">{user.email}</span>
                  </p>
                  <p className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {t('errors.403.role', 'Role:')}{' '}
                    <span className="font-medium">{user.role}</span>
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Link
                  to="/"
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  <HomeIcon className="h-5 w-5" />
                  <span>{t('errors.403.goHome', 'Go Home')}</span>
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
                  <span>{t('errors.403.goBack', 'Go Back')}</span>
                </button>
              </div>

              {/* Divider */}
              <div className={`my-8 border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`} />

              {/* Contact Support */}
              <div className="space-y-3">
                <p className={`text-sm font-semibold ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {t('errors.403.needHelp', 'Need help?')}
                </p>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-full hover:scale-105 transition-all duration-200 shadow-md"
                >
                  <EnvelopeIcon className="h-4 w-4" />
                  {t('errors.403.contactSupport', 'Contact Support')}
                </Link>
              </div>
            </motion.div>

            {/* Footer Text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className={`text-sm ${
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
              {t('errors.403.errorCode', 'Error Code: 403 - Forbidden Access')}
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
