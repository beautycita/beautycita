import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { motion } from 'framer-motion'
import {
  UserIcon,
  MapPinIcon,
  ClockIcon,
  ScissorsIcon,
  PhotoIcon,
  CheckCircleIcon,
  SparklesIcon,
  XMarkIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import axios from 'axios'
import LocationPicker from '../../components/ui/LocationPicker'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Validation schemas for each step
const step1Schema = Yup.object({
  businessName: Yup.string()
    .min(3, 'Business name must be at least 3 characters')
    .max(100, 'Business name must be less than 100 characters')
    .required('Business name is required'),
  bio: Yup.string()
    .min(50, 'Bio must be at least 50 characters')
    .max(500, 'Bio must be less than 500 characters')
    .required('Bio is required'),
  experience: Yup.number()
    .min(1, 'Please select your experience')
    .required('Experience is required'),
  specialties: Yup.array()
    .min(1, 'Select at least one specialty')
    .required('At least one specialty is required')
})

const step2Schema = Yup.object({
  locationAddress: Yup.string()
    .min(5, 'Address must be at least 5 characters')
    .required('Business address is required'),
  locationCity: Yup.string().required('City is required'),
  locationState: Yup.string().required('State is required'),
  latitude: Yup.number().required('Location coordinates required'),
  longitude: Yup.number().required('Location coordinates required'),
  serviceRadius: Yup.number()
    .min(1, 'Service radius must be at least 1km')
    .max(50, 'Service radius cannot exceed 50km')
    .required('Service radius is required'),
  mobileServices: Yup.boolean()
})

const step3Schema = Yup.object({
  workingHours: Yup.object().required('Working hours are required')
})

const step4Schema = Yup.object({
  selectedServices: Yup.array()
    .min(3, 'Select at least 3 services')
    .required('Services are required')
})

const step5Schema = Yup.object({
  portfolioImages: Yup.array()
    .min(3, 'Upload at least 3 portfolio images')
    .max(6, 'Maximum 6 images allowed')
    .required('Portfolio images are required'),
  instagramUrl: Yup.string().url('Invalid Instagram URL').nullable(),
  tiktokUrl: Yup.string().url('Invalid TikTok URL').nullable()
})

const SPECIALTY_OPTIONS = [
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

const SCHEDULE_TEMPLATES = [
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
    name: 'Flexible',
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

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' }
]

export default function FormikStylistOnboarding() {
  const { user, updateProfile } = useAuthStore()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([])
  const [serviceTemplates, setServiceTemplates] = useState<any[]>([])
  const [loadingServices, setLoadingServices] = useState(false)

  // Redirect if already a stylist
  useEffect(() => {
    if (user?.role === 'STYLIST') {
      toast('You are already registered as a stylist', { icon: 'ℹ️' })
      navigate('/panel', { replace: true })
    }
  }, [user, navigate])

  const initialValues = {
    businessName: '',
    bio: '',
    experience: 0,
    specialties: [] as string[],
    locationAddress: '',
    locationCity: '',
    locationState: '',
    latitude: 0,
    longitude: 0,
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
    selectedServices: [] as any[],
    portfolioImages: [] as File[],
    instagramUrl: '',
    tiktokUrl: ''
  }

  // Fetch service templates
  useEffect(() => {
    const fetchServiceTemplates = async () => {
      setLoadingServices(true)
      try {
        const token = localStorage.getItem('beautycita-auth')
          ? JSON.parse(localStorage.getItem('beautycita-auth')!).state.token
          : ''

        const response = await axios.get(`${API_URL}/api/services/templates/browse`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        setServiceTemplates(response.data.data || [])
      } catch (error) {
        console.error('Failed to fetch service templates:', error)
        toast.error(t('stylistOnboarding.services.errorLoading'))
      } finally {
        setLoadingServices(false)
      }
    }

    if (currentStep === 4) {
      fetchServiceTemplates()
    }
  }, [currentStep, t])

  const handleSubmit = async (values: typeof initialValues) => {
    console.log('[STYLIST_ONBOARDING] Final submit:', values)

    const token = localStorage.getItem('beautycita-auth')
      ? JSON.parse(localStorage.getItem('beautycita-auth')!).state.token
      : ''

    try {
      // 1. Create stylist profile (backend will handle adding STYLIST role while preserving CLIENT)
      console.log('[STYLIST_ONBOARDING] Creating stylist profile...')
      const profileData = {
        business_name: values.businessName,
        bio: values.bio,
        specialties: values.specialties,
        experience_years: values.experience,
        location_address: values.locationAddress,
        location_city: values.locationCity,
        location_state: values.locationState,
        latitude: values.latitude,
        longitude: values.longitude,
        service_radius: values.serviceRadius,
        mobile_services: values.mobileServices,
        working_hours: values.workingHours,
        instagram_url: values.instagramUrl || null,
        tiktok_url: values.tiktokUrl || null
      }

      await axios.post(`${API_URL}/api/stylist/upgrade`, profileData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      console.log('[STYLIST_ONBOARDING] Profile created successfully')

      // 2. Upload portfolio images
      if (values.portfolioImages && values.portfolioImages.length > 0) {
        console.log('[STYLIST_ONBOARDING] Uploading portfolio images...')

        const portfolioFormData = new FormData()
        values.portfolioImages.forEach((file: File) => {
          portfolioFormData.append('images', file)
        })

        await axios.post(`${API_URL}/api/stylist/portfolio/upload`, portfolioFormData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        console.log('[STYLIST_ONBOARDING] Portfolio images uploaded successfully')
      }

      // 3. Create services
      if (values.selectedServices && values.selectedServices.length > 0) {
        console.log('[STYLIST_ONBOARDING] Creating services...')

        for (const service of values.selectedServices) {
          await axios.post(
            `${API_URL}/api/services/from-template/${service.templateId}`,
            {
              price_min: service.price_min,
              price_max: service.price_max,
              duration_minutes: service.duration_minutes
            },
            {
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              }
            }
          )
        }

        console.log('[STYLIST_ONBOARDING] Services created successfully')
      }

      toast.success(t('stylistOnboarding.complete.success'))

      // Redirect to panel with full page reload to refresh auth state
      window.location.href = '/panel'
    } catch (error: any) {
      console.error('[STYLIST_ONBOARDING] Error:', error)
      toast.error(error.response?.data?.message || t('stylistOnboarding.complete.error'))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center">
              <BuildingStorefrontIcon className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-serif font-bold bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">
              BeautyCita
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('stylistOnboarding.title')}</h1>
          <p className="text-gray-600">{t('stylistOnboarding.subtitle', { step: currentStep, total: 5 })}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-600"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / 5) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          <Formik
            initialValues={initialValues}
            validationSchema={
              currentStep === 1 ? step1Schema :
              currentStep === 2 ? step2Schema :
              currentStep === 3 ? step3Schema :
              currentStep === 4 ? step4Schema :
              step5Schema
            }
            onSubmit={handleSubmit}
            validateOnChange={true}
            validateOnBlur={true}
          >
            {({ values, errors, touched, setFieldValue, validateForm }) => (
              <Form>
                {/* STEP 1: Business Info */}
                {currentStep === 1 && (
                  <Step1BusinessInfo
                    values={values}
                    errors={errors}
                    setFieldValue={setFieldValue}
                    setCurrentStep={setCurrentStep}
                    validateForm={validateForm}
                    t={t}
                  />
                )}

                {/* STEP 2: Location */}
                {currentStep === 2 && (
                  <Step2Location
                    values={values}
                    errors={errors}
                    setFieldValue={setFieldValue}
                    setCurrentStep={setCurrentStep}
                    validateForm={validateForm}
                    t={t}
                  />
                )}

                {/* STEP 3: Working Hours */}
                {currentStep === 3 && (
                  <Step3WorkingHours
                    values={values}
                    setFieldValue={setFieldValue}
                    setCurrentStep={setCurrentStep}
                    t={t}
                  />
                )}

                {/* STEP 4: Services */}
                {currentStep === 4 && (
                  <Step4Services
                    values={values}
                    setFieldValue={setFieldValue}
                    setCurrentStep={setCurrentStep}
                    validateForm={validateForm}
                    serviceTemplates={serviceTemplates}
                    loadingServices={loadingServices}
                    t={t}
                  />
                )}

                {/* STEP 5: Portfolio */}
                {currentStep === 5 && (
                  <Step5Portfolio
                    values={values}
                    errors={errors}
                    setFieldValue={setFieldValue}
                    setCurrentStep={setCurrentStep}
                    portfolioPreviews={portfolioPreviews}
                    setPortfolioPreviews={setPortfolioPreviews}
                    t={t}
                  />
                )}
              </Form>
            )}
          </Formik>
        </div>
      </motion.div>
    </div>
  )
}

// ===== STEP 1: Business Info =====
function Step1BusinessInfo({ values, errors, setFieldValue, setCurrentStep, validateForm, t }: any) {
  const handleSpecialtyToggle = (specialty: string) => {
    const current = values.specialties || []
    const updated = current.includes(specialty)
      ? current.filter((s: string) => s !== specialty)
      : [...current, specialty]
    setFieldValue('specialties', updated)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <UserIcon className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          {t('stylistOnboarding.step1.title')}
        </h2>
        <p className="text-gray-600">{t('stylistOnboarding.step1.subtitle')}</p>
      </div>

      <div className="space-y-6">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('stylistOnboarding.step1.businessName')} *
          </label>
          <Field
            name="businessName"
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all"
            placeholder={t('stylistOnboarding.step1.businessNamePlaceholder')}
          />
          <ErrorMessage name="businessName" component="div" className="text-sm text-red-600 mt-1" />
        </div>

        {/* Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('stylistOnboarding.step1.experience')} *
          </label>
          <Field
            as="select"
            name="experience"
            className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all"
          >
            <option value="0">{t('stylistOnboarding.step1.selectExperience')}</option>
            <option value="1">{t('stylistOnboarding.step1.exp1')}</option>
            <option value="2">{t('stylistOnboarding.step1.exp2')}</option>
            <option value="3">{t('stylistOnboarding.step1.exp3')}</option>
            <option value="5">{t('stylistOnboarding.step1.exp5')}</option>
            <option value="10">{t('stylistOnboarding.step1.exp10')}</option>
          </Field>
          <ErrorMessage name="experience" component="div" className="text-sm text-red-600 mt-1" />
        </div>

        {/* Specialties */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('stylistOnboarding.step1.specialties')} *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SPECIALTY_OPTIONS.map((specialty) => (
              <label
                key={specialty}
                className={`flex items-center p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                  values.specialties?.includes(specialty)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={values.specialties?.includes(specialty) || false}
                  onChange={() => handleSpecialtyToggle(specialty)}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-gray-700">{specialty}</span>
              </label>
            ))}
          </div>
          <ErrorMessage name="specialties" component="div" className="text-sm text-red-600 mt-1" />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('stylistOnboarding.step1.bio')} *
          </label>
          <Field
            as="textarea"
            name="bio"
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all resize-none"
            placeholder={t('stylistOnboarding.step1.bioPlaceholder')}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">
              {values.bio?.length || 0} / 500
            </span>
            <ErrorMessage name="bio" component="span" className="text-sm text-red-600" />
          </div>
        </div>

        {/* Navigation */}
        <button
          type="button"
          onClick={async () => {
            const formErrors = await validateForm()
            if (!formErrors.businessName && !formErrors.bio && !formErrors.experience && !formErrors.specialties) {
              setCurrentStep(2)
            } else {
              toast.error(t('stylistOnboarding.fixErrors'))
            }
          }}
          disabled={!values.businessName || !values.bio || values.experience === 0 || values.specialties?.length === 0}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {t('stylistOnboarding.continue')} →
        </button>
      </div>
    </motion.div>
  )
}

// ===== STEP 2: Location =====
function Step2Location({ values, errors, setFieldValue, setCurrentStep, validateForm, t }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <MapPinIcon className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
          {t('stylistOnboarding.step2.title')}
        </h2>
        <p className="text-gray-600">{t('stylistOnboarding.step2.subtitle')}</p>
      </div>

      <div className="space-y-6">
        {/* Location Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('stylistOnboarding.step2.address')} *
          </label>
          <LocationPicker
            onLocationSelect={(location) => {
              setFieldValue('locationAddress', location.address)
              setFieldValue('locationCity', location.city)
              setFieldValue('locationState', location.state)
              setFieldValue('latitude', location.lat)
              setFieldValue('longitude', location.lng)
            }}
            placeholder={t('stylistOnboarding.step2.addressPlaceholder')}
          />
          <ErrorMessage name="locationAddress" component="div" className="text-sm text-red-600 mt-1" />
        </div>

        {/* Service Radius */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('stylistOnboarding.step2.radius')}
          </label>
          <Field
            name="serviceRadius"
            type="number"
            min="1"
            max="50"
            className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all"
            placeholder="10"
          />
          <p className="mt-1 text-xs text-gray-500">
            {t('stylistOnboarding.step2.radiusHelp')}
          </p>
        </div>

        {/* Mobile Services */}
        <div>
          <label className="flex items-center space-x-3 cursor-pointer p-4 bg-purple-50 rounded-2xl border-2 border-purple-200">
            <Field
              name="mobileServices"
              type="checkbox"
              className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <div>
              <span className="text-sm font-medium text-gray-700">
                {t('stylistOnboarding.step2.mobileServices')}
              </span>
              <p className="text-xs text-gray-500">
                {t('stylistOnboarding.step2.mobileServicesHelp')}
              </p>
            </div>
          </label>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-3xl hover:bg-gray-50 transition-all duration-200"
          >
            ← {t('stylistOnboarding.back')}
          </button>
          <button
            type="button"
            onClick={async () => {
              const formErrors = await validateForm()
              if (!formErrors.locationAddress && !formErrors.serviceRadius) {
                setCurrentStep(3)
              } else {
                toast.error(t('stylistOnboarding.fixErrors'))
              }
            }}
            disabled={!values.locationAddress || !values.latitude}
            className="flex-1 bg-gradient-to-r from-pink-600 to-red-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {t('stylistOnboarding.continue')} →
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ===== STEP 3: Working Hours =====
function Step3WorkingHours({ values, setFieldValue, setCurrentStep, t }: any) {
  const applyTemplate = (template: any) => {
    setFieldValue('workingHours', template.hours)
    toast.success(t('stylistOnboarding.step3.templateApplied', { name: template.name }))
  }

  const toggleDay = (day: string) => {
    setFieldValue(`workingHours.${day}.enabled`, !values.workingHours[day]?.enabled)
  }

  const updateTime = (day: string, field: 'start' | 'end', value: string) => {
    setFieldValue(`workingHours.${day}.${field}`, value)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <ClockIcon className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
          {t('stylistOnboarding.step3.title')}
        </h2>
        <p className="text-gray-600">{t('stylistOnboarding.step3.subtitle')}</p>
      </div>

      <div className="space-y-6">
        {/* Quick Templates */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-3xl p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">{t('stylistOnboarding.step3.templates')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SCHEDULE_TEMPLATES.map((template) => (
              <button
                key={template.name}
                type="button"
                onClick={() => applyTemplate(template)}
                className="p-3 bg-white border-2 border-cyan-200 rounded-2xl hover:border-cyan-400 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{template.icon}</span>
                  <span className="font-semibold text-sm text-gray-900">{template.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day.key}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl"
            >
              <input
                type="checkbox"
                checked={values.workingHours[day.key]?.enabled || false}
                onChange={() => toggleDay(day.key)}
                className="h-5 w-5 text-cyan-600 rounded focus:ring-cyan-500"
              />
              <div className="w-28 font-medium text-gray-900">{day.label}</div>
              {values.workingHours[day.key]?.enabled ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={values.workingHours[day.key]?.start || '09:00'}
                    onChange={(e) => updateTime(day.key, 'start', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="time"
                    value={values.workingHours[day.key]?.end || '17:00'}
                    onChange={(e) => updateTime(day.key, 'end', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              ) : (
                <span className="text-gray-500 italic">{t('stylistOnboarding.step3.closed')}</span>
              )}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-3xl hover:bg-gray-50 transition-all duration-200"
          >
            ← {t('stylistOnboarding.back')}
          </button>
          <button
            type="button"
            onClick={() => setCurrentStep(4)}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            {t('stylistOnboarding.continue')} →
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ===== STEP 4: Services =====
function Step4Services({ values, setFieldValue, setCurrentStep, validateForm, serviceTemplates, loadingServices, t }: any) {
  const [activeCategory, setActiveCategory] = useState<string>('all')

  const categories = ['all', ...Array.from(new Set(serviceTemplates.map((t: any) => t.category)))]

  const filteredTemplates = activeCategory === 'all'
    ? serviceTemplates
    : serviceTemplates.filter((t: any) => t.category === activeCategory)

  const toggleService = (template: any) => {
    const exists = values.selectedServices.find((s: any) => s.templateId === template.id)

    if (exists) {
      setFieldValue('selectedServices', values.selectedServices.filter((s: any) => s.templateId !== template.id))
    } else {
      setFieldValue('selectedServices', [...values.selectedServices, {
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
    setFieldValue('selectedServices', values.selectedServices.map((s: any) =>
      s.templateId === templateId ? { ...s, [field]: value } : s
    ))
  }

  const updateServiceDuration = (templateId: number, value: number) => {
    setFieldValue('selectedServices', values.selectedServices.map((s: any) =>
      s.templateId === templateId ? { ...s, duration_minutes: value } : s
    ))
  }

  if (loadingServices) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <ScissorsIcon className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          {t('stylistOnboarding.step4.title')}
        </h2>
        <p className="text-gray-600">{t('stylistOnboarding.step4.subtitle')}</p>
      </div>

      <div className="space-y-6">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat: string) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-2xl font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? t('stylistOnboarding.step4.all') : cat}
            </button>
          ))}
        </div>

        {/* Service Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
          {filteredTemplates.map((template: any) => {
            const isSelected = values.selectedServices.find((s: any) => s.templateId === template.id)

            return (
              <div
                key={template.id}
                className={`border-2 rounded-2xl p-4 cursor-pointer transition-all ${
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
        {values.selectedServices.length > 0 && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('stylistOnboarding.step4.selected', { count: values.selectedServices.length })}
            </h3>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {values.selectedServices.map((service: any) => (
                <div key={service.templateId} className="bg-gray-50 rounded-2xl p-4">
                  <h4 className="font-medium text-gray-900 mb-3">{service.name}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('stylistOnboarding.step4.priceMin')}
                      </label>
                      <input
                        type="number"
                        value={service.price_min}
                        onChange={(e) => updateServicePrice(service.templateId, 'price_min', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-2xl text-sm"
                        min="0"
                        step="50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('stylistOnboarding.step4.priceMax')}
                      </label>
                      <input
                        type="number"
                        value={service.price_max}
                        onChange={(e) => updateServicePrice(service.templateId, 'price_max', parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-2xl text-sm"
                        min="0"
                        step="50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('stylistOnboarding.step4.duration')}
                      </label>
                      <input
                        type="number"
                        value={service.duration_minutes}
                        onChange={(e) => updateServiceDuration(service.templateId, parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-2xl text-sm"
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

        {values.selectedServices.length < 3 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <p className="text-sm text-yellow-900">
              ⚠️ {t('stylistOnboarding.step4.minimum')}
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-3xl hover:bg-gray-50 transition-all duration-200"
          >
            ← {t('stylistOnboarding.back')}
          </button>
          <button
            type="button"
            onClick={async () => {
              const formErrors = await validateForm()
              if (!formErrors.selectedServices) {
                setCurrentStep(5)
              } else {
                toast.error(t('stylistOnboarding.step4.minimum'))
              }
            }}
            disabled={values.selectedServices.length < 3}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {t('stylistOnboarding.continue')} →
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ===== STEP 5: Portfolio =====
function Step5Portfolio({ values, errors, setFieldValue, setCurrentStep, portfolioPreviews, setPortfolioPreviews, t }: any) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const current = values.portfolioImages || []

    if (current.length + files.length > 6) {
      toast.error(t('stylistOnboarding.step5.maxImages'))
      return
    }

    // Validate file sizes
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('stylistOnboarding.step5.fileTooLarge', { name: file.name }))
        return
      }
    }

    setFieldValue('portfolioImages', [...current, ...files])

    // Create previews
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setPortfolioPreviews((prev: string[]) => [...prev, e.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })

    toast.success(t('stylistOnboarding.step5.imagesAdded', { count: files.length }))
    e.target.value = ''
  }

  const removePortfolioImage = (index: number) => {
    const current = values.portfolioImages || []
    setFieldValue('portfolioImages', current.filter((_: any, i: number) => i !== index))
    setPortfolioPreviews((prev: string[]) => prev.filter((_: any, i: number) => i !== index))
    toast.success(t('stylistOnboarding.step5.imageRemoved'))
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <PhotoIcon className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
          {t('stylistOnboarding.step5.title')}
        </h2>
        <p className="text-gray-600">{t('stylistOnboarding.step5.subtitle')}</p>
      </div>

      <div className="space-y-6">
        {/* Portfolio Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('stylistOnboarding.step5.images')} *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-3xl p-8 text-center hover:border-purple-400 transition-colors">
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
                {t('stylistOnboarding.step5.uploadText')}
              </p>
              <p className="text-xs text-gray-500">
                {t('stylistOnboarding.step5.uploadHelp')}
              </p>
            </label>
          </div>

          {/* Image Previews */}
          {portfolioPreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {portfolioPreviews.map((preview: string, index: number) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Portfolio ${index + 1}`}
                    className="w-full h-32 object-cover rounded-2xl"
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
            {portfolioPreviews.length} / 6 {t('stylistOnboarding.step5.imagesUploaded')}
            {portfolioPreviews.length < 3 && (
              <span className="text-orange-600 ml-2">
                ({t('stylistOnboarding.step5.needMinimum')})
              </span>
            )}
          </p>
          <ErrorMessage name="portfolioImages" component="div" className="text-sm text-red-600 mt-1" />
        </div>

        {/* Social Media */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('stylistOnboarding.step5.instagram')}
            </label>
            <Field
              name="instagramUrl"
              type="url"
              className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all"
              placeholder="https://instagram.com/yourusername"
            />
            <ErrorMessage name="instagramUrl" component="div" className="text-sm text-red-600 mt-1" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('stylistOnboarding.step5.tiktok')}
            </label>
            <Field
              name="tiktokUrl"
              type="url"
              className="w-full px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all"
              placeholder="https://tiktok.com/@yourusername"
            />
            <ErrorMessage name="tiktokUrl" component="div" className="text-sm text-red-600 mt-1" />
          </div>
        </div>

        {/* Payment Info Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">{t('stylistOnboarding.step5.nextSteps')}</h3>
          <p className="text-sm text-gray-700 mb-4">
            {t('stylistOnboarding.step5.paymentSetup')}
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">✓</span>
              <span>{t('stylistOnboarding.step5.paymentStep1')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">✓</span>
              <span>{t('stylistOnboarding.step5.paymentStep2')}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">✓</span>
              <span>{t('stylistOnboarding.step5.paymentStep3')}</span>
            </li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep(4)}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-3xl hover:bg-gray-50 transition-all duration-200"
          >
            ← {t('stylistOnboarding.back')}
          </button>
          <button
            type="submit"
            disabled={portfolioPreviews.length < 3}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            <CheckCircleIcon className="w-5 h-5" />
            {t('stylistOnboarding.complete.button')}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
