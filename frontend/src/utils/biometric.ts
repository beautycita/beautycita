/**
 * Unified Biometric Authentication Utility
 * Handles both web (WebAuthn) and Capacitor mobile (native biometric) authentication
 */

import { Capacitor } from '@capacitor/core'
import { BiometricAuth, BiometryErrorType, BiometryError } from '@aparajita/capacitor-biometric-auth'
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn
} from '@simplewebauthn/browser'
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON
} from '@simplewebauthn/types'

export interface BiometricCapabilities {
  isSupported: boolean
  isNative: boolean // true if running in Capacitor
  biometricType?: 'fingerprint' | 'face' | 'iris' | 'multiple' | 'none'
}

export interface BiometricRegistrationResult {
  success: boolean
  credential?: RegistrationResponseJSON | string
  error?: string
}

export interface BiometricAuthenticationResult {
  success: boolean
  assertion?: AuthenticationResponseJSON | string
  error?: string
}

/**
 * Check if biometric authentication is available
 */
export async function checkBiometricAvailability(): Promise<BiometricCapabilities> {
  const isNative = Capacitor.isNativePlatform()

  if (isNative) {
    // Check Capacitor native biometric
    try {
      const result = await BiometricAuth.checkBiometry()

      return {
        isSupported: result.isAvailable,
        isNative: true,
        biometricType: result.biometryType as any
      }
    } catch (error) {
      console.error('Biometric check error:', error)
      return {
        isSupported: false,
        isNative: true,
        biometricType: 'none'
      }
    }
  } else {
    // Check WebAuthn for web browsers
    const isSupported = browserSupportsWebAuthn()

    return {
      isSupported,
      isNative: false,
      biometricType: isSupported ? 'fingerprint' : 'none' // Generic for web
    }
  }
}

/**
 * Register biometric credential
 * For web: Uses WebAuthn
 * For mobile: Uses native biometric (stores in Keychain/Keystore)
 */
export async function registerBiometric(
  options: PublicKeyCredentialCreationOptionsJSON,
  phone: string
): Promise<BiometricRegistrationResult> {
  const isNative = Capacitor.isNativePlatform()

  if (isNative) {
    // Use Capacitor native biometric
    try {
      // Authenticate with biometric to register
      await BiometricAuth.authenticate({
        reason: 'Register your biometric for secure login',
        cancelTitle: 'Cancel',
        iosFallbackTitle: 'Use Passcode',
        androidTitle: 'Biometric Registration',
        androidSubtitle: 'Verify your identity',
        androidConfirmationRequired: false
      })

      // Store credential reference in native storage
      // For native apps, we'll use the phone number as credential identifier
      // and rely on device biometric security
      const credentialId = `native_${phone}_${Date.now()}`

      return {
        success: true,
        credential: credentialId // Return simple credential ID for native
      }

    } catch (error: any) {
      console.error('Native biometric registration error:', error)

      if (error instanceof BiometryError && error.code === BiometryErrorType.biometryLockout) {
        return {
          success: false,
          error: 'Too many failed attempts. Please try again later.'
        }
      }

      return {
        success: false,
        error: error.message || 'Biometric registration failed'
      }
    }

  } else {
    // Use WebAuthn for web
    try {
      const credential = await startRegistration(options)

      return {
        success: true,
        credential
      }
    } catch (error: any) {
      console.error('WebAuthn registration error:', error)

      if (error.name === 'NotAllowedError') {
        return {
          success: false,
          error: 'Biometric registration was cancelled'
        }
      }

      return {
        success: false,
        error: error.message || 'WebAuthn registration failed'
      }
    }
  }
}

/**
 * Authenticate with biometric
 * For web: Uses WebAuthn
 * For mobile: Uses native biometric
 */
export async function authenticateBiometric(
  options?: PublicKeyCredentialRequestOptionsJSON
): Promise<BiometricAuthenticationResult> {
  const isNative = Capacitor.isNativePlatform()

  if (isNative) {
    // Use Capacitor native biometric
    try {
      await BiometricAuth.authenticate({
        reason: 'Log in to BeautyCita',
        cancelTitle: 'Cancel',
        iosFallbackTitle: 'Use Passcode',
        androidTitle: 'Biometric Login',
        androidSubtitle: 'Verify your identity to continue',
        androidConfirmationRequired: false
      })

      // For native, we just verify the biometric - the backend will handle user lookup
      return {
        success: true,
        assertion: 'native_biometric_verified' // Simple flag for native
      }

    } catch (error: any) {
      console.error('Native biometric authentication error:', error)

      if (error instanceof BiometryError) {
        if (error.code === BiometryErrorType.biometryLockout) {
          return {
            success: false,
            error: 'Too many failed attempts. Please try again later.'
          }
        }

        if (error.code === BiometryErrorType.userCancel) {
          return {
            success: false,
            error: 'Authentication cancelled'
          }
        }
      }

      return {
        success: false,
        error: error.message || 'Biometric authentication failed'
      }
    }

  } else {
    // Use WebAuthn for web
    if (!options) {
      return {
        success: false,
        error: 'WebAuthn options required for web authentication'
      }
    }

    try {
      const assertion = await startAuthentication(options)

      return {
        success: true,
        assertion
      }
    } catch (error: any) {
      console.error('WebAuthn authentication error:', error)

      if (error.name === 'NotAllowedError') {
        return {
          success: false,
          error: 'Authentication was cancelled'
        }
      }

      return {
        success: false,
        error: error.message || 'WebAuthn authentication failed'
      }
    }
  }
}

