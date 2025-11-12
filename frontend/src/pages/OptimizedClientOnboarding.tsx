import { useState, useEffect } from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import {
  MapPinIcon,
  HeartIcon,
  CameraIcon,
  SparklesIcon,
  CheckIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  FingerPrintIcon,
} from '@heroicons/react/24/outline'
import { startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

interface OnboardingValues {
  location: {
    city: string
    state: string
    zip: string
  }
  servicePreferences: string[]
  profilePicture: string | null
}

const SERVICES = [
  { id: 'haircut', label: 'Haircut', icon: '✂️', gradient: 'from-pink-500 to-rose-500' },
  { id: 'hair-coloring', label: 'Hair Coloring', icon: '🎨', gradient: 'from-purple-500 to-pink-500' },
  { id: 'hair-styling', label: 'Hair Styling', icon: '💇', gradient: 'from-blue-500 to-purple-500' },
  { id: 'manicure', label: 'Manicure', icon: '💅', gradient: 'from-pink-500 to-orange-500' },
  { id: 'pedicure', label: 'Pedicure', icon: '🦶', gradient: 'from-teal-500 to-cyan-500' },
  { id: 'makeup', label: 'Makeup', icon: '💄', gradient: 'from-red-500 to-pink-500' },
  { id: 'facial', label: 'Facial', icon: '✨', gradient: 'from-yellow-500 to-orange-500' },
  { id: 'waxing', label: 'Waxing', icon: '🪒', gradient: 'from-gray-600 to-gray-800' },
  { id: 'massage', label: 'Massage', icon: '💆', gradient: 'from-green-500 to-teal-500' },
  { id: 'eyebrows', label: 'Eyebrows', icon: '👁️', gradient: 'from-amber-500 to-yellow-500' },
  { id: 'eyelashes', label: 'Eyelashes', icon: '👁️‍🗨️', gradient: 'from-indigo-500 to-purple-500' },
  { id: 'braiding', label: 'Braiding', icon: '🧵', gradient: 'from-fuchsia-500 to-pink-500' },
]

// Validation schema
const onboardingSchema = Yup.object().shape({
  location: Yup.object().shape({
    city: Yup.string().required('City is required'),
    state: Yup.string().required('State is required').length(2, 'Use 2-letter state code'),
    zip: Yup.string().required('ZIP code is required').matches(/^\d{5}$/, 'Must be 5 digits'),
  }),
  servicePreferences: Yup.array().min(1, 'Select at least one service'),
  profilePicture: Yup.string().nullable(),
})

export default function OptimizedClientOnboarding() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isDetectingLocation, setIsDetectingLocation] = useState(false)
  const [showBiometricModal, setShowBiometricModal] = useState(false)
  const [isBiometricLoading, setIsBiometricLoading] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const totalSteps = 3
  const progress = (currentStep / totalSteps) * 100

  const initialValues: OnboardingValues = {
    location: { city: '', state: '', zip: '' },
    servicePreferences: [],
    profilePicture: null,
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

          // Reverse geocode
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )

          if (response.ok) {
            const locationData = await response.json()
            const address = locationData.address

            setFieldValue('location.city', address.city || address.town || address.village || '')
            setFieldValue('location.state', address.state || '')
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

      // Save all onboarding data
      await axios.post(
        `${API_URL}/api/onboarding/complete-client`,
        {
          location: values.location,
          servicePreferences: values.servicePreferences,
          profilePicture: values.profilePicture,
          completed: true,
          completedAt: new Date().toISOString(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      toast.success('Welcome to BeautyCita! 🎉')

      // Check if device supports biometric
      if (browserSupportsWebAuthn()) {
        // Show biometric setup modal
        setShowBiometricModal(true)
      } else {
        // No biometric support, go directly to panel
        setTimeout(() => {
          navigate('/panel')
        }, 1000)
      }
    } catch (error) {
      toast.error('Failed to complete onboarding')
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

  const handleSetupBiometric = async () => {
    try {
      setIsBiometricLoading(true)
      const token = localStorage.getItem('token')

      // Get registration options from backend
      const optionsResponse = await axios.post(
        `${API_URL}/api/webauthn/register/options`,
        {
          email: user?.email,
          role: user?.role || 'CLIENT'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      console.log('WebAuthn options received')

      // Start WebAuthn registration
      const credential = await startRegistration(optionsResponse.data.options)

      // Verify registration with backend
      await axios.post(
        `${API_URL}/api/webauthn/register/verify-minimal`,
        {
          email: user?.email,
          role: user?.role || 'CLIENT',
          credential,
          deviceName: getDefaultDeviceName()
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      toast.success('Biometric login enabled! 🎉')
      setShowBiometricModal(false)
      setTimeout(() => {
        navigate('/panel')
      }, 500)
    } catch (error: any) {
      console.error('Biometric registration error:', error)
      toast.error('Failed to setup biometric login')
      // Still go to panel even if biometric fails
      setShowBiometricModal(false)
      setTimeout(() => {
        navigate('/panel')
      }, 500)
    } finally {
      setIsBiometricLoading(false)
    }
  }

  const handleSkipBiometric = () => {
    setShowBiometricModal(false)
    navigate('/panel')
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {[1, 2, 3].map((step) => (
        <div
          key={step}
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            step === currentStep
              ? 'w-8 bg-gradient-to-r from-pink-500 to-purple-600'
              : step < currentStep
              ? 'bg-green-500'
              : 'bg-gray-700'
          }`}
        />
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-400">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm font-medium text-gray-400">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-600 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {renderStepIndicator()}

        <Formik
          initialValues={initialValues}
          validationSchema={onboardingSchema}
          onSubmit={handleSubmit}
          validateOnChange={false}
          validateOnBlur={true}
        >
          {({ values, setFieldValue, isSubmitting, errors, touched }) => (
            <Form>
              <div className="bg-gray-900/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-800 shadow-2xl">
                <AnimatePresence mode="wait">
                  {/* Step 1: Location */}
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-4">
                          <MapPinIcon className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Where are you located?</h2>
                        <p className="text-gray-400">We'll find the best stylists near you</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => detectLocation(setFieldValue)}
                        disabled={isDetectingLocation}
                        className="w-full px-6 py-4 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
                      >
                        <MapPinIcon className="w-5 h-5" />
                        <span>{isDetectingLocation ? 'Detecting...' : 'Use My Current Location'}</span>
                      </button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-gray-900 text-gray-400">Or enter manually</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">City *</label>
                          <Field
                            name="location.city"
                            type="text"
                            placeholder="Los Angeles"
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                          />
                          <ErrorMessage name="location.city" component="p" className="mt-1 text-sm text-red-400" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">State *</label>
                            <Field
                              name="location.state"
                              type="text"
                              placeholder="CA"
                              maxLength={2}
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white uppercase focus:outline-none focus:border-blue-500"
                            />
                            <ErrorMessage name="location.state" component="p" className="mt-1 text-sm text-red-400" />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">ZIP Code *</label>
                            <Field
                              name="location.zip"
                              type="text"
                              placeholder="90001"
                              maxLength={5}
                              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                            />
                            <ErrorMessage name="location.zip" component="p" className="mt-1 text-sm text-red-400" />
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!values.location.city || !values.location.state || !values.location.zip) {
                            toast.error('Please fill in all location fields')
                            return
                          }
                          setCurrentStep(2)
                        }}
                        className="w-full px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-full hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
                      >
                        <span>Continue</span>
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                    </motion.div>
                  )}

                  {/* Step 2: Service Preferences */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
                          <HeartIcon className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">What services interest you?</h2>
                        <p className="text-gray-400">Select all that apply</p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {SERVICES.map((service) => {
                          const isSelected = values.servicePreferences.includes(service.id)
                          return (
                            <button
                              key={service.id}
                              type="button"
                              onClick={() => {
                                const newPreferences = isSelected
                                  ? values.servicePreferences.filter((s) => s !== service.id)
                                  : [...values.servicePreferences, service.id]
                                setFieldValue('servicePreferences', newPreferences)
                              }}
                              className={`relative p-4 rounded-2xl border-2 transition-all duration-200 ${
                                isSelected
                                  ? `border-pink-500 bg-gradient-to-r ${service.gradient} bg-opacity-20`
                                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                              }`}
                            >
                              <div className="text-3xl mb-2">{service.icon}</div>
                              <div className="text-sm font-medium text-white">{service.label}</div>
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                                  <CheckIcon className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      <div className="text-center text-gray-400 text-sm">
                        {values.servicePreferences.length} service{values.servicePreferences.length !== 1 ? 's' : ''} selected
                      </div>
                      <ErrorMessage name="servicePreferences" component="p" className="text-center text-sm text-red-400" />

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="flex-1 px-6 py-4 bg-gray-800 text-white font-semibold rounded-full hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <ChevronLeftIcon className="h-5 w-5" />
                          <span>Back</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (values.servicePreferences.length === 0) {
                              toast.error('Please select at least one service')
                              return
                            }
                            setCurrentStep(3)
                          }}
                          className="flex-1 px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-full hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg flex items-center justify-center gap-2"
                        >
                          <span>Continue</span>
                          <ChevronRightIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Profile Picture & Complete */}
                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      className="space-y-6"
                    >
                      <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full mb-4">
                          <CameraIcon className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Add a profile picture</h2>
                        <p className="text-gray-400">Optional, but helps stylists recognize you</p>
                      </div>

                      <div className="flex flex-col items-center space-y-6">
                        {values.profilePicture ? (
                          <div className="relative">
                            <img
                              src={values.profilePicture}
                              alt="Profile"
                              className="w-40 h-40 rounded-full object-cover border-4 border-pink-500"
                            />
                            <button
                              type="button"
                              onClick={() => setFieldValue('profilePicture', null)}
                              className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <label className="w-40 h-40 rounded-full bg-gray-800 border-4 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 transition-colors">
                            <CameraIcon className="w-10 h-10 text-gray-400 mb-2" />
                            <span className="text-sm text-gray-400">Upload Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) uploadProfilePicture(file, setFieldValue)
                              }}
                              className="hidden"
                            />
                          </label>
                        )}

                        <div className="text-center text-gray-400 text-sm max-w-md">
                          Accepted formats: JPG, PNG, GIF (max 5MB)
                        </div>
                      </div>

                      <div className="bg-gradient-to-r from-pink-600/20 to-purple-600/20 border border-pink-500/30 rounded-2xl p-5">
                        <div className="flex items-start space-x-3">
                          <SparklesIcon className="w-6 h-6 text-pink-400 flex-shrink-0 mt-1" />
                          <div>
                            <h4 className="text-white font-semibold mb-1">You're almost done!</h4>
                            <p className="text-gray-300 text-sm">
                              Click "Complete Setup" to start discovering amazing stylists in {values.location.city}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="flex-1 px-6 py-4 bg-gray-800 text-white font-semibold rounded-full hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <ChevronLeftIcon className="h-5 w-5" />
                          <span>Back</span>
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 px-6 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold rounded-full hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Completing...' : 'Complete Setup 🎉'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Form>
          )}
        </Formik>
      </motion.div>

      {/* Biometric Setup Modal */}
      <AnimatePresence>
        {showBiometricModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-md w-full border border-gray-800"
            >
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <FingerPrintIcon className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Enable Quick Login
                </h2>
                <p className="text-gray-400">
                  Use Face ID, Touch ID, or Windows Hello for instant access to your account
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleSetupBiometric}
                  disabled={isBiometricLoading}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isBiometricLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Setting up...</span>
                    </>
                  ) : (
                    <>
                      <FingerPrintIcon className="w-5 h-5" />
                      <span>Enable Biometric Login</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleSkipBiometric}
                  disabled={isBiometricLoading}
                  className="w-full text-gray-400 hover:text-white font-medium py-3 px-6 rounded-3xl transition-colors duration-200"
                >
                  Skip for now
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                You can always enable this later in your account settings
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
