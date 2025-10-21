import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { motion } from 'framer-motion'
import {
  AtSymbolIcon,
  EnvelopeIcon,
  UserCircleIcon,
  CheckCircleIcon,
  SparklesIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

const AVATARS = [
  '/media/img/avatar/A0.webp',
  '/media/img/avatar/A1.webp',
  '/media/img/avatar/A2.webp',
  '/media/img/avatar/A4.webp',
  '/media/img/avatar/A5.webp',
  '/media/img/avatar/A6.webp',
  '/media/img/avatar/A7.webp',
  '/media/img/avatar/A8.webp',
  '/media/img/avatar/A9.webp',
  '/media/img/avatar/A10.webp',
  '/media/img/avatar/A11.webp',
  '/media/img/avatar/A12.webp',
]

// Validation schemas for each step
const step1Schema = Yup.object({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .matches(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers, and underscores')
    .required('Username is required')
})

const step2Schema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  verificationCode: Yup.string()
    .matches(/^[0-9]{6}$/, 'Code must be 6 digits')
    .required('Verification code is required')
})

const step3Schema = Yup.object({
  selectedAvatar: Yup.string().nullable(),
  uploadedFile: Yup.mixed().nullable()
}).test('avatar-required', 'Please select or upload an avatar', function(values) {
  return values.selectedAvatar || values.uploadedFile
})

const step4Schema = Yup.object({
  // No validation needed for final welcome step
})

export default function FormikOnboardingPage() {
  const { updateProfile, user } = useAuthStore()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)

  // Prevent access if onboarding is already complete
  useEffect(() => {
    if (user?.profileComplete || user?.profile_complete) {
      toast('You have already completed onboarding', { icon: 'ℹ️' })
      navigate('/panel', { replace: true })
    }
  }, [user, navigate])

  const initialValues = {
    username: '',
    email: '',
    verificationCode: '',
    selectedAvatar: null as string | null,
    uploadedFile: null as File | null
  }

  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setUsernameChecking(true)
    try {
      const token = localStorage.getItem('beautycita-auth')
        ? JSON.parse(localStorage.getItem('beautycita-auth')!).state.token
        : ''

      const response = await axios.get(
        `${API_URL}/api/user/username/availability/${username}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      setUsernameAvailable(response.data.available)
      return response.data.available
    } catch (error) {
      console.error('Username check error:', error)
      setUsernameAvailable(false)
      return false
    } finally {
      setUsernameChecking(false)
    }
  }

  const sendVerificationCode = async (email: string) => {
    try {
      await axios.post(`${API_URL}/api/verify/send-email-code`, { email })
      setCodeSent(true)
      toast.success('Verification code sent!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send code')
    }
  }

  const handleSubmit = async (values: typeof initialValues) => {
    console.log('[FORMIK_ONBOARDING] Final submit:', values)

    const token = localStorage.getItem('beautycita-auth')
      ? JSON.parse(localStorage.getItem('beautycita-auth')!).state.token
      : ''

    try {
      // 1. Save username
      await updateProfile({ username: values.username })

      // 2. Verify email code and save
      const verifyResponse = await axios.post(`${API_URL}/api/verify/verify-email`, {
        email: values.email,
        code: values.verificationCode
      })

      if (!verifyResponse.data.success) {
        toast.error('Invalid verification code')
        setCurrentStep(2)
        return
      }

      await updateProfile({ email: values.email, emailVerified: true })

      // 3. Save avatar
      if (values.uploadedFile) {
        const formData = new FormData()
        formData.append('profilePicture', values.uploadedFile)
        await axios.post(`${API_URL}/api/user/profile/picture`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        })
      } else if (values.selectedAvatar) {
        await updateProfile({ profilePictureUrl: values.selectedAvatar })
      }

      // 4. Mark complete and wait for state to persist
      console.log('[ONBOARDING] Marking profile as complete...')
      const success = await updateProfile({ profile_complete: true })
      
      if (!success) {
        console.error('[ONBOARDING] Failed to mark profile complete')
        toast.error('Failed to save profile. Please try again.')
        return
      }
      
      console.log('[ONBOARDING] Profile marked complete, waiting for state to persist...')
      
      // Wait 500ms for Zustand persist to flush to localStorage
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log('[ONBOARDING] Redirecting to panel...')
      toast.success('Welcome to BeautyCita!')

      // Use window.location for full page reload to ensure state is fresh
      window.location.href = '/panel'
    } catch (error: any) {
      console.error('[FORMIK_ONBOARDING] Error:', error)
      toast.error(error.response?.data?.message || 'Failed to complete onboarding')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-3xl flex items-center justify-center">
              <SparklesIcon className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-serif font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              BeautyCita
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">Step {currentStep} of 4</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-600"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / 4) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
        <Formik
          initialValues={initialValues}
          validationSchema={
            currentStep === 1 ? step1Schema :
            currentStep === 2 ? step2Schema :
            currentStep === 3 ? step3Schema :
            step4Schema
          }
          onSubmit={handleSubmit}
          validateOnChange={true}
          validateOnBlur={true}
        >
          {({ values, errors, touched, setFieldValue, validateForm }) => (
            <Form>
              {/* STEP 1: Username */}
              {currentStep === 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <AtSymbolIcon className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                      Choose Your Username
                    </h2>
                    <p className="text-gray-600">Pick a unique @username</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500 text-lg font-bold">@</span>
                        <Field
                          name="username"
                          type="text"
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all font-medium"
                          placeholder="username"
                          maxLength={20}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                            setFieldValue('username', value)
                            if (value.length >= 3) {
                              checkUsernameAvailability(value)
                            } else {
                              setUsernameAvailable(null)
                            }
                          }}
                        />
                      </div>
                      <ErrorMessage name="username" component="div" className="text-sm text-red-600 mt-1" />
                      {usernameChecking && (
                        <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                          <span className="animate-spin">✨</span> Checking availability...
                        </p>
                      )}
                      {usernameAvailable === true && (
                        <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircleIcon className="w-4 h-4" /> Available!
                        </p>
                      )}
                      {usernameAvailable === false && (
                        <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                          <XMarkIcon className="w-4 h-4" /> Already taken
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        const formErrors = await validateForm()
                        if (!formErrors.username && usernameAvailable === true) {
                          console.log('[FORMIK_ONBOARDING] Step 1 -> Step 2')
                          setCurrentStep(2)
                        } else {
                          toast.error('Please fix the errors before continuing')
                        }
                      }}
                      disabled={!values.username || usernameAvailable !== true || !!errors.username}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      Continue →
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Email */}
              {currentStep === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <EnvelopeIcon className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      Verify Your Email
                    </h2>
                    <p className="text-gray-600">We'll send you a magic code</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <div className="flex gap-2">
                        <Field
                          name="email"
                          type="email"
                          disabled={codeSent}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all font-medium disabled:opacity-60"
                          placeholder="you@example.com"
                        />
                        {!codeSent && (
                          <button
                            type="button"
                            onClick={() => sendVerificationCode(values.email)}
                            disabled={!values.email || !!errors.email}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            Send Code
                          </button>
                        )}
                      </div>
                      <ErrorMessage name="email" component="div" className="text-sm text-red-600 mt-1" />
                    </div>

                    {codeSent && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                        <Field
                          name="verificationCode"
                          type="text"
                          maxLength={6}
                          className="w-full px-4 py-3 border border-gray-300 rounded-3xl text-center text-3xl font-bold font-mono tracking-widest focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all"
                          placeholder="000000"
                        />
                        <ErrorMessage name="verificationCode" component="div" className="text-sm text-red-600 mt-1" />
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          console.log('[FORMIK_ONBOARDING] Step 2 -> Step 1')
                          setCurrentStep(1)
                        }}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-3xl hover:bg-gray-50 transition-all duration-200"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const formErrors = await validateForm()
                          if (!formErrors.email && !formErrors.verificationCode && codeSent) {
                            console.log('[FORMIK_ONBOARDING] Step 2 -> Step 3')
                            setCurrentStep(3)
                          } else if (!codeSent) {
                            await sendVerificationCode(values.email)
                          } else {
                            toast.error('Please fix the errors before continuing')
                          }
                        }}
                        disabled={!codeSent || !values.verificationCode || values.verificationCode.length !== 6}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        Continue →
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Avatar */}
              {currentStep === 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <UserCircleIcon className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                      Choose Your Avatar
                    </h2>
                    <p className="text-gray-600">Select or upload your profile picture</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">Predefined Avatars</label>
                      <div className="grid grid-cols-4 gap-3">
                        {AVATARS.map((avatar) => (
                          <button
                            key={avatar}
                            type="button"
                            onClick={() => {
                              setFieldValue('selectedAvatar', avatar)
                              setFieldValue('uploadedFile', null)
                              setUploadPreview(null)
                            }}
                            className={`relative aspect-square rounded-3xl overflow-hidden border-4 transition-all duration-200 ${
                              values.selectedAvatar === avatar
                                ? 'border-purple-500 shadow-lg scale-105'
                                : 'border-gray-200 hover:border-purple-300 hover:scale-105'
                            }`}
                          >
                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                            {values.selectedAvatar === avatar && (
                              <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                                <CheckCircleIcon className="w-8 h-8 text-white drop-shadow-lg" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500">or</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Upload Your Photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error('File must be less than 5MB')
                              return
                            }
                            setFieldValue('uploadedFile', file)
                            setFieldValue('selectedAvatar', null)
                            setUploadPreview(URL.createObjectURL(file))
                          }
                        }}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <label
                        htmlFor="avatar-upload"
                        className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-3xl cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-all"
                      >
                        {uploadPreview ? (
                          <div className="flex items-center gap-4">
                            <img src={uploadPreview} alt="Preview" className="w-20 h-20 rounded-3xl object-cover border-4 border-purple-200" />
                            <div className="text-left">
                              <p className="text-sm font-semibold text-gray-900">Photo uploaded</p>
                              <p className="text-sm text-gray-600">Click to change</p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-3">
                              <UserCircleIcon className="w-6 h-6 text-white" />
                            </div>
                            <p className="text-sm font-semibold text-gray-900">Click to upload</p>
                            <p className="text-xs text-gray-500 mt-1">Max 5MB (JPG, PNG, WEBP)</p>
                          </div>
                        )}
                      </label>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          console.log('[FORMIK_ONBOARDING] Step 3 -> Step 2')
                          setCurrentStep(2)
                        }}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-3xl hover:bg-gray-50 transition-all duration-200"
                      >
                        ← Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (values.selectedAvatar || values.uploadedFile) {
                            console.log('[FORMIK_ONBOARDING] Step 3 -> Step 4')
                            setCurrentStep(4)
                          } else {
                            toast.error('Please select or upload an avatar')
                          }
                        }}
                        disabled={!values.selectedAvatar && !values.uploadedFile}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        Continue →
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 4: Complete */}
              {currentStep === 4 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <CheckCircleIcon className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                      You're All Set!
                    </h2>
                    <p className="text-gray-600">Your profile is complete. Welcome to BeautyCita!</p>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-6 border border-green-200">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                          <SparklesIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 mb-3">What's Next?</h3>
                          <ul className="space-y-3 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                              <span className="text-green-600 mt-0.5 font-bold">✓</span>
                              <span>Explore stylists and services near you</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-600 mt-0.5 font-bold">✓</span>
                              <span>Book your first appointment</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-600 mt-0.5 font-bold">✓</span>
                              <span>Add payment methods when booking</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-600 mt-0.5 font-bold">✓</span>
                              <span>Enjoy personalized beauty recommendations</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          console.log('[FORMIK_ONBOARDING] Step 4 -> Step 3')
                          setCurrentStep(3)
                        }}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-3xl hover:bg-gray-50 transition-all duration-200"
                      >
                        ← Back
                      </button>
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-6 rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                        Get Started!
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </Form>
          )}
        </Formik>
        </div>
      </motion.div>
    </div>
  )
}
