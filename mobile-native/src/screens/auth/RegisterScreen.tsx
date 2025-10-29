/**
 * Register Screen
 * New user registration
 * Features:
 * - First name input
 * - Last name input
 * - Email input
 * - Phone input (optional)
 * - Password input with strength indicator
 * - Confirm password input
 * - Role selection (Client/Stylist)
 * - Sign up button
 * - Login link
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { InputField, PillButton } from '../../components/design-system';
import { colors, spacing, typography } from '../../theme';
import { authService, UserRole } from '../../services/auth/authService';

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Register'
>;

/**
 * Register Screen Component
 */
export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CLIENT');

  // Error state
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);

  /**
   * Validate first name
   */
  const validateFirstName = (name: string): boolean => {
    if (!name.trim()) {
      setFirstNameError('First name is required');
      return false;
    }
    setFirstNameError('');
    return true;
  };

  /**
   * Validate last name
   */
  const validateLastName = (name: string): boolean => {
    if (!name.trim()) {
      setLastNameError('Last name is required');
      return false;
    }
    setLastNameError('');
    return true;
  };

  /**
   * Validate email format
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  /**
   * Validate phone (optional, but must be valid if provided)
   */
  const validatePhone = (phone: string): boolean => {
    if (phone && phone.length < 10) {
      setPhoneError('Phone must be at least 10 digits');
      return false;
    }
    setPhoneError('');
    return true;
  };

  /**
   * Validate password strength
   */
  const validatePassword = (password: string): boolean => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setPasswordError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setPasswordError('Password must contain at least one number');
      return false;
    }
    setPasswordError('');
    return true;
  };

  /**
   * Validate confirm password
   */
  const validateConfirmPassword = (confirmPassword: string): boolean => {
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  /**
   * Handle registration
   */
  const handleRegister = async () => {
    // Validate all inputs
    const firstNameValid = validateFirstName(firstName);
    const lastNameValid = validateLastName(lastName);
    const emailValid = validateEmail(email);
    const phoneValid = validatePhone(phone);
    const passwordValid = validatePassword(password);
    const confirmPasswordValid = validateConfirmPassword(confirmPassword);

    if (
      !firstNameValid ||
      !lastNameValid ||
      !emailValid ||
      !phoneValid ||
      !passwordValid ||
      !confirmPasswordValid
    ) {
      return;
    }

    setLoading(true);

    try {
      const result = await authService.register({
        email,
        password,
        firstName,
        lastName,
        phone: phone || undefined,
        role,
      });

      if (result.success && result.data) {
        // If phone was provided, navigate to phone verification
        if (phone) {
          navigation.navigate('PhoneVerification', { phone });
        } else {
          // Otherwise, prompt for biometric setup
          navigation.navigate('BiometricSetup');
        }
      } else {
        Alert.alert('Registration Failed', result.error || 'An error occurred');
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigate to Login screen
   */
  const handleLogin = () => {
    navigation.navigate('Login');
  };

  /**
   * Go back to Welcome screen
   */
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Role Selection */}
            <View style={styles.roleContainer}>
              <Text style={styles.roleLabel}>I am a:</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === 'CLIENT' && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole('CLIENT')}>
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === 'CLIENT' && styles.roleButtonTextActive,
                    ]}>
                    Client
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    role === 'STYLIST' && styles.roleButtonActive,
                  ]}
                  onPress={() => setRole('STYLIST')}>
                  <Text
                    style={[
                      styles.roleButtonText,
                      role === 'STYLIST' && styles.roleButtonTextActive,
                    ]}>
                    Stylist
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* First Name */}
            <InputField
              label="First Name"
              placeholder="Enter your first name"
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                setFirstNameError('');
              }}
              error={firstNameError}
              autoCapitalize="words"
              required
            />

            {/* Last Name */}
            <InputField
              label="Last Name"
              placeholder="Enter your last name"
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                setLastNameError('');
              }}
              error={lastNameError}
              autoCapitalize="words"
              required
            />

            {/* Email */}
            <InputField
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError('');
              }}
              error={emailError}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              required
            />

            {/* Phone (Optional) */}
            <InputField
              label="Phone Number"
              placeholder="Enter your phone (optional)"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                setPhoneError('');
              }}
              error={phoneError}
              keyboardType="phone-pad"
              helperText="We'll send you a verification code"
            />

            {/* Password */}
            <InputField
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError('');
              }}
              error={passwordError}
              secureTextEntry
              helperText="At least 8 characters, 1 uppercase, 1 lowercase, 1 number"
              required
            />

            {/* Confirm Password */}
            <InputField
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setConfirmPasswordError('');
              }}
              error={confirmPasswordError}
              secureTextEntry
              required
            />

            {/* Sign Up Button */}
            <PillButton
              variant="gradient"
              size="large"
              fullWidth
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.button}>
              Sign Up
            </PillButton>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={handleLogin}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  // Header
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  backButton: {
    marginBottom: spacing.lg,
  },
  backButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.pink500,
  },
  title: {
    fontSize: typography.fontSize.h2,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
  },

  // Form
  form: {
    flex: 1,
  },

  // Role Selection
  roleContainer: {
    marginBottom: spacing.lg,
  },
  roleLabel: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  roleButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 9999,
    borderWidth: 2,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: colors.pink500,
    backgroundColor: colors.pink50,
  },
  roleButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.gray600,
  },
  roleButtonTextActive: {
    color: colors.pink500,
  },

  button: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  // Login Link
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  loginText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
  },
  loginLink: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.pink500,
  },
});

export default RegisterScreen;
