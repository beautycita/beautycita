import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  ServerIcon,
  GlobeAltIcon,
  CreditCardIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  CloudIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'

type ServiceStatus = 'operational' | 'degraded' | 'outage' | 'maintenance'

interface Service {
  name: string
  nameEs: string
  description: string
  descriptionEs: string
  status: ServiceStatus
  uptime: string
  responseTime: string
  icon: React.ComponentType<any>
  lastIncident?: string
  lastIncidentEs?: string
}

const StatusPage: React.FC = () => {
  const { i18n } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
    const handleStorageChange = () => setIsDarkMode(localStorage.getItem('darkMode') === 'true')
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date())
    }, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const services: Service[] = [
    {
      name: 'Core Platform',
      nameEs: 'Plataforma Principal',
      description: 'Main website and mobile applications',
      descriptionEs: 'Sitio web principal y aplicaciones móviles',
      status: 'operational',
      uptime: '99.99%',
      responseTime: '145ms',
      icon: GlobeAltIcon
    },
    {
      name: 'API Services',
      nameEs: 'Servicios API',
      description: 'Backend API and database',
      descriptionEs: 'API backend y base de datos',
      status: 'operational',
      uptime: '99.98%',
      responseTime: '92ms',
      icon: ServerIcon
    },
    {
      name: 'Booking System',
      nameEs: 'Sistema de Reservas',
      description: 'Appointment booking and scheduling',
      descriptionEs: 'Reserva de citas y programación',
      status: 'operational',
      uptime: '99.97%',
      responseTime: '210ms',
      icon: ClockIcon
    },
    {
      name: 'Payment Processing',
      nameEs: 'Procesamiento de Pagos',
      description: 'Secure payment transactions',
      descriptionEs: 'Transacciones de pago seguras',
      status: 'operational',
      uptime: '99.99%',
      responseTime: '420ms',
      icon: CreditCardIcon
    },
    {
      name: 'Messaging System',
      nameEs: 'Sistema de Mensajería',
      description: 'Client-stylist messaging',
      descriptionEs: 'Mensajería cliente-estilista',
      status: 'operational',
      uptime: '99.96%',
      responseTime: '125ms',
      icon: ChatBubbleLeftRightIcon
    },
    {
      name: 'Notifications',
      nameEs: 'Notificaciones',
      description: 'Push notifications and email',
      descriptionEs: 'Notificaciones push y correo electrónico',
      status: 'operational',
      uptime: '99.95%',
      responseTime: '180ms',
      icon: BellIcon
    },
    {
      name: 'AI Recommendations',
      nameEs: 'Recomendaciones IA',
      description: 'Machine learning matching system',
      descriptionEs: 'Sistema de coincidencias de aprendizaje automático',
      status: 'operational',
      uptime: '99.94%',
      responseTime: '340ms',
      icon: CpuChipIcon
    },
    {
      name: 'Media Storage',
      nameEs: 'Almacenamiento de Medios',
      description: 'Image and video hosting (Cloudflare R2)',
      descriptionEs: 'Alojamiento de imágenes y videos (Cloudflare R2)',
      status: 'operational',
      uptime: '99.99%',
      responseTime: '65ms',
      icon: CloudIcon
    },
    {
      name: 'Security & Auth',
      nameEs: 'Seguridad y Autenticación',
      description: 'Authentication and security systems',
      descriptionEs: 'Sistemas de autenticación y seguridad',
      status: 'operational',
      uptime: '99.99%',
      responseTime: '110ms',
      icon: ShieldCheckIcon
    }
  ]

  const getStatusColor = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return 'text-green-500'
      case 'degraded':
        return 'text-yellow-500'
      case 'outage':
        return 'text-red-500'
      case 'maintenance':
        return 'text-blue-500'
    }
  }

  const getStatusBgColor = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500/10'
      case 'degraded':
        return 'bg-yellow-500/10'
      case 'outage':
        return 'bg-red-500/10'
      case 'maintenance':
        return 'bg-blue-500/10'
    }
  }

  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case 'operational':
        return CheckCircleIcon
      case 'degraded':
        return ExclamationTriangleIcon
      case 'outage':
        return XCircleIcon
      case 'maintenance':
        return ClockIcon
    }
  }

  const getStatusText = (status: ServiceStatus) => {
    if (i18n.language === 'es') {
      switch (status) {
        case 'operational':
          return 'Operacional'
        case 'degraded':
          return 'Degradado'
        case 'outage':
          return 'Fuera de Servicio'
        case 'maintenance':
          return 'Mantenimiento'
      }
    } else {
      switch (status) {
        case 'operational':
          return 'Operational'
        case 'degraded':
          return 'Degraded'
        case 'outage':
          return 'Outage'
        case 'maintenance':
          return 'Maintenance'
      }
    }
  }

  const overallStatus: ServiceStatus = services.every(s => s.status === 'operational')
    ? 'operational'
    : services.some(s => s.status === 'outage')
    ? 'outage'
    : services.some(s => s.status === 'degraded')
    ? 'degraded'
    : 'maintenance'

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <div className={`relative ${
        overallStatus === 'operational'
          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
          : overallStatus === 'degraded'
          ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
          : 'bg-gradient-to-r from-red-500 to-pink-600'
      } text-white py-20`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {overallStatus === 'operational' ? (
              <CheckCircleIcon className="h-20 w-20 mx-auto mb-6" />
            ) : overallStatus === 'degraded' ? (
              <ExclamationTriangleIcon className="h-20 w-20 mx-auto mb-6" />
            ) : (
              <XCircleIcon className="h-20 w-20 mx-auto mb-6" />
            )}

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
              {i18n.language === 'es' ? 'Estado del Sistema' : 'System Status'}
            </h1>

            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-4">
              {overallStatus === 'operational'
                ? i18n.language === 'es'
                  ? 'Todos los sistemas operando normalmente'
                  : 'All systems operational'
                : overallStatus === 'degraded'
                ? i18n.language === 'es'
                  ? 'Algunos sistemas experimentan problemas menores'
                  : 'Some systems experiencing minor issues'
                : i18n.language === 'es'
                ? 'Experimentando interrupciones del servicio'
                : 'Experiencing service disruptions'}
            </p>

            <p className={`text-sm text-white/70`}>
              {i18n.language === 'es' ? 'Última actualización' : 'Last updated'}: {lastUpdated.toLocaleTimeString(i18n.language === 'es' ? 'es-ES' : 'en-US')}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Services Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4"
        >
          {services.map((service, index) => {
            const StatusIcon = getStatusIcon(service.status)
            const ServiceIcon = service.icon

            return (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`rounded-2xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'} hover:shadow-xl transition-all`}
              >
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`p-3 rounded-xl ${getStatusBgColor(service.status)}`}>
                      <ServiceIcon className={`h-6 w-6 ${getStatusColor(service.status)}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {i18n.language === 'es' ? service.nameEs : service.name}
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {i18n.language === 'es' ? service.descriptionEs : service.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="text-center">
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {i18n.language === 'es' ? 'Tiempo Activo' : 'Uptime'}
                      </p>
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {service.uptime}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {i18n.language === 'es' ? 'Respuesta' : 'Response'}
                      </p>
                      <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {service.responseTime}
                      </p>
                    </div>

                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getStatusBgColor(service.status)}`}>
                      <StatusIcon className={`h-5 w-5 ${getStatusColor(service.status)}`} />
                      <span className={`font-semibold ${getStatusColor(service.status)}`}>
                        {getStatusText(service.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* System Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className={`rounded-2xl p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent mb-2">
                99.98%
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {i18n.language === 'es' ? 'Tiempo Activo Promedio' : 'Average Uptime'}
              </p>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {i18n.language === 'es' ? 'Últimos 30 días' : 'Last 30 days'}
              </p>
            </div>
          </div>

          <div className={`rounded-2xl p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
                168ms
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {i18n.language === 'es' ? 'Respuesta Promedio' : 'Average Response'}
              </p>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {i18n.language === 'es' ? 'Últimas 24 horas' : 'Last 24 hours'}
              </p>
            </div>
          </div>

          <div className={`rounded-2xl p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent mb-2">
                0
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {i18n.language === 'es' ? 'Incidentes Activos' : 'Active Incidents'}
              </p>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {i18n.language === 'es' ? 'Ahora mismo' : 'Right now'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Recent Incidents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <h2 className={`text-3xl font-serif font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {i18n.language === 'es' ? 'Historial de Incidentes' : 'Incident History'}
          </h2>

          <div className={`rounded-2xl p-8 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <div className="text-center">
              <CheckCircleIcon className={`h-16 w-16 mx-auto mb-4 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
              <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {i18n.language === 'es' ? 'Sin Incidentes Recientes' : 'No Recent Incidents'}
              </h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {i18n.language === 'es'
                  ? 'Todos los sistemas han estado funcionando sin problemas durante los últimos 30 días.'
                  : 'All systems have been running smoothly for the past 30 days.'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Subscribe to Updates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className={`rounded-2xl p-12 ${isDarkMode ? 'bg-gradient-to-br from-pink-500/20 to-purple-600/20' : 'bg-gradient-to-br from-pink-50 to-purple-50'}`}>
            <div className="text-center max-w-2xl mx-auto">
              <BellIcon className="h-16 w-16 mx-auto mb-6 text-pink-600" />
              <h2 className="text-3xl font-serif font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                {i18n.language === 'es' ? 'Mantente Informado' : 'Stay Informed'}
              </h2>
              <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {i18n.language === 'es'
                  ? 'Recibe notificaciones instantáneas sobre el estado del sistema y actualizaciones de mantenimiento.'
                  : 'Get instant notifications about system status and maintenance updates.'}
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <a
                  href="/contact"
                  className="inline-flex items-center px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:shadow-lg transition-all hover:scale-105"
                >
                  {i18n.language === 'es' ? 'Suscribirse a Actualizaciones' : 'Subscribe to Updates'}
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default StatusPage
