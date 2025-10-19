import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import {
  XMarkIcon,
  PhoneIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import type { PhoneVerificationForm } from '@/types'
import toast from 'react-hot-toast'

interface PhoneVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  phone?: string
}

export default function PhoneVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  phone: initialPhone = ''
}: PhoneVerificationModalProps) {
  const { t } = useTranslation()
  const { user, checkAuth } = useAuthStore()
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [isLoading, setIsLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<number | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PhoneVerificationForm>({
    defaultValues: {
      phone: initialPhone || user?.phone || '',
      code: ''
    }
  })

  const watchedPhone = watch('phone')
  const watchedCode = watch('code')

  useEffect(() => {
    if (isOpen && initialPhone) {
      setValue('phone', initialPhone)
      if (initialPhone) {
        setStep('code')
        handleSendCode(initialPhone)
      }
    }
  }, [isOpen, initialPhone])

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const startTimer = (seconds: number = 60) => {
    setTimeLeft(seconds)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendCode = async (phone: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await authService.sendPhoneVerification(phone)

      if (response.success) {
        setCodeSent(true)
        setStep('code')
        startTimer(60)
        toast.success(t('phoneVerification.codeSent', { phone }))
      } else {
        setError(response.message || t('phoneVerification.verificationFailed'))
        toast.error(response.message || t('phoneVerification.verificationFailed'))
      }
    } catch (error: any) {
      const errorMessage = error.message || t('phoneVerification.verificationFailed')
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyCode = async (data: PhoneVerificationForm) => {
    if (!data.code || data.code.length !== 6) {
      setError(t('phoneVerification.invalidCode'))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await authService.verifyPhone(data.phone, data.code)

      if (response.success) {
        toast.success(t('phoneVerification.verificationSuccess'))
        // Refresh user data to get updated phoneVerified status
        await checkAuth()
        onSuccess()
        onClose()
      } else {
        setError(response.message || t('phoneVerification.invalidCode'))
        toast.error(response.message || t('phoneVerification.invalidCode'))
      }
    } catch (error: any) {
      const errorMessage = error.message || t('phoneVerification.verificationFailed')
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (timeLeft > 0) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await authService.resendPhoneVerification(watchedPhone)

      if (response.success) {
        startTimer(60)
        toast.success(t('phoneVerification.resendSuccess'))
      } else {
        setError(response.message || t('phoneVerification.verificationFailed'))
        toast.error(response.message || t('phoneVerification.verificationFailed'))
      }
    } catch (error: any) {
      const errorMessage = error.message || t('phoneVerification.verificationFailed')
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatPhoneDisplay = (phone: string) => {
    // Format phone number for display (e.g., +52 55 1234 5678)
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length >= 10) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`
    }
    return phone
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-beauty-soft overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-cotton-candy text-white p-6 relative">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      {step === 'phone' ? (
                        <PhoneIcon className="h-5 w-5" />
                      ) : (
                        <ShieldCheckIcon className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{t('phoneVerification.title')}</h2>
                      <p className="text-sm opacity-90">{t('phoneVerification.subtitle')}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition-colors duration-200 p-1"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {step === 'phone' ? (
                  /* Phone Input Step */
                  <form onSubmit={handleSubmit((data) => handleSendCode(data.phone))} className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-beauty-blush/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PhoneIcon className="h-8 w-8 text-beauty-hot-pink" />
                      </div>
                      <p className="text-gray-600 text-sm">
                        {t('phoneVerification.subtitle')}
                      </p>
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone" className="label">
                        {t('auth.fields.phone')} *
                      </label>
                      <input
                        {...register('phone', {
                          required: t('phoneVerification.phoneRequired'),
                          pattern: {
                            value: /^[\+]?[0-9\s\-\(\)]{10,}$/,
                            message: t('auth.validation.phoneInvalid')
                          }
                        })}
                        type="tel"
                        id="phone"
                        className={`input ${errors.phone ? 'input-error' : ''}`}
                        placeholder="+52 55 1234 5678"
                        autoComplete="tel"
                      />
                      {errors.phone && (
                        <p className="form-error">{errors.phone.message}</p>
                      )}
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-red-700 text-sm">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || !watchedPhone}
                      className="btn btn-primary w-full flex items-center justify-center space-x-2"
                    >
                      {isLoading ? (
                        <div className="loading-spinner" />
                      ) : (
                        <>
                          <PhoneIcon className="h-4 w-4" />
                          <span>{t('phoneVerification.sendCode')}</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Verification Code Step */
                  <form onSubmit={handleSubmit(handleVerifyCode)} className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldCheckIcon className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-gray-600 text-sm mb-2">
                        {t('phoneVerification.codeSent', { phone: formatPhoneDisplay(watchedPhone) })}
                      </p>
                      {timeLeft > 0 && (
                        <div className="flex items-center justify-center space-x-1 text-beauty-hot-pink text-sm">
                          <ClockIcon className="h-4 w-4" />
                          <span>{t('phoneVerification.codeExpires', { time: formatTime(timeLeft) })}</span>
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="code" className="label">
                        {t('phoneVerification.enterCode')} *
                      </label>
                      <input
                        {...register('code', {
                          required: t('phoneVerification.invalidCode'),
                          pattern: {
                            value: /^\d{6}$/,
                            message: t('phoneVerification.invalidCode')
                          }
                        })}
                        type="text"
                        id="code"
                        className={`input text-center text-lg tracking-widest ${errors.code ? 'input-error' : ''}`}
                        placeholder={t('phoneVerification.codePlaceholder')}
                        maxLength={6}
                        autoComplete="one-time-code"
                      />
                      {errors.code && (
                        <p className="form-error">{errors.code.message}</p>
                      )}
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-red-700 text-sm">{error}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <button
                        type="submit"
                        disabled={isLoading || !watchedCode || watchedCode.length !== 6}
                        className="btn btn-primary w-full flex items-center justify-center space-x-2"
                      >
                        {isLoading ? (
                          <div className="loading-spinner" />
                        ) : (
                          <>
                            <CheckCircleIcon className="h-4 w-4" />
                            <span>{t('phoneVerification.verify')}</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={timeLeft > 0 || isLoading}
                        className="btn btn-outline w-full text-sm"
                      >
                        {timeLeft > 0
                          ? t('phoneVerification.codeExpires', { time: formatTime(timeLeft) })
                          : t('phoneVerification.resendCode')
                        }
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStep('phone')
                          setCodeSent(false)
                          setError(null)
                          if (intervalRef.current) {
                            clearInterval(intervalRef.current)
                          }
                        }}
                        className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        ← Cambiar número de teléfono
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}