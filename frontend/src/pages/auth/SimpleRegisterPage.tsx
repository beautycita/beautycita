import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SparklesIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  FingerPrintIcon
} from '@heroicons/react/24/outline'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn
} from '@simplewebauthn/browser'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

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

export default function SimpleRegisterPage() {
  const { t } = useTranslation()
  const [countryCode, setCountryCode] = useState('+1')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false)
  const [showPasswordSetup, setShowPasswordSetup] = useState(false)
  const [registeredUser, setRegisteredUser] = useState<any>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const navigate = useNavigate()
  const abortControllerRef = useRef<AbortController | null>(null)
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const codeInputRef = useRef<HTMLInputElement>(null)

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Detect country from IP
  useEffect(() => {
    detectCountryFromIP()
  }, [])

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

  const startOTPListener = () => {
    if ('OTPCredential' in window && !abortControllerRef.current) {
      abortControllerRef.current = new AbortController()

      // @ts-ignore - Web OTP API
      navigator.credentials.get({
        otp: { transport: ['sms'] },
        signal: abortControllerRef.current.signal
      }).then((otpCredential: any) => {
        if (otpCredential && otpCredential.code) {
          console.log('✅ SMS code auto-filled:', otpCredential.code)
          setVerificationCode(otpCredential.code)
          toast.success(t('auth.simpleRegister.codeAutoFilled'))
        }
      }).catch((err: any) => {
        if (err.name !== 'AbortError') {
          console.log('OTP auto-fill not available:', err.message)
        }
      })
    }
  }

  const getDefaultDeviceName = (): string => {
    const ua = navigator.userAgent
    if (/iPhone/.test(ua)) return 'iPhone'
    if (/iPad/.test(ua)) return 'iPad'
    if (/Android/.test(ua)) return 'Android Device'
    if (/Mac/.test(ua)) return 'Mac'
    if (/Windows/.test(ua)) return 'Windows PC'
    return 'My Device'
  }

  const isDesktopDevice = (): boolean => {
    const ua = navigator.userAgent
    // Check if it's a mobile device
    const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    // Check if screen is desktop-sized
    const isLargeScreen = window.innerWidth >= 1024
    return !isMobile || isLargeScreen
  }

  const handleSendCode = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error(t('auth.simpleRegister.phoneValidError'))
      return
    }

    try {
      setIsLoading(true)
      const fullPhone = `${countryCode}${phoneNumber}`

      console.log('📱 FRONTEND SENDING:', {
        countryCode,
        phoneNumber,
        fullPhone,
        timestamp: new Date().toISOString()
      })

      const response = await axios.post(`${API_URL}/api/auth/send-verification-code`, {
        phone: phoneNumber  // Send just the digits, backend will add country code
      })

      console.log('✅ BACKEND RESPONSE:', response.data)

      if (response.data.success) {
        toast.success(t('auth.phoneRegistration.codeSentSuccess'))
        setCodeSent(true)
        setResendCooldown(60)

        // Start listening for SMS auto-fill
        startOTPListener()
      } else {
        toast.error(response.data.message || t('auth.forgotPassword.resetEmailError'))
      }
    } catch (error: any) {
      console.error('Send code error:', error)
      toast.error(error.response?.data?.message || t('auth.verifyPhone.errorSending'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error(t('auth.simpleRegister.codeLengthError'))
      return
    }

    try {
      setIsLoading(true)
      const fullPhone = `${countryCode}${phoneNumber}`

      // Verify code and create account
      const response = await axios.post(`${API_URL}/api/auth/register-simple`, {
        phoneNumber: fullPhone,
        verificationCode,
        role: 'CLIENT' // Default to client
      })

      if (response.data.success) {
        const { token, user } = response.data

        // Store auth
        localStorage.setItem('authToken', token)
        localStorage.setItem('beautycita-auth-token', token)

        // toast.success('Welcome to BeautyCita! 🎉') // Removed: redirect is enough feedback

        // Store user for next step
        setRegisteredUser({ token, user })

        // Biometric is REQUIRED - check if device supports it
        const hasWebAuthn = browserSupportsWebAuthn()

        if (!hasWebAuthn) {
          // Device doesn't support biometric - must set password instead
          toast.error(t('auth.simpleRegister.biometricNotSupported'))
          setShowPasswordSetup(true)
        } else {
          // Biometric is available and REQUIRED
          setShowBiometricPrompt(true)
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.response?.data?.message || t('auth.messages.registerError'))
    } finally {
      setIsLoading(false)
    }
  }

  const navigateToDashboard = () => {
    // Redirect new users to onboarding flow
    navigate('/profile/onboarding', { replace: true })
  }

  const handleAddBiometric = async () => {
    if (!registeredUser) return

    try {
      setIsLoading(true)

      // Get registration options from backend
      const optionsResponse = await axios.post(
        `${API_URL}/api/webauthn/register/options`,
        {
          phone: registeredUser.user.phone,
          role: registeredUser.user.role
        },
        {
          headers: { Authorization: `Bearer ${registeredUser.token}` }
        }
      )

      console.log('[DEBUG] WebAuthn options received:', optionsResponse.data)
      console.log('[DEBUG] Options structure:', JSON.stringify(optionsResponse.data.options, null, 2))

      // Start WebAuthn registration
      const credential = await startRegistration(optionsResponse.data.options)

      // Verify registration with backend
      await axios.post(
        `${API_URL}/api/webauthn/register/verify-minimal`,
        {
          phone: registeredUser.user.phone,
          role: registeredUser.user.role,
          credential,
          deviceName: getDefaultDeviceName()
        },
        {
          headers: { Authorization: `Bearer ${registeredUser.token}` }
        }
      )

      toast.success(t('auth.simpleRegister.biometricSuccess'))
      setShowBiometricPrompt(false)
      navigateToDashboard()
    } catch (error: any) {
      console.error('Biometric registration error:', error)
      toast.error(t('auth.messages.authError'))
      // Still go to dashboard even if biometric fails
      setShowBiometricPrompt(false)
      navigateToDashboard()
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkipBiometric = () => {
    setShowBiometricPrompt(false)
    navigateToDashboard()
  }

  const handleSetPassword = async () => {
    // Validate passwords
    if (!password || password.length < 8) {
      toast.error(t('auth.phoneRegistration.passwordMinLengthError'))
      return
    }

    if (password !== confirmPassword) {
      toast.error(t('auth.phoneRegistration.passwordMismatchError'))
      return
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumber = /[0-9]/.test(password)

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      toast.error(t('auth.phoneRegistration.passwordWeakError'))
      return
    }

    if (!registeredUser) return

    try {
      setIsLoading(true)

      await axios.post(
        `${API_URL}/api/auth/set-password`,
        { password },
        {
          headers: { Authorization: `Bearer ${registeredUser.token}` }
        }
      )

      toast.success(t('auth.phoneRegistration.passwordSetSuccess'))
      setShowPasswordSetup(false)
      navigateToDashboard()
    } catch (error: any) {
      console.error('Password setup error:', error)
      toast.error(t('auth.messages.authError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkipPassword = () => {
    setShowPasswordSetup(false)
    navigateToDashboard()
  }

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (verificationCode.length === 6 && codeSent && !isLoading) {
      console.log('🚀 Auto-submitting code:', verificationCode)
      handleRegister()
    }
  }, [verificationCode])

  // Auto-focus code input when it appears and scroll into view
  useEffect(() => {
    if (codeSent && codeInputRef.current) {
      // Small delay to ensure the animation completes
      setTimeout(() => {
        codeInputRef.current?.focus()
        // Scroll the input into view, centered on mobile
        codeInputRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        })
      }, 300)
    }
  }, [codeSent])

  // Cleanup OTP listener on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center">
              <SparklesIcon className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-serif font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              BeautyCita
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.phoneRegistration.title')}</h1>
          <p className="text-gray-600">{t('auth.phoneRegistration.subtitle')}</p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth.phoneRegistration.phoneLabel')}
            </label>
            <div className="flex gap-1 sm:gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                disabled={codeSent}
                className="w-20 sm:w-auto px-2 sm:px-3 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none bg-white disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {COUNTRY_CODES.map((country) => (
                  <option key={country.code} value={country.dial}>
                    {country.flag} {country.dial}
                  </option>
                ))}
              </select>

              <input
                ref={phoneInputRef}
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                onFocus={(e) => {
                  // Scroll into view on mobile when focused
                  setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }, 300)
                }}
                placeholder="5551234567"
                maxLength={15}
                disabled={codeSent}
                className="flex-1 min-w-0 px-3 sm:px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed text-sm sm:text-base"
                autoFocus
              />
            </div>

            {!codeSent && (
              <button
                onClick={handleSendCode}
                disabled={isLoading || phoneNumber.length < 10}
                className="w-full mt-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t('auth.phoneRegistration.sendingButton')}</span>
                  </>
                ) : (
                  <>
                    <DevicePhoneMobileIcon className="w-5 h-5" />
                    <span>{t('auth.phoneRegistration.sendCodeButton')}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Verification Code */}
          {codeSent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <div className="bg-green-50 border border-green-200 rounded-3xl p-4 flex items-center gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-green-900 font-medium">{t('auth.simpleRegister.codeSentTo')} {countryCode} {phoneNumber}</p>
                  <p className="text-green-700">{t('auth.simpleRegister.checkMessages')}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.phoneRegistration.codeLabel')}
                </label>
                <input
                  ref={codeInputRef}
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  onFocus={(e) => {
                    // Scroll into view on mobile when focused
                    setTimeout(() => {
                      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }, 300)
                  }}
                  placeholder={t('auth.phoneRegistration.codePlaceholder')}
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-center text-2xl font-mono tracking-widest"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                />
              </div>

              <button
                onClick={handleRegister}
                disabled={isLoading || verificationCode.length !== 6}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t('auth.phoneRegistration.verifyingButton')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('auth.phoneRegistration.verifyButton')}</span>
                    <ArrowRightIcon className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                onClick={handleSendCode}
                disabled={resendCooldown > 0 || isLoading}
                className="w-full text-sm text-purple-600 hover:text-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `${t('auth.phoneRegistration.resendCode')} ${resendCooldown}s` : `↻ ${t('auth.phoneRegistration.resendCode')}`}
              </button>
            </motion.div>
          )}

          {/* Terms */}
          <div className="text-xs text-gray-500 text-center">
            {t('auth.simpleRegister.termsAgreement')}{' '}
            <a href="/terms" className="text-purple-600 hover:underline">{t('auth.simpleRegister.termsOfService')}</a>
            {' '}{t('auth.simpleRegister.and')}{' '}
            <a href="/privacy" className="text-purple-600 hover:underline">{t('auth.simpleRegister.privacyPolicy')}</a>
          </div>

          {/* Login Link */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {t('auth.simpleRegister.hasAccount')}{' '}
              <Link to="/login" className="font-medium text-purple-600 hover:text-purple-700">
                {t('auth.simpleRegister.signIn')}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Biometric Prompt Modal */}
      <AnimatePresence>
        {showBiometricPrompt && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <FingerPrintIcon className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {t('auth.simpleRegister.setupBiometric')}
                </h2>
                <p className="text-gray-600">
                  {t('auth.simpleRegister.secureBiometric')}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleAddBiometric}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t('auth.simpleRegister.settingUp')}</span>
                    </>
                  ) : (
                    <>
                      <FingerPrintIcon className="w-5 h-5" />
                      <span>{t('auth.simpleRegister.continueBiometric')}</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                {t('auth.simpleRegister.biometricHelp')}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Setup Modal */}
      <AnimatePresence>
        {showPasswordSetup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {t('auth.simpleRegister.setupPassword')}
                </h2>
                <p className="text-gray-600">
                  {t('auth.simpleRegister.noBiometricSupport')}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.phoneRegistration.passwordLabel')}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.simpleRegister.enterPassword')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.phoneRegistration.confirmPasswordLabel')}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.simpleRegister.confirmPasswordPlaceholder')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    autoComplete="new-password"
                  />
                </div>

                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-3xl">
                  <p className="font-medium mb-1">{t('auth.simpleRegister.passwordRequirements')}</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>{t('auth.simpleRegister.req8Chars')}</li>
                    <li>{t('auth.simpleRegister.reqUpperLower')}</li>
                    <li>{t('auth.simpleRegister.reqNumber')}</li>
                  </ul>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleSetPassword}
                    disabled={isLoading || !password || password.length < 8 || password !== confirmPassword}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{t('auth.simpleRegister.settingPassword')}</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{t('auth.simpleRegister.continueToOnboarding')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                {t('auth.simpleRegister.passwordSecure')}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
