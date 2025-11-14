import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || ''

interface WorkStatus {
  stylist_id: number
  status: 'offline' | 'working' | 'available' | 'unavailable'
  work_started_at: string | null
  estimated_available_at: string | null
  actual_available_at: string | null
  alert_sent: boolean
  work_extended_count: number
  status_note: string | null
  last_status_change: string
}

interface WorkStatusCardProps {
  token: string
  onStatusChange?: () => void
}

export default function WorkStatusCard({ token, onStatusChange }: WorkStatusCardProps) {
  const [status, setStatus] = useState<WorkStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showETAInput, setShowETAInput] = useState(false)
  const [etaHours, setEtaHours] = useState('2')
  const [statusNote, setStatusNote] = useState('')

  useEffect(() => {
    fetchStatus()
    // Poll for status updates every 30 seconds
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Check if work hour is approaching end and alert hasn't been sent
    if (status?.status === 'working' && status.estimated_available_at && !status.alert_sent) {
      const eta = new Date(status.estimated_available_at)
      const now = new Date()
      const minutesUntilEnd = (eta.getTime() - now.getTime()) / 1000 / 60

      // Alert 15 minutes before ETA
      if (minutesUntilEnd <= 15 && minutesUntilEnd > 0) {
        toast((t) => (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <BellAlertIcon className="h-5 w-5 text-orange-500" />
              <span className="font-semibold">Work Hour Ending Soon!</span>
            </div>
            <p className="text-sm text-gray-600">
              Your work session ends in {Math.round(minutesUntilEnd)} minutes
            </p>
            <button
              onClick={() => {
                setShowETAInput(true)
                toast.dismiss(t.id)
              }}
              className="mt-2 px-3 py-1 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
            >
              Extend Work Hours
            </button>
          </div>
        ), { duration: 10000 })

        // Mark alert as sent
        markAlertSent()
      }
    }
  }, [status])

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/work-status/my-status`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStatus(response.data.status)
    } catch (error) {
      console.error('Failed to fetch work status:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAlertSent = async () => {
    try {
      await axios.post(
        `${API_URL}/api/work-status/mark-alert-sent`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } catch (error) {
      console.error('Failed to mark alert as sent:', error)
    }
  }

  const markWorking = async () => {
    if (!etaHours) {
      toast.error('Please enter estimated hours')
      return
    }

    setUpdating(true)
    try {
      const estimatedAvailableAt = new Date()
      estimatedAvailableAt.setHours(estimatedAvailableAt.getHours() + parseInt(etaHours))

      await axios.post(
        `${API_URL}/api/work-status/mark-working`,
        {
          estimatedAvailableAt: estimatedAvailableAt.toISOString(),
          statusNote
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success('Status updated to Working')
      setShowETAInput(false)
      setStatusNote('')
      await fetchStatus()
      onStatusChange?.()
    } catch (error) {
      console.error('Failed to mark as working:', error)
      toast.error('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const markAvailable = async () => {
    setUpdating(true)
    try {
      await axios.post(
        `${API_URL}/api/work-status/mark-available`,
        { statusNote },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success('You are now available for bookings!')
      setStatusNote('')
      await fetchStatus()
      onStatusChange?.()
    } catch (error) {
      console.error('Failed to mark as available:', error)
      toast.error('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const extendWork = async () => {
    if (!etaHours) {
      toast.error('Please enter estimated hours')
      return
    }

    setUpdating(true)
    try {
      const estimatedAvailableAt = new Date()
      estimatedAvailableAt.setHours(estimatedAvailableAt.getHours() + parseInt(etaHours))

      await axios.post(
        `${API_URL}/api/work-status/extend-work`,
        { estimatedAvailableAt: estimatedAvailableAt.toISOString() },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success('Work hours extended')
      setShowETAInput(false)
      await fetchStatus()
      onStatusChange?.()
    } catch (error) {
      console.error('Failed to extend work:', error)
      toast.error('Failed to extend work hours')
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (statusType: string) => {
    const colors = {
      offline: 'from-gray-400 to-gray-600',
      working: 'from-orange-500 to-red-600',
      available: 'from-green-500 to-emerald-600',
      unavailable: 'from-yellow-500 to-orange-600'
    }
    return colors[statusType as keyof typeof colors] || colors.offline
  }

  const getStatusIcon = (statusType: string) => {
    const icons = {
      offline: ExclamationCircleIcon,
      working: ClockIcon,
      available: CheckCircleIcon,
      unavailable: ExclamationCircleIcon
    }
    return icons[statusType as keyof typeof icons] || ExclamationCircleIcon
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <ArrowPathIcon className="h-8 w-8 text-purple-600 animate-spin" />
        </div>
      </div>
    )
  }

  const StatusIcon = status ? getStatusIcon(status.status) : ExclamationCircleIcon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-lg overflow-hidden"
    >
      {/* Status Header */}
      <div className={`bg-gradient-to-r ${status ? getStatusColor(status.status) : 'from-gray-400 to-gray-600'} p-6 text-white`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <StatusIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Work Status</h3>
              <p className="text-sm text-white/80 capitalize">
                {status?.status || 'Offline'}
              </p>
            </div>
          </div>
          <SparklesIcon className="h-6 w-6 text-white/60" />
        </div>

        {/* Status Info */}
        {status?.status === 'working' && status.estimated_available_at && (
          <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
            <p className="text-xs text-white/80 mb-1">Estimated Available At:</p>
            <p className="text-sm font-semibold">
              {new Date(status.estimated_available_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            {status.work_extended_count > 0 && (
              <p className="text-xs text-white/70 mt-1">
                Extended {status.work_extended_count} time{status.work_extended_count > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {showETAInput ? (
            <motion.div
              key="eta-input"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Hours Until Available
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={etaHours}
                  onChange={(e) => setEtaHours(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Hours"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Note (Optional)
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Add a note about your availability..."
                  rows={2}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={status?.status === 'working' ? extendWork : markWorking}
                  disabled={updating}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                >
                  {updating ? 'Updating...' : status?.status === 'working' ? 'Extend Hours' : 'Mark Working'}
                </button>
                <button
                  onClick={() => setShowETAInput(false)}
                  className="px-4 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="action-buttons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {status?.status === 'offline' || status?.status === 'unavailable' ? (
                <>
                  <button
                    onClick={() => setShowETAInput(true)}
                    disabled={updating}
                    className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    Mark Working
                  </button>
                  <button
                    onClick={markAvailable}
                    disabled={updating}
                    className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    Mark Available
                  </button>
                </>
              ) : status?.status === 'working' ? (
                <>
                  <button
                    onClick={() => setShowETAInput(true)}
                    disabled={updating}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    Extend Work Hours
                  </button>
                  <button
                    onClick={markAvailable}
                    disabled={updating}
                    className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    Mark Available
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowETAInput(true)}
                  disabled={updating}
                  className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  Mark Working
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Note Display */}
        {status?.status_note && !showETAInput && (
          <div className="mt-4 p-3 bg-purple-50 rounded-xl border border-purple-200">
            <p className="text-xs text-purple-600 font-medium mb-1">Status Note:</p>
            <p className="text-sm text-gray-700">{status.status_note}</p>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
          <p className="text-xs text-gray-600">
            <span className="font-semibold">💡 Tip:</span> Mark yourself as "Working" when busy, then "Available" when ready for bookings. You'll get alerts when your work time is ending!
          </p>
        </div>
      </div>
    </motion.div>
  )
}
