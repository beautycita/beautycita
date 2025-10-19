import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  UserCircleIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import LocationPicker from '../../components/ui/LocationPicker'
import toast from 'react-hot-toast'
import axios from 'axios'

interface StylistProfileForm {
  firstName: string
  lastName: string
  phone: string
  email: string
  bio: string
  locationAddress: string
  locationCity: string
  locationState: string
  locationCountry: string
  locationLat: number | null
  locationLng: number | null
  instagramUrl?: string
  facebookUrl?: string
  tiktokUrl?: string
}

export default function StylistProfileEditPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stylistData, setStylistData] = useState<any>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StylistProfileForm>()

  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true'
    setIsDarkMode(darkMode)
    fetchStylistData()
  }, [])

  const fetchStylistData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/stylist/profile', {
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = response.data
      setStylistData(data)

      // Set form values
      setValue('firstName', data.firstName || data.first_name || '')
      setValue('lastName', data.lastName || data.last_name || '')
      setValue('phone', data.phone || '')
      setValue('email', data.email || '')
      setValue('bio', data.bio || '')
      setValue('locationAddress', data.locationAddress || data.location_address || '')
      setValue('locationCity', data.locationCity || data.location_city || '')
      setValue('locationState', data.locationState || data.location_state || '')
      setValue('locationCountry', data.locationCountry || data.location_country || 'Mexico')
      setValue('locationLat', data.locationLat || data.location_lat || null)
      setValue('locationLng', data.locationLng || data.location_lng || null)
      setValue('instagramUrl', data.instagramUrl || data.instagram_url || '')
      setValue('facebookUrl', data.facebookUrl || data.facebook_url || '')
      setValue('tiktokUrl', data.tiktokUrl || data.tiktok_url || '')
    } catch (error) {
      console.error('Error fetching stylist data:', error)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelect = (location: {
    address: string
    city: string
    state: string
    country: string
    lat: number
    lng: number
  }) => {
    setValue('locationAddress', location.address)
    setValue('locationCity', location.city)
    setValue('locationState', location.state)
    setValue('locationCountry', location.country)
    setValue('locationLat', location.lat)
    setValue('locationLng', location.lng)
  }

  const onSubmit = async (data: StylistProfileForm) => {
    try {
      const token = localStorage.getItem('token')

      const response = await axios.put('/api/stylist/profile', data, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response.data.success) {
        toast.success(t('profile.updateSuccess') || 'Profile updated successfully!')
        navigate('/dashboard')
      } else {
        toast.error(t('profile.updateError') || 'Failed to update profile')
      }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.response?.data?.message || 'An error occurred while updating profile')
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500" />
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} py-8`}>
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex items-center gap-2 mb-4 ${
              isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            } transition-colors`}
          >
            <ArrowLeftIcon className="h-5 w-5" />
            {t('common.back') || 'Back to Dashboard'}
          </button>

          <h1 className={`text-4xl font-serif font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {t('profile.editTitle') || 'Edit Your Profile'}
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {t('profile.editSubtitle') || 'Update your professional information and location'}
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit(onSubmit)}
          className={`rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg p-8`}
        >
          {/* Personal Information */}
          <div className="mb-8">
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('profile.personalInfo') || 'Personal Information'}
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('auth.firstName') || 'First Name'}
                </label>
                <input
                  {...register('firstName', { required: true })}
                  className={`w-full px-4 py-3 rounded-3xl ${
                    isDarkMode
                      ? 'bg-gray-700 text-white border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  } border focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{t('auth.validation.firstNameRequired')}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('auth.lastName') || 'Last Name'}
                </label>
                <input
                  {...register('lastName', { required: true })}
                  className={`w-full px-4 py-3 rounded-3xl ${
                    isDarkMode
                      ? 'bg-gray-700 text-white border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  } border focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{t('auth.validation.lastNameRequired')}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <PhoneIcon className="h-5 w-5 inline mr-2" />
                  {t('auth.phone') || 'Phone'}
                </label>
                <input
                  {...register('phone', { required: true })}
                  type="tel"
                  className={`w-full px-4 py-3 rounded-3xl ${
                    isDarkMode
                      ? 'bg-gray-700 text-white border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  } border focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{t('auth.validation.phoneRequired')}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <EnvelopeIcon className="h-5 w-5 inline mr-2" />
                  {t('auth.email') || 'Email'}
                </label>
                <input
                  {...register('email', { required: true })}
                  type="email"
                  className={`w-full px-4 py-3 rounded-3xl ${
                    isDarkMode
                      ? 'bg-gray-700 text-white border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  } border focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{t('auth.validation.emailRequired')}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('profile.bio') || 'Professional Bio'}
              </label>
              <textarea
                {...register('bio')}
                rows={4}
                placeholder={t('profile.bioPlaceholder') || 'Tell clients about your experience and specialties...'}
                className={`w-full px-4 py-3 rounded-3xl ${
                  isDarkMode
                    ? 'bg-gray-700 text-white border-gray-600'
                    : 'bg-white text-gray-900 border-gray-300'
                } border focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
              />
            </div>
          </div>

          {/* Location with Google Maps */}
          <div className="mb-8">
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <MapPinIcon className="h-6 w-6 inline mr-2" />
              {t('profile.location') || 'Business Location'}
            </h2>

            <LocationPicker
              onLocationSelect={handleLocationSelect}
              initialAddress={watch('locationAddress')}
              placeholder={t('profile.locationPlaceholder') || 'Enter your business address'}
              isDarkMode={isDarkMode}
            />

            {/* Hidden inputs for form validation */}
            <input {...register('locationAddress', { required: true })} type="hidden" />
            <input {...register('locationCity', { required: true })} type="hidden" />
            <input {...register('locationState', { required: true })} type="hidden" />
            <input {...register('locationCountry')} type="hidden" />
            <input {...register('locationLat')} type="hidden" />
            <input {...register('locationLng')} type="hidden" />

            {(errors.locationAddress || errors.locationCity || errors.locationState) && (
              <p className="text-red-500 text-sm mt-2">
                {t('auth.validation.locationRequired') || 'Please select a complete address from the suggestions'}
              </p>
            )}

            {watch('locationAddress') && (
              <div className={`mt-4 p-4 rounded-3xl ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <strong>{t('profile.selectedLocation') || 'Selected Location'}:</strong>
                </p>
                <p className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {watch('locationAddress')}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {watch('locationCity')}, {watch('locationState')}, {watch('locationCountry')}
                </p>
              </div>
            )}
          </div>

          {/* Social Media */}
          <div className="mb-8">
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('profile.socialMedia') || 'Social Media (Optional)'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Instagram
                </label>
                <input
                  {...register('instagramUrl')}
                  type="url"
                  placeholder="https://instagram.com/yourusername"
                  className={`w-full px-4 py-3 rounded-3xl ${
                    isDarkMode
                      ? 'bg-gray-700 text-white border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  } border focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Facebook
                </label>
                <input
                  {...register('facebookUrl')}
                  type="url"
                  placeholder="https://facebook.com/yourpage"
                  className={`w-full px-4 py-3 rounded-3xl ${
                    isDarkMode
                      ? 'bg-gray-700 text-white border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  } border focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  TikTok
                </label>
                <input
                  {...register('tiktokUrl')}
                  type="url"
                  placeholder="https://tiktok.com/@yourusername"
                  className={`w-full px-4 py-3 rounded-3xl ${
                    isDarkMode
                      ? 'bg-gray-700 text-white border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  } border focus:ring-2 focus:ring-pink-500 focus:border-transparent`}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className={`flex-1 px-6 py-3 rounded-3xl font-semibold ${
                isDarkMode
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              } transition-colors`}
            >
              {t('common.cancel') || 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-3xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  {t('common.saving') || 'Saving...'}
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5" />
                  {t('profile.saveChanges') || 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </motion.form>
      </div>
    </div>
  )
}
