import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'
// import StylistRegistrationFlow from './StylistRegistrationFlow' // Temporarily commented out

interface AuthModalProps {
  mode: 'client' | 'stylist'
  onClose: () => void
}

const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose }) => {
  const { t } = useTranslation()
  const [isLogin, setIsLogin] = useState(true)
  const [showStylistFlow, setShowStylistFlow] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    agreeToTerms: false,
    // Stylist-specific fields
    businessName: '',
    experienceYears: 0,
    specialties: [] as string[],
    biography: '',
    city: '',
    state: '',
    services: [] as string[],
    pricing: {} as Record<string, { price: number; duration: number }>
  })
  const [formError, setFormError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({})
  const [loading, setLoading] = useState(false)

  // Refs for focus management
  const modalRef = useRef<HTMLDivElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)
  const lastFocusableRef = useRef<HTMLButtonElement>(null)

  // Body scroll lock and focus management
  useEffect(() => {
    // Store original body styles
    const originalStyle = window.getComputedStyle(document.body).overflow
    const originalPosition = window.getComputedStyle(document.body).position
    const scrollY = window.scrollY

    // Prevent body scroll
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    // Focus management
    const previouslyFocusedElement = document.activeElement as HTMLElement

    // Focus first input after a short delay to ensure modal is rendered
    const focusTimeout = setTimeout(() => {
      if (firstInputRef.current) {
        firstInputRef.current.focus()
      }
    }, 100)

    // Cleanup function
    return () => {
      // Restore body scroll
      document.body.style.overflow = originalStyle
      document.body.style.position = originalPosition
      document.body.style.top = ''
      document.body.style.width = ''

      // Restore scroll position
      window.scrollTo(0, scrollY)

      // Return focus to previously focused element
      if (previouslyFocusedElement) {
        previouslyFocusedElement.focus()
      }

      clearTimeout(focusTimeout)
    }
  }, [])

  // Show stylist flow when mode is 'stylist'
  useEffect(() => {
    if (mode === 'stylist') {
      setShowStylistFlow(true)
    }
  }, [mode])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Focus trapping
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )

      if (focusableElements && focusableElements.length > 0) {
        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = 'checked' in e.target ? e.target.checked : false

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked :
              type === 'number' ? (value === '' ? 0 : parseInt(value, 10)) :
              value,
    })

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }

    // Clear general form error when user makes changes
    if (formError) {
      setFormError('')
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFieldErrors({})
    setLoading(true)

    // Validate required fields for registration
    if (!isLogin) {
      const errors: {[key: string]: string} = {}

      // Common required fields
      if (!formData.firstName?.trim()) errors.firstName = t('auth.validation.firstNameRequired')
      if (!formData.lastName?.trim()) errors.lastName = t('auth.validation.lastNameRequired')
      if (!formData.email?.trim()) errors.email = t('auth.validation.emailRequired')
      if (!formData.phone?.trim()) errors.phone = t('auth.validation.phoneRequired')
      if (!formData.password) errors.password = t('auth.validation.passwordRequired')
      if (!formData.agreeToTerms) errors.agreeToTerms = t('auth.validation.termsRequired')

      // Stylist-specific required fields
      if (mode === 'stylist') {
        if (!formData.businessName?.trim()) errors.businessName = t('auth.validation.businessNameRequired')
        if (!formData.experienceYears || formData.experienceYears === 0) errors.experienceYears = t('auth.validation.experienceRequired')
        if (!formData.biography?.trim()) errors.biography = t('auth.biographyRequired', 'Biography is required')
        if (!formData.city?.trim()) errors.city = t('auth.validation.cityRequired')
        if (!formData.state?.trim()) errors.state = t('auth.validation.stateRequired')
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        setLoading(false)
        return
      }
    }

    try {
      if (isLogin) {
        // Handle login
        const response = await authService.login({
          email: formData.email,
          password: formData.password
        })

        if (response.success) {
          // Store auth token
          if (response.data?.token) {
            authService.setAuthToken(response.data.token)
          }

          toast.success(t('auth.messages.loginSuccess'))
          onClose()

          // Redirect based on role
          window.location.href = `/home?role=${mode}`
        } else {
          // Handle login errors
          if (response.data?.field) {
            setFieldErrors({ [response.data.field]: response.error || t('auth.invalidInput', 'Invalid input') })
          } else {
            setFormError(response.error || t('auth.messages.loginError'))
          }
        }
      } else {
        // Handle registration
        const registrationData = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          confirmPassword: formData.password, // Use same password for confirmation
          agreeToTerms: formData.agreeToTerms,
          role: mode,
          // Add stylist-specific fields if stylist registration
          ...(mode === 'stylist' && {
            businessName: formData.businessName,
            experienceYears: formData.experienceYears,
            specialties: formData.specialties,
            biography: formData.biography,
            workLocation: {
              city: formData.city,
              state: formData.state,
              address: `${formData.city}, ${formData.state}` // Temporary address
            },
            services: formData.services,
            pricing: formData.pricing,
            serviceDescription: formData.biography
          })
        }

        const response = mode === 'stylist'
          ? await authService.registerStylist(registrationData)
          : await authService.register(registrationData)

        if (response.success) {
          toast.success(t('auth.messages.registerSuccess'))

          // Check if we need phone verification
          if (response.message?.includes('verify')) {
            window.location.href = `/verify-phone?email=${encodeURIComponent(formData.email)}&role=${mode}`
          } else {
            // Switch to login form
            setFormError(t('auth.registerSuccessLogin', 'Registration successful! Please log in to continue.'))
            setIsLogin(true)
          }
        } else {
          // Handle registration errors
          if (response.data?.errors) {
            setFieldErrors(response.data.errors)
          } else if (response.data?.field) {
            setFieldErrors({ [response.data.field]: response.error || t('auth.invalidInput', 'Invalid input') })
          } else {
            setFormError(response.error || t('auth.messages.registerError'))
          }
        }
      }
    } catch (error) {
      console.error('Authentication error:', error)
      setFormError(t('auth.messages.networkError'))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = () => {
    // Store the intended role in session storage for post-auth redirect
    sessionStorage.setItem('auth_role', mode)
    const googleUrl = mode === 'stylist'
      ? '/api/auth/google?role=stylist'
      : '/api/auth/google?role=client'
    window.location.href = googleUrl
  }

  const handleStylistRegistration = async (data: any) => {
    setLoading(true)
    try {
      const response = await authService.registerStylist(data)

      if (response.success) {
        toast.success(t('auth.messages.registerSuccess'))
        if (response.message?.includes('verify')) {
          window.location.href = `/verify-phone?email=${encodeURIComponent(data.email)}&role=stylist`
        } else {
          setFormError(t('auth.registerSuccessLogin', 'Registration successful! Please log in to continue.'))
          setShowStylistFlow(false)
          setIsLogin(true)
        }
      } else {
        if (response.data?.errors) {
          setFieldErrors(response.data.errors)
        } else if (response.data?.field) {
          setFieldErrors({ [response.data.field]: response.error || t('auth.invalidInput', 'Invalid input') })
        } else {
          setFormError(response.error || t('auth.messages.registerError'))
        }
      }
    } catch (error) {
      console.error('Stylist registration error:', error)
      setFormError(t('auth.messages.networkError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleOverlayClick}
        onTouchMove={(e) => e.preventDefault()} // Prevent iOS scroll bounce
        style={{ touchAction: 'none' }} // Prevent scroll on touch devices
      >
        <motion.div
          ref={modalRef}
          className={`bg-white rounded-full p-6 md:p-8 w-full shadow-2xl relative max-h-[90vh] overflow-y-auto ${
            mode === 'stylist' && !isLogin ? 'max-w-lg' : 'max-w-md'
          }`}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl p-1 transition-colors"
          >
            ×
          </button>

          {/* Header */}
          <div className="text-center mb-8 pt-4">
            <h2 id="modal-title" className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              {mode === 'stylist'
                ? (isLogin ? t('auth.stylistLoginTitle', 'Stylist Login') : t('auth.stylistRegisterTitle'))
                : (isLogin ? t('auth.loginTitle') : t('auth.registerTitle'))
              }
            </h2>
            <p className="text-gray-600 text-sm">
              {mode === 'stylist'
                ? isLogin
                  ? t('auth.stylistLoginSubtitle', 'Access your stylist dashboard')
                  : t('auth.stylistRegisterSubtitle')
                : isLogin
                  ? t('auth.loginSubtitle')
                  : t('auth.registerSubtitle')
              }
            </p>
            {/* Warning for stylist registration attempt */}
            {mode === 'stylist' && !isLogin && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
                <p className="font-medium">⚠️ {t('auth.stylistWarningTitle', 'Stylist registration is not available here')}</p>
                <p className="mt-1 text-xs">{t('auth.stylistWarningMessage', 'Please register as a client first, then upgrade to stylist after completing onboarding.')}</p>
              </div>
            )}
          </div>

          {/* Google Auth Button */}
          <motion.button
            onClick={handleGoogleAuth}
            disabled={loading}
            className={`w-full p-4 mb-6 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 border-2 border-transparent font-medium flex items-center justify-center gap-3 transition-all shadow-lg ${
              loading ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-xl hover:scale-[1.02]'
            }`}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
          >
            <div className="flex items-center justify-center gap-3 bg-white text-gray-700 px-4 py-2 rounded-full">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium">
                {isLogin ? t('auth.social.signInWithGoogle') : t('auth.social.signUpWithGoogle')}
              </span>
            </div>
          </motion.button>

          {/* Divider */}
          <div className="flex items-center mb-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="px-4 text-gray-500 text-sm">{t('common.or')}</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-5">
            {/* Block form if trying to register as stylist */}
            {mode === 'stylist' && !isLogin && (
              <div className="text-center py-8">
                <p className="text-gray-700 mb-4">{t('auth.stylistBlockMessage', 'Stylist accounts cannot be created directly.')}</p>
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-full hover:shadow-lg transition-all"
                >
                  {t('auth.goToStylistLogin', 'Go to Stylist Login')}
                </button>
                <p className="text-sm text-gray-600 mt-4">
                  {t('auth.newToBeautyCita', 'New to BeautyCita?')}{' '}
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-pink-600 hover:underline font-medium"
                  >
                    {t('auth.registerClientFirst', 'Register as a client first')}
                  </button>
                </p>
              </div>
            )}
            {/* Show form only if not attempting stylist registration */}
            {!(mode === 'stylist' && !isLogin) && (
              <>
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('auth.fields.firstName')} <span className="text-pink-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required={!isLogin}
                      disabled={loading}
                      className={`w-full p-3 border rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors ${
                        fieldErrors.firstName
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300'
                      } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                      placeholder={t('auth.placeholders.firstName')}
                    />
                    {fieldErrors.firstName && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('auth.fields.lastName')} <span className="text-pink-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required={!isLogin}
                      disabled={loading}
                      className={`w-full p-3 border rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors ${
                        fieldErrors.lastName
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300'
                      } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                      placeholder={t('auth.placeholders.lastName')}
                    />
                    {fieldErrors.lastName && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.lastName}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.fields.email')}
              </label>
              <input
                ref={firstInputRef}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
                className={`w-full p-3 border rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors ${
                  fieldErrors.email
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                placeholder={t('auth.placeholders.email')}
              />
              {fieldErrors.email && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.fields.phone')} <span className="text-pink-600">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required={!isLogin}
                  disabled={loading}
                  className={`w-full p-3 border rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors ${
                    fieldErrors.phone
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  placeholder={t('auth.placeholders.phone')}
                />
                {fieldErrors.phone ? (
                  <p className="text-red-600 text-sm mt-1">{fieldErrors.phone}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    {t('auth.phoneHint', 'Required for time-sensitive booking notifications')}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.fields.password')}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                disabled={loading}
                className={`w-full p-3 border rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors ${
                  fieldErrors.password
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                placeholder={t('auth.placeholders.password')}
              />
              {fieldErrors.password && (
                <p className="text-red-600 text-sm mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* Stylist-specific fields */}
            {!isLogin && mode === 'stylist' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.fields.businessName')} <span className="text-pink-600">*</span>
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    required={!isLogin && mode === 'stylist'}
                    disabled={loading}
                    className={`w-full p-3 border rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors ${
                      fieldErrors.businessName
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    placeholder={t('auth.placeholders.businessName')}
                  />
                  {fieldErrors.businessName && (
                    <p className="text-red-600 text-sm mt-1">{fieldErrors.businessName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.fields.experience')} <span className="text-pink-600">*</span>
                  </label>
                  <select
                    name="experienceYears"
                    value={formData.experienceYears}
                    onChange={handleInputChange}
                    required={!isLogin && mode === 'stylist'}
                    disabled={loading}
                    className={`w-full p-3 border rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors ${
                      fieldErrors.experienceYears
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <option value={0}>{t('auth.options.selectExp')}</option>
                    <option value={1}>{t('auth.options.1year')}</option>
                    <option value={2}>{t('auth.options.2years')}</option>
                    <option value={3}>{t('auth.options.3years')}</option>
                    <option value={5}>{t('auth.options.5years')}</option>
                    <option value={7}>7+ {t('auth.yearsLabel', 'years')}</option>
                    <option value={10}>{t('auth.options.10years')}</option>
                  </select>
                  {fieldErrors.experienceYears && (
                    <p className="text-red-600 text-sm mt-1">{fieldErrors.experienceYears}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.biographyLabel', 'Biography')} <span className="text-pink-600">*</span>
                  </label>
                  <textarea
                    name="biography"
                    value={formData.biography}
                    onChange={handleInputChange}
                    required={!isLogin && mode === 'stylist'}
                    disabled={loading}
                    rows={3}
                    className={`w-full p-3 border rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors resize-none ${
                      fieldErrors.biography
                        ? 'border-red-300 bg-red-50'
                        : 'border-gray-300'
                    } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    placeholder={t('auth.placeholders.bio')}
                  />
                  {fieldErrors.biography && (
                    <p className="text-red-600 text-sm mt-1">{fieldErrors.biography}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('auth.fields.locationCity')} <span className="text-pink-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      required={!isLogin && mode === 'stylist'}
                      disabled={loading}
                      className={`w-full p-3 border rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors ${
                        fieldErrors.city
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300'
                      } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                      placeholder={t('auth.cityPlaceholder', 'Your city')}
                    />
                    {fieldErrors.city && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.city}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('auth.fields.locationState')} <span className="text-pink-600">*</span>
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      required={!isLogin && mode === 'stylist'}
                      disabled={loading}
                      className={`w-full p-3 border rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-colors ${
                        fieldErrors.state
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300'
                      } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <option value="">{t('auth.selectState', 'Select state')}</option>
                      <option value="CDMX">Ciudad de México</option>
                      <option value="JAL">Jalisco</option>
                      <option value="NLE">Nuevo León</option>
                      <option value="BCN">Baja California</option>
                      <option value="SON">Sonora</option>
                      <option value="CHH">Chihuahua</option>
                      <option value="TAM">Tamaulipas</option>
                      <option value="VER">Veracruz</option>
                      <option value="YUC">Yucatán</option>
                      <option value="QRO">Querétaro</option>
                    </select>
                    {fieldErrors.state && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.state}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Terms of Service Checkbox */}
            {!isLogin && (
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  required={!isLogin}
                  disabled={loading}
                  className="mt-1 h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <label className="text-sm text-gray-700">
                  {t('auth.agreeToTermsPrefix', 'I agree to the')}{' '}
                  <a
                    href={mode === 'stylist' ? '/terms/stylist' : '/terms/client'}
                    target="_blank"
                    className="text-pink-600 hover:text-pink-700 hover:underline font-medium"
                  >
                    {t('auth.links.termsOfService')}
                  </a>
                  {mode === 'stylist' && (
                    <>
                      {' '}{t('common.and')}{' '}
                      <a
                        href="/terms/client"
                        target="_blank"
                        className="text-pink-600 hover:text-pink-700 hover:underline font-medium"
                      >
                        {t('auth.clientTermsLabel', 'Client Terms')}
                      </a>
                    </>
                  )}
                </label>
              </div>
            )}

            {/* Error Message */}
            {formError && (
              <motion.div
                className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-full text-sm text-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {formError}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              className={`w-full p-4 rounded-full font-bold text-white transition-all ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:shadow-lg'
              }`}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
            >
              {loading
                ? t('common.loading')
                : isLogin
                  ? `${t('auth.actions.signIn')} ${t('auth.asLabel', 'as')} ${mode === 'stylist' ? t('auth.stylistRole', 'Stylist') : t('auth.clientRole', 'Client')}`
                  : `${t('auth.actions.signUp')} ${mode === 'stylist' ? t('auth.stylistRole', 'Stylist') : t('auth.clientRole', 'Client')} ${t('auth.accountLabel', 'Account')}`
              }
            </motion.button>

            {/* Toggle Login/Register */}
            <div className="text-center mt-4">
              <button
                ref={lastFocusableRef}
                type="button"
                onClick={() => {
                  if (isLogin) {
                    // Don't allow switching to registration for stylists
                    if (mode === 'stylist') {
                      toast.error(t('auth.stylistRegNotAvailable', 'Stylist registration is not available. Please register as a client first.'))
                    } else {
                      setIsLogin(false)
                    }
                  } else {
                    setIsLogin(true)
                  }
                }}
                disabled={loading}
                className={`text-sm text-gray-600 hover:text-gray-800 transition-colors ${
                  loading ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                {isLogin
                  ? mode === 'stylist'
                    ? t('auth.newStylistRegisterClient', 'New stylist? Register as client first')
                    : `${t('auth.links.noAccount')} ${t('auth.links.signUpHere')}`
                  : t('auth.signInInstead', 'Sign in instead')
                }
              </button>
            </div>
            </>
            )}
          </form>
        </motion.div>
      </motion.div>

      {/* Stylist Registration Flow - Temporarily disabled */}
      {showStylistFlow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-full p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">{t('auth.stylistRegisterTitle')}</h3>
            <p className="mb-4">{t('auth.stylistFlowUnavailable', 'Stylist registration form is temporarily unavailable. Please try again later.')}</p>
            <button
              onClick={() => setShowStylistFlow(false)}
              className="btn btn-primary rounded-full"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default AuthModal