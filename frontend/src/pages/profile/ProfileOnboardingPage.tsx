import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AtSymbolIcon,
  EnvelopeIcon,
  UserCircleIcon,
  CreditCardIcon,
  CheckCircleIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const ONBOARDING_STEPS = [
  {
    id: 'username',
    title: 'Choose Your Username',
    description: 'Pick a unique @username for your profile',
    icon: AtSymbolIcon,
    gradient: 'from-blue-500 to-cyan-500',
    required: true,
  },
  {
    id: 'email',
    title: 'Verify Your Email',
    description: 'Add and verify your email address',
    icon: EnvelopeIcon,
    gradient: 'from-pink-500 to-red-500',
    required: true,
  },
  {
    id: 'avatar',
    title: 'Choose Your Avatar',
    description: 'Select an avatar or upload your photo',
    icon: UserCircleIcon,
    gradient: 'from-purple-500 to-pink-500',
    required: true,
  },
  {
    id: 'payment',
    title: 'Payment Method',
    description: 'Set up your default payment method',
    icon: CreditCardIcon,
    gradient: 'from-green-500 to-emerald-500',
    required: true,
  }
]

const STORAGE_KEY = 'beautycita-onboarding-progress'

// Predefined avatars
const AVATARS = [
  '/media/img/avatar/A0.png',
  '/media/img/avatar/A1.png',
  '/media/img/avatar/A2.png',
  '/media/img/avatar/A4.png',
  '/media/img/avatar/A5.png',
  '/media/img/avatar/A6.png',
  '/media/img/avatar/A7.png',
  '/media/img/avatar/A8.png',
  '/media/img/avatar/A9.png',
  '/media/img/avatar/A10.png',
  '/media/img/avatar/A11.png',
  '/media/img/avatar/A12.png',
]

export default function ProfileOnboardingPage() {
  const { user, updateProfile } = useAuthStore()
  const navigate = useNavigate()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])

  // Step data
  const [username, setUsername] = useState('')
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  const [email, setEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [emailCodeSent, setEmailCodeSent] = useState(false)
  const [emailVerifying, setEmailVerifying] = useState(false)

  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'btcpay' | null>(null)
  const [btcWalletRequested, setBtcWalletRequested] = useState(false)

  // Prevent closing/navigating away during onboarding
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'You must complete onboarding before leaving.'
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Load saved progress on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem(STORAGE_KEY)
    if (savedProgress) {
      try {
        const { stepIndex, completed } = JSON.parse(savedProgress)
        setCompletedSteps(completed || [])
        setCurrentStepIndex(stepIndex || 0)
      } catch (error) {
        console.error('[ONBOARDING] Failed to parse saved progress:', error)
      }
    }
  }, [])

  // Save progress whenever it changes
  useEffect(() => {
    const progress = {
      stepIndex: currentStepIndex,
      completed: completedSteps,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  }, [currentStepIndex, completedSteps])

  const goToNextStep = () => {
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    } else {
      handleFinishOnboarding()
    }
  }

  const goToPreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => {
      if (!prev.includes(stepId)) {
        return [...prev, stepId]
      }
      return prev
    })
    goToNextStep()
  }

  const handleFinishOnboarding = async () => {
    try {
      await updateProfile({ profile_complete: true })
      localStorage.removeItem(STORAGE_KEY)
      toast.success('Welcome to BeautyCita! 🎉')
      navigate('/panel', { replace: true })
    } catch (error) {
      console.error('[ONBOARDING] Failed to complete onboarding:', error)
      toast.error('Failed to save onboarding progress')
    }
  }

  // Username check
  const checkUsernameAvailability = async (value: string) => {
    if (!value || value.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setUsernameChecking(true)
    try {
      const response = await axios.get(`${API_URL}/api/user/username/availability/${value}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('beautycita-auth') ? JSON.parse(localStorage.getItem('beautycita-auth')!).state.token : ''}`
        }
      })
      setUsernameAvailable(response.data.available)
    } catch (error) {
      console.error('Username check error:', error)
      setUsernameAvailable(false)
    } finally {
      setUsernameChecking(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (username) {
        checkUsernameAvailability(username)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [username])

  const handleUsernameSubmit = async () => {
    if (!username || username.length < 3 || usernameAvailable !== true) {
      toast.error('Please choose a valid, available username')
      return
    }

    try {
      await updateProfile({ username })
      handleStepComplete('username')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to set username')
    }
  }

  // Email verification
  const handleSendEmailCode = async () => {
    if (!email || !/^\S+@\S+$/i.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setEmailVerifying(true)
    try {
      await axios.post(`${API_URL}/api/verify/send-email-code`, { email })
      setEmailCodeSent(true)
      toast.success('Verification code sent to your email!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send verification code')
    } finally {
      setEmailVerifying(false)
    }
  }

  const handleVerifyEmail = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter the 6-digit verification code')
      return
    }

    setEmailVerifying(true)
    try {
      const response = await axios.post(`${API_URL}/api/verify/verify-email`, {
        email,
        code: verificationCode
      })

      if (response.data.success) {
        await updateProfile({ email, emailVerified: true })
        handleStepComplete('email')
      } else {
        toast.error('Invalid verification code')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Email verification failed')
    } finally {
      setEmailVerifying(false)
    }
  }

  // Avatar selection
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      setAvatarFile(file)
      setSelectedAvatar(null)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleAvatarSubmit = async () => {
    if (!selectedAvatar && !avatarFile) {
      toast.error('Please select an avatar or upload a photo')
      return
    }

    try {
      if (avatarFile) {
        const formData = new FormData()
        formData.append('profilePicture', avatarFile)
        const token = localStorage.getItem('beautycita-auth') ? JSON.parse(localStorage.getItem('beautycita-auth')!).state.token : ''
        await axios.post(`${API_URL}/api/user/profile/picture`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        })
      } else if (selectedAvatar) {
        await updateProfile({ profilePictureUrl: selectedAvatar })
      }
      handleStepComplete('avatar')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to set avatar')
    }
  }

  // Payment setup
  const handleRequestBTCPayWallet = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/payments/btcpay/request-wallet`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      })

      if (response.data.success) {
        toast.success('BTCPay wallet requested! You will receive deposit instructions via email.')
        setBtcWalletRequested(true)
        setPaymentMethod('btcpay')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to request BTCPay wallet')
    }
  }

  const handlePaymentSubmit = async () => {
    if (!paymentMethod) {
      toast.error('Please select a payment method')
      return
    }

    // Payment method selection is recorded, but not stored in users table
    // It will be handled during actual payment processing
    handleStepComplete('payment')
  }

  const currentStepData = ONBOARDING_STEPS[currentStepIndex]
  const Icon = currentStepData.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Complete Your Profile</h1>
                <p className="text-sm text-gray-600">Required to access your account</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStepIndex + 1} of {ONBOARDING_STEPS.length}
              </span>
              <span className="text-sm text-gray-600">
                {Math.round(((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100)}% complete
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          {ONBOARDING_STEPS.map((step, index) => {
            const StepIcon = step.icon
            const isCompleted = completedSteps.includes(step.id)
            const isCurrent = index === currentStepIndex
            const isPast = index < currentStepIndex

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isCompleted
                        ? 'bg-green-500'
                        : isCurrent
                        ? `bg-gradient-to-br ${step.gradient}`
                        : 'bg-gray-200'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircleIcon className="w-6 h-6 text-white" />
                    ) : (
                      <StepIcon className={`w-6 h-6 ${isCurrent || isPast ? 'text-white' : 'text-gray-400'}`} />
                    )}
                  </div>
                  <span className={`text-xs font-medium text-center ${isCurrent ? 'text-purple-600' : 'text-gray-500'}`}>
                    {step.title}
                  </span>
                </div>

                {index < ONBOARDING_STEPS.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 -mt-8 transition-colors ${
                      isPast || isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Step Header */}
          <div className="text-center mb-8">
            <div className={`w-20 h-20 bg-gradient-to-br ${currentStepData.gradient} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <Icon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentStepData.title}</h2>
            <p className="text-gray-600">{currentStepData.description}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
              Required
            </span>
          </div>

          {/* Step Content with Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* STEP 1: Username */}
              {currentStepData.id === 'username' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="username"
                        maxLength={20}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>
                    <div className="mt-2 min-h-[20px]">
                      {usernameChecking && (
                        <p className="text-sm text-gray-500">Checking availability...</p>
                      )}
                      {!usernameChecking && usernameAvailable === true && username.length >= 3 && (
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          <CheckCircleIcon className="w-4 h-4" />
                          @{username} is available!
                        </p>
                      )}
                      {!usernameChecking && usernameAvailable === false && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <XMarkIcon className="w-4 h-4" />
                          @{username} is already taken
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      This username will be permanent and cannot be changed later
                    </p>
                  </div>

                  <button
                    onClick={handleUsernameSubmit}
                    disabled={!username || username.length < 3 || usernameAvailable !== true}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Continue →
                  </button>
                </div>
              )}

              {/* STEP 2: Email Verification */}
              {currentStepData.id === 'email' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={emailCodeSent}
                        placeholder="you@example.com"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:opacity-60"
                      />
                      {!emailCodeSent && (
                        <button
                          onClick={handleSendEmailCode}
                          disabled={emailVerifying || !email}
                          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl whitespace-nowrap disabled:opacity-50"
                        >
                          {emailVerifying ? 'Sending...' : 'Send Code'}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      This email will be permanent and cannot be changed later
                    </p>
                  </div>

                  {emailCodeSent && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <p className="text-sm text-green-900">
                          ✓ Code sent to {email}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Verification Code *
                        </label>
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                          maxLength={6}
                          placeholder="000000"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none text-center text-2xl font-mono tracking-widest"
                        />
                      </div>

                      <button
                        onClick={handleVerifyEmail}
                        disabled={emailVerifying || verificationCode.length !== 6}
                        className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {emailVerifying ? 'Verifying...' : 'Verify Email →'}
                      </button>
                    </motion.div>
                  )}

                  {currentStepIndex > 0 && (
                    <button
                      onClick={goToPreviousStep}
                      className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      ← Back
                    </button>
                  )}
                </div>
              )}

              {/* STEP 3: Avatar */}
              {currentStepData.id === 'avatar' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Choose a Predefined Avatar
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {AVATARS.map((avatar, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedAvatar(avatar)
                            setAvatarFile(null)
                            setAvatarPreview(null)
                          }}
                          className={`relative aspect-square rounded-2xl overflow-hidden border-4 transition-all ${
                            selectedAvatar === avatar
                              ? 'border-purple-500 scale-105 shadow-lg'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                          {selectedAvatar === avatar && (
                            <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                              <CheckCircleIcon className="w-8 h-8 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">or upload your own</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Your Photo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 transition-colors"
                    >
                      {avatarPreview ? (
                        <div className="flex items-center gap-4">
                          <img src={avatarPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover" />
                          <span className="text-sm text-gray-600">Click to change photo</span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <UserCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <span className="text-sm text-gray-600">Click to upload (max 5MB)</span>
                        </div>
                      )}
                    </label>
                  </div>

                  <button
                    onClick={handleAvatarSubmit}
                    disabled={!selectedAvatar && !avatarFile}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Continue →
                  </button>

                  <button
                    onClick={goToPreviousStep}
                    className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    ← Back
                  </button>
                </div>
              )}

              {/* STEP 4: Payment */}
              {currentStepData.id === 'payment' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {/* Stripe Option */}
                    <button
                      onClick={() => setPaymentMethod('stripe')}
                      className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
                        paymentMethod === 'stripe'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Credit/Debit Card (Stripe)</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Pay with Visa, Mastercard, Amex, or Apple Pay
                          </p>
                        </div>
                        {paymentMethod === 'stripe' && (
                          <CheckCircleIcon className="w-6 h-6 text-purple-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>

                    {/* BTCPay Option */}
                    <button
                      onClick={() => {
                        setPaymentMethod('btcpay')
                        if (!btcWalletRequested) {
                          handleRequestBTCPayWallet()
                        }
                      }}
                      className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
                        paymentMethod === 'btcpay'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Bitcoin (BTCPay)</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Request a BTCPay wallet for Bitcoin deposits
                          </p>
                          {btcWalletRequested && (
                            <p className="text-sm text-green-600 mt-2">
                              ✓ Wallet requested! Check your email for deposit instructions.
                            </p>
                          )}
                        </div>
                        {paymentMethod === 'btcpay' && (
                          <CheckCircleIcon className="w-6 h-6 text-orange-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  </div>

                  <button
                    onClick={handlePaymentSubmit}
                    disabled={!paymentMethod}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    Complete Onboarding 🎉
                  </button>

                  <button
                    onClick={goToPreviousStep}
                    className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    ← Back
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
