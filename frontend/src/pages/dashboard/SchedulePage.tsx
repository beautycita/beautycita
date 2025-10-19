import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ClockIcon,
  CalendarDaysIcon,
  PlusIcon,
  TrashIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface WorkingHours {
  [key: string]: {
    open: string
    close: string
    isOpen: boolean
  }
}

interface TimeOff {
  id: number
  start_date: string
  end_date: string
  reason: string
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS: { [key: string]: string } = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
}

export default function SchedulePage() {
  const [workingHours, setWorkingHours] = useState<WorkingHours>({})
  const [timeOff, setTimeOff] = useState<TimeOff[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newTimeOff, setNewTimeOff] = useState({
    startDate: '',
    endDate: '',
    reason: ''
  })

  useEffect(() => {
    fetchSchedule()
  }, [])

  const fetchSchedule = async () => {
    try {
      const token = localStorage.getItem('token')

      const [hoursRes, timeOffRes] = await Promise.all([
        axios.get(`${API_URL}/api/schedule/working-hours`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/schedule/time-off`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      setWorkingHours(hoursRes.data.data)
      setTimeOff(timeOffRes.data.data)
    } catch (error: any) {
      console.error('Error fetching schedule:', error)
      toast.error('Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveWorkingHours = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token')

      await axios.put(
        `${API_URL}/api/schedule/working-hours`,
        { workingHours },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success('Working hours updated successfully!')
    } catch (error: any) {
      console.error('Error saving working hours:', error)
      toast.error('Failed to update working hours')
    } finally {
      setSaving(false)
    }
  }

  const handleAddTimeOff = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newTimeOff.startDate || !newTimeOff.endDate) {
      toast.error('Please select start and end dates')
      return
    }

    try {
      const token = localStorage.getItem('token')

      await axios.post(
        `${API_URL}/api/schedule/time-off`,
        newTimeOff,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success('Time-off added successfully!')
      setNewTimeOff({ startDate: '', endDate: '', reason: '' })
      fetchSchedule()
    } catch (error: any) {
      console.error('Error adding time-off:', error)
      toast.error(error.response?.data?.message || 'Failed to add time-off')
    }
  }

  const handleDeleteTimeOff = async (id: number) => {
    if (!confirm('Are you sure you want to delete this time-off period?')) return

    try {
      const token = localStorage.getItem('token')

      await axios.delete(`${API_URL}/api/schedule/time-off/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success('Time-off deleted successfully!')
      fetchSchedule()
    } catch (error: any) {
      console.error('Error deleting time-off:', error)
      toast.error('Failed to delete time-off')
    }
  }

  const updateWorkingHours = (day: string, field: string, value: any) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }))
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Schedule & Availability</h1>
          <p className="text-gray-600 mt-1">Manage your working hours and time-off</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Working Hours */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-6 h-6 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Working Hours</h2>
                </div>
                <button
                  onClick={handleSaveWorkingHours}
                  disabled={saving}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  {saving ? 'Saving...' : 'Save Hours'}
                </button>
              </div>

              <div className="space-y-4">
                {DAYS.map((day) => (
                  <div key={day} className="flex items-center gap-4 p-4 bg-gray-50 rounded-3xl">
                    <div className="flex items-center gap-3 w-40">
                      <input
                        type="checkbox"
                        checked={workingHours[day]?.isOpen || false}
                        onChange={(e) => updateWorkingHours(day, 'isOpen', e.target.checked)}
                        className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <label className="font-medium text-gray-900">{DAY_LABELS[day]}</label>
                    </div>

                    {workingHours[day]?.isOpen ? (
                      <div className="flex items-center gap-3 flex-1">
                        <input
                          type="time"
                          value={workingHours[day]?.open || '09:00'}
                          onChange={(e) => updateWorkingHours(day, 'open', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                        <span className="text-gray-500">to</span>
                        <input
                          type="time"
                          value={workingHours[day]?.close || '17:00'}
                          onChange={(e) => updateWorkingHours(day, 'close', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Closed</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Time Off */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <CalendarDaysIcon className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Time Off</h2>
              </div>

              {/* Add Time Off Form */}
              <form onSubmit={handleAddTimeOff} className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={newTimeOff.startDate}
                    onChange={(e) => setNewTimeOff({ ...newTimeOff, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={newTimeOff.endDate}
                    onChange={(e) => setNewTimeOff({ ...newTimeOff, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason (optional)
                  </label>
                  <input
                    type="text"
                    value={newTimeOff.reason}
                    onChange={(e) => setNewTimeOff({ ...newTimeOff, reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="Vacation, etc."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Time Off
                </button>
              </form>

              {/* Time Off List */}
              <div className="space-y-3">
                {timeOff.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-4">No time-off scheduled</p>
                ) : (
                  timeOff.map((period) => (
                    <motion.div
                      key={period.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-purple-50 rounded-3xl flex justify-between items-start"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                        </div>
                        {period.reason && (
                          <div className="text-sm text-gray-600 mt-1">{period.reason}</div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteTimeOff(period.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
