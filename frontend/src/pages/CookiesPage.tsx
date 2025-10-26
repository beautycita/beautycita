import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  DocumentTextIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  UserGroupIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

const CookiesPage: React.FC = () => {
  const { i18n } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
    const handleStorageChange = () => setIsDarkMode(localStorage.getItem('darkMode') === 'true')
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const cookieCategories = [
    {
      icon: Cog6ToothIcon,
      title: { en: 'Essential Cookies', es: 'Cookies Esenciales' },
      description: {
        en: 'Required for the website to function. Cannot be disabled.',
        es: 'Requeridas para que el sitio web funcione. No se pueden desactivar.'
      },
      examples: {
        en: 'Authentication, security, session management, language preferences',
        es: 'Autenticación, seguridad, gestión de sesiones, preferencias de idioma'
      },
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: ChartBarIcon,
      title: { en: 'Analytics Cookies', es: 'Cookies de Analíticas' },
      description: {
        en: 'Help us understand how users interact with our platform.',
        es: 'Nos ayudan a entender cómo los usuarios interactúan con nuestra plataforma.'
      },
      examples: {
        en: 'Page views, user behavior, performance metrics, error tracking',
        es: 'Vistas de página, comportamiento del usuario, métricas de rendimiento, seguimiento de errores'
      },
      color: 'from-purple-500 to-pink-600'
    },
    {
      icon: UserGroupIcon,
      title: { en: 'Functional Cookies', es: 'Cookies Funcionales' },
      description: {
        en: 'Enable enhanced features and personalization.',
        es: 'Habilitan funciones mejoradas y personalización.'
      },
      examples: {
        en: 'Dark mode preferences, saved searches, favorite stylists, notification settings',
        es: 'Preferencias de modo oscuro, búsquedas guardadas, estilistas favoritos, configuración de notificaciones'
      },
      color: 'from-pink-500 to-orange-500'
    },
    {
      icon: GlobeAltIcon,
      title: { en: 'Marketing Cookies', es: 'Cookies de Marketing' },
      description: {
        en: 'Used to deliver relevant advertisements and track campaign effectiveness.',
        es: 'Utilizadas para entregar publicidad relevante y rastrear la efectividad de las campañas.'
      },
      examples: {
        en: 'Ad targeting, conversion tracking, retargeting campaigns',
        es: 'Segmentación de anuncios, seguimiento de conversiones, campañas de retargeting'
      },
      color: 'from-green-500 to-emerald-600'
    }
  ]

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
            <DocumentTextIcon className="h-20 w-20 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
              {i18n.language === 'es' ? 'Política de Cookies' : 'Cookie Policy'}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              {i18n.language === 'es'
                ? 'Cómo usamos cookies para mejorar tu experiencia'
                : 'How we use cookies to enhance your experience'}
            </p>
            <p className={`text-sm mt-4 text-white/70`}>
              {i18n.language === 'es' ? 'Última actualización' : 'Last updated'}: {i18n.language === 'es' ? '23 de octubre de 2025' : 'October 23, 2025'}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Introduction */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`rounded-2xl p-8 mb-12 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}
        >
          <h2 className={`text-3xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {i18n.language === 'es' ? '¿Qué Son las Cookies?' : 'What Are Cookies?'}
          </h2>

          <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <p>
              {i18n.language === 'es'
                ? 'Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Ayudan a que los sitios web funcionen de manera más eficiente y proporcionen una mejor experiencia de usuario.'
                : 'Cookies are small text files that are stored on your device when you visit a website. They help websites work more efficiently and provide a better user experience.'}
            </p>

            <p>
              {i18n.language === 'es'
                ? 'En BeautyCita, usamos cookies para recordar tus preferencias, mantener tu sesión segura, analizar cómo usas nuestra plataforma y personalizar tu experiencia. Respetamos tu privacidad y cumplimos con las regulaciones GDPR.'
                : 'At BeautyCita, we use cookies to remember your preferences, keep your session secure, analyze how you use our platform, and personalize your experience. We respect your privacy and comply with GDPR regulations.'}
            </p>
          </div>
        </motion.section>

        {/* Cookie Categories */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className={`text-3xl font-serif font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {i18n.language === 'es' ? 'Tipos de Cookies Que Usamos' : 'Types of Cookies We Use'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cookieCategories.map((category, index) => (
              <motion.div
                key={category.title.en}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'} hover:shadow-xl transition-all`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${category.color} flex items-center justify-center mb-4`}>
                  <category.icon className="h-6 w-6 text-white" />
                </div>

                <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {i18n.language === 'es' ? category.title.es : category.title.en}
                </h3>

                <p className={`mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {i18n.language === 'es' ? category.description.es : category.description.en}
                </p>

                <div className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  <span className="font-semibold">{i18n.language === 'es' ? 'Ejemplos:' : 'Examples:'}</span>
                  <p className="mt-1">{i18n.language === 'es' ? category.examples.es : category.examples.en}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Specific Cookies Table */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className={`rounded-2xl p-8 mb-12 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}
        >
          <h2 className={`text-3xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {i18n.language === 'es' ? 'Cookies Específicas' : 'Specific Cookies'}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {i18n.language === 'es' ? 'Nombre' : 'Name'}
                  </th>
                  <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {i18n.language === 'es' ? 'Propósito' : 'Purpose'}
                  </th>
                  <th className={`text-left py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {i18n.language === 'es' ? 'Duración' : 'Duration'}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className={`py-3 px-4 font-mono text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>auth_token</td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {i18n.language === 'es' ? 'Autenticación de usuario' : 'User authentication'}
                  </td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>7 {i18n.language === 'es' ? 'días' : 'days'}</td>
                </tr>
                <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className={`py-3 px-4 font-mono text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>session_id</td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {i18n.language === 'es' ? 'Gestión de sesión' : 'Session management'}
                  </td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{i18n.language === 'es' ? 'Sesión' : 'Session'}</td>
                </tr>
                <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className={`py-3 px-4 font-mono text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>lang</td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {i18n.language === 'es' ? 'Preferencia de idioma' : 'Language preference'}
                  </td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>1 {i18n.language === 'es' ? 'año' : 'year'}</td>
                </tr>
                <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className={`py-3 px-4 font-mono text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>darkMode</td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {i18n.language === 'es' ? 'Modo oscuro' : 'Dark mode preference'}
                  </td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>1 {i18n.language === 'es' ? 'año' : 'year'}</td>
                </tr>
                <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className={`py-3 px-4 font-mono text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>cookie_consent</td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {i18n.language === 'es' ? 'Preferencias de cookies' : 'Cookie consent preferences'}
                  </td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>1 {i18n.language === 'es' ? 'año' : 'year'}</td>
                </tr>
                <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className={`py-3 px-4 font-mono text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>_ga</td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {i18n.language === 'es' ? 'Google Analytics' : 'Google Analytics'}
                  </td>
                  <td className={`py-3 px-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>2 {i18n.language === 'es' ? 'años' : 'years'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Managing Cookies */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className={`rounded-2xl p-8 mb-12 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheckIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className={`text-3xl font-serif font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {i18n.language === 'es' ? 'Gestionar tus Preferencias de Cookies' : 'Managing Your Cookie Preferences'}
              </h2>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {i18n.language === 'es'
                  ? 'Tienes control total sobre las cookies que aceptas'
                  : 'You have full control over which cookies you accept'}
              </p>
            </div>
          </div>

          <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <div>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {i18n.language === 'es' ? 'Configuración del Navegador' : 'Browser Settings'}
              </h3>
              <p>
                {i18n.language === 'es'
                  ? 'Puedes configurar tu navegador para bloquear o eliminar cookies. Sin embargo, esto puede afectar la funcionalidad de nuestro sitio web.'
                  : 'You can configure your browser to block or delete cookies. However, this may affect the functionality of our website.'}
              </p>
            </div>

            <div>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {i18n.language === 'es' ? 'Banner de Consentimiento de Cookies' : 'Cookie Consent Banner'}
              </h3>
              <p>
                {i18n.language === 'es'
                  ? 'Cuando visitas BeautyCita por primera vez, verás un banner de consentimiento de cookies donde puedes elegir qué tipos de cookies aceptar.'
                  : 'When you first visit BeautyCita, you\'ll see a cookie consent banner where you can choose which types of cookies to accept.'}
              </p>
            </div>

            <div>
              <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {i18n.language === 'es' ? 'Configuración de la Cuenta' : 'Account Settings'}
              </h3>
              <p>
                {i18n.language === 'es'
                  ? 'Los usuarios registrados pueden actualizar sus preferencias de cookies en cualquier momento desde la configuración de su cuenta.'
                  : 'Registered users can update their cookie preferences anytime from their account settings.'}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <Link
              to="/settings"
              className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              {i18n.language === 'es' ? 'Configuración de Cookies' : 'Cookie Settings'}
            </Link>
          </div>
        </motion.section>

        {/* Third-Party Cookies */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className={`rounded-2xl p-8 mb-12 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}
        >
          <h2 className={`text-3xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {i18n.language === 'es' ? 'Cookies de Terceros' : 'Third-Party Cookies'}
          </h2>

          <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <p>
              {i18n.language === 'es'
                ? 'Algunos servicios que usamos pueden establecer sus propias cookies en tu dispositivo. Estos incluyen:'
                : 'Some services we use may set their own cookies on your device. These include:'}
            </p>

            <ul className="space-y-3 ml-6">
              <li className="flex items-start gap-3">
                <span className="text-pink-500 mt-1">•</span>
                <div>
                  <strong>Google Analytics:</strong> {i18n.language === 'es'
                    ? 'Para análisis de tráfico del sitio web y comportamiento del usuario'
                    : 'For website traffic analysis and user behavior'}
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-pink-500 mt-1">•</span>
                <div>
                  <strong>Stripe/PayPal:</strong> {i18n.language === 'es'
                    ? 'Para procesamiento seguro de pagos'
                    : 'For secure payment processing'}
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-pink-500 mt-1">•</span>
                <div>
                  <strong>Cloudflare:</strong> {i18n.language === 'es'
                    ? 'Para seguridad del sitio web y red de entrega de contenidos'
                    : 'For website security and content delivery network'}
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-pink-500 mt-1">•</span>
                <div>
                  <strong>Google OAuth:</strong> {i18n.language === 'es'
                    ? 'Para inicio de sesión con cuenta de Google'
                    : 'For Google account login'}
                </div>
              </li>
            </ul>

            <p>
              {i18n.language === 'es'
                ? 'Estas cookies de terceros están sujetas a las políticas de privacidad de sus respectivos proveedores.'
                : 'These third-party cookies are subject to the privacy policies of their respective providers.'}
            </p>
          </div>
        </motion.section>

        {/* Contact Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className={`rounded-2xl p-12 ${isDarkMode ? 'bg-gradient-to-br from-pink-500/20 to-purple-600/20' : 'bg-gradient-to-br from-pink-50 to-purple-50'}`}
        >
          <div className="text-center">
            <h2 className="text-3xl font-serif font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {i18n.language === 'es' ? '¿Preguntas sobre Cookies?' : 'Questions About Cookies?'}
            </h2>
            <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {i18n.language === 'es'
                ? 'Si tienes alguna pregunta sobre cómo usamos cookies, contáctanos.'
                : 'If you have any questions about how we use cookies, please contact us.'}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                to="/contact"
                className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:shadow-lg transition-all hover:scale-105"
              >
                {i18n.language === 'es' ? 'Contáctanos' : 'Contact Us'}
              </Link>
              <Link
                to="/privacy-policy"
                className={`inline-flex items-center px-8 py-4 rounded-full font-semibold transition-all hover:scale-105 ${
                  isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {i18n.language === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

export default CookiesPage
