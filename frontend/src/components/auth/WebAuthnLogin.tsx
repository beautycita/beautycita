import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  startAuthentication,
  browserSupportsWebAuthn
} from '@simplewebauthn/browser'
import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/types'
import axios from 'axios'
import { FingerPrintIcon as FingerprintIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || ''

interface WebAuthnLoginProps {
  onSuccess?: (token: string, user: any) => void
  onError?: (error: string) => void
  phoneNumber?: string
  role?: 'CLIENT' | 'STYLIST'
}

interface LoginForm {
  phone: string
}

export default function WebAuthnLogin({
  onSuccess,
  onError,
  phoneNumber
}: WebAuthnLoginProps) {
  const { t } = useTranslation()
  const [isLoading, setIsLoading] = useState(false)
  const [isWebAuthnSupported, setIsWebAuthnSupported] = useState(
    browserSupportsWebAuthn()
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: {
      phone: phoneNumber || ''
    }
  })

  const onSubmit = async (formData: LoginForm) => {
    if (!isWebAuthnSupported) {
      const errorMsg = 'WebAuthn is not supported in your browser. Please use a modern browser with biometric authentication support.'
      toast.error(errorMsg)
      onError?.(errorMsg)
      return
    }

    setIsLoading(true)

    try {
      // Step 1: Get authentication options from server
      const optionsResponse = await axios.post<{
        success: boolean
        options: PublicKeyCredentialRequestOptionsJSON
        message?: string
      }>(
        `${API_URL}/api/webauthn/login/options`,
        {
          phone: formData.phone
        }
      )

      if (!optionsResponse.data.success || !optionsResponse.data.options) {
        throw new Error(optionsResponse.data.message || 'Failed to get authentication options')
      }

      const { options } = optionsResponse.data

      // Step 2: Trigger biometric authentication (Face ID, Touch ID, Windows Hello, etc.)
      console.log('[DEBUG] Authentication options:', options)
      const credential = await startAuthentication(options)
      console.log('[DEBUG] Credential received from startAuthentication:', credential)
      console.log('[DEBUG] Credential.id:', credential.id)
      console.log('[DEBUG] Credential.rawId:', credential.rawId)
      console.log('[DEBUG] Credential structure:', JSON.stringify(credential, null, 2))

      // Step 3: Send credential to server for verification
      const verifyResponse = await axios.post<{
        success: boolean
        token: string
        user: any
        message?: string
      }>(
        `${API_URL}/api/webauthn/login/verify`,
        {
          phone: formData.phone,
          assertion: credential  // Backend expects 'assertion', not 'credential'
        }
      )

      if (!verifyResponse.data.success) {
        throw new Error(verifyResponse.data.message || 'Failed to verify credential')
      }

      const { token, user } = verifyResponse.data

      // Store token in localStorage
      localStorage.setItem('authToken', token)

      toast.success('Login successful!')

      onSuccess?.(token, user)

    } catch (error: any) {
      console.error('WebAuthn login error:', error)

      let errorMessage = 'Failed to login with passkey. Please try again.'

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'Authentication cancelled or not allowed by browser.'
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isWebAuthnSupported) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-full">
        <div className="flex items-start space-x-3">
          <FingerprintIcon className="h-6 w-6 text-yellow-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Biometric Authentication Not Supported
            </h3>
            <p className="mt-2 text-sm text-yellow-700">
              Your browser doesn't support passwordless authentication with biometrics.
              Please use a modern browser on a device with Face ID, Touch ID, or Windows Hello.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-full">
        <div className="flex items-start space-x-3">
          <FingerprintIcon className="h-6 w-6 text-primary-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-primary-900">
              Passwordless Login
            </h3>
            <p className="mt-1 text-sm text-primary-700">
              Use your registered biometric (Face ID, Touch ID, or Windows Hello) to sign in
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Phone Number */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('phone', {
                required: 'Phone number is required',
                pattern: {
                  value: /^\+?[1-9]\d{9,14}$/,
                  message: 'Please enter a valid phone number with country code (e.g., +52...)'
                }
              })}
              type="tel"
              id="phone"
              className="input pl-10"
              placeholder="+52 555 123 4567"
              disabled={!!phoneNumber}
              autoFocus
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn btn-primary w-full flex items-center justify-center space-x-2 rounded-full"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Authenticating...</span>
            </>
          ) : (
            <>
              <FingerprintIcon className="h-5 w-5" />
              <span>Login with Biometric</span>
            </>
          )}
        </motion.button>

        <p className="text-xs text-gray-500 text-center">
          You'll be prompted to use your registered Face ID, Touch ID, or Windows Hello
        </p>
      </form>
    </div>
  )
}
