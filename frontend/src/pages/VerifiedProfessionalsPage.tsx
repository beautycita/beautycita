import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ShieldCheckIcon,
  CheckBadgeIcon,
  IdentificationIcon,
  DocumentCheckIcon,
  StarIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

const VerifiedProfessionalsPage: React.FC = () => {
  const { i18n } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
    const handleStorageChange = () => setIsDarkMode(localStorage.getItem('darkMode') === 'true')
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const verificationSteps = [
    {
      icon: IdentificationIcon,
      title: { en: 'Identity Verification', es: 'Verificación de Identidad' },
      description: {
        en: 'Government-issued ID verification to confirm stylist identity',
        es: 'Verificación de ID emitida por el gobierno para confirmar la identidad del estilista'
      },
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      icon: AcademicCapIcon,
      title: { en: 'Professional Credentials', es: 'Credenciales Profesionales' },
      description: {
        en: 'Verification of cosmetology licenses and certifications',
        es: 'Verificación de licencias y certificaciones de cosmetología'
      },
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      icon: BriefcaseIcon,
      title: { en: 'Background Check', es: 'Verificación de Antecedentes' },
      description: {
        en: 'Comprehensive background screening for client safety',
        es: 'Evaluación integral de antecedentes para la seguridad del cliente'
      },
      gradient: 'from-pink-500 to-orange-500'
    },
    {
      icon: DocumentCheckIcon,
      title: { en: 'Portfolio Review', es: 'Revisión de Portafolio' },
      description: {
        en: 'Quality assessment of work samples and client reviews',
        es: 'Evaluación de calidad de muestras de trabajo y reseñas de clientes'
      },
      gradient: 'from-green-500 to-emerald-600'
    }
  ]

  const benefits = [
    {
      icon: ShieldCheckIcon,
      title: { en: 'Guaranteed Safety', es: 'Seguridad Garantizada' },
      description: {
        en: 'All verified professionals undergo rigorous screening',
        es: 'Todos los profesionales verificados pasan por una evaluación rigurosa'
      }
    },
    {
      icon: StarIcon,
      title: { en: 'Quality Assurance', es: 'Garantía de Calidad' },
      description: {
        en: 'Only top-rated professionals receive verification',
        es: 'Solo los profesionales mejor calificados reciben verificación'
      }
    },
    {
      icon: UserGroupIcon,
      title: { en: 'Trusted Community', es: 'Comunidad Confiable' },
      description: {
        en: 'Join thousands of clients who trust verified professionals',
        es: 'Únete a miles de clientes que confían en profesionales verificados'
      }
    }
  ]

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <CheckBadgeIcon className="h-20 w-20 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
              {i18n.language === 'es' ? 'Profesionales Verificados' : 'Verified Professionals'}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
              {i18n.language === 'es'
                ? 'Trabaja con confianza sabiendo que cada profesional ha sido completamente verificado'
                : 'Book with confidence knowing every professional is fully verified'}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Introduction */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`rounded-2xl p-8 mb-12 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'}`}
        >
          <h2 className={`text-3xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {i18n.language === 'es' ? '¿Qué Significa "Verificado"?' : 'What Does "Verified" Mean?'}
          </h2>

          <div className={`space-y-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <p>
              {i18n.language === 'es'
                ? 'En BeautyCita, la insignia de verificación no es solo un símbolo, es una promesa. Cuando ves la marca azul de verificación junto al perfil de un estilista, significa que han pasado por nuestro riguroso proceso de verificación de 4 pasos.'
                : 'At BeautyCita, the verification badge isn\'t just a symbol—it\'s a promise. When you see the blue verification checkmark next to a stylist\'s profile, it means they\'ve gone through our rigorous 4-step verification process.'}
            </p>

            <p>
              {i18n.language === 'es'
                ? 'Nuestra misión es hacer que la belleza sea accesible, confiable y segura para todos. La verificación profesional es cómo aseguramos que cada servicio que reserves sea con alguien calificado, experimentado y comprometido con la excelencia.'
                : 'Our mission is to make beauty accessible, trustworthy, and safe for everyone. Professional verification is how we ensure every service you book is with someone qualified, experienced, and committed to excellence.'}
            </p>
          </div>
        </motion.section>

        {/* Verification Steps */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className={`text-3xl font-serif font-bold mb-8 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {i18n.language === 'es' ? 'Nuestro Proceso de Verificación de 4 Pasos' : 'Our 4-Step Verification Process'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {verificationSteps.map((step, index) => (
              <motion.div
                key={step.title.en}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'} hover:shadow-xl transition-all`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${step.gradient} flex items-center justify-center mb-4`}>
                  <step.icon className="h-6 w-6 text-white" />
                </div>

                <div className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {i18n.language === 'es' ? 'Paso' : 'Step'} {index + 1}
                </div>

                <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {i18n.language === 'es' ? step.title.es : step.title.en}
                </h3>

                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {i18n.language === 'es' ? step.description.es : step.description.en}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Benefits */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <h2 className={`text-3xl font-serif font-bold mb-8 text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {i18n.language === 'es' ? '¿Por Qué Importa?' : 'Why It Matters'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title.en}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                className={`rounded-2xl p-6 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {i18n.language === 'es' ? benefit.title.es : benefit.title.en}
                </h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {i18n.language === 'es' ? benefit.description.es : benefit.description.en}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Call to Action */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className={`rounded-2xl p-12 ${isDarkMode ? 'bg-gradient-to-br from-pink-500/20 to-purple-600/20' : 'bg-gradient-to-br from-pink-50 to-purple-50'}`}
        >
          <div className="text-center">
            <CheckBadgeIcon className="h-16 w-16 mx-auto mb-6 text-pink-600" />
            <h2 className="text-3xl font-serif font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {i18n.language === 'es' ? '¿Listo para Reservar?' : 'Ready to Book?'}
            </h2>
            <p className={`text-lg mb-8 max-w-2xl mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {i18n.language === 'es'
                ? 'Encuentra profesionales verificados cerca de ti y reserva con confianza.'
                : 'Find verified professionals near you and book with confidence.'}
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                to="/stylists"
                className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:shadow-lg transition-all hover:scale-105"
              >
                {i18n.language === 'es' ? 'Buscar Profesionales' : 'Find Professionals'}
              </Link>
              <Link
                to="/about"
                className={`inline-flex items-center px-8 py-4 rounded-full font-semibold transition-all hover:scale-105 ${
                  isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {i18n.language === 'es' ? 'Más Sobre BeautyCita' : 'More About BeautyCita'}
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

export default VerifiedProfessionalsPage
