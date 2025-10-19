import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  SparklesIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  PhotoIcon,
  XMarkIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { authService } from '@/services/authService'
import type { StylistRegisterForm } from '@/types'
import AphroditeBioAssistant from '@/components/auth/AphroditeBioAssistant'
import PhoneVerificationModal from '@/components/auth/PhoneVerificationModal'
import toast from 'react-hot-toast'

export default function StylistRegisterPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([])
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([])
  const [showAphroditeAssistant, setShowAphroditeAssistant] = useState(false)
  const [bioTextareaRef, setBioTextareaRef] = useState<HTMLTextAreaElement | null>(null)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [showPhoneVerification, setShowPhoneVerification] = useState(false)
  const [verificationAttempted, setVerificationAttempted] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const steps = [
    { id: 1, name: t('auth.stylistSteps.step1.title'), description: t('auth.stylistSteps.step1.description') },
    { id: 2, name: t('auth.stylistSteps.step2.title'), description: t('auth.stylistSteps.step2.description') },
    { id: 3, name: t('auth.stylistSteps.step3.title'), description: t('auth.stylistSteps.step3.description') },
    { id: 4, name: t('auth.stylistSteps.step4.title'), description: t('auth.stylistSteps.step4.description') },
    { id: 5, name: t('auth.stylistSteps.step5.title'), description: t('auth.stylistSteps.step5.description') },
  ]

  const specialtyOptions = t('auth.specialties', { returnObjects: true }) as string[]

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<StylistRegisterForm>()

  const watchedFields = watch()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length + portfolioFiles.length > 6) {
      toast.error(t('auth.portfolio.maxImages'))
      return
    }

    setPortfolioFiles(prev => [...prev, ...files])

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
  }

  const removePortfolioImage = (index: number) => {
    setPortfolioFiles(prev => prev.filter((_, i) => i !== index))
    setPortfolioPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSpecialtyToggle = (specialty: string) => {
    const currentSpecialties = getValues('specialties') || []
    const newSpecialties = currentSpecialties.includes(specialty)
      ? currentSpecialties.filter(s => s !== specialty)
      : [...currentSpecialties, specialty]

    setValue('specialties', newSpecialties)
  }

  const handleBioFocus = () => {
    setShowAphroditeAssistant(true)
  }

  const handleBioBlur = () => {
    // Add a small delay before hiding to allow clicking on suggestions
    setTimeout(() => {
      setShowAphroditeAssistant(false)
    }, 200)
  }

  const handleBioSelect = (bio: string) => {
    setValue('bio', bio)
    setShowAphroditeAssistant(false)
    // Refocus the textarea
    if (bioTextareaRef) {
      bioTextareaRef.focus()
    }
  }

  const handlePhoneVerificationSuccess = () => {
    setPhoneVerified(true)
    setShowPhoneVerification(false)
    setVerificationAttempted(true)
    toast.success(t('phoneVerification.verificationSuccess'))
  }

  const handleVerifyPhoneClick = () => {
    const phoneValue = watchedFields.phone
    if (!phoneValue || phoneValue.length < 10) {
      toast.error(t('phoneVerification.phoneRequired'))
      return
    }
    setShowPhoneVerification(true)
  }

  const nextStep = () => {
    // If we're on step 1, check phone verification before proceeding
    if (currentStep === 1) {
      const phoneValue = watchedFields.phone

      // Check if phone is provided
      if (!phoneValue || phoneValue.length < 10) {
        toast.error(t('phoneVerification.phoneRequired'))
        return
      }

      // Check if phone is verified
      if (!phoneVerified) {
        setVerificationAttempted(true)
        toast.error(t('phoneVerification.verificationRequired'))
        return
      }
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: StylistRegisterForm) => {
    setIsLoading(true)

    try {
      // Create FormData for file upload
      const formData = new FormData()

      // Add text fields
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'portfolioImages' && value !== undefined) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value))
          } else {
            formData.append(key, value.toString())
          }
        }
      })

      // Add portfolio images
      portfolioFiles.forEach((file, index) => {
        formData.append(`portfolioImages`, file)
      })

      const response = await authService.registerStylist(formData)

      if (response.success) {
        toast.success(t('auth.messages.stylistRegisterSuccess'))
        navigate('/login', {
          state: { message: t('auth.messages.stylistRegisterSuccess') }
        })
      } else {
        throw new Error(response.error || t('auth.messages.registerError'))
      }
    } catch (error: any) {
      toast.error(error.message || t('auth.messages.registerError'))
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">{t('auth.fields.firstName')} *</label>
                <input
                  {...register('firstName', { required: t('auth.validation.firstNameRequired') })}
                  className={`input ${errors.firstName ? 'input-error' : ''}`}
                  placeholder={t('auth.placeholders.firstName')}
                />
                {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
              </div>

              <div className="form-group">
                <label className="label">{t('auth.fields.lastName')} *</label>
                <input
                  {...register('lastName', { required: t('auth.validation.lastNameRequired') })}
                  className={`input ${errors.lastName ? 'input-error' : ''}`}
                  placeholder={t('auth.placeholders.lastName')}
                />
                {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="label">{t('auth.fields.email')} *</label>
              <input
                {...register('email', {
                  required: t('auth.validation.emailRequired'),
                  pattern: { value: /^\S+@\S+$/i, message: t('auth.validation.emailInvalid') }
                })}
                type="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder={t('auth.placeholders.email')}
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div className="form-group">
              <label className="label">{t('auth.fields.phone')} *</label>
              <div className="relative">
                <input
                  {...register('phone', {
                    required: t('auth.validation.phoneRequired'),
                    pattern: {
                      value: /^[\+]?[0-9\s\-\(\)]{10,}$/,
                      message: t('auth.validation.phoneInvalid')
                    }
                  })}
                  type="tel"
                  className={`input pr-12 ${errors.phone ? 'input-error' : phoneVerified ? 'border-green-500' : verificationAttempted && !phoneVerified ? 'border-red-500' : ''}`}
                  placeholder={t('auth.placeholders.phone')}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {phoneVerified ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  ) : verificationAttempted ? (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                  ) : (
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
              {errors.phone && <p className="form-error">{errors.phone.message}</p>}

              {/* Verification Status Messages */}
              <div className="mt-2 space-y-2">
                {phoneVerified ? (
                  <div className="flex items-center space-x-2 text-green-600 text-sm">
                    <ShieldCheckIcon className="h-4 w-4" />
                    <span>{t('phoneVerification.phoneVerified')}</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className={`flex items-center space-x-2 text-beauty-hot-pink text-sm ${verificationAttempted ? 'font-medium' : ''}`}>
                      <PhoneIcon className="h-4 w-4" />
                      <span>{t('phoneVerification.mustVerifyToContinue')}</span>
                    </div>
                    {watchedFields.phone && watchedFields.phone.length >= 10 && (
                      <button
                        type="button"
                        onClick={handleVerifyPhoneClick}
                        className="btn btn-outline btn-sm flex items-center space-x-2"
                      >
                        <PhoneIcon className="h-3 w-3" />
                        <span>{t('phoneVerification.verifyPhoneButton')}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="label">{t('auth.fields.dateOfBirth')} *</label>
              <input
                {...register('dateOfBirth', {
                  required: t('auth.validation.dateOfBirthRequired'),
                  validate: value => {
                    const date = new Date(value)
                    const now = new Date()
                    const age = now.getFullYear() - date.getFullYear()
                    if (isNaN(date.getTime())) {
                      return t('auth.validation.dateOfBirthInvalid')
                    }
                    if (age < 18) {
                      return t('auth.validation.mustBe18')
                    }
                    return true
                  }
                })}
                type="date"
                className={`input ${errors.dateOfBirth ? 'input-error' : ''}`}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              />
              {errors.dateOfBirth && <p className="form-error">{errors.dateOfBirth.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">{t('auth.fields.password')} *</label>
                <input
                  {...register('password', {
                    required: t('auth.validation.passwordRequired'),
                    minLength: { value: 8, message: t('auth.validation.passwordMinLength') }
                  })}
                  type="password"
                  className={`input ${errors.password ? 'input-error' : ''}`}
                  placeholder={t('auth.placeholders.password')}
                />
                {errors.password && <p className="form-error">{errors.password.message}</p>}
              </div>

              <div className="form-group">
                <label className="label">{t('auth.fields.confirmPassword')} *</label>
                <input
                  {...register('confirmPassword', {
                    required: t('auth.validation.confirmPassword'),
                    validate: value => value === watchedFields.password || t('auth.validation.passwordsNotMatch')
                  })}
                  type="password"
                  className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder={t('auth.placeholders.password')}
                />
                {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="form-group">
              <label className="label">{t('auth.fields.businessName')} *</label>
              <input
                {...register('businessName', { required: t('auth.validation.businessNameRequired') })}
                className={`input ${errors.businessName ? 'input-error' : ''}`}
                placeholder={t('auth.placeholders.businessName')}
              />
              {errors.businessName && <p className="form-error">{errors.businessName.message}</p>}
            </div>

            <div className="form-group">
              <label className="label">{t('auth.fields.experience')} *</label>
              <select
                {...register('experience', { required: t('auth.validation.experienceRequired') })}
                className={`input ${errors.experience ? 'input-error' : ''}`}
              >
                <option value="">{t('auth.options.selectExp')}</option>
                <option value="1">{t('auth.options.1year')}</option>
                <option value="2">{t('auth.options.2years')}</option>
                <option value="3">{t('auth.options.3years')}</option>
                <option value="4">{t('auth.options.4years')}</option>
                <option value="5">{t('auth.options.5years')}</option>
                <option value="10">{t('auth.options.10years')}</option>
              </select>
              {errors.experience && <p className="form-error">{errors.experience.message}</p>}
            </div>

            <div className="form-group">
              <label className="label">{t('auth.fields.specialties')} *</label>
              <p className="text-sm text-gray-600 mb-3">{t('auth.options.selectSpecialties')}</p>
              <div className="grid grid-cols-2 gap-2">
                {specialtyOptions.map(specialty => (
                  <label key={specialty} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={watchedFields.specialties?.includes(specialty) || false}
                      onChange={() => handleSpecialtyToggle(specialty)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">{specialty}</span>
                  </label>
                ))}
              </div>
              {errors.specialties && <p className="form-error">{errors.specialties.message}</p>}
            </div>

            <div className="form-group relative">
              <label className="label">{t('auth.fields.bio')}</label>
              <div className="relative">
                <textarea
                  {...register('bio', {
                    setValueAs: (value) => value // Ensure proper value handling
                  })}
                  ref={(el) => setBioTextareaRef(el)}
                  rows={4}
                  className="input pr-10"
                  placeholder={t('auth.placeholders.bio')}
                  onFocus={handleBioFocus}
                  onBlur={handleBioBlur}
                />
                <div className="absolute top-2 right-2">
                  <div className="flex items-center space-x-1 text-beauty-hot-pink">
                    <SparklesIcon className="h-4 w-4" />
                    <span className="text-xs font-medium">Aphrodite AI</span>
                  </div>
                </div>
              </div>

              <AphroditeBioAssistant
                isVisible={showAphroditeAssistant}
                onClose={() => setShowAphroditeAssistant(false)}
                onBioSelect={handleBioSelect}
                specialties={watchedFields.specialties || []}
                experience={Number(watchedFields.experience) || 0}
                businessName={watchedFields.businessName || ''}
              />
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">{t('auth.fields.locationCity')} *</label>
                <input
                  {...register('locationCity', { required: t('auth.validation.cityRequired') })}
                  className={`input ${errors.locationCity ? 'input-error' : ''}`}
                  placeholder="Ciudad de México"
                />
                {errors.locationCity && <p className="form-error">{errors.locationCity.message}</p>}
              </div>

              <div className="form-group">
                <label className="label">{t('auth.fields.locationState')} *</label>
                <input
                  {...register('locationState', { required: t('auth.validation.stateRequired') })}
                  className={`input ${errors.locationState ? 'input-error' : ''}`}
                  placeholder="CDMX"
                />
                {errors.locationState && <p className="form-error">{errors.locationState.message}</p>}
              </div>
            </div>

            <div className="form-group">
              <label className="label">{t('auth.fields.instagramUrl')}</label>
              <input
                {...register('instagramUrl')}
                className="input"
                placeholder={t('auth.placeholders.instagramUrl')}
              />
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('auth.portfolio.title')}
              </h3>
              <p className="text-gray-600 mb-6">
                {t('auth.portfolio.subtitle')}
              </p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="portfolio-upload"
              />
              <label
                htmlFor="portfolio-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <PhotoIcon className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">
                  {t('auth.portfolio.uploadText')}
                </span>
                <span className="text-xs text-gray-500">
                  {t('auth.portfolio.uploadHint')}
                </span>
              </label>
            </div>

            {portfolioPreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {portfolioPreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`${t('auth.portfolio.imageAlt')} ${index + 1}`}
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
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('auth.review.title')}
              </h3>
              <p className="text-gray-600">
                {t('auth.review.subtitle')}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900">{t('auth.review.personalInfo')}</h4>
                <p className="text-sm text-gray-600">
                  {watchedFields.firstName} {watchedFields.lastName}
                </p>
                <p className="text-sm text-gray-600">{watchedFields.email}</p>
                <p className="text-sm text-gray-600">{watchedFields.phone}</p>
                <p className="text-sm text-gray-600">{watchedFields.dateOfBirth}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">{t('auth.review.professionalInfo')}</h4>
                <p className="text-sm text-gray-600">{watchedFields.businessName}</p>
                <p className="text-sm text-gray-600">{watchedFields.experience} {t('auth.options.1year').split(' ')[1]}</p>
                <p className="text-sm text-gray-600">
                  {watchedFields.specialties?.join(', ')}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">{t('auth.review.location')}</h4>
                <p className="text-sm text-gray-600">
                  {watchedFields.locationCity}, {watchedFields.locationState}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900">{t('auth.review.portfolioImages')}</h4>
                <p className="text-sm text-gray-600">
                  {portfolioFiles.length} {t('auth.review.imagesSelected')}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <input
                {...register('acceptTerms', { required: t('auth.validation.termsRequired') })}
                id="acceptTerms"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
              />
              <div className="text-sm">
                <label htmlFor="acceptTerms" className="text-gray-700">
                  {t('auth.options.acceptStylistTerms')}
                </label>
                {errors.acceptTerms && (
                  <p className="form-error mt-1">{errors.acceptTerms.message}</p>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <SparklesIcon className="h-10 w-10 text-primary-600" />
            <span className="text-2xl font-serif font-bold gradient-text">
              BeautyCita
            </span>
          </Link>

          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-2">
            {t('auth.stylistRegisterTitle')}
          </h1>
          <p className="text-gray-600">
            {t('auth.stylistRegisterSubtitle')}
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    step.id <= currentStep
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'border-gray-300 text-gray-400'
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-full h-1 mx-2 ${
                      step.id < currentStep ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {steps[currentStep - 1].name}
            </h2>
            <p className="text-sm text-gray-600">
              {steps[currentStep - 1].description}
            </p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card"
        >
          <div className="card-body">
            <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`btn ${
                    currentStep === 1
                      ? 'btn-outline opacity-50 cursor-not-allowed'
                      : 'btn-outline'
                  } flex items-center space-x-2`}
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>{t('auth.actions.previous')}</span>
                </button>

                {currentStep < steps.length ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="btn btn-primary flex items-center space-x-2"
                  >
                    <span>{t('auth.actions.next')}</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <div className="loading-spinner" />
                    ) : (
                      <>
                        <span>{t('auth.actions.submit')}</span>
                        <CheckCircleIcon className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </motion.div>

        {/* Login link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-6"
        >
          <p className="text-sm text-gray-600">
            {t('auth.links.hasAccount')}{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              {t('auth.links.signInHere')}
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        isOpen={showPhoneVerification}
        onClose={() => setShowPhoneVerification(false)}
        onSuccess={handlePhoneVerificationSuccess}
        phone={watchedFields.phone}
      />
    </div>
  )
}