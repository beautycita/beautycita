import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik'
import * as Yup from 'yup'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import {
  SparklesIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  ScissorsIcon,
  CameraIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import LocationPicker from '../../components/ui/LocationPicker'
import AphroditeAssistant from '../../components/ai/AphroditeAssistant'

const API_URL = import.meta.env.VITE_API_URL || ''

interface OnboardingData {
  // Step 1: Business Info
  businessName: string
  bio: string
  specialties: string[]
  experienceYears: number
  certifications: string[]

  // Step 2: Location
  locations: Array<{
    name: string
    type: string
    address: string
    city: string
    state: string
    zip: string
    latitude: number
    longitude: number
    isPrimary: boolean
    acceptsWalkins: boolean
    parkingAvailable: boolean
    wheelchairAccessible: boolean
  }>

  // Step 3: Services
  services: Array<{
    name: string
    description: string
    category: string
    customCategoryName?: string
    durationMinutes: number
    price: number
    priceType: string
  }>

  // Step 4: Portfolio
  portfolioImages: Array<{
    url: string
    caption: string
    category: string
  }>

  // Step 5: Availability
  workingHours: {
    monday: { enabled: boolean; start: string; end: string }
    tuesday: { enabled: boolean; start: string; end: string }
    wednesday: { enabled: boolean; start: string; end: string }
    thursday: { enabled: boolean; start: string; end: string }
    friday: { enabled: boolean; start: string; end: string }
    saturday: { enabled: boolean; start: string; end: string }
    sunday: { enabled: boolean; start: string; end: string }
  }

  // Step 6: Pricing Strategy
  pricingStrategy: string
  acceptsDeposits: boolean
  depositAmount: number
  cancellationPolicy: string
}

const initialValues: OnboardingData = {
  businessName: '',
  bio: '',
  specialties: [],
  experienceYears: 0,
  certifications: [],
  locations: [{
    name: '',
    type: 'salon',
    address: '',
    city: '',
    state: '',
    zip: '',
    latitude: 0,
    longitude: 0,
    isPrimary: true,
    acceptsWalkins: false,
    parkingAvailable: false,
    wheelchairAccessible: false
  }],
  services: [],
  portfolioImages: [],
  workingHours: {
    monday: { enabled: true, start: '09:00', end: '18:00' },
    tuesday: { enabled: true, start: '09:00', end: '18:00' },
    wednesday: { enabled: true, start: '09:00', end: '18:00' },
    thursday: { enabled: true, start: '09:00', end: '18:00' },
    friday: { enabled: true, start: '09:00', end: '18:00' },
    saturday: { enabled: true, start: '10:00', end: '16:00' },
    sunday: { enabled: false, start: '10:00', end: '16:00' }
  },
  pricingStrategy: 'competitive',
  acceptsDeposits: true,
  depositAmount: 20,
  cancellationPolicy: '24_hours'
}

// Validation schemas for each step
const step1Schema = Yup.object().shape({
  businessName: Yup.string().required('Business name is required').min(2, 'Too short'),
  bio: Yup.string().required('Bio is required').min(50, 'Please write at least 50 characters').max(500, 'Maximum 500 characters'),
  specialties: Yup.array().min(1, 'Select at least one specialty'),
  experienceYears: Yup.number().min(0, 'Must be 0 or greater').required('Required')
})

const step2Schema = Yup.object().shape({
  locations: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required('Location name required'),
      type: Yup.string().required('Location type required'),
      address: Yup.string().required('Address required'),
      city: Yup.string().required('City required'),
      state: Yup.string().required('State required').length(2, 'Use 2-letter state code'),
      zip: Yup.string().required('ZIP required')
    })
  ).min(1, 'Add at least one location')
})

const step3Schema = Yup.object().shape({
  services: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required('Service name required'),
      description: Yup.string().required('Description required'),
      category: Yup.string().required('Category required'),
      durationMinutes: Yup.number().min(15, 'Minimum 15 minutes').required('Duration required'),
      price: Yup.number().min(0, 'Price must be positive').required('Price required'),
      priceType: Yup.string().required('Price type required')
    })
  ).min(1, 'Add at least one service')
})

const step5Schema = Yup.object().shape({
  workingHours: Yup.object().test(
    'at-least-one-day',
    'You must work at least one day per week',
    (value: any) => {
      const daysEnabled = Object.values(value).filter((day: any) => day.enabled).length
      return daysEnabled >= 1
    }
  )
})

const step6Schema = Yup.object().shape({
  pricingStrategy: Yup.string().required('Select a pricing strategy'),
  depositAmount: Yup.number().when('acceptsDeposits', {
    is: true,
    then: (schema) => schema.min(1, 'Deposit must be at least $1').required('Deposit amount required')
  }),
  cancellationPolicy: Yup.string().required('Cancellation policy required')
})

const validationSchemas = [
  step1Schema,
  step2Schema,
  step3Schema,
  Yup.object(), // Step 4 - portfolio is optional
  step5Schema,
  step6Schema,
  Yup.object()  // Step 7 - review
]

const serviceCategories = [
  'Hair', 'Nails', 'Makeup', 'Skin Care', 'Massage',
  'Waxing', 'Eyelashes', 'Eyebrows', 'Tanning', 'Barbering',
  'Spa', 'Other'
]

const specialtyOptions = [
  'Hair Styling', 'Hair Coloring', 'Haircuts', 'Keratin Treatments',
  'Balayage', 'Highlights', 'Manicure', 'Pedicure', 'Gel Nails',
  'Acrylic Nails', 'Nail Art', 'Bridal Makeup', 'Special Event Makeup',
  'Everyday Makeup', 'Facials', 'Microdermabrasion', 'Chemical Peels',
  'Massage Therapy', 'Waxing', 'Lash Extensions', 'Microblading',
  'Brow Tinting', 'Spray Tanning', 'Beard Trimming', 'Hot Towel Shave'
]

export default function StylistOnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [showAphrodite, setShowAphrodite] = useState(false)
  const [aphroditeContext, setAphroditeContext] = useState('')
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const totalSteps = 7

  const steps = [
    { number: 1, title: 'Business Info', icon: BuildingStorefrontIcon, color: 'from-pink-500 to-rose-500' },
    { number: 2, title: 'Locations', icon: MapPinIcon, color: 'from-purple-500 to-pink-500' },
    { number: 3, title: 'Services', icon: ScissorsIcon, color: 'from-blue-500 to-purple-500' },
    { number: 4, title: 'Portfolio', icon: CameraIcon, color: 'from-cyan-500 to-blue-500' },
    { number: 5, title: 'Availability', icon: CalendarIcon, color: 'from-green-500 to-cyan-500' },
    { number: 6, title: 'Pricing', icon: CurrencyDollarIcon, color: 'from-yellow-500 to-green-500' },
    { number: 7, title: 'Launch', icon: RocketLaunchIcon, color: 'from-orange-500 to-yellow-500' }
  ]

  const handleSubmit = async (values: OnboardingData) => {
    try {
      // Save all data to backend
      const response = await axios.post(
        `${API_URL}/api/stylist/complete-onboarding`,
        values,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (response.data.success) {
        toast.success('🎉 Welcome to BeautyCita! Your stylist profile is now live!')

        // Update user status
        localStorage.setItem('user', JSON.stringify({
          ...user,
          stylistOnboardingComplete: true
        }))

        // Redirect to panel
        navigate('/panel')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete onboarding')
    }
  }

  const openAphrodite = (context: string) => {
    setAphroditeContext(context)
    setShowAphrodite(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <SparklesIcon className="h-12 w-12 text-pink-500" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500 bg-clip-text text-transparent">
              Stylist Onboarding
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            Let's set up your professional profile and get you started!
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex justify-between items-center relative">
            {/* Progress Line */}
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 -z-10">
              <motion.div
                className="h-full bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500"
                initial={{ width: '0%' }}
                animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Step Indicators */}
            {steps.map((step) => {
              const Icon = step.icon
              const isCompleted = currentStep > step.number
              const isCurrent = currentStep === step.number

              return (
                <div key={step.number} className="flex flex-col items-center">
                  <motion.div
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center mb-2
                      ${isCompleted ? 'bg-gradient-to-r ' + step.color : ''}
                      ${isCurrent ? 'bg-gradient-to-r ' + step.color + ' ring-4 ring-pink-200 dark:ring-pink-800' : ''}
                      ${!isCompleted && !isCurrent ? 'bg-gray-200 dark:bg-gray-700' : ''}
                      transition-all duration-300
                    `}
                    whileHover={{ scale: 1.1 }}
                  >
                    {isCompleted ? (
                      <CheckCircleIcon className="h-6 w-6 text-white" />
                    ) : (
                      <Icon className={`h-6 w-6 ${isCurrent ? 'text-white' : 'text-gray-400'}`} />
                    )}
                  </motion.div>
                  <span className={`text-xs font-medium hidden md:block ${isCurrent ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500'}`}>
                    {step.title}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Formik Wizard */}
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchemas[currentStep - 1]}
          onSubmit={(values, { setSubmitting }) => {
            if (currentStep < totalSteps) {
              setCurrentStep(currentStep + 1)
              setSubmitting(false)
            } else {
              handleSubmit(values)
            }
          }}
          validateOnChange={false}
          validateOnBlur={true}
        >
          {({ values, errors, touched, setFieldValue, isSubmitting, validateForm }) => (
            <Form>
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12"
              >
                <AnimatePresence mode="wait">
                  {/* Step 1: Business Info */}
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                          Tell us about your business
                        </h2>
                        <button
                          type="button"
                          onClick={() => openAphrodite('business-info')}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:shadow-lg transition-all"
                        >
                          <SparklesIcon className="h-5 w-5" />
                          Ask Aphrodite
                        </button>
                      </div>

                      <div className="space-y-6">
                        {/* Business Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Business Name *
                          </label>
                          <Field
                            name="businessName"
                            type="text"
                            placeholder="e.g., Glamour Studio, Cut & Style"
                            className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-4 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
                          />
                          <ErrorMessage name="businessName" component="div" className="text-red-500 text-sm mt-1" />
                        </div>

                        {/* Bio */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            About You & Your Business *
                          </label>
                          <Field
                            as="textarea"
                            name="bio"
                            rows={4}
                            placeholder="Tell clients about your experience, training, and what makes your services special..."
                            className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-4 focus:ring-pink-500/50 focus:border-pink-500 transition-all resize-none"
                          />
                          <div className="flex items-center justify-between mt-1">
                            <ErrorMessage name="bio" component="div" className="text-red-500 text-sm" />
                            <span className="text-sm text-gray-500">{values.bio.length}/500</span>
                          </div>
                        </div>

                        {/* Specialties */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Your Specialties * (Select all that apply)
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-4 border border-gray-300 dark:border-gray-600 rounded-2xl">
                            {specialtyOptions.map((specialty) => (
                              <label key={specialty} className="flex items-center gap-2 cursor-pointer hover:bg-pink-50 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors">
                                <Field
                                  type="checkbox"
                                  name="specialties"
                                  value={specialty}
                                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{specialty}</span>
                              </label>
                            ))}
                          </div>
                          <ErrorMessage name="specialties" component="div" className="text-red-500 text-sm mt-1" />
                        </div>

                        {/* Experience Years */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Years of Experience *
                          </label>
                          <Field
                            name="experienceYears"
                            type="number"
                            min="0"
                            placeholder="0"
                            className="w-full px-4 py-3 rounded-2xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-4 focus:ring-pink-500/50 focus:border-pink-500 transition-all"
                          />
                          <ErrorMessage name="experienceYears" component="div" className="text-red-500 text-sm mt-1" />
                        </div>

                        {/* Certifications */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Certifications (Optional)
                          </label>
                          <FieldArray name="certifications">
                            {({ push, remove }) => (
                              <div className="space-y-2">
                                {values.certifications.map((cert, index) => (
                                  <div key={index} className="flex gap-2">
                                    <Field
                                      name={`certifications.${index}`}
                                      placeholder="e.g., Cosmetology License, Advanced Color Certification"
                                      className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => remove(index)}
                                      className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => push('')}
                                  className="w-full px-4 py-2 border-2 border-dashed border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 rounded-xl hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
                                >
                                  + Add Certification
                                </button>
                              </div>
                            )}
                          </FieldArray>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Locations - TO BE CONTINUED */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                          Where do you work?
                        </h2>
                        <button
                          type="button"
                          onClick={() => openAphrodite('locations')}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:shadow-lg transition-all"
                        >
                          <SparklesIcon className="h-5 w-5" />
                          Ask Aphrodite
                        </button>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Add your salon, studio, or service locations. You can work from multiple locations.
                      </p>

                      <FieldArray name="locations">
                        {({ push, remove }) => (
                          <div className="space-y-6">
                            {values.locations.map((location, index) => (
                              <div key={index} className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-2xl space-y-4">
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Location {index + 1}
                                    {location.isPrimary && (
                                      <span className="ml-2 text-xs bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-300 px-2 py-1 rounded-full">
                                        Primary
                                      </span>
                                    )}
                                  </h3>
                                  {values.locations.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => remove(index)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>

                                {/* Location Name */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Location Name *
                                  </label>
                                  <Field
                                    name={`locations.${index}.name`}
                                    placeholder="e.g., Main Studio, Downtown Salon"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-pink-500/50"
                                  />
                                  <ErrorMessage name={`locations.${index}.name`} component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                {/* Location Type */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Type *
                                  </label>
                                  <Field
                                    as="select"
                                    name={`locations.${index}.type`}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-pink-500/50"
                                  >
                                    <option value="salon">Salon/Studio</option>
                                    <option value="home">Home-based</option>
                                    <option value="mobile">Mobile (I travel to clients)</option>
                                    <option value="other">Other</option>
                                  </Field>
                                </div>

                                {/* Address with Location Picker */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Address *
                                  </label>
                                  <LocationPicker
                                    onLocationSelect={(loc: any) => {
                                      setFieldValue(`locations.${index}.address`, loc.address)
                                      setFieldValue(`locations.${index}.city`, loc.city || '')
                                      setFieldValue(`locations.${index}.state`, loc.state || '')
                                      setFieldValue(`locations.${index}.latitude`, loc.lat)
                                      setFieldValue(`locations.${index}.longitude`, loc.lng)
                                    }}
                                    initialValue={location.address}
                                  />
                                  <ErrorMessage name={`locations.${index}.address`} component="div" className="text-red-500 text-sm mt-1" />
                                </div>

                                {/* City, State, ZIP */}
                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      City *
                                    </label>
                                    <Field
                                      name={`locations.${index}.city`}
                                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-pink-500/50"
                                    />
                                    <ErrorMessage name={`locations.${index}.city`} component="div" className="text-red-500 text-sm mt-1" />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      State *
                                    </label>
                                    <Field
                                      name={`locations.${index}.state`}
                                      maxLength={2}
                                      placeholder="MX"
                                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-pink-500/50 uppercase"
                                    />
                                    <ErrorMessage name={`locations.${index}.state`} component="div" className="text-red-500 text-sm mt-1" />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      ZIP *
                                    </label>
                                    <Field
                                      name={`locations.${index}.zip`}
                                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-pink-500/50"
                                    />
                                    <ErrorMessage name={`locations.${index}.zip`} component="div" className="text-red-500 text-sm mt-1" />
                                  </div>
                                </div>

                                {/* Amenities */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <Field
                                      type="checkbox"
                                      name={`locations.${index}.isPrimary`}
                                      className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                                      onChange={(e: any) => {
                                        if (e.target.checked) {
                                          // Uncheck all other primaries
                                          values.locations.forEach((_, i) => {
                                            if (i !== index) {
                                              setFieldValue(`locations.${i}.isPrimary`, false)
                                            }
                                          })
                                        }
                                        setFieldValue(`locations.${index}.isPrimary`, e.target.checked)
                                      }}
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Primary</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <Field
                                      type="checkbox"
                                      name={`locations.${index}.acceptsWalkins`}
                                      className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Walk-ins</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <Field
                                      type="checkbox"
                                      name={`locations.${index}.parkingAvailable`}
                                      className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Parking</span>
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <Field
                                      type="checkbox"
                                      name={`locations.${index}.wheelchairAccessible`}
                                      className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Accessible</span>
                                  </label>
                                </div>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => push({
                                name: '',
                                type: 'salon',
                                address: '',
                                city: '',
                                state: '',
                                zip: '',
                                latitude: 0,
                                longitude: 0,
                                isPrimary: false,
                                acceptsWalkins: false,
                                parkingAvailable: false,
                                wheelchairAccessible: false
                              })}
                              className="w-full py-4 border-2 border-dashed border-pink-300 dark:border-pink-700 text-pink-600 dark:text-pink-400 rounded-2xl hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors font-medium"
                            >
                              + Add Another Location
                            </button>
                          </div>
                        )}
                      </FieldArray>
                    </motion.div>
                  )}

                  {/* Step 3: Services with AI */}
                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                          What services do you offer?
                        </h2>
                        <button
                          type="button"
                          onClick={() => openAphrodite('services')}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:shadow-lg transition-all"
                        >
                          <SparklesIcon className="h-5 w-5" />
                          Get AI Suggestions
                        </button>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Add the services you'll offer to clients. Aphrodite can suggest popular services and optimal pricing!
                      </p>

                      <FieldArray name="services">
                        {({ push, remove }) => (
                          <div className="space-y-6">
                            {values.services.map((service, index) => (
                              <div key={index} className="p-6 border-2 border-purple-200 dark:border-purple-800 rounded-2xl space-y-4 bg-purple-50/50 dark:bg-purple-900/10">
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Service {index + 1}
                                  </h3>
                                  {values.services.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => remove(index)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {/* Service Name */}
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      Service Name *
                                    </label>
                                    <Field
                                      name={`services.${index}.name`}
                                      placeholder="e.g., Women's Haircut, Balayage, Gel Manicure"
                                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500/50"
                                    />
                                    <ErrorMessage name={`services.${index}.name`} component="div" className="text-red-500 text-sm mt-1" />
                                  </div>

                                  {/* Category */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      Category *
                                    </label>
                                    <Field
                                      as="select"
                                      name={`services.${index}.category`}
                                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500/50"
                                    >
                                      {serviceCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                      ))}
                                    </Field>
                                  </div>

                                  {/* Duration */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      Duration (minutes) *
                                    </label>
                                    <Field
                                      name={`services.${index}.durationMinutes`}
                                      type="number"
                                      min="15"
                                      step="15"
                                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500/50"
                                    />
                                    <ErrorMessage name={`services.${index}.durationMinutes`} component="div" className="text-red-500 text-sm mt-1" />
                                  </div>

                                  {/* Price */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      Price (USD) *
                                    </label>
                                    <Field
                                      name={`services.${index}.price`}
                                      type="number"
                                      min="0"
                                      step="5"
                                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500/50"
                                    />
                                    <ErrorMessage name={`services.${index}.price`} component="div" className="text-red-500 text-sm mt-1" />
                                  </div>

                                  {/* Price Type */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      Price Type *
                                    </label>
                                    <Field
                                      as="select"
                                      name={`services.${index}.priceType`}
                                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500/50"
                                    >
                                      <option value="fixed">Fixed Price</option>
                                      <option value="starting_at">Starting At</option>
                                      <option value="hourly">Per Hour</option>
                                    </Field>
                                  </div>

                                  {/* Description */}
                                  <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                      Description *
                                    </label>
                                    <Field
                                      as="textarea"
                                      name={`services.${index}.description`}
                                      rows={2}
                                      placeholder="Describe what's included, techniques used, etc."
                                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500/50 resize-none"
                                    />
                                    <ErrorMessage name={`services.${index}.description`} component="div" className="text-red-500 text-sm mt-1" />
                                  </div>
                                </div>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => push({
                                name: '',
                                description: '',
                                category: 'Hair',
                                durationMinutes: 60,
                                price: 0,
                                priceType: 'fixed'
                              })}
                              className="w-full py-4 border-2 border-dashed border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 rounded-2xl hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors font-medium"
                            >
                              + Add Another Service
                            </button>
                          </div>
                        )}
                      </FieldArray>
                    </motion.div>
                  )}

                  {/* Step 4: Portfolio (Optional) */}
                  {currentStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                          Showcase your work
                        </h2>
                        <button
                          type="button"
                          onClick={() => openAphrodite('portfolio')}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:shadow-lg transition-all"
                        >
                          <SparklesIcon className="h-5 w-5" />
                          Photography Tips
                        </button>
                      </div>

                      <div className="text-center py-12">
                        <CameraIcon className="h-24 w-24 mx-auto text-cyan-500 mb-6" />
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Portfolio upload is optional. You can add photos later from your panel.
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          💡 Tip: High-quality before/after photos increase bookings by 3x!
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 5: Availability */}
                  {currentStep === 5 && (
                    <motion.div
                      key="step5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                          When are you available?
                        </h2>
                        <button
                          type="button"
                          onClick={() => openAphrodite('availability')}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:shadow-lg transition-all"
                        >
                          <SparklesIcon className="h-5 w-5" />
                          Optimize Schedule
                        </button>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Set your general working hours. You can adjust these anytime and set specific availability in your calendar.
                      </p>

                      <div className="space-y-4">
                        {Object.keys(values.workingHours).map((day) => {
                          const dayData = values.workingHours[day as keyof typeof values.workingHours]
                          const dayName = day.charAt(0).toUpperCase() + day.slice(1)

                          return (
                            <div key={day} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                              <div className="w-32">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <Field
                                    type="checkbox"
                                    name={`workingHours.${day}.enabled`}
                                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                  />
                                  <span className="font-medium text-gray-900 dark:text-white">{dayName}</span>
                                </label>
                              </div>

                              {dayData.enabled && (
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Start Time</label>
                                    <Field
                                      type="time"
                                      name={`workingHours.${day}.start`}
                                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500/50"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">End Time</label>
                                    <Field
                                      type="time"
                                      name={`workingHours.${day}.end`}
                                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500/50"
                                    />
                                  </div>
                                </div>
                              )}

                              {!dayData.enabled && (
                                <div className="flex-1 text-gray-400 italic">Closed</div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 6: Pricing Strategy */}
                  {currentStep === 6 && (
                    <motion.div
                      key="step6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex items-center justify-between mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                          Pricing & Policies
                        </h2>
                        <button
                          type="button"
                          onClick={() => openAphrodite('pricing')}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full hover:shadow-lg transition-all"
                        >
                          <SparklesIcon className="h-5 w-5" />
                          Pricing Insights
                        </button>
                      </div>

                      <div className="space-y-6">
                        {/* Pricing Strategy */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Your Pricing Strategy *
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                              { value: 'budget', label: 'Budget-Friendly', desc: 'Attract price-conscious clients' },
                              { value: 'competitive', label: 'Competitive', desc: 'Market-rate pricing' },
                              { value: 'premium', label: 'Premium', desc: 'High-end, luxury services' }
                            ].map((strategy) => (
                              <label key={strategy.value} className="cursor-pointer">
                                <Field
                                  type="radio"
                                  name="pricingStrategy"
                                  value={strategy.value}
                                  className="peer sr-only"
                                />
                                <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-xl peer-checked:border-yellow-500 peer-checked:bg-yellow-50 dark:peer-checked:bg-yellow-900/20 transition-all hover:border-yellow-300">
                                  <div className="font-semibold text-gray-900 dark:text-white mb-1">{strategy.label}</div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">{strategy.desc}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Deposits */}
                        <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <label className="flex items-center gap-3 cursor-pointer mb-4">
                            <Field
                              type="checkbox"
                              name="acceptsDeposits"
                              className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            />
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">Require Deposits</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Reduce no-shows by requiring upfront deposits</div>
                            </div>
                          </label>

                          {values.acceptsDeposits && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Deposit Amount (% of service price) *
                              </label>
                              <Field
                                name="depositAmount"
                                type="number"
                                min="1"
                                max="100"
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500/50"
                              />
                              <ErrorMessage name="depositAmount" component="div" className="text-red-500 text-sm mt-1" />
                            </div>
                          )}
                        </div>

                        {/* Cancellation Policy */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            Cancellation Policy *
                          </label>
                          <Field
                            as="select"
                            name="cancellationPolicy"
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-yellow-500/50"
                          >
                            <option value="24_hours">24 hours notice required</option>
                            <option value="48_hours">48 hours notice required</option>
                            <option value="72_hours">72 hours notice required</option>
                            <option value="1_week">1 week notice required</option>
                            <option value="flexible">Flexible (no penalty)</option>
                          </Field>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 7: Review & Launch */}
                  {currentStep === 7 && (
                    <motion.div
                      key="step7"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="text-center mb-8">
                        <RocketLaunchIcon className="h-24 w-24 mx-auto text-orange-500 mb-6" />
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                          Ready to Launch!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                          Review your information below. Once you launch, your profile will be live and clients can start booking with you!
                        </p>
                      </div>

                      {/* Summary */}
                      <div className="space-y-6">
                        {/* Business Info Summary */}
                        <div className="p-6 bg-pink-50 dark:bg-pink-900/20 rounded-2xl">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Business Information</h3>
                          <dl className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <dt className="text-gray-600 dark:text-gray-400">Business Name</dt>
                              <dd className="font-semibold text-gray-900 dark:text-white">{values.businessName || 'Not set'}</dd>
                            </div>
                            <div>
                              <dt className="text-gray-600 dark:text-gray-400">Experience</dt>
                              <dd className="font-semibold text-gray-900 dark:text-white">{values.experienceYears} years</dd>
                            </div>
                            <div className="col-span-2">
                              <dt className="text-gray-600 dark:text-gray-400">Specialties</dt>
                              <dd className="font-semibold text-gray-900 dark:text-white">{values.specialties.join(', ') || 'None selected'}</dd>
                            </div>
                          </dl>
                        </div>

                        {/* Locations Summary */}
                        <div className="p-6 bg-purple-50 dark:bg-purple-900/20 rounded-2xl">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Locations ({values.locations.length})</h3>
                          {values.locations.map((loc, i) => (
                            <div key={i} className="mb-2 last:mb-0">
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {loc.name} {loc.isPrimary && <span className="text-xs text-pink-600">(Primary)</span>}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">{loc.address}, {loc.city}, {loc.state}</div>
                            </div>
                          ))}
                        </div>

                        {/* Services Summary */}
                        <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Services ({values.services.length})</h3>
                          {values.services.map((svc, i) => (
                            <div key={i} className="mb-2 last:mb-0 flex justify-between">
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white">{svc.name}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">{svc.category} • {svc.durationMinutes} min</div>
                              </div>
                              <div className="text-green-600 dark:text-green-400 font-bold">${svc.price}</div>
                            </div>
                          ))}
                        </div>

                        {/* Availability Summary */}
                        <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-2xl">
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">Working Hours</h3>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(values.workingHours).map(([day, hours]) => (
                              <div key={day} className="flex justify-between">
                                <span className="text-gray-700 dark:text-gray-300 capitalize">{day}:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {hours.enabled ? `${hours.start} - ${hours.end}` : 'Closed'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                    disabled={currentStep === 1}
                    className={`
                      flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all
                      ${currentStep === 1
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }
                    `}
                  >
                    <ArrowLeftIcon className="h-5 w-5" />
                    Previous
                  </button>

                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Step {currentStep} of {totalSteps}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-pink-500 via-purple-600 to-blue-500 text-white rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {currentStep === totalSteps ? (
                      <>
                        <RocketLaunchIcon className="h-5 w-5" />
                        Launch Profile
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRightIcon className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </Form>
          )}
        </Formik>
      </div>

      {/* Aphrodite AI Assistant */}
      <AphroditeAssistant
        isOpen={showAphrodite}
        onClose={() => setShowAphrodite(false)}
        context={aphroditeContext}
        userType="stylist"
      />
    </div>
  )
}
