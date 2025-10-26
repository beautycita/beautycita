import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BanknotesIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline'

const MoneyBackGuaranteePage: React.FC = () => {
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
      <div className="relative bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <BanknotesIcon className="h-20 w-20 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
              {i18n.language === 'es' ? 'Garantía de Devolución de Dinero' : 'Money-Back Guarantee'}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              {i18n.language === 'es'
                ? 'No estás satisfecho? Te devolvemos tu dinero, sin preguntas.'
                : 'Not satisfied? We\'ll refund your money, no questions asked.'}
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
            {i18n.language === 'es' ? 'Nuestra Promesa' : 'Our Promise'}
          </h2>
          <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <p>
              {i18n.language === 'es'
                ? 'Tu satisfacción es nuestra prioridad número uno. Si no estás completamente satisfecho con un servicio reservado a través de BeautyCita, te devolvemos el dinero completo dentro de 48 horas.'
                : 'Your satisfaction is our number one priority. If you\'re not completely satisfied with a service booked through BeautyCita, we\'ll refund your money in full within 48 hours.'}
            </p>
            <div className="flex items-start gap-3">
              <span className="text-green-500 mt-1">✓</span>
              <p>{i18n.language === 'es' ? 'Reembolso completo dentro de 48 horas' : 'Full refund within 48 hours'}</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 mt-1">✓</span>
              <p>{i18n.language === 'es' ? 'Sin preguntas' : 'No questions asked'}</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-green-500 mt-1">✓</span>
              <p>{i18n.language === 'es' ? 'Válido para todas las reservas' : 'Valid for all bookings'}</p>
            </div>
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
              {i18n.language === 'es' ? 'Reserva Sin Riesgo' : 'Book Risk-Free'}
            </h2>
            <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {i18n.language === 'es'
                ? 'Prueba BeautyCita hoy. Si no te encanta, te devolvemos tu dinero.'
                : 'Try BeautyCita today. If you don\'t love it, we\'ll refund your money.'}
            </p>
            <Link
              to="/booking"
              className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              {i18n.language === 'es' ? 'Comenzar' : 'Get Started'}
            </Link>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

export default MoneyBackGuaranteePage
