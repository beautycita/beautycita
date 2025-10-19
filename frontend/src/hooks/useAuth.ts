import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { user, isAuthenticated, token, logout, login } = useAuthStore()

  return {
    user,
    isAuthenticated,
    token,
    logout,
    login
  }
}
