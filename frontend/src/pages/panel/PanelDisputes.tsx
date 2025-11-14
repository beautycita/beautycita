import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import {
  ScaleIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || ''

interface Dispute {
  id: number
  booking_id: number
  complainant_name: string
  respondent_name: string
  reason: string
  description: string
  status: string
  created_at: string
}

export default function PanelDisputes() {
  const { token } = useAuthStore()
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    fetchDisputes()
  }, [statusFilter])

  const fetchDisputes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.append('status', statusFilter)

      const response = await axios.get(`${API_URL}/api/admin/disputes?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setDisputes(response.data.disputes || [])
    } catch (error) {
      console.error('Failed to fetch disputes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      OPEN: 'bg-red-100 text-red-800',
      IN_REVIEW: 'bg-yellow-100 text-yellow-800',
      RESOLVED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800'
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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                Disputes Management
              </h1>
              <p className="mt-2 text-gray-600">{disputes.length} active disputes</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg p-6">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {loading ? (
            <div className="bg-white rounded-3xl shadow-lg p-12 text-center text-gray-500">
              Loading disputes...
            </div>
          ) : disputes.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
              <ScaleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No disputes found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {disputes.map((dispute) => (
                <motion.div
                  key={dispute.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">Dispute #{dispute.id}</h3>
                      <p className="text-sm text-gray-500">Booking #{dispute.booking_id}</p>
                    </div>
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(dispute.status)}`}>
                      {dispute.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Complainant</p>
                      <p className="font-medium text-gray-900">{dispute.complainant_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Respondent</p>
                      <p className="font-medium text-gray-900">{dispute.respondent_name}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Reason: {dispute.reason}</p>
                    <p className="text-sm text-gray-600">{dispute.description}</p>
                  </div>
                  <p className="text-xs text-gray-400">Filed {new Date(dispute.created_at).toLocaleString()}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
