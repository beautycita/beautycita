import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LockClosedIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  BanknotesIcon,
  GlobeAltIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

const SecurePaymentsPage: React.FC = () => {
  const { i18n } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
    const handleStorageChange = () => setIsDarkMode(localStorage.getItem('darkMode') === 'true')
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const paymentMethods = [
    {
      icon: CreditCardIcon,
      name: 'Stripe',
      description: {
        en: 'Industry-leading payment processor with PCI DSS Level 1 compliance',
        es: 'Procesador de pagos líder en la industria con cumplimiento PCI DSS Nivel 1'
      },
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      icon: BanknotesIcon,
      name: 'PayPal',
      description: {
        en: 'Trusted global payment platform with buyer protection',
        es: 'Plataforma de pagos global confiable con protección al comprador'
      },
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      icon: CurrencyDollarIcon,
      name: 'Bitcoin',
      description: {
        en: 'Decentralized cryptocurrency payments via BTCPay Server',
        es: 'Pagos en criptomoneda descentralizada vía BTCPay Server'
      },
      gradient: 'from-orange-500 to-yellow-500'
    }
  ]

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="relative bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <LockClosedIcon className="h-20 w-20 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
              {i18n.language === 'es' ? 'Pagos Seguros' : 'Secure Payments'}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              {i18n.language === 'es'
                ? 'Tus transacciones están protegidas con cifrado de nivel bancario'
                : 'Your transactions are protected with bank-level encryption'}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`rounded-2xl p-8 mb-12 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}
        >
          <h2 className={`text-3xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {i18n.language === 'es' ? 'Seguridad Primero' : 'Security First'}
          </h2>
          <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <p>
              {i18n.language === 'es'
                ? 'En BeautyCita, tomamos la seguridad de tu información de pago extremadamente en serio. Todos los datos de pago están cifrados de extremo a extremo y nunca almacenamos tu información de tarjeta de crédito en nuestros servidores.'
                : 'At BeautyCita, we take the security of your payment information extremely seriously. All payment data is encrypted end-to-end, and we never store your credit card information on our servers.'}
            </p>
            <div className="flex items-start gap-3">
              <span className="text-green-500 mt-1">✓</span>
              <p>
                {i18n.language === 'es'
                  ? 'Cifrado SSL/TLS de 256 bits para todas las transacciones'
                  : '256-bit SSL/TLS encryption for all transactions'}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 mt-1">✓</span>
              <p>
                {i18n.language === 'es'
                  ? 'Cumplimiento PCI DSS Nivel 1 (el estándar más alto)'
                  : 'PCI DSS Level 1 compliance (the highest standard)'}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 mt-1">✓</span>
              <p>
                {i18n.language === 'es'
                  ? 'Detección de fraude impulsada por IA en tiempo real'
                  : 'AI-powered fraud detection in real-time'}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 mt-1">✓</span>
              <p>
                {i18n.language === 'es'
                  ? 'Autenticación de dos factores para todas las transacciones'
                  : 'Two-factor authentication for all transactions'}
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className={`text-3xl font-serif font-bold mb-8 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {i18n.language === 'es' ? 'Métodos de Pago Aceptados' : 'Accepted Payment Methods'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {paymentMethods.map((method, index) => (
              <motion.div
                key={method.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${method.gradient} flex items-center justify-center mb-4`}>
                  <method.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {method.name}
                </h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {i18n.language === 'es' ? method.description.es : method.description.en}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className={`rounded-2xl p-12 ${isDarkMode ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20' : 'bg-gradient-to-br from-green-50 to-emerald-50'}`}
        >
          <div className="text-center">
            <ShieldCheckIcon className="h-16 w-16 mx-auto mb-6 text-green-600" />
            <h2 className="text-3xl font-serif font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {i18n.language === 'es' ? 'Tu Dinero Está Seguro' : 'Your Money Is Safe'}
            </h2>
            <p className={`text-lg mb-8 max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {i18n.language === 'es'
                ? 'Reserva con confianza sabiendo que tus pagos están protegidos.'
                : 'Book with confidence knowing your payments are protected.'}
            </p>
            <Link
              to="/booking"
              className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              {i18n.language === 'es' ? 'Reservar Ahora' : 'Book Now'}
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

export default SecurePaymentsPage
