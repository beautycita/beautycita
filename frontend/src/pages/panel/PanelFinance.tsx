import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import {
  CurrencyDollarIcon,
  ArrowLeftIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || ''

interface FinanceStats {
  totalRevenue: number
  monthlyRevenue: number
  weeklyRevenue: number
  pendingPayouts: number
  completedPayouts: number
}

interface Payout {
  id: number
  stylist_name: string
  amount: number
  status: string
  created_at: string
}

export default function PanelFinance() {
  const { token } = useAuthStore()
  const [stats, setStats] = useState<FinanceStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    pendingPayouts: 0,
    completedPayouts: 0
  })
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFinanceData()
  }, [])

  const fetchFinanceData = async () => {
    try {
      setLoading(true)
      const [statsRes, payoutsRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/finance/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/admin/payouts`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])

      setStats(statsRes.data)
      setPayouts(payoutsRes.data.payouts || [])
    } catch (error) {
      console.error('Failed to fetch finance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprovePayout = async (payoutId: number) => {
    try {
      await axios.post(
        `${API_URL}/api/admin/payouts/${payoutId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchFinanceData()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to approve payout')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
                Finance Dashboard
              </h1>
              <p className="mt-2 text-gray-600">Revenue and payouts management</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-lg p-6 text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <CurrencyDollarIcon className="w-8 h-8" />
                <ArrowTrendingUpIcon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
              <p className="text-3xl font-bold mt-2">${stats.totalRevenue?.toFixed(2)}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-3xl shadow-lg p-6 text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <BanknotesIcon className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-medium opacity-90">This Month</h3>
              <p className="text-3xl font-bold mt-2">${stats.monthlyRevenue?.toFixed(2)}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl shadow-lg p-6 text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <BanknotesIcon className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-medium opacity-90">This Week</h3>
              <p className="text-3xl font-bold mt-2">${stats.weeklyRevenue?.toFixed(2)}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl shadow-lg p-6 text-white"
            >
              <div className="flex items-center justify-between mb-2">
                <BanknotesIcon className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-medium opacity-90">Pending Payouts</h3>
              <p className="text-3xl font-bold mt-2">{stats.pendingPayouts || 0}</p>
            </motion.div>
          </div>

          {/* Payouts Table */}
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Payouts</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stylist</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        Loading payouts...
                      </td>
                    </tr>
                  ) : payouts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No payouts found
                      </td>
                    </tr>
                  ) : (
                    payouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{payout.stylist_name}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">${payout.amount?.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(payout.status)}`}>
                            {payout.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(payout.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {payout.status === 'PENDING' && (
                            <button
                              onClick={() => handleApprovePayout(payout.id)}
                              className="text-sm font-medium text-green-600 hover:text-green-900"
                            >
                              Approve
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
