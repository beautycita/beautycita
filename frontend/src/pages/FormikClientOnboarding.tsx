import { useState } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import {
  PhoneIcon,
  MapPinIcon,
  CameraIcon,
  SparklesIcon,
  CheckIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'

const API_URL = import.meta.env.VITE_API_URL || ''

interface OnboardingValues {
  phone: string
  verificationCode: string
  location: {
    city: string
    state: string
    zip: string
  }
  profilePicture: string | null
}

// Step validation schemas
const step1Schema = Yup.object({
  phone: Yup.string()
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Invalid phone number')
    .required('Phone number is required'),
})

const step2Schema = Yup.object({
  verificationCode: Yup.string()
    .matches(/^[0-9]{6}$/, 'Code must be 6 digits')
    .required('Verification code is required'),
})

const step3Schema = Yup.object({
  location: Yup.object().shape({
    city: Yup.string().required('City is required'),
    state: Yup.string().required('State is required').length(2, 'Use 2-letter state code (e.g., CA, TX)'),
    zip: Yup.string().required('ZIP code is required').matches(/^\d{5}$/, 'Must be 5 digits'),
  }),
})

const step4Schema = Yup.object({
  profilePicture: Yup.string().nullable(),
})

export default function FormikClientOnboarding() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const steps = [
    { number: 1, title: 'Phone Number', icon: PhoneIcon, color: 'from-pink-500 to-rose-500' },
    { number: 2, title: 'Verify Phone', icon: SparklesIcon, color: 'from-purple-500 to-pink-500' },
    { number: 3, title: 'Your Location', icon: MapPinIcon, color: 'from-blue-500 to-cyan-500' },
    { number: 4, title: 'Profile Picture', icon: CameraIcon, color: 'from-green-500 to-teal-500' },
  ]

  const initialValues: OnboardingValues = {
    phone: user?.phone || '',
    verificationCode: '',
    location: { city: '', state: '', zip: '' },
    profilePicture: user?.profilePicture || null,
  }

  const sendVerificationCode = async (phone: string) => {
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${API_URL}/api/auth/send-verification`,
        { phone },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setVerificationSent(true)
      toast.success('Verification code sent!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send verification code')
      throw error
    }
  }

  const verifyCode = async (phone: string, code: string) => {
    setIsVerifying(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${API_URL}/api/auth/verify-phone`,
        { phone, code },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        toast.success('Phone verified!')
        return true
      }
      return false
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid verification code')
      return false
    } finally {
      setIsVerifying(false)
    }
  }

  const detectLocation = async (setFieldValue: any) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported')
      return
    }

    setIsDetectingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          // Reverse geocode using OpenStreetMap
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )

          if (response.ok) {
            const locationData = await response.json()
            const address = locationData.address

            setFieldValue('location.city', address.city || address.town || address.village || '')
            setFieldValue('location.state', address['ISO3166-2-lvl4']?.split('-')[1] || address.state || '')
            setFieldValue('location.zip', address.postcode || '')

            toast.success('Location detected!')
          }
        } catch (error) {
          toast.error('Failed to detect location')
        } finally {
          setIsDetectingLocation(false)
        }
      },
      () => {
        toast.error('Failed to get your location')
        setIsDetectingLocation(false)
      }
    )
  }

  const uploadProfilePicture = async (file: File, setFieldValue: any) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    try {
      const formData = new FormData()
      formData.append('profilePicture', file)

      const token = localStorage.getItem('token')
      const response = await axios.post(`${API_URL}/api/onboarding/upload-picture`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.data.url) {
        setFieldValue('profilePicture', response.data.url)
        toast.success('Profile picture uploaded!')
      }
    } catch (error) {
      toast.error('Failed to upload picture')
    }
  }

  const handleSubmit = async (values: OnboardingValues) => {
    try {
      const token = localStorage.getItem('token')

      // Complete onboarding
      const response = await axios.post(
        `${API_URL}/api/onboarding/complete-client`,
        {
          phone: values.phone,
          location: values.location,
          profilePicture: values.profilePicture,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        // Update user in store
        const updatedUser = { ...user, onboardingCompleted: true }
        setUser(updatedUser)
        localStorage.setItem('user', JSON.stringify(updatedUser))

        toast.success('Welcome to BeautyCita!')
        navigate('/panel')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete onboarding')
    }
  }

  const validateCurrentStep = (values: OnboardingValues) => {
    try {
      if (currentStep === 1) {
        step1Schema.validateSync({ phone: values.phone })
      } else if (currentStep === 2) {
        step2Schema.validateSync({ verificationCode: values.verificationCode })
      } else if (currentStep === 3) {
        step3Schema.validateSync({ location: values.location })
      } else if (currentStep === 4) {
        step4Schema.validateSync({ profilePicture: values.profilePicture })
      }
      return true
    } catch (error) {
      return false
    }
  }

  const handleNext = async (values: OnboardingValues, validateForm: any) => {
    const errors = await validateForm()

    if (currentStep === 1) {
      if (!errors.phone && values.phone) {
        await sendVerificationCode(values.phone)
        setCurrentStep(2)
      } else {
        toast.error('Please enter a valid phone number')
      }
    } else if (currentStep === 2) {
      if (!errors.verificationCode && values.verificationCode) {
        const verified = await verifyCode(values.phone, values.verificationCode)
        if (verified) {
          setCurrentStep(3)
        }
      } else {
        toast.error('Please enter the 6-digit verification code')
      }
    } else if (currentStep === 3) {
      if (!errors.location) {
        setCurrentStep(4)
      } else {
        toast.error('Please fill in all location fields')
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex items-center ${
                  step.number < steps.length ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    currentStep >= step.number
                      ? `bg-gradient-to-r ${step.color} text-white`
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {currentStep > step.number ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {step.number < steps.length && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all ${
                      currentStep > step.number
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500'
                        : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-3xl p-8 border border-gray-700">
          <Formik
            initialValues={initialValues}
            onSubmit={handleSubmit}
            validationSchema={
              currentStep === 1
                ? step1Schema
                : currentStep === 2
                ? step2Schema
                : currentStep === 3
                ? step3Schema
                : step4Schema
            }
          >
            {({ values, setFieldValue, validateForm, isSubmitting }) => (
              <Form>
                <AnimatePresence mode="wait">
                  {/* Step 1: Phone Number */}
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">
                          What's your phone number?
                        </h2>
                        <p className="text-gray-400">
                          We'll send you a verification code
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Phone Number
                        </label>
                        <Field
                          name="phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
                        />
                        <ErrorMessage
                          name="phone"
                          component="p"
                          className="mt-1 text-sm text-red-400"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Verify Phone */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">
                          Enter verification code
                        </h2>
                        <p className="text-gray-400">
                          We sent a 6-digit code to {values.phone}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Verification Code
                        </label>
                        <Field
                          name="verificationCode"
                          type="text"
                          placeholder="123456"
                          maxLength={6}
                          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white text-center text-2xl tracking-widest placeholder-gray-400 focus:outline-none focus:border-pink-500"
                        />
                        <ErrorMessage
                          name="verificationCode"
                          component="p"
                          className="mt-1 text-sm text-red-400"
                        />
                      </div>

                      {verificationSent && (
                        <button
                          type="button"
                          onClick={() => sendVerificationCode(values.phone)}
                          className="text-sm text-pink-500 hover:text-pink-400"
                        >
                          Resend code
                        </button>
                      )}
                    </motion.div>
                  )}

                  {/* Step 3: Location */}
                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">
                          Where are you located?
                        </h2>
                        <p className="text-gray-400">
                          Help us find stylists near you
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => detectLocation(setFieldValue)}
                        disabled={isDetectingLocation}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isDetectingLocation ? (
                          <>
                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                            Detecting...
                          </>
                        ) : (
                          <>
                            <MapPinIcon className="w-5 h-5" />
                            Detect My Location
                          </>
                        )}
                      </button>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            City
                          </label>
                          <Field
                            name="location.city"
                            type="text"
                            placeholder="Los Angeles"
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
                          />
                          <ErrorMessage
                            name="location.city"
                            component="p"
                            className="mt-1 text-sm text-red-400"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              State
                            </label>
                            <Field
                              name="location.state"
                              type="text"
                              placeholder="CA"
                              maxLength={2}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500 uppercase"
                            />
                            <ErrorMessage
                              name="location.state"
                              component="p"
                              className="mt-1 text-sm text-red-400"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              ZIP Code
                            </label>
                            <Field
                              name="location.zip"
                              type="text"
                              placeholder="90001"
                              maxLength={5}
                              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-pink-500"
                            />
                            <ErrorMessage
                              name="location.zip"
                              component="p"
                              className="mt-1 text-sm text-red-400"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Profile Picture */}
                  {currentStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">
                          Add a profile picture
                        </h2>
                        <p className="text-gray-400">
                          Optional - you can skip this step
                        </p>
                      </div>

                      <div className="flex flex-col items-center gap-6">
                        {values.profilePicture ? (
                          <div className="relative">
                            <img
                              src={values.profilePicture}
                              alt="Profile"
                              className="w-32 h-32 rounded-full object-cover border-4 border-pink-500"
                            />
                            <button
                              type="button"
                              onClick={() => setFieldValue('profilePicture', null)}
                              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center border-4 border-dashed border-gray-600">
                            <CameraIcon className="w-12 h-12 text-gray-500" />
                          </div>
                        )}

                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                uploadProfilePicture(file, setFieldValue)
                              }
                            }}
                          />
                          <span className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all inline-block">
                            {values.profilePicture ? 'Change Picture' : 'Upload Picture'}
                          </span>
                        </label>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-700">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-xl hover:bg-gray-600 transition-all flex items-center gap-2"
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                      Back
                    </button>
                  )}

                  {currentStep < totalSteps ? (
                    <button
                      type="button"
                      onClick={() => handleNext(values, validateForm)}
                      disabled={isVerifying}
                      className="ml-auto px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:to-purple-600 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isVerifying ? 'Verifying...' : 'Next'}
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="ml-auto px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-teal-600 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isSubmitting ? 'Completing...' : 'Complete Onboarding'}
                      <CheckIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  )
}
