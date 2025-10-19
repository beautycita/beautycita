import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Model } from 'survey-core'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/authService'
import SurveyComponent from '../survey/SurveyComponent'
import { stylistOnboardingSurveyJson } from '../../config/stylistOnboardingSurvey'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const STORAGE_KEY = 'beautycita-stylist-onboarding-survey-data'

interface StylistOnboardingWizardSurveyProps {
  onComplete: () => void
  onExit?: () => void
}

export default function StylistOnboardingWizardSurvey({
  onComplete,
  onExit
}: StylistOnboardingWizardSurveyProps) {
  const { user, stylist } = useAuthStore()
  const navigate = useNavigate()
  const [initialData, setInitialData] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load saved progress and existing stylist data
  useEffect(() => {
    const loadInitialData = () => {
      // First, try to load from localStorage
      const savedData = localStorage.getItem(STORAGE_KEY)
      let data: any = {}

      if (savedData) {
        try {
          data = JSON.parse(savedData)
          console.log('[STYLIST_ONBOARDING_SURVEY] Loaded saved data:', data)
        } catch (error) {
          console.error('[STYLIST_ONBOARDING_SURVEY] Failed to parse saved data:', error)
        }
      }

      // Merge with existing stylist data if available
      if (stylist) {
        data = {
          businessName: stylist.business_name || data.businessName || '',
          bio: stylist.bio || data.bio || '',
          specialties: stylist.specialties || data.specialties || [],
          experience: stylist.experience_years || data.experience,
          locationAddress: stylist.location_address || data.locationAddress || '',
          locationCity: stylist.location_city || data.locationCity || '',
          locationState: stylist.location_state || data.locationState || '',
          serviceRadius: data.serviceRadius || 10,
          mobileServices: data.mobileServices || false,
          instagramUrl: data.instagramUrl || '',
          tiktokUrl: data.tiktokUrl || '',
          ...data
        }
      }

      setInitialData(data)
    }

    loadInitialData()
  }, [stylist])

  // Auto-save progress
  const handleValueChanged = (survey: Model) => {
    const data = survey.data
    console.log('[STYLIST_ONBOARDING_SURVEY] Saving progress:', data)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  // Handle page changes for logging
  const handlePageChanged = (survey: Model) => {
    console.log('[STYLIST_ONBOARDING_SURVEY] Page changed to:', survey.currentPage?.name)
  }

  // Handle survey completion
  const handleComplete = async (survey: Model) => {
    const formData = survey.data
    console.log('[STYLIST_ONBOARDING_SURVEY] Survey completed with data:', formData)

    setIsSubmitting(true)

    try {
      // Prepare the submission data
      const submissionData: any = {
        business_name: formData.businessName,
        bio: formData.bio,
        specialties: formData.specialties,
        experience_years: formData.experience,
        location_address: formData.locationAddress,
        location_city: formData.locationCity,
        location_state: formData.locationState,
        service_radius: formData.serviceRadius,
        mobile_services: formData.mobileServices,
        instagram_url: formData.instagramUrl || null,
        tiktok_url: formData.tiktokUrl || null
      }

      // Submit stylist profile data
      const token = localStorage.getItem('beautycita-auth')
        ? JSON.parse(localStorage.getItem('beautycita-auth')!).state.token
        : ''

      console.log('[STYLIST_ONBOARDING_SURVEY] Submitting profile data...')
      const profileResponse = await fetch(`${API_URL}/api/stylist/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(submissionData)
      })

      if (!profileResponse.ok) {
        const error = await profileResponse.json()
        throw new Error(error.message || 'Failed to save profile')
      }

      // Upload portfolio images if any
      if (formData.portfolioImages && formData.portfolioImages.length > 0) {
        console.log('[STYLIST_ONBOARDING_SURVEY] Uploading portfolio images...')

        const portfolioFormData = new FormData()
        formData.portfolioImages.forEach((fileObj: any) => {
          // SurveyJS stores file objects with 'file' property
          const file = fileObj.file || fileObj
          if (file instanceof File) {
            portfolioFormData.append('images', file)
          }
        })

        const portfolioResponse = await fetch(`${API_URL}/api/stylist/portfolio/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: portfolioFormData
        })

        if (!portfolioResponse.ok) {
          console.error('[STYLIST_ONBOARDING_SURVEY] Portfolio upload failed')
          toast.error('Profile saved but portfolio upload failed. Please upload images later.')
        } else {
          console.log('[STYLIST_ONBOARDING_SURVEY] Portfolio images uploaded successfully')
        }
      }

      // Clear saved data
      localStorage.removeItem(STORAGE_KEY)

      toast.success('Profile submitted for approval! 🎉')
      console.log('[STYLIST_ONBOARDING_SURVEY] Onboarding completed successfully')

      // Call the onComplete callback
      onComplete()

      // Navigate to payment setup or dashboard
      // Uncomment this if you want automatic navigation
      // navigate('/dashboard/payment-setup')
    } catch (error: any) {
      console.error('[STYLIST_ONBOARDING_SURVEY] Submission error:', error)
      toast.error(error.message || 'Failed to submit profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle exit/save for later
  const handleExitClick = () => {
    toast.success('Progress saved! You can continue later.')
    if (onExit) {
      onExit()
    } else {
      navigate('/dashboard')
    }
  }

  if (!initialData) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stylist Onboarding</h1>
          <p className="text-gray-600 mt-1">Complete your professional profile</p>
        </div>
        {onExit && (
          <button
            type="button"
            onClick={handleExitClick}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Save & Exit
          </button>
        )}
      </div>

      {/* Survey */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {isSubmitting ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-900">Submitting your profile...</p>
            <p className="text-sm text-gray-600 mt-2">Please wait while we process your information</p>
          </div>
        ) : (
          <SurveyComponent
            surveyJson={stylistOnboardingSurveyJson}
            initialData={initialData}
            onComplete={handleComplete}
            onValueChanged={handleValueChanged}
            onCurrentPageChanged={handlePageChanged}
          />
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> Your progress is automatically saved. You can safely exit and continue later
          if needed. After completing this wizard, you'll be guided through payment setup for both Stripe
          and Bitcoin.
        </p>
      </div>
    </div>
  )
}
