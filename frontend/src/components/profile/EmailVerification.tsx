import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  EnvelopeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/authService'
import toast from 'react-hot-toast'

interface EmailVerificationProps {
  onComplete: () => void
}

export default function EmailVerification({ onComplete }: EmailVerificationProps) {
  const { user, updateProfile } = useAuthStore()

  // Check if user has a temp email - if so, treat as no email
  const isTempEmail = user?.email?.includes('temp_') || user?.email?.includes('@beautycita.temp')
  const initialEmail = isTempEmail ? '' : (user?.email || '')

  const [email, setEmail] = useState(initialEmail)
  const [isEmailSaved, setIsEmailSaved] = useState(!isTempEmail && !!user?.email)
  const [verificationSent, setVerificationSent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  const handleSaveEmail = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      setSaving(true)
      console.log('[EMAIL] Saving email:', email)

      const success = await updateProfile({ email })

      console.log('[EMAIL] Save result:', success)

      if (success) {
        setIsEmailSaved(true)
        toast.success('Email saved!')
        console.log('[EMAIL] ✅ Email saved successfully, calling onComplete()')

        // Call onComplete immediately - React will batch state updates
        onComplete()

        console.log('[EMAIL] onComplete() called')
      } else {
        console.error('[EMAIL] Failed to save email')
        toast.error('Failed to save email. Please try again.')
        setSaving(false)
      }
    } catch (error) {
      console.error('[EMAIL] Error saving email:', error)
      toast.error('Failed to save email. Please try again.')
      setSaving(false)
    }
    // Note: Don't set saving to false on success - let parent handle state
  }

  const handleSendVerification = async () => {
    if (!isEmailSaved) {
      toast.error('Please save your email first')
      return
    }

    try {
      setSending(true)
      console.log('[EMAIL] Sending verification email...')

      // Use authService which automatically includes the auth token via apiClient
      const response = await authService.resendVerificationEmail()

      console.log('[EMAIL] Response:', response)

      if (response.success) {
        setVerificationSent(true)
        toast.success('Verification email sent! Check your inbox 📧')
        console.log('[EMAIL] ✅ Verification email sent successfully')
      } else {
        const errorMsg = response.error || 'Failed to send verification email'
        console.error('[EMAIL] Failed:', errorMsg)
        toast.error(errorMsg)
      }
    } catch (error: any) {
      console.error('[EMAIL] Error sending verification email:', error)
      toast.error('Failed to send verification email. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Email Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isEmailSaved}
            placeholder="you@example.com"
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-3xl focus:ring-2 focus:ring-purple-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {!isEmailSaved && (
          <button
            onClick={handleSaveEmail}
            disabled={saving || !email}
            className="mt-3 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                <span>Save Email</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Verification Status */}
      {isEmailSaved && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {user?.email_verified ? (
            <div className="bg-green-50 border border-green-200 rounded-3xl p-4 flex items-start gap-3">
              <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-1">Email Verified! ✨</h3>
                <p className="text-sm text-green-700">
                  Your email {email} has been verified.
                </p>
              </div>
            </div>
          ) : verificationSent ? (
            <div className="bg-blue-50 border border-blue-200 rounded-3xl p-4 flex items-start gap-3">
              <PaperAirplaneIcon className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Verification Email Sent!</h3>
                <p className="text-sm text-blue-700">
                  Check your inbox at <span className="font-medium">{email}</span> and click the verification link.
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Don't see it? Check your spam folder.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-4 flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">Email Not Verified</h3>
                <p className="text-sm text-yellow-700">
                  Please verify your email to receive important notifications.
                </p>
              </div>
            </div>
          )}

          {/* Send Verification Button */}
          {!user?.email_verified && (
            <button
              onClick={handleSendVerification}
              disabled={sending || verificationSent}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-5 h-5" />
                  <span>{verificationSent ? 'Resend Verification Email' : 'Send Verification Email'}</span>
                </>
              )}
            </button>
          )}

          {/* Continue Button */}
          <button
            onClick={handleSkip}
            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <CheckCircleIcon className="w-5 h-5" />
            <span>{user?.email_verified ? 'Continue' : 'Continue Anyway'}</span>
          </button>
        </motion.div>
      )}

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-3xl p-4">
        <h4 className="font-medium text-gray-900 mb-2">Why verify your email?</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>• Receive booking confirmations</li>
          <li>• Get important account updates</li>
          <li>• Reset your password if needed</li>
          <li>• Receive promotional offers</li>
        </ul>
      </div>
    </div>
  )
}
