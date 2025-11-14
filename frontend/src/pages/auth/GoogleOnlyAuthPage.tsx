import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || ''

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          prompt: (momentListener?: (notification: any) => void) => void
          cancel: () => void
          renderButton: (parent: HTMLElement, options: any) => void
        }
      }
    }
  }
}

export default function GoogleOnlyAuthPage() {
  const navigate = useNavigate()
  const { setUser, setToken } = useAuthStore()

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true

    script.onload = () => {
      if (window.google) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

        if (!clientId) {
          console.error('Google Client ID not configured')
          toast.error('Google Sign-In is not configured')
          return
        }

        // Initialize Google One Tap
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: false,
          context: 'signin',
          itp_support: true,
        })

        // Display the One Tap prompt
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.log('One Tap not displayed:', notification.getNotDisplayedReason())
            // Show button fallback if One Tap doesn't display
            renderGoogleButton()
          } else if (notification.isSkippedMoment()) {
            console.log('One Tap skipped:', notification.getSkippedReason())
            renderGoogleButton()
          } else if (notification.isDismissedMoment()) {
            console.log('One Tap dismissed:', notification.getDismissedReason())
            renderGoogleButton()
          }
        })
      }
    }

    document.head.appendChild(script)

    return () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel()
      }
      document.head.removeChild(script)
    }
  }, [])

  const handleCredentialResponse = async (response: any) => {
    try {
      console.log('Google credential received')

      const res = await fetch(`${API_URL}/api/auth/google/one-tap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: response.credential,
          role: 'CLIENT',
        }),
      })

      const data = await res.json()

      if (data.success && data.token) {
        console.log('Authentication successful')

        // Store in localStorage
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))

        // Update auth store
        setToken(data.token)
        setUser(data.user)

        toast.success(`Welcome, ${data.user.name || data.user.email}!`)

        // Redirect based on onboarding status
        if (data.requiresOnboarding) {
          navigate('/onboarding/client')
        } else {
          navigate('/panel')
        }
      } else {
        throw new Error(data.error || 'Authentication failed')
      }
    } catch (error: any) {
      console.error('Google One Tap error:', error)
      toast.error(error.message || 'Failed to sign in with Google')
    }
  }

  const renderGoogleButton = () => {
    const buttonDiv = document.getElementById('google-signin-button')
    if (buttonDiv && window.google) {
      window.google.accounts.id.renderButton(buttonDiv, {
        theme: 'filled_blue',
        size: 'large',
        width: 300,
        text: 'signin_with',
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent mb-2">
            BeautyCita
          </h1>
          <p className="text-gray-400">Sign in to continue</p>
        </div>

        {/* Card */}
        <div className="bg-gray-800/50 backdrop-blur-lg rounded-3xl p-8 border border-gray-700">
          {/* Google One Tap will appear as popup */}

          {/* Fallback Google Button (if One Tap doesn't show) */}
          <div className="flex flex-col items-center space-y-4">
            <div id="google-signin-button" className="w-full flex justify-center"></div>

            <p className="text-sm text-gray-400 text-center mt-4">
              By signing in, you agree to our{' '}
              <a href="/terms" className="text-pink-500 hover:text-pink-400">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-pink-500 hover:text-pink-400">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>

        {/* Help text */}
        <p className="text-center text-gray-500 text-sm mt-6">
          New to BeautyCita? Sign in with Google to get started
        </p>
      </div>
    </div>
  )
}
