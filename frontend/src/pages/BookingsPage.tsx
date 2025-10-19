import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  CalendarDaysIcon,
  ClockIcon,
  MapPinIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { bookingService, type Booking } from '../services/bookingService'
import type { BookingStatus } from '../types'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import ReviewForm from '../components/reviews/ReviewForm'
import { apiClient } from '../services/api'
import { PageHero, GradientCard } from '../components/ui'
import OnboardingReminder from '../components/onboarding/OnboardingReminder'
import BookingDetailsModal from '../components/booking/BookingDetailsModal'

const statusConfig: Record<BookingStatus, { color: string; borderColor: string; icon: any; text: string }> = {
  PENDING_PAYMENT: {
    color: 'bg-orange-100 text-orange-800',
    borderColor: 'border-orange-300',
    icon: ClockIcon,
    text: 'Pending Payment'
  },
  PENDING_STYLIST_APPROVAL: {
    color: 'bg-yellow-100 text-yellow-800',
    borderColor: 'border-yellow-300',
    icon: ClockIcon,
    text: 'Pending'
  },
  STYLIST_ACCEPTED: {
    color: 'bg-blue-100 text-blue-800',
    borderColor: 'border-blue-300',
    icon: CheckCircleIcon,
    text: 'Accepted'
  },
  CLIENT_CONFIRMED: {
    color: 'bg-green-100 text-green-800',
    borderColor: 'border-green-300',
    icon: CheckCircleIcon,
    text: 'Confirmed'
  },
  IN_PROGRESS: {
    color: 'bg-indigo-100 text-indigo-800',
    borderColor: 'border-indigo-300',
    icon: ClockIcon,
    text: 'In Progress'
  },
  COMPLETED: {
    color: 'bg-emerald-100 text-emerald-800',
    borderColor: 'border-emerald-300',
    icon: CheckCircleIcon,
    text: 'Completed'
  },
  STYLIST_DECLINED: {
    color: 'bg-red-100 text-red-800',
    borderColor: 'border-red-300',
    icon: XCircleIcon,
    text: 'Declined'
  },
  STYLIST_NO_RESPONSE: {
    color: 'bg-gray-100 text-gray-800',
    borderColor: 'border-gray-300',
    icon: XCircleIcon,
    text: 'No Response'
  },
  CLIENT_NO_CONFIRM: {
    color: 'bg-gray-100 text-gray-800',
    borderColor: 'border-gray-300',
    icon: XCircleIcon,
    text: 'Not Confirmed'
  },
  CLIENT_NO_SHOW: {
    color: 'bg-orange-100 text-orange-800',
    borderColor: 'border-orange-300',
    icon: XCircleIcon,
    text: 'No Show'
  },
  STYLIST_NO_SHOW: {
    color: 'bg-red-100 text-red-800',
    borderColor: 'border-red-300',
    icon: XCircleIcon,
    text: 'Stylist No Show'
  },
  CANCELLED: {
    color: 'bg-red-100 text-red-800',
    borderColor: 'border-red-300',
    icon: XCircleIcon,
    text: 'Cancelled'
  },
  EXPIRED: {
    color: 'bg-gray-100 text-gray-800',
    borderColor: 'border-gray-300',
    icon: XCircleIcon,
    text: 'Expired'
  }
}

const filterOptions = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
]

export default function BookingsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [reviewingBookingId, setReviewingBookingId] = useState<string | null>(null)
  const [viewingBookingId, setViewingBookingId] = useState<string | null>(null)
  const [bookingHasReview, setBookingHasReview] = useState<Record<string, boolean>>({})
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Check dark mode
  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)

    const handleStorageChange = () => {
      const newDarkMode = localStorage.getItem('darkMode') === 'true'
      setIsDarkMode(newDarkMode)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadBookings()
    }
  }, [isAuthenticated])

  const loadBookings = async () => {
    try {
      setLoading(true)
      const response = await bookingService.getBookings()

      if (response.success && response.data) {
        setBookings(response.data)
        // Check which bookings already have reviews
        checkExistingReviews(response.data)
      } else {
        toast.error('Error al cargar las citas')
      }
    } catch (error) {
      console.error('Error loading bookings:', error)
      toast.error('Error al cargar las citas')
    } finally {
      setLoading(false)
    }
  }

  const checkExistingReviews = async (bookingsList: Booking[]) => {
    try {
      const response = await apiClient.get('/reviews/my-reviews')
      if (response.success) {
        const reviewedBookingIds = new Set(
          response.data.map((review: any) => review.booking_id.toString())
        )
        const hasReviewMap: Record<string, boolean> = {}
        bookingsList.forEach(booking => {
          hasReviewMap[booking.id] = reviewedBookingIds.has(booking.id)
        })
        setBookingHasReview(hasReviewMap)
      }
    } catch (error) {
      console.error('Error checking reviews:', error)
    }
  }

  const handleReviewSuccess = () => {
    setReviewingBookingId(null)
    loadBookings() // Reload to update review status
    toast.success('¡Reseña publicada con éxito!')
  }

  const filteredBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.booking_date || booking.appointment_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (filter) {
      case 'upcoming':
        return bookingDate >= today && ![
          'CANCELLED', 'EXPIRED', 'COMPLETED', 'STYLIST_DECLINED',
          'STYLIST_NO_RESPONSE', 'CLIENT_NO_CONFIRM', 'CLIENT_NO_SHOW', 'STYLIST_NO_SHOW'
        ].includes(booking.status)
      case 'past':
        return bookingDate < today || ['COMPLETED', 'CLIENT_NO_SHOW', 'STYLIST_NO_SHOW'].includes(booking.status)
      case 'cancelled':
        return ['CANCELLED', 'EXPIRED', 'STYLIST_DECLINED', 'STYLIST_NO_RESPONSE', 'CLIENT_NO_CONFIRM'].includes(booking.status)
      default:
        return true
    }
  })

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
      return
    }

    try {
      const response = await bookingService.cancelBooking(bookingId)

      if (response.success) {
        toast.success('Cita cancelada correctamente')
        loadBookings() // Reload bookings
      } else {
        toast.error('Error al cancelar la cita')
      }
    } catch (error) {
      console.error('Error cancelling booking:', error)
      toast.error('Error al cancelar la cita')
    }
  }

  const formatDate = (dateString: string) => {
    // Parse date in UTC to avoid timezone issues
    const date = new Date(dateString)
    // Extract just the date parts in UTC
    const year = date.getUTCFullYear()
    const month = date.getUTCMonth()
    const day = date.getUTCDate()
    // Create new date in local timezone with the same calendar date
    const localDate = new Date(year, month, day)
    return localDate.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="rounded-full h-12 w-12 border-4 border-t-pink-500 border-r-purple-500 border-b-blue-500 border-l-transparent"
        />
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Hero Section */}
      <PageHero
        title="My Bookings"
        subtitle="Manage and review all your beauty appointments"
        gradient="from-pink-500 via-purple-500 to-blue-500"
        isDarkMode={isDarkMode}
        height="h-80"
      />

      <div className="container mx-auto px-4 max-w-7xl py-12">
        {/* Onboarding Completion Reminder */}
        <OnboardingReminder isDarkMode={isDarkMode} />

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {filterOptions.map((option) => {
              const isActive = filter === option.value
              const count = bookings.filter(booking => {
                const bookingDate = new Date(booking.booking_date || booking.appointment_date)
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                switch (option.value) {
                  case 'upcoming':
                    return bookingDate >= today && booking.status !== 'CANCELLED'
                  case 'past':
                    return bookingDate < today || booking.status === 'COMPLETED'
                  case 'cancelled':
                    return booking.status === 'CANCELLED'
                  default:
                    return true
                }
              }).length

              return (
                <motion.button
                  key={option.value}
                  onClick={() => setFilter(option.value)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                      : isDarkMode
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive
                      ? 'bg-white/20'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking, index) => {
              const statusInfo = statusConfig[booking.status] || statusConfig.PENDING_PAYMENT
              const StatusIcon = statusInfo.icon
              const canCancel = [
                'PENDING_STYLIST_APPROVAL', 'STYLIST_ACCEPTED', 'CLIENT_CONFIRMED'
              ].includes(booking.status)
              const canReview = booking.status === 'COMPLETED' && !bookingHasReview[booking.id]
              const hasReview = bookingHasReview[booking.id]

              return (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GradientCard
                    gradient="from-pink-500/10 via-purple-500/10 to-blue-500/10"
                    isDarkMode={isDarkMode}
                    hoverable={true}
                    className={`border-l-4 ${statusInfo.borderColor}`}
                  >
                    <div className="flex flex-col md:flex-row items-start justify-between gap-4">
                      {/* Service and Stylist Info */}
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full flex items-center justify-center">
                            <UserCircleIcon className="w-10 h-10 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-serif font-bold text-xl mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {booking.service_name}
                          </h3>
                          <p className={`font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {booking.stylist_business_name}
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            with {booking.stylist_name}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${statusInfo.color} whitespace-nowrap`}>
                        <StatusIcon className="w-4 h-4 mr-2" />
                        {statusInfo.text}
                      </div>
                    </div>

                    {/* Date, Time, Price */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <CalendarDaysIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date</p>
                          <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatDate(booking.booking_date || booking.appointment_date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                          <ClockIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Time</p>
                          <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatTime(booking.booking_time || booking.appointment_time)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-white">$</span>
                        </div>
                        <div>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total</p>
                          <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            ${booking.total_price}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {booking.notes && (
                      <div className={`mb-6 p-4 rounded-3xl ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <span className="font-medium">Notes:</span> {booking.notes}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => setViewingBookingId(booking.id)} className={`flex-1 min-w-[120px] px-4 py-2 rounded-full font-medium transition-all border ${
                        isDarkMode
                          ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}>
                        <EyeIcon className="w-4 h-4 mr-1 inline" />
                        View Details
                      </button>
                      {canCancel && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="flex-1 min-w-[120px] px-4 py-2 rounded-full font-medium transition-all border border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Cancel
                        </button>
                      )}
                      {canReview && (
                        <button
                          onClick={() => setReviewingBookingId(booking.id)}
                          className="flex-1 min-w-[120px] px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
                        >
                          <StarIcon className="w-4 h-4 mr-1 inline" />
                          Write Review
                        </button>
                      )}
                      {hasReview && (
                        <div className="flex-1 min-w-[120px] px-4 py-2 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-medium">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Reviewed
                        </div>
                      )}
                    </div>
                  </GradientCard>
                </motion.div>
              )
            })
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="text-8xl mb-6">📅</div>
              <h3 className={`text-2xl font-serif font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {filter === 'all' ? 'No bookings yet' : `No ${filterOptions.find(f => f.value === filter)?.label.toLowerCase()} bookings`}
              </h3>
              <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {filter === 'all' ? 'Book your first appointment with a professional stylist!' : 'Change the filter to see other bookings'}
              </p>
              {filter === 'all' && (
                <Link to="/stylists">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Explore Stylists
                  </motion.button>
                </Link>
              )}
            </motion.div>
          )}
        </div>

        {/* Review Modal */}
        <AnimatePresence>
          {reviewingBookingId && (() => {
            const booking = bookings.find(b => b.id === reviewingBookingId)
            if (!booking) return null

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                onClick={() => setReviewingBookingId(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ReviewForm
                    bookingId={parseInt(booking.id)}
                    stylistName={booking.stylist_business_name}
                    serviceType={booking.service_name}
                    onSuccess={handleReviewSuccess}
                    onCancel={() => setReviewingBookingId(null)}
                  />
                </motion.div>
              </motion.div>
            )
          })()}
        </AnimatePresence>

        {/* Booking Details Modal */}
        <AnimatePresence>
          {viewingBookingId && (() => {
            const booking = bookings.find(b => b.id === viewingBookingId)
            if (!booking) return null

            return (
              <BookingDetailsModal
                booking={booking}
                onClose={() => setViewingBookingId(null)}
                onUpdate={loadBookings}
                userRole={user?.role || 'CLIENT'}
              />
            )
          })()}
        </AnimatePresence>
      </div>
    </div>
  )
}