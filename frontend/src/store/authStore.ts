import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Client, Stylist, AuthState, LoginForm, RegisterForm } from '../types'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginForm) => Promise<{ success: boolean; redirectUrl?: string; requiresPhoneVerification?: boolean; phoneVerified?: boolean; error?: string }>
  register: (data: RegisterForm) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<boolean>
  clearError: () => void
  setLoading: (loading: boolean) => void
  setUser: (user: User) => void
  setToken: (token: string) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      client: null,
      stylist: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,

      // Actions
      login: async (credentials: LoginForm) => {
        set({ isLoading: true })

        try {
          const response = await authService.login(credentials)

          if (response.success && response.data) {
            const { user, client, stylist, token, redirectUrl, requiresPhoneVerification, phoneVerified } = response.data

            set({
              user: {
                ...user,
                isActive: user.isActive ?? true,
                emailVerified: user.emailVerified ?? false,
                role: user.role || 'CLIENT'
              },
              client,
              stylist,
              token,
              isAuthenticated: true,
              isLoading: false,
            })

            // Set auth header for future requests
            authService.setAuthToken(token)

            // Store additional login data for redirect handling
            const loginData = {
              redirectUrl,
              requiresPhoneVerification,
              phoneVerified: phoneVerified ?? false
            }

            toast.success('¡Bienvenido de vuelta!')
            return { success: true, ...loginData, user }
          } else {
            throw new Error(response.message || 'Error de autenticación')
          }
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.message || 'Error al iniciar sesión')
          return { success: false, error: error.message }
        }
      },

      register: async (data: RegisterForm) => {
        set({ isLoading: true })

        try {
          const response = await authService.register(data)

          if (response.success) {
            set({ isLoading: false })
            toast.success('¡Cuenta creada exitosamente! Por favor verifica tu email.')
            return true
          } else {
            throw new Error(response.message || 'Error en el registro')
          }
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.message || 'Error al crear la cuenta')
          return false
        }
      },

      logout: () => {
        // Clear auth token
        authService.clearAuthToken()

        // Clear state
        set({
          user: null,
          client: null,
          stylist: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })

        toast.success('Sesión cerrada correctamente')
      },

      checkAuth: async () => {
        // Try to get token from current state first
        let { token } = get()

        // If not in state, try to read from localStorage directly
        // This handles the case where checkAuth is called before rehydration completes
        if (!token) {
          try {
            const authData = localStorage.getItem('beautycita-auth')
            if (authData) {
              const parsed = JSON.parse(authData)
              token = parsed.state?.token || null
            }
          } catch (error) {
            // Ignore parsing errors
          }
        }

        if (!token) {
          set({ isLoading: false })
          return
        }

        set({ isLoading: true })

        try {
          // Set token for the request
          authService.setAuthToken(token)

          const response = await authService.getProfile()

          if (response.success && response.data) {
            const { user, client, stylist } = response.data

            set({
              user: {
                ...user,
                isActive: user.isActive ?? true,
                emailVerified: user.emailVerified ?? false,
                role: user.role || 'CLIENT'
              },
              client,
              stylist,
              token, // Preserve token in state
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            // Token is invalid, clear auth state
            get().logout()
          }
        } catch (error) {
          // Token is invalid or network error, clear auth state
          get().logout()
        }
      },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true })

        try {
          const response = await authService.updateProfile(data)

          if (response.success && response.data) {
            set(state => ({
              user: { ...state.user!, ...response.data },
              isLoading: false,
            }))

            // Don't show toast here - let calling components handle their own messages
            return true
          } else {
            throw new Error(response.message || 'Error al actualizar perfil')
          }
        } catch (error: any) {
          set({ isLoading: false })
          // Don't show toast here - let calling components handle their own error messages
          return false
        }
      },

      clearError: () => {
        // This could be used for clearing specific error states if needed
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      setUser: (user: User) => {
        set({
          user: {
            ...user,
            isActive: user.isActive ?? true,
            emailVerified: user.emailVerified ?? false,
            role: user.role || 'CLIENT'
          },
          isAuthenticated: true
        })
      },

      setToken: (token: string) => {
        set({ token })
        authService.setAuthToken(token)
      },
    }),
    {
      name: 'beautycita-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        client: state.client,
        stylist: state.stylist,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Sync token to API client after rehydration
        if (state?.token) {
          authService.setAuthToken(state.token)
        }
      },
    }
  )
)