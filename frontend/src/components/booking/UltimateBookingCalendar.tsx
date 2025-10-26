import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  format,
  addDays,
  addWeeks,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
  addMonths,
  isSameMonth,
  parseISO,
  set as setTime
} from 'date-fns'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  SparklesIcon,
  StarIcon,
  FireIcon,
  BoltIcon,
  MapPinIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid'
import { apiClient } from '../../services/api'
import toast from 'react-hot-toast'

interface TimeSlot {
  time: string
  available: boolean
  price?: number
  popular?: boolean
  recommended?: boolean
}

interface DayAvailability {
  date: string
  availableSlots: number
  bookedSlots: number
  avgPrice?: number
}

interface UltimateBookingCalendarProps {
  stylistId: number
  serviceId: number
  serviceDuration: number // in minutes
  serviceName: string
  basePrice: number
  onSelectSlot: (date: string, time: string) => void
  selectedDate?: string
  selectedTime?: string
  stylistName?: string
  stylistAvatar?: string
}

type ViewMode = 'month' | 'week' | 'time'

export default function UltimateBookingCalendar({
  stylistId,
  serviceId,
  serviceDuration,
  serviceName,
  basePrice,
  onSelectSlot,
  selectedDate,
  selectedTime,
  stylistName = 'Stylist',
  stylistAvatar
}: UltimateBookingCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(
    selectedDate ? parseISO(selectedDate) : null
  )
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [monthAvailability, setMonthAvailability] = useState<Map<string, DayAvailability>>(new Map())
  const [loading, setLoading] = useState(false)
  const [loadingMonth, setLoadingMonth] = useState(false)

  // Fetch month availability for heatmap
  useEffect(() => {
    if (viewMode === 'month') {
      fetchMonthAvailability()
    }
  }, [currentDate, stylistId, serviceId, viewMode])

  // Fetch time slots when day is selected
  useEffect(() => {
    if (selectedDay && viewMode === 'time') {
      fetchAvailableSlots(selectedDay)
    }
  }, [selectedDay, stylistId, serviceId, viewMode])

  const fetchMonthAvailability = async () => {
    try {
      setLoadingMonth(true)
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)

      const response = await apiClient.get<DayAvailability[]>(
        `/bookings/stylists/${stylistId}/availability/month`,
        {
          params: {
            startDate: format(start, 'yyyy-MM-dd'),
            endDate: format(end, 'yyyy-MM-dd'),
            serviceId
          }
        }
      )

      if (response.success && response.data) {
        const availabilityMap = new Map()
        response.data.forEach(day => {
          availabilityMap.set(day.date, day)
        })
        setMonthAvailability(availabilityMap)
      }
    } catch (error: any) {
      console.error('Failed to fetch month availability:', error)
    } finally {
      setLoadingMonth(false)
    }
  }

  const fetchAvailableSlots = async (date: Date) => {
    try {
      setLoading(true)

      const response = await apiClient.get<TimeSlot[]>(
        `/bookings/stylists/${stylistId}/availability/slots`,
        {
          params: {
            date: format(date, 'yyyy-MM-dd'),
            serviceId,
            duration: serviceDuration
          }
        }
      )

      if (response.success && response.data) {
        setAvailableSlots(response.data)
      } else {
        setAvailableSlots([])
        toast.error('No available slots for this date')
      }
    } catch (error: any) {
      console.error('Failed to fetch available slots:', error)
      setAvailableSlots([])
      toast.error('Failed to load available time slots')
    } finally {
      setLoading(false)
    }
  }

  // Month calendar days
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    const firstDay = startOfWeek(start, { weekStartsOn: 0 }) // Sunday
    const lastDay = endOfDay(end)

    // Get 6 weeks to fill calendar grid
    const days = eachDayOfInterval({ start: firstDay, end: addDays(firstDay, 41) })
    return days
  }, [currentDate])

  // Week days for week view
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDay || currentDate, { weekStartsOn: 1 }) // Monday
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }, [selectedDay, currentDate])

  const handleMonthNav = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => addMonths(prev, direction === 'next' ? 1 : -1))
  }

  const handleWeekNav = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => addWeeks(prev, direction === 'next' ? 1 : -1))
  }

  const handleDayClick = (day: Date) => {
    if (isBefore(day, startOfDay(new Date()))) {
      toast.error('Cannot book appointments in the past', {
        icon: '⏰',
        style: { borderRadius: '12px' }
      })
      return
    }

    setSelectedDay(day)

    // Auto-advance to time selection if in month view
    if (viewMode === 'month') {
      setViewMode('time')
    }
  }

  const handleTimeClick = (time: string) => {
    if (selectedDay) {
      onSelectSlot(format(selectedDay, 'yyyy-MM-dd'), time)
    }
  }

  const getAvailabilityColor = (count: number, max: number = 20) => {
    if (count === 0) return 'bg-gray-100'
    const intensity = Math.min(count / max, 1)

    if (intensity > 0.7) return 'bg-green-500'
    if (intensity > 0.4) return 'bg-green-300'
    if (intensity > 0.2) return 'bg-yellow-300'
    return 'bg-orange-300'
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`
    if (hours > 0) return `${hours}h`
    return `${mins}m`
  }

  return (
    <div className="space-y-6">
      {/* Header Card with Service Info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-3xl shadow-2xl p-8 text-white"
      >
        {/* Animated Background Blobs */}
        <div className="absolute inset-0 opacity-20">
          <motion.div
            className="absolute top-0 right-0 w-72 h-72 bg-white rounded-full blur-3xl"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -30, 0],
              y: [0, -50, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {stylistAvatar ? (
              <img loading="lazy"
                src={stylistAvatar}
                alt={stylistName}
                className="w-16 h-16 rounded-2xl border-4 border-white/30 shadow-lg object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl border-4 border-white/30 shadow-lg bg-white/20 flex items-center justify-center">
                <SparklesIcon className="w-8 h-8" />
              </div>
            )}
            <div>
              <h2 className="text-3xl font-bold mb-1">{serviceName}</h2>
              <p className="text-white/90 text-sm">with {stylistName}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-white/80 text-sm">Duration</div>
              <div className="text-2xl font-bold">{formatDuration(serviceDuration)}</div>
            </div>
            <div className="text-right">
              <div className="text-white/80 text-sm">From</div>
              <div className="text-2xl font-bold">${basePrice}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* View Mode Selector */}
      <div className="flex items-center justify-center gap-2 bg-gray-100 p-2 rounded-2xl w-fit mx-auto">
        {(['month', 'week', 'time'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => {
              setViewMode(mode)
              if (mode === 'week' && !selectedDay) {
                setSelectedDay(new Date())
              }
            }}
            className={`
              relative px-6 py-2.5 rounded-xl font-medium transition-all
              ${viewMode === mode
                ? 'text-white'
                : 'text-gray-600 hover:text-gray-900'
              }
            `}
          >
            {viewMode === mode && (
              <motion.div
                layoutId="activeView"
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10 capitalize flex items-center gap-2">
              {mode === 'month' && <CalendarDaysIcon className="w-4 h-4" />}
              {mode === 'week' && <ChevronRightIcon className="w-4 h-4" />}
              {mode === 'time' && <ClockIcon className="w-4 h-4" />}
              {mode}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* MONTH VIEW - Availability Heatmap */}
        {viewMode === 'month' && (
          <motion.div
            key="month"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-xl p-6"
          >
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => handleMonthNav('prev')}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all hover:scale-110"
              >
                <ChevronLeftIcon className="h-6 w-6 text-gray-700" />
              </button>

              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {format(currentDate, 'MMMM yyyy')}
              </h3>

              <button
                onClick={() => handleMonthNav('next')}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all hover:scale-110"
              >
                <ChevronRightIcon className="h-6 w-6 text-gray-700" />
              </button>
            </div>

            {/* Day Labels */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {monthDays.map((day, index) => {
                const isPast = isBefore(day, startOfDay(new Date()))
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isCurrentDay = isToday(day)
                const isSelected = selectedDay && isSameDay(day, selectedDay)
                const dateKey = format(day, 'yyyy-MM-dd')
                const availability = monthAvailability.get(dateKey)
                const availableCount = availability?.availableSlots || 0

                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.01 }}
                    whileHover={!isPast && isCurrentMonth ? { scale: 1.1, zIndex: 10 } : {}}
                    whileTap={!isPast && isCurrentMonth ? { scale: 0.95 } : {}}
                    onClick={() => isCurrentMonth && !isPast && handleDayClick(day)}
                    disabled={isPast || !isCurrentMonth}
                    className={`
                      relative aspect-square p-2 rounded-2xl text-center transition-all
                      ${!isCurrentMonth
                        ? 'opacity-30 cursor-not-allowed'
                        : isPast
                        ? 'opacity-40 cursor-not-allowed'
                        : 'cursor-pointer'
                      }
                      ${isSelected
                        ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-2xl scale-110'
                        : isCurrentDay
                        ? 'border-2 border-purple-500 bg-purple-50'
                        : `${getAvailabilityColor(availableCount)} hover:shadow-lg`
                      }
                    `}
                  >
                    <div className="text-sm font-semibold mb-1">
                      {format(day, 'd')}
                    </div>

                    {!isPast && isCurrentMonth && availableCount > 0 && !isSelected && (
                      <div className="text-xs font-medium">
                        {availableCount} slots
                      </div>
                    )}

                    {isCurrentDay && !isSelected && (
                      <div className="absolute -top-1 -right-1">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                        </span>
                      </div>
                    )}

                    {isSelected && (
                      <CheckCircleSolidIcon className="absolute top-1 right-1 w-5 h-5 text-white" />
                    )}
                  </motion.button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span className="text-gray-600">High availability</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-300"></div>
                <span className="text-gray-600">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-300"></div>
                <span className="text-gray-600">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-100"></div>
                <span className="text-gray-600">None</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* WEEK VIEW - Day Pills */}
        {viewMode === 'week' && (
          <motion.div
            key="week"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => handleWeekNav('prev')}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all hover:scale-110"
              >
                <ChevronLeftIcon className="h-6 w-6 text-gray-700" />
              </button>

              <h3 className="text-xl font-bold text-gray-900">
                {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
              </h3>

              <button
                onClick={() => handleWeekNav('next')}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all hover:scale-110"
              >
                <ChevronRightIcon className="h-6 w-6 text-gray-700" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-3">
              {weekDays.map((day, index) => {
                const isPast = isBefore(day, startOfDay(new Date()))
                const isSelected = selectedDay && isSameDay(day, selectedDay)
                const isCurrentDay = isToday(day)

                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={!isPast ? { scale: 1.05, y: -5 } : {}}
                    whileTap={!isPast ? { scale: 0.95 } : {}}
                    onClick={() => !isPast && handleDayClick(day)}
                    disabled={isPast}
                    className={`
                      relative p-4 rounded-3xl text-center transition-all shadow-md
                      ${isPast
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isSelected
                        ? 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white shadow-2xl'
                        : isCurrentDay
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-xl'
                        : 'bg-gradient-to-br from-gray-50 to-gray-100 hover:from-purple-50 hover:to-pink-50 text-gray-700 hover:shadow-xl'
                      }
                    `}
                  >
                    <div className="text-xs font-semibold mb-2 opacity-90">
                      {format(day, 'EEE')}
                    </div>
                    <div className="text-3xl font-bold mb-1">
                      {format(day, 'd')}
                    </div>
                    <div className="text-xs opacity-90">
                      {format(day, 'MMM')}
                    </div>

                    {isCurrentDay && !isSelected && (
                      <div className="absolute top-2 right-2">
                        <BoltIcon className="w-5 h-5 animate-pulse" />
                      </div>
                    )}

                    {isSelected && (
                      <motion.div
                        className="absolute -top-2 -right-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", bounce: 0.5 }}
                      >
                        <div className="bg-white rounded-full p-1 shadow-lg">
                          <CheckCircleSolidIcon className="w-6 h-6 text-green-500" />
                        </div>
                      </motion.div>
                    )}
                  </motion.button>
                )
              })}
            </div>

            {selectedDay && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 text-center"
              >
                <button
                  onClick={() => setViewMode('time')}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
                >
                  Choose Time Slot →
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* TIME VIEW - Time Slots */}
        {viewMode === 'time' && selectedDay && (
          <motion.div
            key="time"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-xl p-6"
          >
            {/* Selected Day Header */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b-2 border-gray-100">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {format(selectedDay, 'EEEE, MMMM d')}
                </h3>
                <p className="text-gray-500">Select your preferred time</p>
              </div>

              <button
                onClick={() => setViewMode('week')}
                className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-xl transition-all font-medium"
              >
                ← Change Date
              </button>
            </div>

            {loading ? (
              <div className="py-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 mx-auto border-4 border-purple-200 border-t-purple-600 rounded-full"
                />
                <p className="text-center mt-6 text-gray-600 font-medium">
                  Loading available times...
                </p>
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-16">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <CalendarDaysIcon className="h-20 w-20 text-gray-300 mx-auto mb-4" />
                </motion.div>
                <h4 className="text-xl font-bold text-gray-700 mb-2">No Slots Available</h4>
                <p className="text-gray-500 mb-6">
                  This date is fully booked. Please try another day.
                </p>
                <button
                  onClick={() => setViewMode('week')}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
                >
                  Choose Different Date
                </button>
              </div>
            ) : (
              <>
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-2xl">
                    <div className="text-2xl font-bold text-green-700">{availableSlots.length}</div>
                    <div className="text-sm text-green-600">Available</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-2xl">
                    <div className="text-2xl font-bold text-purple-700">${basePrice}</div>
                    <div className="text-sm text-purple-600">Starting Price</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-4 rounded-2xl">
                    <div className="text-2xl font-bold text-orange-700">{formatDuration(serviceDuration)}</div>
                    <div className="text-sm text-orange-600">Duration</div>
                  </div>
                </div>

                {/* Time Slots Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  <AnimatePresence mode="popLayout">
                    {availableSlots.map((slot, index) => {
                      const isSelected = selectedTime === slot.time
                      const isRecommended = slot.recommended
                      const isPopular = slot.popular

                      return (
                        <motion.button
                          key={slot.time}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ delay: index * 0.02 }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => slot.available && handleTimeClick(slot.time)}
                          disabled={!slot.available}
                          className={`
                            relative p-4 rounded-2xl text-center transition-all
                            ${!slot.available
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                              : isSelected
                              ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-2xl'
                              : isRecommended
                              ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-2 border-orange-400 text-orange-900 hover:shadow-xl'
                              : isPopular
                              ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 text-blue-900 hover:shadow-lg'
                              : 'bg-gray-50 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 text-gray-700 border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg'
                            }
                          `}
                        >
                          {/* Badges */}
                          {isRecommended && !isSelected && (
                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                              <SparklesIcon className="w-3 h-3" />
                              Best
                            </div>
                          )}

                          {isPopular && !isRecommended && !isSelected && (
                            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-400 to-cyan-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                              <FireIcon className="w-3 h-3" />
                              Popular
                            </div>
                          )}

                          <div className="flex items-center justify-center gap-1.5 mb-2">
                            <ClockIcon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                            <span className="text-lg font-bold">
                              {slot.time}
                            </span>
                          </div>

                          {slot.price && slot.price !== basePrice && (
                            <div className={`text-sm font-semibold ${isSelected ? 'text-white/90' : 'text-purple-600'}`}>
                              ${slot.price}
                            </div>
                          )}

                          {isSelected && (
                            <motion.div
                              className="absolute inset-0 border-4 border-white rounded-2xl"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            />
                          )}
                        </motion.button>
                      )
                    })}
                  </AnimatePresence>
                </div>

                {/* Selected Time Confirmation */}
                <AnimatePresence>
                  {selectedTime && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-green-500 rounded-2xl">
                            <CheckCircleSolidIcon className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-900">
                              {format(selectedDay, 'EEEE, MMM d')} at {selectedTime}
                            </div>
                            <div className="text-sm text-green-700">
                              {serviceName} • {formatDuration(serviceDuration)}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-3xl font-bold text-green-900">${basePrice}</div>
                          <div className="text-sm text-green-700">Total</div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-gray-500 bg-gray-50 rounded-2xl p-4"
      >
        <span className="inline-flex items-center gap-2">
          <SparklesIcon className="w-4 h-4" />
          Select a date and time to book your appointment
        </span>
      </motion.div>
    </div>
  )
}
