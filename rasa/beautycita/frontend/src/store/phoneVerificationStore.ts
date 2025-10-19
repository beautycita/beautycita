import { create } from 'zustand'
import { authService } from '@/services/authService'
import type { PhoneVerificationState } from '@/types'
import toast from 'react-hot-toast'

interface PhoneVerificationStore extends PhoneVerificationState {
  // Actions
  sendVerificationCode: (phone: string) => Promise<boolean>
  verifyPhone: (phone: string, code: string) => Promise<boolean>
  resendCode: (phone: string) => Promise<boolean>
  setTimer: (seconds: number) => void
  decrementTimer: () => void
  clearError: () => void
  reset: () => void
}

export const usePhoneVerificationStore = create<PhoneVerificationStore>((set, get) => ({
  // Initial state
  isVerifying: false,
  isLoading: false,
  codeSent: false,
  timeLeft: 0,
  error: null,

  // Actions
  sendVerificationCode: async (phone: string) => {
    set({ isLoading: true, error: null })

    try {
      const response = await authService.sendPhoneVerification(phone)

      if (response.success) {
        set({
          isLoading: false,
          codeSent: true,
          timeLeft: 60,
          error: null
        })

        // Start countdown timer
        const timer = setInterval(() => {
          const { timeLeft } = get()
          if (timeLeft <= 1) {
            clearInterval(timer)
            set({ timeLeft: 0 })
          } else {
            set({ timeLeft: timeLeft - 1 })
          }
        }, 1000)

        return true
      } else {
        set({
          isLoading: false,
          error: response.message || 'Failed to send verification code'
        })
        return false
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to send verification code'
      })
      return false
    }
  },

  verifyPhone: async (phone: string, code: string) => {
    set({ isLoading: true, error: null })

    try {
      const response = await authService.verifyPhone(phone, code)

      if (response.success) {
        set({
          isLoading: false,
          isVerifying: false,
          error: null
        })
        toast.success('Phone verified successfully!')
        return true
      } else {
        set({
          isLoading: false,
          error: response.message || 'Invalid verification code'
        })
        return false
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Verification failed'
      })
      return false
    }
  },

  resendCode: async (phone: string) => {
    const { timeLeft } = get()
    if (timeLeft > 0) return false

    set({ isLoading: true, error: null })

    try {
      const response = await authService.resendPhoneVerification(phone)

      if (response.success) {
        set({
          isLoading: false,
          timeLeft: 60,
          error: null
        })

        // Start countdown timer
        const timer = setInterval(() => {
          const { timeLeft } = get()
          if (timeLeft <= 1) {
            clearInterval(timer)
            set({ timeLeft: 0 })
          } else {
            set({ timeLeft: timeLeft - 1 })
          }
        }, 1000)

        toast.success('New verification code sent!')
        return true
      } else {
        set({
          isLoading: false,
          error: response.message || 'Failed to resend code'
        })
        return false
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'Failed to resend code'
      })
      return false
    }
  },

  setTimer: (seconds: number) => {
    set({ timeLeft: seconds })
  },

  decrementTimer: () => {
    const { timeLeft } = get()
    if (timeLeft > 0) {
      set({ timeLeft: timeLeft - 1 })
    }
  },

  clearError: () => {
    set({ error: null })
  },

  reset: () => {
    set({
      isVerifying: false,
      isLoading: false,
      codeSent: false,
      timeLeft: 0,
      error: null
    })
  }
}))