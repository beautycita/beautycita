import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  PhoneIcon,
  ClockIcon as ClockSolidIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { useAuthStore } from '../../store/authStore'
import { bookingService } from '../../services/bookingService'
import toast from 'react-hot-toast'

export interface Booking {
  id: string
  serviceId: string
  serviceName: string
  stylistId: string
  stylistName: string
  stylistAvatar?: string
  stylistRating: number
  date: string
  time: string
  duration: number
  price: number
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'no-show'
  location: {
    type: 'salon' | 'home' | 'mobile'
    address: string
    name?: string
  }
  notes?: string
  createdAt: string
  updatedAt: string
  canCancel: boolean
  canReschedule: boolean
  canReview: boolean
  paymentStatus: 'paid' | 'pending' | 'refunded' | 'failed'
  receiptUrl?: string
}

interface BookingCardProps {
  booking: Booking
  onCancel: (bookingId: string) => void
  onReschedule: (bookingId: string) => void
  onDownloadReceipt: (bookingId: string) => void
  onContactStylist: (stylistId: string) => void
  onLeaveReview: (bookingId: string) => void
}

const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onCancel,
  onReschedule,
  onDownloadReceipt,
  onContactStylist,
  onLeaveReview
}) => {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'no-show':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'pending':
        return <ClockSolidIcon className="h-4 w-4" />
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4" />
      case 'no-show':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      default:
        return <ClockSolidIcon className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString))
  }

  const formatTime = (timeString: string) => {
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(`2000-01-01T${timeString}`))
  }

  const isUpcoming = () => {
    const bookingDateTime = new Date(`${booking.date}T${booking.time}`)
    return bookingDateTime > new Date() && booking.status !== 'cancelled'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card hover:shadow-lg transition-shadow duration-200"
    >
      <div className="card-body">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {booking.stylistAvatar ? (
              <img
                src={booking.stylistAvatar}
                alt={booking.stylistName}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{booking.serviceName}</h3>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-gray-600">{booking.stylistName}</p>
                <div className="flex items-center space-x-1">
                  <StarSolidIcon className="h-4 w-4 text-yellow-400" />
                  <span className="text-xs text-gray-500">{booking.stylistRating}</span>
                </div>
              </div>
            </div>
          </div>
          <div className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
            {getStatusIcon(booking.status)}
            <span className="capitalize">{booking.status}</span>
          </div>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600 capitalize">{formatDate(booking.date)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {formatTime(booking.time)} ({booking.duration}min)
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start space-x-2 mb-4">
          <MapPinIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p className="font-medium capitalize">{booking.location.type}</p>
            <p>{booking.location.name && `${booking.location.name} - `}{booking.location.address}</p>
          </div>
        </div>

        {/* Price and Payment */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
            <span className="text-lg font-semibold text-gray-900">
              ${booking.price.toFixed(2)} MXN
            </span>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
            booking.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            booking.paymentStatus === 'refunded' ? 'bg-blue-100 text-blue-800' :
            'bg-red-100 text-red-800'
          }`}>
            {booking.paymentStatus === 'paid' ? 'Pagado' :
             booking.paymentStatus === 'pending' ? 'Pendiente' :
             booking.paymentStatus === 'refunded' ? 'Reembolsado' :
             'Falló el pago'}
          </div>
        </div>

        {/* Notes */}
        {booking.notes && (
          <div className="mb-4 p-3 bg-gray-50 rounded-full">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Notas: </span>
              {booking.notes}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {/* Contact Stylist */}
          <button
            onClick={() => onContactStylist(booking.stylistId)}
            className="btn btn-secondary btn-sm flex items-center space-x-1 rounded-full"
          >
            <PhoneIcon className="h-4 w-4" />
            <span>Contactar</span>
          </button>

          {/* Download Receipt */}
          {booking.receiptUrl && (
            <button
              onClick={() => onDownloadReceipt(booking.id)}
              className="btn btn-secondary btn-sm flex items-center space-x-1 rounded-full"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              <span>Recibo</span>
            </button>
          )}

          {/* Reschedule */}
          {booking.canReschedule && isUpcoming() && (
            <button
              onClick={() => onReschedule(booking.id)}
              className="btn btn-primary btn-sm flex items-center space-x-1 rounded-full"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>Reprogramar</span>
            </button>
          )}

          {/* Cancel */}
          {booking.canCancel && isUpcoming() && (
            <button
              onClick={() => onCancel(booking.id)}
              className="btn btn-danger btn-sm flex items-center space-x-1 rounded-full"
            >
              <XCircleIcon className="h-4 w-4" />
              <span>Cancelar</span>
            </button>
          )}

          {/* Leave Review */}
          {booking.canReview && booking.status === 'completed' && (
            <button
              onClick={() => onLeaveReview(booking.id)}
              className="btn btn-primary btn-sm flex items-center space-x-1 rounded-full"
            >
              <StarIcon className="h-4 w-4" />
              <span>Calificar</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function BookingManagement() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('all')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      setLoading(true)
      const response = await bookingService.getBookings()

      if (response.success && response.data) {
        // Map API response to component's Booking interface
        const mappedBookings: Booking[] = response.data.map((booking: any) => ({
          id: booking.id.toString(),
          serviceId: booking.service_id?.toString() || '',
          serviceName: booking.service_name || booking.service?.name || 'Service',
          stylistId: booking.stylist_id?.toString() || '',
          stylistName: booking.stylist_name || booking.stylist?.business_name || 'Stylist',
          stylistAvatar: booking.stylist?.profile_picture_url || '',
          stylistRating: booking.stylist?.rating_average || 5.0,
          date: booking.booking_date || booking.date,
          time: booking.booking_time || booking.time,
          duration: booking.duration_minutes || 60,
          price: booking.total_price || booking.price || 0,
          status: (booking.status?.toLowerCase() || 'pending') as any,
          location: {
            type: booking.location_type || 'salon',
            name: booking.location_name || '',
            address: booking.location_address || booking.stylist?.location_address || ''
          },
          notes: booking.notes || booking.client_notes || '',
          createdAt: booking.created_at,
          updatedAt: booking.updated_at,
          canCancel: ['confirmed', 'pending'].includes(booking.status?.toLowerCase() || ''),
          canReschedule: ['confirmed', 'pending'].includes(booking.status?.toLowerCase() || ''),
          canReview: booking.status?.toLowerCase() === 'completed',
          paymentStatus: (booking.payment_status?.toLowerCase() || 'pending') as any,
          receiptUrl: booking.receipt_url || ''
        }))

        setBookings(mappedBookings)
      } else {
        setBookings([])
      }
    } catch (error) {
      console.error('Error loading bookings:', error)
      toast.error(t('bookings.error.load', 'Error al cargar las reservas'))
      setBookings([])
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (bookingId: string) => {
    setSelectedBookingId(bookingId)
    setShowCancelModal(true)
  }

  const confirmCancel = async () => {
    if (!selectedBookingId) return

    try {
      // API call to cancel booking
      setBookings(bookings =>
        bookings.map(booking =>
          booking.id === selectedBookingId
            ? { ...booking, status: 'cancelled' as const, canCancel: false, canReschedule: false }
            : booking
        )
      )
      toast.success('Reserva cancelada exitosamente')
    } catch (error) {
      toast.error('Error al cancelar la reserva')
    } finally {
      setShowCancelModal(false)
      setSelectedBookingId(null)
    }
  }

  const handleReschedule = async (bookingId: string) => {
    // In a real app, this would open a reschedule modal or navigate to booking flow
    toast(t('features.rescheduleInDevelopment'))
  }

  const handleDownloadReceipt = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId)
    if (booking?.receiptUrl) {
      // In a real app, this would download the receipt
      toast.success(t('features.downloadingReceipt'))
    }
  }

  const handleContactStylist = async (stylistId: string) => {
    // In a real app, this would open chat or contact modal
    toast(t('features.messagingInDevelopment'))
  }

  const handleLeaveReview = async (bookingId: string) => {
    // In a real app, this would open review modal
    toast(t('features.reviewsInDevelopment'))
  }

  const filteredBookings = bookings.filter(booking => {
    const bookingDateTime = new Date(`${booking.date}T${booking.time}`)
    const now = new Date()

    switch (filter) {
      case 'upcoming':
        return bookingDateTime > now && booking.status !== 'cancelled'
      case 'past':
        return bookingDateTime <= now || booking.status === 'completed'
      case 'cancelled':
        return booking.status === 'cancelled'
      default:
        return true
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container-responsive py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
            Mis Reservas
          </h1>
          <p className="text-gray-600">
            Gestiona tus citas de belleza y historial de servicios
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'upcoming', label: 'Próximas' },
              { key: 'past', label: 'Anteriores' },
              { key: 'cancelled', label: 'Canceladas' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-6">
          {filteredBookings.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-12">
                <CalendarDaysIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tienes reservas {filter === 'all' ? '' : filter === 'upcoming' ? 'próximas' : filter === 'past' ? 'anteriores' : 'canceladas'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {filter === 'all'
                    ? 'Reserva tu primera cita de belleza'
                    : `No hay reservas ${filter === 'upcoming' ? 'próximas' : filter === 'past' ? 'anteriores' : 'canceladas'} en este momento`
                  }
                </p>
                {filter === 'all' && (
                  <button className="btn btn-primary rounded-full">
                    Buscar Servicios
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={handleCancel}
                onReschedule={handleReschedule}
                onDownloadReceipt={handleDownloadReceipt}
                onContactStylist={handleContactStylist}
                onLeaveReview={handleLeaveReview}
              />
            ))
          )}
        </div>

        {/* Summary Stats */}
        {filteredBookings.length > 0 && filter === 'all' && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <div className="card-body text-center">
                <h3 className="text-2xl font-bold text-primary-600">
                  {bookings.filter(b => b.status === 'completed').length}
                </h3>
                <p className="text-sm text-gray-600">Servicios Completados</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <h3 className="text-2xl font-bold text-primary-600">
                  ${bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.price, 0).toFixed(2)}
                </h3>
                <p className="text-sm text-gray-600">Total Invertido</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <h3 className="text-2xl font-bold text-primary-600">
                  {bookings.filter(b => {
                    const bookingDateTime = new Date(`${b.date}T${b.time}`)
                    return bookingDateTime > new Date() && b.status !== 'cancelled'
                  }).length}
                </h3>
                <p className="text-sm text-gray-600">Próximas Citas</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowCancelModal(false)} />

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-full max-w-md w-full p-6"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Cancelar Reserva
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-6">
                  ¿Estás segura de que quieres cancelar esta reserva? Esta acción no se puede deshacer.
                </p>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50"
                  >
                    No, Mantener
                  </button>
                  <button
                    onClick={confirmCancel}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                  >
                    Sí, Cancelar
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}