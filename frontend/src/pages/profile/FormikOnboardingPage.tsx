import { useState, useEffect } from 'react'
import { getMediaUrl } from '@/config/media'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
  CreditCardIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  StarIcon,
  BoltIcon,
  FireIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'
import { useAuthStore } from '../../store/authStore'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import axios from 'axios'
import LocationPicker from '../../components/ui/LocationPicker'
// Removed confetti import - was causing screen flashing

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCsy8MrU8leZ1HonRBL40s804jW91Xb5Nc'

const AVATARS = [
  getMediaUrl('img/avatar/A0.webp'),
  getMediaUrl('img/avatar/A1.webp'),
  getMediaUrl('img/avatar/A2.webp'),
  getMediaUrl('img/avatar/A4.webp'),
  getMediaUrl('img/avatar/A5.webp'),
  getMediaUrl('img/avatar/A6.webp'),
  getMediaUrl('img/avatar/A7.webp'),
  getMediaUrl('img/avatar/A8.webp'),
  getMediaUrl('img/avatar/A9.webp'),
  getMediaUrl('img/avatar/A10.webp'),
  getMediaUrl('img/avatar/A11.webp'),
  getMediaUrl('img/avatar/A12.webp'),
]

// Service interests removed - not needed for stylist onboarding

const STYLIST_SPECIALTIES = [
  'Hair Styling', 'Hair Coloring', 'Haircuts', 'Blowouts',
  'Manicure', 'Pedicure', 'Nail Art', 'Gel Nails',
  'Makeup Application', 'Bridal Makeup', 'Special Event Makeup',
  'Facials', 'Skincare', 'Waxing', 'Massage Therapy',
  'Eyelash Extensions', 'Eyebrow Shaping', 'Microblading'
]

const SERVICE_CATEGORIES = [
  'Hair Services', 'Nail Services', 'Makeup Services',
  'Skincare Services', 'Waxing Services', 'Massage Services',
  'Eyelash & Brow Services', 'Other'
]

// Validation schemas
const step1Schema = Yup.object({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .matches(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores')
    .required('Username is required')
    .test('username-unique', 'Username is already taken', async function(value) {
      if (!value || value.length < 3) return true // Skip if empty or too short
      try {
        const response = await axios.get(`${API_URL}/api/auth/check-username/${value}`)
        return response.data.available
      } catch (error) {
        return true // If check fails, allow submission
      }
    })
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
  businessName: Yup.string()
    .min(2, 'Business name must be at least 2 characters')
    .required('Business name is required'),
  bio: Yup.string()
    .min(50, 'Bio must be at least 50 characters')
    .max(1000, 'Bio must be less than 1000 characters')
    .required('Bio is required'),
  selectedSpecialties: Yup.array()
    .min(1, 'Select at least one specialty')
    .required('Specialties are required'),
  experienceYears: Yup.number()
    .min(0, 'Experience must be 0 or more')
    .max(50, 'Experience must be less than 50 years')
    .required('Experience is required')
})

const step4Schema = Yup.object({
  locationData: Yup.object({
    address: Yup.string().required('Address is required'),
    latitude: Yup.number().required('Location coordinates required'),
    longitude: Yup.number().required('Location coordinates required'),
    city: Yup.string(),
    state: Yup.string()
  }).required('Please select your business location')
})

const step5Schema = Yup.object({
  serviceName: Yup.string()
    .min(3, 'Service name must be at least 3 characters')
    .required('Service name is required'),
  serviceCategory: Yup.string()
    .required('Service category is required'),
  serviceDuration: Yup.number()
    .min(15, 'Duration must be at least 15 minutes')
    .max(480, 'Duration must be less than 8 hours')
    .required('Duration is required'),
  servicePrice: Yup.number()
    .min(1, 'Price must be at least $1')
    .required('Price is required')
})

const step6Schema = Yup.object({
  stripeConnected: Yup.boolean()
    .oneOf([true], 'You must complete Stripe onboarding to receive payments')
})

const step7Schema = Yup.object({
  agreeToPlatformTerms: Yup.boolean()
    .oneOf([true], 'You must agree to the platform terms to continue')
})

export default function UltimateOnboardingWizard() {
  const { updateProfile, user } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stripeOnboardingUrl, setStripeOnboardingUrl] = useState<string | null>(null)
  const [stripeAccountStatus, setStripeAccountStatus] = useState<'not_started' | 'pending' | 'complete'>('not_started')

  const totalSteps = 7

  // Prevent access if onboarding is already complete
  useEffect(() => {
    if (user?.profileComplete || user?.profile_complete) {
      toast('You have already completed onboarding', { icon: 'ℹ️' })
      navigate('/panel', { replace: true })
    }
  }, [user, navigate])

  // Detect Stripe completion from URL params
  useEffect(() => {
    const stripeComplete = searchParams.get('stripe_complete')
    const stripeRefresh = searchParams.get('stripe_refresh')
    const stepParam = searchParams.get('step')

    if (stripeComplete === 'true') {
      setStripeAccountStatus('complete')
      toast.success('Stripe account connected successfully!')
      if (stepParam === '6') {
        setCurrentStep(6)
      }
      // Clean up URL params
      searchParams.delete('stripe_complete')
      searchParams.delete('step')
      setSearchParams(searchParams, { replace: true })
    } else if (stripeRefresh === 'true') {
      setStripeAccountStatus('pending')
      toast.info('Please complete your Stripe setup')
      if (stepParam === '6') {
        setCurrentStep(6)
      }
      searchParams.delete('stripe_refresh')
      searchParams.delete('step')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const initialValues = {
    username: '',
    email: '',
    verificationCode: '',
    businessName: '',
    bio: '',
    selectedSpecialties: [] as string[],
    experienceYears: '' as string | number,
    locationData: {
      address: '',
      latitude: 0,
      longitude: 0,
      city: '',
      state: ''
    },
    serviceName: '',
    serviceCategory: '',
    serviceDuration: '' as string | number,
    servicePrice: '' as string | number,
    stripeConnected: false,
    agreeToPlatformTerms: false
  }

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setUsernameChecking(true)
    try {
      const response = await axios.get(`${API_URL}/api/auth/check-username/${username}`)
      setUsernameAvailable(response.data.available)
      return response.data.available
    } catch (error) {
      console.error('Username check error:', error)
      // On error, set to null (not false) to avoid showing "already taken"
      setUsernameAvailable(null)
      return true // Allow submission if check fails
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

  const handleSubmit = async (values: any) => {
    console.log('[STYLIST_ONBOARDING] Final submit:', values)
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

      // 3. Create stylist profile with business info
      const stylistData = {
        business_name: values.businessName,
        bio: values.bio,
        specialties: values.selectedSpecialties,
        experience_years: Number(values.experienceYears),
        location_address: values.locationData.address,
        location_city: values.locationData.city || '',
        location_state: values.locationData.state || '',
        location_zip: '',
        location_latitude: values.locationData.latitude,
        location_longitude: values.locationData.longitude
      }

      await axios.post(`${API_URL}/api/stylist/profile`, stylistData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // 4. Create first service
      const serviceData = {
        name: values.serviceName,
        category: values.serviceCategory,
        duration_minutes: Number(values.serviceDuration),
        price: Number(values.servicePrice),
        description: `${values.serviceName} service by ${values.businessName}`
      }

      await axios.post(`${API_URL}/api/services`, serviceData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      // 5. Submit application for admin approval
      console.log('[STYLIST_ONBOARDING] Submitting application for approval...')
      const applyResponse = await axios.post(`${API_URL}/api/auth/apply-stylist`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!applyResponse.data.success) {
        toast.error(applyResponse.data.message || 'Failed to submit application')
        setIsSubmitting(false)
        return
      }

      console.log('[STYLIST_ONBOARDING] Application submitted successfully')
      toast.success('Application submitted! We will review and notify you soon.', {
        duration: 5000
      })

      // Redirect to pending approval page or dashboard
      setTimeout(() => {
        navigate('/panel', { replace: true })
      }, 2000)
    } catch (error: any) {
      console.error('[STYLIST_ONBOARDING] Error:', error)
      if (error.response?.data?.requiresProfileCompletion) {
        toast.error(`Please complete your profile: ${error.response.data.validationErrors?.join(', ')}`)
      } else {
        toast.error(error.response?.data?.message || 'Failed to complete onboarding')
      }
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
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-md">{t('stylistOnboarding.header')}</h1>
          <p className="text-white/90 text-lg">{t('stylistOnboarding.step', { current: currentStep, total: totalSteps })}</p>
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
              currentStep === 4 ? step4Schema :
              currentStep === 5 ? step5Schema :
              currentStep === 6 ? step6Schema :
              step7Schema
            }
            onSubmit={(values, formikHelpers) => {
              // Only submit on final step, otherwise prevent default form submission
              if (currentStep === 7) {
                handleSubmit(values, formikHelpers)
              }
            }}
            validateOnChange={true}
            validateOnBlur={true}
          >
            {({ values, errors, touched, setFieldValue, validateForm }) => {
              // Sync stripeConnected with stripeAccountStatus
              useEffect(() => {
                if (stripeAccountStatus === 'complete') {
                  setFieldValue('stripeConnected', true)
                }
              }, [stripeAccountStatus, setFieldValue])

              return (
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
                          {t('stylistOnboarding.step1.title')}
                        </h2>
                        <p className="text-gray-600 text-lg">{t('stylistOnboarding.step1.description')}</p>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            {t('stylistOnboarding.step1.usernameLabel')}
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
                              onKeyDown={async (e: React.KeyboardEvent<HTMLInputElement>) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  const formErrors = await validateForm()
                                  if (!formErrors.username && usernameAvailable === true) {
                                    setCurrentStep(2)
                                  } else {
                                    toast.error('Please choose an available username')
                                  }
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
                          <AnimatePresence mode="wait">
                            {usernameAvailable === true && (
                              <motion.div
                                key="available"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl"
                              >
                                <p className="text-sm text-green-700 font-semibold flex items-center gap-2">
                                  <CheckCircleSolid className="w-5 h-5" />
                                  {t('stylistOnboarding.step1.available')}
                                </p>
                              </motion.div>
                            )}
                            {usernameAvailable === false && (
                              <motion.div
                                key="taken"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                                className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl"
                              >
                                <p className="text-sm text-red-700 font-semibold flex items-center gap-2">
                                  <XMarkIcon className="w-5 h-5" />
                                  {t('stylistOnboarding.step1.unavailable')}
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
                              toast.error(t('stylistOnboarding.step1.errors.required'))
                            }
                          }}
                          disabled={!values.username || usernameAvailable !== true || !!errors.username}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-lg"
                        >
                          {t('stylistOnboarding.step1.continueButton')}
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
                          {t('stylistOnboarding.step2.title')}
                        </h2>
                        <p className="text-gray-600 text-lg">{t('stylistOnboarding.step2.description')}</p>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            {t('stylistOnboarding.step2.emailLabel')}
                          </label>
                          <div className="flex gap-3">
                            <Field
                              name="email"
                              type="email"
                              disabled={codeSent}
                              className="flex-1 px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all font-medium text-lg disabled:opacity-60 disabled:bg-gray-50"
                              placeholder={t('stylistOnboarding.step2.emailPlaceholder')}
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
                                {t('stylistOnboarding.step2.sendCodeButton')}
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
                                {t('stylistOnboarding.step2.verification.title')}
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
                                {t('stylistOnboarding.step2.verification.description', { email: values.email })}
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
                            {t('stylistOnboarding.navigation.back')}
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
                                  toast.error(t('stylistOnboarding.step2.verification.errors.codeIncomplete'))
                                }
                              }
                            }}
                            disabled={codeSent && (!values.verificationCode || values.verificationCode.length !== 6)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                          >
                            {t('stylistOnboarding.navigation.next')}
                            <ArrowRightIcon className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: Business Info */}
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
                          <BoltIcon className="w-14 h-14 text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                          {t('stylistOnboarding.step3.title')}
                        </h2>
                        <p className="text-gray-600 text-lg">{t('stylistOnboarding.step3.description')}</p>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            {t('stylistOnboarding.step3.businessNameLabel')}
                          </label>
                          <Field
                            name="businessName"
                            type="text"
                            className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all font-medium text-lg"
                            placeholder={t('stylistOnboarding.step3.businessNamePlaceholder')}
                          />
                          <ErrorMessage name="businessName" component="div" className="text-sm text-red-600 mt-2 font-medium" />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            {t('stylistOnboarding.step3.bioLabel')}
                          </label>
                          <Field
                            as="textarea"
                            name="bio"
                            rows={4}
                            className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all font-medium resize-none"
                            placeholder={t('stylistOnboarding.step3.bioPlaceholder')}
                          />
                          <div className="flex justify-between items-center mt-2">
                            <ErrorMessage name="bio" component="div" className="text-sm text-red-600 font-medium" />
                            <span className="text-sm text-gray-500">{t('stylistOnboarding.step3.bioCount', { count: values.bio.length })}</span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">
                            {t('stylistOnboarding.step3.specialtiesLabel')}
                          </label>
                          <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1">
                            {STYLIST_SPECIALTIES.map((specialty, index) => {
                              const isSelected = values.selectedSpecialties.includes(specialty)
                              return (
                                <motion.button
                                  key={specialty}
                                  type="button"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.02 }}
                                  onClick={() => {
                                    const newSpecialties = isSelected
                                      ? values.selectedSpecialties.filter((s: string) => s !== specialty)
                                      : [...values.selectedSpecialties, specialty]
                                    setFieldValue('selectedSpecialties', newSpecialties)
                                  }}
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  className={`relative px-4 py-3 rounded-2xl border-2 text-sm font-semibold transition-all ${
                                    isSelected
                                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-transparent text-white shadow-lg'
                                      : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300'
                                  }`}
                                >
                                  {specialty}
                                  {isSelected && (
                                    <CheckCircleSolid className="absolute -top-1 -right-1 w-5 h-5 text-green-500 bg-white rounded-full" />
                                  )}
                                </motion.button>
                              )
                            })}
                          </div>
                          <ErrorMessage name="selectedSpecialties" component="div" className="text-sm text-red-600 mt-2 font-medium" />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            {t('stylistOnboarding.step3.experienceLabel')}
                          </label>
                          <Field
                            name="experienceYears"
                            type="number"
                            min="0"
                            max="50"
                            className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all font-semibold text-lg"
                            placeholder={t('stylistOnboarding.step3.experiencePlaceholder')}
                          />
                          <ErrorMessage name="experienceYears" component="div" className="text-sm text-red-600 mt-2 font-medium" />
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
                            {t('stylistOnboarding.navigation.back')}
                          </motion.button>
                          <motion.button
                            type="button"
                            onClick={async () => {
                              const formErrors = await validateForm()
                              if (!formErrors.businessName && !formErrors.bio && !formErrors.selectedSpecialties && !formErrors.experienceYears) {
                                setCurrentStep(4)
                              } else {
                                toast.error(t('stylistOnboarding.step3.errors.bioRequired'))
                              }
                            }}
                            disabled={!values.businessName || !values.bio || values.selectedSpecialties.length === 0 || !values.experienceYears}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                          >
                            {t('stylistOnboarding.step3.continueButton')}
                            <ArrowRightIcon className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4: Location */}
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
                          className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                        >
                          <MapPinIcon className="w-14 h-14 text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3">
                          {t('stylistOnboarding.step4.title')}
                        </h2>
                        <p className="text-gray-600 text-lg">{t('stylistOnboarding.step4.description')}</p>
                      </div>

                      <div className="space-y-6">
                        <LocationPicker
                          value={values.locationData}
                          onChange={(location) => setFieldValue('locationData', location)}
                          error={errors.locationData as string}
                          apiKey={GOOGLE_MAPS_API_KEY}
                        />

                        <div className="flex gap-3 pt-4">
                          <motion.button
                            type="button"
                            onClick={() => setCurrentStep(3)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-lg"
                          >
                            <ArrowLeftIcon className="w-5 h-5" />
                            {t('stylistOnboarding.navigation.back')}
                          </motion.button>
                          <motion.button
                            type="button"
                            onClick={async () => {
                              const formErrors = await validateForm()
                              if (!formErrors.locationData && values.locationData.latitude !== 0) {
                                setCurrentStep(5)
                              } else {
                                toast.error(t('stylistOnboarding.step4.errors.addressRequired'))
                              }
                            }}
                            disabled={!values.locationData.address || values.locationData.latitude === 0}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                          >
                            {t('stylistOnboarding.step4.continueButton')}
                            <ArrowRightIcon className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 5: First Service */}
                  {currentStep === 5 && (
                    <motion.div
                      key="step5"
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
                          className="w-24 h-24 bg-gradient-to-br from-pink-500 to-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                        >
                          <StarIcon className="w-14 h-14 text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-3">
                          {t('stylistOnboarding.step5.title')}
                        </h2>
                        <p className="text-gray-600 text-lg">{t('stylistOnboarding.step5.description')}</p>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            {t('stylistOnboarding.step5.serviceNameLabel')}
                          </label>
                          <Field
                            name="serviceName"
                            type="text"
                            className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 focus:outline-none transition-all font-medium text-lg"
                            placeholder={t('stylistOnboarding.step5.serviceNamePlaceholder')}
                          />
                          <ErrorMessage name="serviceName" component="div" className="text-sm text-red-600 mt-2 font-medium" />
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            {t('stylistOnboarding.step5.categoryLabel')}
                          </label>
                          <Field
                            as="select"
                            name="serviceCategory"
                            className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 focus:outline-none transition-all font-medium"
                          >
                            <option value="">{t('stylistOnboarding.step5.categoryPlaceholder')}</option>
                            {SERVICE_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </Field>
                          <ErrorMessage name="serviceCategory" component="div" className="text-sm text-red-600 mt-2 font-medium" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                              {t('stylistOnboarding.step5.durationLabel')}
                            </label>
                            <Field
                              name="serviceDuration"
                              type="number"
                              min="15"
                              max="480"
                              className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 focus:outline-none transition-all font-semibold text-lg"
                              placeholder={t('stylistOnboarding.step5.durationPlaceholder')}
                            />
                            <ErrorMessage name="serviceDuration" component="div" className="text-sm text-red-600 mt-2 font-medium" />
                          </div>

                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                              {t('stylistOnboarding.step5.priceLabel')}
                            </label>
                            <Field
                              name="servicePrice"
                              type="number"
                              min="1"
                              step="0.01"
                              className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 focus:outline-none transition-all font-semibold text-lg"
                              placeholder={t('stylistOnboarding.step5.pricePlaceholder')}
                            />
                            <ErrorMessage name="servicePrice" component="div" className="text-sm text-red-600 mt-2 font-medium" />
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-3xl p-6 border-2 border-pink-200">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                              <FireIcon className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 mb-1">
                                Don't worry! ✨
                              </h3>
                              <p className="text-sm text-gray-700">
                                You can add more services and edit details later from your dashboard.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <motion.button
                            type="button"
                            onClick={() => setCurrentStep(4)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-lg"
                          >
                            <ArrowLeftIcon className="w-5 h-5" />
                            {t('stylistOnboarding.navigation.back')}
                          </motion.button>
                          <motion.button
                            type="button"
                            onClick={async () => {
                              const formErrors = await validateForm()
                              if (!formErrors.serviceName && !formErrors.serviceCategory && !formErrors.serviceDuration && !formErrors.servicePrice) {
                                setCurrentStep(6)
                              } else {
                                toast.error(t('stylistOnboarding.step5.errors.nameRequired'))
                              }
                            }}
                            disabled={!values.serviceName || !values.serviceCategory || !values.serviceDuration || !values.servicePrice}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                          >
                            {t('stylistOnboarding.step5.continueButton')}
                            <ArrowRightIcon className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 6: Stripe Connect */}
                  {currentStep === 6 && (
                    <motion.div
                      key="step6"
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
                          <CreditCardIcon className="w-14 h-14 text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                          {t('stylistOnboarding.step6.title')}
                        </h2>
                        <p className="text-gray-600 text-lg">{t('stylistOnboarding.step6.description')}</p>
                      </div>

                      <div className="space-y-6">
                        {/* Info Box */}
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-6">
                          <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center gap-2">
                            <CreditCardIcon className="w-6 h-6" />
                            {t('stylistOnboarding.step6.whyStripe')}
                          </h3>
                          <ul className="space-y-2 text-sm text-blue-800">
                            <li className="flex items-start gap-2">
                              <CheckCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <span>{t('stylistOnboarding.step6.benefits.secure')}</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <span>{t('stylistOnboarding.step6.benefits.fast')}</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <span>{t('stylistOnboarding.step6.benefits.global')}</span>
                            </li>
                          </ul>
                        </div>

                        {/* Status Indicator */}
                        {stripeAccountStatus === 'complete' ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="bg-green-50 border-2 border-green-200 rounded-3xl p-6 text-center"
                          >
                            <CheckCircleSolid className="w-16 h-16 text-green-500 mx-auto mb-3" />
                            <h3 className="text-xl font-bold text-green-900 mb-2">Stripe Connected!</h3>
                            <p className="text-green-700">Your payment account is ready to receive payments</p>
                          </motion.div>
                        ) : stripeAccountStatus === 'pending' ? (
                          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-3xl p-6 text-center">
                            <ExclamationTriangleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
                            <h3 className="text-xl font-bold text-yellow-900 mb-2">Setup in Progress</h3>
                            <p className="text-yellow-700 mb-4">Complete your Stripe onboarding in the popup window</p>
                          </div>
                        ) : (
                          <motion.button
                            type="button"
                            onClick={async () => {
                              try {
                                const token = localStorage.getItem('beautycita-auth')
                                  ? JSON.parse(localStorage.getItem('beautycita-auth')!).state.token
                                  : ''
                                const response = await axios.post(`${API_URL}/api/stripe-connect/create-connect-account`, {}, {
                                  headers: { Authorization: `Bearer ${token}` }
                                })
                                if (response.data.url) {
                                  setStripeOnboardingUrl(response.data.url)
                                  setStripeAccountStatus('pending')
                                  window.open(response.data.url, '_blank', 'width=800,height=800')
                                  toast.success('Complete Stripe setup in the new window')
                                }
                              } catch (error: any) {
                                const msg = error.response?.data?.message || 'Failed to start Stripe setup'
                                toast.error(msg)
                                console.error('[STRIPE] Error:', error)
                              }
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-6 px-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 text-lg"
                          >
                            <CreditCardIcon className="w-6 h-6" />
                            {t('stylistOnboarding.step6.setupButton')}
                          </motion.button>
                        )}


                        <div className="flex gap-3 pt-4">
                          <motion.button
                            type="button"
                            onClick={() => setCurrentStep(5)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-lg"
                          >
                            <ArrowLeftIcon className="w-5 h-5" />
                            {t('stylistOnboarding.navigation.back')}
                          </motion.button>
                          <motion.button
                            type="button"
                            onClick={() => {
                              if (stripeAccountStatus === 'complete' || values.stripeConnected) {
                                setCurrentStep(7)
                              } else {
                                toast.error(t('stylistOnboarding.step6.errors.setupFailed'))
                              }
                            }}
                            disabled={stripeAccountStatus !== 'complete' && !values.stripeConnected}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                          >
                            {t('stylistOnboarding.step6.continueButton')}
                            <ArrowRightIcon className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 7: Platform Agreement */}
                  {currentStep === 7 && (
                    <motion.div
                      key="step7"
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
                          <DocumentTextIcon className="w-14 h-14 text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                          {t('stylistOnboarding.step7.title')}
                        </h2>
                        <p className="text-gray-600 text-lg">{t('stylistOnboarding.step7.description')}</p>
                      </div>

                      <div className="space-y-6">
                        {/* Agreement Content */}
                        <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 max-h-96 overflow-y-auto">
                          <h3 className="text-xl font-bold text-gray-900 mb-4">BeautyCita Stylist Agreement</h3>

                          <div className="space-y-4 text-sm text-gray-700">
                            <section>
                              <h4 className="font-bold text-gray-900 mb-2">1. Professional Standards</h4>
                              <p>As a BeautyCita stylist, you agree to:</p>
                              <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Provide professional, high-quality beauty services</li>
                                <li>Maintain proper licensing and certifications required in your area</li>
                                <li>Follow health and safety guidelines at all times</li>
                                <li>Treat all clients with respect and professionalism</li>
                              </ul>
                            </section>

                            <section>
                              <h4 className="font-bold text-gray-900 mb-2">2. Booking & Cancellation Policy</h4>
                              <ul className="list-disc pl-6 space-y-1">
                                <li>Honor all confirmed bookings unless emergency circumstances arise</li>
                                <li>Provide at least 24 hours notice for cancellations when possible</li>
                                <li>Respond to booking requests within 12 hours</li>
                                <li>Communicate clearly with clients about timing and location</li>
                              </ul>
                            </section>

                            <section>
                              <h4 className="font-bold text-gray-900 mb-2">3. Payment & Fees</h4>
                              <ul className="list-disc pl-6 space-y-1">
                                <li>BeautyCita charges a 3% service fee on completed bookings</li>
                                <li>Payments are processed through Stripe Connect</li>
                                <li>Payouts occur within 2-7 business days after service completion</li>
                                <li>You are responsible for your own taxes and business expenses</li>
                              </ul>
                            </section>

                            <section>
                              <h4 className="font-bold text-gray-900 mb-2">4. Code of Conduct</h4>
                              <ul className="list-disc pl-6 space-y-1">
                                <li>Maintain professionalism in all client interactions</li>
                                <li>No harassment, discrimination, or inappropriate behavior</li>
                                <li>Accurate representation of your skills and services</li>
                                <li>Respect client privacy and confidentiality</li>
                              </ul>
                            </section>

                            <section>
                              <h4 className="font-bold text-gray-900 mb-2">5. Account Suspension</h4>
                              <p>BeautyCita reserves the right to suspend or terminate accounts for:</p>
                              <ul className="list-disc pl-6 mt-2 space-y-1">
                                <li>Violations of this agreement</li>
                                <li>Multiple client complaints</li>
                                <li>Fraudulent activity</li>
                                <li>Failure to maintain required licenses</li>
                              </ul>
                            </section>
                          </div>
                        </div>

                        {/* Checkbox */}
                        <label className="flex items-start gap-3 p-6 bg-green-50 border-2 border-green-200 rounded-3xl cursor-pointer hover:bg-green-100 transition-all">
                          <Field
                            type="checkbox"
                            name="agreeToPlatformTerms"
                            className="w-6 h-6 rounded-lg border-2 border-green-500 text-green-600 focus:ring-2 focus:ring-green-500 mt-0.5"
                          />
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 mb-1">{t('stylistOnboarding.step7.agreementLabel')}</p>
                            <p className="text-sm text-gray-700">
                              {t('stylistOnboarding.step7.terms.term1')}
                            </p>
                          </div>
                        </label>
                        <ErrorMessage name="agreeToPlatformTerms" component="div" className="text-sm text-red-600 font-medium" />

                        {/* Info about approval process */}
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-6">
                          <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
                            <BoltIcon className="w-6 h-6" />
                            What Happens Next?
                          </h3>
                          <ul className="space-y-2 text-sm text-blue-800">
                            <li className="flex items-start gap-2">
                              <CheckCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <span>Your application will be submitted for admin review</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <span>We'll review your profile, services, and portfolio</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <span>You'll receive an email notification within 48 hours</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <span>Once approved, you can start accepting bookings!</span>
                            </li>
                          </ul>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <motion.button
                            type="button"
                            onClick={() => setCurrentStep(6)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isSubmitting}
                            className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50"
                          >
                            <ArrowLeftIcon className="w-5 h-5" />
                            {t('stylistOnboarding.navigation.back')}
                          </motion.button>
                          <motion.button
                            type="submit"
                            disabled={!values.agreeToPlatformTerms || isSubmitting}
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
                                {t('stylistOnboarding.step7.submitting')}
                              </>
                            ) : (
                              <>
                                <StarIcon className="w-5 h-5" />
                                {t('stylistOnboarding.step7.submitButton')}
                              </>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Form>
              )
            }}
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
