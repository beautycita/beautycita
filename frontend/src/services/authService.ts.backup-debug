import { apiClient } from './api'
import type { LoginForm, RegisterForm, User, Client, Stylist, ApiResponse } from '../types'

interface AuthResponse {
  user: User
  client?: Client
  stylist?: Stylist
  token: string
  redirectUrl?: string
  requiresPhoneVerification?: boolean
  phoneVerified?: boolean
}

interface ProfileResponse {
  user: User
  client?: Client
  stylist?: Stylist
}

class AuthService {
  async login(credentials: LoginForm): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/auth/login', credentials)
  }

  async register(data: RegisterForm): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/auth/register', data)
  }

  async registerStylist(data: any): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/auth/register/stylist', data)
  }

  async logout(): Promise<ApiResponse> {
    return apiClient.post('/auth/logout')
  }

  async getProfile(): Promise<ApiResponse<ProfileResponse>> {
    return apiClient.get<ProfileResponse>('/auth/profile')
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.patch<User>('/auth/profile', data)
  }

  async changePassword(data: {
    currentPassword: string
    newPassword: string
  }): Promise<ApiResponse> {
    return apiClient.patch('/auth/change-password', data)
  }

  async forgotPassword(email: string): Promise<ApiResponse> {
    return apiClient.post('/auth/forgot-password', { email })
  }

  async resetPassword(data: {
    token: string
    password: string
  }): Promise<ApiResponse> {
    return apiClient.post('/auth/reset-password', data)
  }

  async verifyEmail(token: string): Promise<ApiResponse> {
    return apiClient.post('/auth/verify-email', { token })
  }

  async resendVerificationEmail(): Promise<ApiResponse> {
    // Note: '/auth/resend-verification' is for PHONE verification
    // This endpoint is for EMAIL verification and requires JWT auth
    return apiClient.post('/auth/send-email-verification')
  }

  async refreshToken(): Promise<ApiResponse<{ token: string }>> {
    return apiClient.post('/auth/refresh')
  }

  // Token management
  setAuthToken(token: string): void {
    apiClient.setAuthToken(token)
  }

  clearAuthToken(): void {
    apiClient.clearAuthToken()
  }

  // Check if user has specific role
  hasRole(user: User | null, role: string): boolean {
    return user?.role === role
  }

  // Check if user has any of the specified roles
  hasAnyRole(user: User | null, roles: string[]): boolean {
    return user ? roles.includes(user.role) : false
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = localStorage.getItem('beautycita-auth-token')
    return !!token
  }

  // Get current user from localStorage
  getCurrentUser(): User | null {
    try {
      const authData = localStorage.getItem('beautycita-auth')
      if (authData) {
        const parsed = JSON.parse(authData)
        return parsed.state?.user || null
      }
      return null
    } catch {
      return null
    }
  }

  // Two-Factor Authentication methods
  async get2FAStatus(): Promise<ApiResponse<{ enabled: boolean }>> {
    return apiClient.get<{ enabled: boolean }>('/2fa/status')
  }

  async setup2FA(): Promise<ApiResponse<{ qrCode: string; secret: string; manualEntryKey: string }>> {
    return apiClient.post<{ qrCode: string; secret: string; manualEntryKey: string }>('/2fa/setup')
  }

  async verify2FA(token: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/2fa/verify', { token })
  }

  async disable2FA(token: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/2fa/disable', { token })
  }

  async validate2FA(email: string, token: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>('/2fa/validate', { email, token })
  }
}

export const authService = new AuthService()