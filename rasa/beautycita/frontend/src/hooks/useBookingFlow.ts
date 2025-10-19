import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

export type BookingFlowStep = 'login' | 'verification' | 'booking'

interface UseBookingFlowReturn {
  currentStep: BookingFlowStep
  showPhoneVerification: boolean
  isCheckingAuth: boolean
  checkAuthenticationForBooking: (serviceId?: string) => Promise<boolean>
  proceedToBooking: () => void
  handlePhoneVerificationSuccess: () => void
  closePhoneVerification: () => void
}

export function useBookingFlow(): UseBookingFlowReturn {
  const { user, isAuthenticated, checkAuth } = useAuthStore()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState<BookingFlowStep>('login')
  const [showPhoneVerification, setShowPhoneVerification] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(false)

  const checkAuthenticationForBooking = async (serviceId?: string): Promise<boolean> => {
    setIsCheckingAuth(true)

    try {
      // Step 1: Check if user is logged in
      if (!isAuthenticated || !user) {
        setCurrentStep('login')
        toast.error(t('booking.loginRequired'))

        // Redirect to login with return URL
        const returnUrl = serviceId ? `/booking?service=${serviceId}` : '/booking'
        navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`)

        return false
      }

      // Step 2: Ensure we have the latest user data
      await checkAuth()

      // Step 3: Check if phone is verified
      if (!user.phoneVerified) {
        setCurrentStep('verification')

        // Check if user has a phone number
        if (!user.phone) {
          toast.error(t('phoneVerification.phoneRequired'))
          navigate('/profile') // Redirect to profile to add phone
          return false
        }

        // Show phone verification modal
        setShowPhoneVerification(true)
        toast(t('booking.phoneVerificationRequired'), {
          icon: '📱',
          duration: 4000
        })

        return false
      }

      // Step 4: All checks passed, proceed to booking
      setCurrentStep('booking')
      return true

    } catch (error) {
      console.error('Error checking authentication for booking:', error)
      toast.error(t('common.error'))
      return false
    } finally {
      setIsCheckingAuth(false)
    }
  }

  const proceedToBooking = () => {
    setCurrentStep('booking')
    setShowPhoneVerification(false)
  }

  const handlePhoneVerificationSuccess = async () => {
    try {
      // Refresh user data to get updated phoneVerified status
      await checkAuth()

      // Close verification modal and proceed to booking
      setShowPhoneVerification(false)
      setCurrentStep('booking')

      toast.success(t('phoneVerification.verificationSuccess'))
    } catch (error) {
      console.error('Error after phone verification:', error)
      toast.error(t('common.error'))
    }
  }

  const closePhoneVerification = () => {
    setShowPhoneVerification(false)
    setCurrentStep('login')
  }

  return {
    currentStep,
    showPhoneVerification,
    isCheckingAuth,
    checkAuthenticationForBooking,
    proceedToBooking,
    handlePhoneVerificationSuccess,
    closePhoneVerification
  }
}