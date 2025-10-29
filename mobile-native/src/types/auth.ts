/**
 * Authentication Types for BeautyCita Mobile App
 */

export type UserRole = 'CLIENT' | 'STYLIST' | 'ADMIN' | 'SUPERADMIN';

export interface User {
  id: number;
  email: string;
  phone?: string;
  phoneVerified?: boolean;
  role: UserRole;
  name?: string;
  emailVerified?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Client-specific fields
  clientId?: number;

  // Stylist-specific fields
  stylistId?: number;
  businessName?: string;
  bio?: string;
  location?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  name?: string;
}

export interface PhoneVerificationData {
  phone: string;
  code: string;
}

export interface BiometricCredential {
  credentialId: string;
  publicKey: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  requiresPhoneVerification?: boolean;
  phone?: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

export interface GoogleSignInData {
  idToken: string;
  accessToken?: string;
}
