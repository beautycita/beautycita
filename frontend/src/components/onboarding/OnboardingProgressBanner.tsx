import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircleIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface OnboardingStatus {
  clientOnboardingComplete: boolean
  stylistApplicationSubmitted: boolean
  stylistApplicationStatus: 'pending' | 'approved' | 'rejected' | null
}

export default function OnboardingProgressBanner() {
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [isDismissed, setIsDismissed] = useState(false)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchOnboardingStatus()

    // Check if banner was dismissed in this session
    const dismissed = sessionStorage.getItem('onboardingBannerDismissed')
    if (dismissed === 'true') {
      setIsDismissed(true)
    }
  }, [])

  const fetchOnboardingStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await axios.get(`${API_URL}/api/user/onboarding-status`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setStatus(response.data.status)
      }
    } catch (error) {
      console.error('Failed to fetch onboarding status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    sessionStorage.setItem('onboardingBannerDismissed', 'true')
  }

  if (loading || !status || isDismissed) return null

  // Don't show if client onboarding not complete
  if (!status.clientOnboardingComplete) return null

  // Don't show if stylist application already approved
  if (status.stylistApplicationStatus === 'approved') return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative"
      >
        {/* Client Onboarding Complete + Become a Stylist CTA */}
        {!status.stylistApplicationSubmitted && (
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-6 shadow-lg">
            <div className="max-w-7xl mx-auto">
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <SparklesIcon className="h-7 w-7 text-white" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircleIcon className="h-5 w-5 text-white" />
                    <h3 className="text-lg font-bold text-white">
                      Client Onboarding Complete!
                    </h3>
                  </div>

                  <p className="text-white/90 mb-4 text-sm md:text-base">
                    Ready to take the next step? Start earning by offering your beauty services on BeautyCita.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      to="/stylist-application"
                      className="inline-flex items-center justify-center px-6 py-3 bg-white text-purple-600 font-semibold rounded-full hover:bg-gray-100 transition-all duration-200 shadow-lg"
                    >
                      <SparklesIcon className="h-5 w-5 mr-2" />
                      Become a Stylist
                    </Link>

                    <button
                      onClick={handleDismiss}
                      className="inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 transition-all duration-200"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Application Submitted - Pending Review */}
        {status.stylistApplicationSubmitted && status.stylistApplicationStatus === 'pending' && (
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 shadow-lg">
            <div className="max-w-7xl mx-auto">
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">
                    Application Under Review
                  </h3>

                  <p className="text-white/90 mb-3 text-sm md:text-base">
                    Thank you for applying! Our team is reviewing your stylist application.
                    You'll hear from us within 24-48 hours.
                  </p>

                  <div className="bg-white/10 rounded-lg p-3 text-white/80 text-sm">
                    <p>💡 <strong>Tip:</strong> Make sure your profile is complete and portfolio looks great to speed up approval!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Application Rejected */}
        {status.stylistApplicationStatus === 'rejected' && (
          <div className="bg-gradient-to-r from-red-600 to-pink-600 p-6 shadow-lg">
            <div className="max-w-7xl mx-auto">
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">
                    Application Update Required
                  </h3>

                  <p className="text-white/90 mb-4 text-sm md:text-base">
                    We reviewed your application and need more information. Please check your messages for details.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      to="/messages"
                      className="inline-flex items-center justify-center px-6 py-3 bg-white text-red-600 font-semibold rounded-full hover:bg-gray-100 transition-all duration-200 shadow-lg"
                    >
                      View Messages
                    </Link>

                    <Link
                      to="/stylist-application"
                      className="inline-flex items-center justify-center px-6 py-3 bg-white/10 text-white font-semibold rounded-full hover:bg-white/20 transition-all duration-200"
                    >
                      Update Application
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
