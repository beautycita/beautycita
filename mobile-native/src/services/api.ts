/**
 * API Service for BeautyCita Mobile App
 * Handles all HTTP requests to the backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  PhoneVerificationData,
  GoogleSignInData,
  ApiError,
} from '../types/auth';

// API Configuration
const API_URL = __DEV__
  ? 'http://localhost:4000/api' // Development
  : 'https://beautycita.com/api'; // Production

const STORAGE_TOKEN_KEY = '@beautycita:token';

/**
 * Axios instance with default configuration
 */
class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - clear storage
          await this.clearToken();
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Store JWT token
   */
  async setToken(token: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_TOKEN_KEY, token);
  }

  /**
   * Retrieve JWT token
   */
  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
  }

  /**
   * Clear JWT token
   */
  async clearToken(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_TOKEN_KEY);
  }

  /**
   * Handle API errors consistently
   */
  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      // Server responded with error
      const data = error.response.data as any;
      return {
        message: data?.message || 'An error occurred',
        errors: data?.errors,
        statusCode: error.response.status,
      };
    } else if (error.request) {
      // Request made but no response
      return {
        message: 'Network error. Please check your connection.',
        statusCode: 0,
      };
    } else {
      // Error setting up request
      return {
        message: error.message || 'An unexpected error occurred',
      };
    }
  }

  /**
   * Authentication Methods
   */

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/register', data);
    return response.data;
  }

  async verifyPhone(data: PhoneVerificationData): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/verify-phone', data);
    return response.data;
  }

  async resendVerificationCode(phone: string): Promise<{ success: boolean; message: string }> {
    const response = await this.client.post('/auth/resend-code', { phone });
    return response.data;
  }

  async googleSignIn(data: GoogleSignInData): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/google', data);
    return response.data;
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const response = await this.client.post('/auth/forgot-password', { email });
    return response.data;
  }

  async getCurrentUser(): Promise<AuthResponse> {
    const response = await this.client.get<AuthResponse>('/auth/me');
    return response.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
    await this.clearToken();
  }

  /**
   * WebAuthn/Biometric Methods
   */

  async registerBiometric(credentialData: any): Promise<{ success: boolean; message: string }> {
    const response = await this.client.post('/webauthn/register', credentialData);
    return response.data;
  }

  async authenticateBiometric(assertionData: any): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/webauthn/authenticate', assertionData);
    return response.data;
  }

  async getBiometricChallenge(): Promise<{ challenge: string }> {
    const response = await this.client.get('/webauthn/challenge');
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
