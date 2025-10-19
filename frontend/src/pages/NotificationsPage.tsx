import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import axios from 'axios'
import {
  BellAlertIcon,
  ChatBubbleLeftIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckBadgeIcon,
  MapPinIcon,
  XCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface NotificationPreferences {
  booking_requests: boolean
  booking_confirmations: boolean
  proximity_alerts: boolean
  payment_notifications: boolean
  reminders: boolean
  cancellations: boolean
  marketing: boolean
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true'
  })

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    booking_requests: true,
    booking_confirmations: true,
    proximity_alerts: true,
    payment_notifications: true,
    reminders: true,
    cancellations: true,
    marketing: false
  })

  useEffect(() => {
    // Apply dark mode class
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await axios.get('/api/notifications/preferences', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data) {
        setPreferences(response.data)
      }
    } catch (error: any) {
      console.error('Error fetching preferences:', error)
      if (error.response?.status === 401) {
        toast.error('Please log in to manage notifications')
        navigate('/login')
      } else {
        toast.error('Failed to load notification preferences')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      await axios.put('/api/notifications/preferences', preferences, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success('Notification preferences saved successfully')
    } catch (error: any) {
      console.error('Error saving preferences:', error)
      toast.error('Failed to save notification preferences')
    } finally {
      setSaving(false)
    }
  }

  const notificationOptions = [
    {
      key: 'booking_requests' as keyof NotificationPreferences,
      icon: ChatBubbleLeftIcon,
      title: 'Booking Requests',
      description: 'Get notified when a stylist responds to your booking request',
      color: 'text-blue-500'
    },
    {
      key: 'booking_confirmations' as keyof NotificationPreferences,
      icon: CheckBadgeIcon,
      title: 'Booking Confirmations',
      description: 'Receive confirmation messages when your booking is confirmed',
      color: 'text-green-500'
    },
    {
      key: 'proximity_alerts' as keyof NotificationPreferences,
      icon: MapPinIcon,
      title: 'Proximity Alerts',
      description: 'Get alerts when you\'re en route to your appointment (10 min, 5 min, arrived)',
      color: 'text-pink-500'
    },
    {
      key: 'payment_notifications' as keyof NotificationPreferences,
      icon: CurrencyDollarIcon,
      title: 'Payment Notifications',
      description: 'Receive notifications about payment confirmations and receipts',
      color: 'text-purple-500'
    },
    {
      key: 'reminders' as keyof NotificationPreferences,
      icon: ClockIcon,
      title: 'Appointment Reminders',
      description: 'Get reminders 24 hours before your scheduled appointments',
      color: 'text-orange-500'
    },
    {
      key: 'cancellations' as keyof NotificationPreferences,
      icon: XCircleIcon,
      title: 'Cancellation Alerts',
      description: 'Be notified if your stylist needs to cancel or reschedule',
      color: 'text-red-500'
    },
    {
      key: 'marketing' as keyof NotificationPreferences,
      icon: SparklesIcon,
      title: 'Promotions & Updates',
      description: 'Receive special offers, new features, and beauty tips',
      color: 'text-yellow-500'
    }
  ]

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading notification preferences...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50'} py-20 px-4`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-serif font-bold bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500 bg-clip-text text-transparent mb-4">
            Notification Settings
          </h1>
          <p className={`text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Choose how you want to stay informed about your beauty appointments
          </p>
        </motion.div>

        {/* Notifications List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-3xl p-8 mb-8 ${
            isDarkMode
              ? 'bg-gray-800 border-2 border-gray-700'
              : 'bg-white/80 backdrop-blur-sm shadow-xl'
          }`}
        >
          <div className="space-y-6">
            {notificationOptions.map((option, index) => {
              const Icon = option.icon
              const isEnabled = preferences[option.key]

              return (
                <motion.div
                  key={option.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-start justify-between p-6 rounded-2xl border-2 transition-all ${
                    isDarkMode
                      ? isEnabled
                        ? 'bg-gray-700 border-gray-600'
                        : 'bg-gray-800 border-gray-700'
                      : isEnabled
                      ? 'bg-gradient-to-r from-pink-50/50 to-purple-50/50 border-pink-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start flex-1 mr-4">
                    <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-gray-600' : 'bg-white'} mr-4`}>
                      <Icon className={`w-6 h-6 ${option.color}`} />
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {option.title}
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {option.description}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggle(option.key)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-pink-500/50 ${
                      isEnabled
                        ? 'bg-gradient-to-r from-pink-500 to-purple-600'
                        : isDarkMode
                        ? 'bg-gray-600'
                        : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        isEnabled ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-end gap-4"
        >
          <button
            onClick={() => navigate('/profile')}
            className={`px-8 py-4 rounded-full font-semibold transition-all ${
              isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Back to Profile
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-4 rounded-full font-semibold text-white bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {saving ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Save Preferences'
            )}
          </button>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`mt-8 p-6 rounded-2xl ${
            isDarkMode
              ? 'bg-gray-800/50 border-2 border-gray-700'
              : 'bg-white/50 backdrop-blur-sm border-2 border-pink-100'
          }`}
        >
          <div className="flex items-start">
            <BellAlertIcon className={`w-6 h-6 mr-3 mt-1 flex-shrink-0 ${isDarkMode ? 'text-pink-400' : 'text-pink-500'}`} />
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <strong>SMS Notifications:</strong> All notifications are sent via SMS to your registered phone number.
                Standard message and data rates may apply. You can change these preferences at any time.
              </p>
              <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Contact support if you need to update your phone number.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default NotificationsPage
