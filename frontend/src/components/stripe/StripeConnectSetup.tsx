import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../hooks/useAuth'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

interface StripeConnectSetupProps {
  stylistId: number
}

interface AccountStatus {
  hasAccount: boolean
  accountId?: string
  chargesEnabled?: boolean
  payoutsEnabled?: boolean
  detailsSubmitted?: boolean
  needsOnboarding: boolean
  requirements?: any
}

export default function StripeConnectSetup({ stylistId }: StripeConnectSetupProps) {
  const { token, user } = useAuth()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkAccountStatus()
  }, [stylistId])

  const checkAccountStatus = async () => {
    if (!token || !stylistId) return

    setChecking(true)
    try {
      const response = await fetch(
        `https://beautycita.com/api/stripe-connect/account-status/${stylistId}?userId=${stylistId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      const data = await response.json()
      if (data.success) {
        setAccountStatus(data)
      }
    } catch (error) {
      console.error('Failed to check account status:', error)
      toast.error(t('stripe.errors.checkingStatus'))
    } finally {
      setChecking(false)
    }
  }

  const createAccount = async () => {
    if (!token || !stylistId) return

    setLoading(true)
    try {
      // Get user email from auth store or pass it
      const createResponse = await fetch(
        'https://beautycita.com/api/stripe-connect/create-account',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            stylistId,
            email: user?.email || 'stylist@email.com',
            userId: stylistId
          })
        }
      )

      const createData = await createResponse.json()
      if (createData.success) {
        toast.success(t('stripe.success.accountCreated'))
        // Now generate onboarding link
        await startOnboarding()
      } else {
        throw new Error(createData.message)
      }
    } catch (error: any) {
      console.error('Failed to create account:', error)
      toast.error(error.message || t('stripe.errors.createAccount'))
    } finally {
      setLoading(false)
    }
  }

  const startOnboarding = async () => {
    if (!token || !stylistId) return

    setLoading(true)
    try {
      const response = await fetch(
        'https://beautycita.com/api/stripe-connect/onboarding-link',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            stylistId,
            userId: stylistId
          })
        }
      )

      const data = await response.json()
      if (data.success) {
        // Redirect to Stripe onboarding
        window.location.href = data.url
      } else {
        throw new Error(data.message)
      }
    } catch (error: any) {
      console.error('Failed to generate onboarding link:', error)
      toast.error(error.message || t('stripe.errors.startOnboarding'))
      setLoading(false)
    }
  }

  const openDashboard = async () => {
    if (!token || !stylistId) return

    setLoading(true)
    try {
      const response = await fetch(
        'https://beautycita.com/api/stripe-connect/dashboard-link',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            stylistId,
            userId: stylistId
          })
        }
      )

      const data = await response.json()
      if (data.success) {
        window.open(data.url, '_blank')
      } else {
        throw new Error(data.message)
      }
    } catch (error: any) {
      console.error('Failed to generate dashboard link:', error)
      toast.error(error.message || t('stripe.errors.openDashboard'))
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="bg-white rounded-full shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600">{t('stripe.setup.checkingStatus')}</span>
        </div>
      </div>
    )
  }

  // Not set up yet
  if (!accountStatus?.hasAccount) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-full shadow-md p-6"
      >
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <BanknotesIcon className="h-12 w-12 text-yellow-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('stripe.setup.title')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('stripe.setup.description')}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-full p-4 mb-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">{t('stripe.setup.whyStripe')}</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>{t('stripe.setup.benefit1')}</li>
                <li>{t('stripe.setup.benefit2')}</li>
                <li>{t('stripe.setup.benefit3')}</li>
                <li>{t('stripe.setup.benefit4')}</li>
              </ul>
            </div>
            <button
              onClick={createAccount}
              disabled={loading}
              className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 rounded-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{t('stripe.setup.settingUp')}</span>
                </>
              ) : (
                <>
                  <CreditCardIcon className="h-5 w-5" />
                  <span>{t('stripe.setup.setupButton')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  // Onboarding incomplete
  if (accountStatus.needsOnboarding) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-full shadow-md p-6"
      >
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t('stripe.setup.completeTitle')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('stripe.setup.completeDescription')}
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-full p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>{t('stripe.setup.actionRequired')}</strong> {t('stripe.setup.onboardingNote')}
              </p>
            </div>
            <button
              onClick={startOnboarding}
              disabled={loading}
              className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 rounded-full"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{t('stripe.setup.loading')}</span>
                </>
              ) : (
                <>
                  <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                  <span>{t('stripe.setup.continueButton')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  // Fully set up
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-full shadow-md p-6"
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <CheckCircleIcon className="h-12 w-12 text-green-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('stripe.setup.activeTitle')}
          </h3>
          <p className="text-gray-600 mb-4">
            {t('stripe.setup.activeDescription')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 border border-green-200 rounded-full p-3">
              <p className="text-xs text-green-600 font-medium mb-1">{t('stripe.setup.paymentsLabel')}</p>
              <div className="flex items-center space-x-2">
                {accountStatus.chargesEnabled ? (
                  <>
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">{t('stripe.setup.enabled')}</span>
                  </>
                ) : (
                  <>
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">{t('stripe.setup.pending')}</span>
                  </>
                )}
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-full p-3">
              <p className="text-xs text-green-600 font-medium mb-1">{t('stripe.setup.payoutsLabel')}</p>
              <div className="flex items-center space-x-2">
                {accountStatus.payoutsEnabled ? (
                  <>
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">{t('stripe.setup.enabled')}</span>
                  </>
                ) : (
                  <>
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">{t('stripe.setup.pending')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={openDashboard}
            disabled={loading}
            className="btn btn-outline flex items-center space-x-2 disabled:opacity-50 rounded-full"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                <span>{t('stripe.setup.loading')}</span>
              </>
            ) : (
              <>
                <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                <span>{t('stripe.setup.openDashboard')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
