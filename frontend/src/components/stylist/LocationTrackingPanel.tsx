// LocationTrackingPanel - Real-time client tracking for stylists
import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  MapPin,
  Clock,
  User,
  RefreshCw,
  AlertCircle,
  Car,
  Smartphone,
  Navigation
} from 'lucide-react'

interface ClientLocation {
  bookingId: string
  clientName: string
  appointmentTime: string
  serviceName: string
  serviceDuration: number
  lastUpdate: string
  estimatedArrivalMinutes: number | null
  lastEtaCheck: string | null
  distance: {
    meters: number
    text: string
    estimatedMinutes: number
  }
  isNear: boolean
}

interface LocationTrackingData {
  stylistLocation: {
    latitude: number
    longitude: number
    businessName: string
  }
  clients: ClientLocation[]
  totalClients: number
  nearbyClients: number
  lastUpdated: string
}

const LocationTrackingPanel: React.FC = () => {
  const { t } = useTranslation()
  const [trackingData, setTrackingData] = useState<LocationTrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchTrackingData = useCallback(async () => {
    try {
      setError(null)
      const response = await fetch('/api/location/stylist-proximity', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('beautycita-auth-token')}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setTrackingData(data)
        setLastRefresh(new Date())
      } else {
        throw new Error(data.error || 'Failed to fetch tracking data')
      }

    } catch (err) {
      console.error('Error fetching tracking data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchTrackingData()

    const interval = setInterval(fetchTrackingData, 30000)
    return () => clearInterval(interval)
  }, [fetchTrackingData])

  const handleRefresh = () => {
    setLoading(true)
    fetchTrackingData()
  }

  const getTimeUntilAppointment = (appointmentTime: string) => {
    const now = new Date()
    const appointment = new Date()
    const [hours, minutes] = appointmentTime.split(':').map(Number)
    appointment.setHours(hours, minutes, 0, 0)

    const diffMs = appointment.getTime() - now.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))

    if (diffMinutes < 0) {
      return { text: t('location.tracking.passed', 'Passed'), isPast: true }
    } else if (diffMinutes === 0) {
      return { text: t('location.tracking.now', 'Now'), isNow: true }
    } else if (diffMinutes < 60) {
      return { text: `${diffMinutes}m`, isPast: false, isNow: false }
    } else {
      const hours = Math.floor(diffMinutes / 60)
      const mins = diffMinutes % 60
      return { text: `${hours}h ${mins}m`, isPast: false, isNow: false }
    }
  }

  const getLastUpdateStatus = (lastUpdate: string) => {
    const now = new Date()
    const update = new Date(lastUpdate)
    const diffMinutes = Math.floor((now.getTime() - update.getTime()) / (1000 * 60))

    if (diffMinutes < 2) {
      return { text: t('location.tracking.live', 'Live'), color: 'text-green-600', dot: 'bg-green-500' }
    } else if (diffMinutes < 5) {
      return { text: `${diffMinutes}m ago`, color: 'text-yellow-600', dot: 'bg-yellow-500' }
    } else {
      return { text: `${diffMinutes}m ago`, color: 'text-red-600', dot: 'bg-red-500' }
    }
  }

  if (loading && !trackingData) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-purple-600" />
          <span className="text-gray-600">{t('location.tracking.loading', 'Loading client locations...')}</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">
              {t('location.tracking.error', 'Unable to load location data')}
            </h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 px-4 py-2 bg-red-50 text-red-700 rounded-3xl hover:bg-red-100 transition-colors text-sm font-medium"
            >
              {t('location.tracking.retry', 'Retry')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!trackingData) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">
              {t('location.tracking.title', 'Client Location Tracking')}
            </h2>
            <div className="flex items-center space-x-4 text-purple-100">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span className="text-sm">
                  {trackingData.totalClients} {t('location.tracking.clients', 'clients today')}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Navigation className="h-4 w-4" />
                <span className="text-sm">
                  {trackingData.nearbyClients} {t('location.tracking.nearby', 'nearby')}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 bg-white/20 rounded-3xl hover:bg-white/30 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Business Location */}
      <div className="bg-white rounded-3xl shadow-lg p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-3xl flex items-center justify-center">
            <MapPin className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{trackingData.stylistLocation.businessName}</p>
            <p className="text-sm text-gray-500">
              {trackingData.stylistLocation.latitude.toFixed(4)}, {trackingData.stylistLocation.longitude.toFixed(4)}
            </p>
          </div>
        </div>
      </div>

      {/* Client List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('location.tracking.clientList', 'Clients En Route')}
        </h3>

        <AnimatePresence>
          {trackingData.clients.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gray-50 rounded-3xl p-8 text-center"
            >
              <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {t('location.tracking.noClients', 'No clients are currently being tracked')}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {t('location.tracking.noClientsDesc', 'Tracking will begin automatically 3 hours before appointments')}
              </p>
            </motion.div>
          ) : (
            trackingData.clients.map((client) => {
              const timeUntil = getTimeUntilAppointment(client.appointmentTime)
              const updateStatus = getLastUpdateStatus(client.lastUpdate)

              return (
                <motion.div
                  key={client.bookingId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`bg-white rounded-3xl shadow-lg p-6 border-l-4 ${
                    client.isNear ? 'border-green-500 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  {/* Client Info Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">{client.clientName}</h4>
                      <p className="text-gray-600">{client.serviceName}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${timeUntil.isPast ? 'text-red-600' : timeUntil.isNow ? 'text-green-600' : 'text-gray-900'}`}>
                        {client.appointmentTime}
                      </div>
                      <div className="text-sm text-gray-500">
                        {timeUntil.text}
                      </div>
                    </div>
                  </div>

                  {/* Location Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Distance */}
                    <div className="flex items-center space-x-2">
                      <Car className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{client.distance.text}</p>
                        <p className="text-xs text-gray-500">
                          ~{client.distance.estimatedMinutes} min
                        </p>
                      </div>
                    </div>

                    {/* ETA */}
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {client.estimatedArrivalMinutes
                            ? `ETA: ${client.estimatedArrivalMinutes} min`
                            : t('location.tracking.calculatingEta', 'Calculating ETA...')
                          }
                        </p>
                        {client.lastEtaCheck && (
                          <p className="text-xs text-gray-500">
                            {t('location.tracking.lastCheck', 'Last check')}: {new Date(client.lastEtaCheck).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Update Status */}
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${updateStatus.dot}`}></div>
                      <div>
                        <p className={`text-sm font-medium ${updateStatus.color}`}>
                          {updateStatus.text}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(client.lastUpdate).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Near Alert */}
                  {client.isNear && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-4 p-3 bg-green-100 border border-green-200 rounded-3xl"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-3xl animate-pulse"></div>
                        <p className="text-green-800 font-medium text-sm">
                          {t('location.tracking.clientNear', 'Client is approaching! Get ready for their appointment.')}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500">
        {t('location.tracking.lastUpdated', 'Last updated')}: {lastRefresh.toLocaleTimeString()}
        {' • '}
        {t('location.tracking.autoRefresh', 'Auto-refreshes every 30s')}
      </div>
    </div>
  )
}

export default LocationTrackingPanel