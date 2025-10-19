import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Client, Stylist, AuthState, LoginForm, RegisterForm } from '@/types'
import { authService } from '@/services/authService'
import toast from 'react-hot-toast'

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: LoginForm) => Promise<boolean>
  register: (data: RegisterForm) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<boolean>
  clearError: () => void
  setLoading: (loading: boolean) => void
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
            const { user, client, stylist, token } = response.data

            set({
              user,
              client,
              stylist,
              token,
              isAuthenticated: true,
              isLoading: false,
            })

            // Set auth header for future requests
            authService.setAuthToken(token)

            toast.success('¡Bienvenido de vuelta!')
            return true
          } else {
            throw new Error(response.message || 'Error de autenticación')
          }
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.message || 'Error al iniciar sesión')
          return false
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
        const { token } = get()

        if (!token) {
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
              user,
              client,
              stylist,
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

            toast.success('Perfil actualizado correctamente')
            return true
          } else {
            throw new Error(response.message || 'Error al actualizar perfil')
          }
        } catch (error: any) {
          set({ isLoading: false })
          toast.error(error.message || 'Error al actualizar perfil')
          return false
        }
      },

      clearError: () => {
        // This could be used for clearing specific error states if needed
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
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
    }
  )
)