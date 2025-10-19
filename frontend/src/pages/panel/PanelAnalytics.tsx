import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import {
  ChartBarIcon,
  ArrowLeftIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface AnalyticsData {
  users: { total: number; newThisWeek: number; newThisMonth: number; byRole: any }
  bookings: { total: number; thisWeek: number; thisMonth: number; byStatus: any }
  revenue: { total: number; thisMonth: number; thisWeek: number }
  reviews: { total: number; averageRating: number }
}

export default function PanelAnalytics() {
  const { token } = useAuthStore()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setData(response.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link to="/panel" className="p-2 hover:bg-white/50 rounded-full transition-colors">
              <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
                Platform Analytics
              </h1>
              <p className="mt-2 text-gray-600">Comprehensive platform insights</p>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl shadow-lg p-12 text-center text-gray-500">
              Loading analytics...
            </div>
          ) : !data ? (
            <div className="bg-white rounded-3xl shadow-lg p-12 text-center text-gray-500">
              Failed to load analytics
            </div>
          ) : (
            <>
              {/* User Analytics */}
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <UserGroupIcon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">User Analytics</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-2xl">
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{data.users.total}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-2xl">
                    <p className="text-sm text-gray-600">New This Week</p>
                    <p className="text-2xl font-bold text-gray-900">{data.users.newThisWeek}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-2xl">
                    <p className="text-sm text-gray-600">New This Month</p>
                    <p className="text-2xl font-bold text-gray-900">{data.users.newThisMonth}</p>
                  </div>
                  <div className="p-4 bg-pink-50 rounded-2xl">
                    <p className="text-sm text-gray-600">Stylists</p>
                    <p className="text-2xl font-bold text-gray-900">{data.users.byRole?.STYLIST || 0}</p>
                  </div>
                </div>
              </div>

              {/* Booking Analytics */}
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <CalendarDaysIcon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Booking Analytics</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-indigo-50 rounded-2xl">
                    <p className="text-sm text-gray-600">Total Bookings</p>
                    <p className="text-2xl font-bold text-gray-900">{data.bookings.total}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-2xl">
                    <p className="text-sm text-gray-600">This Week</p>
                    <p className="text-2xl font-bold text-gray-900">{data.bookings.thisWeek}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-2xl">
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">{data.bookings.thisMonth}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-2xl">
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{data.bookings.byStatus?.COMPLETED || 0}</p>
                  </div>
                </div>
              </div>

              {/* Revenue Analytics */}
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <CurrencyDollarIcon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Revenue Analytics</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-2xl">
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">${data.revenue.total?.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl">
                    <p className="text-sm text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">${data.revenue.thisMonth?.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-teal-50 rounded-2xl">
                    <p className="text-sm text-gray-600">This Week</p>
                    <p className="text-2xl font-bold text-gray-900">${data.revenue.thisWeek?.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Review Analytics */}
              <div className="bg-white rounded-3xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                    <StarIcon className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">Review Analytics</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-yellow-50 rounded-2xl">
                    <p className="text-sm text-gray-600">Total Reviews</p>
                    <p className="text-2xl font-bold text-gray-900">{data.reviews.total}</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-2xl">
                    <p className="text-sm text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold text-gray-900">{data.reviews.averageRating?.toFixed(1)} ⭐</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
