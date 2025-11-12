import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

interface GoogleOneTapProps {
  role?: 'client' | 'stylist'
  onSuccess?: (userData: any) => void
  onError?: (error: string) => void
  autoSelect?: boolean
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          prompt: (momentListener?: (notification: any) => void) => void
          cancel: () => void
        }
      }
    }
  }
}

export default function GoogleOneTap({
  role = 'client',
  onSuccess,
  onError,
  autoSelect = true
}: GoogleOneTapProps) {
  const navigate = useNavigate()

  const handleCredentialResponse = useCallback(async (response: any) => {
    try {
      console.log('Google One Tap credential received')

      // Send credential to backend for verification
      const res = await fetch('/api/auth/google/one-tap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: response.credential,
          role: role
        }),
      })

      const data = await res.json()

      if (data.success) {
        console.log('Google One Tap authentication successful')

        // Store token
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))

        // Call success callback if provided
        if (onSuccess) {
          onSuccess(data.user)
        }

        // Redirect based on onboarding status
        if (data.requiresOnboarding) {
          navigate('/onboarding/client')
        } else {
          // Redirect to panel (onboarding already completed)
          navigate('/panel')
        }
      } else {
        throw new Error(data.error || 'Authentication failed')
      }
    } catch (error: any) {
      console.error('Google One Tap error:', error)
      if (onError) {
        onError(error.message)
      }
    }
  }, [role, navigate, onSuccess, onError])

  useEffect(() => {
    // Load Google Identity Services script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true

    script.onload = () => {
      if (window.google) {
        // Get client ID from environment
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

        if (!clientId) {
          console.error('Google Client ID not configured')
          return
        }

        // Initialize Google One Tap
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: autoSelect,
          cancel_on_tap_outside: false,
          context: 'signin'
        })

        // Display the One Tap prompt
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed()) {
            console.log('Google One Tap not displayed:', notification.getNotDisplayedReason())
          } else if (notification.isSkippedMoment()) {
            console.log('Google One Tap skipped:', notification.getSkippedReason())
          } else if (notification.isDismissedMoment()) {
            console.log('Google One Tap dismissed:', notification.getDismissedReason())
          }
        })
      }
    }

    document.head.appendChild(script)

    // Cleanup
    return () => {
      // Cancel any pending One Tap prompts
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel()
      }
      document.head.removeChild(script)
    }
  }, [handleCredentialResponse, autoSelect])

  // This component doesn't render anything visible
  // Google One Tap appears as a popup/overlay automatically
  return null
}
