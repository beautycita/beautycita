import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CalendarDaysIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { format, addDays, startOfWeek, isSameDay, isToday, isBefore, startOfDay } from 'date-fns'

const API_URL = import.meta.env.VITE_API_URL || ''

interface TimeSlot {
  time: string
  available: boolean
  price?: number
}

interface TimeSlotPickerProps {
  stylistId: number
  serviceId: number
  serviceDuration: number // in minutes
  onSelectSlot: (date: string, time: string) => void
  selectedDate?: string
  selectedTime?: string
}

export default function TimeSlotPicker({
  stylistId,
  serviceId,
  serviceDuration,
  onSelectSlot,
  selectedDate,
  selectedTime
}: TimeSlotPickerProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedDay) {
      fetchAvailableSlots(selectedDay)
    }
  }, [selectedDay, stylistId, serviceId])

  const fetchAvailableSlots = async (date: Date) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')

      const response = await axios.get(
        `${API_URL}/api/bookings/stylists/${stylistId}/availability`,
        {
          params: {
            date: format(date, 'yyyy-MM-dd'),
            serviceId
          },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      )

      if (response.data.success && response.data.slots) {
        setAvailableSlots(response.data.slots)
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

  const getWeekDays = () => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Monday
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => addDays(prev, direction === 'next' ? 7 : -7))
  }

  const handleDayClick = (day: Date) => {
    if (isBefore(day, startOfDay(new Date()))) {
      toast.error('Cannot book appointments in the past')
      return
    }
    setSelectedDay(day)
  }

  const handleTimeClick = (time: string) => {
    if (selectedDay) {
      onSelectSlot(format(selectedDay, 'yyyy-MM-dd'), time)
    }
  }

  const weekDays = getWeekDays()

  return (
    <div className="space-y-6">
      {/* Week Selector */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeftIcon className="h-6 w-6 text-gray-600" />
          </button>

          <h3 className="text-lg font-semibold text-gray-900">
            {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
          </h3>

          <button
            onClick={() => navigateWeek('next')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRightIcon className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Day Pills */}
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const isPast = isBefore(day, startOfDay(new Date()))
            const isSelected = selectedDay && isSameDay(day, selectedDay)
            const isCurrentDay = isToday(day)

            return (
              <motion.button
                key={index}
                whileHover={!isPast ? { scale: 1.05 } : {}}
                whileTap={!isPast ? { scale: 0.95 } : {}}
                onClick={() => !isPast && handleDayClick(day)}
                disabled={isPast}
                className={`
                  p-3 rounded-2xl text-center transition-all
                  ${isPast
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : isCurrentDay
                    ? 'bg-blue-50 border-2 border-blue-500 text-blue-700'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }
                `}
              >
                <div className="text-xs font-medium mb-1">
                  {format(day, 'EEE')}
                </div>
                <div className="text-lg font-bold">
                  {format(day, 'd')}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Time Slots */}
      {selectedDay && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Available Times</h3>
              <p className="text-gray-600">
                {format(selectedDay, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Loading available times...</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDaysIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No available time slots for this date</p>
              <p className="text-sm text-gray-400 mt-2">Please select a different day</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <AnimatePresence mode="popLayout">
                {availableSlots.map((slot, index) => {
                  const isSelectedSlot = selectedTime === slot.time
                  const isAvailable = slot.available

                  return (
                    <motion.button
                      key={slot.time}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.02 }}
                      whileHover={isAvailable ? { scale: 1.05 } : {}}
                      whileTap={isAvailable ? { scale: 0.95 } : {}}
                      onClick={() => isAvailable && handleTimeClick(slot.time)}
                      disabled={!isAvailable}
                      className={`
                        p-4 rounded-2xl font-semibold transition-all relative
                        ${isAvailable
                          ? isSelectedSlot
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                            : 'bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 text-purple-700 hover:border-purple-400'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-base">
                          {format(new Date(`2000-01-01T${slot.time}`), 'h:mm a')}
                        </span>
                        {slot.price && isAvailable && (
                          <span className="text-xs mt-1 opacity-75">
                            ${slot.price}
                          </span>
                        )}
                      </div>

                      {isSelectedSlot && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-2 -right-2"
                        >
                          <div className="bg-green-500 rounded-full p-1">
                            <CheckCircleIcon className="h-5 w-5 text-white" />
                          </div>
                        </motion.div>
                      )}
                    </motion.button>
                  )
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Service Duration Info */}
          {availableSlots.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <ClockIcon className="h-5 w-5" />
                <span>
                  Service duration: <strong>{serviceDuration} minutes</strong>
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Instructions */}
      {!selectedDay && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-3xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <CalendarDaysIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-purple-900 mb-2">Select a Date</h4>
              <p className="text-purple-700 text-sm">
                Choose a day from the calendar above to see available time slots.
                Dates in the past cannot be selected.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
