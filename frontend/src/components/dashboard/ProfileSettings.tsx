import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  UserCircleIcon,
  CameraIcon,
  CheckCircleIcon,
  XMarkIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import axios from 'axios'
import toast from 'react-hot-toast'
import { startRegistration } from '@simplewebauthn/browser'

const API_URL = import.meta.env.VITE_API_URL || ''

interface BiometricDevice {
  id: string
  device_name: string
  created_at: string
  last_used_at?: string
  transports: string[]
}

interface ProfileSettingsProps {
  onClose: () => void
}

export default function ProfileSettings({ onClose }: ProfileSettingsProps) {
  const { user, updateProfile } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    user?.profilePictureUrl || user?.profileImage || null
  )

  const [formData, setFormData] = useState({
    firstName: user?.firstName || user?.first_name || '',
    lastName: user?.lastName || user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    profilePictureUrl: user?.profilePictureUrl || user?.profileImage || ''
  })

  const [biometricDevices, setBiometricDevices] = useState<BiometricDevice[]>([])
  const [loadingDevices, setLoadingDevices] = useState(false)
  const [addingDevice, setAddingDevice] = useState(false)

  useEffect(() => {
    if (activeTab === 'security') {
      fetchBiometricDevices()
    }
  }, [activeTab])

  const fetchBiometricDevices = async () => {
    try {
      setLoadingDevices(true)
      const response = await axios.get(`${API_URL}/api/webauthn/credentials`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('beautycita-auth-token')}` }
      })

      if (response.data.success) {
        setBiometricDevices(response.data.credentials || [])
      }
    } catch (error: any) {
      console.error('Failed to fetch biometric devices:', error)
    } finally {
      setLoadingDevices(false)
    }
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploading(true)

    try {
      // Create FormData for file upload
      const formDataUpload = new FormData()
      formDataUpload.append('profilePicture', file)

      // Upload to server
      const { apiClient } = await import('../../services/api')
      const response = await apiClient.uploadFile('/user/profile/picture', formDataUpload)

      if (response.success && response.data) {
        const uploadedUrl = response.data.profilePictureUrl
        setPreviewUrl(uploadedUrl)
        setFormData({ ...formData, profilePictureUrl: uploadedUrl })
        toast.success('Profile picture uploaded successfully!')
      } else {
        throw new Error(response.error || 'Failed to upload image')
      }
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error(error.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      const success = await updateProfile(formData)

      if (success) {
        toast.success('Profile updated successfully! ✨')
      } else {
        toast.error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAddBiometric = async () => {
    try {
      setAddingDevice(true)

      // Get registration options from server
      const optionsResponse = await axios.post(
        `${API_URL}/api/webauthn/register/options`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('beautycita-auth-token')}` }}
      )

      if (!optionsResponse.data.success) {
        throw new Error(optionsResponse.data.message || 'Failed to get registration options')
      }

      const options = optionsResponse.data.options

      // Start WebAuthn registration
      const credential = await startRegistration(options)

      // Verify registration with server
      const verifyResponse = await axios.post(
        `${API_URL}/api/webauthn/register/verify`,
        { credential },
        { headers: { Authorization: `Bearer ${localStorage.getItem('beautycita-auth-token')}` }}
      )

      if (verifyResponse.data.success) {
        toast.success('Biometric device added successfully! 🔐')
        await fetchBiometricDevices()
      } else {
        throw new Error(verifyResponse.data.message || 'Failed to add device')
      }
    } catch (error: any) {
      console.error('Failed to add biometric device:', error)
      if (error.name === 'NotAllowedError') {
        toast.error('Biometric authentication was cancelled')
      } else {
        toast.error(error.message || 'Failed to add biometric device')
      }
    } finally {
      setAddingDevice(false)
    }
  }

  const handleRemoveDevice = async (credentialId: string) => {
    if (!confirm('Are you sure you want to remove this device?')) {
      return
    }

    try {
      const response = await axios.delete(
        `${API_URL}/api/webauthn/credentials/${credentialId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('beautycita-auth-token')}` }}
      )

      if (response.data.success) {
        toast.success('Device removed successfully')
        await fetchBiometricDevices()
      } else {
        throw new Error(response.data.message || 'Failed to remove device')
      }
    } catch (error: any) {
      console.error('Failed to remove device:', error)
      toast.error(error.message || 'Failed to remove device')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'profile'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <UserCircleIcon className="w-5 h-5 inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 px-6 py-4 font-medium transition-colors ${
              activeTab === 'security'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShieldCheckIcon className="w-5 h-5 inline mr-2" />
            Security
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'profile' ? (
            <div className="p-6 space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  {previewUrl ? (
                    <img loading="lazy"
                      src={previewUrl}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-purple-500 shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-4 border-gray-300">
                      <UserCircleIcon className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  <button
                    onClick={handleImageClick}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CameraIcon className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
                <p className="mt-3 text-sm text-gray-600">Click camera to change photo</p>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  disabled
                />
                <p className="mt-1 text-xs text-gray-500">Phone number cannot be changed</p>
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Biometric Devices */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Biometric Devices</h3>
                    <p className="text-sm text-gray-600">Manage devices for fingerprint and face ID login</p>
                  </div>
                  <button
                    onClick={handleAddBiometric}
                    disabled={addingDevice}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {addingDevice ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-4 h-4" />
                        <span>Add Device</span>
                      </>
                    )}
                  </button>
                </div>

                {loadingDevices ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : biometricDevices.length > 0 ? (
                  <div className="space-y-3">
                    {biometricDevices.map((device) => (
                      <div
                        key={device.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <DevicePhoneMobileIcon className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{device.device_name || 'Unnamed Device'}</p>
                            <p className="text-sm text-gray-600">
                              Added {formatDate(device.created_at)}
                              {device.last_used_at && ` • Last used ${formatDate(device.last_used_at)}`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveDevice(device.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <DevicePhoneMobileIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">No biometric devices</p>
                    <p className="text-sm text-gray-500">Add a device to enable fingerprint or face ID login</p>
                  </div>
                )}
              </div>

              {/* Password Section (if user has password) */}
              {user?.password_hash && (
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Password</h3>
                  <button className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors">
                    Change Password
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
