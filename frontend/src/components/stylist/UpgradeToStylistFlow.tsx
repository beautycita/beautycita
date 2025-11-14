import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import {
  ScissorsIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  CreditCardIcon,
  PhotoIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  AtSymbolIcon,
  PhoneIcon,
  GlobeAltIcon,
  CalendarIcon,
  AcademicCapIcon,
  LanguageIcon,
  DocumentTextIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import axios from 'axios'
import toast from 'react-hot-toast'
import LocationPicker from '../ui/LocationPicker'
import UsernameSelector from '../profile/UsernameSelector'
import ImportAssistant from './ImportAssistant'

const API_URL = import.meta.env.VITE_API_URL || ''

interface StylistProfileForm {
  // Step 1: Username & Contact
  username: string
  phone: string

  // Step 2: Business Info
  businessName: string
  bio: string
  specialties: string[]
  experienceYears: number
  instagram?: string
  tiktok?: string
  facebook?: string
  website?: string
  languages: string[]

  // Step 3: Location
  locationAddress: string
  locationCity: string
  locationState: string
  locationZip?: string

  // Step 4: Services & Pricing (handled separately)
  // Step 5: Working Hours (handled separately)

  // Step 6: Certifications & Education
  certifications?: string
  education?: string
  cancellationPolicy?: string
}

const SPECIALTIES_OPTIONS = [
  'Hair Styling',
  'Hair Coloring',
  'Makeup',
  'Nail Art',
  'Manicure & Pedicure',
  'Facials',
  'Waxing',
  'Eyelash Extensions',
  'Eyebrow Shaping',
  'Massage Therapy',
  'Body Treatments'
]

const LANGUAGES_OPTIONS = [
  'English',
  'Spanish',
  'French',
  'Portuguese',
  'Mandarin',
  'Cantonese',
  'Korean',
  'Japanese',
  'Vietnamese',
  'Tagalog',
  'Arabic',
  'Russian',
  'German',
  'Italian'
]

export default function UpgradeToStylistFlow() {
  const { user } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState<Partial<StylistProfileForm>>({})
  const [portfolioImages, setPortfolioImages] = useState<File[]>([])
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([])
  const [stripeOnboardingComplete, setStripeOnboardingComplete] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showImportAssistant, setShowImportAssistant] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<StylistProfileForm>()

  const watchedSpecialties = watch('specialties') || []
  const watchedLanguages = watch('languages') || []

  // Check if user is already pending approval
  if (user?.user_status === 'PENDING_STYLIST_APPROVAL') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-8 shadow-lg"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center">
              <ClockIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Application Under Review</h2>
              <p className="text-gray-600">We're reviewing your stylist application</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-4">
              <h3 className="font-semibold text-gray-900 mb-2">What's Next?</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Our team will review your profile and portfolio</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>We'll verify your business information</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>You'll receive an email once approved</span>
                </li>
              </ul>
            </div>

            <p className="text-sm text-gray-500">
              Review typically takes 1-3 business days. We'll notify you via email once your application is approved.
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  // Check if user is already a stylist
  if (user?.role === 'STYLIST') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 shadow-lg"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-green-500 rounded-3xl flex items-center justify-center">
              <CheckCircleIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">You're Already a Stylist!</h2>
              <p className="text-gray-600">Manage your business from the stylist dashboard</p>
            </div>
          </div>

          <a
            href="/dashboard/stylist"
            className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-3xl hover:bg-green-700 transition-colors"
          >
            Go to Stylist Dashboard
            <ArrowRightIcon className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    )
  }

  const handleLocationSelect = (location: any) => {
    setValue('locationAddress', location.address)
    setValue('locationCity', location.city)
    setValue('locationState', location.state)
    setValue('locationZip', location.zip)
    setProfileData(prev => ({
      ...prev,
      locationAddress: location.address,
      locationCity: location.city,
      locationState: location.state,
      locationZip: location.zip
    }))
  }

  const toggleSpecialty = (specialty: string) => {
    const current = watchedSpecialties
    const updated = current.includes(specialty)
      ? current.filter(s => s !== specialty)
      : [...current, specialty]
    setValue('specialties', updated)
  }

  const toggleLanguage = (language: string) => {
    const current = watchedLanguages
    const updated = current.includes(language)
      ? current.filter(l => l !== language)
      : [...current, language]
    setValue('languages', updated)
  }

  const handleImportComplete = (data: any) => {
    // Pre-fill form fields with imported data
    if (data.businessName) setValue('businessName', data.businessName)
    if (data.bio) setValue('bio', data.bio)
    if (data.phone) setValue('phone', data.phone)
    if (data.instagram) setValue('instagram', data.instagram)
    if (data.facebook) setValue('facebook', data.facebook)
    if (data.website) setValue('website', data.website)

    setProfileData(prev => ({ ...prev, ...data }))
    toast.success('Information imported! Review and continue.')
    setShowImportAssistant(false)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (portfolioImages.length + files.length > 6) {
      toast.error('Maximum 6 portfolio images allowed')
      return
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`)
        return false
      }
      return true
    })

    setPortfolioImages(prev => [...prev, ...validFiles])

    // Generate previews
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPortfolioPreviews(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setPortfolioImages(prev => prev.filter((_, i) => i !== index))
    setPortfolioPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleBusinessInfoSubmit = (data: StylistProfileForm) => {
    setProfileData(prev => ({ ...prev, ...data }))
    setCurrentStep(2)
  }

  const handleLocationSubmit = () => {
    if (!profileData.locationAddress || !profileData.locationCity) {
      toast.error('Please select your business location')
      return
    }
    setCurrentStep(4)
  }

  const handleStripeOnboarding = async () => {
    try {
      setIsLoading(true)

      // Create Stripe Connect account and get onboarding link
      const token = localStorage.getItem('beautycita-auth-token')
      const response = await axios.post(
        `${API_URL}/api/stripe/create-connect-account`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success && response.data.url) {
        // Open Stripe onboarding in new window
        const stripeWindow = window.open(response.data.url, '_blank')

        // Poll for completion (in production, use webhook)
        const checkInterval = setInterval(async () => {
          try {
            const statusResponse = await axios.get(
              `${API_URL}/api/stripe/onboarding-status`,
              { headers: { Authorization: `Bearer ${token}` } }
            )

            if (statusResponse.data.complete) {
              clearInterval(checkInterval)
              setStripeOnboardingComplete(true)
              toast.success('Stripe onboarding complete!')
              setCurrentStep(5)
            }
          } catch (error) {
            console.error('Error checking Stripe status:', error)
          }
        }, 3000)

        // Clear interval after 5 minutes
        setTimeout(() => clearInterval(checkInterval), 5 * 60 * 1000)
      }
    } catch (error: any) {
      console.error('Stripe onboarding error:', error)
      toast.error(error.response?.data?.message || 'Failed to start Stripe onboarding')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkipStripe = () => {
    toast.error('Stripe onboarding is required to accept payments')
  }

  const handleSubmitApplication = async () => {
    try {
      setIsLoading(true)
      setValidationErrors([])

      // First, upload portfolio images
      const token = localStorage.getItem('beautycita-auth-token')
      const formData = new FormData()

      portfolioImages.forEach((file, index) => {
        formData.append('portfolioImages', file)
      })

      // Add profile data
      Object.entries(profileData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value))
        }
      })

      // Update stylist profile
      await axios.post(
        `${API_URL}/api/stylist/update-profile`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      // Submit upgrade request
      const upgradeResponse = await axios.post(
        `${API_URL}/api/auth/upgrade-to-stylist`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (upgradeResponse.data.success) {
        toast.success('Application submitted successfully!')
        // Reload page to show pending status
        window.location.reload()
      } else if (upgradeResponse.data.requiresProfileCompletion) {
        setValidationErrors(upgradeResponse.data.validationErrors || [])
        toast.error('Please complete all required fields')
      }
    } catch (error: any) {
      console.error('Application submission error:', error)

      if (error.response?.data?.validationErrors) {
        setValidationErrors(error.response.data.validationErrors)
      }

      toast.error(error.response?.data?.message || 'Failed to submit application')
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Username', icon: AtSymbolIcon },
    { number: 2, title: 'Business Info', icon: BuildingStorefrontIcon },
    { number: 3, title: 'Location', icon: MapPinIcon },
    { number: 4, title: 'Payments', icon: CreditCardIcon },
    { number: 5, title: 'Credentials', icon: AcademicCapIcon },
    { number: 6, title: 'Portfolio', icon: PhotoIcon }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <ScissorsIcon className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Become a Stylist</h1>
        <p className="text-gray-600">Complete your profile to start offering services</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-12 max-w-2xl mx-auto">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isComplete = currentStep > step.number
          const isCurrent = currentStep === step.number

          return (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                    isComplete
                      ? 'bg-green-500'
                      : isCurrent
                      ? 'bg-purple-600'
                      : 'bg-gray-200'
                  }`}
                >
                  {isComplete ? (
                    <CheckCircleIcon className="w-6 h-6 text-white" />
                  ) : (
                    <Icon className={`w-6 h-6 ${isCurrent ? 'text-white' : 'text-gray-400'}`} />
                  )}
                </div>
                <span className={`text-xs font-medium ${isCurrent ? 'text-purple-600' : 'text-gray-500'}`}>
                  {step.title}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-2 -mt-8 transition-colors ${
                    isComplete ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-3xl shadow-lg p-8"
        >
          {/* Step 1: Username & Contact */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Choose your username & contact info</h2>
              <p className="text-gray-600 mb-6">
                Your username will be used for your public portfolio page (beautycita.com/p/yourname)
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <UsernameSelector
                  onComplete={() => {
                    // Username is saved automatically
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('phone', { required: 'Phone number is required' })}
                    type="tel"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="(555) 123-4567"
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                )}
              </div>

              <button
                onClick={() => {
                  if (!user?.username) {
                    toast.error('Please choose a username first')
                    return
                  }
                  const phone = watch('phone')
                  if (!phone) {
                    toast.error('Please enter your phone number')
                    return
                  }
                  setProfileData(prev => ({ ...prev, phone }))
                  setCurrentStep(2)
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRightIcon className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2: Business Info */}
          {currentStep === 2 && (
            <form onSubmit={handleSubmit(handleBusinessInfoSubmit)} className="space-y-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about your business</h2>
                  <p className="text-sm text-gray-600">Already have a profile elsewhere? Import it!</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImportAssistant(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-3xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  <DocumentDuplicateIcon className="w-5 h-5" />
                  Import Profile
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  {...register('businessName', { required: 'Business name is required' })}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="e.g., Maria's Beauty Studio"
                />
                {errors.businessName && (
                  <p className="text-red-500 text-sm mt-1">{errors.businessName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio *
                </label>
                <textarea
                  {...register('bio', { required: 'Bio is required', minLength: { value: 50, message: 'Bio must be at least 50 characters' } })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="Tell clients about your experience, style, and what makes you unique..."
                />
                {errors.bio && (
                  <p className="text-red-500 text-sm mt-1">{errors.bio.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialties * (Select at least one)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SPECIALTIES_OPTIONS.map(specialty => (
                    <button
                      key={specialty}
                      type="button"
                      onClick={() => toggleSpecialty(specialty)}
                      className={`px-4 py-2 rounded-3xl border-2 transition-all text-sm font-medium ${
                        watchedSpecialties.includes(specialty)
                          ? 'border-purple-600 bg-purple-50 text-purple-600'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300'
                      }`}
                    >
                      {specialty}
                    </button>
                  ))}
                </div>
                {errors.specialties && (
                  <p className="text-red-500 text-sm mt-1">{errors.specialties.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
                </label>
                <input
                  {...register('experienceYears', { valueAsNumber: true, min: 0 })}
                  type="number"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="e.g., 5"
                />
              </div>

              {/* Social Media & Online Presence */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Online Presence (Optional)</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    {...register('instagram')}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="@yourusername"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TikTok
                  </label>
                  <input
                    {...register('tiktok')}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="@yourusername"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook Page
                  </label>
                  <input
                    {...register('facebook')}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="facebook.com/yourpage"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <div className="relative">
                    <GlobeAltIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...register('website')}
                      type="url"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Languages Spoken *</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {LANGUAGES_OPTIONS.map(language => (
                    <button
                      key={language}
                      type="button"
                      onClick={() => toggleLanguage(language)}
                      className={`px-4 py-2 rounded-3xl border-2 transition-all text-sm font-medium ${
                        watchedLanguages.includes(language)
                          ? 'border-purple-600 bg-purple-50 text-purple-600'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300'
                      }`}
                    >
                      {language}
                    </button>
                  ))}
                </div>
                {errors.languages && (
                  <p className="text-red-500 text-sm mt-1">{errors.languages.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-3xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Back
                </button>

                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Location */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Where is your business located?</h2>

              <LocationPicker
                onLocationSelect={handleLocationSelect}
                placeholder="Enter your business address..."
              />

              {profileData.locationAddress && (
                <div className="bg-green-50 border border-green-200 rounded-3xl p-4 flex items-start gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-green-900 font-medium">Selected Location:</p>
                    <p className="text-green-700">
                      {profileData.locationAddress}, {profileData.locationCity}, {profileData.locationState}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-3xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Back
                </button>

                <button
                  onClick={handleLocationSubmit}
                  disabled={!profileData.locationAddress}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Continue
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Stripe Onboarding */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Set up payments</h2>

              <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
                <div className="flex items-start gap-4">
                  <CreditCardIcon className="w-8 h-8 text-blue-600 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Stripe Connect</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      We use Stripe to securely process payments. You'll need to create a Stripe account to receive payments from clients.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        Secure payment processing
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        Direct deposits to your bank
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        Built-in fraud protection
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {stripeOnboardingComplete ? (
                <div className="bg-green-50 border border-green-200 rounded-3xl p-4 flex items-center gap-3">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                  <span className="text-green-900 font-medium">Stripe onboarding complete!</span>
                </div>
              ) : (
                <button
                  onClick={handleStripeOnboarding}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Connect with Stripe</span>
                      <ArrowRightIcon className="w-5 h-5" />
                    </>
                  )}
                </button>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-3xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Back
                </button>

                {stripeOnboardingComplete && (
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Certifications & Education */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Certifications & Policies</h2>
              <p className="text-gray-600 mb-6">
                Share your credentials and set your cancellation policy
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certifications & Licenses (Optional)
                </label>
                <textarea
                  {...register('certifications')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="e.g., Cosmetology License (State of California), Advanced Hair Coloring Certification..."
                />
                <p className="text-sm text-gray-500 mt-1">List your relevant certifications and licenses</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education & Training (Optional)
                </label>
                <textarea
                  {...register('education')}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="e.g., Paul Mitchell School of Cosmetology, Vidal Sassoon Academy..."
                />
                <p className="text-sm text-gray-500 mt-1">Share your educational background and training</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Policy (Optional)
                </label>
                <textarea
                  {...register('cancellationPolicy')}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="e.g., 24 hours notice required for cancellations. Late cancellations or no-shows may be charged 50% of service cost..."
                />
                <p className="text-sm text-gray-500 mt-1">Set clear expectations for cancellations and no-shows</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-3xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Back
                </button>

                <button
                  onClick={() => {
                    const certifications = watch('certifications')
                    const education = watch('education')
                    const cancellationPolicy = watch('cancellationPolicy')
                    setProfileData(prev => ({
                      ...prev,
                      certifications,
                      education,
                      cancellationPolicy
                    }))
                    setCurrentStep(6)
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Continue
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Portfolio */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload your portfolio</h2>

              <p className="text-gray-600">
                Showcase your best work! Upload at least 1 image (maximum 6).
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {portfolioPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img loading="lazy"
                      src={preview}
                      alt={`Portfolio ${index + 1}`}
                      className="w-full h-48 object-cover rounded-3xl"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}

                {portfolioImages.length < 6 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="h-48 border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center justify-center gap-2 hover:border-purple-500 hover:bg-purple-50 transition-colors"
                  >
                    <PhotoIcon className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">Add Image</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageSelect}
                className="hidden"
              />

              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-3xl p-4">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-red-900 mb-2">Please fix these issues:</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(5)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-3xl hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Back
                </button>

                <button
                  onClick={handleSubmitApplication}
                  disabled={isLoading || portfolioImages.length === 0}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-4 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>Submit Application</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Import Assistant Modal */}
      <ImportAssistant
        isOpen={showImportAssistant}
        onClose={() => setShowImportAssistant(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  )
}
