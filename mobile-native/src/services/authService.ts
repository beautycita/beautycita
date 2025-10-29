/**
 * BeautyCita Mobile App - Authentication Service
 *
 * Handles all authentication operations:
 * - Email/password login
 * - User registration
 * - Google OAuth
 * - Biometric authentication
 * - Token management
 */

import apiClient, {setAuthToken, clearAuthTokens, getAuthToken} from './apiClient';
import {User, LoginCredentials, RegisterData, AuthTokens} from '../types';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import ReactNativeBiometrics from 'react-native-biometrics';

// ============================================================================
// Initialize Services
// ============================================================================

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // Replace with actual client ID
  offlineAccess: true,
});

// Initialize biometrics
const rnBiometrics = new ReactNativeBiometrics({
  allowDeviceCredentials: true,
});

// ============================================================================
// Authentication Service
// ============================================================================

class AuthService {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await apiClient.post<{user: User; token: string; refreshToken?: string}>(
        '/auth/login',
        credentials,
      );

      const {user, token, refreshToken} = response.data;

      // Store tokens
      await setAuthToken(token, refreshToken);

      return user;
    } catch (error) {
      console.error('[Auth Service] Login error:', error);
      throw error;
    }
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<User> {
    try {
      const response = await apiClient.post<{user: User; token: string; refreshToken?: string}>(
        '/auth/register',
        data,
      );

      const {user, token, refreshToken} = response.data;

      // Store tokens
      await setAuthToken(token, refreshToken);

      return user;
    } catch (error) {
      console.error('[Auth Service] Registration error:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google
   */
  async googleSignIn(): Promise<User> {
    try {
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices();

      // Get user info and ID token
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo.data?.idToken) {
        throw new Error('Failed to get Google ID token');
      }

      // Send ID token to backend
      const response = await apiClient.post<{user: User; token: string; refreshToken?: string}>(
        '/auth/google',
        {
          id_token: userInfo.data.idToken,
        },
      );

      const {user, token, refreshToken} = response.data;

      // Store tokens
      await setAuthToken(token, refreshToken);

      return user;
    } catch (error) {
      console.error('[Auth Service] Google sign-in error:', error);
      throw error;
    }
  }

  /**
   * Login with biometric authentication (WebAuthn)
   */
  async biometricLogin(): Promise<User> {
    try {
      // Check if biometrics are available
      const {available, biometryType} = await rnBiometrics.isSensorAvailable();

      if (!available) {
        throw new Error('Biometric authentication not available on this device');
      }

      // Request login challenge from server
      const challengeResponse = await apiClient.post<{
        challenge: string;
        credentialIds: string[];
      }>('/webauthn/login/options');

      const {challenge, credentialIds} = challengeResponse.data;

      if (!credentialIds || credentialIds.length === 0) {
        throw new Error('No biometric credentials registered. Please register first.');
      }

      // Create signature with biometrics
      const signatureResult = await rnBiometrics.createSignature({
        promptMessage: 'Sign in to BeautyCita',
        payload: challenge,
      });

      if (!signatureResult.success) {
        throw new Error('Biometric authentication failed');
      }

      // Verify authentication with server
      const verifyResponse = await apiClient.post<{user: User; token: string; refreshToken?: string}>(
        '/webauthn/login/verify',
        {
          credential_id: credentialIds[0], // Use first available credential
          challenge,
          signature: signatureResult.signature,
        },
      );

      const {user, token, refreshToken} = verifyResponse.data;

      // Store tokens
      await setAuthToken(token, refreshToken);

      return user;
    } catch (error) {
      console.error('[Auth Service] Biometric login error:', error);
      throw error;
    }
  }

  /**
   * Register biometric authentication for current user
   */
  async registerBiometric(): Promise<boolean> {
    try {
      // Check if biometrics are available
      const {available} = await rnBiometrics.isSensorAvailable();

      if (!available) {
        throw new Error('Biometric authentication not available on this device');
      }

      // Request registration challenge from server
      const challengeResponse = await apiClient.post<{challenge: string}>(
        '/webauthn/register/options',
      );

      const {challenge} = challengeResponse.data;

      // Create biometric keys
      const {publicKey} = await rnBiometrics.createKeys();

      // Create signature to verify key ownership
      const signatureResult = await rnBiometrics.createSignature({
        promptMessage: 'Register biometric authentication',
        payload: challenge,
      });

      if (!signatureResult.success) {
        throw new Error('Failed to create biometric signature');
      }

      // Send public key and signature to server
      await apiClient.post('/webauthn/register/verify', {
        challenge,
        public_key: publicKey,
        signature: signatureResult.signature,
        device_name: 'Mobile Device', // Could get actual device name
      });

      return true;
    } catch (error) {
      console.error('[Auth Service] Biometric registration error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint (optional, to invalidate token on server)
      await apiClient.post('/auth/logout').catch(() => {
        // Ignore errors, we'll clear local tokens anyway
      });

      // Clear local tokens
      await clearAuthTokens();

      // Sign out from Google if signed in
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        await GoogleSignin.signOut();
      }
    } catch (error) {
      console.error('[Auth Service] Logout error:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const token = await getAuthToken();
      if (!token) {
        return null;
      }

      const response = await apiClient.get<{user: User}>('/auth/me');
      return response.data.user;
    } catch (error) {
      console.error('[Auth Service] Get current user error:', error);
      return null;
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<string> {
    try {
      const response = await apiClient.post<{token: string; refreshToken?: string}>(
        '/auth/refresh',
      );

      const {token, refreshToken} = response.data;

      // Store new tokens
      await setAuthToken(token, refreshToken);

      return token;
    } catch (error) {
      console.error('[Auth Service] Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Check if biometric authentication is available
   */
  async isBiometricAvailable(): Promise<{available: boolean; biometryType?: string}> {
    try {
      const result = await rnBiometrics.isSensorAvailable();
      return {
        available: result.available,
        biometryType: result.biometryType,
      };
    } catch (error) {
      console.error('[Auth Service] Check biometric availability error:', error);
      return {available: false};
    }
  }

  /**
   * Check if user has registered biometric credentials
   */
  async hasBiometricCredentials(): Promise<boolean> {
    try {
      const {keysExist} = await rnBiometrics.biometricKeysExist();
      return keysExist;
    } catch (error) {
      console.error('[Auth Service] Check biometric credentials error:', error);
      return false;
    }
  }

  /**
   * Delete biometric credentials
   */
  async deleteBiometricCredentials(): Promise<void> {
    try {
      await rnBiometrics.deleteKeys();
      // Also notify server to remove credentials
      await apiClient.delete('/webauthn/credentials').catch(() => {
        // Ignore errors
      });
    } catch (error) {
      console.error('[Auth Service] Delete biometric credentials error:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      await apiClient.post('/auth/forgot-password', {email});
    } catch (error) {
      console.error('[Auth Service] Request password reset error:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        password: newPassword,
      });
    } catch (error) {
      console.error('[Auth Service] Reset password error:', error);
      throw error;
    }
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
    } catch (error) {
      console.error('[Auth Service] Change password error:', error);
      throw error;
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      await apiClient.post('/auth/verify-email', {token});
    } catch (error) {
      console.error('[Auth Service] Verify email error:', error);
      throw error;
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<void> {
    try {
      await apiClient.post('/auth/resend-verification');
    } catch (error) {
      console.error('[Auth Service] Resend email verification error:', error);
      throw error;
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

const authService = new AuthService();
export default authService;
