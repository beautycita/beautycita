import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  UserCircleIcon,
  CameraIcon,
  ArrowLeftIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface ProfileEditForm {
  firstName: string
  lastName: string
  phone: string
  profilePictureUrl?: string
}

export default function ProfileEditPage() {
  const { user, updateProfile } = useAuthStore()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    user?.profilePictureUrl || user?.profileImage || null
  )

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileEditForm>({
    defaultValues: {
      firstName: user?.firstName || user?.first_name || '',
      lastName: user?.lastName || user?.last_name || '',
      phone: user?.phone || '',
      profilePictureUrl: user?.profilePictureUrl || user?.profileImage || ''
    }
  })

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('profileEdit.errors.invalidFileType'))
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('profileEdit.errors.imageTooLarge'))
      return
    }

    setUploading(true)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('profilePicture', file)

      // Upload to server
      const { apiClient } = await import('../../services/api')
      const response = await apiClient.uploadFile('/user/profile/picture', formData)

      if (response.success && response.data) {
        const uploadedUrl = response.data.profilePictureUrl
        setPreviewUrl(uploadedUrl)
        setValue('profilePictureUrl', uploadedUrl)
        toast.success(t('profileEdit.uploadSuccess'))
      } else {
        throw new Error(response.error || t('profileEdit.errors.uploadFailed'))
      }
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error(error.message || t('profileEdit.errors.uploadFailed'))
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: ProfileEditForm) => {
    try {
      const success = await updateProfile(data)

      if (success) {
        toast.success(t('profileEdit.updateSuccess'))
        navigate('/profile')
      } else {
        toast.error(t('profileEdit.errors.updateFailed'))
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error(t('profileEdit.errors.updateError'))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="container-responsive py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center space-x-4"
          >
            <button
              onClick={() => navigate('/profile')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900">
                {t('profileEdit.title')}
              </h1>
              <p className="text-gray-600">
                {t('profileEdit.subtitle')}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Edit Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-2xl mx-auto"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="card">
            <div className="card-body space-y-6">
              {/* Profile Picture */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div
                    onClick={handleImageClick}
                    className="cursor-pointer group"
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Profile"
                        className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center border-4 border-white shadow-lg">
                        <UserCircleIcon className="h-20 w-20 text-primary-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                      <CameraIcon className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <p className="text-sm text-gray-500 text-center">
                  {t('profileEdit.uploadInstruction')}
                  <br />
                  <span className="text-xs">{t('profileEdit.fileTypeHint')}</span>
                </p>
              </div>

              {/* First Name */}
              <div className="form-group">
                <label htmlFor="firstName" className="label">
                  {t('profileEdit.fields.firstName')} *
                </label>
                <input
                  {...register('firstName', {
                    required: t('profileEdit.validation.firstNameRequired'),
                    minLength: {
                      value: 2,
                      message: t('profileEdit.validation.firstNameMinLength')
                    }
                  })}
                  type="text"
                  id="firstName"
                  className={`input ${errors.firstName ? 'input-error' : ''}`}
                  placeholder={t('profileEdit.placeholders.firstName')}
                />
                {errors.firstName && (
                  <p className="form-error">{errors.firstName.message}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="form-group">
                <label htmlFor="lastName" className="label">
                  {t('profileEdit.fields.lastName')} *
                </label>
                <input
                  {...register('lastName', {
                    required: t('profileEdit.validation.lastNameRequired'),
                    minLength: {
                      value: 2,
                      message: t('profileEdit.validation.lastNameMinLength')
                    }
                  })}
                  type="text"
                  id="lastName"
                  className={`input ${errors.lastName ? 'input-error' : ''}`}
                  placeholder={t('profileEdit.placeholders.lastName')}
                />
                {errors.lastName && (
                  <p className="form-error">{errors.lastName.message}</p>
                )}
              </div>

              {/* Phone */}
              <div className="form-group">
                <label htmlFor="phone" className="label">
                  {t('profileEdit.fields.phone')}
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  id="phone"
                  className="input"
                  placeholder={t('profileEdit.placeholders.phone')}
                />
              </div>

              {/* Email (Read-only) */}
              <div className="form-group">
                <label className="label">
                  {t('profileEdit.fields.email')}
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="input bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('profileEdit.emailHint')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="btn btn-outline flex-1 rounded-full"
                  disabled={isSubmitting}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploading}
                  className="btn btn-primary flex-1 flex items-center justify-center space-x-2 rounded-full"
                >
                  {isSubmitting ? (
                    <div className="loading-spinner" />
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>{t('profileEdit.saveChanges')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
