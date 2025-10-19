import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check, User, Briefcase, MapPin, Camera, Sparkles } from 'lucide-react'
import LocationPicker from './ui/LocationPicker'

interface StylistRegistrationData {
  // Step 1: Personal Info
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  agreeToTerms: boolean

  // Step 2: Business Info
  businessName: string
  experienceYears: number
  biography: string

  // Step 3: Services & Specialties
  specialties: string[]
  services: string[]
  pricing: Record<string, { price: number; duration: number }>

  // Step 4: Location
  locationAddress: string
  latitude: number
  longitude: number
  city: string
  state: string

  // Step 5: Profile Media (future)
  profilePicture?: File
  bannerImage?: File
}

interface StylistRegistrationFlowProps {
  onSubmit: (data: StylistRegistrationData) => Promise<void>
  onClose: () => void
  loading: boolean
  fieldErrors: {[key: string]: string}
  formError: string
}

const availableSpecialties = [
  'Hair Cutting', 'Hair Coloring', 'Hair Styling', 'Extensions', 'Highlights',
  'Makeup', 'Eyebrow Shaping', 'Eyelash Extensions', 'Facial Treatments',
  'Manicure', 'Pedicure', 'Nail Art', 'Bridal Styling', 'Special Events'
]

const StylistRegistrationFlow: React.FC<StylistRegistrationFlowProps> = ({
  onSubmit,
  onClose,
  loading,
  fieldErrors,
  formError
}) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<StylistRegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    agreeToTerms: false,
    businessName: '',
    experienceYears: 0,
    biography: '',
    specialties: [],
    services: [],
    pricing: {},
    locationAddress: '',
    latitude: 0,
    longitude: 0,
    city: '',
    state: ''
  })

  const [localFieldErrors, setLocalFieldErrors] = useState<{[key: string]: string}>({})
  const [touchedFields, setTouchedFields] = useState<{[key: string]: boolean}>({})

  const totalSteps = 4

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Business Info', icon: Briefcase },
    { number: 3, title: 'Services', icon: Sparkles },
    { number: 4, title: 'Location', icon: MapPin }
  ]

  // Immediate validation using useMemo - recalculates every time form data changes
  const canProceed = useMemo(() => {
    const isValid = validateStep(currentStep)
    console.log(`Step ${currentStep} validation result: ${isValid}`, {
      step: currentStep,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      agreeToTerms: formData.agreeToTerms,
      businessName: formData.businessName,
      experienceYears: formData.experienceYears,
      biography: formData.biography,
      specialties: formData.specialties,
      city: formData.city,
      state: formData.state
    })
    return isValid
  }, [
    currentStep,
    formData.firstName,
    formData.lastName,
    formData.email,
    formData.phone,
    formData.password,
    formData.agreeToTerms,
    formData.businessName,
    formData.experienceYears,
    formData.biography,
    formData.specialties,
    formData.locationAddress,
    formData.latitude,
    formData.longitude,
    formData.city,
    formData.state,
    formData.pricing
  ])

  // Individual field validation functions
  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'firstName':
        if (!value || value.trim().length === 0) return 'First name is required'
        if (value.trim().length < 2) return 'First name must be at least 2 characters'
        return ''

      case 'lastName':
        if (!value || value.trim().length === 0) return 'Last name is required'
        if (value.trim().length < 2) return 'Last name must be at least 2 characters'
        return ''

      case 'email':
        if (!value || value.trim().length === 0) return 'Email address is required'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value.trim())) return 'Please enter a valid email address'
        return ''

      case 'phone':
        if (!value || value.trim().length === 0) return 'Phone number is required'
        if (value.trim().length < 10) return 'Please enter a valid phone number'
        return ''

      case 'password':
        if (!value || value.length === 0) return 'Password is required'
        if (value.length < 6) return 'Password must be at least 6 characters'
        return ''

      case 'businessName':
        if (!value || value.trim().length === 0) return 'Business name is required'
        if (value.trim().length < 2) return 'Business name must be at least 2 characters'
        return ''

      case 'experienceYears':
        if (!value || value === 0) return 'Please select your years of experience'
        return ''

      case 'biography':
        if (!value || value.trim().length === 0) return 'Biography is required'
        if (value.trim().length < 10) return 'Please write at least 10 characters about yourself'
        return ''

      case 'locationAddress':
        if (!value || value.trim().length === 0) return 'Business address is required'
        return ''

      case 'city':
        if (!value || value.trim().length === 0) return 'City is required'
        return ''

      case 'state':
        if (!value || value.trim().length === 0) return 'State is required'
        return ''

      default:
        return ''
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = 'checked' in e.target ? e.target.checked : false

    const newValue = type === 'checkbox' ? checked :
                    type === 'number' ? (value === '' ? 0 : parseInt(value, 10)) :
                    value

    setFormData({
      ...formData,
      [name]: newValue,
    })

    // Validate field if it has been touched
    if (touchedFields[name]) {
      const error = validateField(name, newValue)
      setLocalFieldErrors(prev => ({
        ...prev,
        [name]: error
      }))
    }
  }

  const handleFieldBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const actualValue = type === 'checkbox' ? ('checked' in e.target ? e.target.checked : false) :
                       type === 'number' ? (value === '' ? 0 : parseInt(value, 10)) :
                       value

    // Mark field as touched
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }))

    // Validate field
    const error = validateField(name, actualValue)
    setLocalFieldErrors(prev => ({
      ...prev,
      [name]: error
    }))
  }

  const handleSpecialtyToggle = (specialty: string) => {
    const updatedSpecialties = formData.specialties.includes(specialty)
      ? formData.specialties.filter(s => s !== specialty)
      : [...formData.specialties, specialty]

    setFormData({
      ...formData,
      specialties: updatedSpecialties,
      services: updatedSpecialties // Update services to match specialties
    })
  }

  const handlePricingChange = (service: string, field: 'price' | 'duration', value: string) => {
    const numericValue = field === 'price' ? parseFloat(value) || 0 : parseInt(value, 10) || 0
    setFormData({
      ...formData,
      pricing: {
        ...formData.pricing,
        [service]: {
          ...formData.pricing[service],
          [field]: numericValue
        }
      }
    })
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Step 1: Personal Info - all fields required
        const hasFirstName = Boolean(formData.firstName?.trim() && formData.firstName.trim().length >= 2)
        const hasLastName = Boolean(formData.lastName?.trim() && formData.lastName.trim().length >= 2)
        const hasEmail = Boolean(formData.email?.trim() &&
                               formData.email.trim().length > 0 &&
                               /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()))
        const hasPhone = Boolean(formData.phone?.trim() && formData.phone.trim().length >= 10)
        const hasPassword = Boolean(formData.password && formData.password.length >= 6)
        const hasAgreedToTerms = Boolean(formData.agreeToTerms === true)

        console.log('Step 1 validation:', {
          hasFirstName, firstName: formData.firstName,
          hasLastName, lastName: formData.lastName,
          hasEmail, email: formData.email,
          hasPhone, phone: formData.phone,
          hasPassword, passwordLength: formData.password?.length,
          hasAgreedToTerms, agreeToTerms: formData.agreeToTerms
        })

        return hasFirstName && hasLastName && hasEmail && hasPhone && hasPassword && hasAgreedToTerms

      case 2:
        // Step 2: Business Info - all fields required
        const hasBusinessName = Boolean(formData.businessName?.trim() && formData.businessName.trim().length >= 2)
        const hasExperience = Boolean(formData.experienceYears && formData.experienceYears > 0)
        const hasBiography = Boolean(formData.biography?.trim() && formData.biography.trim().length >= 10)

        console.log('Step 2 validation:', {
          hasBusinessName, businessName: formData.businessName,
          hasExperience, experienceYears: formData.experienceYears,
          hasBiography, biographyLength: formData.biography?.trim()?.length
        })

        return hasBusinessName && hasExperience && hasBiography

      case 3:
        // Step 3: Services & Specialties - must select at least one specialty and provide pricing
        const hasSpecialties = Boolean(formData.specialties && formData.specialties.length > 0)
        const hasValidPricing = hasSpecialties && formData.specialties.every(service => {
          const pricing = formData.pricing[service]
          return pricing &&
                 pricing.price && pricing.price > 0 &&
                 pricing.duration && pricing.duration > 0
        })

        console.log('Step 3 validation:', {
          hasSpecialties, specialtiesCount: formData.specialties?.length,
          hasValidPricing, specialties: formData.specialties
        })

        return hasSpecialties && hasValidPricing

      case 4:
        // Step 4: Location - address is required
        const hasAddress = Boolean(formData.locationAddress?.trim() && formData.locationAddress.trim().length > 0)
        const hasCoordinates = Boolean(formData.latitude && formData.longitude)

        console.log('Step 4 validation:', {
          hasAddress, address: formData.locationAddress,
          hasCoordinates, lat: formData.latitude, lng: formData.longitude
        })

        return hasAddress && hasCoordinates

      default:
        return false
    }
  }

  const nextStep = () => {
    const isValid = validateStep(currentStep)
    console.log(`Attempting to proceed from step ${currentStep}, validation: ${isValid}`)

    // Fail-safe validation - should never reach here if button is properly disabled
    if (!isValid) {
      console.warn('❌ CRITICAL: Next button was clicked but validation failed! This should not happen.')
      console.warn('Button disabled state:', !canProceed)
      console.warn('Validation state:', isValid)
      return // Block progression
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      console.log(`✅ Proceeding from step ${currentStep} to ${currentStep + 1}`)
    } else {
      console.log('Cannot proceed - at last step')
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    const isValid = validateStep(currentStep)
    console.log(`Attempting to submit, validation: ${isValid}`)

    // Fail-safe validation - should never reach here if button is properly disabled
    if (!isValid) {
      console.warn('❌ CRITICAL: Submit button was clicked but validation failed! This should not happen.')
      console.warn('Button disabled state:', !canProceed)
      console.warn('Validation state:', isValid)
      return // Block submission
    }

    console.log('✅ Submitting stylist registration with valid data')
    await onSubmit(formData)
  }

  // Helper function to get error for a field (combines local and parent component errors)
  const getFieldError = (fieldName: string): string => {
    return localFieldErrors[fieldName] || fieldErrors[fieldName] || ''
  }

  // Helper function to get field styling based on validation state
  const getFieldClassName = (fieldName: string, baseClassName: string): string => {
    const error = getFieldError(fieldName)
    const hasValue = formData[fieldName as keyof StylistRegistrationData]

    if (error) {
      return `${baseClassName} border-red-300 bg-red-50 focus:ring-red-500 focus:border-red-500`
    } else if (touchedFields[fieldName] && hasValue) {
      return `${baseClassName} border-green-300 bg-green-50 focus:ring-green-500 focus:border-green-500`
    }

    return `${baseClassName} border-gray-300 focus:ring-pink-500 focus:border-transparent`
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-pink-600">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  className={getFieldClassName('firstName', 'w-full p-3 border rounded-full focus:ring-2 transition-colors')}
                  placeholder="First name"
                />
                {getFieldError('firstName') && (
                  <p className="text-red-600 text-sm mt-1">{getFieldError('firstName')}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-pink-600">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  onBlur={handleFieldBlur}
                  className={getFieldClassName('lastName', 'w-full p-3 border rounded-full focus:ring-2 transition-colors')}
                  placeholder="Last name"
                />
                {getFieldError('lastName') && (
                  <p className="text-red-600 text-sm mt-1">{getFieldError('lastName')}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-pink-600">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleFieldBlur}
                className={getFieldClassName('email', 'w-full p-3 border rounded-full focus:ring-2 transition-colors')}
                placeholder="your.email@example.com"
              />
              {getFieldError('email') && (
                <p className="text-red-600 text-sm mt-1">{getFieldError('email')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Phone <span className="text-pink-600">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                onBlur={handleFieldBlur}
                className={getFieldClassName('phone', 'w-full p-3 border rounded-full focus:ring-2 transition-colors')}
                placeholder="+52 555 123 4567"
              />
              {getFieldError('phone') && (
                <p className="text-red-600 text-sm mt-1">{getFieldError('phone')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-pink-600">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onBlur={handleFieldBlur}
                className={getFieldClassName('password', 'w-full p-3 border rounded-full focus:ring-2 transition-colors')}
                placeholder="Create a secure password"
              />
              {getFieldError('password') && (
                <p className="text-red-600 text-sm mt-1">{getFieldError('password')}</p>
              )}
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                className="mt-1 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
              />
              <label className="text-sm text-gray-700">
                I agree to the{' '}
                <a href="/terms/stylist" target="_blank" className="text-pink-600 hover:text-pink-700 hover:underline font-medium">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="/terms/client" target="_blank" className="text-pink-600 hover:text-pink-700 hover:underline font-medium">
                  Client Terms
                </a>
              </label>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name <span className="text-pink-600">*</span>
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                onBlur={handleFieldBlur}
                className={getFieldClassName('businessName', 'w-full p-3 border rounded-full focus:ring-2 transition-colors')}
                placeholder="Your business or professional name"
              />
              {getFieldError('businessName') && (
                <p className="text-red-600 text-sm mt-1">{getFieldError('businessName')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience <span className="text-pink-600">*</span>
              </label>
              <select
                name="experienceYears"
                value={formData.experienceYears}
                onChange={handleInputChange}
                onBlur={handleFieldBlur}
                className={getFieldClassName('experienceYears', 'w-full p-3 border rounded-full focus:ring-2 transition-colors')}
              >
                <option value={0}>Select years of experience</option>
                <option value={1}>1 year</option>
                <option value={2}>2 years</option>
                <option value={3}>3 years</option>
                <option value={5}>5 years</option>
                <option value={7}>7+ years</option>
                <option value={10}>10+ years</option>
              </select>
              {getFieldError('experienceYears') && (
                <p className="text-red-600 text-sm mt-1">{getFieldError('experienceYears')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biography <span className="text-pink-600">*</span>
              </label>
              <textarea
                name="biography"
                value={formData.biography}
                onChange={handleInputChange}
                onBlur={handleFieldBlur}
                rows={4}
                className={getFieldClassName('biography', 'w-full p-3 border rounded-full focus:ring-2 transition-colors resize-none')}
                placeholder="Tell clients about yourself, your experience, and your unique style. What makes you special as a beauty professional?"
              />
              {getFieldError('biography') && (
                <p className="text-red-600 text-sm mt-1">{getFieldError('biography')}</p>
              )}
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Specialties <span className="text-pink-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableSpecialties.map((specialty) => (
                  <label key={specialty} className="flex items-center gap-2 p-2 border rounded-full hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.specialties.includes(specialty)}
                      onChange={() => handleSpecialtyToggle(specialty)}
                      className="text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    />
                    <span className="text-sm">{specialty}</span>
                  </label>
                ))}
              </div>
              {fieldErrors.specialties && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.specialties}</p>
              )}
            </div>

            {formData.specialties.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Service Pricing <span className="text-pink-600">*</span>
                </label>
                <div className="space-y-3">
                  {formData.specialties.map((service) => (
                    <div key={service} className="p-3 border rounded-full bg-gray-50">
                      <h4 className="font-medium text-gray-800 mb-2">{service}</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Price ($)</label>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={formData.pricing[service]?.price || ''}
                            onChange={(e) => handlePricingChange(service, 'price', e.target.value)}
                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-pink-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Duration (min)</label>
                          <input
                            type="number"
                            placeholder="60"
                            value={formData.pricing[service]?.duration || ''}
                            onChange={(e) => handlePricingChange(service, 'duration', e.target.value)}
                            className="w-full p-2 text-sm border rounded focus:ring-1 focus:ring-pink-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Address <span className="text-pink-600">*</span>
              </label>
              <div className="border border-gray-300 rounded-full p-3 bg-white">
                <LocationPicker
                  value={formData.locationAddress && formData.latitude && formData.longitude ? {
                    address: formData.locationAddress,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    city: formData.city,
                    state: formData.state
                  } : undefined}
                  onChange={(location) => {
                    setFormData({
                      ...formData,
                      locationAddress: location.address,
                      latitude: location.latitude,
                      longitude: location.longitude,
                      city: location.city || '',
                      state: location.state || ''
                    })
                  }}
                  error={getFieldError('locationAddress')}
                  apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}
                />
              </div>
              {getFieldError('locationAddress') && (
                <p className="text-red-600 text-sm mt-1">{getFieldError('locationAddress')}</p>
              )}
            </div>

            <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-3xl">
              <h4 className="font-medium text-gray-800 mb-2">🎉 Almost done!</h4>
              <p className="text-sm text-gray-600">
                You're ready to create your stylist profile. We'll set up your account and you can complete your profile with photos and portfolio later.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              Create Stylist Account
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    currentStep > step.number
                      ? 'bg-green-500 text-white'
                      : currentStep === step.number
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {currentStep > step.number ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="text-xs mt-1 text-gray-600">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-colors ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {formError && (
            <motion.div
              className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-3xl text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {formError}
            </motion.div>
          )}

          {/* Validation Summary - show when user can't proceed */}
          {!canProceed && (
            <motion.div
              className="mt-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-3xl text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="font-medium mb-2">Please complete the following required fields:</p>
              <ul className="text-xs space-y-1">
                {currentStep === 1 && (
                  <>
                    {!formData.firstName?.trim() && <li>• First name is required</li>}
                    {!formData.lastName?.trim() && <li>• Last name is required</li>}
                    {!formData.email?.trim() && <li>• Email address is required</li>}
                    {!formData.phone?.trim() && <li>• Phone number is required</li>}
                    {!formData.password && <li>• Password is required (minimum 6 characters)</li>}
                    {!formData.agreeToTerms && <li>• You must agree to the Terms of Service</li>}
                  </>
                )}
                {currentStep === 2 && (
                  <>
                    {!formData.businessName?.trim() && <li>• Business name is required</li>}
                    {!formData.experienceYears && <li>• Years of experience is required</li>}
                    {!formData.biography?.trim() && <li>• Biography is required (minimum 10 characters)</li>}
                  </>
                )}
                {currentStep === 3 && (
                  <>
                    {!formData.specialties?.length && <li>• Please select at least one specialty</li>}
                    {formData.specialties?.length > 0 && !formData.specialties.every(service => {
                      const pricing = formData.pricing[service]
                      return pricing && pricing.price > 0 && pricing.duration > 0
                    }) && <li>• Please provide pricing for all selected services</li>}
                  </>
                )}
                {currentStep === 4 && (
                  <>
                    {!formData.locationAddress?.trim() && <li>• Business address is required</li>}
                    {formData.locationAddress?.trim() && (!formData.latitude || !formData.longitude) && <li>• Please select a location from the map</li>}
                  </>
                )}
              </ul>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
              currentStep === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <span className="text-sm text-gray-500">
            Step {currentStep} of {totalSteps}
          </span>

          {currentStep === totalSteps ? (
            <button
              onClick={handleSubmit}
              disabled={loading || !canProceed}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-colors ${
                loading || !canProceed
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg'
              }`}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
              <Sparkles className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={!canProceed}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-colors ${
                !canProceed
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-lg'
              }`}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default StylistRegistrationFlow