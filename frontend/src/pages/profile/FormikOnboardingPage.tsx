import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AtSymbolIcon,
  EnvelopeIcon,
  UserCircleIcon,
  CheckCircleIcon,
  SparklesIcon,
  XMarkIcon,
  MapPinIcon,
  HeartIcon,
  CameraIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  StarIcon,
  BoltIcon,
  FireIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import axios from 'axios'
// Removed confetti import - was causing screen flashing

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const AVATARS = [
  '/media/img/avatar/A0.webp',
  '/media/img/avatar/A1.webp',
  '/media/img/avatar/A2.webp',
  '/media/img/avatar/A4.webp',
  '/media/img/avatar/A5.webp',
  '/media/img/avatar/A6.webp',
  '/media/img/avatar/A7.webp',
  '/media/img/avatar/A8.webp',
  '/media/img/avatar/A9.webp',
  '/media/img/avatar/A10.webp',
  '/media/img/avatar/A11.webp',
  '/media/img/avatar/A12.webp',
]

const SERVICE_INTERESTS = [
  { id: 'hair', label: 'Hair Styling', icon: '💇', gradient: 'from-purple-500 to-pink-500' },
  { id: 'nails', label: 'Nails', icon: '💅', gradient: 'from-pink-500 to-rose-500' },
  { id: 'makeup', label: 'Makeup', icon: '💄', gradient: 'from-rose-500 to-red-500' },
  { id: 'skincare', label: 'Skincare', icon: '✨', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'massage', label: 'Massage', icon: '💆', gradient: 'from-green-500 to-emerald-500' },
  { id: 'waxing', label: 'Waxing', icon: '🌟', gradient: 'from-yellow-500 to-orange-500' },
]

// Validation schemas
const step1Schema = Yup.object({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .matches(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores')
    .required('Username is required')
})

const step2Schema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  verificationCode: Yup.string()
    .matches(/^[0-9]{6}$/, 'Code must be 6 digits')
    .required('Verification code is required')
})

const step3Schema = Yup.object({
  selectedAvatar: Yup.string().nullable(),
  uploadedFile: Yup.mixed().nullable()
}).test('avatar-required', 'Please select or upload an avatar', function(values) {
  return values.selectedAvatar || values.uploadedFile
})

const step4Schema = Yup.object({
  serviceInterests: Yup.array().min(1, 'Select at least one interest'),
  location: Yup.string().optional()
})

export default function UltimateOnboardingWizard() {
  const { updateProfile, user } = useAuthStore()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const totalSteps = 4

  // Prevent access if onboarding is already complete
  useEffect(() => {
    if (user?.profileComplete || user?.profile_complete) {
      toast('You have already completed onboarding', { icon: 'ℹ️' })
      navigate('/panel', { replace: true })
    }
  }, [user, navigate])

  const initialValues = {
    username: '',
    email: '',
    verificationCode: '',
    selectedAvatar: null as string | null,
    uploadedFile: null as File | null,
    serviceInterests: [] as string[],
    location: ''
  }

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setUsernameChecking(true)
    try {
      const token = localStorage.getItem('beautycita-auth')
        ? JSON.parse(localStorage.getItem('beautycita-auth')!).state.token
        : ''

      const response = await axios.get(
        `${API_URL}/api/user/username/availability/${username}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setUsernameAvailable(response.data.available)
      return response.data.available
    } catch (error) {
      console.error('Username check error:', error)
      setUsernameAvailable(false)
      return false
    } finally {
      setUsernameChecking(false)
    }
  }

  const sendVerificationCode = async (email: string) => {
    try {
      await axios.post(`${API_URL}/api/verify/send-email-code`, { email })
      setCodeSent(true)
      toast.success('Verification code sent to your email! 📧', {
        duration: 4000,
        icon: '✨'
      })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send code')
    }
  }

  // Removed triggerConfetti function - was causing excessive screen flashing

  const handleSubmit = async (values: typeof initialValues) => {
    console.log('[ULTIMATE_ONBOARDING] Final submit:', values)
    setIsSubmitting(true)

    const token = localStorage.getItem('beautycita-auth')
      ? JSON.parse(localStorage.getItem('beautycita-auth')!).state.token
      : ''

    try {
      // 1. Save username
      await updateProfile({ username: values.username })

      // 2. Verify email code and save
      const verifyResponse = await axios.post(`${API_URL}/api/verify/verify-email`, {
        email: values.email,
        code: values.verificationCode
      })

      if (!verifyResponse.data.success) {
        toast.error('Invalid verification code. Please try again.')
        setCurrentStep(2)
        setIsSubmitting(false)
        return
      }

      await updateProfile({ email: values.email, emailVerified: true })

      // 3. Save avatar
      if (values.uploadedFile) {
        const formData = new FormData()
        formData.append('profilePicture', values.uploadedFile)
        await axios.post(`${API_URL}/api/user/profile/picture`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        })
      } else if (values.selectedAvatar) {
        await updateProfile({ profilePictureUrl: values.selectedAvatar })
      }

      // 4. Save service interests (as metadata or preferences)
      if (values.serviceInterests.length > 0) {
        // Store in user metadata or preferences table
        await axios.post(`${API_URL}/api/user/preferences`, {
          serviceInterests: values.serviceInterests,
          location: values.location
        }, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => console.log('Preferences save failed (optional):', err))
      }

      // 5. Mark complete and wait for state to persist
      console.log('[ULTIMATE_ONBOARDING] Marking profile as complete...')
      const success = await updateProfile({ profile_complete: true })

      if (!success) {
        console.error('[ULTIMATE_ONBOARDING] Failed to mark profile complete')
        toast.error('Failed to save profile. Please try again.')
        setIsSubmitting(false)
        return
      }

      console.log('[ULTIMATE_ONBOARDING] Profile marked complete, waiting for state to persist...')

      console.log('[ULTIMATE_ONBOARDING] Redirecting to panel...')
      toast.success('Welcome to BeautyCita!', {
        duration: 3000
      })

      // Use window.location for full page reload to ensure state is fresh
      window.location.href = '/panel'
    } catch (error: any) {
      console.error('[ULTIMATE_ONBOARDING] Error:', error)
      toast.error(error.response?.data?.message || 'Failed to complete onboarding')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 100, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -100, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl relative z-10"
      >
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="inline-flex items-center space-x-3 mb-6"
          >
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-2xl">
              <SparklesIcon className="w-10 h-10 text-purple-600" />
            </div>
            <span className="text-4xl font-serif font-bold text-white drop-shadow-lg">
              BeautyCita
            </span>
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-md">Create Your Account</h1>
          <p className="text-white/90 text-lg">Step {currentStep} of {totalSteps}</p>
        </div>

        {/* Modern Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {Array.from({ length: totalSteps }).map((_, index) => {
              const stepNum = index + 1
              const isCompleted = stepNum < currentStep
              const isCurrent = stepNum === currentStep

              return (
                <div key={stepNum} className="flex items-center flex-1">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                        isCompleted
                          ? 'bg-white text-green-600 shadow-xl'
                          : isCurrent
                          ? 'bg-white text-purple-600 shadow-2xl scale-110'
                          : 'bg-white/30 text-white'
                      }`}
                    >
                      {isCompleted ? <CheckCircleSolid className="w-7 h-7" /> : stepNum}
                    </div>
                    {isCurrent && (
                      <motion.div
                        className="absolute inset-0 bg-white rounded-2xl"
                        initial={{ opacity: 0.5, scale: 1 }}
                        animate={{ opacity: 0, scale: 1.5 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                  {index < totalSteps - 1 && (
                    <div className="flex-1 h-2 mx-2 bg-white/30 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-white"
                        initial={{ width: 0 }}
                        animate={{ width: isCompleted ? '100%' : '0%' }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Card */}
        <motion.div
          className="bg-white rounded-3xl shadow-2xl p-8 md:p-12"
          layout
        >
          <Formik
            initialValues={initialValues}
            validationSchema={
              currentStep === 1 ? step1Schema :
              currentStep === 2 ? step2Schema :
              currentStep === 3 ? step3Schema :
              step4Schema
            }
            onSubmit={handleSubmit}
            validateOnChange={true}
            validateOnBlur={true}
          >
            {({ values, errors, touched, setFieldValue, validateForm }) => (
              <Form>
                <AnimatePresence mode="wait">
                  {/* STEP 1: Username */}
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-center mb-10">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", bounce: 0.6 }}
                          className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                        >
                          <AtSymbolIcon className="w-14 h-14 text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                          Choose Your Username
                        </h2>
                        <p className="text-gray-600 text-lg">Pick a unique @username that represents you</p>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            Username
                          </label>
                          <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-purple-500 text-2xl font-bold">@</span>
                            <Field
                              name="username"
                              type="text"
                              className="w-full pl-14 pr-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all font-semibold text-lg"
                              placeholder="username"
                              maxLength={20}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                                setFieldValue('username', value)
                                if (value.length >= 3) {
                                  checkUsernameAvailability(value)
                                } else {
                                  setUsernameAvailable(null)
                                }
                              }}
                            />
                            {usernameAvailable === true && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute right-5 top-1/2 -translate-y-1/2"
                              >
                                <div className="p-1 bg-green-500 rounded-full">
                                  <CheckCircleSolid className="w-6 h-6 text-white" />
                                </div>
                              </motion.div>
                            )}
                          </div>
                          <ErrorMessage name="username" component="div" className="text-sm text-red-600 mt-2 font-medium" />
                          <AnimatePresence>
                            {usernameChecking && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-sm text-gray-500 mt-2 flex items-center gap-2"
                              >
                                <motion.span
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                >
                                  ✨
                                </motion.span>
                                Checking availability...
                              </motion.p>
                            )}
                            {usernameAvailable === true && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl"
                              >
                                <p className="text-sm text-green-700 font-semibold flex items-center gap-2">
                                  <CheckCircleSolid className="w-5 h-5" />
                                  Available! This username is yours 🎉
                                </p>
                              </motion.div>
                            )}
                            {usernameAvailable === false && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl"
                              >
                                <p className="text-sm text-red-700 font-semibold flex items-center gap-2">
                                  <XMarkIcon className="w-5 h-5" />
                                  Already taken. Try another one!
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <motion.button
                          type="button"
                          onClick={async () => {
                            const formErrors = await validateForm()
                            if (!formErrors.username && usernameAvailable === true) {
                              setCurrentStep(2)
                            } else {
                              toast.error('Please choose an available username')
                            }
                          }}
                          disabled={!values.username || usernameAvailable !== true || !!errors.username}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-lg"
                        >
                          Continue
                          <ArrowRightIcon className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: Email Verification */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-center mb-10">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", bounce: 0.6 }}
                          className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                        >
                          <EnvelopeIcon className="w-14 h-14 text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                          Verify Your Email
                        </h2>
                        <p className="text-gray-600 text-lg">We'll send you a magic 6-digit code</p>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            Email Address
                          </label>
                          <div className="flex gap-3">
                            <Field
                              name="email"
                              type="email"
                              disabled={codeSent}
                              className="flex-1 px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all font-medium text-lg disabled:opacity-60 disabled:bg-gray-50"
                              placeholder="you@example.com"
                            />
                            {!codeSent && (
                              <motion.button
                                type="button"
                                onClick={() => sendVerificationCode(values.email)}
                                disabled={!values.email || !!errors.email}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                              >
                                Send Code
                              </motion.button>
                            )}
                          </div>
                          <ErrorMessage name="email" component="div" className="text-sm text-red-600 mt-2 font-medium" />
                        </div>

                        <AnimatePresence>
                          {codeSent && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                                Verification Code
                              </label>
                              <Field
                                name="verificationCode"
                                type="text"
                                maxLength={6}
                                className="w-full px-5 py-5 border-2 border-gray-200 rounded-2xl text-center text-4xl font-bold font-mono tracking-widest focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all"
                                placeholder="000000"
                              />
                              <ErrorMessage name="verificationCode" component="div" className="text-sm text-red-600 mt-2 font-medium text-center" />
                              <p className="text-sm text-gray-500 text-center mt-3">
                                Check your email inbox and spam folder
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex gap-3 pt-4">
                          <motion.button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-lg"
                          >
                            <ArrowLeftIcon className="w-5 h-5" />
                            Back
                          </motion.button>
                          <motion.button
                            type="button"
                            onClick={async () => {
                              if (!codeSent) {
                                await sendVerificationCode(values.email)
                              } else {
                                const formErrors = await validateForm()
                                if (!formErrors.email && !formErrors.verificationCode) {
                                  setCurrentStep(3)
                                } else {
                                  toast.error('Please enter the verification code')
                                }
                              }
                            }}
                            disabled={codeSent && (!values.verificationCode || values.verificationCode.length !== 6)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                          >
                            Continue
                            <ArrowRightIcon className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: Avatar */}
                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-center mb-10">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", bounce: 0.6 }}
                          className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                        >
                          <UserCircleIcon className="w-14 h-14 text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                          Choose Your Avatar
                        </h2>
                        <p className="text-gray-600 text-lg">Pick a profile picture that shows your style</p>
                      </div>

                      <div className="space-y-8">
                        {/* Upload Photo */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                            Upload Your Photo
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  toast.error('File must be less than 5MB')
                                  return
                                }
                                setFieldValue('uploadedFile', file)
                                setFieldValue('selectedAvatar', null)
                                setUploadPreview(URL.createObjectURL(file))
                              }
                            }}
                            className="hidden"
                            id="avatar-upload"
                          />
                          <label
                            htmlFor="avatar-upload"
                            className="group flex items-center justify-center w-full px-6 py-10 border-2 border-dashed border-gray-300 rounded-3xl cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-all"
                          >
                            {uploadPreview ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center gap-6"
                              >
                                <div className="relative">
                                  <img loading="lazy" src={uploadPreview} alt="Preview" className="w-24 h-24 rounded-3xl object-cover border-4 border-purple-500 shadow-xl" />
                                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                    <CheckCircleSolid className="w-5 h-5 text-white" />
                                  </div>
                                </div>
                                <div className="text-left">
                                  <p className="text-lg font-bold text-gray-900 mb-1">Photo uploaded! ✨</p>
                                  <p className="text-sm text-gray-600">Click to change</p>
                                </div>
                              </motion.div>
                            ) : (
                              <div className="text-center">
                                <motion.div
                                  whileHover={{ scale: 1.1, rotate: 5 }}
                                  className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-xl transition-shadow"
                                >
                                  <CameraIcon className="w-9 h-9 text-white" />
                                </motion.div>
                                <p className="text-lg font-bold text-gray-900 mb-1">Click to upload</p>
                                <p className="text-sm text-gray-500">Max 5MB (JPG, PNG, WEBP)</p>
                              </div>
                            )}
                          </label>
                        </div>

                        {/* Divider */}
                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t-2 border-gray-200"></div>
                          </div>
                          <div className="relative flex justify-center">
                            <span className="px-4 bg-white text-gray-500 font-semibold">or choose preset</span>
                          </div>
                        </div>

                        {/* Predefined Avatars */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                            Preset Avatars
                          </label>
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                            {AVATARS.map((avatar, index) => (
                              <motion.button
                                key={avatar}
                                type="button"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => {
                                  setFieldValue('selectedAvatar', avatar)
                                  setFieldValue('uploadedFile', null)
                                  setUploadPreview(null)
                                }}
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                whileTap={{ scale: 0.95 }}
                                className={`relative aspect-square rounded-3xl overflow-hidden border-4 transition-all duration-200 ${
                                  values.selectedAvatar === avatar
                                    ? 'border-purple-500 shadow-2xl scale-105'
                                    : 'border-gray-200 hover:border-purple-300'
                                }`}
                              >
                                <img loading="lazy" src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                                {values.selectedAvatar === avatar && (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 bg-purple-500/30 flex items-center justify-center backdrop-blur-sm"
                                  >
                                    <CheckCircleSolid className="w-10 h-10 text-white drop-shadow-2xl" />
                                  </motion.div>
                                )}
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <motion.button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-lg"
                          >
                            <ArrowLeftIcon className="w-5 h-5" />
                            Back
                          </motion.button>
                          <motion.button
                            type="button"
                            onClick={() => {
                              if (values.selectedAvatar || values.uploadedFile) {
                                setCurrentStep(4)
                              } else {
                                toast.error('Please select or upload an avatar')
                              }
                            }}
                            disabled={!values.selectedAvatar && !values.uploadedFile}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                          >
                            Continue
                            <ArrowRightIcon className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4: Interests & Complete */}
                  {currentStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="text-center mb-10">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", bounce: 0.6 }}
                          className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                        >
                          <HeartIcon className="w-14 h-14 text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                          What Interests You?
                        </h2>
                        <p className="text-gray-600 text-lg">Help us personalize your experience</p>
                      </div>

                      <div className="space-y-8">
                        {/* Service Interests */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                            Select Your Interests (at least 1)
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {SERVICE_INTERESTS.map((service, index) => {
                              const isSelected = values.serviceInterests.includes(service.id)

                              return (
                                <motion.button
                                  key={service.id}
                                  type="button"
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  onClick={() => {
                                    const newInterests = isSelected
                                      ? values.serviceInterests.filter(i => i !== service.id)
                                      : [...values.serviceInterests, service.id]
                                    setFieldValue('serviceInterests', newInterests)
                                  }}
                                  whileHover={{ scale: 1.05, y: -5 }}
                                  whileTap={{ scale: 0.95 }}
                                  className={`relative p-4 rounded-2xl border-2 transition-all duration-200 ${
                                    isSelected
                                      ? `bg-gradient-to-br ${service.gradient} border-transparent text-white shadow-xl`
                                      : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700 hover:shadow-lg'
                                  }`}
                                >
                                  <div className="text-3xl mb-2">{service.icon}</div>
                                  <div className="font-bold text-sm">{service.label}</div>
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-lg"
                                    >
                                      <CheckCircleSolid className={`w-6 h-6 bg-gradient-to-br ${service.gradient} bg-clip-text text-transparent`} />
                                    </motion.div>
                                  )}
                                </motion.button>
                              )
                            })}
                          </div>
                          <ErrorMessage name="serviceInterests" component="div" className="text-sm text-red-600 mt-2 font-medium" />
                        </div>

                        {/* Location (optional) */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            Location (Optional)
                          </label>
                          <div className="relative">
                            <MapPinIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                            <Field
                              name="location"
                              type="text"
                              className="w-full pl-14 pr-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all font-medium"
                              placeholder="City, State"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Help us find nearby stylists</p>
                        </div>

                        {/* Success Preview */}
                        <AnimatePresence>
                          {values.serviceInterests.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-6 border-2 border-green-200"
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                                  <FireIcon className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    Perfect! You're all set 🎉
                                  </h3>
                                  <p className="text-sm text-gray-700 mb-3">
                                    You selected {values.serviceInterests.length} interest{values.serviceInterests.length > 1 ? 's' : ''}.
                                    We'll show you stylists and services you'll love!
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {values.serviceInterests.map(id => {
                                      const service = SERVICE_INTERESTS.find(s => s.id === id)
                                      return service ? (
                                        <span key={id} className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-gray-700 border border-green-200">
                                          {service.icon} {service.label}
                                        </span>
                                      ) : null
                                    })}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="flex gap-3 pt-4">
                          <motion.button
                            type="button"
                            onClick={() => setCurrentStep(3)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50"
                          >
                            <ArrowLeftIcon className="w-5 h-5" />
                            Back
                          </motion.button>
                          <motion.button
                            type="submit"
                            disabled={values.serviceInterests.length === 0 || isSubmitting}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                          >
                            {isSubmitting ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                />
                                Finishing up...
                              </>
                            ) : (
                              <>
                                <StarIcon className="w-5 h-5" />
                                Get Started!
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Form>
            )}
          </Formik>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-white/80 text-sm mt-8">
          By creating an account, you agree to our Terms & Privacy Policy
        </p>
      </motion.div>
    </div>
  )
}
