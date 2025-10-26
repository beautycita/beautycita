import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheckIcon, LockClosedIcon, UserGroupIcon } from '@heroicons/react/24/outline'

const ClientProtectionPage: React.FC = () => {
  const { i18n } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
    const handleStorageChange = () => setIsDarkMode(localStorage.getItem('darkMode') === 'true')
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <ShieldCheckIcon className="h-20 w-20 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
              {i18n.language === 'es' ? 'Protección del Cliente' : 'Client Protection'}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              {i18n.language === 'es'
                ? 'Tu seguridad y privacidad están garantizadas en cada paso'
                : 'Your safety and privacy are guaranteed at every step'}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`rounded-2xl p-8 mb-12 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}
        >
          <h2 className={`text-3xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {i18n.language === 'es' ? 'Cómo Te Protegemos' : 'How We Protect You'}
          </h2>
          <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <div className="flex items-start gap-3">
              <span className="text-pink-500 mt-1">✓</span>
              <p>
                {i18n.language === 'es'
                  ? 'Verificación de antecedentes de todos los profesionales'
                  : 'Background checks for all professionals'}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-pink-500 mt-1">✓</span>
              <p>
                {i18n.language === 'es'
                  ? 'Mensajería cifrada de extremo a extremo'
                  : 'End-to-end encrypted messaging'}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-pink-500 mt-1">✓</span>
              <p>
                {i18n.language === 'es'
                  ? 'Pagos seguros que nunca exponen tu información financiera'
                  : 'Secure payments that never expose your financial information'}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-pink-500 mt-1">✓</span>
              <p>
                {i18n.language === 'es'
                  ? 'Soporte 24/7 para resolver disputas'
                  : '24/7 support to resolve disputes'}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-pink-500 mt-1">✓</span>
              <p>
                {i18n.language === 'es'
                  ? 'Garantía de devolución de dinero si no estás satisfecho'
                  : 'Money-back guarantee if you\'re not satisfied'}
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className={`rounded-2xl p-12 ${isDarkMode ? 'bg-gradient-to-br from-pink-500/20 to-purple-600/20' : 'bg-gradient-to-br from-pink-50 to-purple-50'}`}
        >
          <div className="text-center">
            <UserGroupIcon className="h-16 w-16 mx-auto mb-6 text-pink-600" />
            <h2 className="text-3xl font-serif font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {i18n.language === 'es' ? 'Tu Seguridad Es Nuestra Prioridad' : 'Your Safety Is Our Priority'}
            </h2>
            <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {i18n.language === 'es'
                ? 'Únete a miles de clientes que confían en BeautyCita para sus necesidades de belleza.'
                : 'Join thousands of clients who trust BeautyCita for their beauty needs.'}
            </p>
            <Link
              to="/booking"
              className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              {i18n.language === 'es' ? 'Comenzar' : 'Get Started'}
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

export default ClientProtectionPage
