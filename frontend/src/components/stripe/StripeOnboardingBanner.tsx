import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
  ExclamationTriangleIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import axios from 'axios'
import toast from 'react-hot-toast'

interface StripeStatus {
  hasAccount: boolean
  accountId?: string
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  needsOnboarding: boolean
  requirements?: any
}

interface Props {
  stylistId: number
  isDarkMode?: boolean
}

export default function StripeOnboardingBanner({ stylistId, isDarkMode = false }: Props) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<StripeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    checkStripeStatus()
  }, [stylistId])

  const checkStripeStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`/api/stripe-connect/account-status/${stylistId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        setStatus(response.data)
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error)
    } finally {
      setLoading(false)
    }
  }

  const createStripeAccount = async () => {
    setCreating(true)
    try {
      const token = localStorage.getItem('token')
      const user = JSON.parse(localStorage.getItem('user') || '{}')

      const response = await axios.post('/api/stripe-connect/create-account', {
        stylistId,
        email: user.email,
        userId: user.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        toast.success(t('stripe.accountCreated') || 'Stripe account created!')
        // Now get the onboarding link
        startOnboarding()
      } else {
        toast.error(response.data.message || 'Failed to create Stripe account')
      }
    } catch (error: any) {
      console.error('Error creating Stripe account:', error)
      toast.error(error.response?.data?.message || 'Failed to create Stripe account')
    } finally {
      setCreating(false)
    }
  }

  const startOnboarding = async () => {
    setRedirecting(true)
    try {
      const token = localStorage.getItem('token')
      const user = JSON.parse(localStorage.getItem('user') || '{}')

      const response = await axios.post('/api/stripe-connect/onboarding-link', {
        stylistId,
        userId: user.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success && response.data.url) {
        // Redirect to Stripe onboarding
        window.location.href = response.data.url
      } else {
        toast.error(response.data.message || 'Failed to generate onboarding link')
        setRedirecting(false)
      }
    } catch (error: any) {
      console.error('Error starting onboarding:', error)
      toast.error(error.response?.data?.message || 'Failed to start onboarding')
      setRedirecting(false)
    }
  }

  if (loading) {
    return (
      <div className={`p-6 rounded-3xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="animate-pulse flex items-center gap-4">
          <div className="h-12 w-12 bg-gray-300 rounded-3xl"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  // If onboarding complete, show success banner
  if (status?.detailsSubmitted && status?.chargesEnabled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-3xl bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg"
      >
        <div className="flex items-center gap-4">
          <CheckCircleIcon className="h-12 w-12 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">
              {t('stripe.onboardingComplete') || 'Payment Setup Complete'}
            </h3>
            <p className="text-white/90">
              {t('stripe.readyToReceive') || 'You can now receive payments from clients'}
            </p>
          </div>
        </div>
      </motion.div>
    )
  }

  // Show onboarding required banner
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-3xl ${
        isDarkMode
          ? 'bg-gradient-to-r from-orange-600 to-red-600'
          : 'bg-gradient-to-r from-orange-500 to-red-500'
      } text-white shadow-lg border-2 border-white/20`}
    >
      <div className="flex items-start gap-4">
        <ExclamationTriangleIcon className="h-12 w-12 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-2xl font-bold mb-2">
            {t('stripe.setupRequired') || 'Payment Setup Required'}
          </h3>
          <p className="text-white/90 mb-4">
            {t('stripe.setupMessage') ||
              'Complete your Stripe onboarding to accept payments from clients. This takes just 5 minutes.'}
          </p>

          {!status?.hasAccount ? (
            <button
              onClick={createStripeAccount}
              disabled={creating || redirecting}
              className="px-6 py-3 bg-white text-orange-600 rounded-3xl font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600" />
                  {t('stripe.creating') || 'Creating Account...'}
                </>
              ) : (
                <>
                  <CreditCardIcon className="h-5 w-5" />
                  {t('stripe.createAccount') || 'Create Stripe Account'}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={startOnboarding}
              disabled={redirecting}
              className="px-6 py-3 bg-white text-orange-600 rounded-3xl font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {redirecting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600" />
                  {t('stripe.redirecting') || 'Redirecting to Stripe...'}
                </>
              ) : (
                <>
                  {t('stripe.completeOnboarding') || 'Complete Onboarding'}
                  <ArrowRightIcon className="h-5 w-5" />
                </>
              )}
            </button>
          )}

          <div className="mt-4 flex items-start gap-2 text-sm text-white/80">
            <CheckCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{t('stripe.whyNeeded') || 'Why is this needed?'}</p>
              <p>{t('stripe.whyNeededDesc') || 'Stripe securely handles all payments and transfers earnings to your bank account.'}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
