import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  DocumentTextIcon,
  StarIcon,
  ArrowPathIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  FilterIcon,
  MagnifyingGlassIcon,
  BellIcon,
  CameraIcon,
  HeartIcon,
  GiftIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
  InformationCircleIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  FunnelIcon,
  ArrowTopRightOnSquareIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  VideoCameraIcon,
  PrinterIcon,
  ShareIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface StylistBooking {
  id: string
  clientId: string
  client: {
    firstName: string
    lastName: string
    email: string
    phone: string
    avatar?: string
    isNewClient: boolean
    totalBookings: number
    averageRating?: number
    lastBooking?: string
    preferredCommunication: 'whatsapp' | 'sms' | 'email' | 'phone'
    notes?: string
    birthDate?: string
    allergies?: string[]
    preferences?: {
      stylist?: string
      timeSlots?: string[]
      services?: string[]
    }
  }

  // Service Details
  service: {
    id: string
    name: string
    category: string
    duration: number
    basePrice: number
    finalPrice: number
    addOns: Array<{
      name: string
      price: number
      duration: number
    }>
    products?: Array<{
      name: string
      brand: string
      cost: number
    }>
  }

  // Scheduling
  appointmentDate: string
  appointmentTime: string
  endTime: string
  duration: number
  bufferTime?: number
  isRecurring?: boolean
  recurringDetails?: {
    frequency: 'weekly' | 'biweekly' | 'monthly'
    endDate?: string
    remainingSessions: number
  }

  // Status & Payment
  status: 'pending_confirmation' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
  paymentStatus: 'pending' | 'deposit_paid' | 'fully_paid' | 'refunded' | 'disputed'
  paymentMethod?: string
  depositAmount?: number
  totalAmount: number
  tip?: number

  // Location & Setup
  location: {
    type: 'salon' | 'client_home' | 'mobile'
    address?: string
    coordinates?: { lat: number; lng: number }
    parkingInfo?: string
    accessInstructions?: string
  }

  // Communication & Notes
  clientNotes?: string
  stylistNotes?: string
  internalNotes?: string
  specialRequests?: string[]
  consultationNotes?: string

  // Before/After Documentation
  beforePhotos?: string[]
  afterPhotos?: string[]
  processPhotos?: string[]
  clientApprovalForPhotos?: boolean

  // Experience & Follow-up
  musicPreference?: string
  refreshmentPreference?: string
  clientSatisfaction?: number
  followUpSent?: boolean
  reviewRequested?: boolean
  nextAppointmentSuggested?: boolean

  // Business Intelligence
  acquisitionSource?: 'instagram' | 'referral' | 'google' | 'walk_in' | 'repeat'
  marketingCampaign?: string
  seasonalDemand?: 'high' | 'medium' | 'low'
  aphroditeRecommendations?: string[]

  // Timestamps
  createdAt: string
  updatedAt: string
  confirmedAt?: string
  completedAt?: string
  lastContactAt?: string

  // Cancellation & Changes
  cancellationReason?: string
  cancellationPolicy?: {
    deadline: number // hours before appointment
    refundPercentage: number
    feeAmount: number
  }
  rescheduleHistory?: Array<{
    originalDate: string
    originalTime: string
    newDate: string
    newTime: string
    reason: string
    timestamp: string
  }>
}

interface BookingFilters {
  status: string[]
  dateRange: { start: string; end: string }
  clientType: 'all' | 'new' | 'returning' | 'vip'
  serviceCategory: string
  paymentStatus: string
  location: string
  search: string
}

interface QuickAction {
  id: string
  label: string
  action: (booking: StylistBooking) => void
  icon: React.ComponentType<any>
  color: string
  condition?: (booking: StylistBooking) => boolean
}

export default function BookingManagement() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [bookings, setBookings] = useState<StylistBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<StylistBooking | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [activeView, setActiveView] = useState<'list' | 'calendar' | 'timeline'>('list')
  const [filters, setFilters] = useState<BookingFilters>({
    status: [],
    dateRange: { start: '', end: '' },
    clientType: 'all',
    serviceCategory: '',
    paymentStatus: '',
    location: '',
    search: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedBookings, setSelectedBookings] = useState<string[]>([])

  // Map backend booking status to frontend status
  const mapBookingStatus = (backendStatus: string): string => {
    const statusMap: Record<string, string> = {
      'PENDING': 'pending_confirmation',
      'VERIFY_ACCEPTANCE': 'pending_confirmation',
      'CONFIRMED': 'confirmed',
      'IN_PROGRESS': 'in_progress',
      'COMPLETED': 'completed',
      'CANCELLED': 'cancelled',
      'NO_SHOW': 'no_show',
      'EXPIRED': 'cancelled'
    }
    return statusMap[backendStatus] || 'pending_confirmation'
  }

  // Map backend status to payment status
  const mapPaymentStatus = (backendStatus: string): string => {
    if (backendStatus === 'COMPLETED') return 'fully_paid'
    if (backendStatus === 'CONFIRMED') return 'deposit_paid'
    return 'pending'
  }

  useEffect(() => {
    loadBookings()
  }, [filters])

  const loadBookings = async () => {
    try {
      setLoading(true)

      // ✅ REAL API CALL: Fetch bookings from backend
      const apiClient = (await import('../../services/api')).apiClient
      const response = await apiClient.get('/api/stylist/bookings')

      if (response.success && response.data && response.data.bookings) {
        // Transform backend data to frontend format
        const transformedBookings: StylistBooking[] = response.data.bookings.map((booking: any) => ({
          id: booking.id.toString(),
          clientId: booking.client_id?.toString() || '',
          client: {
            firstName: booking.client_first_name || '',
            lastName: booking.client_last_name || '',
            email: booking.client_email || '',
            phone: booking.client_phone || '',
            avatar: booking.client_avatar,
            isNewClient: false,
            totalBookings: 0,
            preferredCommunication: 'whatsapp' as const
          },
          service: {
            id: booking.service_id?.toString() || '',
            name: booking.service_name || 'Service',
            category: booking.service_category || 'Other',
            duration: booking.duration_minutes || 60,
            basePrice: parseFloat(booking.total_price || 0),
            finalPrice: parseFloat(booking.total_price || 0),
            addOns: []
          },
          appointmentDate: booking.booking_date,
          appointmentTime: booking.booking_time?.substring(0, 5) || '',
          endTime: '',
          duration: booking.duration_minutes || 60,
          status: mapBookingStatus(booking.status),
          paymentStatus: mapPaymentStatus(booking.status),
          totalAmount: parseFloat(booking.total_price || 0),
          location: {
            type: 'salon',
            address: ''
          },
          clientNotes: booking.notes || '',
          stylistNotes: booking.stylist_notes || '',
          createdAt: booking.created_at,
          updatedAt: booking.updated_at
        }))

        setBookings(transformedBookings)
        return
      }

      // Fallback to mock data if API fails
      const mockBookings: StylistBooking[] = [
        {
          id: '1',
          clientId: 'client-1',
          client: {
            firstName: 'María',
            lastName: 'González',
            email: 'maria.gonzalez@email.com',
            phone: '+52 55 1234 5678',
            avatar: '',
            isNewClient: false,
            totalBookings: 8,
            averageRating: 4.9,
            lastBooking: '2024-11-15',
            preferredCommunication: 'whatsapp',
            notes: 'Prefiere citas por la mañana. Alérgica al amoníaco.',
            allergies: ['Amoníaco', 'PPD'],
            preferences: {
              timeSlots: ['9:00', '10:00', '11:00'],
              services: ['Coloración', 'Corte']
            }
          },
          service: {
            id: 'service-1',
            name: 'Coloración + Corte',
            category: 'Coloración',
            duration: 180,
            basePrice: 1500,
            finalPrice: 1650,
            addOns: [
              { name: 'Tratamiento Profundo', price: 150, duration: 30 }
            ],
            products: [
              { name: 'Tinte L\'Oreal', brand: 'L\'Oreal', cost: 45 },
              { name: 'Revelador', brand: 'L\'Oreal', cost: 25 }
            ]
          },
          appointmentDate: '2024-12-28',
          appointmentTime: '10:00',
          endTime: '13:00',
          duration: 180,
          bufferTime: 15,
          status: 'confirmed',
          paymentStatus: 'deposit_paid',
          paymentMethod: 'card',
          depositAmount: 500,
          totalAmount: 1650,
          location: {
            type: 'salon',
            address: 'Av. Roma 123, Roma Norte, CDMX',
            parkingInfo: 'Estacionamiento gratuito disponible',
            accessInstructions: 'Segundo piso, puerta 205'
          },
          clientNotes: 'Quiero un cambio sutil, no muy drástico. Me gusta el rubio miel.',
          stylistNotes: 'Cliente regular, le gusta charlar. Siempre llega 10 min antes.',
          specialRequests: ['Música relajante', 'Café con leche'],
          clientApprovalForPhotos: true,
          musicPreference: 'Pop en español',
          refreshmentPreference: 'Café con leche',
          acquisitionSource: 'referral',
          createdAt: '2024-12-15T09:30:00Z',
          updatedAt: '2024-12-15T09:30:00Z',
          confirmedAt: '2024-12-15T10:15:00Z',
          lastContactAt: '2024-12-20T14:20:00Z',
          aphroditeRecommendations: [
            'Sugerir tratamiento de keratina para próxima cita',
            'Cliente ideal para referir servicios de extensiones'
          ]
        },
        {
          id: '2',
          clientId: 'client-2',
          client: {
            firstName: 'Ana',
            lastName: 'Martínez',
            email: 'ana.martinez@email.com',
            phone: '+52 55 9876 5432',
            isNewClient: true,
            totalBookings: 1,
            preferredCommunication: 'sms',
            notes: 'Primera cita, encontró en Instagram.'
          },
          service: {
            id: 'service-2',
            name: 'Corte y Peinado',
            category: 'Corte',
            duration: 90,
            basePrice: 800,
            finalPrice: 800,
            addOns: []
          },
          appointmentDate: '2024-12-28',
          appointmentTime: '15:30',
          endTime: '17:00',
          duration: 90,
          status: 'pending_confirmation',
          paymentStatus: 'pending',
          totalAmount: 800,
          location: {
            type: 'salon',
            address: 'Av. Roma 123, Roma Norte, CDMX'
          },
          clientNotes: 'Primera vez, nerviosa. Quiere algo moderno pero conservador.',
          acquisitionSource: 'instagram',
          createdAt: '2024-12-20T16:45:00Z',
          updatedAt: '2024-12-20T16:45:00Z'
        },
        {
          id: '3',
          clientId: 'client-3',
          client: {
            firstName: 'Carmen',
            lastName: 'López',
            email: 'carmen.lopez@email.com',
            phone: '+52 55 5555 1234',
            isNewClient: false,
            totalBookings: 15,
            averageRating: 5.0,
            preferredCommunication: 'whatsapp'
          },
          service: {
            id: 'service-3',
            name: 'Tratamiento de Keratina',
            category: 'Tratamientos',
            duration: 240,
            basePrice: 2200,
            finalPrice: 2200,
            addOns: []
          },
          appointmentDate: '2024-12-30',
          appointmentTime: '09:00',
          endTime: '13:00',
          duration: 240,
          status: 'completed',
          paymentStatus: 'fully_paid',
          totalAmount: 2200,
          tip: 300,
          location: {
            type: 'salon',
            address: 'Av. Roma 123, Roma Norte, CDMX'
          },
          clientSatisfaction: 5,
          followUpSent: true,
          nextAppointmentSuggested: true,
          completedAt: '2024-12-30T13:00:00Z',
          afterPhotos: ['/photos/after1.jpg', '/photos/after2.jpg'],
          createdAt: '2024-12-25T11:20:00Z',
          updatedAt: '2024-12-30T13:30:00Z'
        }
      ]

      setBookings(mockBookings)
    } catch (error) {
      toast.error(t('stylist.messages.bookings.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending_confirmation':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-purple-100 text-purple-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'no_show':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // API action handlers
  const handleConfirmBooking = async (bookingId: string) => {
    try {
      const apiClient = (await import('../../services/api')).apiClient
      const response = await apiClient.patch(`/api/stylist/bookings/${bookingId}/confirm`)

      if (response.success) {
        toast.success(t('stylist.messages.bookings.confirmSuccess'))
        await loadBookings() // Refresh the list
      } else {
        toast.error(response.message || t('stylist.messages.bookings.confirmError'))
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('stylist.messages.bookings.confirmError'))
    }
  }

  const handleCancelBooking = async (bookingId: string, reason: string = 'Cancelado por el estilista') => {
    try {
      const apiClient = (await import('../../services/api')).apiClient
      const response = await apiClient.patch(`/api/stylist/bookings/${bookingId}/cancel`, { reason })

      if (response.success) {
        toast.success(t('stylist.messages.bookings.cancelSuccess'))
        await loadBookings() // Refresh the list
      } else {
        toast.error(response.message || t('stylist.messages.bookings.cancelError'))
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('stylist.messages.bookings.cancelError'))
    }
  }

  const handleRescheduleBooking = async (bookingId: string, newDate: string, newTime: string, reason?: string) => {
    try {
      const apiClient = (await import('../../services/api')).apiClient
      const response = await apiClient.patch(`/api/stylist/bookings/${bookingId}/reschedule`, {
        newDate,
        newTime,
        reason
      })

      if (response.success) {
        toast.success(t('stylist.messages.bookings.rescheduleSuccess'))
        await loadBookings() // Refresh the list
      } else {
        toast.error(response.message || t('stylist.messages.bookings.rescheduleError'))
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('stylist.messages.bookings.rescheduleError'))
    }
  }

  const handleCompleteBooking = async (bookingId: string, notes?: string) => {
    try {
      const apiClient = (await import('../../services/api')).apiClient
      const response = await apiClient.post(`/api/stylist/bookings/${bookingId}/complete`, { notes })

      if (response.success) {
        toast.success(t('stylist.messages.bookings.completeSuccess'))
        await loadBookings() // Refresh the list
      } else {
        toast.error(response.message || t('stylist.messages.bookings.completeError'))
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('stylist.messages.bookings.completeError'))
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return CheckCircleIcon
      case 'pending_confirmation':
        return ClockIcon
      case 'in_progress':
        return ArrowPathIcon
      case 'completed':
        return CheckCircleSolidIcon
      case 'cancelled':
        return XCircleIcon
      case 'no_show':
        return ExclamationTriangleIcon
      default:
        return ClockIcon
    }
  }

  const getStatusText = (status: string) => {
    const statusTexts = {
      'pending_confirmation': 'Pendiente',
      'confirmed': 'Confirmada',
      'in_progress': 'En Progreso',
      'completed': 'Completada',
      'cancelled': 'Cancelada',
      'no_show': 'No Se Presentó',
      'rescheduled': 'Reprogramada'
    }
    return statusTexts[status as keyof typeof statusTexts] || status
  }

  const quickActions: QuickAction[] = [
    {
      id: 'confirm',
      label: 'Confirmar',
      action: (booking) => {
        // ✅ REAL API: Confirm booking
        handleConfirmBooking(booking.id)
      },
      icon: CheckCircleIcon,
      color: 'text-green-600 hover:bg-green-50',
      condition: (booking) => booking.status === 'pending_confirmation'
    },
    {
      id: 'contact',
      label: 'Contactar',
      action: (booking) => {
        // Handle contact
        if (booking.client.preferredCommunication === 'whatsapp') {
          window.open(`https://wa.me/${booking.client.phone}`, '_blank')
        }
      },
      icon: ChatBubbleLeftRightIcon,
      color: 'text-blue-600 hover:bg-blue-50'
    },
    {
      id: 'reschedule',
      label: 'Reprogramar',
      action: (booking) => {
        // ✅ REAL API: Reschedule booking
        // Prompt for new date and time
        const newDate = prompt('Nueva fecha (YYYY-MM-DD):', booking.appointmentDate)
        if (!newDate) return

        const newTime = prompt('Nueva hora (HH:MM):', booking.appointmentTime)
        if (!newTime) return

        const reason = prompt('Razón (opcional):') || undefined

        handleRescheduleBooking(booking.id, newDate, newTime, reason)
      },
      icon: CalendarDaysIcon,
      color: 'text-orange-600 hover:bg-orange-50',
      condition: (booking) => ['pending_confirmation', 'confirmed'].includes(booking.status)
    },
    {
      id: 'start-service',
      label: 'Iniciar Servicio',
      action: (booking) => {
        // Note: Backend doesn't have a separate "start" endpoint
        // For now, just show a toast. Can add status update later if needed.
        toast(t('stylist.messages.bookings.markCompleteInfo'))
      },
      icon: ArrowPathIcon,
      color: 'text-purple-600 hover:bg-purple-50',
      condition: (booking) => booking.status === 'confirmed'
    },
    {
      id: 'complete',
      label: 'Completar',
      action: (booking) => {
        // ✅ REAL API: Complete booking
        const notes = prompt('Notas del servicio (opcional):') || undefined
        if (window.confirm('¿Marcar esta cita como completada?')) {
          handleCompleteBooking(booking.id, notes)
        }
      },
      icon: CheckCircleSolidIcon,
      color: 'text-green-600 hover:bg-green-50',
      condition: (booking) => booking.status === 'in_progress' || booking.status === 'confirmed'
    },
    {
      id: 'add-photos',
      label: 'Fotos',
      action: (booking) => {
        // Handle photo upload
        toast(t('stylist.messages.bookings.photosInDevelopment'))
      },
      icon: CameraIcon,
      color: 'text-pink-600 hover:bg-pink-50',
      condition: (booking) => ['in_progress', 'completed'].includes(booking.status)
    },
    {
      id: 'cancel',
      label: 'Cancelar',
      action: (booking) => {
        // ✅ REAL API: Cancel booking
        const reason = prompt('Razón de cancelación:', 'Cancelado por el estilista')
        if (!reason) return

        if (window.confirm('¿Estás seguro de cancelar esta cita? Esta acción no se puede deshacer.')) {
          handleCancelBooking(booking.id, reason)
        }
      },
      icon: XCircleIcon,
      color: 'text-red-600 hover:bg-red-50',
      condition: (booking) => ['pending_confirmation', 'confirmed'].includes(booking.status)
    }
  ]

  const handleBulkAction = (action: string) => {
    toast(`Acción "${action}" aplicada a ${selectedBookings.length} citas`)
    setSelectedBookings([])
  }

  const formatTime = (time: string) => {
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(`2000-01-01T${time}`))
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(new Date(dateString))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-responsive py-4 md:py-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <h1 className="text-xl md:text-2xl font-serif font-bold text-gray-900">
                Gestión de Citas
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                Administra todas tus reservas y clientes
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-secondary text-sm flex items-center space-x-2 flex-shrink-0 rounded-full"
              >
                <FunnelIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Filtros</span>
                <span className="sm:hidden">Filtros</span>
              </button>

              <div className="hidden sm:flex items-center bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => setActiveView('list')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    activeView === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Lista
                </button>
                <button
                  onClick={() => setActiveView('calendar')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    activeView === 'calendar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Calendario
                </button>
                <button
                  onClick={() => setActiveView('timeline')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    activeView === 'timeline' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Timeline
                </button>
              </div>

              <button className="btn btn-primary text-sm flex items-center space-x-2 flex-shrink-0 rounded-full">
                <PlusIcon className="h-5 w-5" />
                <span>Nueva</span>
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-4 md:mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            <div className="bg-gray-50 rounded-full p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">8</p>
              <p className="text-xs text-gray-500">Hoy</p>
            </div>
            <div className="bg-gray-50 rounded-full p-3 text-center">
              <p className="text-2xl font-bold text-green-600">32</p>
              <p className="text-xs text-gray-500">Esta Semana</p>
            </div>
            <div className="bg-gray-50 rounded-full p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">3</p>
              <p className="text-xs text-gray-500">Pendientes</p>
            </div>
            <div className="bg-gray-50 rounded-full p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">156</p>
              <p className="text-xs text-gray-500">Este Mes</p>
            </div>
            <div className="bg-gray-50 rounded-full p-3 text-center">
              <p className="text-2xl font-bold text-pink-600">94%</p>
              <p className="text-xs text-gray-500">Ocupación</p>
            </div>
            <div className="bg-gray-50 rounded-full p-3 text-center">
              <p className="text-2xl font-bold text-indigo-600">$28.5K</p>
              <p className="text-xs text-gray-500">Ingresos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border-b"
          >
            <div className="container-responsive py-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Estado</label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-full">
                    <option value="">Todos</option>
                    <option value="pending">Pendientes</option>
                    <option value="confirmed">Confirmadas</option>
                    <option value="completed">Completadas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo Cliente</label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-full">
                    <option value="all">Todos</option>
                    <option value="new">Nuevos</option>
                    <option value="returning">Recurrentes</option>
                    <option value="vip">VIP</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Servicio</label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-full">
                    <option value="">Todos</option>
                    <option value="coloracion">Coloración</option>
                    <option value="corte">Corte</option>
                    <option value="tratamientos">Tratamientos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Desde</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fecha Hasta</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Buscar</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Cliente, servicio..."
                      className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container-responsive py-6">
        {/* Bulk Actions */}
        {selectedBookings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-full p-4 mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-blue-900">
                  {selectedBookings.length} cita(s) seleccionada(s)
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleBulkAction('confirm')}
                  className="btn btn-sm btn-primary flex-shrink-0 rounded-full"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => handleBulkAction('contact')}
                  className="btn btn-sm btn-secondary flex-shrink-0 rounded-full"
                >
                  Contactar
                </button>
                <button
                  onClick={() => setSelectedBookings([])}
                  className="btn btn-sm btn-outline rounded-full"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Bookings List */}
        <div className="space-y-4">
          {bookings.map((booking) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card hover:shadow-lg transition-shadow duration-200"
            >
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Selection Checkbox */}
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={selectedBookings.includes(booking.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBookings([...selectedBookings, booking.id])
                          } else {
                            setSelectedBookings(selectedBookings.filter(id => id !== booking.id))
                          }
                        }}
                        className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                      />
                    </div>

                    {/* Client Avatar */}
                    <div className="flex-shrink-0">
                      {booking.client.avatar ? (
                        <img loading="lazy"
                          src={booking.client.avatar}
                          alt={`${booking.client.firstName} ${booking.client.lastName}`}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-white" />
                        </div>
                      )}
                      {booking.client.isNewClient && (
                        <div className="absolute -mt-2 -ml-1">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Nuevo
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Booking Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {booking.client.firstName} {booking.client.lastName}
                        </h3>
                        {booking.client.averageRating && (
                          <div className="flex items-center space-x-1">
                            <StarSolidIcon className="h-4 w-4 text-yellow-400" />
                            <span className="text-sm text-gray-600">{booking.client.averageRating}</span>
                          </div>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {getStatusText(booking.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(booking.appointmentDate)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ClockIcon className="h-4 w-4 text-gray-400" />
                          <span>{formatTime(booking.appointmentTime)} - {formatTime(booking.endTime)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                          <span>${booking.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="mt-2">
                        <h4 className="font-medium text-gray-900">{booking.service.name}</h4>
                        <p className="text-sm text-gray-600">
                          {booking.service.duration} min • {booking.service.category}
                        </p>
                      </div>

                      {/* Client Notes */}
                      {booking.clientNotes && (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-full">
                          <p className="text-sm text-blue-800">
                            <strong>Notas del cliente:</strong> {booking.clientNotes}
                          </p>
                        </div>
                      )}

                      {/* Special Requests */}
                      {booking.specialRequests && booking.specialRequests.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {booking.specialRequests.map((request, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700"
                            >
                              <GiftIcon className="h-3 w-3 mr-1" />
                              {request}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Aphrodite Recommendations */}
                      {booking.aphroditeRecommendations && booking.aphroditeRecommendations.length > 0 && (
                        <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded-full">
                          <div className="flex items-start space-x-2">
                            <SparklesIcon className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-purple-900 mb-1">Sugerencias de Aphrodite:</p>
                              <ul className="text-xs text-purple-800 space-y-1">
                                {booking.aphroditeRecommendations.map((rec, index) => (
                                  <li key={index}>• {rec}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2">
                    {quickActions
                      .filter(action => !action.condition || action.condition(booking))
                      .map((action) => (
                        <button
                          key={action.id}
                          onClick={() => action.action(booking)}
                          className={`p-2 rounded-full transition-colors ${action.color}`}
                          title={action.label}
                        >
                          <action.icon className="h-5 w-5" />
                        </button>
                      ))}

                    {/* More Options */}
                    <div className="relative">
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full">
                        <AdjustmentsHorizontalIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Info Footer */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>Cliente #{booking.client.totalBookings}</span>
                    <span>•</span>
                    <span>Fuente: {booking.acquisitionSource || 'No especificada'}</span>
                    {booking.location.type !== 'salon' && (
                      <>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <MapPinIcon className="h-3 w-3" />
                          <span className="capitalize">{booking.location.type}</span>
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {booking.client.preferredCommunication === 'whatsapp' && (
                      <DevicePhoneMobileIcon className="h-4 w-4 text-green-500" title="WhatsApp" />
                    )}
                    {booking.clientApprovalForPhotos && (
                      <CameraIcon className="h-4 w-4 text-blue-500" title="Autoriza fotos" />
                    )}
                    {booking.client.allergies && booking.client.allergies.length > 0 && (
                      <ExclamationTriangleIcon className="h-4 w-4 text-orange-500" title="Tiene alergias" />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {bookings.length === 0 && (
            <div className="card">
              <div className="card-body text-center py-12">
                <CalendarDaysIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay citas programadas
                </h3>
                <p className="text-gray-600 mb-6">
                  Cuando tengas reservas aparecerán aquí
                </p>
                <button className="btn btn-primary rounded-full">
                  Crear Primera Cita
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}