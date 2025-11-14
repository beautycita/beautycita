import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon as PendingIcon
} from '@heroicons/react/24/outline'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || ''

interface Booking {
  id: number
  client_name: string
  service_name: string
  appointment_date: string
  appointment_time: string
  status: string
  total_price: number
  duration: number
}

const STATUS_COLORS: { [key: string]: string } = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  CONFIRMED: 'bg-green-100 text-green-800 border-green-300',
  COMPLETED: 'bg-blue-100 text-blue-800 border-blue-300',
  CANCELLED: 'bg-red-100 text-red-800 border-red-300'
}

const STATUS_ICONS: { [key: string]: any } = {
  PENDING: PendingIcon,
  CONFIRMED: CheckCircleIcon,
  COMPLETED: CheckCircleIcon,
  CANCELLED: XCircleIcon
}

export default function BookingsCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  useEffect(() => {
    fetchBookings()
  }, [currentDate])

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token')
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1

      const response = await axios.get(
        `${API_URL}/api/bookings/month/${year}/${month}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setBookings(response.data.data || [])
    } catch (error: any) {
      console.error('Error fetching bookings:', error)
      toast.error('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek }
  }

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return bookings.filter(b => b.appointment_date === dateStr)
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const renderCalendar = () => {
    const days = []
    const totalSlots = Math.ceil((daysInMonth + startingDayOfWeek) / 7) * 7

    // Empty slots before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-gray-50" />)
    }

    // Actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      const dayBookings = getBookingsForDate(date)
      const isToday = new Date().toDateString() === date.toDateString()
      const isSelected = selectedDate?.toDateString() === date.toDateString()

      days.push(
        <motion.div
          key={day}
          whileHover={{ scale: 1.02 }}
          onClick={() => setSelectedDate(date)}
          className={`h-32 border border-gray-200 p-2 cursor-pointer transition-all ${
            isToday ? 'bg-purple-50 border-purple-300' : 'bg-white hover:bg-gray-50'
          } ${isSelected ? 'ring-2 ring-purple-500' : ''}`}
        >
          <div className="flex justify-between items-start mb-2">
            <span
              className={`text-sm font-semibold ${
                isToday ? 'bg-purple-600 text-white px-2 py-1 rounded-full' : 'text-gray-700'
              }`}
            >
              {day}
            </span>
            {dayBookings.length > 0 && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                {dayBookings.length}
              </span>
            )}
          </div>

          <div className="space-y-1">
            {dayBookings.slice(0, 2).map((booking) => {
              const Icon = STATUS_ICONS[booking.status]
              return (
                <div
                  key={booking.id}
                  className={`text-xs px-2 py-1 rounded border ${STATUS_COLORS[booking.status]} truncate`}
                >
                  <div className="flex items-center gap-1">
                    <Icon className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{booking.appointment_time.substring(0, 5)}</span>
                  </div>
                </div>
              )
            })}
            {dayBookings.length > 2 && (
              <div className="text-xs text-gray-500 px-2">+{dayBookings.length - 2} more</div>
            )}
          </div>
        </motion.div>
      )
    }

    // Empty slots after month ends
    const remaining = totalSlots - (daysInMonth + startingDayOfWeek)
    for (let i = 0; i < remaining; i++) {
      days.push(<div key={`empty-end-${i}`} className="h-32 bg-gray-50" />)
    }

    return days
  }

  const selectedDateBookings = selectedDate ? getBookingsForDate(selectedDate) : []

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bookings Calendar</h1>
          <p className="text-gray-600 mt-1">View and manage your appointments</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {/* Calendar Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex justify-between items-center">
                <button
                  onClick={previousMonth}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <ChevronLeftIcon className="w-6 h-6 text-white" />
                </button>
                <h2 className="text-xl font-bold text-white">{monthName}</h2>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <ChevronRightIcon className="w-6 h-6 text-white" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 bg-gray-100">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7">{renderCalendar()}</div>
            </div>
          </div>

          {/* Selected Date Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedDate ? selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric'
                }) : 'Select a date'}
              </h3>

              {selectedDateBookings.length === 0 ? (
                <p className="text-gray-500 text-sm">No bookings for this date</p>
              ) : (
                <div className="space-y-3">
                  {selectedDateBookings.map((booking) => {
                    const Icon = STATUS_ICONS[booking.status]
                    return (
                      <motion.div
                        key={booking.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-gray-200 rounded-3xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[booking.status]}`}>
                            <Icon className="w-4 h-4 inline mr-1" />
                            {booking.status}
                          </div>
                          <span className="text-lg font-bold text-gray-900">
                            ${booking.total_price}
                          </span>
                        </div>

                        <h4 className="font-semibold text-gray-900 mb-2">{booking.service_name}</h4>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            <span>{booking.client_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ClockIcon className="w-4 h-4" />
                            <span>{booking.appointment_time.substring(0, 5)} ({booking.duration} min)</span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
