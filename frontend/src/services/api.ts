import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import type { ApiResponse } from '../types'

class ApiClient {
  private client: AxiosInstance
  private csrfToken: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: this.getApiBaseUrl(),
      timeout: 30000,
      withCredentials: true, // Send cookies automatically
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
    this.fetchCsrfToken() // Get CSRF token on init
  }

  private getApiBaseUrl(): string {
    // Check for explicit environment variable first
    const envApiUrl = (import.meta as any).env?.VITE_API_URL
    if (envApiUrl) {
      // Ensure /api suffix is present
      return envApiUrl.endsWith('/api') ? envApiUrl : `${envApiUrl}/api`
    }

    // In development, detect if we're accessing via network IP or localhost
    if (import.meta.env.DEV) {
      const currentHost = window.location.hostname

      // If accessing via network IP (not localhost), connect directly to backend
      if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
        // Use the same host but with backend port
        return `${window.location.protocol}//${currentHost}:4000/api`
      }

      // Default development proxy
      return '/api'
    }

    // Production: use relative API path (handled by nginx)
    return '/api'
  }

  private async fetchCsrfToken() {
    try {
      const response = await axios.get(`${this.getApiBaseUrl()}/sessions/csrf`, {
        withCredentials: true
      })
      if (response.data?.csrfToken) {
        this.csrfToken = response.data.csrfToken
      }
    } catch (error) {
      console.warn('Failed to fetch CSRF token:', error)
    }
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add CSRF token for state-changing requests
        if (this.csrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
          config.headers['x-csrf-token'] = this.csrfToken
        }

        // Add auth token if available (for backward compatibility)
        const token = this.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      async (error) => {
        // Handle CSRF token expiry
        if (error.response?.status === 403 && error.response?.data?.code === 'CSRF_VALIDATION_FAILED') {
          // Refresh CSRF token and retry request
          await this.fetchCsrfToken()
          if (error.config) {
            error.config.headers['x-csrf-token'] = this.csrfToken
            return this.client.request(error.config)
          }
        }

        // Handle authentication failure
        if (error.response?.status === 401) {
          // Session expired or invalid
          this.clearToken()
          window.location.href = '/login'
        }

        return Promise.reject(error)
      }
    )
  }

  private getToken(): string | null {
    // First try the direct token storage
    let token = localStorage.getItem('beautycita-auth-token')

    // If not found, try to get from Zustand persisted state as fallback
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

    return token
  }

  private clearToken(): void {
    localStorage.removeItem('beautycita-auth-token')
  }

  public setAuthToken(token: string): void {
    localStorage.setItem('beautycita-auth-token', token)
  }

  public clearAuthToken(): void {
    this.clearToken()
  }

  // Generic request method
  private async request<T = any>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.request({
        method,
        url,
        data,
        ...config,
      })

      return {
        success: response.data?.success ?? true,
        data: response.data?.data || response.data,
        message: response.data?.message,
      }
    } catch (error: any) {
      console.error(`API ${method.toUpperCase()} ${url} error:`, error)

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Network error',
        code: error.response?.data?.code,
        data: error.response?.data,
      }
    }
  }

  // HTTP methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('get', url, undefined, config)
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('post', url, data, config)
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('put', url, data, config)
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('patch', url, data, config)
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('delete', url, undefined, config)
  }

  // File upload method
  async uploadFile<T = any>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<ApiResponse<T>> {
    return this.request<T>('post', url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    })
  }

  // Download file method
  async downloadFile(url: string, filename?: string): Promise<void> {
    try {
      const response = await this.client.get(url, {
        responseType: 'blob',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        // Add timestamp to bypass cache
        params: {
          _t: Date.now()
        }
      })

      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Download error:', error)
      throw error
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.get('/health')
  }
}

// Create and export the API client instance
export const apiClient = new ApiClient()

// Export commonly used methods for convenience
export const { get, post, put, patch, delete: del, uploadFile, downloadFile } = apiClient