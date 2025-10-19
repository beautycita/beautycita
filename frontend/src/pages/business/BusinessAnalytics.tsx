import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import { ChartBarIcon, ArrowTrendingUpIcon, UserGroupIcon, StarIcon } from '@heroicons/react/24/outline'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export default function BusinessAnalytics() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
        <p className="text-gray-600">Insights into your business performance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard title="Total Bookings" value="0" icon={ChartBarIcon} color="from-blue-500 to-cyan-500" trend="+0%" />
        <AnalyticsCard title="Revenue Growth" value="$0" icon={ArrowTrendingUpIcon} color="from-purple-500 to-pink-500" trend="+0%" />
        <AnalyticsCard title="New Clients" value="0" icon={UserGroupIcon} color="from-green-500 to-emerald-500" trend="+0%" />
        <AnalyticsCard title="Avg Rating" value="0.0" icon={StarIcon} color="from-yellow-500 to-orange-500" trend="+0.0" />
      </div>

      <div className="bg-white rounded-3xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Revenue Chart</h2>
        <div className="h-64 flex items-center justify-center text-gray-500">
          Chart visualization coming soon...
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Services</h2>
          <div className="space-y-4">
            <p className="text-center text-gray-500 py-8">No data available yet</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Booking Trends</h2>
          <div className="space-y-4">
            <p className="text-center text-gray-500 py-8">No data available yet</p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface AnalyticsCardProps {
  title: string
  value: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  color: string
  trend: string
}

function AnalyticsCard({ title, value, icon: Icon, color, trend }: AnalyticsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-3xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 bg-gradient-to-br ${color} rounded-2xl`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        <span className="text-sm font-medium text-green-600">{trend}</span>
      </div>
      <p className="text-sm text-gray-500 mb-2">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </motion.div>
  )
}
