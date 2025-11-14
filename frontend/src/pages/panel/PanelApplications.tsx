import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import {
  UserIcon,
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || ''

interface UsernameChangeRequest {
  id: number
  user_id: number
  current_username: string
  requested_username: string
  reason: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reviewed_by: number | null
  reviewed_at: string | null
  review_notes: string | null
  created_at: string
  email: string
  name: string
  first_name: string | null
  last_name: string | null
  role: string
  reviewer_email: string | null
  reviewer_name: string | null
}

export default function PanelApplications() {
  const { token } = useAuthStore()
  const [requests, setRequests] = useState<UsernameChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<UsernameChangeRequest | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [filterStatus, setFilterStatus] = useState<'PENDING' | 'ALL'>('PENDING')

  useEffect(() => {
    fetchRequests()
  }, [filterStatus])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const params = filterStatus === 'PENDING' ? '?status=PENDING' : ''
      const response = await axios.get(`${API_URL}/api/admin/username-change-requests${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRequests(response.data.requests || [])
    } catch (error) {
      console.error('Failed to fetch username change requests:', error)
      toast.error('Failed to load requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: number) => {
    if (!confirm('Approve this username change request?')) return

    try {
      await axios.post(
        `${API_URL}/api/admin/username-change-requests/${requestId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Username change approved')
      fetchRequests()
      setSelectedRequest(null)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve request')
    }
  }

  const handleReject = async (requestId: number) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      await axios.post(
        `${API_URL}/api/admin/username-change-requests/${requestId}/reject`,
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success('Username change rejected')
      fetchRequests()
      setSelectedRequest(null)
      setRejectionReason('')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject request')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/panel"
                className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white transition-all"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500 bg-clip-text text-transparent">
                  Username Change Requests
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Review and manage username change requests from users
                </p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('PENDING')}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  filterStatus === 'PENDING'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                    : 'bg-white/80 text-gray-600 hover:bg-white'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  filterStatus === 'ALL'
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                    : 'bg-white/80 text-gray-600 hover:bg-white'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
          )}

          {/* Empty State */}
          {!loading && requests.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 text-center shadow-xl"
            >
              <UserIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No {filterStatus === 'PENDING' ? 'Pending' : ''} Requests
              </h3>
              <p className="text-gray-500">
                {filterStatus === 'PENDING'
                  ? 'There are no pending username change requests at this time.'
                  : 'No username change requests have been submitted yet.'}
              </p>
            </motion.div>
          )}

          {/* Requests List */}
          {!loading && requests.length > 0 && (
            <div className="space-y-4">
              {requests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* User Info */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600">
                          <UserIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.first_name && request.last_name
                              ? `${request.first_name} ${request.last_name}`
                              : request.name}
                          </h3>
                          <p className="text-sm text-gray-500">{request.email}</p>
                        </div>
                        <span className={`ml-4 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(request.status)}`}>
                          {request.status}
                        </span>
                      </div>

                      {/* Username Change Details */}
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Current Username</p>
                          <p className="font-mono font-semibold text-gray-900">
                            {request.current_username || '(not set)'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Requested Username</p>
                          <p className="font-mono font-semibold text-pink-600">
                            {request.requested_username}
                          </p>
                        </div>
                      </div>

                      {/* Reason */}
                      {request.reason && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-500 mb-1">Reason</p>
                          <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">
                            {request.reason}
                          </p>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>Requested {formatDate(request.created_at)}</span>
                        </div>
                        {request.reviewed_at && (
                          <div>
                            Reviewed by {request.reviewer_name || 'Admin'} on {formatDate(request.reviewed_at)}
                          </div>
                        )}
                      </div>

                      {/* Review Notes */}
                      {request.review_notes && (
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-1">Admin Notes</p>
                          <p className="text-sm text-gray-700 bg-blue-50 rounded-xl p-3">
                            {request.review_notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions (only for pending requests) */}
                    {request.status === 'PENDING' && (
                      <div className="ml-6 flex flex-col gap-2">
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="px-6 py-3 rounded-full bg-green-500 text-white font-medium hover:bg-green-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                        >
                          <CheckIcon className="w-5 h-5" />
                          Approve
                        </button>
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="px-6 py-3 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                        >
                          <XMarkIcon className="w-5 h-5" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Reject Username Change
            </h3>
            <p className="text-gray-600 mb-2">
              User: <span className="font-semibold">{selectedRequest.email}</span>
            </p>
            <p className="text-gray-600 mb-4">
              Requested: <span className="font-mono font-semibold text-pink-600">{selectedRequest.requested_username}</span>
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejection..."
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-300 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 mb-4"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedRequest(null)
                  setRejectionReason('')
                }}
                className="flex-1 px-6 py-3 rounded-full bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedRequest.id)}
                className="flex-1 px-6 py-3 rounded-full bg-red-500 text-white font-medium hover:bg-red-600 transition-all shadow-lg"
              >
                Reject Request
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
