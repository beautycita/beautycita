import { useState, useEffect } from 'react'
import { Switch } from '@headlessui/react'
import axios from 'axios'
import {
  BellIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface SMSPreferences {
  booking_requests: boolean
  booking_confirmations: boolean
  proximity_alerts: boolean
  payment_notifications: boolean
  reminders: boolean
  cancellations: boolean
  marketing: boolean
  emergency_only: boolean
  booking_expired: boolean
}

export default function SMSPreferencesPanel() {
  const [preferences, setPreferences] = useState<SMSPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/sms-preferences', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPreferences(response.data.preferences)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load SMS preferences')
    } finally {
      setLoading(false)
    }
  }

  const updatePreferences = async (updates: Partial<SMSPreferences>) => {
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      const token = localStorage.getItem('token')
      const response = await axios.put(
        '/api/sms-preferences',
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setPreferences(response.data.preferences)
      setSuccess('Preferences updated successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update preferences')
    } finally {
      setSaving(false)
    }
  }

  const togglePreference = (key: keyof SMSPreferences) => {
    if (!preferences) return
    const newValue = !preferences[key]
    setPreferences({ ...preferences, [key]: newValue })
    updatePreferences({ [key]: newValue })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  if (!preferences) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Failed to load SMS preferences</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <DevicePhoneMobileIcon className="w-8 h-8 text-pink-500 mr-3" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            SMS Notifications
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your SMS notification preferences. You can opt-in or opt-out of specific notification types.
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
          <p className="text-green-800 dark:text-green-200 text-sm">{success}</p>
        </div>
      )}

      {/* Emergency Only Mode */}
      <div className="mb-8 p-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-3xl">
        <div className="flex items-start justify-between">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 dark:text-amber-400 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Emergency Only Mode
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                When enabled, you'll only receive SMS for booking confirmations, cancellations, and proximity alerts.
                All other notifications will be disabled.
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.emergency_only}
            onChange={() => togglePreference('emergency_only')}
            disabled={saving}
            className={`${
              preferences.emergency_only ? 'bg-amber-600' : 'bg-gray-300 dark:bg-gray-600'
            } relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50`}
          >
            <span
              className={`${
                preferences.emergency_only ? 'translate-x-7' : 'translate-x-1'
              } inline-block h-6 w-6 transform rounded-full bg-white transition-transform`}
            />
          </Switch>
        </div>
      </div>

      {/* Essential Notifications */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <BellIcon className="w-6 h-6 text-pink-500 mr-2" />
          Essential Notifications
        </h3>
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-md divide-y divide-gray-200 dark:divide-gray-700">
          <PreferenceToggle
            label="Booking Confirmations"
            description="Get notified when a booking is confirmed"
            enabled={preferences.booking_confirmations}
            disabled={saving || preferences.emergency_only}
            onToggle={() => togglePreference('booking_confirmations')}
          />
          <PreferenceToggle
            label="Booking Requests"
            description="Receive alerts when clients request bookings"
            enabled={preferences.booking_requests}
            disabled={saving || preferences.emergency_only}
            onToggle={() => togglePreference('booking_requests')}
          />
          <PreferenceToggle
            label="Cancellations"
            description="Be informed immediately of any cancellations"
            enabled={preferences.cancellations}
            disabled={saving || preferences.emergency_only}
            onToggle={() => togglePreference('cancellations')}
          />
          <PreferenceToggle
            label="Proximity Alerts"
            description="Know when clients are on their way (10 min, 5 min, arrived)"
            enabled={preferences.proximity_alerts}
            disabled={saving || preferences.emergency_only}
            onToggle={() => togglePreference('proximity_alerts')}
          />
        </div>
      </div>

      {/* Additional Notifications */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Additional Notifications
        </h3>
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-md divide-y divide-gray-200 dark:divide-gray-700">
          <PreferenceToggle
            label="Payment Notifications"
            description="Updates about payments and transactions"
            enabled={preferences.payment_notifications}
            disabled={saving || preferences.emergency_only}
            onToggle={() => togglePreference('payment_notifications')}
          />
          <PreferenceToggle
            label="Reminders"
            description="24-hour advance booking reminders"
            enabled={preferences.reminders}
            disabled={saving || preferences.emergency_only}
            onToggle={() => togglePreference('reminders')}
          />
          <PreferenceToggle
            label="Booking Expired"
            description="Notifications when bookings expire"
            enabled={preferences.booking_expired}
            disabled={saving || preferences.emergency_only}
            onToggle={() => togglePreference('booking_expired')}
          />
        </div>
      </div>

      {/* Marketing */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Marketing & Promotions
        </h3>
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-md">
          <PreferenceToggle
            label="Marketing Messages"
            description="Receive promotional offers, tips, and platform updates"
            enabled={preferences.marketing}
            disabled={saving || preferences.emergency_only}
            onToggle={() => togglePreference('marketing')}
          />
        </div>
      </div>

      {/* Legal Disclaimer */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>Note:</strong> Standard messaging rates may apply. You can opt-out of any notification type at any time.
          Essential notifications (booking confirmations, cancellations) are recommended to ensure smooth service coordination.
        </p>
      </div>
    </div>
  )
}

interface PreferenceToggleProps {
  label: string
  description: string
  enabled: boolean
  disabled?: boolean
  onToggle: () => void
}

function PreferenceToggle({ label, description, enabled, disabled, onToggle }: PreferenceToggleProps) {
  return (
    <div className="px-6 py-4 flex items-start justify-between">
      <div className="flex-1">
        <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
          {label}
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
      <Switch
        checked={enabled}
        onChange={onToggle}
        disabled={disabled}
        className={`${
          enabled ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-300 dark:bg-gray-600'
        } relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 ml-4 flex-shrink-0`}
      >
        <span
          className={`${
            enabled ? 'translate-x-7' : 'translate-x-1'
          } inline-block h-6 w-6 transform rounded-full bg-white transition-transform`}
        />
      </Switch>
    </div>
  )
}
