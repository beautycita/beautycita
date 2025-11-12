/**
 * Authentication Context for BeautyCita Mobile App
 * Manages user authentication state and provides auth methods
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBiometrics from 'react-native-biometrics';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { apiService } from '../services/api';
import type {
  User,
  AuthState,
  LoginCredentials,
  RegisterData,
  PhoneVerificationData,
  AuthResponse,
} from '../types/auth';

const rnBiometrics = new ReactNativeBiometrics();

const STORAGE_USER_KEY = '@beautycita:user';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  register: (data: RegisterData) => Promise<AuthResponse>;
  verifyPhone: (data: PhoneVerificationData) => Promise<AuthResponse>;
  resendVerificationCode: (phone: string) => Promise<void>;
  biometricLogin: () => Promise<void>;
  googleSignIn: () => Promise<void>;
  logout: () => Promise<void>;
  setupBiometrics: () => Promise<boolean>;
  checkBiometricAvailability: () => Promise<{ available: boolean; biometryType?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '975426104950-oaa1e9a2pu6hkcb03pvc55ub5ks7kcq3.apps.googleusercontent.com', // From Google Cloud Console
  offlineAccess: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    token: null,
  });

  /**
   * Restore session on app start
   */
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const token = await apiService.getToken();
      const userJson = await AsyncStorage.getItem(STORAGE_USER_KEY);

      if (token && userJson) {
        const user = JSON.parse(userJson) as User;

        // Verify token is still valid by fetching current user
        try {
          const response = await apiService.getCurrentUser();
          if (response.success && response.user) {
            setAuthState({
              user: response.user,
              isAuthenticated: true,
              isLoading: false,
              token,
            });
            return;
          }
        } catch (error) {
          // Token invalid, clear storage
          await clearSession();
        }
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    } finally {
      setAuthState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const clearSession = async () => {
    await apiService.clearToken();
    await AsyncStorage.removeItem(STORAGE_USER_KEY);
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,
    });
  };

  const saveSession = async (token: string, user: User) => {
    await apiService.setToken(token);
    await AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
      token,
    });
  };

  /**
   * Login with email and password
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await apiService.login(credentials);

      if (response.success && response.token && response.user) {
        await saveSession(response.token, response.user);
      }

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  }, []);

  /**
   * Register new user
   */
  const register = useCallback(async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await apiService.register(data);
      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    }
  }, []);

  /**
   * Verify phone number with SMS code
   */
  const verifyPhone = useCallback(async (data: PhoneVerificationData): Promise<AuthResponse> => {
    try {
      const response = await apiService.verifyPhone(data);

      if (response.success && response.token && response.user) {
        await saveSession(response.token, response.user);
      }

      return response;
    } catch (error: any) {
      throw new Error(error.message || 'Phone verification failed');
    }
  }, []);

  /**
   * Resend verification code
   */
  const resendVerificationCode = useCallback(async (phone: string): Promise<void> => {
    try {
      await apiService.resendVerificationCode(phone);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to resend code');
    }
  }, []);

  /**
   * Check if biometric authentication is available
   */
  const checkBiometricAvailability = useCallback(async () => {
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    return { available, biometryType };
  }, []);

  /**
   * Setup biometric authentication (after registration)
   */
  const setupBiometrics = useCallback(async (): Promise<boolean> => {
    try {
      const { available } = await rnBiometrics.isSensorAvailable();

      if (!available) {
        Alert.alert('Not Available', 'Biometric authentication is not available on this device');
        return false;
      }

      const { publicKey } = await rnBiometrics.createKeys();

      if (!publicKey) {
        throw new Error('Failed to create biometric keys');
      }

      // Register biometric with backend
      const challenge = await apiService.getBiometricChallenge();
      await apiService.registerBiometric({
        publicKey,
        challenge: challenge.challenge,
      });

      Alert.alert('Success', 'Biometric authentication enabled');
      return true;
    } catch (error: any) {
      console.error('Biometric setup failed:', error);
      Alert.alert('Setup Failed', error.message || 'Could not enable biometric authentication');
      return false;
    }
  }, []);

  /**
   * Login with biometric authentication
   */
  const biometricLogin = useCallback(async (): Promise<void> => {
    try {
      const { available } = await rnBiometrics.isSensorAvailable();

      if (!available) {
        throw new Error('Biometric authentication not available');
      }

      const { success, signature } = await rnBiometrics.createSignature({
        promptMessage: 'Sign in to BeautyCita',
        payload: Date.now().toString(),
      });

      if (!success || !signature) {
        throw new Error('Biometric authentication failed');
      }

      const response = await apiService.authenticateBiometric({ signature });

      if (response.success && response.token && response.user) {
        await saveSession(response.token, response.user);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Biometric login failed');
    }
  }, []);

  /**
   * Login with Google
   */
  const googleSignIn = useCallback(async (): Promise<void> => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (!userInfo.data?.idToken) {
        throw new Error('Google sign-in failed');
      }

      const response = await apiService.googleSignIn({
        idToken: userInfo.data.idToken,
      });

      if (response.success && response.token && response.user) {
        await saveSession(response.token, response.user);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw new Error(error.message || 'Google sign-in failed');
    }
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await clearSession();
    }
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    verifyPhone,
    resendVerificationCode,
    biometricLogin,
    googleSignIn,
    logout,
    setupBiometrics,
    checkBiometricAvailability,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook to use auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
