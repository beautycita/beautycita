import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircleIcon,
  XCircleIcon,
  BanknotesIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface AccountStatus {
  hasStripeAccount: boolean
  chargesEnabled: boolean
  detailsSubmitted: boolean
  payoutsEnabled: boolean
  accountId?: string
  requirements?: {
    currently_due: string[]
    eventually_due: string[]
  }
}

export default function StripeOnboardingPage() {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<AccountStatus | null>(null)
  const [processing, setProcessing] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchAccountStatus()
  }, [])

  const fetchAccountStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/api/stripe-connect/account/status`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setStatus(response.data.data)
    } catch (error: any) {
      console.error('Error fetching Stripe status:', error)
      toast.error('Failed to load account status')
    } finally {
      setLoading(false)
    }
  }

  const startOnboarding = async () => {
    try {
      setProcessing(true)
      const token = localStorage.getItem('token')

      const response = await axios.post(
        `${API_URL}/api/stripe-connect/account/create`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const { url } = response.data

      // Redirect to Stripe onboarding
      window.location.href = url
    } catch (error: any) {
      console.error('Error starting onboarding:', error)
      toast.error(error.response?.data?.message || 'Failed to start onboarding')
      setProcessing(false)
    }
  }

  const continueOnboarding = async () => {
    try {
      setProcessing(true)
      const token = localStorage.getItem('token')

      const response = await axios.post(
        `${API_URL}/api/stripe-connect/account/onboarding-link`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const { url } = response.data

      // Redirect to Stripe onboarding
      window.location.href = url
    } catch (error: any) {
      console.error('Error continuing onboarding:', error)
      toast.error(error.response?.data?.message || 'Failed to continue onboarding')
      setProcessing(false)
    }
  }

  const goToDashboard = async () => {
    try {
      setProcessing(true)
      const token = localStorage.getItem('token')

      const response = await axios.post(
        `${API_URL}/api/stripe-connect/account/dashboard-link`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      const { url } = response.data

      // Open Stripe dashboard in new tab
      window.open(url, '_blank')
    } catch (error: any) {
      console.error('Error opening dashboard:', error)
      toast.error('Failed to open Stripe dashboard')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Not yet onboarded
  if (!status?.hasStripeAccount) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-center">
              <CreditCardIcon className="w-16 h-16 text-white mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">Get Paid with BeautyCita</h1>
              <p className="text-purple-100">Set up your payment account to start earning</p>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-3xl flex items-center justify-center">
                    <BanknotesIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Secure Payments</h3>
                    <p className="text-gray-600 text-sm">
                      Receive payments directly to your bank account through Stripe, trusted by millions
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-3xl flex items-center justify-center">
                    <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Bank-Level Security</h3>
                    <p className="text-gray-600 text-sm">
                      Your financial information is encrypted and protected by industry-leading security
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-3xl flex items-center justify-center">
                    <CheckCircleIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Fast Setup</h3>
                    <p className="text-gray-600 text-sm">
                      Complete the setup in just a few minutes and start accepting bookings
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-4 mb-6">
                <div className="flex gap-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 text-sm mb-1">
                      You'll Need:
                    </h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• Government-issued ID</li>
                      <li>• Social Security Number (or Tax ID)</li>
                      <li>• Bank account information</li>
                      <li>• Business details (if applicable)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <button
                onClick={startOnboarding}
                disabled={processing}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Setting up...</span>
                  </>
                ) : (
                  <>
                    <span>Start Setup</span>
                    <ArrowRightIcon className="w-5 h-5" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500 mt-4">
                Powered by Stripe • Secure & Compliant
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Onboarding incomplete
  if (!status.detailsSubmitted || !status.chargesEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-8 text-center">
              <ExclamationTriangleIcon className="w-16 h-16 text-white mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">Complete Your Setup</h1>
              <p className="text-yellow-100">Finish setting up your payment account</p>
            </div>

            <div className="p-8">
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  {status.detailsSubmitted ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-red-500" />
                  )}
                  <span className="text-gray-700">Business details submitted</span>
                </div>
                <div className="flex items-center gap-3">
                  {status.chargesEnabled ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-red-500" />
                  )}
                  <span className="text-gray-700">Charges enabled</span>
                </div>
                <div className="flex items-center gap-3">
                  {status.payoutsEnabled ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-red-500" />
                  )}
                  <span className="text-gray-700">Payouts enabled</span>
                </div>
              </div>

              {status.requirements && status.requirements.currently_due.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-3xl p-4 mb-6">
                  <h4 className="font-semibold text-red-900 text-sm mb-2">
                    Required Information:
                  </h4>
                  <ul className="text-sm text-red-800 space-y-1">
                    {status.requirements.currently_due.map((req) => (
                      <li key={req}>• {req.replace(/_/g, ' ')}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={continueOnboarding}
                disabled={processing}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold py-4 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span>Continue Setup</span>
                    <ArrowRightIcon className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Fully onboarded
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center">
            <CheckCircleIcon className="w-16 h-16 text-white mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">You're All Set!</h1>
            <p className="text-green-100">Your payment account is fully configured</p>
          </div>

          <div className="p-8">
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
                <span className="text-gray-700">Ready to accept payments</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
                <span className="text-gray-700">Payouts enabled</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-6 h-6 text-green-500" />
                <span className="text-gray-700">Account verified</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={goToDashboard}
                disabled={processing}
                className="bg-purple-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Stripe Dashboard
              </button>
              <button
                onClick={() => navigate('/dashboard/stylist')}
                className="bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-3xl hover:bg-gray-200 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
