import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import BookingCalendar from '../../components/booking/BookingCalendar'
import { useAuthStore } from '../../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || ''

interface Appointment {
  id: number
  client_name: string
  client_email: string
  service_name: string
  appointment_date: string
  duration_minutes: number
  total_price: number
  status: string
  notes?: string
}

export default function BusinessCalendar() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  useEffect(() => {
    fetchAppointments()
  }, [currentDate, viewMode])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')

      // Calculate date range based on view mode
      const startDate = getStartDate()
      const endDate = getEndDate()

      const response = await axios.get(`${API_URL}/api/bookings/stylist/appointments`, {
        params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() },
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setAppointments(response.data.appointments || [])
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error)
      toast.error('Failed to load appointments')
    } finally {
      setLoading(false)
    }
  }

  const getStartDate = () => {
    const date = new Date(currentDate)
    if (viewMode === 'day') {
      date.setHours(0, 0, 0, 0)
    } else if (viewMode === 'week') {
      const day = date.getDay()
      date.setDate(date.getDate() - day)
      date.setHours(0, 0, 0, 0)
    } else {
      date.setDate(1)
      date.setHours(0, 0, 0, 0)
    }
    return date
  }

  const getEndDate = () => {
    const date = new Date(currentDate)
    if (viewMode === 'day') {
      date.setHours(23, 59, 59, 999)
    } else if (viewMode === 'week') {
      const day = date.getDay()
      date.setDate(date.getDate() + (6 - day))
      date.setHours(23, 59, 59, 999)
    } else {
      date.setMonth(date.getMonth() + 1)
      date.setDate(0)
      date.setHours(23, 59, 59, 999)
    }
    return date
  }

  const navigatePrevious = () => {
    const date = new Date(currentDate)
    if (viewMode === 'day') {
      date.setDate(date.getDate() - 1)
    } else if (viewMode === 'week') {
      date.setDate(date.getDate() - 7)
    } else {
      date.setMonth(date.getMonth() - 1)
    }
    setCurrentDate(date)
  }

  const navigateNext = () => {
    const date = new Date(currentDate)
    if (viewMode === 'day') {
      date.setDate(date.getDate() + 1)
    } else if (viewMode === 'week') {
      date.setDate(date.getDate() + 7)
    } else {
      date.setMonth(date.getMonth() + 1)
    }
    setCurrentDate(date)
  }

  const navigateToday = () => {
    setCurrentDate(new Date())
  }

  const updateAppointmentStatus = async (appointmentId: number, status: string) => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await axios.put(
        `${API_URL}/api/bookings/${appointmentId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        toast.success(`Appointment ${status.toLowerCase()}`)
        fetchAppointments()
        setSelectedAppointment(null)
      }
    } catch (error: any) {
      console.error('Failed to update appointment:', error)
      toast.error(error.response?.data?.message || 'Failed to update appointment')
    }
  }

  const getDateRangeText = () => {
    const start = getStartDate()
    const end = getEndDate()

    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    } else if (viewMode === 'week') {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    } else {
      return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    }
  }

  const groupAppointmentsByDay = () => {
    const grouped: { [key: string]: Appointment[] } = {}

    appointments.forEach((apt) => {
      const date = new Date(apt.appointment_date)
      const key = date.toISOString().split('T')[0]
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(apt)
    })

    // Sort appointments within each day
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())
    })

    return grouped
  }

  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointment_date)
    const today = new Date()
    return aptDate.toDateString() === today.toDateString()
  })

  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointment_date)
    const today = new Date()
    return aptDate > today
  }).slice(0, 5)

  const { user } = useAuthStore()

  if (!user?.stylist_id) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Stylist profile not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Appointment Calendar</h1>
        <p className="text-gray-600">Manage your bookings and schedule</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
              <CalendarDaysIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Today</p>
              <p className="text-3xl font-bold text-gray-900">{todayAppointments.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <ClockIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Upcoming</p>
              <p className="text-3xl font-bold text-gray-900">{upcomingAppointments.length}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
              <CurrencyDollarIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-3xl font-bold text-gray-900">
                ${appointments.reduce((sum, apt) => sum + apt.total_price, 0).toFixed(0)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Calendar View */}
      <BookingCalendar
        stylistId={user.stylist_id}
        showAvailability={true}
        onSelectEvent={(event) => {
          if (event.resource.type === 'booking') {
            const appointment = appointments.find(apt => apt.id === event.resource.bookingId)
            if (appointment) {
              setSelectedAppointment(appointment)
            }
          }
        }}
      />

      {/* Appointments List */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Upcoming Appointments</h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDaysIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No appointments for this period</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupAppointmentsByDay()).map(([date, dayAppointments]) => (
              <div key={date}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <div className="space-y-3">
                  {dayAppointments.map((appointment) => (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      onClick={() => setSelectedAppointment(appointment)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Appointment Details</h2>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <XCircleIcon className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Client</p>
                <p className="text-lg font-semibold text-gray-900">{selectedAppointment.client_name}</p>
                <p className="text-sm text-gray-600">{selectedAppointment.client_email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Service</p>
                <p className="text-lg font-semibold text-gray-900">{selectedAppointment.service_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date & Time</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedAppointment.appointment_date).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-semibold text-gray-900">{selectedAppointment.duration_minutes} min</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="text-2xl font-bold text-gray-900">${selectedAppointment.total_price.toFixed(2)}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  selectedAppointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                  selectedAppointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  selectedAppointment.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedAppointment.status}
                </span>
              </div>

              {selectedAppointment.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-gray-900">{selectedAppointment.notes}</p>
                </div>
              )}

              {/* Action Buttons */}
              {selectedAppointment.status === 'PENDING' && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => updateAppointmentStatus(selectedAppointment.id, 'CONFIRMED')}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    Confirm
                  </button>
                  <button
                    onClick={() => updateAppointmentStatus(selectedAppointment.id, 'CANCELLED')}
                    className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <XCircleIcon className="h-5 w-5" />
                    Cancel
                  </button>
                </div>
              )}

              {selectedAppointment.status === 'CONFIRMED' && (
                <button
                  onClick={() => updateAppointmentStatus(selectedAppointment.id, 'COMPLETED')}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-full font-medium hover:shadow-lg transition-all"
                >
                  Mark as Completed
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

// Appointment Card Component
interface AppointmentCardProps {
  appointment: Appointment
  onClick: () => void
}

function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  const date = new Date(appointment.appointment_date)
  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
    COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200'
  }

  return (
    <div
      onClick={onClick}
      className={`border-2 rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all ${
        statusColors[appointment.status as keyof typeof statusColors]
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-lg">{appointment.client_name}</h4>
          <p className="text-sm text-gray-600">{appointment.service_name}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/50">
          {appointment.status}
        </span>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-700">
        <span className="flex items-center gap-1">
          <ClockIcon className="h-4 w-4" />
          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="flex items-center gap-1">
          <CurrencyDollarIcon className="h-4 w-4" />
          ${appointment.total_price.toFixed(2)}
        </span>
      </div>
    </div>
  )
}
