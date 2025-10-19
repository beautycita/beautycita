import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface PhoneVerificationStepProps {
  onComplete?: () => void
  email?: string
  role?: 'client' | 'stylist'
}

const PhoneVerificationStep: React.FC<PhoneVerificationStepProps> = ({
  onComplete,
  email: propEmail,
  role: propRole
}) => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { checkAuth } = useAuth()

  const email = propEmail || searchParams.get('email') || ''
  const role = propRole || searchParams.get('role') as 'client' | 'stylist' || 'client'

  const [step, setStep] = useState<'phone' | 'verify'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [countryCode, setCountryCode] = useState('+1') // Default to US
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const codeInputRef = useRef<HTMLInputElement>(null)

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Auto-focus code input
  useEffect(() => {
    if (step === 'verify' && codeInputRef.current) {
      codeInputRef.current.focus()
    }
  }, [step])

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')

    // Format as (XXX) XXX-XXXX for US numbers
    if (countryCode === '+1') {
      if (digits.length <= 3) {
        return digits
      } else if (digits.length <= 6) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
      } else {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
      }
    } else {
      // For other countries, just return digits
      return digits
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
  }

  const getE164PhoneNumber = () => {
    const digits = phoneNumber.replace(/\D/g, '')

    // Validate based on country code
    if (countryCode === '+1') {
      // US/Canada: should be 10 digits
      if (digits.length !== 10) {
        throw new Error('US phone numbers must be 10 digits')
      }
    } else {
      // Other countries: should have at least 7 digits
      if (digits.length < 7) {
        throw new Error('Phone number is too short')
      }
    }

    return `${countryCode}${digits}`
  }

  const sendVerificationCode = async () => {
    try {
      // Validate and get E.164 formatted phone number
      const e164Phone = getE164PhoneNumber()

      setLoading(true)
      setError('')

      console.log('Sending verification code:', {
        email,
        phone: e164Phone,
        role,
        countryCode
      })

      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          phone: e164Phone, // Send E.164 formatted phone number
          role
        }),
      })

      const data = await response.json()

      console.log('API Response:', {
        ok: response.ok,
        status: response.status,
        data
      })

      if (response.ok && data.success) {
        console.log('SMS sent successfully')
        // Proceed to verify step only on success
        setStep('verify')
        setResendCooldown(30) // 30 second cooldown
        setError('')
      } else {
        console.error('SMS send failed:', response.status, data)
        // Stay on phone step and show error
        setError(data.message || 'Could not send SMS. Please check your phone number and try again.')
        setResendCooldown(10) // Shorter cooldown for retry
      }
    } catch (error: any) {
      console.error('Error sending verification code:', error)

      // Handle validation errors specifically
      if (error.message && (error.message.includes('digits') || error.message.includes('short'))) {
        setError(error.message)
        setStep('phone') // Stay on phone step for validation errors
      } else {
        // Network error - stay on phone step
        setError('Network error. Please check your connection and try again.')
        setResendCooldown(5) // Short cooldown for retry
      }
      setLoading(false)
    }

    // Always clear loading state
    setLoading(false)
  }

  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter the 6-digit code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email,
          code: verificationCode,
          role
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsComplete(true)

        // Refresh auth context
        await checkAuth()

        // Complete callback or redirect
        if (onComplete) {
          onComplete()
        } else {
          setTimeout(() => {
            navigate(`/home?role=${role}`)
          }, 1500)
        }
      } else {
        setError(data.message || 'Invalid verification code')
      }
    } catch (error) {
      console.error('Error verifying code:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resendCode = async () => {
    if (resendCooldown > 0) return
    await sendVerificationCode()
  }

  const handleCodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setVerificationCode(value)

    // Auto-submit when 6 digits entered
    if (value.length === 6) {
      setTimeout(() => verifyCode(), 100)
    }
  }

  if (isComplete) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Phone Verified!
          </h2>
          <p className="text-gray-600 mb-4">
            Your account is now fully activated. Redirecting to your dashboard...
          </p>
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <motion.div
        className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">📱</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {step === 'phone' ? 'Verify Your Phone' : 'Enter Verification Code'}
          </h2>
          {/* Debug indicator - only in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500 mt-2">
              Current step: {step}
            </div>
          )}
          <p className="text-gray-600 text-sm">
            {step === 'phone'
              ? 'We need to verify your phone for time-sensitive booking notifications'
              : `We sent a 6-digit code to ${countryCode} ${phoneNumber}`
            }
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 'phone' ? (
            <motion.div
              key="phone"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Phone Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      disabled={loading}
                      className={`w-24 sm:w-28 p-3 sm:p-4 border-2 border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors text-sm sm:text-lg ${
                        loading ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+52">🇲🇽 +52</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+33">🇫🇷 +33</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+34">🇪🇸 +34</option>
                      <option value="+39">🇮🇹 +39</option>
                      <option value="+61">🇦🇺 +61</option>
                      <option value="+81">🇯🇵 +81</option>
                      <option value="+86">🇨🇳 +86</option>
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+55">🇧🇷 +55</option>
                      <option value="+54">🇦🇷 +54</option>
                    </select>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      placeholder={countryCode === '+1' ? '(555) 123-4567' : 'Phone number'}
                      disabled={loading}
                      className={`flex-1 min-w-0 p-3 sm:p-4 border-2 border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors text-sm sm:text-lg ${
                        loading ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your phone number without the country code
                  </p>
                </div>

                {error && (
                  <motion.div
                    className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-3xl text-sm"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  onClick={sendVerificationCode}
                  disabled={loading || !phoneNumber}
                  className={`w-full p-4 rounded-full font-bold text-white transition-all ${
                    loading || !phoneNumber
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:shadow-lg hover:scale-[1.02]'
                  }`}
                  whileHover={!loading && phoneNumber ? { scale: 1.02 } : {}}
                  whileTap={!loading && phoneNumber ? { scale: 0.98 } : {}}
                >
                  {loading ? 'Sending Code...' : 'Send Code & Continue'}
                </motion.button>

                {/* Fallback button if SMS was sent but UI didn't update */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Manual switch to verify step')
                      setStep('verify')
                    }}
                    className="text-sm text-purple-600 hover:text-purple-700 underline transition-colors"
                  >
                    I already received the code
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="verify"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    ref={codeInputRef}
                    type="text"
                    value={verificationCode}
                    onChange={handleCodeInput}
                    placeholder="123456"
                    maxLength={6}
                    disabled={loading}
                    className={`w-full p-4 border-2 border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors text-lg text-center tracking-widest ${
                      loading ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Enter the 6-digit code sent to your phone
                  </p>
                </div>

                {error && (
                  <motion.div
                    className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-3xl text-sm"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  onClick={verifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  className={`w-full p-4 rounded-full font-bold text-white transition-all ${
                    loading || verificationCode.length !== 6
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:shadow-lg hover:scale-[1.02]'
                  }`}
                  whileHover={!loading && verificationCode.length === 6 ? { scale: 1.02 } : {}}
                  whileTap={!loading && verificationCode.length === 6 ? { scale: 0.98 } : {}}
                >
                  {loading ? 'Verifying...' : 'Verify Phone Number'}
                </motion.button>

                <div className="text-center">
                  <button
                    onClick={resendCode}
                    disabled={resendCooldown > 0}
                    className={`text-sm transition-colors ${
                      resendCooldown > 0
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-pink-600 hover:text-pink-700'
                    }`}
                  >
                    {resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : 'Resend verification code'
                    }
                  </button>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setStep('phone')}
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Change phone number
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default PhoneVerificationStep