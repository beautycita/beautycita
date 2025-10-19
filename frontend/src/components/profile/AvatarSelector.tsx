import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  PhotoIcon,
  CheckCircleIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Default avatar options from local media
const DEFAULT_AVATARS = [
  { id: 1, url: '/media/img/avatar/A1.png', name: 'Avatar 1' },
  { id: 2, url: '/media/img/avatar/A2.png', name: 'Avatar 2' },
  { id: 4, url: '/media/img/avatar/A4.png', name: 'Avatar 4' },
  { id: 5, url: '/media/img/avatar/A5.png', name: 'Avatar 5' },
  { id: 6, url: '/media/img/avatar/A6.png', name: 'Avatar 6' },
  { id: 7, url: '/media/img/avatar/A7.png', name: 'Avatar 7' },
  { id: 'm1', url: '/media/brand/m1.png', name: 'Makeup 1' },
  { id: 'm2', url: '/media/brand/m2.png', name: 'Makeup 2' },
  { id: 'm3', url: '/media/brand/m3.png', name: 'Makeup 3' }
]

interface AvatarSelectorProps {
  onComplete: () => void
}

export default function AvatarSelector({ onComplete }: AvatarSelectorProps) {
  const { user, updateProfile } = useAuthStore()
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(
    user?.profile_picture_url || user?.profilePictureUrl || null
  )
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarSelect = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[AVATAR] File upload triggered')
    const file = event.target.files?.[0]

    if (!file) {
      console.log('[AVATAR] No file selected')
      return
    }

    console.log('[AVATAR] File selected:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('[AVATAR] Invalid file type:', file.type)
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('[AVATAR] File too large:', file.size)
      toast.error('Image must be less than 5MB')
      return
    }

    setUploading(true)

    try {
      // Convert to base64 for preview
      const reader = new FileReader()

      reader.onerror = (error) => {
        console.error('[AVATAR] FileReader error:', error)
        toast.error('Failed to read image file')
        setUploading(false)
      }

      reader.onloadend = () => {
        console.log('[AVATAR] Image loaded successfully')
        setSelectedAvatar(reader.result as string)
        toast.success('Image selected! ✨')
        setUploading(false)
      }

      reader.readAsDataURL(file)
    } catch (error) {
      console.error('[AVATAR] Error uploading image:', error)
      toast.error('Failed to upload image')
      setUploading(false)
    }

    // Reset input to allow re-selecting the same file
    event.target.value = ''
  }

  const handleSave = async () => {
    if (!selectedAvatar) {
      toast.error('Please select an avatar')
      return
    }

    try {
      setSaving(true)
      console.log('[AVATAR] Starting save process...')
      console.log('[AVATAR] Selected avatar:', selectedAvatar)
      console.log('[AVATAR] Current user:', user)

      const success = await updateProfile({
        profilePictureUrl: selectedAvatar
      })

      console.log('[AVATAR] Update result:', success)

      if (success) {
        toast.success('Avatar saved! ✨')
        console.log('[AVATAR] Profile updated successfully, calling onComplete()')

        // Call onComplete immediately - no need for setTimeout
        // React will batch the state updates appropriately
        onComplete()

        console.log('[AVATAR] onComplete() called successfully')
      } else {
        console.error('[AVATAR] Failed to save - updateProfile returned false')
        toast.error('Failed to save avatar. Please try again.')
        setSaving(false)
      }
    } catch (error) {
      console.error('[AVATAR] Error saving avatar:', error)
      toast.error('Failed to save avatar. Please try again.')
      setSaving(false)
    }
    // Note: Don't set saving to false in success case - let parent handle state
  }

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="flex flex-col items-center">
        <div className="relative">
          {selectedAvatar ? (
            <img
              src={selectedAvatar}
              alt="Selected avatar"
              className="w-32 h-32 rounded-full object-cover border-4 border-purple-500 shadow-lg"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-4 border-gray-300">
              <PhotoIcon className="w-16 h-16 text-gray-400" />
            </div>
          )}
          {selectedAvatar && (
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-3xl flex items-center justify-center border-4 border-white">
              <CheckCircleIcon className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
        <p className="mt-4 text-sm text-gray-600">Choose from our collection or upload your own</p>
      </div>

      {/* Upload Button */}
      <div className="flex justify-center">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {uploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <ArrowUpTrayIcon className="w-5 h-5" />
              <span>Upload Photo</span>
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-white text-gray-500">Or choose from our collection</span>
        </div>
      </div>

      {/* Avatar Grid */}
      <div className="grid grid-cols-3 gap-4">
        {DEFAULT_AVATARS.map((avatar) => (
          <motion.button
            key={avatar.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleAvatarSelect(avatar.url)}
            className={`relative aspect-square rounded-3xl overflow-hidden border-4 transition-all ${
              selectedAvatar === avatar.url
                ? 'border-purple-500 shadow-lg'
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <img
              src={avatar.url}
              alt={avatar.name}
              className="w-full h-full object-cover"
            />
            {selectedAvatar === avatar.url && (
              <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                <CheckCircleIcon className="w-8 h-8 text-purple-600" />
              </div>
            )}
          </motion.button>
        ))}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={!selectedAvatar || saving}
        className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {saving ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <CheckCircleIcon className="w-5 h-5" />
            <span>Save & Continue</span>
          </>
        )}
      </button>
    </div>
  )
}
