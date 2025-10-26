import { useState, useEffect } from 'react'
import StepWizard from 'react-step-wizard'
import { useForm, FormProvider } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { authService } from '../../services/authService'
import toast from 'react-hot-toast'
import {
  SparklesIcon,
  CheckCircleIcon,
  UserIcon,
  MapPinIcon,
  ScissorsIcon,
  PhotoIcon,
  CreditCardIcon,
  XMarkIcon,
  ClockIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import LocationPicker from '../ui/LocationPicker'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const STORAGE_KEY = 'beautycita-stylist-onboarding-progress'

interface OnboardingData {
  businessName: string
  bio: string
  specialties: string[]
  experience: number
  locationAddress: string
  locationCity: string
  locationState: string
  latitude: number
  longitude: number
  serviceRadius: number
  mobileServices: boolean
  workingHours: {
    [key: string]: { enabled: boolean; start: string; end: string }
  }
  selectedServices: any[]
  portfolioImages: File[]
  instagramUrl?: string
  tiktokUrl?: string
}

interface WizardProps {
  onComplete: () => void
  onExit?: () => void
}

export default function StylistOnboardingWizard({ onComplete, onExit }: WizardProps) {
  const { t } = useTranslation()
  const { user, stylist } = useAuthStore()
  const [wizardInstance, setWizardInstance] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([])

  const methods = useForm<OnboardingData>({
    mode: 'onChange',
    defaultValues: {
      businessName: stylist?.business_name || '',
      bio: stylist?.bio || '',
      specialties: stylist?.specialties || [],
      experience: stylist?.experience_years || 0,
      locationAddress: stylist?.location_address || '',
      locationCity: stylist?.location_city || '',
      locationState: stylist?.location_state || '',
      serviceRadius: 10,
      mobileServices: false,
      workingHours: {
        monday: { enabled: true, start: '09:00', end: '17:00' },
        tuesday: { enabled: true, start: '09:00', end: '17:00' },
        wednesday: { enabled: true, start: '09:00', end: '17:00' },
        thursday: { enabled: true, start: '09:00', end: '17:00' },
        friday: { enabled: true, start: '09:00', end: '17:00' },
        saturday: { enabled: false, start: '10:00', end: '14:00' },
        sunday: { enabled: false, start: '10:00', end: '14:00' }
      },
      selectedServices: [],
      portfolioImages: [],
      instagramUrl: '',
      tiktokUrl: ''
    }
  })

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = methods

  const watchedSpecialties = watch('specialties')
  const watchedPortfolioImages = watch('portfolioImages')

  const specialtyOptions = [
    'Hair Styling',
    'Hair Coloring',
    'Makeup',
    'Nails',
    'Skincare',
    'Massage',
    'Waxing',
    'Eyelashes',
    'Eyebrows',
    'Spa Treatments'
  ]

  const steps = [
    { number: 1, title: 'Professional Identity', icon: UserIcon, gradient: 'from-purple-500 to-pink-500' },
    { number: 2, title: 'Location & Service Area', icon: MapPinIcon, gradient: 'from-pink-500 to-red-500' },
    { number: 3, title: 'Working Hours & Availability', icon: ClockIcon, gradient: 'from-cyan-500 to-blue-500' },
    { number: 4, title: 'Services & Pricing', icon: ScissorsIcon, gradient: 'from-blue-500 to-purple-500' },
    { number: 5, title: 'Portfolio & Social', icon: PhotoIcon, gradient: 'from-green-500 to-emerald-500' },
    { number: 6, title: 'Payment Setup', icon: CreditCardIcon, gradient: 'from-orange-500 to-red-500' }
  ]

  // Load saved progress
  useEffect(() => {
    const savedProgress = localStorage.getItem(STORAGE_KEY)
    if (savedProgress) {
      try {
        const { step, completed, formData } = JSON.parse(savedProgress)
        console.log('[STYLIST_ONBOARDING] Loaded progress:', { step, completed })
        setCompletedSteps(completed || [])
        if (formData) {
          Object.keys(formData).forEach(key => {
            setValue(key as any, formData[key])
          })
        }
      } catch (error) {
        console.error('[STYLIST_ONBOARDING] Failed to load progress:', error)
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
    console.log('[STYLIST_ONBOARDING] Saved progress:', { step: currentStep, completed: completedSteps })
  }, [currentStep, completedSteps, getValues])

  const handleStepChange = (stats: any) => {
    console.log('[STYLIST_ONBOARDING] Step changed:', stats)
    setCurrentStep(stats.activeStep)
  }

  const handleStepComplete = (stepNumber: number) => {
    console.log('[STYLIST_ONBOARDING] ========== STEP COMPLETE ==========')
    console.log('[STYLIST_ONBOARDING] Completing step:', stepNumber)

    setCompletedSteps(prev => {
      if (!prev.includes(stepNumber)) {
        const newCompleted = [...prev, stepNumber]
        console.log('[STYLIST_ONBOARDING] Completed steps:', newCompleted)
        return newCompleted
      }
      return prev
    })

    if (wizardInstance) {
      console.log('[STYLIST_ONBOARDING] Calling nextStep()')
      wizardInstance.nextStep()
    }
  }

  const handleSpecialtyToggle = (specialty: string) => {
    const current = getValues('specialties') || []
    const updated = current.includes(specialty)
      ? current.filter(s => s !== specialty)
      : [...current, specialty]
    setValue('specialties', updated)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[STYLIST_ONBOARDING] File upload triggered')
    const files = Array.from(e.target.files || [])
    const current = getValues('portfolioImages') || []

    if (current.length + files.length > 6) {
      toast.error('Maximum 6 portfolio images allowed')
      return
    }

    console.log('[STYLIST_ONBOARDING] Uploading', files.length, 'files')
    setValue('portfolioImages', [...current, ...files])

    // Create previews
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setPortfolioPreviews(prev => [...prev, e.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })

    toast.success(`${files.length} image(s) added!`)
    e.target.value = ''
  }

  const removePortfolioImage = (index: number) => {
    const current = getValues('portfolioImages') || []
    setValue('portfolioImages', current.filter((_, i) => i !== index))
    setPortfolioPreviews(prev => prev.filter((_, i) => i !== index))
    toast.success('Image removed')
  }

  const onSubmit = async (data: OnboardingData) => {
    console.log('[STYLIST_ONBOARDING] 🎉 Submitting final form')
    console.log('[STYLIST_ONBOARDING] Form data:', data)

    try {
      const token = localStorage.getItem('beautycita-auth')
        ? JSON.parse(localStorage.getItem('beautycita-auth')!).state.token
        : ''

      // Submit stylist profile data
      console.log('[STYLIST_ONBOARDING] Saving profile...')
      const profileData = {
        business_name: data.businessName,
        bio: data.bio,
        specialties: data.specialties,
        experience_years: data.experience,
        location_address: data.locationAddress,
        location_city: data.locationCity,
        location_state: data.locationState,
        latitude: data.latitude,
        longitude: data.longitude,
        service_radius: data.serviceRadius,
        mobile_services: data.mobileServices,
        working_hours: data.workingHours,
        instagram_url: data.instagramUrl || null,
        tiktok_url: data.tiktokUrl || null
      }

      const profileResponse = await fetch(`${API_URL}/api/stylist/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      })

      if (!profileResponse.ok) {
        const error = await profileResponse.json()
        throw new Error(error.message || 'Failed to save profile')
      }

      console.log('[STYLIST_ONBOARDING] Profile saved successfully')

      // Upload portfolio images if any
      if (data.portfolioImages && data.portfolioImages.length > 0) {
        console.log('[STYLIST_ONBOARDING] Uploading portfolio images...')

        const portfolioFormData = new FormData()
        data.portfolioImages.forEach((file: File) => {
          portfolioFormData.append('images', file)
        })

        const portfolioResponse = await fetch(`${API_URL}/api/stylist/portfolio/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: portfolioFormData
        })

        if (!portfolioResponse.ok) {
          console.error('[STYLIST_ONBOARDING] Portfolio upload failed')
          toast.error('Profile saved but portfolio upload failed')
        } else {
          console.log('[STYLIST_ONBOARDING] Portfolio images uploaded successfully')
        }
      }

      // Create services via API
      if (data.selectedServices && data.selectedServices.length > 0) {
        console.log('[STYLIST_ONBOARDING] Creating services...')

        for (const service of data.selectedServices) {
          try {
            const response = await fetch(`${API_URL}/api/services/from-template/${service.templateId}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                price_min: service.price_min,
                price_max: service.price_max,
                duration_minutes: service.duration_minutes
              })
            })

            if (!response.ok) {
              console.error('[STYLIST_ONBOARDING] Failed to create service:', service.name)
            } else {
              console.log('[STYLIST_ONBOARDING] Created service:', service.name)
            }
          } catch (error) {
            console.error('[STYLIST_ONBOARDING] Error creating service:', error)
          }
        }

        console.log('[STYLIST_ONBOARDING] Services created successfully')
      }

      toast.success('Profile submitted for approval! 🎉')
      localStorage.removeItem(STORAGE_KEY)
      onComplete()
    } catch (error: any) {
      console.error('[STYLIST_ONBOARDING] Error submitting:', error)
      toast.error(error.message || 'Failed to submit profile. Please try again.')
    }
  }

  const currentStepData = steps[currentStep - 1]

  return (
    <FormProvider {...methods}>
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicators */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Stylist Onboarding</h2>
            {onExit && (
              <button
                type="button"
                onClick={onExit}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Save & Exit
              </button>
            )}
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
              specialtyOptions={specialtyOptions}
              watchedSpecialties={watchedSpecialties}
              handleSpecialtyToggle={handleSpecialtyToggle}
              onComplete={() => handleStepComplete(1)}
              register={register}
              errors={errors}
              watch={watch}
            />
            <Step2
              onComplete={() => handleStepComplete(2)}
              register={register}
              errors={errors}
              setValue={setValue}
            />
            <Step3
              onComplete={() => handleStepComplete(3)}
              watch={watch}
              setValue={setValue}
            />
            <Step4
              onComplete={() => handleStepComplete(4)}
              watchedSpecialties={watchedSpecialties}
              setValue={setValue}
              getValues={getValues}
            />
            <Step5
              onComplete={() => handleStepComplete(5)}
              register={register}
              errors={errors}
              handleFileUpload={handleFileUpload}
              removePortfolioImage={removePortfolioImage}
              portfolioPreviews={portfolioPreviews}
            />
            <Step6
              onComplete={handleSubmit(onSubmit)}
            />
          </StepWizard>
        </div>
      </div>
    </FormProvider>
  )
}

// STEP 1: Professional Identity
function Step1({ specialtyOptions, watchedSpecialties, handleSpecialtyToggle, onComplete, register, errors, watch }: any) {
  const { previousStep, nextStep } = (this as any).props

  const validateStep1 = () => {
    const businessName = watch('businessName')
    const experience = watch('experience')
    const specialties = watch('specialties')

    if (!businessName || !experience || specialties?.length === 0) {
      toast.error('Please fill in all required fields')
      return false
    }

    return true
  }

  const handleNext = () => {
    if (validateStep1()) {
      onComplete()
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <UserIcon className="h-12 w-12 text-purple-600 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900">Professional Identity</h2>
        <p className="text-gray-600 mt-1">Tell us about your beauty business</p>
      </div>

      {/* Business Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Name *
        </label>
        <input
          {...register('businessName', { required: 'Business name is required' })}
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
          placeholder="e.g., Sofia's Beauty Studio"
        />
        {errors.businessName && (
          <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
        )}
      </div>

      {/* Experience */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Years of Experience *
        </label>
        <select
          {...register('experience', { required: 'Experience is required' })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
        >
          <option value="">Select experience</option>
          <option value="1">Less than 1 year</option>
          <option value="2">1-2 years</option>
          <option value="3">3-5 years</option>
          <option value="5">5-10 years</option>
          <option value="10">10+ years</option>
        </select>
        {errors.experience && (
          <p className="mt-1 text-sm text-red-600">{errors.experience.message}</p>
        )}
      </div>

      {/* Specialties */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Specialties * (Select all that apply)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {specialtyOptions.map((specialty: string) => (
            <label
              key={specialty}
              className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                watchedSpecialties?.includes(specialty)
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-200'
              }`}
            >
              <input
                type="checkbox"
                checked={watchedSpecialties?.includes(specialty) || false}
                onChange={() => handleSpecialtyToggle(specialty)}
                className="sr-only"
              />
              <span className="text-sm font-medium text-gray-700">{specialty}</span>
            </label>
          ))}
        </div>
        {watchedSpecialties?.length === 0 && (
          <p className="mt-2 text-sm text-gray-500">Select at least one specialty</p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Professional Bio *
        </label>
        <textarea
          {...register('bio', {
            required: 'Bio is required',
            minLength: { value: 50, message: 'Bio must be at least 50 characters' }
          })}
          rows={5}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
          placeholder="Tell potential clients about your expertise, style, and what makes you unique..."
        />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">
            {watch('bio')?.length || 0} / 500 characters
          </span>
          {errors.bio && (
            <p className="text-sm text-red-600">{errors.bio.message}</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={handleNext}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
        >
          Next Step →
        </button>
      </div>
    </div>
  )
}

// STEP 2: Location
function Step2({ onComplete, register, errors, setValue }: any) {
  const { previousStep } = (this as any).props

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <MapPinIcon className="h-12 w-12 text-pink-600 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900">Location & Service Area</h2>
        <p className="text-gray-600 mt-1">Where do you provide services?</p>
      </div>

      {/* Location Picker */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Address *
        </label>
        <LocationPicker
          onLocationSelect={(location) => {
            setValue('locationAddress', location.address)
            setValue('locationCity', location.city)
            setValue('locationState', location.state)
            setValue('latitude', location.lat)
            setValue('longitude', location.lng)
          }}
          placeholder="Search for your business address..."
        />
        {errors.locationAddress && (
          <p className="mt-1 text-sm text-red-600">{errors.locationAddress.message}</p>
        )}
      </div>

      {/* Service Radius */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Service Radius (km)
        </label>
        <input
          {...register('serviceRadius')}
          type="number"
          min="1"
          max="50"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
          placeholder="10"
        />
        <p className="mt-1 text-xs text-gray-500">
          How far are you willing to travel for appointments?
        </p>
      </div>

      {/* Mobile Services */}
      <div>
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            {...register('mobileServices')}
            type="checkbox"
            className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">
              I offer mobile services
            </span>
            <p className="text-xs text-gray-500">
              I can travel to clients' locations
            </p>
          </div>
        </label>
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
          onClick={onComplete}
          className="px-6 py-3 bg-gradient-to-r from-pink-600 to-red-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
        >
          Next Step →
        </button>
      </div>
    </div>
  )
}

// STEP 3: Working Hours & Availability
function Step3({ onComplete, watch, setValue }: any) {
  const { previousStep } = (this as any).props
  const workingHours = watch('workingHours') || {}

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ]

  const scheduleTemplates = [
    {
      name: '9-5 Weekdays',
      icon: '💼',
      hours: {
        monday: { enabled: true, start: '09:00', end: '17:00' },
        tuesday: { enabled: true, start: '09:00', end: '17:00' },
        wednesday: { enabled: true, start: '09:00', end: '17:00' },
        thursday: { enabled: true, start: '09:00', end: '17:00' },
        friday: { enabled: true, start: '09:00', end: '17:00' },
        saturday: { enabled: false, start: '10:00', end: '14:00' },
        sunday: { enabled: false, start: '10:00', end: '14:00' }
      }
    },
    {
      name: 'Evenings & Weekends',
      icon: '🌙',
      hours: {
        monday: { enabled: false, start: '09:00', end: '17:00' },
        tuesday: { enabled: false, start: '09:00', end: '17:00' },
        wednesday: { enabled: false, start: '09:00', end: '17:00' },
        thursday: { enabled: true, start: '17:00', end: '21:00' },
        friday: { enabled: true, start: '17:00', end: '21:00' },
        saturday: { enabled: true, start: '10:00', end: '18:00' },
        sunday: { enabled: true, start: '10:00', end: '18:00' }
      }
    },
    {
      name: 'Flexible (All Week)',
      icon: '✨',
      hours: {
        monday: { enabled: true, start: '08:00', end: '20:00' },
        tuesday: { enabled: true, start: '08:00', end: '20:00' },
        wednesday: { enabled: true, start: '08:00', end: '20:00' },
        thursday: { enabled: true, start: '08:00', end: '20:00' },
        friday: { enabled: true, start: '08:00', end: '20:00' },
        saturday: { enabled: true, start: '09:00', end: '18:00' },
        sunday: { enabled: true, start: '09:00', end: '18:00' }
      }
    }
  ]

  const applyTemplate = (template: any) => {
    setValue('workingHours', template.hours)
    toast.success(`Applied ${template.name} schedule!`)
  }

  const toggleDay = (day: string) => {
    setValue(`workingHours.${day}.enabled`, !workingHours[day]?.enabled)
  }

  const updateTime = (day: string, field: 'start' | 'end', value: string) => {
    setValue(`workingHours.${day}.${field}`, value)
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <ClockIcon className="h-12 w-12 text-cyan-600 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900">When Are You Available?</h2>
        <p className="text-gray-600 mt-1">Set your base working hours</p>
      </div>

      {/* Quick Templates */}
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Quick Templates</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {scheduleTemplates.map((template) => (
            <button
              key={template.name}
              type="button"
              onClick={() => applyTemplate(template)}
              className="p-3 bg-white border-2 border-cyan-200 rounded-lg hover:border-cyan-400 hover:shadow-md transition-all text-left"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{template.icon}</span>
                <span className="font-semibold text-sm text-gray-900">{template.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="space-y-3">
        {daysOfWeek.map((day) => (
          <div
            key={day.key}
            className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
          >
            <input
              type="checkbox"
              checked={workingHours[day.key]?.enabled || false}
              onChange={() => toggleDay(day.key)}
              className="h-5 w-5 text-cyan-600 rounded focus:ring-cyan-500"
            />
            <div className="w-28 font-medium text-gray-900">{day.label}</div>
            {workingHours[day.key]?.enabled ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={workingHours[day.key]?.start || '09:00'}
                  onChange={(e) => updateTime(day.key, 'start', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="time"
                  value={workingHours[day.key]?.end || '17:00'}
                  onChange={(e) => updateTime(day.key, 'end', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
            ) : (
              <span className="text-gray-500 italic">Closed</span>
            )}
          </div>
        ))}
      </div>

      {/* What to Expect */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <CalendarDaysIcon className="h-8 w-8 text-green-600 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">What to Expect: Your First Booking</h3>
            <p className="text-sm text-gray-700 mb-4">Here's how bookings work on BeautyCita:</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">1</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Client books during your hours</p>
              <p className="text-xs text-gray-600">They can only book times you've marked as available</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">2</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">You get instant notification</p>
              <p className="text-xs text-gray-600">Via app, email, and SMS</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">3</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Accept or decline (up to you!)</p>
              <p className="text-xs text-gray-600">You have 30 minutes to respond</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">4</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Provide the service</p>
              <p className="text-xs text-gray-600">Meet client at scheduled time and location</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">5</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">Get paid automatically</p>
              <p className="text-xs text-gray-600">Payment transfers to your account within 2-3 business days</p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
          <p className="text-xs text-green-900">
            <strong>💡 Pro Tip:</strong> If you have the app open past your scheduled hours, you'll show as "Available Now" to clients looking for same-day bookings!
          </p>
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
          onClick={onComplete}
          className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
        >
          Next Step →
        </button>
      </div>
    </div>
  )
}

// STEP 4: Services
function Step4({ onComplete, watchedSpecialties, setValue, getValues }: any) {
  const { previousStep } = (this as any).props
  const [serviceTemplates, setServiceTemplates] = useState<any[]>([])
  const [selectedServices, setSelectedServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  useEffect(() => {
    fetchServiceTemplates()
    // Load previously selected services if any
    const saved = getValues('selectedServices')
    if (saved && saved.length > 0) {
      setSelectedServices(saved)
    }
  }, [])

  const fetchServiceTemplates = async () => {
    try {
      const token = localStorage.getItem('beautycita-auth')
        ? JSON.parse(localStorage.getItem('beautycita-auth')!).state.token
        : ''

      const response = await fetch(`${API_URL}/api/services/templates/browse`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setServiceTemplates(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch service templates:', error)
      toast.error('Failed to load service templates')
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', ...Array.from(new Set(serviceTemplates.map(t => t.category)))]

  const filteredTemplates = activeCategory === 'all'
    ? serviceTemplates
    : serviceTemplates.filter(t => t.category === activeCategory)

  const toggleService = (template: any) => {
    const exists = selectedServices.find(s => s.templateId === template.id)

    if (exists) {
      setSelectedServices(selectedServices.filter(s => s.templateId !== template.id))
    } else {
      setSelectedServices([...selectedServices, {
        templateId: template.id,
        name: template.name_es,
        category: template.category,
        price_min: template.typical_price_min,
        price_max: template.typical_price_max,
        duration_minutes: template.typical_duration_min
      }])
    }
  }

  const updateServicePrice = (templateId: number, field: string, value: number) => {
    setSelectedServices(selectedServices.map(s =>
      s.templateId === templateId ? { ...s, [field]: value } : s
    ))
  }

  const updateServiceDuration = (templateId: number, value: number) => {
    setSelectedServices(selectedServices.map(s =>
      s.templateId === templateId ? { ...s, duration_minutes: value } : s
    ))
  }

  const handleNext = async () => {
    if (selectedServices.length < 3) {
      toast.error('Please select at least 3 services')
      return
    }

    // Save selected services to form state
    setValue('selectedServices', selectedServices)
    console.log('[ONBOARDING] Saved services:', selectedServices)

    onComplete()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <ScissorsIcon className="h-12 w-12 text-blue-600 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900">Services & Pricing</h2>
        <p className="text-gray-600 mt-1">Select services you'll offer</p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat === 'all' ? 'Todos' : cat}
          </button>
        ))}
      </div>

      {/* Service Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
        {filteredTemplates.map(template => {
          const isSelected = selectedServices.find(s => s.templateId === template.id)

          return (
            <div
              key={template.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => toggleService(template)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{template.name_es}</h3>
                  <p className="text-sm text-gray-600">{template.category}</p>
                </div>
                <input
                  type="checkbox"
                  checked={!!isSelected}
                  onChange={() => {}}
                  className="h-5 w-5 text-blue-600 rounded"
                />
              </div>
              <div className="text-sm text-gray-700">
                <p>💰 ${template.typical_price_min} - ${template.typical_price_max}</p>
                <p>⏱️ {template.typical_duration_min}-{template.typical_duration_max} min</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Services Configuration */}
      {selectedServices.length > 0 && (
        <div className="mt-6 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Selected Services ({selectedServices.length})
          </h3>
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {selectedServices.map(service => (
              <div key={service.templateId} className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">{service.name}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Precio Mínimo (MXN)
                    </label>
                    <input
                      type="number"
                      value={service.price_min}
                      onChange={(e) => updateServicePrice(service.templateId, 'price_min', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min="0"
                      step="50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Precio Máximo (MXN)
                    </label>
                    <input
                      type="number"
                      value={service.price_max}
                      onChange={(e) => updateServicePrice(service.templateId, 'price_max', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min="0"
                      step="50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Duración (min)
                    </label>
                    <input
                      type="number"
                      value={service.duration_minutes}
                      onChange={(e) => updateServiceDuration(service.templateId, parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      min="15"
                      step="15"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedServices.length < 3 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-900">
            ⚠️ Selecciona al menos 3 servicios para continuar
          </p>
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
          onClick={handleNext}
          disabled={selectedServices.length < 3}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next Step →
        </button>
      </div>
    </div>
  )
}

// STEP 5: Portfolio
function Step5({ onComplete, register, errors, handleFileUpload, removePortfolioImage, portfolioPreviews }: any) {
  const { previousStep } = (this as any).props

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <PhotoIcon className="h-12 w-12 text-green-600 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900">Portfolio & Social Proof</h2>
        <p className="text-gray-600 mt-1">Showcase your best work</p>
      </div>

      {/* Portfolio Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Portfolio Images * (3-6 images)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="portfolio-upload"
          />
          <label htmlFor="portfolio-upload" className="cursor-pointer">
            <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-700 mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG up to 5MB each
            </p>
          </label>
        </div>

        {/* Image Previews */}
        {portfolioPreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {portfolioPreviews.map((preview: string, index: number) => (
              <div key={index} className="relative group">
                <img loading="lazy"
                  src={preview}
                  alt={`Portfolio ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePortfolioImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="mt-2 text-sm text-gray-600">
          {portfolioPreviews.length} / 6 images uploaded
          {portfolioPreviews.length < 3 && (
            <span className="text-orange-600 ml-2">
              (Need at least 3 images)
            </span>
          )}
        </p>
      </div>

      {/* Social Media */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instagram Profile (optional)
          </label>
          <input
            {...register('instagramUrl')}
            type="url"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            placeholder="https://instagram.com/yourusername"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            TikTok Profile (optional)
          </label>
          <input
            {...register('tiktokUrl')}
            type="url"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            placeholder="https://tiktok.com/@yourusername"
          />
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
          onClick={onComplete}
          disabled={portfolioPreviews.length < 3}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next Step →
        </button>
      </div>
    </div>
  )
}

// STEP 6: Payment Setup
function Step6({ onComplete }: any) {
  const { previousStep } = (this as any).props

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CreditCardIcon className="h-12 w-12 text-orange-600 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-gray-900">Payment Setup</h2>
        <p className="text-gray-600 mt-1">Set up payments to receive your earnings</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-900">
          ⚠️ <strong>Important:</strong> Both Stripe and Bitcoin payment verification are required
          before your profile can be approved.
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Stripe Connect</h3>
              <p className="text-sm text-gray-600 mt-1">
                Accept credit cards and receive instant payouts
              </p>
            </div>
            <CheckCircleIcon className="h-6 w-6 text-gray-300" />
          </div>
          <button
            type="button"
            className="w-full px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700"
            onClick={() => toast('Stripe setup will open after wizard completion')}
          >
            Set Up Stripe
          </button>
        </div>

        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Bitcoin / BTCPay</h3>
              <p className="text-sm text-gray-600 mt-1">
                Accept Bitcoin payments with zero fees
              </p>
            </div>
            <CheckCircleIcon className="h-6 w-6 text-gray-300" />
          </div>
          <button
            type="button"
            className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
            onClick={() => toast('Bitcoin setup will open after wizard completion')}
          >
            Set Up Bitcoin Wallet
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-blue-900">
          💡 <strong>Next Steps:</strong> After completing this wizard, you'll be guided through
          the payment setup process. Once both are verified, your profile will be submitted for approval.
        </p>
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
          onClick={onComplete}
          className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
        >
          Complete Setup 🎉
        </button>
      </div>
    </div>
  )
}
