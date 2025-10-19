import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'
import {
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface AtRiskBooking {
  id: number
  booking_date: string
  start_time: string
  duration_seconds: number
  distance_meters: number
  is_en_route: boolean
  first_name: string
  last_name: string
  phone: string
  minutes_until_appointment: number
  service_name?: string
}

export default function LateClientAlerts() {
  const { token } = useAuthStore()
  const [bookings, setBookings] = useState<AtRiskBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<AtRiskBooking | null>(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<string>('')
  const [actionData, setActionData] = useState<any>({})

  useEffect(() => {
    fetchAtRiskBookings()
    const interval = setInterval(fetchAtRiskBookings, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchAtRiskBookings = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/bookings/late-risk-bookings`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setBookings(response.data.data)
    } catch (error) {
      console.error('Error fetching at-risk bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevel = (booking: AtRiskBooking) => {
    const eta = booking.duration_seconds ? booking.duration_seconds / 60 : 999
    const timeUntil = booking.minutes_until_appointment

    if (!booking.is_en_route && timeUntil < 10) {
      return { level: 'critical', color: 'red', label: 'CRITICAL' }
    } else if (booking.is_en_route && eta > timeUntil + 10) {
      return { level: 'high', color: 'orange', label: 'HIGH RISK' }
    } else if (!booking.is_en_route && timeUntil < 30) {
      return { level: 'medium', color: 'yellow', label: 'MEDIUM' }
    }
    return { level: 'low', color: 'blue', label: 'LOW' }
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDistance = (meters: number) => {
    const km = meters / 1000
    if (km < 1) return `${meters}m away`
    return `${km.toFixed(1)}km away`
  }

  const openActionModal = (booking: AtRiskBooking, type: string) => {
    setSelectedBooking(booking)
    setActionType(type)
    setActionData({})
    setShowActionModal(true)
  }

  const handleBumpAppointment = async () => {
    if (!selectedBooking || !actionData.new_time) {
      alert('Please select a new time')
      return
    }

    try {
      await axios.post(
        `${API_URL}/api/bookings/${selectedBooking.id}/mitigation/bump`,
        {
          new_time: actionData.new_time,
          reason: actionData.reason || 'Client running late',
          message_to_client: actionData.message
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('Appointment bumped successfully!')
      setShowActionModal(false)
      fetchAtRiskBookings()
    } catch (error) {
      console.error('Error bumping appointment:', error)
      alert('Failed to bump appointment')
    }
  }

  const handlePartialRefund = async () => {
    if (!selectedBooking || !actionData.percentage) {
      alert('Please enter refund percentage')
      return
    }

    try {
      await axios.post(
        `${API_URL}/api/bookings/${selectedBooking.id}/mitigation/partial-refund`,
        {
          refund_percentage: parseInt(actionData.percentage),
          reason: actionData.reason || 'Client was late',
          message_to_client: actionData.message
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('Partial refund initiated successfully!')
      setShowActionModal(false)
      fetchAtRiskBookings()
    } catch (error) {
      console.error('Error issuing refund:', error)
      alert('Failed to issue refund')
    }
  }

  const handleContactClient = async () => {
    if (!selectedBooking || !actionData.message) {
      alert('Please enter a message')
      return
    }

    try {
      await axios.post(
        `${API_URL}/api/bookings/${selectedBooking.id}/mitigation/contact-client`,
        { message: actionData.message },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('Client contacted successfully!')
      setShowActionModal(false)
    } catch (error) {
      console.error('Error contacting client:', error)
      alert('Failed to contact client')
    }
  }

  const handleCancelBooking = async () => {
    if (!selectedBooking) return

    if (!confirm('Are you sure you want to cancel this booking and issue a full refund?')) {
      return
    }

    try {
      await axios.post(
        `${API_URL}/api/bookings/${selectedBooking.id}/mitigation/cancel`,
        {
          reason: actionData.reason || 'Client no-show',
          message_to_client: actionData.message
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('Booking cancelled with full refund')
      setShowActionModal(false)
      fetchAtRiskBookings()
    } catch (error) {
      console.error('Error cancelling booking:', error)
      alert('Failed to cancel booking')
    }
  }

  const handleWaitForClient = async () => {
    if (!selectedBooking) return

    try {
      await axios.post(
        `${API_URL}/api/bookings/${selectedBooking.id}/mitigation/wait`,
        { reason: 'Will wait for client' },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('Marked as waiting for client')
      setShowActionModal(false)
      fetchAtRiskBookings()
    } catch (error) {
      console.error('Error marking wait:', error)
      alert('Failed to update')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ExclamationTriangleIcon className="w-8 h-8 text-orange-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Late Risk Alerts</h2>
            <p className="text-sm text-gray-600">
              Clients who may be running late or haven't started their journey
            </p>
          </div>
        </div>
        <button
          onClick={fetchAtRiskBookings}
          className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
          title="Refresh"
        >
          <ArrowPathIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
          <ClockIcon className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            All clear!
          </h3>
          <p className="text-gray-600">
            No bookings at risk of being late right now
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const risk = getRiskLevel(booking)
            const etaMinutes = booking.duration_seconds
              ? Math.ceil(booking.duration_seconds / 60)
              : null

            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`bg-white rounded-3xl shadow-lg p-6 border-l-8 border-${risk.color}-500`}
              >
                <div className="flex items-start justify-between mb-4">
                  {/* Client Info */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {booking.first_name[0]}
                      {booking.last_name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {booking.first_name} {booking.last_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatTime(booking.start_time)} appointment
                      </p>
                    </div>
                  </div>

                  {/* Risk Badge */}
                  <span
                    className={`px-4 py-2 bg-${risk.color}-100 text-${risk.color}-700 text-xs font-bold rounded-full`}
                  >
                    {risk.label}
                  </span>
                </div>

                {/* Status Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-gray-50 rounded-2xl">
                    <ClockIcon className="w-5 h-5 mx-auto text-gray-600 mb-1" />
                    <p className="text-xs text-gray-600">Time Until</p>
                    <p className="font-bold text-gray-900">
                      {Math.round(booking.minutes_until_appointment)} min
                    </p>
                  </div>
                  {etaMinutes && (
                    <div className="text-center p-3 bg-gray-50 rounded-2xl">
                      <MapPinIcon className="w-5 h-5 mx-auto text-gray-600 mb-1" />
                      <p className="text-xs text-gray-600">ETA</p>
                      <p className="font-bold text-gray-900">{etaMinutes} min</p>
                    </div>
                  )}
                  {booking.distance_meters > 0 && (
                    <div className="text-center p-3 bg-gray-50 rounded-2xl">
                      <MapPinIcon className="w-5 h-5 mx-auto text-gray-600 mb-1" />
                      <p className="text-xs text-gray-600">Distance</p>
                      <p className="font-bold text-gray-900">
                        {formatDistance(booking.distance_meters)}
                      </p>
                    </div>
                  )}
                  <div className="text-center p-3 bg-gray-50 rounded-2xl">
                    <PhoneIcon className="w-5 h-5 mx-auto text-gray-600 mb-1" />
                    <p className="text-xs text-gray-600">Status</p>
                    <p className="font-bold text-gray-900">
                      {booking.is_en_route ? 'En Route' : 'Not Started'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => openActionModal(booking, 'bump')}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-medium hover:bg-blue-200 transition-colors text-sm"
                  >
                    Bump Appointment
                  </button>
                  <button
                    onClick={() => openActionModal(booking, 'contact')}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full font-medium hover:bg-purple-200 transition-colors text-sm"
                  >
                    Contact Client
                  </button>
                  <button
                    onClick={() => openActionModal(booking, 'refund')}
                    className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full font-medium hover:bg-orange-200 transition-colors text-sm"
                  >
                    Partial Refund
                  </button>
                  <button
                    onClick={() => handleWaitForClient()}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-full font-medium hover:bg-green-200 transition-colors text-sm"
                  >
                    Wait for Client
                  </button>
                  <button
                    onClick={() => openActionModal(booking, 'cancel')}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-full font-medium hover:bg-red-200 transition-colors text-sm"
                  >
                    Cancel Booking
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Action Modal */}
      <AnimatePresence>
        {showActionModal && selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowActionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                {actionType === 'bump' && 'Bump Appointment'}
                {actionType === 'contact' && 'Contact Client'}
                {actionType === 'refund' && 'Issue Partial Refund'}
                {actionType === 'cancel' && 'Cancel Booking'}
              </h3>

              {/* Bump Form */}
              {actionType === 'bump' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Time *
                    </label>
                    <input
                      type="time"
                      value={actionData.new_time || ''}
                      onChange={(e) =>
                        setActionData({ ...actionData, new_time: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-4 focus:ring-pink-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message to Client
                    </label>
                    <textarea
                      value={actionData.message || ''}
                      onChange={(e) =>
                        setActionData({ ...actionData, message: e.target.value })
                      }
                      placeholder="Hi! I'm moving your appointment..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-4 focus:ring-pink-500/50"
                    />
                  </div>
                  <button
                    onClick={handleBumpAppointment}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-shadow"
                  >
                    Bump Appointment
                  </button>
                </div>
              )}

              {/* Contact Form */}
              {actionType === 'contact' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      value={actionData.message || ''}
                      onChange={(e) =>
                        setActionData({ ...actionData, message: e.target.value })
                      }
                      placeholder="Hi! Just checking if you're on your way..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-4 focus:ring-pink-500/50"
                    />
                  </div>
                  <button
                    onClick={handleContactClient}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:shadow-lg transition-shadow"
                  >
                    Send Message
                  </button>
                </div>
              )}

              {/* Refund Form */}
              {actionType === 'refund' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Refund Percentage (%) *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={actionData.percentage || ''}
                      onChange={(e) =>
                        setActionData({ ...actionData, percentage: e.target.value })
                      }
                      placeholder="25"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-4 focus:ring-pink-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message to Client
                    </label>
                    <textarea
                      value={actionData.message || ''}
                      onChange={(e) =>
                        setActionData({ ...actionData, message: e.target.value })
                      }
                      placeholder="Issuing 25% refund for the delay..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-4 focus:ring-pink-500/50"
                    />
                  </div>
                  <button
                    onClick={handlePartialRefund}
                    className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full font-semibold hover:shadow-lg transition-shadow"
                  >
                    Issue Refund
                  </button>
                </div>
              )}

              {/* Cancel Form */}
              {actionType === 'cancel' && (
                <div className="space-y-4">
                  <p className="text-gray-700">
                    This will cancel the booking and issue a full refund to the client.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason
                    </label>
                    <textarea
                      value={actionData.reason || ''}
                      onChange={(e) =>
                        setActionData({ ...actionData, reason: e.target.value })
                      }
                      placeholder="Client no-show..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-4 focus:ring-pink-500/50"
                    />
                  </div>
                  <button
                    onClick={handleCancelBooking}
                    className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full font-semibold hover:shadow-lg transition-shadow"
                  >
                    Cancel & Refund
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowActionModal(false)}
                className="w-full mt-4 py-3 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
