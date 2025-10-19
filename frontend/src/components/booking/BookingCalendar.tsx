import { useState, useEffect, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay, addDays, startOfDay, endOfDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import axios from 'axios'
import toast from 'react-hot-toast'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendar-theme.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'en-US': enUS },
})

interface BookingEvent {
  id: number
  title: string
  start: Date
  end: Date
  resource: {
    bookingId: number
    clientName: string
    serviceName: string
    status: string
    price: number
    type: 'booking' | 'available' | 'blocked'
  }
}

interface BookingCalendarProps {
  stylistId: number
  onSelectSlot?: (start: Date, end: Date) => void
  onSelectEvent?: (event: BookingEvent) => void
  showAvailability?: boolean
  editable?: boolean
}

export default function BookingCalendar({
  stylistId,
  onSelectSlot,
  onSelectEvent,
  showAvailability = true,
  editable = false
}: BookingCalendarProps) {
  const [events, setEvents] = useState<BookingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<View>('week')
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetchBookingsAndAvailability()
  }, [stylistId, currentDate, currentView])

  const fetchBookingsAndAvailability = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')

      // Calculate date range based on current view
      const { startDate, endDate } = getDateRange()

      // Fetch bookings
      const bookingsResponse = await axios.get(
        `${API_URL}/api/bookings/stylist/${stylistId}/bookings`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          },
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      // Fetch availability if needed
      let availabilitySlots: BookingEvent[] = []
      if (showAvailability) {
        const availResponse = await axios.get(
          `${API_URL}/api/bookings/stylists/${stylistId}/availability`,
          {
            params: {
              date: format(currentDate, 'yyyy-MM-dd')
            },
            headers: { Authorization: `Bearer ${token}` }
          }
        )

        if (availResponse.data.success && availResponse.data.availability) {
          availabilitySlots = formatAvailabilitySlots(availResponse.data.availability)
        }
      }

      // Format bookings
      const bookingEvents = formatBookings(bookingsResponse.data.bookings || [])

      // Combine events
      setEvents([...bookingEvents, ...availabilitySlots])
    } catch (error: any) {
      console.error('Failed to fetch calendar data:', error)
      toast.error(error.response?.data?.message || 'Failed to load calendar')
    } finally {
      setLoading(false)
    }
  }

  const getDateRange = () => {
    let startDate: Date
    let endDate: Date

    switch (currentView) {
      case 'day':
        startDate = startOfDay(currentDate)
        endDate = endOfDay(currentDate)
        break
      case 'week':
        startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
        endDate = addDays(startDate, 6)
        break
      case 'month':
        startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
        endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
        break
      default:
        startDate = startOfWeek(currentDate, { weekStartsOn: 1 })
        endDate = addDays(startDate, 6)
    }

    return { startDate, endDate }
  }

  const formatBookings = (bookings: any[]): BookingEvent[] => {
    return bookings.map((booking) => {
      const startDate = new Date(booking.booking_date)
      const [hours, minutes] = booking.start_time.split(':')
      startDate.setHours(parseInt(hours), parseInt(minutes), 0)

      const endDate = new Date(booking.booking_date)
      const [endHours, endMinutes] = booking.end_time.split(':')
      endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0)

      return {
        id: booking.id,
        title: `${booking.client_name || 'Client'} - ${booking.service_name}`,
        start: startDate,
        end: endDate,
        resource: {
          bookingId: booking.id,
          clientName: booking.client_name,
          serviceName: booking.service_name,
          status: booking.status,
          price: booking.total_price,
          type: 'booking'
        }
      }
    })
  }

  const formatAvailabilitySlots = (availability: any): BookingEvent[] => {
    const slots: BookingEvent[] = []

    availability.forEach((slot: any) => {
      const startDate = new Date(slot.date)
      const [hours, minutes] = slot.start_time.split(':')
      startDate.setHours(parseInt(hours), parseInt(minutes), 0)

      const endDate = new Date(slot.date)
      const [endHours, endMinutes] = slot.end_time.split(':')
      endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0)

      slots.push({
        id: -Math.random(), // Negative ID for availability slots
        title: 'Available',
        start: startDate,
        end: endDate,
        resource: {
          bookingId: 0,
          clientName: '',
          serviceName: '',
          status: 'AVAILABLE',
          price: 0,
          type: 'available'
        }
      })
    })

    return slots
  }

  const handleSelectSlot = useCallback((slotInfo: { start: Date; end: Date }) => {
    if (editable && onSelectSlot) {
      onSelectSlot(slotInfo.start, slotInfo.end)
    }
  }, [editable, onSelectSlot])

  const handleSelectEvent = useCallback((event: BookingEvent) => {
    if (onSelectEvent) {
      onSelectEvent(event)
    }
  }, [onSelectEvent])

  const eventStyleGetter = (event: BookingEvent) => {
    let backgroundColor = '#6366f1' // Default blue
    let borderColor = '#4f46e5'

    switch (event.resource.type) {
      case 'booking':
        switch (event.resource.status) {
          case 'PENDING':
            backgroundColor = '#f59e0b' // Yellow
            borderColor = '#d97706'
            break
          case 'CONFIRMED':
            backgroundColor = '#10b981' // Green
            borderColor = '#059669'
            break
          case 'COMPLETED':
            backgroundColor = '#3b82f6' // Blue
            borderColor = '#2563eb'
            break
          case 'CANCELLED':
            backgroundColor = '#ef4444' // Red
            borderColor = '#dc2626'
            break
        }
        break
      case 'available':
        backgroundColor = '#d1fae5' // Light green
        borderColor = '#10b981'
        break
      case 'blocked':
        backgroundColor = '#f3f4f6' // Gray
        borderColor = '#9ca3af'
        break
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderRadius: '8px',
        color: event.resource.type === 'available' ? '#065f46' : '#ffffff',
        fontWeight: '500',
        fontSize: '0.875rem',
        padding: '4px 8px'
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-3xl">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="booking-calendar bg-white rounded-3xl shadow-lg p-6">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 700 }}
        view={currentView}
        onView={setCurrentView}
        date={currentDate}
        onNavigate={setCurrentDate}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        selectable={editable}
        step={30}
        timeslots={2}
        defaultView="week"
        views={['month', 'week', 'day']}
        min={new Date(0, 0, 0, 6, 0, 0)} // 6 AM
        max={new Date(0, 0, 0, 22, 0, 0)} // 10 PM
        formats={{
          timeGutterFormat: 'h:mm a',
          eventTimeRangeFormat: ({ start, end }) =>
            `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`,
          agendaTimeRangeFormat: ({ start, end }) =>
            `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`,
        }}
      />
    </div>
  )
}

// Category color mapping
const CATEGORY_COLORS: { [key: string]: { bg: string; border: string } } = {
  'Hair': { bg: '#ec4899', border: '#db2777' },
  'Nails': { bg: '#9333ea', border: '#7e22ce' },
  'Skincare': { bg: '#3b82f6', border: '#2563eb' },
  'Makeup': { bg: '#f59e0b', border: '#d97706' },
  'Massage': { bg: '#10b981', border: '#059669' },
  'default': { bg: '#6b7280', border: '#4b5563' }
}
