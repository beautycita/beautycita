import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'

// Validation schemas with translation support
const createStep1Schema = (t: any) => z.object({
  firstName: z.string().min(2, t('forms.validation.firstName')),
  lastName: z.string().min(2, t('forms.validation.lastName')),
  email: z.string().email(t('forms.validation.email')),
  phone: z.string().min(10, t('forms.validation.phone')),
  password: z.string().min(6, t('forms.validation.password')),
})

const createStep2Schema = (t: any) => z.object({
  businessName: z.string().min(2, t('forms.validation.businessName')),
  experience: z.string().min(1, t('forms.validation.experience')),
  specialties: z.array(z.string()).min(1, t('forms.validation.specialties')),
  bio: z.string().optional(),
})

const createStep3Schema = (t: any) => z.object({
  locationAddress: z.string().min(1, t('forms.validation.location')),
  latitude: z.number().min(-90).max(90, t('forms.validation.latitude')),
  longitude: z.number().min(-180).max(180, t('forms.validation.longitude')),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
})

const createStep4Schema = (t: any) => z.object({
  instagramUrl: z.string().optional(),
  portfolioImages: z.array(z.instanceof(File)).optional(),
})

const createStep5Schema = (t: any) => z.object({
  acceptTerms: z.boolean().refine(val => val === true, t('forms.validation.terms')),
})

// Combined form data interface
export interface StylistRegistrationData {
  // Step 1 - Personal Info
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  countryCode: string

  // Step 2 - Professional Info
  businessName: string
  experience: string
  specialties: string[]
  bio: string

  // Step 3 - Location
  locationAddress: string
  latitude: number
  longitude: number
  locationCity: string
  locationState: string

  // Step 4 - Portfolio
  instagramUrl: string
  portfolioImages: File[]

  // Step 5 - Review
  acceptTerms: boolean
}

// Step completion status
interface StepCompletionStatus {
  step1: boolean
  step2: boolean
  step3: boolean
  step4: boolean
  step5: boolean
}

const STORAGE_KEY = 'beautycita_stylist_registration'
const STORAGE_COMPLETION_KEY = 'beautycita_stylist_completion'

const defaultFormData: StylistRegistrationData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  countryCode: 'MX',
  businessName: '',
  experience: '',
  specialties: [],
  bio: '',
  locationAddress: '',
  latitude: 0,
  longitude: 0,
  locationCity: '',
  locationState: '',
  instagramUrl: '',
  portfolioImages: [],
  acceptTerms: false,
}

const defaultCompletionStatus: StepCompletionStatus = {
  step1: false,
  step2: false,
  step3: false,
  step4: false,
  step5: false,
}

export function useStylistRegistration() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  const [formData, setFormData] = useState<StylistRegistrationData>(defaultFormData)
  const [completionStatus, setCompletionStatus] = useState<StepCompletionStatus>(defaultCompletionStatus)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  // Get current step from URL
  const getCurrentStep = useCallback((): number => {
    const match = location.pathname.match(/\/register\/stylist\/step\/(\d+)/)
    return match ? parseInt(match[1], 10) : 1
  }, [location.pathname])

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      const savedCompletion = localStorage.getItem(STORAGE_COMPLETION_KEY)

      if (savedData) {
        const parsedData = JSON.parse(savedData)
        setFormData(prev => ({ ...prev, ...parsedData }))
      }

      if (savedCompletion) {
        const parsedCompletion = JSON.parse(savedCompletion)
        setCompletionStatus(parsedCompletion)
      }
    } catch (error) {
      console.error('Error loading saved registration data:', error)
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STORAGE_COMPLETION_KEY)
    }
  }, [])

  // Save data to localStorage whenever formData changes
  useEffect(() => {
    try {
      // Don't save password or files to localStorage for security
      const dataToSave = { ...formData }
      delete dataToSave.password
      delete dataToSave.portfolioImages

      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
      localStorage.setItem(STORAGE_COMPLETION_KEY, JSON.stringify(completionStatus))
    } catch (error) {
      console.error('Error saving registration data:', error)
    }
  }, [formData, completionStatus])

  // Update form field
  const updateField = useCallback((field: keyof StylistRegistrationData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))

    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }, [fieldErrors])

  // Validate specific step
  const validateStep = useCallback((step: number): { isValid: boolean; errors: Record<string, string> } => {
    let schema: z.ZodSchema
    let dataToValidate: any

    switch (step) {
      case 1:
        schema = createStep1Schema(t)
        dataToValidate = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }
        break
      case 2:
        schema = createStep2Schema(t)
        dataToValidate = {
          businessName: formData.businessName,
          experience: formData.experience,
          specialties: formData.specialties,
          bio: formData.bio,
        }
        break
      case 3:
        schema = createStep3Schema(t)
        dataToValidate = {
          locationAddress: formData.locationAddress,
          latitude: formData.latitude,
          longitude: formData.longitude,
          locationCity: formData.locationCity,
          locationState: formData.locationState,
        }
        break
      case 4:
        schema = createStep4Schema(t)
        dataToValidate = {
          instagramUrl: formData.instagramUrl,
          portfolioImages: formData.portfolioImages,
        }
        break
      case 5:
        schema = createStep5Schema(t)
        dataToValidate = {
          acceptTerms: formData.acceptTerms,
        }
        break
      default:
        return { isValid: false, errors: { general: 'Invalid step' } }
    }

    try {
      schema.parse(dataToValidate)
      return { isValid: true, errors: {} }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            errors[err.path[0] as string] = err.message
          }
        })
        return { isValid: false, errors }
      }
      return { isValid: false, errors: { general: 'Validation error' } }
    }
  }, [formData, t])

  // Check if user can access a specific step
  const canAccessStep = useCallback((targetStep: number): boolean => {
    if (targetStep === 1) return true

    // User can access a step if all previous steps are completed
    for (let i = 1; i < targetStep; i++) {
      const stepKey = `step${i}` as keyof StepCompletionStatus
      if (!completionStatus[stepKey]) {
        return false
      }
    }

    return true
  }, [completionStatus])

  // Navigate to specific step
  const goToStep = useCallback((step: number, force = false) => {
    if (!force && !canAccessStep(step)) {
      // Redirect to the earliest incomplete step
      const earliestIncompleteStep = getEarliestIncompleteStep()
      navigate(`/register/stylist/step/${earliestIncompleteStep}`)
      return false
    }

    navigate(`/register/stylist/step/${step}`)
    return true
  }, [canAccessStep, navigate])

  // Get the earliest incomplete step
  const getEarliestIncompleteStep = useCallback((): number => {
    const stepOrder = [1, 2, 3, 4, 5]
    for (const step of stepOrder) {
      const stepKey = `step${step}` as keyof StepCompletionStatus
      if (!completionStatus[stepKey]) {
        return step
      }
    }
    return 5 // All steps complete
  }, [completionStatus])

  // Complete current step and move to next
  const completeCurrentStepAndNext = useCallback(() => {
    const currentStep = getCurrentStep()
    const validation = validateStep(currentStep)

    if (!validation.isValid) {
      setFieldErrors(validation.errors)
      return false
    }

    // Mark current step as complete
    const stepKey = `step${currentStep}` as keyof StepCompletionStatus
    setCompletionStatus(prev => ({
      ...prev,
      [stepKey]: true,
    }))

    // Move to next step if not on last step
    if (currentStep < 5) {
      navigate(`/register/stylist/step/${currentStep + 1}`)
    }

    setFieldErrors({})
    return true
  }, [getCurrentStep, validateStep, navigate])

  // Go to previous step
  const goToPreviousStep = useCallback(() => {
    const currentStep = getCurrentStep()
    if (currentStep > 1) {
      navigate(`/register/stylist/step/${currentStep - 1}`)
    }
  }, [getCurrentStep, navigate])

  // Clear all data and start over
  const resetRegistration = useCallback(() => {
    setFormData(defaultFormData)
    setCompletionStatus(defaultCompletionStatus)
    setFieldErrors({})
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_COMPLETION_KEY)
    navigate('/register/stylist/step/1')
  }, [navigate])

  // Get completion percentage
  const getCompletionPercentage = useCallback((): number => {
    const completedSteps = Object.values(completionStatus).filter(Boolean).length
    return Math.round((completedSteps / 5) * 100)
  }, [completionStatus])

  // Submit final registration
  const submitRegistration = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    // Validate all steps before submission
    for (let step = 1; step <= 5; step++) {
      const validation = validateStep(step)
      if (!validation.isValid) {
        setFieldErrors(validation.errors)
        goToStep(step)
        return { success: false, error: 'Please complete all required fields' }
      }
    }

    setIsLoading(true)

    try {
      // Create FormData for submission
      const formDataToSubmit = new FormData()

      // Add text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'portfolioImages' && value !== undefined) {
          if (Array.isArray(value)) {
            formDataToSubmit.append(key, JSON.stringify(value))
          } else {
            formDataToSubmit.append(key, value.toString())
          }
        }
      })

      // Add portfolio images
      formData.portfolioImages.forEach((file) => {
        formDataToSubmit.append('portfolioImages', file)
      })

      // Submit to API - using existing backend endpoint
      const response = await fetch('/api/auth/register-stylist', {
        method: 'POST',
        body: formDataToSubmit,
        credentials: 'include'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Registration failed')
      }

      // Clear stored data on success
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(STORAGE_COMPLETION_KEY)

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed' }
    } finally {
      setIsLoading(false)
    }
  }, [formData, validateStep, goToStep])

  return {
    // Data
    formData,
    completionStatus,
    fieldErrors,
    isLoading,

    // Current step info
    currentStep: getCurrentStep(),
    canAccessStep,
    getEarliestIncompleteStep,
    getCompletionPercentage,

    // Actions
    updateField,
    validateStep,
    goToStep,
    goToPreviousStep,
    completeCurrentStepAndNext,
    resetRegistration,
    submitRegistration,
  }
}