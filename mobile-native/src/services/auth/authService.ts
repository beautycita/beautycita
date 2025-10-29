/**
 * Authentication Service
 * Handles all authentication methods:
 * - Email/Password
 * - Biometric (Touch ID, Face ID)
 * - Google Sign-In
 * - SMS Verification
 */

import { post, storage } from '../api/client';
import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

/**
 * User roles
 */
export type UserRole = 'CLIENT' | 'STYLIST' | 'ADMIN' | 'SUPERADMIN';

/**
 * User data interface
 */
export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  profileImage?: string;
  firstName?: string;
  lastName?: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  isActive: boolean;
  profileComplete: boolean;
}

/**
 * Login response
 */
export interface LoginResponse {
  user: User;
  token: string;
  sessionId?: string;
  stylist?: any;
  client?: any;
}

/**
 * Auth service
 */
class AuthService {
  private biometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

  /**
   * Check if biometrics are available
   */
  async isBiometricsAvailable(): Promise<{
    available: boolean;
    biometryType?: BiometryTypes;
  }> {
    try {
      const { available, biometryType } = await this.biometrics.isSensorAvailable();
      return { available, biometryType };
    } catch (error) {
      console.error('Biometrics check error:', error);
      return { available: false };
    }
  }

  /**
   * Login with email and password
   */
  async loginWithPassword(email: string, password: string): Promise<{
    success: boolean;
    data?: LoginResponse;
    error?: string;
  }> {
    try {
      const response = await post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      if (response.success && response.data) {
        // Save token and user data
        await storage.setAuthToken(response.data.token);
        await storage.setUserData(response.data.user);

        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: response.error || response.message || 'Login failed',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Login failed',
      };
    }
  }

  /**
   * Register new user
   */
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: UserRole;
  }): Promise<{
    success: boolean;
    data?: LoginResponse;
    error?: string;
  }> {
    try {
      const response = await post<LoginResponse>('/auth/register', {
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        role: data.role || 'CLIENT',
      });

      if (response.success && response.data) {
        // Save token and user data
        await storage.setAuthToken(response.data.token);
        await storage.setUserData(response.data.user);

        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: response.error || response.message || 'Registration failed',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Registration failed',
      };
    }
  }

  /**
   * Send SMS verification code
   */
  async sendSMSVerification(phone: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await post('/auth/sms/send', { phone });
      return {
        success: response.success,
        error: response.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to send SMS',
      };
    }
  }

  /**
   * Verify SMS code
   */
  async verifySMSCode(phone: string, code: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await post('/auth/sms/verify', { phone, code });
      return {
        success: response.success,
        error: response.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Verification failed',
      };
    }
  }

  /**
   * Login with biometric authentication
   * Uses stored credentials or prompts for Face ID / Touch ID
   */
  async loginWithBiometric(): Promise<{
    success: boolean;
    data?: LoginResponse;
    error?: string;
  }> {
    try {
      // Check if biometrics are available
      const { available } = await this.isBiometricsAvailable();
      if (!available) {
        return {
          success: false,
          error: 'Biometric authentication not available on this device',
        };
      }

      // Create signature
      const { success, signature } = await this.biometrics.createSignature({
        promptMessage: 'Authenticate to login',
        payload: Date.now().toString(),
      });

      if (!success || !signature) {
        return {
          success: false,
          error: 'Biometric authentication cancelled',
        };
      }

      // Send signature to backend for verification
      const response = await post<LoginResponse>('/auth/biometric/login', {
        signature,
      });

      if (response.success && response.data) {
        await storage.setAuthToken(response.data.token);
        await storage.setUserData(response.data.user);

        return {
          success: true,
          data: response.data,
        };
      }

      return {
        success: false,
        error: response.error || 'Biometric login failed',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Biometric login failed',
      };
    }
  }

  /**
   * Register biometric authentication
   */
  async registerBiometric(): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { available } = await this.isBiometricsAvailable();
      if (!available) {
        return {
          success: false,
          error: 'Biometric authentication not available',
        };
      }

      // Generate key pair
      const { publicKey } = await this.biometrics.createKeys();

      // Register with backend
      const response = await post('/auth/biometric/register', {
        publicKey,
      });

      return {
        success: response.success,
        error: response.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Biometric registration failed',
      };
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    await storage.clearAll();
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    return await storage.getUserData();
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await storage.getAuthToken();
    return !!token;
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }> {
    try {
      const response = await post('/auth/forgot-password', { email });
      return {
        success: response.success,
        error: response.error,
        message: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Request failed',
      };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, password: string): Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }> {
    try {
      const response = await post('/auth/reset-password', { token, password });
      return {
        success: response.success,
        error: response.error,
        message: response.message,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Request failed',
      };
    }
  }
}

export const authService = new AuthService();
export default authService;
