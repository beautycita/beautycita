import React, { useState, useEffect } from 'react'

interface EnhancedSignupModalProps {
  mode: 'client' | 'stylist' | 'admin'
  onClose: () => void
}

interface ResponsiveButtonProps {
  children: string
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'text' | 'google'
  loading?: boolean
}

const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  loading = false
}) => {
  // Calculate responsive font size based on text length
  const textLength = children.length
  const fontSize = Math.max(12, Math.min(16, 140 / textLength))

  const baseStyle = {
    width: variant === 'google' ? '100%' : 'auto',
    minWidth: variant === 'text' ? 'auto' : '140px',
    maxWidth: variant === 'text' ? 'none' : (variant === 'google' ? 'none' : '220px'),
    height: variant === 'text' ? 'auto' : '50px',
    padding: variant === 'text' ? '8px' : (variant === 'google' ? '16px' : '0 16px'),
    border: 'none',
    borderRadius: variant === 'text' ? '0' : '8px',
    fontWeight: (variant === 'text' ? 'normal' : 'bold') as const,
    cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
    fontSize: `${fontSize}px`,
    lineHeight: '1.2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: variant === 'text' ? 'normal' as const : 'nowrap' as const,
    transition: 'all 0.2s ease'
  }

  const variantStyles = {
    primary: {
      background: (disabled || loading)
        ? '#ccc'
        : 'linear-gradient(135deg, var(--accent-rose), var(--accent-lavender))',
      color: 'white'
    },
    secondary: {
      background: 'transparent',
      color: (disabled || loading) ? '#999' : 'var(--accent-rose)',
      border: `1px solid ${(disabled || loading) ? '#ccc' : 'var(--accent-rose)'}`
    },
    text: {
      background: 'none',
      color: (disabled || loading) ? '#999' : '#666',
      textDecoration: 'underline',
      minWidth: 'auto',
      height: 'auto',
      padding: '8px'
    },
    google: {
      background: 'white',
      color: (disabled || loading) ? '#999' : '#333',
      border: `1px solid ${(disabled || loading) ? '#ccc' : '#ddd'}`,
      gap: '12px'
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...baseStyle,
        ...variantStyles[variant]
      }}
    >
      {variant === 'google' && <span style={{ fontSize: '20px' }}>🔍</span>}
      {children}
    </button>
  )
}

interface FormData {
  // Basic Info (Step 1)
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: string
  password: string
  confirmPassword: string
  agreeToTerms: boolean

  // Phone Verification (Step 2)
  verificationCode: string

  // Stylist-specific (Step 3)
  services: string[]
  workLocation: {
    address: string
    city: string
    state: string
    zipCode: string
  }
  salonPhone: string
  workingHours: {
    [key: string]: { start: string; end: string; available: boolean }
  }
  pricing: { [service: string]: { price: number; duration: number } }
  profilePicture: File | null
  serviceDescription: string
}

const defaultWorkingHours = {
  monday: { start: '09:00', end: '17:00', available: true },
  tuesday: { start: '09:00', end: '17:00', available: true },
  wednesday: { start: '09:00', end: '17:00', available: true },
  thursday: { start: '09:00', end: '17:00', available: true },
  friday: { start: '09:00', end: '17:00', available: true },
  saturday: { start: '10:00', end: '16:00', available: true },
  sunday: { start: '10:00', end: '16:00', available: false }
}

const serviceCategories = [
  { id: 'hair-cutting', name: 'Hair Cutting', icon: '✂️' },
  { id: 'hair-coloring', name: 'Hair Coloring', icon: '🎨' },
  { id: 'hair-styling', name: 'Hair Styling', icon: '💇‍♀️' },
  { id: 'nail-services', name: 'Nail Services', icon: '💅' },
  { id: 'makeup', name: 'Makeup', icon: '💄' },
  { id: 'skincare', name: 'Skincare', icon: '✨' },
  { id: 'eyebrows-lashes', name: 'Eyebrows & Lashes', icon: '👁️' },
  { id: 'hair-extensions', name: 'Hair Extensions', icon: '💁‍♀️' },
  { id: 'bridal-services', name: 'Bridal Services', icon: '👰' },
  { id: 'mens-grooming', name: "Men's Grooming", icon: '🧔' }
]

const EnhancedSignupModal: React.FC<EnhancedSignupModalProps> = ({ mode, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [smsSentSuccessfully, setSmsSentSuccessfully] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    verificationCode: '',
    services: [],
    workLocation: { address: '', city: '', state: '', zipCode: '' },
    salonPhone: '',
    workingHours: defaultWorkingHours,
    pricing: {},
    profilePicture: null,
    serviceDescription: ''
  })

  const totalSteps = mode === 'stylist' && !isLogin ? 4 : (mode === 'client' && !isLogin ? 3 : 1)

  // Prevent background scroll when modal is open
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

    // Cleanup function
    return () => {
      // Restore body scroll
      document.body.style.overflow = originalStyle
      document.body.style.position = originalPosition
      document.body.style.top = ''
      document.body.style.width = ''

      // Restore scroll position
      window.scrollTo(0, scrollY)
    }
  }, [])

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required'
      } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
        newErrors.email = 'Valid email is required'
      }
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
      if (!isLogin) {
        if (!formData.password) newErrors.password = 'Password is required'
        if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
        if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the Terms of Service'
      }
    }

    if (step === 2 && !isLogin) {
      if (!formData.verificationCode.trim()) newErrors.verificationCode = 'Verification code is required'
      if (formData.verificationCode.length !== 6) newErrors.verificationCode = 'Code must be 6 digits'
    }

    if (step === 3 && mode === 'stylist' && !isLogin) {
      if (formData.services.length === 0) newErrors.services = 'Select at least one service'
      if (!formData.workLocation.address.trim()) newErrors.workLocation = 'Work address is required'
      if (!formData.workLocation.city.trim()) newErrors.city = 'City is required'
      if (!formData.workLocation.state.trim()) newErrors.state = 'State is required'
      if (!formData.serviceDescription.trim()) newErrors.serviceDescription = 'Service description is required'
    }

    if (step === 4 && mode === 'stylist' && !isLogin) {
      // Profile picture is optional during registration - can be added later in profile
      // if (!formData.profilePicture) newErrors.profilePicture = 'Profile picture is required'
      // Validate pricing for selected services
      for (const service of formData.services) {
        if (!formData.pricing[service]?.price) {
          newErrors[`pricing_${service}`] = `Price for ${service} is required`
        }
        if (!formData.pricing[service]?.duration) {
          newErrors[`duration_${service}`] = `Duration for ${service} is required`
        }
      }
    }

    const isValid = Object.keys(newErrors).length === 0

    console.log('🔍 BeautyCita Validation:', {
      step,
      isValid,
      errors: newErrors,
      formData: { ...formData, password: '[HIDDEN]', confirmPassword: '[HIDDEN]' }
    })

    setErrors(newErrors)
    return isValid
  }

  const sendVerificationCode = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone })
      })

      if (response.ok) {
        setSmsSentSuccessfully(true)
      } else {
        setSmsSentSuccessfully(false)
        // Still show a warning but don't block progression
        console.warn('SMS send failed, but allowing manual code entry')
      }

      // Always proceed to Step 2 regardless of SMS send result
      setCurrentStep(2)
    } catch (error) {
      // Even if there's an error, proceed to Step 2 for manual entry
      setSmsSentSuccessfully(false)
      setCurrentStep(2)
    } finally {
      setLoading(false)
    }
  }

  const verifyPhone = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formData.phone,
          code: formData.verificationCode
        })
      })

      if (!response.ok) {
        throw new Error('Invalid verification code')
      }

      setPhoneVerified(true)
      setCurrentStep(mode === 'stylist' ? 3 : currentStep + 1)
    } catch (error) {
      setErrors({ verificationCode: 'Invalid verification code' })
    } finally {
      setLoading(false)
    }
  }

  const handleNext = async () => {
    if (!validateStep(currentStep)) return

    if (currentStep === 1 && !isLogin) {
      await sendVerificationCode()
    } else if (currentStep === 2 && !phoneVerified) {
      await verifyPhone()
    } else {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    try {
      setLoading(true)
      const endpoint = isLogin
        ? '/api/auth/login'
        : mode === 'stylist'
          ? '/api/auth/register/stylist'
          : mode === 'admin'
            ? '/api/auth/register/admin'
            : '/api/auth/register/client'

      const submitData = isLogin
        ? { email: formData.email, password: formData.password }
        : formData

      console.log('🚀 BeautyCita Registration Debug:', {
        endpoint,
        submitData,
        currentStep,
        mode,
        isLogin
      })

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submitData)
      })

      const data = await response.json()

      console.log('📥 BeautyCita API Response:', {
        status: response.status,
        ok: response.ok,
        data
      })

      if (response.ok) {
        window.location.reload()
      } else {
        // Handle validation errors from backend
        if (data.errors) {
          setErrors(data.errors)
        } else {
          setErrors({ general: data.message || 'Registration failed' })
        }
      }
    } catch (error) {
      console.error('❌ BeautyCita Registration Error:', error)
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleAuth = () => {
    const googleUrl = mode === 'stylist'
      ? '/api/auth/google?role=stylist'
      : mode === 'admin'
        ? '/api/auth/google?role=admin'
        : '/api/auth/google?role=client'
    window.location.href = googleUrl
  }

  const handleServiceToggle = (serviceId: string) => {
    const newServices = formData.services.includes(serviceId)
      ? formData.services.filter(s => s !== serviceId)
      : [...formData.services, serviceId]

    handleInputChange('services', newServices)

    // Initialize pricing for new services
    if (!formData.services.includes(serviceId)) {
      setFormData(prev => ({
        ...prev,
        pricing: {
          ...prev.pricing,
          [serviceId]: { price: 0, duration: 60 }
        }
      }))
    }
  }

  const renderProgressBar = () => (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <React.Fragment key={i}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: i + 1 <= currentStep
                ? 'linear-gradient(135deg, var(--accent-rose), var(--accent-lavender))'
                : '#e0e0e0',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              {i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div style={{
                width: '40px',
                height: '2px',
                background: i + 1 < currentStep ? 'var(--accent-rose)' : '#e0e0e0',
                margin: '0 8px'
              }} />
            )}
          </React.Fragment>
        ))}
      </div>
      <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', margin: 0 }}>
        Step {currentStep} of {totalSteps}
      </p>
    </div>
  )

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={handleOverlayClick}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          width: '100%',
          maxWidth: mode === 'stylist' && !isLogin ? '600px' : '400px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666',
            padding: '4px'
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{
            fontSize: '28px',
            marginBottom: '8px',
            background: 'linear-gradient(135deg, var(--accent-rose), var(--accent-lavender))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {mode === 'stylist' ? 'Stylist' : mode === 'admin' ? 'Admin' : 'Client'} {isLogin ? 'Login' : 'Registration'}
          </h2>
          <p style={{ color: '#666', fontSize: '14px' }}>
            {isLogin
              ? 'Welcome back! Sign in to your account'
              : 'Create your account to get started'
            }
          </p>
        </div>

        {/* Progress Bar for Registration */}
        {!isLogin && renderProgressBar()}

        {/* Step Content */}
        <div style={{ minHeight: '300px' }}>
          {/* LOGIN FORM */}
          {isLogin && (
            <div>
              {/* Google Auth Button */}
              <div style={{ marginBottom: '24px' }}>
                <ResponsiveButton
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  variant="google"
                >
                  Sign in with Google
                </ResponsiveButton>
              </div>

              {/* Divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <div style={{ flex: 1, height: '1px', background: '#eee' }}></div>
                <span style={{ padding: '0 16px', color: '#999', fontSize: '14px' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: '#eee' }}></div>
              </div>

              {/* Email Login */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#333',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.email ? '1px solid #ff4444' : '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px',
                    opacity: loading ? 0.6 : 1
                  }}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <span style={{ color: '#ff4444', fontSize: '12px' }}>{errors.email}</span>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#333',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: errors.password ? '1px solid #ff4444' : '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px',
                    opacity: loading ? 0.6 : 1
                  }}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <span style={{ color: '#ff4444', fontSize: '12px' }}>{errors.password}</span>
                )}
              </div>
            </div>
          )}

          {/* REGISTRATION STEPS */}
          {!isLogin && (
            <div>
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div>
                  <h3 style={{ marginBottom: '20px', fontSize: '18px', color: '#333' }}>
                    Basic Information
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontSize: '14px', fontWeight: '500' }}>
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: errors.firstName ? '1px solid #ff4444' : '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '16px'
                        }}
                        placeholder="First name"
                      />
                      {errors.firstName && <span style={{ color: '#ff4444', fontSize: '12px' }}>{errors.firstName}</span>}
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontSize: '14px', fontWeight: '500' }}>
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: errors.lastName ? '1px solid #ff4444' : '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '16px'
                        }}
                        placeholder="Last name"
                      />
                      {errors.lastName && <span style={{ color: '#ff4444', fontSize: '12px' }}>{errors.lastName}</span>}
                    </div>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontSize: '14px', fontWeight: '500' }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: errors.email ? '1px solid #ff4444' : '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                      placeholder="Enter your email"
                    />
                    {errors.email && <span style={{ color: '#ff4444', fontSize: '12px' }}>{errors.email}</span>}
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontSize: '14px', fontWeight: '500' }}>
                      Mobile Phone *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: errors.phone ? '1px solid #ff4444' : '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                      placeholder="+1 (555) 123-4567"
                    />
                    {errors.phone && <span style={{ color: '#ff4444', fontSize: '12px' }}>{errors.phone}</span>}
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      We'll send a verification code to this number
                    </small>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontSize: '14px', fontWeight: '500' }}>
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: errors.dateOfBirth ? '1px solid #ff4444' : '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                    {errors.dateOfBirth && <span style={{ color: '#ff4444', fontSize: '12px' }}>{errors.dateOfBirth}</span>}
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      Your date of birth will not be displayed publicly
                    </small>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontSize: '14px', fontWeight: '500' }}>
                        Password *
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: errors.password ? '1px solid #ff4444' : '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '16px'
                        }}
                        placeholder="Password"
                      />
                      {errors.password && <span style={{ color: '#ff4444', fontSize: '12px' }}>{errors.password}</span>}
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontSize: '14px', fontWeight: '500' }}>
                        Confirm Password *
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: errors.confirmPassword ? '1px solid #ff4444' : '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '16px'
                        }}
                        placeholder="Confirm password"
                      />
                      {errors.confirmPassword && <span style={{ color: '#ff4444', fontSize: '12px' }}>{errors.confirmPassword}</span>}
                    </div>
                  </div>

                  {/* Terms Agreement */}
                  <div style={{
                    marginBottom: '20px',
                    padding: '16px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: errors.agreeToTerms ? '1px solid #ff4444' : '1px solid #e0e0e0'
                  }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      lineHeight: '1.4'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.agreeToTerms}
                        onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                        style={{
                          marginTop: '2px',
                          transform: 'scale(1.2)'
                        }}
                      />
                      <span>
                        I agree to the{' '}
                        <a href="/terms/client" target="_blank" style={{ color: 'var(--accent-rose)', textDecoration: 'none' }}>
                          Terms of Service
                        </a>
                        {mode === 'stylist' && (
                          <>
                            {' '}and{' '}
                            <a href="/terms/stylist" target="_blank" style={{ color: 'var(--accent-rose)', textDecoration: 'none' }}>
                              Stylist Terms & Conditions
                            </a>
                          </>
                        )}
                        . I understand that my phone number will be verified and I consent to receive SMS notifications.
                      </span>
                    </label>
                    {errors.agreeToTerms && (
                      <div style={{ color: '#ff4444', fontSize: '12px', marginTop: '8px' }}>
                        {errors.agreeToTerms}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Phone Verification */}
              {currentStep === 2 && (
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ marginBottom: '20px', fontSize: '18px', color: '#333' }}>
                    Phone Verification
                  </h3>

                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
                    {smsSentSuccessfully ? (
                      <>
                        <p style={{ color: '#666', marginBottom: '8px' }}>
                          We've sent a 6-digit verification code to:
                        </p>
                        <p style={{ fontWeight: 'bold', color: '#333', marginBottom: '20px' }}>
                          {formData.phone}
                        </p>
                      </>
                    ) : (
                      <>
                        <p style={{ color: '#ff9800', marginBottom: '8px' }}>
                          ⚠️ We couldn't send the SMS automatically
                        </p>
                        <p style={{ color: '#666', marginBottom: '8px', fontSize: '14px' }}>
                          You can still enter your verification code manually if you received it,
                          or try resending the code.
                        </p>
                        <p style={{ fontWeight: 'bold', color: '#333', marginBottom: '20px' }}>
                          Phone: {formData.phone}
                        </p>
                      </>
                    )}
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontSize: '14px', fontWeight: '500' }}>
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={formData.verificationCode}
                      onChange={(e) => handleInputChange('verificationCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                      style={{
                        width: '100%',
                        padding: '16px',
                        border: errors.verificationCode ? '1px solid #ff4444' : '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '24px',
                        textAlign: 'center',
                        letterSpacing: '8px'
                      }}
                      placeholder="000000"
                      maxLength={6}
                    />
                    {errors.verificationCode && (
                      <span style={{ color: '#ff4444', fontSize: '12px' }}>{errors.verificationCode}</span>
                    )}
                  </div>

                  <p style={{ color: '#666', fontSize: '14px' }}>
                    {smsSentSuccessfully ? "Didn't receive the code?" : "Need to resend the code?"}{' '}
                    <button
                      onClick={async () => {
                        setLoading(true)
                        try {
                          const response = await fetch('/api/auth/send-verification', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ phone: formData.phone })
                          })
                          if (response.ok) {
                            setSmsSentSuccessfully(true)
                            setErrors({})
                          } else {
                            setErrors({ verificationCode: 'Failed to resend code, but you can still enter it manually' })
                          }
                        } catch (error) {
                          setErrors({ verificationCode: 'Failed to resend code, but you can still enter it manually' })
                        } finally {
                          setLoading(false)
                        }
                      }}
                      disabled={loading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-rose)',
                        textDecoration: 'underline',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      {loading ? 'Sending...' : 'Resend Code'}
                    </button>
                  </p>
                </div>
              )}

              {/* Step 3: Stylist Business Information */}
              {currentStep === 3 && mode === 'stylist' && (
                <div>
                  <h3 style={{ marginBottom: '20px', fontSize: '18px', color: '#333' }}>
                    Business Information
                  </h3>

                  {/* Services Offered */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '12px', color: '#333', fontSize: '14px', fontWeight: '500' }}>
                      Services You Offer *
                    </label>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px'
                    }}>
                      {serviceCategories.map(service => (
                        <label
                          key={service.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px',
                            border: formData.services.includes(service.id)
                              ? '2px solid var(--accent-rose)'
                              : '1px solid #ddd',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            background: formData.services.includes(service.id) ? '#fef7f7' : 'white',
                            fontSize: '14px'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={formData.services.includes(service.id)}
                            onChange={() => handleServiceToggle(service.id)}
                            style={{ display: 'none' }}
                          />
                          <span style={{ fontSize: '20px' }}>{service.icon}</span>
                          <span>{service.name}</span>
                        </label>
                      ))}
                    </div>
                    {errors.services && (
                      <span style={{ color: '#ff4444', fontSize: '12px' }}>{errors.services}</span>
                    )}
                  </div>

                  {/* Work Location */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontSize: '14px', fontWeight: '500' }}>
                      Work Location *
                    </label>
                    <input
                      type="text"
                      value={formData.workLocation.address}
                      onChange={(e) => handleInputChange('workLocation', { ...formData.workLocation, address: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: errors.workLocation ? '1px solid #ff4444' : '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '16px',
                        marginBottom: '12px'
                      }}
                      placeholder="Street address"
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                      <input
                        type="text"
                        value={formData.workLocation.city}
                        onChange={(e) => handleInputChange('workLocation', { ...formData.workLocation, city: e.target.value })}
                        style={{
                          padding: '12px',
                          border: errors.city ? '1px solid #ff4444' : '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '16px'
                        }}
                        placeholder="City"
                      />
                      <input
                        type="text"
                        value={formData.workLocation.state}
                        onChange={(e) => handleInputChange('workLocation', { ...formData.workLocation, state: e.target.value })}
                        style={{
                          padding: '12px',
                          border: errors.state ? '1px solid #ff4444' : '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '16px'
                        }}
                        placeholder="State"
                      />
                      <input
                        type="text"
                        value={formData.workLocation.zipCode}
                        onChange={(e) => handleInputChange('workLocation', { ...formData.workLocation, zipCode: e.target.value })}
                        style={{
                          padding: '12px',
                          border: '1px solid #ddd',
                          borderRadius: '8px',
                          fontSize: '16px'
                        }}
                        placeholder="ZIP"
                      />
                    </div>
                    {errors.workLocation && (
                      <span style={{ color: '#ff4444', fontSize: '12px' }}>{errors.workLocation}</span>
                    )}
                    {errors.city && (
                      <span style={{ color: '#ff4444', fontSize: '12px', display: 'block' }}>{errors.city}</span>
                    )}
                    {errors.state && (
                      <span style={{ color: '#ff4444', fontSize: '12px', display: 'block' }}>{errors.state}</span>
                    )}
                  </div>

                  {/* Salon Phone (Optional) */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontSize: '14px', fontWeight: '500' }}>
                      Salon Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.salonPhone}
                      onChange={(e) => handleInputChange('salonPhone', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                      placeholder="Salon or business phone number"
                    />
                    <small style={{ color: '#666', fontSize: '12px' }}>
                      If different from your personal phone number
                    </small>
                  </div>

                  {/* Service Description */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontSize: '14px', fontWeight: '500' }}>
                      Service Description *
                    </label>
                    <textarea
                      value={formData.serviceDescription}
                      onChange={(e) => handleInputChange('serviceDescription', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: errors.serviceDescription ? '1px solid #ff4444' : '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '16px',
                        minHeight: '100px',
                        resize: 'vertical'
                      }}
                      placeholder="Describe your services, specialties, and what makes you unique..."
                    />
                    {errors.serviceDescription && (
                      <span style={{ color: '#ff4444', fontSize: '12px' }}>{errors.serviceDescription}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Profile & Pricing (Stylist Only) */}
              {currentStep === 4 && mode === 'stylist' && (
                <div>
                  <h3 style={{ marginBottom: '20px', fontSize: '18px', color: '#333' }}>
                    Profile & Pricing
                  </h3>

                  {/* Profile Picture */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#333', fontSize: '14px', fontWeight: '500' }}>
                      Profile Picture *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleInputChange('profilePicture', e.target.files?.[0] || null)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: errors.profilePicture ? '1px solid #ff4444' : '1px solid #ddd',
                        borderRadius: '8px',
                        fontSize: '16px'
                      }}
                    />
                    {errors.profilePicture && (
                      <span style={{ color: '#ff4444', fontSize: '12px' }}>{errors.profilePicture}</span>
                    )}
                  </div>

                  {/* Pricing for Selected Services */}
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ marginBottom: '16px', color: '#333', fontSize: '16px' }}>
                      Set Pricing for Your Services
                    </h4>
                    {formData.services.map(serviceId => {
                      const service = serviceCategories.find(s => s.id === serviceId)
                      return (
                        <div key={serviceId} style={{
                          marginBottom: '16px',
                          padding: '16px',
                          border: '1px solid #ddd',
                          borderRadius: '8px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <span style={{ fontSize: '20px' }}>{service?.icon}</span>
                            <strong>{service?.name}</strong>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#666' }}>
                                Price ($)
                              </label>
                              <input
                                type="number"
                                value={formData.pricing[serviceId]?.price || ''}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  pricing: {
                                    ...prev.pricing,
                                    [serviceId]: {
                                      ...prev.pricing[serviceId],
                                      price: parseFloat(e.target.value) || 0
                                    }
                                  }
                                }))}
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  border: errors[`pricing_${serviceId}`] ? '1px solid #ff4444' : '1px solid #ddd',
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                                placeholder="0"
                              />
                              {errors[`pricing_${serviceId}`] && (
                                <span style={{ color: '#ff4444', fontSize: '10px' }}>{errors[`pricing_${serviceId}`]}</span>
                              )}
                            </div>
                            <div>
                              <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#666' }}>
                                Duration (minutes)
                              </label>
                              <input
                                type="number"
                                value={formData.pricing[serviceId]?.duration || ''}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  pricing: {
                                    ...prev.pricing,
                                    [serviceId]: {
                                      ...prev.pricing[serviceId],
                                      duration: parseInt(e.target.value) || 0
                                    }
                                  }
                                }))}
                                style={{
                                  width: '100%',
                                  padding: '8px',
                                  border: errors[`duration_${serviceId}`] ? '1px solid #ff4444' : '1px solid #ddd',
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}
                                placeholder="60"
                              />
                              {errors[`duration_${serviceId}`] && (
                                <span style={{ color: '#ff4444', fontSize: '10px' }}>{errors[`duration_${serviceId}`]}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Messages */}
        {errors.general && (
          <div style={{
            marginBottom: '20px',
            padding: '12px',
            background: '#fee',
            color: '#c33',
            borderRadius: '8px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {errors.general}
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '24px'
        }}>
          {/* Previous Button */}
          {!isLogin && currentStep > 1 && (
            <ResponsiveButton
              onClick={handlePrevious}
              disabled={loading}
              variant="secondary"
            >
              Previous
            </ResponsiveButton>
          )}

          <div style={{ flex: 1 }} />

          {/* Next/Submit Button */}
          <ResponsiveButton
            onClick={isLogin || currentStep === totalSteps ? handleSubmit : handleNext}
            disabled={loading}
            loading={loading}
            variant="primary"
          >
            {loading
              ? 'Please wait...'
              : isLogin
                ? 'Sign In'
                : currentStep === totalSteps
                  ? 'Complete Registration'
                  : currentStep === 1
                    ? 'Send Code & Continue'
                    : 'Next'
            }
          </ResponsiveButton>
        </div>

        {/* Toggle Login/Register */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <ResponsiveButton
            onClick={() => {
              setIsLogin(!isLogin)
              setCurrentStep(1)
              setErrors({})
            }}
            disabled={loading}
            variant="text"
          >
            {isLogin
              ? `Need a ${mode} account? Sign up`
              : `Already have a ${mode} account? Sign in`
            }
          </ResponsiveButton>
        </div>
      </div>
    </div>
  )
}

export default EnhancedSignupModal