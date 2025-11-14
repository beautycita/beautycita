import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import {
  UserIcon,
  CheckIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ClockIcon,
  EnvelopeIcon,
  MapPinIcon,
  CreditCardIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import { toast } from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || ''

interface StylistApplication {
  user_id: number
  name: string
  email: string
  username: string
  created_at: string
  updated_at: string
  business_name: string
  bio: string
  specialties: string[]
  experience_years: number
  location_address: string
  location_city: string
  location_state: string
  location_latitude: number
  location_longitude: number
  portfolio_images: string[]
  stripe_account_id: string | null
  stripe_onboarding_complete: boolean
  rating_average: number
  total_bookings: number
}

export default function PanelStylistApplications() {
  const { token } = useAuthStore()
  const [applications, setApplications] = useState<StylistApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<StylistApplication | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/admin/stylist-applications`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setApplications(response.data.applications || [])
    } catch (error) {
      console.error('Failed to fetch stylist applications:', error)
      toast.error('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId: number, username: string) => {
    if (!confirm(`Approve stylist application for ${username}?`)) return

    try {
      setActionLoading(true)
      await axios.post(
        `${API_URL}/api/admin/stylist-applications/${userId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`${username} approved as stylist!`)
      fetchApplications()
      setSelectedApplication(null)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to approve application')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (userId: number, username: string) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    if (!confirm(`Reject stylist application for ${username}?`)) return

    try {
      setActionLoading(true)
      await axios.post(
        `${API_URL}/api/admin/stylist-applications/${userId}/reject`,
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(`${username} application rejected`)
      fetchApplications()
      setSelectedApplication(null)
      setRejectionReason('')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reject application')
    } finally {
      setActionLoading(false)
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
                  Stylist Applications
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Review and approve pending stylist applications
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg px-6 py-3">
              <div className="text-sm text-gray-600">Pending Applications</div>
              <div className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                {applications.length}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading applications...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && applications.length === 0 && (
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-12 text-center">
              <UserIcon className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Pending Applications</h3>
              <p className="text-gray-600">All stylist applications have been reviewed</p>
            </div>
          )}

          {/* Applications List */}
          {!loading && applications.length > 0 && (
            <div className="grid gap-6">
              {applications.map((app) => (
                <motion.div
                  key={app.user_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                          {app.name?.charAt(0) || app.username?.charAt(0) || '?'}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{app.business_name}</h3>
                          <p className="text-gray-600">@{app.username}</p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                            <ClockIcon className="w-4 h-4" />
                            Applied {formatDate(app.created_at)}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedApplication(selectedApplication?.user_id === app.user_id ? null : app)}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-all"
                        >
                          {selectedApplication?.user_id === app.user_id ? 'Hide Details' : 'View Details'}
                        </button>
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <EnvelopeIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{app.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPinIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{app.location_city || 'Unknown'}, {app.location_state || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{app.experience_years} years experience</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCardIcon className="w-4 h-4 text-gray-400" />
                        <span className={app.stripe_onboarding_complete ? 'text-green-600 font-medium' : 'text-red-600'}>
                          {app.stripe_onboarding_complete ? 'Stripe Complete' : 'Stripe Incomplete'}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedApplication?.user_id === app.user_id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="border-t pt-4 mt-4 space-y-4"
                      >
                        {/* Bio */}
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">Bio</h4>
                          <p className="text-gray-700 text-sm">{app.bio || 'No bio provided'}</p>
                        </div>

                        {/* Specialties */}
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">Specialties</h4>
                          <div className="flex flex-wrap gap-2">
                            {app.specialties && app.specialties.length > 0 ? (
                              app.specialties.map((specialty, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                                >
                                  {specialty}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500 text-sm">No specialties listed</span>
                            )}
                          </div>
                        </div>

                        {/* Portfolio */}
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <PhotoIcon className="w-5 h-5" />
                            Portfolio ({app.portfolio_images?.length || 0} images)
                          </h4>
                          {app.portfolio_images && app.portfolio_images.length > 0 ? (
                            <div className="grid grid-cols-4 gap-2">
                              {app.portfolio_images.slice(0, 4).map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`Portfolio ${idx + 1}`}
                                  className="w-full h-24 object-cover rounded-xl"
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No portfolio images</p>
                          )}
                        </div>

                        {/* Address */}
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">Business Location</h4>
                          <p className="text-gray-700 text-sm">{app.location_address || 'No address provided'}</p>
                        </div>

                        {/* Validation Warnings */}
                        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4">
                          <h4 className="font-bold text-yellow-900 mb-2">Validation Checklist</h4>
                          <div className="space-y-2 text-sm">
                            <div className={`flex items-center gap-2 ${app.bio && app.bio.length >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                              {app.bio && app.bio.length >= 50 ? <CheckIcon className="w-4 h-4" /> : <XMarkIcon className="w-4 h-4" />}
                              <span>Bio (min 50 chars): {app.bio?.length || 0}/50</span>
                            </div>
                            <div className={`flex items-center gap-2 ${app.specialties && app.specialties.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {app.specialties && app.specialties.length > 0 ? <CheckIcon className="w-4 h-4" /> : <XMarkIcon className="w-4 h-4" />}
                              <span>At least one specialty</span>
                            </div>
                            <div className={`flex items-center gap-2 ${app.portfolio_images && app.portfolio_images.length > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {app.portfolio_images && app.portfolio_images.length > 0 ? <CheckIcon className="w-4 h-4" /> : <XMarkIcon className="w-4 h-4" />}
                              <span>At least one portfolio image</span>
                            </div>
                            <div className={`flex items-center gap-2 ${app.stripe_onboarding_complete ? 'text-green-600' : 'text-red-600'}`}>
                              {app.stripe_onboarding_complete ? <CheckIcon className="w-4 h-4" /> : <XMarkIcon className="w-4 h-4" />}
                              <span>Stripe onboarding complete</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4">
                          <button
                            onClick={() => handleApprove(app.user_id, app.username)}
                            disabled={actionLoading}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-3 px-6 rounded-2xl hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <CheckIcon className="w-5 h-5" />
                            Approve Application
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Enter rejection reason:')
                              if (reason) {
                                setRejectionReason(reason)
                                setTimeout(() => handleReject(app.user_id, app.username), 100)
                              }
                            }}
                            disabled={actionLoading}
                            className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold py-3 px-6 rounded-2xl hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <XMarkIcon className="w-5 h-5" />
                            Reject Application
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
