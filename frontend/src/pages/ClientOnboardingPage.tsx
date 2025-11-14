import { useState, useEffect } from 'react'
import StepWizard from 'react-step-wizard'
import { useForm, FormProvider } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  SparklesIcon,
  CheckCircleIcon,
  PhoneIcon,
  MapPinIcon,
  HeartIcon,
  CameraIcon,
  UserGroupIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || ''
const STORAGE_KEY = 'beautycita-client-onboarding-progress'

interface OnboardingData {
  phone: string
  phoneVerified: boolean
  verificationCode: string
  location: {
    city: string
    state: string
    zip: string
    latitude?: number
    longitude?: number
  }
  servicePreferences: string[]
  profilePicture: string | null
}

interface WizardProps {
  onComplete: () => void
  onExit?: () => void
}

const SERVICES = [
  { id: 'haircut', label: 'Haircut', icon: '✂️' },
  { id: 'hair-coloring', label: 'Hair Coloring', icon: '🎨' },
  { id: 'hair-styling', label: 'Hair Styling', icon: '💇' },
  { id: 'manicure', label: 'Manicure', icon: '💅' },
  { id: 'pedicure', label: 'Pedicure', icon: '🦶' },
  { id: 'makeup', label: 'Makeup', icon: '💄' },
  { id: 'facial', label: 'Facial', icon: '✨' },
  { id: 'waxing', label: 'Waxing', icon: '🪒' },
  { id: 'massage', label: 'Massage', icon: '💆' },
  { id: 'eyebrows', label: 'Eyebrows', icon: '👁️' },
  { id: 'eyelashes', label: 'Eyelashes', icon: '👁️‍🗨️' },
  { id: 'braiding', label: 'Braiding', icon: '🧵' }
]

export default function ClientOnboardingPage({ onComplete, onExit }: Partial<WizardProps> = {}) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  console.log('[CLIENT_ONBOARDING] Component mounted', { onComplete: !!onComplete })
  const [wizardInstance, setWizardInstance] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [verificationSent, setVerificationSent] = useState(false)
  const [nearbyStylist, setNearbyStylist] = useState<any[]>([])

  const methods = useForm<OnboardingData>({
    mode: 'onChange',
    defaultValues: {
      phone: '',
      phoneVerified: false,
      verificationCode: '',
      location: {
        city: '',
        state: '',
        zip: ''
      },
      servicePreferences: [],
      profilePicture: null
    }
  })

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = methods

  const watchedServicePreferences = watch('servicePreferences')
  const watchedProfilePicture = watch('profilePicture')

  const steps = [
    { number: 1, title: 'Phone Verification', icon: PhoneIcon, gradient: 'from-pink-500 to-purple-500' },
    { number: 2, title: 'Your Location', icon: MapPinIcon, gradient: 'from-blue-500 to-cyan-500' },
    { number: 3, title: 'Service Preferences', icon: HeartIcon, gradient: 'from-purple-500 to-pink-500' },
    { number: 4, title: 'Profile Picture', icon: CameraIcon, gradient: 'from-green-500 to-teal-500' },
    { number: 5, title: 'Find Stylists', icon: UserGroupIcon, gradient: 'from-yellow-500 to-orange-500' },
    { number: 6, title: 'Getting Started', icon: BookOpenIcon, gradient: 'from-pink-500 to-purple-500' }
  ]

  // Check if user has already completed onboarding
  useEffect(() => {
    // Skip onboarding check if in test mode (onComplete prop provided)
    if (onComplete) return

    const checkOnboardingStatus = async () => {
      try {
        const token = localStorage.getItem('beautycita-auth')
          ? JSON.parse(localStorage.getItem('beautycita-auth')!).state.token
          : ''

        const response = await fetch(`${API_URL}/api/onboarding/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const result = await response.json()
          if (result.completed) {
            navigate('/dashboard')
          }
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error)
      }
    }

    checkOnboardingStatus()
  }, [navigate, onComplete])

  // Load saved progress
  useEffect(() => {
    const savedProgress = localStorage.getItem(STORAGE_KEY)
    if (savedProgress) {
      try {
        const { step, completed, formData } = JSON.parse(savedProgress)
        console.log('[CLIENT_ONBOARDING] Loaded progress:', { step, completed })
        setCompletedSteps(completed || [])
        if (formData) {
          Object.keys(formData).forEach(key => {
            setValue(key as any, formData[key])
          })
        }
      } catch (error) {
        console.error('[CLIENT_ONBOARDING] Failed to load progress:', error)
      }
    }
  }, [setValue])

  // Save progress
  useEffect(() => {
    const formData = getValues()
    const progress = {
      step: currentStep,
      completed: completedSteps,
      formData,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    console.log('[CLIENT_ONBOARDING] Saved progress:', { step: currentStep, completed: completedSteps })
  }, [currentStep, completedSteps, getValues])

  const handleStepChange = (stats: any) => {
    console.log('[CLIENT_ONBOARDING] Step changed:', stats)
    setCurrentStep(stats.activeStep)
  }

  const handleStepComplete = (stepNumber: number) => {
    console.log('[CLIENT_ONBOARDING] ========== STEP COMPLETE ==========')
    console.log('[CLIENT_ONBOARDING] Completing step:', stepNumber)

    setCompletedSteps(prev => {
      if (!prev.includes(stepNumber)) {
        const newCompleted = [...prev, stepNumber]
        console.log('[CLIENT_ONBOARDING] Completed steps:', newCompleted)
        return newCompleted
      }
      return prev
    })

    if (wizardInstance) {
      console.log('[CLIENT_ONBOARDING] Calling nextStep()')
      wizardInstance.nextStep()
    }
  }

  const handleServiceToggle = (serviceId: string) => {
    const current = getValues('servicePreferences') || []
    const updated = current.includes(serviceId)
      ? current.filter(s => s !== serviceId)
      : [...current, serviceId]
    setValue('servicePreferences', updated)
  }

  const onSubmit = async (data: OnboardingData) => {
    console.log('[CLIENT_ONBOARDING] 🎉 Completing onboarding')
    console.log('[CLIENT_ONBOARDING] Form data:', data)

    try {
      const token = localStorage.getItem('beautycita-auth')
        ? JSON.parse(localStorage.getItem('beautycita-auth')!).state.token
        : ''

      const response = await fetch(`${API_URL}/api/onboarding/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          completed: true,
          completedAt: new Date().toISOString()
        })
      })

      if (response.ok) {
        toast.success('Welcome to BeautyCita! 🎉')
        localStorage.removeItem(STORAGE_KEY)
        if (onComplete) {
          onComplete()
        } else {
          window.location.href = '/dashboard'
        }
      } else {
        toast.error('Failed to complete onboarding')
      }
    } catch (error: any) {
      console.error('[CLIENT_ONBOARDING] Error completing:', error)
      toast.error(error.message || 'Failed to complete onboarding. Please try again.')
    }
  }

  const currentStepData = steps[currentStep - 1]

  return (
    <FormProvider {...methods}>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Progress Indicators */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Client Onboarding</h2>
            </div>

            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isCompleted = completedSteps.includes(step.number)
                const isCurrent = step.number === currentStep
                const isPast = step.number < currentStep

                return (
                  <div key={step.number} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : isCurrent
                            ? `bg-gradient-to-r ${step.gradient} text-white`
                            : 'bg-gray-200 text-gray-400'
                        }`}
                        onClick={() => {
                          if (wizardInstance && (isPast || isCompleted)) {
                            wizardInstance.goToStep(step.number)
                          }
                        }}
                      >
                        {isCompleted ? (
                          <CheckCircleIcon className="h-6 w-6" />
                        ) : (
                          <step.icon className="h-6 w-6" />
                        )}
                      </div>
                      <span className={`text-xs mt-2 text-center hidden sm:block ${
                        isCurrent ? 'text-gray-900 font-medium' : 'text-gray-400'
                      }`}>
                        {step.title}
                      </span>
                    </div>

                    {index < steps.length - 1 && (
                      <div className="flex-1 h-1 mx-2">
                        <div
                          className={`h-full rounded transition-all ${
                            isCompleted || isPast ? 'bg-green-500' : 'bg-gray-200'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <StepWizard
              instance={setWizardInstance}
              onStepChange={handleStepChange}
              isHashEnabled={false}
              nav={<></>}
            >
              <Step1
                onComplete={() => handleStepComplete(1)}
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                verificationSent={verificationSent}
                setVerificationSent={setVerificationSent}
              />
              <Step2
                onComplete={() => handleStepComplete(2)}
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
              />
              <Step3
                onComplete={() => handleStepComplete(3)}
                watchedServicePreferences={watchedServicePreferences}
                handleServiceToggle={handleServiceToggle}
              />
              <Step4
                onComplete={() => handleStepComplete(4)}
                watchedProfilePicture={watchedProfilePicture}
                setValue={setValue}
              />
              <Step5
                onComplete={() => handleStepComplete(5)}
                watch={watch}
                nearbyStylist={nearbyStylist}
                setNearbyStylist={setNearbyStylist}
              />
              <Step6
                onComplete={handleSubmit(onSubmit)}
              />
            </StepWizard>
          </div>
        </div>
      </div>
    </FormProvider>
  )
}

// STEP 1: Phone Verification
function Step1({ onComplete, register, errors, watch, setValue, verificationSent, setVerificationSent, previousStep, nextStep }: any) {
  const [loading, setLoading] = useState(false)

  const sendVerificationCode = async () => {
    const phone = watch('phone')
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('beautycita-auth')
        ? JSON.parse(localStorage.getItem('beautycita-auth')!).state.token
        : ''

      const response = await fetch(`${API_URL}/api/onboarding/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ phone })
      })

      if (response.ok) {
        setVerificationSent(true)
        toast.success('Verification code sent!')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to send verification code')
      }
    } catch (error) {
      console.error('Send verification error:', error)
      toast.error('Failed to send verification code')
    } finally {
      setLoading(false)
    }
  }

  const verifyPhone = async () => {
    const code = watch('verificationCode')
    if (!code || code.length < 4) {
      toast.error('Please enter the verification code')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('beautycita-auth')
        ? JSON.parse(localStorage.getItem('beautycita-auth')!).state.token
        : ''

      const response = await fetch(`${API_URL}/api/onboarding/verify-phone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phone: watch('phone'),
          code
        })
      })

      if (response.ok) {
        setValue('phoneVerified', true)
        toast.success('Phone verified successfully!')
        setTimeout(onComplete, 500)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Invalid verification code')
      }
    } catch (error) {
      console.error('Verify phone error:', error)
      toast.error('Failed to verify phone')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <PhoneIcon className="h-12 w-12 text-pink-600 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900">Welcome to BeautyCita!</h2>
        <p className="text-gray-600 mt-1">Let's verify your phone number to get started</p>
      </div>

      {/* Phone Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number *
        </label>
        <input
          {...register('phone', { required: 'Phone number is required' })}
          type="tel"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
          placeholder="(555) 123-4567"
          disabled={verificationSent}
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
        )}
      </div>

      {!verificationSent ? (
        <button
          type="button"
          onClick={sendVerificationCode}
          disabled={loading || !watch('phone')}
          className="w-full px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Sending...' : 'Send Verification Code'}
        </button>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code *
            </label>
            <input
              {...register('verificationCode', { required: 'Verification code is required' })}
              type="text"
              maxLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none text-center text-2xl tracking-widest"
              placeholder="000000"
            />
            {errors.verificationCode && (
              <p className="mt-1 text-sm text-red-600">{errors.verificationCode.message}</p>
            )}
          </div>

          <button
            type="button"
            onClick={verifyPhone}
            disabled={loading || !watch('verificationCode')}
            className="w-full px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify Phone'}
          </button>

          <button
            type="button"
            onClick={() => setVerificationSent(false)}
            className="w-full text-sm text-gray-600 hover:text-gray-900"
          >
            Change phone number
          </button>
        </div>
      )}
    </div>
  )
}

// STEP 2: Location
function Step2({ onComplete, register, errors, watch, setValue, previousStep }: any) {
  const [loading, setLoading] = useState(false)

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )

          if (response.ok) {
            const locationData = await response.json()
            const address = locationData.address

            setValue('location.city', address.city || address.town || address.village || '')
            setValue('location.state', address.state || '')
            setValue('location.zip', address.postcode || '')
            setValue('location.latitude', latitude)
            setValue('location.longitude', longitude)

            toast.success('Location detected!')
          }
        } catch (error) {
          console.error('Reverse geocode error:', error)
          toast.error('Failed to detect location')
        } finally {
          setLoading(false)
        }
      },
      (error) => {
        console.error('Geolocation error:', error)
        toast.error('Failed to get your location')
        setLoading(false)
      }
    )
  }

  const saveLocation = async () => {
    const city = watch('location.city')
    const zip = watch('location.zip')

    if (!city || !zip) {
      toast.error('Please enter your city and zip code')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('beautycita-auth')
        ? JSON.parse(localStorage.getItem('beautycita-auth')!).state.token
        : ''

      const response = await fetch(`${API_URL}/api/onboarding/save-location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          city,
          state: watch('location.state'),
          zip,
          latitude: watch('location.latitude'),
          longitude: watch('location.longitude')
        })
      })

      if (response.ok) {
        toast.success('Location saved!')
        setTimeout(onComplete, 500)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to save location')
      }
    } catch (error) {
      console.error('Save location error:', error)
      toast.error('Failed to save location')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <MapPinIcon className="h-12 w-12 text-blue-600 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900">Where are you located?</h2>
        <p className="text-gray-600 mt-1">We'll find the best stylists near you</p>
      </div>

      <button
        type="button"
        onClick={detectLocation}
        disabled={loading}
        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
      >
        {loading ? 'Detecting...' : 'Use My Current Location'}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or enter manually</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
          <input
            {...register('location.city', { required: 'City is required' })}
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            placeholder="New York"
          />
          {errors.location?.city && (
            <p className="mt-1 text-sm text-red-600">{errors.location.city.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
          <input
            {...register('location.state', { required: 'State is required' })}
            type="text"
            maxLength={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none uppercase"
            placeholder="NY"
          />
          {errors.location?.state && (
            <p className="mt-1 text-sm text-red-600">{errors.location.state.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code *</label>
          <input
            {...register('location.zip', { required: 'Zip code is required' })}
            type="text"
            maxLength={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            placeholder="10001"
          />
          {errors.location?.zip && (
            <p className="mt-1 text-sm text-red-600">{errors.location.zip.message}</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={previousStep}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={saveLocation}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Next Step →'}
        </button>
      </div>
    </div>
  )
}

// STEP 3: Service Preferences
function Step3({ onComplete, watchedServicePreferences, handleServiceToggle, previousStep }: any) {
  const [loading, setLoading] = useState(false)

  const savePreferences = async () => {
    if (watchedServicePreferences?.length === 0) {
      toast.error('Please select at least one service')
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem('beautycita-auth')
        ? JSON.parse(localStorage.getItem('beautycita-auth')!).state.token
        : ''

      const response = await fetch(`${API_URL}/api/onboarding/save-preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ services: watchedServicePreferences })
      })

      if (response.ok) {
        toast.success('Preferences saved!')
        setTimeout(onComplete, 500)
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to save preferences')
      }
    } catch (error) {
      console.error('Save preferences error:', error)
      toast.error('Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <HeartIcon className="h-12 w-12 text-purple-600 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900">What services interest you?</h2>
        <p className="text-gray-600 mt-1">Select all that apply</p>
      </div>

      {/* Service Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SERVICES.map((service) => (
          <label
            key={service.id}
            className={`flex flex-col items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
              watchedServicePreferences?.includes(service.id)
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-purple-200'
            }`}
          >
            <input
              type="checkbox"
              checked={watchedServicePreferences?.includes(service.id) || false}
              onChange={() => handleServiceToggle(service.id)}
              className="sr-only"
            />
            <span className="text-3xl mb-2">{service.icon}</span>
            <span className="text-sm font-medium text-gray-700 text-center">{service.label}</span>
            {watchedServicePreferences?.includes(service.id) && (
              <CheckCircleIcon className="h-5 w-5 text-purple-600 mt-2" />
            )}
          </label>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500">
        {watchedServicePreferences?.length || 0} service{watchedServicePreferences?.length !== 1 ? 's' : ''} selected
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={previousStep}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={savePreferences}
          disabled={loading || watchedServicePreferences?.length === 0}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Next Step →'}
        </button>
      </div>
    </div>
  )
}

// STEP 4: Profile Picture
function Step4({ onComplete, watchedProfilePicture, setValue, previousStep }: any) {
  const [loading, setLoading] = useState(false)

  const uploadProfilePicture = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('profilePicture', file)

      const token = localStorage.getItem('beautycita-auth')
        ? JSON.parse(localStorage.getItem('beautycita-auth')!).state.token
        : ''

      const response = await fetch(`${API_URL}/api/onboarding/upload-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setValue('profilePicture', result.url)
        toast.success('Profile picture uploaded!')
      } else {
        toast.error('Failed to upload picture')
      }
    } catch (error) {
      console.error('Upload picture error:', error)
      toast.error('Failed to upload picture')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadProfilePicture(file)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CameraIcon className="h-12 w-12 text-green-600 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900">Add a profile picture</h2>
        <p className="text-gray-600 mt-1">Optional, but helps stylists recognize you</p>
      </div>

      <div className="flex flex-col items-center space-y-6">
        {watchedProfilePicture ? (
          <div className="relative">
            <img
              src={watchedProfilePicture}
              alt="Profile"
              className="w-40 h-40 rounded-full object-cover border-4 border-purple-500"
            />
            <button
              type="button"
              onClick={() => setValue('profilePicture', null)}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
            >
              <span className="text-white text-xl font-bold">×</span>
            </button>
          </div>
        ) : (
          <label className="w-40 h-40 rounded-full bg-gray-100 border-4 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors">
            <CameraIcon className="h-10 w-10 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Upload Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        )}

        <div className="text-center text-sm text-gray-500 max-w-md">
          Accepted formats: JPG, PNG, GIF (max 5MB)
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={previousStep}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
        >
          ← Back
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onComplete}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
          >
            Skip for Now
          </button>
          <button
            type="button"
            onClick={onComplete}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            Next Step →
          </button>
        </div>
      </div>
    </div>
  )
}

// STEP 5: Find Stylists
function Step5({ onComplete, watch, nearbyStylist, setNearbyStylist, previousStep }: any) {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const findNearbyStylist = async () => {
      const latitude = watch('location.latitude')
      const longitude = watch('location.longitude')
      const servicePreferences = watch('servicePreferences')

      if (!latitude || !servicePreferences?.length) {
        return
      }

      setLoading(true)
      try {
        const token = localStorage.getItem('beautycita-auth')
          ? JSON.parse(localStorage.getItem('beautycita-auth')!).state.token
          : ''

        const response = await fetch(
          `${API_URL}/api/stylists/nearby?lat=${latitude}&lng=${longitude}&services=${servicePreferences.join(',')}&limit=5`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        )

        if (response.ok) {
          const result = await response.json()
          setNearbyStylist(result.stylists || [])
        }
      } catch (error) {
        console.error('Find stylists error:', error)
        toast.error('Failed to find nearby stylists')
      } finally {
        setLoading(false)
      }
    }

    findNearbyStylist()
  }, [])

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <UserGroupIcon className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900">Stylists near you</h2>
        <p className="text-gray-600 mt-1">Browse top-rated professionals in your area</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : nearbyStylist.length > 0 ? (
        <div className="space-y-4">
          {nearbyStylist.slice(0, 3).map((stylist: any) => (
            <div
              key={stylist.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-purple-500 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={stylist.profile_picture_url || '/default-avatar.png'}
                  alt={stylist.business_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{stylist.business_name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>⭐ {stylist.average_rating?.toFixed(1) || '5.0'}</span>
                    <span>•</span>
                    <span>{stylist.distance?.toFixed(1) || '0.5'} mi</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/stylist/${stylist.id}`)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <UserGroupIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>No stylists found nearby. Try expanding your search area.</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={previousStep}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={onComplete}
          className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
        >
          Next Step →
        </button>
      </div>
    </div>
  )
}

// STEP 6: Getting Started
function Step6({ onComplete, previousStep }: any) {
  const [loading, setLoading] = useState(false)

  const handleComplete = async () => {
    setLoading(true)
    await onComplete()
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <SparklesIcon className="h-12 w-12 text-pink-600 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900">You're all set! 🎉</h2>
        <p className="text-gray-600 mt-1">Here's how to book your first appointment</p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">1</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Find a Stylist</h3>
              <p className="text-gray-600 text-sm">Browse stylists by location, service, or rating</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">2</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Choose a Service</h3>
              <p className="text-gray-600 text-sm">Select from their available services and pricing</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">3</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Pick a Time</h3>
              <p className="text-gray-600 text-sm">View real-time availability and book instantly</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">4</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Confirm & Pay</h3>
              <p className="text-gray-600 text-sm">Secure payment with booking protection</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-pink-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <SparklesIcon className="h-8 w-8 text-pink-600 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Pro Tip</h3>
            <p className="text-sm text-gray-700">
              Check stylist reviews and portfolios before booking to find the perfect match for your style!
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={previousStep}
          className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleComplete}
          disabled={loading}
          className="px-6 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-lg rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Finishing...' : 'Start Exploring BeautyCita'}
        </button>
      </div>
    </div>
  )
}
