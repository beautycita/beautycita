import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import { CurrencyDollarIcon, ArrowTrendingUpIcon, CalendarDaysIcon, CreditCardIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || ''

interface EarningsStats {
  today: number
  week: number
  month: number
  year: number
  pending: number
  paid: number
}

export default function BusinessEarnings() {
  const { token } = useAuthStore()
  const [stats, setStats] = useState<EarningsStats>({
    today: 0,
    week: 0,
    month: 0,
    year: 0,
    pending: 0,
    paid: 0
  })
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    fetchEarnings()
  }, [])

  const fetchEarnings = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/stylists/earnings`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setStats(response.data.earnings || stats)
      }
    } catch (error) {
      console.error('Failed to fetch earnings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRequestPayout = async () => {
    if (stats.pending === 0) {
      toast.error('No pending balance to payout')
      return
    }

    try {
      setRequesting(true)
      
      const response = await axios.post(
        `${API_URL}/api/stylists/request-payout`,
        { amount: stats.pending },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        toast.success('Payout request submitted successfully!')
        fetchEarnings() // Refresh earnings
      }
    } catch (error: any) {
      console.error('Failed to request payout:', error)
      toast.error(error.response?.data?.message || 'Failed to request payout')
    } finally {
      setRequesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Earnings</h1>
        <p className="text-gray-600">Track your revenue and payouts</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <EarningsCard title="Today" value={stats.today} icon={CalendarDaysIcon} color="from-blue-500 to-cyan-500" />
        <EarningsCard title="This Week" value={stats.week} icon={ArrowTrendingUpIcon} color="from-purple-500 to-pink-500" />
        <EarningsCard title="This Month" value={stats.month} icon={CurrencyDollarIcon} color="from-green-500 to-emerald-500" />
        <EarningsCard title="This Year" value={stats.year} icon={CreditCardIcon} color="from-orange-500 to-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending Payouts</h2>
          <div className="text-center py-8">
            <p className="text-5xl font-bold text-yellow-600 mb-2">${stats.pending.toFixed(2)}</p>
            <p className="text-gray-600">Available for payout</p>
            <button 
              onClick={handleRequestPayout}
              disabled={requesting || stats.pending === 0}
              className="mt-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {requesting ? 'Processing...' : 'Request Payout'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Paid Out</h2>
          <div className="text-center py-8">
            <p className="text-5xl font-bold text-green-600 mb-2">${stats.paid.toFixed(2)}</p>
            <p className="text-gray-600">Total received</p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface EarningsCardProps {
  title: string
  value: number
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  color: string
}

function EarningsCard({ title, value, icon: Icon, color }: EarningsCardProps) {
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
      </div>
      <p className="text-sm text-gray-500 mb-2">{title}</p>
      <p className="text-3xl font-bold text-gray-900">${value.toFixed(2)}</p>
    </motion.div>
  )
}
