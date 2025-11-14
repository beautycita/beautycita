import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import { XMarkIcon, ClockIcon, CurrencyDollarIcon, UserIcon, CalendarDaysIcon, CheckCircleIcon, PhoneIcon, EnvelopeIcon, DocumentTextIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

const API_URL = import.meta.env.VITE_API_URL || ''

interface BookingDetailsModalProps {
  booking: any
  onClose: () => void
  onUpdate?: () => void
  userRole: 'CLIENT' | 'STYLIST'
}

export default function BookingDetailsModal({ booking, onClose, onUpdate, userRole }: BookingDetailsModalProps) {
  const [loading, setLoading] = useState(false)

  const handleAccept = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      await axios.post(`${API_URL}/api/bookings/${booking.id}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } })
      toast.success('Booking accepted!')
      if (onUpdate) onUpdate()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to accept booking')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')
      await axios.post(`${API_URL}/api/bookings/${booking.id}/complete`, {}, { headers: { Authorization: `Bearer ${token}` } })
      toast.success('Booking marked as complete!')
      if (onUpdate) onUpdate()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete booking')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'CONFIRMED': return 'bg-green-100 text-green-800 border-green-300'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  // Handle both field naming conventions (appointment_date/time and booking_date/time)
  const dateValue = booking.appointment_date || booking.booking_date
  const timeValue = booking.appointment_time || booking.booking_time || booking.start_time

  // Parse date accounting for UTC timezone offset
  let bookingDate = null
  if (dateValue) {
    const d = new Date(dateValue)
    // Create date in local timezone with same calendar date
    bookingDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  }

  // Calculate end time based on start time and duration
  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    if (!startTime) return 'N/A'
    const [hours, minutes] = startTime.split(':').map(Number)
    const startMinutes = hours * 60 + minutes
    const endMinutes = startMinutes + durationMinutes
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`
  }

  const startTime = timeValue || 'N/A'
  const endTime = booking.end_time || (timeValue && booking.duration_minutes
    ? calculateEndTime(timeValue, booking.duration_minutes)
    : 'N/A')

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500 p-6 rounded-t-3xl">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">Booking Details</h2>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border-2 ${getStatusColor(booking.status)}`}>{booking.status}</span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Service</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-xl"><DocumentTextIcon className="h-5 w-5 text-white" /></div>
                  <p className="font-semibold text-gray-900 dark:text-white">{booking.service_name || 'Service'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-xl"><ClockIcon className="h-5 w-5 text-white" /></div>
                  <p className="font-semibold text-gray-900 dark:text-white">{booking.duration_minutes} minutes</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-xl"><CurrencyDollarIcon className="h-5 w-5 text-white" /></div>
                  <p className="font-semibold text-gray-900 dark:text-white text-xl">${parseFloat(booking.total_price || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">When</h3>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-xl"><CalendarDaysIcon className="h-5 w-5 text-white" /></div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{bookingDate ? format(bookingDate, 'EEEE, MMMM d, yyyy') : 'Date not set'}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{startTime} - {endTime}</p>
                </div>
              </div>
            </div>
            {booking.stylist_location && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Location</h3>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-xl"><MapPinIcon className="h-5 w-5 text-white" /></div>
                  <p className="font-semibold text-gray-900 dark:text-white">{booking.stylist_location}</p>
                </div>
              </div>
            )}
            {userRole === 'STYLIST' && (
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Client</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500 rounded-xl"><UserIcon className="h-5 w-5 text-white" /></div>
                    <p className="font-semibold text-gray-900 dark:text-white">{booking.client_name || 'Client'}</p>
                  </div>
                  {booking.client_phone && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500 rounded-xl"><PhoneIcon className="h-5 w-5 text-white" /></div>
                      <a href={`tel:${booking.client_phone}`} className="text-gray-900 dark:text-white hover:underline">{booking.client_phone}</a>
                    </div>
                  )}
                  {booking.client_email && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500 rounded-xl"><EnvelopeIcon className="h-5 w-5 text-white" /></div>
                      <a href={`mailto:${booking.client_email}`} className="text-gray-900 dark:text-white hover:underline">{booking.client_email}</a>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-3">
              {booking.status === 'PENDING' && userRole === 'STYLIST' && (
                <button onClick={handleAccept} disabled={loading} className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" />{loading ? 'Accepting...' : 'Accept Booking'}
                </button>
              )}
              {booking.status === 'CONFIRMED' && userRole === 'STYLIST' && (
                <button onClick={handleComplete} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" />{loading ? 'Processing...' : 'Mark as Complete'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
