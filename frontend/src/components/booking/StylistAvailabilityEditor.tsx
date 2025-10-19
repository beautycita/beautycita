import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  ClockIcon,
  PlusIcon,
  TrashIcon,
  CalendarDaysIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface WorkingHours {
  day: string
  dayOfWeek: number
  enabled: boolean
  start: string
  end: string
  breaks: Array<{
    start: string
    end: string
    title: string
  }>
}

interface TimeOff {
  id?: number
  start_date: string
  end_date: string
  reason: string
}

interface StylistAvailabilityEditorProps {
  stylistId: number
  onSave?: () => void
}

export default function StylistAvailabilityEditor({
  stylistId,
  onSave
}: StylistAvailabilityEditorProps) {
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([
    { day: 'Monday', dayOfWeek: 1, enabled: true, start: '09:00', end: '17:00', breaks: [] },
    { day: 'Tuesday', dayOfWeek: 2, enabled: true, start: '09:00', end: '17:00', breaks: [] },
    { day: 'Wednesday', dayOfWeek: 3, enabled: true, start: '09:00', end: '17:00', breaks: [] },
    { day: 'Thursday', dayOfWeek: 4, enabled: true, start: '09:00', end: '17:00', breaks: [] },
    { day: 'Friday', dayOfWeek: 5, enabled: true, start: '09:00', end: '17:00', breaks: [] },
    { day: 'Saturday', dayOfWeek: 6, enabled: false, start: '10:00', end: '14:00', breaks: [] },
    { day: 'Sunday', dayOfWeek: 0, enabled: false, start: '10:00', end: '14:00', breaks: [] }
  ])

  const [timeOffs, setTimeOffs] = useState<TimeOff[]>([])
  const [newTimeOff, setNewTimeOff] = useState<TimeOff>({
    start_date: '',
    end_date: '',
    reason: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAddTimeOff, setShowAddTimeOff] = useState(false)

  useEffect(() => {
    fetchAvailability()
  }, [stylistId])

  const fetchAvailability = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('authToken')

      // Fetch recurring availability
      const recurringResponse = await axios.get(
        `${API_URL}/api/availability/stylist/${stylistId}/recurring`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (recurringResponse.data.success && recurringResponse.data.availability) {
        // Map backend data to working hours
        const mapped = mapRecurringToWorkingHours(recurringResponse.data.availability)
        setWorkingHours(mapped)
      }

      // Fetch time off periods
      const timeOffResponse = await axios.get(
        `${API_URL}/api/availability/stylist/${stylistId}/time-off`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (timeOffResponse.data.success) {
        setTimeOffs(timeOffResponse.data.timeOff || [])
      }
    } catch (error: any) {
      console.error('Failed to fetch availability:', error)
      toast.error('Failed to load availability settings')
    } finally {
      setLoading(false)
    }
  }

  const mapRecurringToWorkingHours = (recurring: any[]): WorkingHours[] => {
    const defaultHours = [
      { day: 'Sunday', dayOfWeek: 0, enabled: false, start: '10:00', end: '14:00', breaks: [] },
      { day: 'Monday', dayOfWeek: 1, enabled: true, start: '09:00', end: '17:00', breaks: [] },
      { day: 'Tuesday', dayOfWeek: 2, enabled: true, start: '09:00', end: '17:00', breaks: [] },
      { day: 'Wednesday', dayOfWeek: 3, enabled: true, start: '09:00', end: '17:00', breaks: [] },
      { day: 'Thursday', dayOfWeek: 4, enabled: true, start: '09:00', end: '17:00', breaks: [] },
      { day: 'Friday', dayOfWeek: 5, enabled: true, start: '09:00', end: '17:00', breaks: [] },
      { day: 'Saturday', dayOfWeek: 6, enabled: false, start: '10:00', end: '14:00', breaks: [] }
    ]

    recurring.forEach(slot => {
      const dayIndex = defaultHours.findIndex(d => d.dayOfWeek === slot.day_of_week)
      if (dayIndex !== -1) {
        defaultHours[dayIndex] = {
          ...defaultHours[dayIndex],
          enabled: true,
          start: slot.start_time,
          end: slot.end_time
        }
      }
    })

    return defaultHours
  }

  const handleSaveWorkingHours = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('authToken')

      // Convert working hours to recurring availability format
      const recurringSlots = workingHours
        .filter(day => day.enabled)
        .map(day => ({
          day_of_week: day.dayOfWeek,
          start_time: day.start,
          end_time: day.end,
          slot_duration: 30, // Default 30 min slots
          buffer_time: 0
        }))

      await axios.post(
        `${API_URL}/api/availability/stylist/${stylistId}/recurring`,
        { availability: recurringSlots },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success('Working hours saved successfully!')
      if (onSave) onSave()
    } catch (error: any) {
      console.error('Failed to save working hours:', error)
      toast.error(error.response?.data?.message || 'Failed to save working hours')
    } finally {
      setSaving(false)
    }
  }

  const handleAddTimeOff = async () => {
    if (!newTimeOff.start_date || !newTimeOff.end_date) {
      toast.error('Please select start and end dates')
      return
    }

    try {
      const token = localStorage.getItem('authToken')

      await axios.post(
        `${API_URL}/api/availability/stylist/${stylistId}/time-off`,
        newTimeOff,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success('Time off added successfully!')
      setNewTimeOff({ start_date: '', end_date: '', reason: '' })
      setShowAddTimeOff(false)
      fetchAvailability()
    } catch (error: any) {
      console.error('Failed to add time off:', error)
      toast.error(error.response?.data?.message || 'Failed to add time off')
    }
  }

  const handleDeleteTimeOff = async (timeOffId: number) => {
    try {
      const token = localStorage.getItem('authToken')

      await axios.delete(
        `${API_URL}/api/availability/stylist/${stylistId}/time-off/${timeOffId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success('Time off removed successfully!')
      fetchAvailability()
    } catch (error: any) {
      console.error('Failed to delete time off:', error)
      toast.error('Failed to remove time off')
    }
  }

  const toggleDay = (index: number) => {
    const newHours = [...workingHours]
    newHours[index].enabled = !newHours[index].enabled
    setWorkingHours(newHours)
  }

  const updateTime = (index: number, field: 'start' | 'end', value: string) => {
    const newHours = [...workingHours]
    newHours[index][field] = value
    setWorkingHours(newHours)
  }

  const copyToAllDays = (sourceIndex: number) => {
    const source = workingHours[sourceIndex]
    const newHours = workingHours.map((day, index) => {
      if (index === sourceIndex) return day
      return {
        ...day,
        enabled: source.enabled,
        start: source.start,
        end: source.end
      }
    })
    setWorkingHours(newHours)
    toast.success('Applied to all days')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Working Hours Section */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Working Hours</h2>
            <p className="text-gray-600 mt-1">Set your weekly availability schedule</p>
          </div>
          <ClockIcon className="h-8 w-8 text-purple-600" />
        </div>

        <div className="space-y-3">
          {workingHours.map((day, index) => (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200"
            >
              {/* Enable/Disable Toggle */}
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={() => toggleDay(index)}
                  className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
              </label>

              {/* Day Name */}
              <div className="w-28 font-semibold text-gray-900">{day.day}</div>

              {/* Time Inputs */}
              {day.enabled ? (
                <>
                  <input
                    type="time"
                    value={day.start}
                    onChange={(e) => updateTime(index, 'start', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <span className="text-gray-500 font-medium">to</span>
                  <input
                    type="time"
                    value={day.end}
                    onChange={(e) => updateTime(index, 'end', e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />

                  {/* Copy to All Button */}
                  <button
                    onClick={() => copyToAllDays(index)}
                    className="ml-auto px-3 py-2 text-sm bg-white border border-purple-200 text-purple-600 rounded-full hover:bg-purple-50 transition-colors flex items-center gap-2"
                    title="Copy to all days"
                  >
                    <ClockIcon className="h-4 w-4" />
                    Copy
                  </button>
                </>
              ) : (
                <span className="text-gray-500 italic flex-1">Closed</span>
              )}
            </motion.div>
          ))}
        </div>

        <button
          onClick={handleSaveWorkingHours}
          disabled={saving}
          className="mt-6 w-full bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <CheckIcon className="h-5 w-5" />
              Save Working Hours
            </>
          )}
        </button>
      </div>

      {/* Time Off Section */}
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Time Off</h2>
            <p className="text-gray-600 mt-1">Block dates when you're unavailable</p>
          </div>
          <CalendarDaysIcon className="h-8 w-8 text-pink-600" />
        </div>

        {/* Existing Time Off */}
        {timeOffs.length > 0 && (
          <div className="space-y-3 mb-6">
            {timeOffs.map((timeOff) => (
              <div
                key={timeOff.id}
                className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-2xl"
              >
                <div>
                  <p className="font-semibold text-gray-900">{timeOff.reason || 'Time Off'}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(timeOff.start_date).toLocaleDateString()} -{' '}
                    {new Date(timeOff.end_date).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => timeOff.id && handleDeleteTimeOff(timeOff.id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Time Off Form */}
        {showAddTimeOff ? (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={newTimeOff.start_date}
                  onChange={(e) => setNewTimeOff({ ...newTimeOff, start_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={newTimeOff.end_date}
                  onChange={(e) => setNewTimeOff({ ...newTimeOff, end_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <input
                type="text"
                value={newTimeOff.reason}
                onChange={(e) => setNewTimeOff({ ...newTimeOff, reason: e.target.value })}
                placeholder="e.g., Vacation, Personal Day"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddTimeOff}
                className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all"
              >
                Add Time Off
              </button>
              <button
                onClick={() => {
                  setShowAddTimeOff(false)
                  setNewTimeOff({ start_date: '', end_date: '', reason: '' })
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddTimeOff(true)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all"
          >
            <PlusIcon className="h-5 w-5" />
            Add Time Off
          </button>
        )}
      </div>
    </div>
  )
}
