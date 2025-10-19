import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  CopyIcon,
  CheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  SunIcon,
  MoonIcon,
  AdjustmentsHorizontalIcon,
  BellIcon,
  MapPinIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  SparklesIcon,
  LightBulbIcon,
  ArrowsUpDownIcon,
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CogIcon,
  BookmarkIcon,
  StarIcon,
  FireIcon,
  BeakerIcon
} from '@heroicons/react/24/outline'
import { CheckIcon as CheckSolidIcon } from '@heroicons/react/24/solid'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface TimeSlot {
  id: string
  start: string
  end: string
  isAvailable: boolean
  isBooked: boolean
  clientName?: string
  serviceName?: string
  serviceColor?: string
  notes?: string
  isRecurring?: boolean
  bufferTime?: number
  type: 'work' | 'break' | 'lunch' | 'blocked' | 'appointment'
}

interface DaySchedule {
  date: string
  dayName: string
  isWorkingDay: boolean
  workingHours: {
    start: string
    end: string
  }
  breaks: Array<{
    start: string
    end: string
    type: 'break' | 'lunch'
    title: string
  }>
  timeSlots: TimeSlot[]
  totalSlots: number
  bookedSlots: number
  availableSlots: number
  revenue: number
  notes?: string
  isHoliday?: boolean
  holidayName?: string
}

interface AvailabilityTemplate {
  id: string
  name: string
  description: string
  schedule: {
    [key: string]: {
      isWorkingDay: boolean
      workingHours: { start: string; end: string }
      breaks: Array<{ start: string; end: string; type: string; title: string }>
    }
  }
  isActive: boolean
  createdAt: string
}

interface RecurringAvailability {
  id: string
  dayOfWeek: number // 0 = Sunday, 1 = Monday, etc.
  startTime: string
  endTime: string
  serviceDuration: number
  bufferTime: number
  maxConcurrentBookings: number
  excludeDates: string[]
  validFrom: string
  validUntil?: string
  notes?: string
}

export default function AvailabilityCalendar() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'day'>('week')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [schedule, setSchedule] = useState<{ [key: string]: DaySchedule }>({})
  const [templates, setTemplates] = useState<AvailabilityTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showBulkEditModal, setShowBulkEditModal] = useState(false)
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null)
  const [aphroditeOptimizations, setAphroditeOptimizations] = useState<any[]>([])

  const [calendarSettings, setCalendarSettings] = useState({
    slotDuration: 30, // minutes
    bufferTime: 15, // minutes between appointments
    maxAdvanceBooking: 90, // days
    minAdvanceBooking: 2, // hours
    autoAccept: false,
    allowOverlap: false,
    workingHours: {
      start: '09:00',
      end: '18:00'
    },
    workingDays: [1, 2, 3, 4, 5], // Monday to Friday
    timeZone: 'America/Mexico_City',
    notifications: {
      newBooking: true,
      cancellation: true,
      reminder: true,
      timeBeforeReminder: 24 // hours
    }
  })

  useEffect(() => {
    loadScheduleData()
    loadAphroditeOptimizations()
  }, [currentDate, viewMode])

  const loadScheduleData = async () => {
    try {
      setLoading(true)
      // Mock comprehensive schedule data
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockSchedule: { [key: string]: DaySchedule } = {}

      // Generate 7 days of mock data
      for (let i = 0; i < 7; i++) {
        const date = new Date(currentDate)
        date.setDate(date.getDate() + i)
        const dateString = date.toISOString().split('T')[0]
        const dayName = date.toLocaleDateString('es-MX', { weekday: 'long' })

        const isWorkingDay = [1, 2, 3, 4, 5].includes(date.getDay()) // Monday to Friday
        const timeSlots: TimeSlot[] = []

        if (isWorkingDay) {
          // Generate time slots from 9 AM to 6 PM
          const startHour = 9
          const endHour = 18
          const slotDuration = 30 // minutes

          for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += slotDuration) {
              const start = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
              const endMinute = minute + slotDuration
              const endHourCalc = endMinute >= 60 ? hour + 1 : hour
              const endMinuteCalc = endMinute >= 60 ? endMinute - 60 : endMinute
              const end = `${endHourCalc.toString().padStart(2, '0')}:${endMinuteCalc.toString().padStart(2, '0')}`

              const isBooked = Math.random() > 0.7 // Random booking simulation
              const slotId = `${dateString}-${start}`

              timeSlots.push({
                id: slotId,
                start,
                end,
                isAvailable: !isBooked,
                isBooked,
                clientName: isBooked ? 'María González' : undefined,
                serviceName: isBooked ? 'Corte y Peinado' : undefined,
                serviceColor: isBooked ? 'bg-blue-100 text-blue-800' : undefined,
                type: isBooked ? 'appointment' : 'work',
                bufferTime: 15
              })
            }
          }

          // Add lunch break
          timeSlots.push({
            id: `${dateString}-lunch`,
            start: '13:00',
            end: '14:00',
            isAvailable: false,
            isBooked: false,
            type: 'lunch'
          })
        }

        mockSchedule[dateString] = {
          date: dateString,
          dayName,
          isWorkingDay,
          workingHours: { start: '09:00', end: '18:00' },
          breaks: [
            { start: '13:00', end: '14:00', type: 'lunch', title: 'Almuerzo' }
          ],
          timeSlots,
          totalSlots: timeSlots.length,
          bookedSlots: timeSlots.filter(slot => slot.isBooked).length,
          availableSlots: timeSlots.filter(slot => slot.isAvailable).length,
          revenue: timeSlots.filter(slot => slot.isBooked).length * 150, // Mock revenue
          isHoliday: dateString === '2024-12-25',
          holidayName: dateString === '2024-12-25' ? 'Navidad' : undefined
        }
      }

      setSchedule(mockSchedule)

      // Mock templates
      const mockTemplates: AvailabilityTemplate[] = [
        {
          id: '1',
          name: 'Horario Normal',
          description: 'Lunes a Viernes 9:00-18:00 con almuerzo',
          schedule: {
            '1': { isWorkingDay: true, workingHours: { start: '09:00', end: '18:00' }, breaks: [{ start: '13:00', end: '14:00', type: 'lunch', title: 'Almuerzo' }] },
            '2': { isWorkingDay: true, workingHours: { start: '09:00', end: '18:00' }, breaks: [{ start: '13:00', end: '14:00', type: 'lunch', title: 'Almuerzo' }] },
            '3': { isWorkingDay: true, workingHours: { start: '09:00', end: '18:00' }, breaks: [{ start: '13:00', end: '14:00', type: 'lunch', title: 'Almuerzo' }] },
            '4': { isWorkingDay: true, workingHours: { start: '09:00', end: '18:00' }, breaks: [{ start: '13:00', end: '14:00', type: 'lunch', title: 'Almuerzo' }] },
            '5': { isWorkingDay: true, workingHours: { start: '09:00', end: '18:00' }, breaks: [{ start: '13:00', end: '14:00', type: 'lunch', title: 'Almuerzo' }] },
            '6': { isWorkingDay: false, workingHours: { start: '', end: '' }, breaks: [] },
            '0': { isWorkingDay: false, workingHours: { start: '', end: '' }, breaks: [] }
          },
          isActive: true,
          createdAt: '2024-12-01'
        },
        {
          id: '2',
          name: 'Horario Extendido',
          description: 'Incluye sábados, horarios más largos',
          schedule: {
            '1': { isWorkingDay: true, workingHours: { start: '08:00', end: '20:00' }, breaks: [{ start: '13:00', end: '14:00', type: 'lunch', title: 'Almuerzo' }] },
            '2': { isWorkingDay: true, workingHours: { start: '08:00', end: '20:00' }, breaks: [{ start: '13:00', end: '14:00', type: 'lunch', title: 'Almuerzo' }] },
            '3': { isWorkingDay: true, workingHours: { start: '08:00', end: '20:00' }, breaks: [{ start: '13:00', end: '14:00', type: 'lunch', title: 'Almuerzo' }] },
            '4': { isWorkingDay: true, workingHours: { start: '08:00', end: '20:00' }, breaks: [{ start: '13:00', end: '14:00', type: 'lunch', title: 'Almuerzo' }] },
            '5': { isWorkingDay: true, workingHours: { start: '08:00', end: '20:00' }, breaks: [{ start: '13:00', end: '14:00', type: 'lunch', title: 'Almuerzo' }] },
            '6': { isWorkingDay: true, workingHours: { start: '09:00', end: '17:00' }, breaks: [{ start: '13:00', end: '14:00', type: 'lunch', title: 'Almuerzo' }] },
            '0': { isWorkingDay: false, workingHours: { start: '', end: '' }, breaks: [] }
          },
          isActive: false,
          createdAt: '2024-12-01'
        }
      ]

      setTemplates(mockTemplates)
    } catch (error) {
      toast.error(t('stylist.messages.availability.loadError'))
    } finally {
      setLoading(false)
    }
  }

  const loadAphroditeOptimizations = async () => {
    // Mock AI optimization suggestions
    const optimizations = [
      {
        id: '1',
        type: 'peak_hours',
        title: 'Optimizar Horarios Pico',
        description: 'Tus viernes de 2-6 PM tienen 95% ocupación. Considera extender horarios o aumentar precios.',
        impact: 'high',
        potentialRevenue: 850,
        recommendation: 'Agregar horarios de 6-8 PM los viernes',
        confidence: 89
      },
      {
        id: '2',
        type: 'gap_optimization',
        title: 'Llenar Espacios Vacíos',
        description: 'Tienes huecos de 30 min que podrían usarse para servicios express.',
        impact: 'medium',
        potentialRevenue: 420,
        recommendation: 'Ofrecer servicios de 30 min: retoques, cejas, tratamientos rápidos',
        confidence: 76
      },
      {
        id: '3',
        type: 'seasonal_adjustment',
        title: 'Ajuste Estacional',
        description: 'Diciembre típicamente aumenta 40% la demanda. Prepara tu calendario.',
        impact: 'high',
        potentialRevenue: 1200,
        recommendation: 'Abrir horarios extra del 15-31 de diciembre',
        confidence: 94
      }
    ]

    setAphroditeOptimizations(optimizations)
  }

  const getDaysInWeek = () => {
    const start = new Date(currentDate)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Monday start
    start.setDate(diff)

    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      days.push(date)
    }
    return days
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentDate(newDate)
  }

  const handleTimeSlotClick = (slot: TimeSlot, date: string) => {
    if (slot.type === 'appointment' && slot.isBooked) {
      // Show appointment details
      toast(`Cita: ${slot.clientName} - ${slot.serviceName}`)
    } else if (slot.isAvailable) {
      // Show booking modal or make available/unavailable
      setSelectedTimeSlot({ ...slot, date } as any)
      setShowAvailabilityModal(true)
    }
  }

  const toggleSlotAvailability = (slotId: string, date: string) => {
    setSchedule(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        timeSlots: prev[date].timeSlots.map(slot =>
          slot.id === slotId
            ? { ...slot, isAvailable: !slot.isAvailable }
            : slot
        )
      }
    }))
    toast.success(t('stylist.messages.availability.updateSuccess'))
  }

  const formatTime = (time: string) => {
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(new Date(`2000-01-01T${time}`))
  }

  const getSlotColor = (slot: TimeSlot) => {
    switch (slot.type) {
      case 'appointment':
        return slot.serviceColor || 'bg-blue-100 text-blue-800 border-blue-200'
      case 'break':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'lunch':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'blocked':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return slot.isAvailable
          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
          : 'bg-gray-100 text-gray-500 border-gray-200'
    }
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
        <div className="container-responsive py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-bold text-gray-900">
                Calendario de Disponibilidad
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona tus horarios y maximiza tu ocupación
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => setViewMode('day')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Día
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Mes
                </button>
              </div>

              <button
                onClick={() => setShowTemplateModal(true)}
                className="btn btn-secondary flex items-center space-x-2 rounded-full"
              >
                <BookmarkIcon className="h-5 w-5" />
                <span>Plantillas</span>
              </button>

              <button
                onClick={() => setShowBulkEditModal(true)}
                className="btn btn-primary flex items-center space-x-2 rounded-full"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                <span>Edición Masiva</span>
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateWeek('prev')}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentDate.toLocaleDateString('es-MX', {
                  month: 'long',
                  year: 'numeric',
                  ...(viewMode === 'week' ? { day: 'numeric' } : {})
                })}
              </h2>
              <button
                onClick={() => navigateWeek('next')}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <ArrowRightIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="btn btn-sm btn-outline rounded-full"
              >
                Hoy
              </button>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-gray-600">Disponible</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-gray-600">Reservado</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                <span className="text-gray-600">Descanso</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-gray-600">No Disponible</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-responsive py-6">
        {/* Aphrodite Optimizations */}
        {aphroditeOptimizations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="card border-l-4 border-purple-400">
              <div className="card-body">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <SparklesIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Optimizaciones Sugeridas por Aphrodite IA
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {aphroditeOptimizations.map((opt) => (
                        <div key={opt.id} className="p-3 bg-purple-50 border border-purple-200 rounded-full">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-purple-900">{opt.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              opt.impact === 'high' ? 'bg-red-100 text-red-800' :
                              opt.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {opt.impact === 'high' ? 'Alto' : opt.impact === 'medium' ? 'Medio' : 'Bajo'} Impacto
                            </span>
                          </div>
                          <p className="text-sm text-purple-800 mb-2">{opt.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-600">
                              +${opt.potentialRevenue}/mes
                            </span>
                            <button className="btn btn-xs btn-primary rounded-full">
                              Aplicar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Calendar Grid */}
        <div className="card">
          <div className="card-body p-0">
            {viewMode === 'week' && (
              <div className="overflow-x-auto">
                <div className="grid grid-cols-8 min-w-full">
                  {/* Time column header */}
                  <div className="p-4 border-r border-gray-200 bg-gray-50">
                    <span className="text-sm font-medium text-gray-500">Hora</span>
                  </div>

                  {/* Day headers */}
                  {getDaysInWeek().map((date) => {
                    const dateString = date.toISOString().split('T')[0]
                    const daySchedule = schedule[dateString]

                    return (
                      <div key={dateString} className="p-4 border-r border-gray-200 bg-gray-50">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {date.toLocaleDateString('es-MX', { weekday: 'short' })}
                          </div>
                          <div className={`text-lg font-bold mt-1 ${
                            date.toDateString() === new Date().toDateString()
                              ? 'text-primary-600'
                              : 'text-gray-700'
                          }`}>
                            {date.getDate()}
                          </div>
                          {daySchedule && (
                            <div className="mt-2 space-y-1">
                              <div className="text-xs text-gray-500">
                                {daySchedule.bookedSlots}/{daySchedule.totalSlots} slots
                              </div>
                              {daySchedule.revenue > 0 && (
                                <div className="text-xs font-medium text-green-600">
                                  ${daySchedule.revenue}
                                </div>
                              )}
                            </div>
                          )}
                          {daySchedule?.isHoliday && (
                            <div className="mt-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                              Feriado
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {/* Time slots */}
                  {Array.from({ length: 18 }, (_, hourIndex) => {
                    const hour = hourIndex + 6 // Start from 6 AM
                    const timeString = `${hour.toString().padStart(2, '0')}:00`

                    return (
                      <React.Fragment key={hour}>
                        {/* Time label */}
                        <div className="p-2 border-r border-b border-gray-200 bg-gray-50 text-right">
                          <span className="text-sm text-gray-500">
                            {formatTime(timeString)}
                          </span>
                        </div>

                        {/* Day slots */}
                        {getDaysInWeek().map((date) => {
                          const dateString = date.toISOString().split('T')[0]
                          const daySchedule = schedule[dateString]

                          if (!daySchedule || !daySchedule.isWorkingDay) {
                            return (
                              <div
                                key={`${dateString}-${hour}`}
                                className="h-16 border-r border-b border-gray-200 bg-gray-50"
                              />
                            )
                          }

                          // Find slots for this hour
                          const hourSlots = daySchedule.timeSlots.filter(slot => {
                            const slotHour = parseInt(slot.start.split(':')[0])
                            return slotHour === hour
                          })

                          return (
                            <div
                              key={`${dateString}-${hour}`}
                              className="border-r border-b border-gray-200 p-1"
                            >
                              <div className="space-y-1">
                                {hourSlots.map((slot) => (
                                  <motion.div
                                    key={slot.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleTimeSlotClick(slot, dateString)}
                                    className={`p-2 rounded border cursor-pointer text-xs transition-all ${getSlotColor(slot)}`}
                                  >
                                    {slot.type === 'appointment' && slot.clientName ? (
                                      <div>
                                        <div className="font-medium truncate">{slot.clientName}</div>
                                        <div className="text-xs opacity-75">{slot.serviceName}</div>
                                        <div className="text-xs">
                                          {formatTime(slot.start)} - {formatTime(slot.end)}
                                        </div>
                                      </div>
                                    ) : slot.type === 'lunch' ? (
                                      <div className="text-center font-medium">Almuerzo</div>
                                    ) : slot.type === 'break' ? (
                                      <div className="text-center font-medium">Descanso</div>
                                    ) : (
                                      <div className="text-center">
                                        {formatTime(slot.start)}
                                      </div>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>
            )}

            {viewMode === 'day' && (
              <div className="p-6 text-center">
                <CalendarDaysIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Vista de Día</h3>
                <p className="text-gray-600">Funcionalidad en desarrollo.</p>
              </div>
            )}

            {viewMode === 'month' && (
              <div className="p-6 text-center">
                <CalendarDaysIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Vista de Mes</h3>
                <p className="text-gray-600">Funcionalidad en desarrollo.</p>
              </div>
            )}
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(schedule).reduce((sum, day) => sum + day.bookedSlots, 0)}
              </div>
              <div className="text-sm text-gray-600">Citas Esta Semana</div>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-green-600">
                ${Object.values(schedule).reduce((sum, day) => sum + day.revenue, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Ingresos Proyectados</div>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(schedule).reduce((sum, day) => sum + day.availableSlots, 0)}
              </div>
              <div className="text-sm text-gray-600">Slots Disponibles</div>
            </div>
          </div>

          <div className="card">
            <div className="card-body text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(
                  (Object.values(schedule).reduce((sum, day) => sum + day.bookedSlots, 0) /
                   Object.values(schedule).reduce((sum, day) => sum + day.totalSlots, 0)) * 100
                )}%
              </div>
              <div className="text-sm text-gray-600">Ocupación</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}