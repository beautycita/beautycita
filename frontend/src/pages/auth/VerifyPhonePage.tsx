import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PhoneIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import axios from 'axios'

const VerifyPhonePage = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { checkAuth } = useAuthStore()

  const [phone, setPhone] = useState('+52')
  const [verificationCode, setVerificationCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const email = searchParams.get('email')
  const role = searchParams.get('role')
  const token = searchParams.get('token')

  useEffect(() => {
    if (!email) {
      navigate('/login')
    }
    // Store the token from OAuth if present
    if (token) {
      // Update the store directly with token
      const storageKey = 'auth-storage'
      const existingData = localStorage.getItem(storageKey)
      if (existingData) {
        const parsed = JSON.parse(existingData)
        parsed.state.token = token
        localStorage.setItem(storageKey, JSON.stringify(parsed))
      } else {
        localStorage.setItem(storageKey, JSON.stringify({
          state: { token, isAuthenticated: false, isLoading: false, user: null, client: null, stylist: null },
          version: 0
        }))
      }
    }
  }, [email, token, navigate])

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      await axios.post('/api/auth/send-phone-verification', {
        phone,
        email
      })
      setCodeSent(true)
      setSuccess(t('auth.verifyPhone.codeSent'))
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.verifyPhone.errorSending'))
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await axios.post('/api/auth/verify-phone', {
        phone,
        code: verificationCode,
        email
      })

      setSuccess(t('auth.verifyPhone.phoneVerified'))

      // Refresh auth state and redirect
      await checkAuth()

      setTimeout(() => {
        if (role === 'stylist') {
          navigate('/dashboard')
        } else {
          navigate('/profile/onboarding')
        }
      }, 1500)
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.verifyPhone.invalidCode'))
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    if (role === 'stylist') {
      navigate('/dashboard')
    } else {
      navigate('/profile/onboarding')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 mb-4">
            <PhoneIcon className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {t('auth.verifyPhone.title')}
          </h2>
          <p className="mt-2 text-gray-600">
            {t('auth.verifyPhone.subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-3xl">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-3xl">
              <p className="text-green-800 text-sm">{success}</p>
            </div>
          )}

          {!codeSent ? (
            <form onSubmit={handleSendCode}>
              <div className="mb-6">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.verifyPhone.phoneLabel')}
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => {
                    const value = e.target.value
                    // Ensure +52 stays at the beginning
                    if (!value.startsWith('+52')) {
                      setPhone('+52' + value.replace(/^\+?\d{0,2}/, ''))
                    } else {
                      setPhone(value)
                    }
                  }}
                  onKeyDown={(e) => {
                    // Prevent deleting the +52 prefix
                    if ((e.key === 'Backspace' || e.key === 'Delete') && phone.length <= 3) {
                      e.preventDefault()
                    }
                  }}
                  placeholder={t('auth.verifyPhone.phonePlaceholder')}
                  inputMode="tel"
                  autoComplete="tel"
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <p className="mt-2 text-xs text-gray-500">
                  {t('auth.verifyPhone.phoneHint')}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-4 rounded-3xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('auth.verifyPhone.sendingButton') : t('auth.verifyPhone.sendCodeButton')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode}>
              <div className="mb-6">
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.verifyPhone.codeLabel')}
                </label>
                <input
                  type="text"
                  id="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder={t('auth.verifyPhone.codePlaceholder')}
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center text-2xl tracking-widest"
                  required
                />
                <p className="mt-2 text-xs text-gray-500 text-center">
                  {t('auth.verifyPhone.codeHint')} {phone}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-4 rounded-3xl font-semibold hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
              >
                {loading ? t('auth.verifyPhone.verifyingButton') : t('auth.verifyPhone.verifyButton')}
              </button>

              <button
                type="button"
                onClick={() => setCodeSent(false)}
                className="w-full text-purple-600 py-2 text-sm hover:text-purple-700"
              >
                {t('auth.verifyPhone.changeNumber')}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleSkip}
              className="w-full text-gray-600 text-sm hover:text-gray-800"
            >
              {t('auth.verifyPhone.skipButton')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyPhonePage