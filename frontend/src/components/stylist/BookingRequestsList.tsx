import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  BellAlertIcon
} from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface BookingRequest {
  id: number
  client_id: number
  client_name: string
  client_phone: string
  stylist_id: number
  service_id: number
  service_name: string
  service_category: string
  requested_date: string
  requested_time: string
  duration_minutes: number
  total_price: string
  notes: string
  status: string
  created_at: string
  expires_at: string
  auto_book_window_ends_at: string
  stylist_responded_at: string | null
  stylist_response: string | null
}

interface BookingRequestsListProps {
  token: string
}

export default function BookingRequestsList({ token }: BookingRequestsListProps) {
  const [requests, setRequests] = useState<BookingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState<number | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [showDeclineModal, setShowDeclineModal] = useState<number | null>(null)

  useEffect(() => {
    fetchRequests()
    // Poll for new requests every 15 seconds
    const interval = setInterval(fetchRequests, 15000)
    return () => clearInterval(interval)
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/booking-requests/my-requests`, {
        params: { status: 'pending' },
        headers: { Authorization: `Bearer ${token}` }
      })
      setRequests(response.data.requests)
    } catch (error) {
      console.error('Failed to fetch booking requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const respondToRequest = async (requestId: number, response: 'accept' | 'decline') => {
    setResponding(requestId)
    try {
      const payload: any = { response }
      if (response === 'decline' && declineReason) {
        payload.declineReason = declineReason
      }

      const result = await axios.post(
        `${API_URL}/api/booking-requests/${requestId}/respond`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response === 'accept') {
        if (result.data.newStatus === 'auto_booked') {
          toast.success('🎉 Booking automatically confirmed!')
        } else {
          toast.success('✅ Booking request accepted! Awaiting client confirmation.')
        }
      } else {
        toast.success('Request declined')
      }

      setShowDeclineModal(null)
      setDeclineReason('')
      await fetchRequests()
    } catch (error: any) {
      console.error('Failed to respond to booking request:', error)
      toast.error(error.response?.data?.message || 'Failed to respond to request')
    } finally {
      setResponding(null)
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    const minutes = Math.floor(diff / 1000 / 60)

    if (minutes < 0) return 'Expired'
    if (minutes < 1) return 'Less than 1 min'
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMins = minutes % 60
    return `${hours}h ${remainingMins}m`
  }

  const isInAutoBookWindow = (autoBookWindowEndsAt: string) => {
    return new Date() <= new Date(autoBookWindowEndsAt)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-6">
        <div className="flex items-center justify-center py-8">
          <ClockIcon className="h-8 w-8 text-purple-600 animate-spin" />
        </div>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
        <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No Pending Requests</h3>
        <p className="text-sm text-gray-600">
          You're all caught up! New booking requests will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BellAlertIcon className="h-6 w-6 text-purple-600" />
          Booking Requests
          {requests.length > 0 && (
            <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-full">
              {requests.length}
            </span>
          )}
        </h2>
      </div>

      <AnimatePresence>
        {requests.map((request, index) => {
          const inAutoBookWindow = isInAutoBookWindow(request.auto_book_window_ends_at)
          const timeRemaining = getTimeRemaining(request.expires_at)

          return (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Request Header */}
              <div className={`p-4 ${inAutoBookWindow ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-purple-500 to-pink-600'} text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserCircleIcon className="h-8 w-8" />
                    <div>
                      <h3 className="font-semibold">{request.client_name}</h3>
                      <p className="text-xs text-white/80">{request.client_phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    {inAutoBookWindow && (
                      <div className="flex items-center gap-1 bg-white/20 rounded-lg px-2 py-1 backdrop-blur-sm mb-1">
                        <SparklesIcon className="h-3 w-3" />
                        <span className="text-xs font-semibold">Auto-Book Window</span>
                      </div>
                    )}
                    <div className="text-xs font-medium">
                      Expires: {timeRemaining}
                    </div>
                  </div>
                </div>
              </div>

              {/* Request Details */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <CalendarDaysIcon className="h-4 w-4" />
                      Date & Time
                    </div>
                    <div className="font-semibold text-gray-900">
                      {new Date(request.requested_date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-700">{request.requested_time}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <ClockIcon className="h-4 w-4" />
                      Duration
                    </div>
                    <div className="font-semibold text-gray-900">
                      {request.duration_minutes} minutes
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-1">Service</div>
                  <div className="font-semibold text-gray-900">{request.service_name}</div>
                  <div className="text-sm text-gray-600">{request.service_category}</div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-1">Total Price</div>
                  <div className="text-2xl font-bold text-purple-600">
                    ${parseFloat(request.total_price).toFixed(2)}
                  </div>
                </div>

                {request.notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-600 mb-1">Client Notes:</div>
                    <div className="text-sm text-gray-900">{request.notes}</div>
                  </div>
                )}

                {inAutoBookWindow && (
                  <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      ⚡ Accept within {getTimeRemaining(request.auto_book_window_ends_at)} for instant confirmation!
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => respondToRequest(request.id, 'accept')}
                    disabled={responding === request.id}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {responding === request.id ? (
                      <ClockIcon className="h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircleIcon className="h-5 w-5" />
                    )}
                    Accept
                  </button>
                  <button
                    onClick={() => setShowDeclineModal(request.id)}
                    disabled={responding === request.id}
                    className="flex-1 px-6 py-3 border-2 border-red-500 text-red-600 rounded-2xl font-bold hover:bg-red-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircleIcon className="h-5 w-5" />
                    Decline
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {/* Decline Modal */}
      <AnimatePresence>
        {showDeclineModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeclineModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Decline Booking Request</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for declining (optional):
              </p>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
                placeholder="E.g., Fully booked, out of town, etc."
                rows={3}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => respondToRequest(showDeclineModal, 'decline')}
                  disabled={responding !== null}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50"
                >
                  {responding === showDeclineModal ? 'Declining...' : 'Confirm Decline'}
                </button>
                <button
                  onClick={() => {
                    setShowDeclineModal(null)
                    setDeclineReason('')
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
