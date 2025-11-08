import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  ArrowRightIcon,
  FingerPrintIcon,
  DevicePhoneMobileIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import { getPostLoginRedirect } from '../../utils/routing'
import GoogleSignInButton from '../../components/auth/GoogleSignInButton'
import { GradientCard } from '../../components/ui'
import BiometricRegistrationModal from '../../components/auth/BiometricRegistrationModal'
import type { LoginForm, RegisterForm } from '../../types'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  checkBiometricAvailability,
  authenticateBiometric,
  registerBiometric as registerBiometricUtil,
  type BiometricCapabilities
} from '../../utils/biometric'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface UnifiedAuthPageProps {
  mode?: 'login' | 'register'
  role?: 'CLIENT' | 'STYLIST' | 'ADMIN'
}

interface SMSVerificationForm {
  phone: string
  code?: string
}

export default function UnifiedAuthPage({
  mode: initialMode = 'login',
  role = 'CLIENT'
}: UnifiedAuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [authMethod, setAuthMethod] = useState<'biometric' | 'password' | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [verificationPhone, setVerificationPhone] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [showBiometricModal, setShowBiometricModal] = useState(false)
  const [biometricCapabilities, setBiometricCapabilities] = useState<BiometricCapabilities>({
    isSupported: false,
    isNative: false
  })

  const { login, register: registerUser, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  const from = location.state?.from?.pathname || '/'
  const isBiometricSupported = biometricCapabilities.isSupported

  // Refs for auto-focus
  const emailInputRef = useRef<HTMLInputElement>(null)
  const phoneInputRef = useRef<HTMLInputElement>(null)

  // Check biometric availability on mount
  useEffect(() => {
    const checkBiometric = async () => {
      const capabilities = await checkBiometricAvailability()
      setBiometricCapabilities(capabilities)
      console.log('Biometric capabilities:', capabilities)
    }
    checkBiometric()
  }, [])

  // Check dark mode
  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)

    const handleStorageChange = () => {
      const newDarkMode = localStorage.getItem('darkMode') === 'true'
      setIsDarkMode(newDarkMode)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Auto-focus email input when password form appears
  useEffect(() => {
    if (authMethod === 'password' && emailInputRef.current) {
      setTimeout(() => {
        emailInputRef.current?.focus()
        emailInputRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }, 300)
    }
  }, [authMethod])

  // Auto-focus phone input when biometric form appears
  useEffect(() => {
    if (authMethod === 'biometric' && phoneInputRef.current) {
      setTimeout(() => {
        phoneInputRef.current?.focus()
        phoneInputRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }, 300)
    }
  }, [authMethod])

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<RegisterForm & LoginForm & SMSVerificationForm>()

  const phoneValue = watch('phone')

  // Send SMS Verification Code
  const handleSendCode = async () => {
    if (!phoneValue) {
      toast.error('Please enter your phone number')
      return
    }

    try {
      setIsVerifying(true)

      // Clean to 10 digits only
      const digitsOnly = phoneValue.replace(/\D/g, '')

      const response = await axios.post(`${API_URL}/api/verify/send-code`, {
        phoneNumber: digitsOnly
      })

      if (response.data.success) {
        toast.success('Verification code sent!')

        setCodeSent(true)
        setVerificationPhone(digitsOnly)
        setValue('phone', digitsOnly)
        setResendCooldown(60) // 60 second cooldown
      } else {
        toast.error(response.data.message || 'Failed to send code')
      }
    } catch (error: any) {
      console.error('Send code error:', error)
      toast.error(error.response?.data?.message || 'Failed to send verification code')
    } finally {
      setIsVerifying(false)
    }
  }

  // Biometric Registration
  const handleBiometricRegister = async (data: RegisterForm & SMSVerificationForm) => {
    if (!isBiometricSupported) {
      toast.error('Biometric authentication is not supported on this device')
      return
    }

    if (!codeSent || !data.code) {
      toast.error('Please verify your phone number first')
      return
    }

    try {
      // Step 1: Verify SMS code
      const verifyResponse = await axios.post(`${API_URL}/api/verify/check-code`, {
        phoneNumber: data.phone,
        code: data.code
      })

      if (!verifyResponse.data.success) {
        toast.error('Invalid verification code')
        return
      }

      // Step 2: Get WebAuthn registration options
      const optionsResponse = await axios.post(`${API_URL}/api/webauthn/register/options`, {
        phone: data.phone,
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        role
      })

      if (!optionsResponse.data.success) {
        throw new Error('Failed to get registration options')
      }

      // Step 3: Trigger biometric registration (unified for web and mobile)
      const registerResult = await registerBiometricUtil(optionsResponse.data.options, data.phone)

      if (!registerResult.success) {
        toast.error(registerResult.error || 'Biometric registration failed')
        return
      }

      // Step 4: Complete registration
      const registerResponse = await axios.post(`${API_URL}/api/webauthn/register/verify`, {
        phone: data.phone,
        credential: registerResult.credential,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role,
        verificationCode: data.code
      })

      if (registerResponse.data.success) {
        const { token, user } = registerResponse.data

        // Store auth data
        localStorage.setItem('authToken', token)
        useAuthStore.getState().setUser(user)
        useAuthStore.getState().setToken(token)

        // Redirect to dashboard
        const redirectUrl = role === 'STYLIST' ? '/dashboard/stylist' : '/dashboard/client'
        navigate(redirectUrl, { replace: true })
      }
    } catch (error: any) {
      console.error('Biometric registration error:', error)
      toast.error(error.response?.data?.message || 'Registration failed')
    }
  }

  // Biometric Login
  const handleBiometricLogin = async () => {
    if (!isBiometricSupported) {
      toast.error('Biometric authentication is not supported on this device')
      return
    }

    try {
      // Step 1: Get authentication options
      const optionsResponse = await axios.post(`${API_URL}/api/webauthn/login/options`, { role })

      if (!optionsResponse.data.success) {
        throw new Error('Failed to get login options')
      }

      // Step 2: Trigger biometric authentication (unified for web and mobile)
      const authResult = await authenticateBiometric(optionsResponse.data.options)

      if (!authResult.success) {
        toast.error(authResult.error || 'Biometric authentication failed')
        return
      }

      // Step 3: Verify and login
      const loginResponse = await axios.post(`${API_URL}/api/webauthn/login/verify`, {
        assertion: authResult.assertion,
        role
      })

      if (loginResponse.data.success) {
        const { token, user } = loginResponse.data

        // Store auth data
        localStorage.setItem('authToken', token)
        useAuthStore.getState().setUser(user)
        useAuthStore.getState().setToken(token)

        // Redirect to dashboard
        const redirectUrl = getPostLoginRedirect({ user, from, fallback: '/' })
        navigate(redirectUrl, { replace: true })
      }
    } catch (error: any) {
      console.error('Biometric login error:', error)
      toast.error(error.response?.data?.message || 'Login failed')
    }
  }

  // Traditional password login
  const onPasswordLogin = async (data: LoginForm) => {
    const result = await login(data)
    if (result.success) {
      const redirectUrl = result.redirectUrl || getPostLoginRedirect({
        user: result.user,
        from,
        fallback: '/'
      })
      navigate(redirectUrl, { replace: true })
    }
  }

  // Traditional password registration
  const onPasswordRegister = async (data: RegisterForm) => {
    const registrationData = {
      ...data,
      role
    }
    const success = await registerUser(registrationData)
    if (success) {
      // Auto-login after registration
      const loginResult = await login({ email: data.email, password: data.password })
      if (loginResult.success) {
        const redirectUrl = role === 'STYLIST' ? '/dashboard/stylist' : '/dashboard/client'
        navigate(redirectUrl, { replace: true })
      }
    }
  }

  const onSubmit = async (data: any) => {
    if (mode === 'register') {
      if (authMethod === 'biometric') {
        await handleBiometricRegister(data)
      } else {
        await onPasswordRegister(data)
      }
    } else {
      await onPasswordLogin(data)
    }
  }

  const isClient = role === 'CLIENT'
  const pageTitle = mode === 'login'
    ? (isClient ? t('auth.loginTitle') : 'Stylist Login')
    : (isClient ? t('auth.registerTitle') : 'Join as Beauty Professional')

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Left Side - Branding (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500">
        <div className="absolute top-20 left-20 w-72 h-72 bg-white/20 rounded-3xl blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-3xl blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-8"
            >
              <SparklesIcon className="h-24 w-24" />
            </motion.div>

            <h1 className="text-5xl font-serif font-bold mb-6">BeautyCita</h1>
            <p className="text-xl text-white/90 mb-4">{pageTitle}</p>
            <p className="text-white/80 max-w-md">
              {mode === 'register'
                ? t('auth.methodSelection.biometricRegisterDescription')
                : t('auth.methodSelection.biometricLoginDescription')}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2">
              <SparklesIcon className="h-10 w-10 text-pink-500" />
              <span className="text-2xl font-serif font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                BeautyCita
              </span>
            </Link>
          </div>

          <GradientCard
            isDarkMode={isDarkMode}
            gradient="from-pink-500 to-purple-600"
            hoverable={false}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className={`text-3xl font-serif font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {pageTitle}
              </h2>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                {mode === 'register' ? t('auth.methodSelection.registerPrompt') : t('auth.methodSelection.loginPrompt')}
              </p>
            </div>

            {/* Primary Auth Methods - Biometric & Google */}
            <div className="space-y-4 mb-6">
              {/* Biometric Auth */}
              {isBiometricSupported && (
                <button
                  onClick={mode === 'login' ? handleBiometricLogin : () => setShowBiometricModal(true)}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-4 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
                >
                  <FingerPrintIcon className="h-6 w-6" />
                  <span>{mode === 'login' ? t('auth.methodSelection.biometricLoginButton') : t('auth.methodSelection.biometricRegisterButton')}</span>
                </button>
              )}

              {/* Google OAuth */}
              <GoogleSignInButton
                role={role.toLowerCase() as 'client' | 'stylist'}
                text={mode === 'login' ? t('auth.social.signInWithGoogle') : t('auth.social.signUpWithGoogle')}
              />

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className={`w-full border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className={`px-2 ${isDarkMode ? 'bg-gray-800/50 text-gray-400' : 'bg-white text-gray-500'}`}>
                    {t('auth.social.orDivider')}
                  </span>
                </div>
              </div>
            </div>

            {/* Biometric Registration Form */}
            <AnimatePresence>
              {authMethod === 'biometric' && mode === 'register' && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  {/* Name fields */}
                  {role === 'STYLIST' ? (
                    <>
                      {/* Stylist: First Name + Business Name (optional) */}
                      <div>
                        <label htmlFor="firstName" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Your First Name *
                        </label>
                        <input
                          {...registerField('firstName', { required: 'First name is required' })}
                          type="text"
                          className={`w-full px-4 py-3 rounded-3xl border ${
                            errors.firstName ? 'border-red-500' : isDarkMode ? 'border-gray-600 bg-gray-700/50 text-white' : 'border-gray-300'
                          } focus:ring-2 focus:ring-pink-500 focus:outline-none`}
                          placeholder="Sofia"
                        />
                        {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>}
                      </div>

                      <div>
                        <label htmlFor="businessName" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Business Name (Optional)
                        </label>
                        <input
                          {...registerField('businessName')}
                          type="text"
                          className={`w-full px-4 py-3 rounded-3xl border ${
                            isDarkMode ? 'border-gray-600 bg-gray-700/50 text-white' : 'border-gray-300'
                          } focus:ring-2 focus:ring-pink-500 focus:outline-none`}
                          placeholder="Leave blank to use your first name"
                        />
                        <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          If left blank, we'll use your first name. You can change this later in your dashboard.
                        </p>
                      </div>
                    </>
                  ) : (
                    /* Client: First Name + Last Name */
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {t('auth.fields.firstName')} *
                        </label>
                        <input
                          {...registerField('firstName', { required: t('auth.validation.firstNameRequired') })}
                          type="text"
                          className={`w-full px-4 py-3 rounded-3xl border ${
                            errors.firstName ? 'border-red-500' : isDarkMode ? 'border-gray-600 bg-gray-700/50 text-white' : 'border-gray-300'
                          } focus:ring-2 focus:ring-pink-500 focus:outline-none`}
                          placeholder={t('auth.placeholders.firstName')}
                        />
                        {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>}
                      </div>

                      <div>
                        <label htmlFor="lastName" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {t('auth.fields.lastName')} *
                        </label>
                        <input
                          {...registerField('lastName', { required: t('auth.validation.lastNameRequired') })}
                          type="text"
                          className={`w-full px-4 py-3 rounded-3xl border ${
                            errors.lastName ? 'border-red-500' : isDarkMode ? 'border-gray-600 bg-gray-700/50 text-white' : 'border-gray-300'
                          } focus:ring-2 focus:ring-pink-500 focus:outline-none`}
                          placeholder={t('auth.placeholders.lastName')}
                        />
                        {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>}
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('auth.fields.email')} *
                    </label>
                    <input
                      {...registerField('email', {
                        required: t('auth.validation.emailRequired'),
                        pattern: { value: /^\S+@\S+$/i, message: t('auth.validation.emailInvalid') }
                      })}
                      type="email"
                      onFocus={(e) => {
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        }, 100)
                      }}
                      className={`w-full px-4 py-3 rounded-3xl border ${
                        errors.email ? 'border-red-500' : isDarkMode ? 'border-gray-600 bg-gray-700/50 text-white' : 'border-gray-300'
                      } focus:ring-2 focus:ring-pink-500 focus:outline-none`}
                      placeholder={t('auth.placeholders.email')}
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
                  </div>

                  {/* Phone with Verification */}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="phone" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {t('auth.fields.phone')} *
                      </label>
                      <div className="flex gap-2">
                        <input
                          ref={phoneInputRef}
                          {...registerField('phone', {
                            required: 'Phone number is required',
                            validate: (value) => {
                              const cleaned = value.replace(/\D/g, '')
                              if (cleaned.length !== 10) {
                                return 'Must be exactly 10 digits'
                              }
                              return true
                            }
                          })}
                          type="tel"
                          onFocus={(e) => {
                            setTimeout(() => {
                              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            }, 100)
                          }}
                          disabled={codeSent}
                          maxLength={12}
                          inputMode="tel"
                          className={`flex-1 px-4 py-3 rounded-3xl border ${
                            errors.phone ? 'border-red-500' : codeSent ? 'border-green-500 bg-green-50' : isDarkMode ? 'border-gray-600 bg-gray-700/50 text-white' : 'border-gray-300'
                          } focus:ring-2 focus:ring-pink-500 focus:outline-none disabled:opacity-60`}
                          placeholder="5551234567"
                        />
                        <button
                          type="button"
                          onClick={handleSendCode}
                          disabled={isVerifying || codeSent || !phoneValue}
                          className={`px-6 py-3 rounded-3xl font-semibold whitespace-nowrap transition-all ${
                            codeSent
                              ? 'bg-green-600 text-white'
                              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                          } disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                        >
                          {isVerifying ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : codeSent ? (
                            <>
                              <CheckCircleIcon className="h-5 w-5" />
                              <span>Sent!</span>
                            </>
                          ) : (
                            'Send Code'
                          )}
                        </button>
                      </div>
                      {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>}
                      {!codeSent && (
                        <p className={`mt-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          📱 Enter your 10-digit phone number (we auto-detect US/Mexico)
                        </p>
                      )}
                    </div>

                    {/* Verification Code - Always visible but disabled until code sent */}
                    <motion.div
                      initial={codeSent ? { opacity: 0, y: -10 } : false}
                      animate={codeSent ? { opacity: 1, y: 0 } : {}}
                      className={!codeSent ? 'opacity-40 pointer-events-none' : ''}
                    >
                      <label htmlFor="code" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Verification Code * {!codeSent && '(Send code first)'}
                      </label>
                      <input
                        {...registerField('code', { required: 'Verification code is required' })}
                        type="text"
                        maxLength={6}
                        disabled={!codeSent}
                        className={`w-full px-4 py-3 rounded-3xl border ${
                          errors.code ? 'border-red-500' : isDarkMode ? 'border-gray-600 bg-gray-700/50 text-white' : 'border-gray-300'
                        } focus:ring-2 focus:ring-pink-500 focus:outline-none tracking-widest text-center text-2xl font-mono disabled:opacity-40 disabled:cursor-not-allowed`}
                        placeholder="000000"
                        autoComplete="off"
                      />
                      {codeSent && (
                        <div className="mt-2 space-y-2">
                          <p className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                            ✓ Code sent to {verificationPhone}
                          </p>
                          <button
                            type="button"
                            onClick={handleSendCode}
                            disabled={resendCooldown > 0}
                            className={`text-sm ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : '↻ Resend code'}
                          </button>
                        </div>
                      )}
                      {errors.code && <p className="mt-1 text-sm text-red-500">{errors.code.message}</p>}
                    </motion.div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="flex items-start gap-3">
                    <input
                      {...registerField('acceptTerms', { required: 'You must accept the terms and conditions' })}
                      type="checkbox"
                      id="acceptTerms"
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <label htmlFor="acceptTerms" className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      I agree to the <a href="/terms" target="_blank" className="text-pink-600 hover:text-pink-700 underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-pink-600 hover:text-pink-700 underline">Privacy Policy</a>
                    </label>
                  </div>
                  {errors.acceptTerms && <p className="mt-1 text-sm text-red-500">{errors.acceptTerms.message}</p>}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading || !codeSent}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <FingerPrintIcon className="h-5 w-5" />
                        <span>Complete Registration</span>
                        <ArrowRightIcon className="h-5 w-5" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAuthMethod(null)}
                    className={`w-full text-sm ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    ← Use different method
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Traditional Password Form */}
            <AnimatePresence>
              {authMethod !== 'biometric' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <button
                    onClick={() => setAuthMethod('password')}
                    className={`w-full text-sm py-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
                  >
                    {mode === 'login' ? 'Or sign in with email & password' : 'Or register with email & password'}
                  </button>

                  {authMethod === 'password' && (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
                      {mode === 'register' && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="firstName" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {t('auth.fields.firstName')} *
                              </label>
                              <input
                                {...registerField('firstName', { required: t('auth.validation.firstNameRequired') })}
                                type="text"
                                className={`w-full px-4 py-3 rounded-3xl border ${
                                  errors.firstName ? 'border-red-500' : isDarkMode ? 'border-gray-600 bg-gray-700/50 text-white' : 'border-gray-300'
                                } focus:ring-2 focus:ring-pink-500 focus:outline-none`}
                              />
                              {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>}
                            </div>

                            <div>
                              <label htmlFor="lastName" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {t('auth.fields.lastName')} *
                              </label>
                              <input
                                {...registerField('lastName', { required: t('auth.validation.lastNameRequired') })}
                                type="text"
                                className={`w-full px-4 py-3 rounded-3xl border ${
                                  errors.lastName ? 'border-red-500' : isDarkMode ? 'border-gray-600 bg-gray-700/50 text-white' : 'border-gray-300'
                                } focus:ring-2 focus:ring-pink-500 focus:outline-none`}
                              />
                              {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>}
                            </div>
                          </div>
                        </>
                      )}

                      <div>
                        <label htmlFor="email" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {t('auth.fields.email')} *
                        </label>
                        <input
                          ref={emailInputRef}
                          {...registerField('email', {
                            required: t('auth.validation.emailRequired'),
                            pattern: { value: /^\S+@\S+$/i, message: t('auth.validation.emailInvalid') }
                          })}
                          type="email"
                          onFocus={(e) => {
                            setTimeout(() => {
                              e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            }, 100)
                          }}
                          className={`w-full px-4 py-3 rounded-3xl border ${
                            errors.email ? 'border-red-500' : isDarkMode ? 'border-gray-600 bg-gray-700/50 text-white' : 'border-gray-300'
                          } focus:ring-2 focus:ring-pink-500 focus:outline-none`}
                        />
                        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
                      </div>

                      <div>
                        <label htmlFor="password" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {t('auth.fields.password')} *
                        </label>
                        <div className="relative">
                          <input
                            {...registerField('password', {
                              required: t('auth.validation.passwordRequired'),
                              minLength: { value: 8, message: 'Password must be at least 8 characters' }
                            })}
                            type={showPassword ? 'text' : 'password'}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleSubmit(onSubmit)()
                              }
                            }}
                            className={`w-full px-4 py-3 rounded-3xl border pr-10 ${
                              errors.password ? 'border-red-500' : isDarkMode ? 'border-gray-600 bg-gray-700/50 text-white' : 'border-gray-300'
                            } focus:ring-2 focus:ring-pink-500 focus:outline-none`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          >
                            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                          </button>
                        </div>
                        {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
                      </div>

                      {mode === 'register' && (
                        <div>
                          <label htmlFor="passwordConfirm" className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Confirm Password *
                          </label>
                          <div className="relative">
                            <input
                              {...registerField('passwordConfirm', {
                                required: 'Please confirm your password',
                                validate: (value) => value === watch('password') || 'Passwords do not match'
                              })}
                              type={showPassword ? 'text' : 'password'}
                              className={`w-full px-4 py-3 rounded-3xl border pr-10 ${
                                errors.passwordConfirm ? 'border-red-500' : isDarkMode ? 'border-gray-600 bg-gray-700/50 text-white' : 'border-gray-300'
                              } focus:ring-2 focus:ring-pink-500 focus:outline-none`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            >
                              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                          </div>
                          {errors.passwordConfirm && <p className="mt-1 text-sm text-red-500">{errors.passwordConfirm.message}</p>}
                        </div>
                      )}

                      {mode === 'register' && (
                        <>
                          {/* Terms & Conditions */}
                          <div className="flex items-start gap-3">
                            <input
                              {...registerField('acceptTerms', { required: 'You must accept the terms and conditions' })}
                              type="checkbox"
                              id="acceptTermsPassword"
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                            />
                            <label htmlFor="acceptTermsPassword" className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              I agree to the <a href="/terms" target="_blank" className="text-pink-600 hover:text-pink-700 underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-pink-600 hover:text-pink-700 underline">Privacy Policy</a>
                            </label>
                          </div>
                          {errors.acceptTerms && <p className="mt-1 text-sm text-red-500">{errors.acceptTerms.message}</p>}
                        </>
                      )}

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>{mode === 'login' ? t('auth.actions.signIn') : t('auth.actions.signUp')}</span>
                            <ArrowRightIcon className="h-5 w-5" />
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Switch Mode */}
            <div className="mt-8 text-center">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {mode === 'login' ? t('auth.links.noAccount') : t('auth.links.hasAccount')}{' '}
                <button
                  onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                  className="font-medium bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent hover:opacity-80"
                >
                  {mode === 'login' ? t('auth.links.signUpHere') : t('auth.links.signInHere')}
                </button>
              </p>
            </div>
          </GradientCard>
        </div>
      </div>

      {/* Biometric Registration Modal */}
      <BiometricRegistrationModal
        isOpen={showBiometricModal}
        onClose={() => setShowBiometricModal(false)}
        role={role}
      />
    </div>
  )
}
