import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  XMarkIcon,
  FingerPrintIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import axios from 'axios'
import toast from 'react-hot-toast'
import { registerBiometric } from '../../utils/biometric'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface BiometricRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  role: 'CLIENT' | 'STYLIST'
}

interface CountryCode {
  code: string
  dial: string
  flag: string
}

const COUNTRY_CODES: CountryCode[] = [
  { code: 'US', dial: '+1', flag: '🇺🇸' },
  { code: 'MX', dial: '+52', flag: '🇲🇽' },
  { code: 'CA', dial: '+1', flag: '🇨🇦' },
  { code: 'GB', dial: '+44', flag: '🇬🇧' },
  { code: 'ES', dial: '+34', flag: '🇪🇸' }
]

export default function BiometricRegistrationModal({
  isOpen,
  onClose,
  role
}: BiometricRegistrationModalProps) {
  const [step, setStep] = useState<'phone' | 'verify' | 'biometric'>('phone')
  const [countryCode, setCountryCode] = useState('+1')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const navigate = useNavigate()

  // Detect country from IP on mount
  useEffect(() => {
    if (isOpen) {
      detectCountryFromIP()
    }
  }, [isOpen])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Request Web OTP API permission when code is sent
  useEffect(() => {
    if (codeSent && 'OTPCredential' in window) {
      requestOTPPermission()
    }
  }, [codeSent])

  const detectCountryFromIP = async () => {
    try {
      const response = await axios.get('https://ipapi.co/json/')
      const detectedCountry = response.data.country_code

      const country = COUNTRY_CODES.find(c => c.code === detectedCountry)
      if (country) {
        setCountryCode(country.dial)
      }
    } catch (error) {
      console.log('Could not detect country, defaulting to US')
    }
  }

  const requestOTPPermission = async () => {
    if ('OTPCredential' in window) {
      try {
        const ac = new AbortController()

        // @ts-ignore - Web OTP API
        const otpCredential = await navigator.credentials.get({
          otp: { transport: ['sms'] },
          signal: ac.signal
        })

        if (otpCredential && 'code' in otpCredential) {
          // @ts-ignore
          setVerificationCode(otpCredential.code)
          toast.success('Code auto-filled from SMS!')
        }
      } catch (error) {
        console.log('OTP auto-fill not available or user denied')
      }
    }
  }

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number')
      return
    }

    try {
      setIsLoading(true)

      const fullPhone = `${countryCode}${phoneNumber}`

      const response = await axios.post(`${API_URL}/verify/send-code`, {
        phoneNumber: fullPhone
      })

      if (response.data.success) {
        toast.success('Verification code sent!')
        setCodeSent(true)
        setStep('verify')
        setResendCooldown(60)
      } else {
        toast.error(response.data.message || 'Failed to send code')
      }
    } catch (error: any) {
      console.error('Send code error:', error)
      toast.error(error.response?.data?.message || 'Failed to send verification code')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyAndRegister = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter the 6-digit verification code')
      return
    }

    try {
      setIsLoading(true)
      const fullPhone = `${countryCode}${phoneNumber}`

      // Step 1: Verify SMS code
      const verifyResponse = await axios.post(`${API_URL}/verify/check-code`, {
        phoneNumber: fullPhone,
        code: verificationCode
      })

      if (!verifyResponse.data.success || !verifyResponse.data.verified) {
        toast.error('Invalid verification code')
        return
      }

      setStep('biometric')
      toast.success('Phone verified! Setting up biometric authentication...')

      // Step 2: Get WebAuthn registration options
      const optionsResponse = await axios.post(`${API_URL}/webauthn/register/options`, {
        phone: fullPhone,
        role
      })

      if (!optionsResponse.data.success) {
        throw new Error('Failed to get registration options')
      }

      // Step 3: Trigger biometric registration (unified for web and mobile)
      const registerResult = await registerBiometric(optionsResponse.data.options, fullPhone)

      if (!registerResult.success) {
        throw new Error(registerResult.error || 'Biometric registration failed')
      }

      // Step 4: Complete minimal registration (phone + biometric only)
      const registerResponse = await axios.post(`${API_URL}/webauthn/register/verify-minimal`, {
        phone: fullPhone,
        credential: registerResult.credential,
        role,
        verificationCode
      })

      if (registerResponse.data.success) {
        const { token, user } = registerResponse.data

        // Store auth data
        localStorage.setItem('authToken', token)
        localStorage.setItem('beautycita-auth-token', token)

        toast.success('Registration successful! Complete your profile...')

        // Redirect to profile completion
        navigate('/profile/complete', {
          state: {
            newUser: true,
            userId: user.id
          }
        })
      }
    } catch (error: any) {
      console.error('Biometric registration error:', error)

      if (error.name === 'NotAllowedError') {
        toast.error('Biometric authentication was cancelled')
      } else {
        toast.error(error.response?.data?.message || 'Registration failed')
      }

      setStep('verify') // Go back to verification step
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-3xl transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 rounded-3xl">
                <FingerPrintIcon className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Biometric Registration</h2>
                <p className="text-white/90 text-sm">Quick & secure signup</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Step: Phone Number */}
            {step === 'phone' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="px-3 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white"
                    >
                      {COUNTRY_CODES.map((country) => (
                        <option key={country.code} value={country.dial}>
                          {country.flag} {country.dial}
                        </option>
                      ))}
                    </select>

                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="5551234567"
                      maxLength={15}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      autoFocus
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    📱 We'll send you a verification code via SMS
                  </p>
                </div>

                <button
                  onClick={handleSendCode}
                  disabled={isLoading || phoneNumber.length < 10}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <DevicePhoneMobileIcon className="w-5 h-5" />
                      <span>Send Verification Code</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* Step: Verify Code */}
            {step === 'verify' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="text-center mb-4">
                  <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Code sent to {countryCode} {phoneNumber}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-center text-2xl font-mono tracking-widest"
                    autoFocus
                    autoComplete="one-time-code"
                  />
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    {('OTPCredential' in window) && '🔐 SMS auto-fill enabled or enter manually'}
                  </p>
                </div>

                <button
                  onClick={handleVerifyAndRegister}
                  disabled={isLoading || verificationCode.length !== 6}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <FingerPrintIcon className="w-5 h-5" />
                      <span>Continue to Biometric</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSendCode}
                  disabled={resendCooldown > 0 || isLoading}
                  className="w-full text-sm text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : '↻ Resend Code'}
                </button>
              </motion.div>
            )}

            {/* Step: Biometric (Loading state) */}
            {step === 'biometric' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-block mb-4"
                >
                  <FingerPrintIcon className="w-20 h-20 text-purple-600" />
                </motion.div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Complete Biometric Setup
                </h3>
                <p className="text-gray-600">
                  Follow your device's prompts to register your fingerprint or face
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
