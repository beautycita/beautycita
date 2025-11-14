import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PhoneIcon,
  UserCircleIcon,
  CheckCircleIcon,
  SparklesIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  FireIcon,
  CameraIcon,
  BuildingStorefrontIcon,
  BanknotesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'
import { useAuthStore } from '../store/authStore'

import toast from 'react-hot-toast'
import axios from 'axios'
import { getMediaUrl } from '@/config/media'

const API_URL = import.meta.env.VITE_API_URL || ''

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

// Validation schemas
const step1Schema = Yup.object({
  phone: Yup.string()
    .matches(/^[0-9+\-() ]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits')
    .required('Phone number is required'),
  verificationCode: Yup.string()
    .matches(/^[0-9]{6}$/, 'Code must be 6 digits')
    .required('Verification code is required')
})

const step2Schema = Yup.object({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  selectedAvatar: Yup.string().nullable()
})

const step3Schema = Yup.object({
  // Payment method is optional
})

export default function ClientOnboardingWizard() {
  const { updateProfile, user } = useAuthStore()
  const navigate = useNavigate()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [verifyingPhone, setVerifyingPhone] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedFilePreview, setUploadedFilePreview] = useState<string | null>(null)
  const [lastCountryCode, setLastCountryCode] = useState<'+52' | '+1' | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const totalSteps = 4

  // Prevent access if onboarding is already complete
  useEffect(() => {
    if (user?.profileComplete || user?.profile_complete) {
      toast('You have already completed onboarding', { icon: 'ℹ️' })
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const initialValues = {
    phone: '',
    verificationCode: '',
    phoneVerified: false,
    name: '',
    selectedAvatar: null as string | null,
    paymentMethodAdded: false
  }

  // Detect country code based on area code
  const detectCountryCode = (phoneDigits: string): string => {
    const areaCode = phoneDigits.substring(0, 2);
    // Mexico area codes: 33 (Guadalajara), 55 (Mexico City), 81 (Monterrey), 442 (Querétaro), etc.
    const mexicoAreaCodes = ['33', '55', '81', '44', '222', '777', '656', '664', '668'];

    if (mexicoAreaCodes.some(code => phoneDigits.startsWith(code))) {
      return '+52'; // Mexico
    }
    return '+1'; // Default to US/Canada
  };

  const sendVerificationCode = async (phone: string, forceCountryCode?: '+52' | '+1') => {
    try {
      setCodeSent(false)

      // Convert to E.164 format
      // If forceCountryCode is provided (from resend), use that
      // Otherwise, detect from area code
      const countryCode = forceCountryCode || detectCountryCode(phone);
      const phoneNumber = `${countryCode}${phone}`;

      console.log(`[PHONE_VERIFY] Sending to: ${phoneNumber} (country code: ${countryCode})`);

      const response = await axios.post(`${API_URL}/api/verify/send-code`, { phoneNumber })

      if (response.data.success) {
        setCodeSent(true)
        setLastCountryCode(countryCode)
        const countryName = countryCode === '+52' ? 'Mexico' : 'US/Canada';
        toast.success(`Code sent to ${countryName} number!`)
        return true
      } else {
        toast.error(response.data.message || 'Failed to send verification code')
        return false
      }
    } catch (error: any) {
      console.error('[PHONE_VERIFY] Error sending code:', error)
      toast.error(error.response?.data?.message || 'Failed to send verification code')
      return false
    }
  }

  const verifyPhoneCode = async (phone: string, code: string) => {
    try {
      setVerifyingPhone(true)

      // Use the country code that was actually used to send the SMS
      const countryCode = lastCountryCode || detectCountryCode(phone);
      const phoneNumber = `${countryCode}${phone}`;

      console.log(`[PHONE_VERIFY] Verifying: ${phoneNumber} with code: ${code}`);

      const response = await axios.post(`${API_URL}/api/verify/check-code`, {
        phoneNumber,
        code
      })

      if (response.data.success && response.data.verified) {
        toast.success('Phone verified successfully!')
        return true
      } else {
        toast.error(response.data.message || 'Invalid verification code')
        return false
      }
    } catch (error: any) {
      console.error('[PHONE_VERIFY] Error verifying code:', error)
      toast.error(error.response?.data?.message || 'Failed to verify phone')
      return false
    } finally {
      setVerifyingPhone(false)
    }
  }

  const handleSubmit = async (values: any) => {
    console.log('[CLIENT_ONBOARDING] Final submit:', values)
    setIsSubmitting(true)

    const token = localStorage.getItem('beautycita-auth')
      ? JSON.parse(localStorage.getItem('beautycita-auth')!).state.token
      : ''

    try {
      // 1. Save profile with name
      await updateProfile({ name: values.name, display_name: values.name })

      // 2. Save avatar
      if (uploadedFile) {
        const formData = new FormData()
        formData.append('avatar', uploadedFile)
        await axios.post(`${API_URL}/api/profile/avatar`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })
      } else if (values.selectedAvatar) {
        await updateProfile({ avatar: values.selectedAvatar })
      }

      // 3. Mark onboarding as complete
      await axios.post(`${API_URL}/api/onboarding/complete`, {
        completed: true,
        completedAt: new Date().toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      toast.success('Welcome to BeautyCita! 🎉', { duration: 5000 })

      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 2000)
    } catch (error: any) {
      console.error('[CLIENT_ONBOARDING] Error:', error)
      toast.error(error.response?.data?.message || 'Failed to complete onboarding')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-600 to-blue-500 py-6 sm:py-12 px-3 sm:px-4 overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-3xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-2xl">
              <SparklesIcon className="w-10 h-10 text-purple-600" />
            </div>
            <span className="text-4xl font-serif font-bold text-white drop-shadow-lg">
              BeautyCita
            </span>
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-md">Welcome to BeautyCita!</h1>
          <p className="text-white/90 text-lg">Step ${currentStep} of ${totalSteps}</p>
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
          className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 md:p-12 w-full max-w-full overflow-hidden"
          layout
        >
          <Formik
            initialValues={initialValues}
            validationSchema={
              currentStep === 1 ? step1Schema :
              currentStep === 2 ? step2Schema :
              step3Schema
            }
            onSubmit={(values, formikHelpers) => {
              if (currentStep === 4) {
                handleSubmit(values)
              }
            }}
            validateOnChange={true}
            validateOnBlur={true}
          >
            {({ values, errors, touched, setFieldValue, validateForm }) => (
              <Form>
                <AnimatePresence mode="wait">
                  {/* STEP 1: Phone Verification */}
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
                          className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                        >
                          <PhoneIcon className="w-14 h-14 text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
                          Verify Your Phone
                        </h2>
                        <p className="text-gray-600 text-lg">We'll send you a 6-digit code to verify your number</p>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            Phone Number
                          </label>
                          <Field
                            name="phone"
                            type="tel"
                            placeholder="Enter your phone number"
                            className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                          />
                          <ErrorMessage name="phone" component="div" className="text-sm text-red-600 mt-2 font-medium" />
                        </div>

                        {!codeSent && (
                          <motion.button
                            type="button"
                            onClick={async () => {
                              if (values.phone && values.phone.length >= 10) {
                                await sendVerificationCode(values.phone)
                              } else {
                                toast.error('Please enter a valid phone number')
                              }
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all"
                          >
                            Send Verification Code
                          </motion.button>
                        )}

                        {codeSent && (
                          <>
                            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4">
                              <p className="text-green-800 text-sm font-medium">
                                ✓ Enter Verification Code
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                                Enter Verification Code
                              </label>
                              <Field
                                name="verificationCode"
                                type="text"
                                placeholder="123456"
                                maxLength={6}
                                className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all text-center tracking-widest font-bold"
                              />
                              <ErrorMessage name="verificationCode" component="div" className="text-sm text-red-600 mt-2 font-medium" />
                            </div>

                            <div className="flex gap-3">
                              <motion.button
                                type="button"
                                onClick={async () => {
                                  // Toggle country code: if we sent to Mexico (+52), try US (+1), and vice versa
                                  const alternateCountryCode = lastCountryCode === '+52' ? '+1' : '+52'
                                  const countryName = alternateCountryCode === '+52' ? 'Mexico' : 'US/Canada'

                                  if (lastCountryCode) {
                                    toast.success(`Trying ${countryName} number...`)
                                  }

                                  await sendVerificationCode(values.phone, alternateCountryCode)
                                }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all text-lg"
                              >
                                Resend Code
                              </motion.button>
                              <motion.button
                                type="button"
                                onClick={async () => {
                                  const errors = await validateForm()
                                  if (!errors.phone && !errors.verificationCode) {
                                    const verified = await verifyPhoneCode(values.phone, values.verificationCode)
                                    if (verified) {
                                      setFieldValue('phoneVerified', true)
                                      setCurrentStep(2)
                                    }
                                  } else {
                                    toast.error('Please enter the complete 6-digit code')
                                  }
                                }}
                                disabled={verifyingPhone}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                              >
                                {verifyingPhone ? 'Verifying...' : (
                                  <>
                                    Next
                                    <ArrowRightIcon className="w-5 h-5" />
                                  </>
                                )}
                              </motion.button>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 2: Avatar + Name */}
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
                          className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                        >
                          <UserCircleIcon className="w-14 h-14 text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-3">
                          Choose Your Profile
                        </h2>
                        <p className="text-gray-600 text-lg">Pick an avatar and tell us your name</p>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            Your Name
                          </label>
                          <Field
                            name="name"
                            type="text"
                            placeholder="Enter your full name"
                            className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                          />
                          <ErrorMessage name="name" component="div" className="text-sm text-red-600 mt-2 font-medium" />
                        </div>

                        {/* Upload Custom Avatar */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            Upload Your Photo
                          </label>
                          <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-blue-500 transition-all cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  setUploadedFile(file)
                                  setUploadedFilePreview(URL.createObjectURL(file))
                                  setFieldValue('selectedAvatar', null)
                                }
                              }}
                              className="hidden"
                              id="avatar-upload"
                            />
                            <label htmlFor="avatar-upload" className="cursor-pointer">
                              {uploadedFilePreview ? (
                                <div className="flex flex-col items-center">
                                  <img src={uploadedFilePreview} alt="Preview" className="w-32 h-32 rounded-full object-cover mb-3 shadow-lg" />
                                  <p className="text-blue-600 font-medium">Click to change photo</p>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <CameraIcon className="w-12 h-12 text-gray-400 mb-3" />
                                  <p className="text-gray-600 font-medium">Click to upload a photo</p>
                                  <p className="text-gray-400 text-sm mt-1">JPG, PNG up to 5MB</p>
                                </div>
                              )}
                            </label>
                          </div>
                        </div>

                        {/* Or Choose Preset Avatar */}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            Or Choose a Preset Avatar
                          </label>
                          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                            {AVATARS.map((avatar, index) => (
                              <motion.div
                                key={index}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  setFieldValue('selectedAvatar', avatar)
                                  setUploadedFile(null)
                                  setUploadedFilePreview(null)
                                }}
                                className={`cursor-pointer rounded-2xl overflow-hidden border-4 transition-all ${
                                  values.selectedAvatar === avatar
                                    ? 'border-blue-500 shadow-lg'
                                    : 'border-transparent hover:border-gray-300'
                                }`}
                              >
                                <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" />
                              </motion.div>
                            ))}
                          </div>
                        </div>

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
                              const errors = await validateForm()
                              if (!errors.name) {
                                if (!uploadedFile && !values.selectedAvatar) {
                                  toast.error('Please select an avatar or upload a photo')
                                } else {
                                  setCurrentStep(3)
                                }
                              } else {
                                toast.error('Please enter your name')
                              }
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 text-lg"
                          >
                            Continue
                            <ArrowRightIcon className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 3: Payment Method (Optional) */}
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
                          className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                        >
                          <CreditCardIcon className="w-14 h-14 text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">
                          Add Payment Method
                        </h2>
                        <p className="text-gray-600 text-lg">Set up your payment method to book services instantly</p>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-3xl p-6">
                          <h3 className="text-lg font-bold text-blue-900 mb-3">Why add a payment method?</h3>
                          <ul className="space-y-2 text-sm text-blue-800">
                            <li className="flex items-start gap-2">
                              <CheckCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <span>Faster Bookings</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <span>Secure Payments</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <CheckCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <span>Easy Checkout</span>
                            </li>
                          </ul>
                        </div>

                        <motion.button
                          type="button"
                          onClick={() => setShowPaymentModal(true)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-6 px-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 text-lg"
                        >
                          <CreditCardIcon className="w-6 h-6" />
                          Add Payment Method
                        </motion.button>

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
                            onClick={() => setCurrentStep(4)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex flex-col items-center justify-center text-lg"
                          >
                            <span className="text-xs opacity-90 mb-1">Skip for now</span>
                            <div className="flex items-center gap-1">
                              Next
                              <ArrowRightIcon className="w-4 h-4" />
                            </div>
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 4: Welcome / Getting Started */}
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
                          initial={{ scale: 0, rotate: 360 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", bounce: 0.6 }}
                          className="w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                        >
                          <FireIcon className="w-14 h-14 text-white" />
                        </motion.div>
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
                          You're All Set!
                        </h2>
                        <p className="text-gray-600 text-lg">{values.name}, welcome to BeautyCita!</p>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-purple-200 rounded-3xl p-8">
                          <h3 className="text-2xl font-bold text-purple-900 mb-4 text-center">Here's how to get started:</h3>
                          <div className="space-y-4">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0">
                                1
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 mb-1">Find Your Perfect Stylist</h4>
                                <p className="text-gray-600 text-sm">Browse verified professionals in your area</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0">
                                2
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 mb-1">Book Your First Appointment</h4>
                                <p className="text-gray-600 text-sm">Choose services, date, and time that work for you</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0">
                                3
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 mb-1">Enjoy Your Service</h4>
                                <p className="text-gray-600 text-sm">Relax and let the professionals work their magic</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <motion.button
                            type="button"
                            onClick={() => setCurrentStep(3)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-lg"
                          >
                            <ArrowLeftIcon className="w-5 h-5" />
                            Back
                          </motion.button>
                          <motion.button
                            type="submit"
                            disabled={isSubmitting}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                          >
                            {isSubmitting ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                />
                                Redirecting to payment setup...
                              </>
                            ) : (
                              <>
                                <FireIcon className="w-5 h-5" />
                                Start Booking
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
          By completing onboarding, you agree to our Terms & Privacy Policy
        </p>

        {/* Payment Method Modal */}
        <AnimatePresence>
          {showPaymentModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto"
              onClick={() => setShowPaymentModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 w-full max-w-[calc(100%-24px)] sm:max-w-md shadow-2xl my-auto"
              >
                <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight">Choose Payment Method</h3>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                  >
                    <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Credit/Debit Card Option */}
                  <motion.button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false)
                      toast.success('Redirecting to payment setup...')
                      setTimeout(() => {
                        window.location.href = '/settings#payment-methods'
                      }, 1000)
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-3 sm:p-6 border-2 border-gray-200 rounded-xl sm:rounded-2xl hover:border-green-500 hover:bg-green-50 transition-all text-left group"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <CreditCardIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Credit or Debit Card</h4>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">Visa, Mastercard, American Express</p>
                      </div>
                    </div>
                  </motion.button>

                  {/* OXXO Cash Option */}
                  <motion.button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false)
                      toast.success('Redirecting to payment setup...')
                      setTimeout(() => {
                        window.location.href = '/settings#payment-methods'
                      }, 1000)
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-3 sm:p-6 border-2 border-gray-200 rounded-xl sm:rounded-2xl hover:border-orange-500 hover:bg-orange-50 transition-all text-left group"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <BuildingStorefrontIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">OXXO Cash Payment</h4>
                        <p className="text-xs sm:text-sm text-gray-600">Pay cash at any OXXO store</p>
                      </div>
                    </div>
                  </motion.button>

                  {/* Bank Transfer Option */}
                  <motion.button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false)
                      toast.success('Redirecting to payment setup...')
                      setTimeout(() => {
                        window.location.href = '/settings#payment-methods'
                      }, 1000)
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-3 sm:p-6 border-2 border-gray-200 rounded-xl sm:rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <BanknotesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 mb-1 text-sm sm:text-base">Bank Transfer (SPEI)</h4>
                        <p className="text-xs sm:text-sm text-gray-600">Direct transfer from your bank</p>
                      </div>
                    </div>
                  </motion.button>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-600 text-center">
                    🔒 All payments are processed securely through Stripe
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
