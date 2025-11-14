import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import {
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  BriefcaseIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  CreditCardIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import DataImportModal from '../../components/stylist/DataImportModal'

const API_URL = import.meta.env.VITE_API_URL || ''

const APPLICATION_STEPS = [
  {
    id: 'import',
    title: 'Import Your Data',
    description: 'Import from Fresha, Booksy, Square, or start fresh',
    icon: CloudArrowUpIcon,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'identity',
    title: 'Professional Identity',
    description: 'Tell us about your business',
    icon: BriefcaseIcon,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'location',
    title: 'Location & Service Area',
    description: 'Where do you operate?',
    icon: MapPinIcon,
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'services',
    title: 'Services & Pricing',
    description: 'What services do you offer?',
    icon: CurrencyDollarIcon,
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'portfolio',
    title: 'Portfolio & Social',
    description: 'Showcase your work',
    icon: PhotoIcon,
    gradient: 'from-pink-500 to-red-500',
  },
  {
    id: 'payment',
    title: 'Payment Setup',
    description: 'How you will get paid',
    icon: CreditCardIcon,
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    id: 'review',
    title: 'Review & Submit',
    description: 'Check everything before submitting',
    icon: DocumentTextIcon,
    gradient: 'from-emerald-500 to-teal-500',
  },
]

const STORAGE_KEY = 'beautycita-stylist-application'

interface ServiceItem {
  name: string
  description: string
  duration: number
  price: number
  category: string
}

export default function StylistApplicationPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<string[]>([])
  const [showImportModal, setShowImportModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1: Import decision
  const [importDecision, setImportDecision] = useState<'import' | 'manual' | null>(null)
  const [importedData, setImportedData] = useState<any>(null)

  // Step 2: Professional Identity
  const [identity, setIdentity] = useState({
    businessName: '',
    bio: '',
    specialties: [] as string[],
    yearsExperience: '',
    certifications: [] as string[]
  })

  // Step 3: Location
  const [location, setLocation] = useState({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    serviceRadius: 10,
    mobileService: false,
    homeStudio: false
  })

  // Step 4: Services
  const [services, setServices] = useState<ServiceItem[]>([])
  const [newService, setNewService] = useState<ServiceItem>({
    name: '',
    description: '',
    duration: 30,
    price: 0,
    category: 'Hair'
  })

  // Step 5: Portfolio
  const [portfolio, setPortfolio] = useState({
    images: [] as File[],
    imagePreviews: [] as string[],
    instagram: '',
    tiktok: '',
    website: ''
  })

  // Step 6: Payment
  const [payment, setPayment] = useState({
    method: '' as 'stripe' | 'btcpay' | '',
    stripeConnected: false,
    btcWalletRequested: false
  })

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setCurrentStep(data.currentStep || 0)
        setCompletedSteps(data.completedSteps || [])
        setImportDecision(data.importDecision)
        setIdentity(data.identity || identity)
        setLocation(data.location || location)
        setServices(data.services || [])
        setPortfolio(data.portfolio || portfolio)
        setPayment(data.payment || payment)
      } catch (error) {
        console.error('Failed to load saved application:', error)
      }
    }
  }, [])

  // Save progress
  useEffect(() => {
    const data = {
      currentStep,
      completedSteps,
      importDecision,
      identity,
      location,
      services,
      portfolio: {
        ...portfolio,
        images: [], // Don't save File objects
      },
      payment,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))

    // Update backend progress
    updateApplicationProgress()
  }, [currentStep, completedSteps])

  const updateApplicationProgress = async () => {
    try {
      const token = localStorage.getItem('authToken')
      await axios.post(
        `${API_URL}/api/stylist-application/progress`,
        {
          currentStep: currentStep + 1,
          progress: Math.round(((currentStep + 1) / APPLICATION_STEPS.length) * 100),
          status: 'in_progress'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    } catch (error) {
      // Silent fail - progress tracking is not critical
    }
  }

  const handleImportData = (data: any) => {
    setImportedData(data)

    // Auto-fill form fields from imported data
    if (data.businessName) {
      setIdentity(prev => ({ ...prev, businessName: data.businessName }))
    }
    if (data.bio) {
      setIdentity(prev => ({ ...prev, bio: data.bio }))
    }
    if (data.address) {
      setLocation(prev => ({ ...prev, ...data.address }))
    }
    if (data.services && Array.isArray(data.services)) {
      setServices(data.services)
    }

    toast.success('Data imported successfully! Review and edit as needed.')
    setShowImportModal(false)
    handleStepComplete('import')
  }

  const handleStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps(prev => [...prev, stepId])
    }
    goToNextStep()
  }

  const goToNextStep = () => {
    if (currentStep < APPLICATION_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleAddService = () => {
    if (!newService.name || newService.price <= 0) {
      toast.error('Please fill in service name and price')
      return
    }

    setServices(prev => [...prev, newService])
    setNewService({
      name: '',
      description: '',
      duration: 30,
      price: 0,
      category: 'Hair'
    })
    toast.success('Service added')
  }

  const handleRemoveService = (index: number) => {
    setServices(prev => prev.filter((_, i) => i !== index))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (portfolio.images.length + files.length > 6) {
      toast.error('Maximum 6 images allowed')
      return
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`)
        return false
      }
      return true
    })

    setPortfolio(prev => ({
      ...prev,
      images: [...prev.images, ...validFiles],
      imagePreviews: [
        ...prev.imagePreviews,
        ...validFiles.map(file => URL.createObjectURL(file))
      ]
    }))
  }

  const handleRemoveImage = (index: number) => {
    setPortfolio(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index)
    }))
  }

  const handleSubmitApplication = async () => {
    if (!identity.businessName || services.length === 0 || !payment.method) {
      toast.error('Please complete all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('authToken')
      const formData = new FormData()

      // Add text data
      formData.append('businessName', identity.businessName)
      formData.append('bio', identity.bio)
      formData.append('specialties', JSON.stringify(identity.specialties))
      formData.append('yearsExperience', identity.yearsExperience)
      formData.append('certifications', JSON.stringify(identity.certifications))
      formData.append('location', JSON.stringify(location))
      formData.append('services', JSON.stringify(services))
      formData.append('instagram', portfolio.instagram)
      formData.append('tiktok', portfolio.tiktok)
      formData.append('website', portfolio.website)
      formData.append('paymentMethod', payment.method)

      // Add portfolio images
      portfolio.images.forEach((file, index) => {
        formData.append(`portfolio_${index}`, file)
      })

      const response = await axios.post(
        `${API_URL}/api/stylist-application/submit`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        localStorage.removeItem(STORAGE_KEY)
        toast.success('Application submitted successfully!')
        navigate('/panel')
      }
    } catch (error: any) {
      console.error('Application submission error:', error)
      toast.error(error.response?.data?.message || 'Failed to submit application')
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = Math.round(((currentStep + 1) / APPLICATION_STEPS.length) * 100)
  const currentStepData = APPLICATION_STEPS[currentStep]
  const StepIcon = currentStepData.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Stylist Application</h1>
                <p className="text-sm text-gray-600">Join our network of beauty professionals</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/panel')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Save & Exit
            </button>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep + 1} of {APPLICATION_STEPS.length}
              </span>
              <span className="text-sm text-gray-600">{progress}% complete</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
          {APPLICATION_STEPS.map((step, index) => {
            const Icon = step.icon
            const isCompleted = completedSteps.includes(step.id)
            const isCurrent = index === currentStep
            const isPast = index < currentStep

            return (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isCompleted
                        ? 'bg-green-500'
                        : isCurrent
                        ? `bg-gradient-to-br ${step.gradient}`
                        : 'bg-gray-200'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircleIcon className="w-6 h-6 text-white" />
                    ) : (
                      <Icon className={`w-6 h-6 ${isCurrent || isPast ? 'text-white' : 'text-gray-400'}`} />
                    )}
                  </div>
                  <span className={`text-xs font-medium text-center ${isCurrent ? 'text-purple-600' : 'text-gray-500'} max-w-[80px]`}>
                    {step.title}
                  </span>
                </div>

                {index < APPLICATION_STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-12 mx-2 -mt-6 transition-colors ${
                      isPast || isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className={`w-20 h-20 bg-gradient-to-br ${currentStepData.gradient} rounded-full flex items-center justify-center mx-auto mb-4`}>
              <StepIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentStepData.title}</h2>
            <p className="text-gray-600">{currentStepData.description}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* STEP 1: Import Data */}
              {currentStepData.id === 'import' && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">How would you like to start?</h3>
                    <p className="text-gray-600">Import your existing data or start from scratch</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        setImportDecision('import')
                        setShowImportModal(true)
                      }}
                      className={`p-6 border-2 rounded-2xl transition-all text-left ${
                        importDecision === 'import'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <CloudArrowUpIcon className="w-12 h-12 text-purple-600 mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Import from Another Platform</h4>
                      <p className="text-sm text-gray-600">
                        We'll guide you through exporting from Fresha, Booksy, Square, or Vagaro
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        setImportDecision('manual')
                        handleStepComplete('import')
                      }}
                      className={`p-6 border-2 rounded-2xl transition-all text-left ${
                        importDecision === 'manual'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <DocumentTextIcon className="w-12 h-12 text-blue-600 mb-4" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Start from Scratch</h4>
                      <p className="text-sm text-gray-600">
                        Manually enter all your information (recommended for new businesses)
                      </p>
                    </button>
                  </div>

                  {importedData && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-sm text-green-900">
                        ✓ Data imported successfully! Continue to review and edit.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Professional Identity */}
              {currentStepData.id === 'identity' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      value={identity.businessName}
                      onChange={(e) => setIdentity({ ...identity, businessName: e.target.value })}
                      placeholder="e.g., Sofia's Hair Studio"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Professional Bio *
                    </label>
                    <textarea
                      value={identity.bio}
                      onChange={(e) => setIdentity({ ...identity, bio: e.target.value })}
                      placeholder="Tell clients about your experience, style, and what makes you unique..."
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">{identity.bio.length} / 500 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialties (select all that apply)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {['Hair Styling', 'Hair Color', 'Makeup', 'Nails', 'Skincare', 'Lashes', 'Brows', 'Waxing', 'Massage', 'Other'].map(
                        specialty => (
                          <button
                            key={specialty}
                            type="button"
                            onClick={() => {
                              setIdentity(prev => ({
                                ...prev,
                                specialties: prev.specialties.includes(specialty)
                                  ? prev.specialties.filter(s => s !== specialty)
                                  : [...prev.specialties, specialty]
                              }))
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              identity.specialties.includes(specialty)
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {specialty}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Years of Experience
                    </label>
                    <select
                      value={identity.yearsExperience}
                      onChange={(e) => setIdentity({ ...identity, yearsExperience: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    >
                      <option value="">Select...</option>
                      <option value="0-1">Less than 1 year</option>
                      <option value="1-3">1-3 years</option>
                      <option value="3-5">3-5 years</option>
                      <option value="5-10">5-10 years</option>
                      <option value="10+">10+ years</option>
                    </select>
                  </div>

                  <button
                    onClick={() => handleStepComplete('identity')}
                    disabled={!identity.businessName || !identity.bio}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>

                  {currentStep > 0 && (
                    <button
                      onClick={goToPreviousStep}
                      className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <ArrowLeftIcon className="w-5 h-5" />
                      Back
                    </button>
                  )}
                </div>
              )}

              {/* STEP 3: Location */}
              {currentStepData.id === 'location' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={location.address}
                      onChange={(e) => setLocation({ ...location, address: e.target.value })}
                      placeholder="123 Main St"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                      <input
                        type="text"
                        value={location.city}
                        onChange={(e) => setLocation({ ...location, city: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                      <input
                        type="text"
                        value={location.state}
                        onChange={(e) => setLocation({ ...location, state: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code *</label>
                      <input
                        type="text"
                        value={location.zipCode}
                        onChange={(e) => setLocation({ ...location, zipCode: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Radius (miles)
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={location.serviceRadius}
                      onChange={(e) => setLocation({ ...location, serviceRadius: Number(e.target.value) })}
                      className="w-full"
                    />
                    <p className="text-sm text-gray-600 mt-1">{location.serviceRadius} miles</p>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={location.mobileService}
                        onChange={(e) => setLocation({ ...location, mobileService: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-gray-700">I offer mobile services (travel to clients)</span>
                    </label>

                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={location.homeStudio}
                        onChange={(e) => setLocation({ ...location, homeStudio: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-gray-700">I have a home studio / salon</span>
                    </label>
                  </div>

                  <button
                    onClick={() => handleStepComplete('location')}
                    disabled={!location.address || !location.city || !location.state || !location.zipCode}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>

                  <button
                    onClick={goToPreviousStep}
                    className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                    Back
                  </button>
                </div>
              )}

              {/* STEP 4: Services */}
              {currentStepData.id === 'services' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold text-gray-900">Add a Service</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Service Name *</label>
                        <input
                          type="text"
                          value={newService.name}
                          onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                          placeholder="e.g., Women's Haircut"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                          value={newService.category}
                          onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        >
                          <option>Hair</option>
                          <option>Nails</option>
                          <option>Makeup</option>
                          <option>Skincare</option>
                          <option>Massage</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={newService.description}
                        onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Duration (min) *</label>
                        <input
                          type="number"
                          value={newService.duration}
                          onChange={(e) => setNewService({ ...newService, duration: Number(e.target.value) })}
                          min="15"
                          step="15"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price ($) *</label>
                        <input
                          type="number"
                          value={newService.price}
                          onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) })}
                          min="0"
                          step="5"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleAddService}
                      type="button"
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      + Add Service
                    </button>
                  </div>

                  {services.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Your Services ({services.length})</h3>
                      <div className="space-y-3">
                        {services.map((service, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{service.name}</h4>
                              <p className="text-sm text-gray-600">
                                {service.duration} min • ${service.price} • {service.category}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveService(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleStepComplete('services')}
                    disabled={services.length === 0}
                    className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>

                  <button
                    onClick={goToPreviousStep}
                    className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                    Back
                  </button>
                </div>
              )}

              {/* STEP 5: Portfolio */}
              {currentStepData.id === 'portfolio' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Portfolio Images (3-6 photos recommended)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                      id="portfolio-upload"
                    />
                    <label
                      htmlFor="portfolio-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-400 transition-colors"
                    >
                      <PhotoIcon className="w-12 h-12 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">Click to upload images (max 5MB each)</span>
                    </label>
                  </div>

                  {portfolio.imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                      {portfolio.imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img loading="lazy" src={preview} alt={`Portfolio ${index + 1}`} className="w-full h-32 object-cover rounded-xl" />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Instagram Handle</label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">@</span>
                        <input
                          type="text"
                          value={portfolio.instagram}
                          onChange={(e) => setPortfolio({ ...portfolio, instagram: e.target.value })}
                          placeholder="yourusername"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">TikTok Handle</label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">@</span>
                        <input
                          type="text"
                          value={portfolio.tiktok}
                          onChange={(e) => setPortfolio({ ...portfolio, tiktok: e.target.value })}
                          placeholder="yourusername"
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website (optional)</label>
                    <input
                      type="url"
                      value={portfolio.website}
                      onChange={(e) => setPortfolio({ ...portfolio, website: e.target.value })}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => handleStepComplete('portfolio')}
                    className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>

                  <button
                    onClick={goToPreviousStep}
                    className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                    Back
                  </button>
                </div>
              )}

              {/* STEP 6: Payment */}
              {currentStepData.id === 'payment' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <button
                      onClick={() => setPayment({ ...payment, method: 'stripe' })}
                      className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
                        payment.method === 'stripe'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Stripe</h3>
                      <p className="text-sm text-gray-600">Accept credit cards, debit cards, and digital wallets</p>
                    </button>

                    <button
                      onClick={() => setPayment({ ...payment, method: 'btcpay' })}
                      className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
                        payment.method === 'btcpay'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">BTCPay (Bitcoin)</h3>
                      <p className="text-sm text-gray-600">Accept Bitcoin payments directly</p>
                    </button>
                  </div>

                  <button
                    onClick={() => handleStepComplete('payment')}
                    disabled={!payment.method}
                    className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Continue
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>

                  <button
                    onClick={goToPreviousStep}
                    className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                    Back
                  </button>
                </div>
              )}

              {/* STEP 7: Review & Submit */}
              {currentStepData.id === 'review' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <ReviewSection title="Business Information">
                      <p><strong>Business Name:</strong> {identity.businessName}</p>
                      <p><strong>Specialties:</strong> {identity.specialties.join(', ') || 'None selected'}</p>
                      <p><strong>Experience:</strong> {identity.yearsExperience || 'Not specified'}</p>
                    </ReviewSection>

                    <ReviewSection title="Location">
                      <p>{location.address}</p>
                      <p>{location.city}, {location.state} {location.zipCode}</p>
                      <p><strong>Service Radius:</strong> {location.serviceRadius} miles</p>
                    </ReviewSection>

                    <ReviewSection title="Services">
                      <p><strong>{services.length} service(s) added</strong></p>
                      {services.slice(0, 3).map((s, i) => (
                        <p key={i} className="text-sm text-gray-600">• {s.name} - ${s.price}</p>
                      ))}
                    </ReviewSection>

                    <ReviewSection title="Payment Method">
                      <p>{payment.method === 'stripe' ? 'Stripe' : 'BTCPay (Bitcoin)'}</p>
                    </ReviewSection>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <p className="text-sm text-yellow-900">
                      ⚠️ Your application will be reviewed by our team. You'll receive an email within 2-3 business days.
                    </p>
                  </div>

                  <button
                    onClick={handleSubmitApplication}
                    disabled={isSubmitting}
                    className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application 🎉'}
                  </button>

                  <button
                    onClick={goToPreviousStep}
                    disabled={isSubmitting}
                    className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                    Back
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Data Import Modal */}
      <DataImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportData}
      />
    </div>
  )
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 bg-gray-50 rounded-xl">
      <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
      <div className="space-y-1 text-sm text-gray-700">{children}</div>
    </div>
  )
}
