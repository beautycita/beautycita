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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700"
          >
            {/* Header */}
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500 opacity-100"></div>
              <div className="relative z-10 p-8 text-center">
                <CreditCardIcon className="w-16 h-16 text-white mx-auto mb-4" />
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">Get Paid with BeautyCita</h1>
                <p className="text-white/90 text-lg">Set up your payment account to start earning</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                    <BanknotesIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Secure Payments</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Receive payments directly to your bank account through Stripe, trusted by millions
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <ShieldCheckIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Bank-Level Security</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Your financial information is encrypted and protected by industry-leading security
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <CheckCircleIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Fast Setup</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Complete the setup in just a few minutes and start accepting bookings
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-6">
                <div className="flex gap-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-900 dark:text-amber-200 text-sm mb-1">
                      You'll Need:
                    </h4>
                    <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
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
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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

              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700"
          >
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 opacity-100"></div>
              <div className="relative z-10 p-8 text-center">
                <ExclamationTriangleIcon className="w-16 h-16 text-white mx-auto mb-4" />
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">Complete Your Setup</h1>
                <p className="text-white/90 text-lg">Finish setting up your payment account</p>
              </div>
            </div>

            <div className="p-8">
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  {status.detailsSubmitted ? (
                    <CheckCircleIcon className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-red-500" />
                  )}
                  <span className="text-gray-700 dark:text-gray-300">Business details submitted</span>
                </div>
                <div className="flex items-center gap-3">
                  {status.chargesEnabled ? (
                    <CheckCircleIcon className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-red-500" />
                  )}
                  <span className="text-gray-700 dark:text-gray-300">Charges enabled</span>
                </div>
                <div className="flex items-center gap-3">
                  {status.payoutsEnabled ? (
                    <CheckCircleIcon className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-red-500" />
                  )}
                  <span className="text-gray-700 dark:text-gray-300">Payouts enabled</span>
                </div>
              </div>

              {status.requirements && status.requirements.currently_due.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-4 mb-6">
                  <h4 className="font-semibold text-red-900 dark:text-red-200 text-sm mb-2">
                    Required Information:
                  </h4>
                  <ul className="text-sm text-red-800 dark:text-red-300 space-y-1">
                    {status.requirements.currently_due.map((req) => (
                      <li key={req}>• {req.replace(/_/g, ' ')}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={continueOnboarding}
                disabled={processing}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold py-4 px-6 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700"
        >
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-100"></div>
            <div className="relative z-10 p-8 text-center">
              <CheckCircleIcon className="w-16 h-16 text-white mx-auto mb-4" />
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2">You're All Set!</h1>
              <p className="text-white/90 text-lg">Your payment account is fully configured</p>
            </div>
          </div>

          <div className="p-8">
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-6 h-6 text-emerald-500" />
                <span className="text-gray-700 dark:text-gray-300">Ready to accept payments</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-6 h-6 text-emerald-500" />
                <span className="text-gray-700 dark:text-gray-300">Payouts enabled</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircleIcon className="w-6 h-6 text-emerald-500" />
                <span className="text-gray-700 dark:text-gray-300">Account verified</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={goToDashboard}
                disabled={processing}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Stripe Dashboard
              </button>
              <button
                onClick={() => navigate('/dashboard/stylist')}
                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-semibold py-3 px-6 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
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
