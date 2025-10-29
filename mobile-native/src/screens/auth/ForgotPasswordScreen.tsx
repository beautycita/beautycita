/**
 * Forgot Password Screen
 * Request password reset email
 * Features:
 * - Email input
 * - Submit button
 * - Success message
 * - Back to login link
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
import { InputField, PillButton, GradientCard } from '../../components/design-system';
import { colors, spacing, typography } from '../../theme';
import { authService } from '../../services/auth/authService';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;

/**
 * Forgot Password Screen Component
 */
export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();

  // Form state
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
   * Handle password reset request
   */
  const handleSubmit = async () => {
    // Validate email
    if (!validateEmail(email)) {
      return;
    }

    setLoading(true);

    try {
      const result = await authService.forgotPassword(email);

      if (result.success) {
        setSubmitted(true);
      } else {
        Alert.alert('Request Failed', result.error || 'Could not send reset email');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigate back to Login
   */
  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  /**
   * Go back
   */
  const handleBack = () => {
    navigation.goBack();
  };

  /**
   * Success view
   */
  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* Success Card */}
          <GradientCard gradient padding="large" style={styles.successCard}>
            <Text style={styles.successIcon}>✉️</Text>
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successText}>
              We've sent a password reset link to{'\n'}
              <Text style={styles.successEmail}>{email}</Text>
            </Text>
            <Text style={styles.successNote}>
              Click the link in the email to create a new password.
            </Text>
          </GradientCard>

          {/* Back to Login Button */}
          <PillButton
            variant="gradient"
            size="large"
            fullWidth
            onPress={handleBackToLogin}
            style={styles.button}>
            Back to Login
          </PillButton>

          {/* Note */}
          <Text style={styles.note}>
            Didn't receive the email? Check your spam folder or try again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * Request form view
   */
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

            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a link to reset your password
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
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
              autoFocus
              required
            />

            {/* Submit Button */}
            <PillButton
              variant="gradient"
              size="large"
              fullWidth
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.button}>
              Send Reset Link
            </PillButton>

            {/* Back to Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Remember your password? </Text>
              <TouchableOpacity onPress={handleBackToLogin}>
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
    justifyContent: 'center',
  },

  // Header
  header: {
    marginTop: spacing.xl,
    marginBottom: spacing['2xl'],
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
    lineHeight: 24,
  },

  // Form
  form: {
    flex: 1,
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

  // Success View
  successCard: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: typography.fontSize.h3,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.white,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  successText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
    opacity: 0.9,
    lineHeight: 24,
  },
  successEmail: {
    fontFamily: typography.fontFamilies.bodyMedium,
  },
  successNote: {
    fontSize: typography.fontSize.small,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.8,
  },
  note: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default ForgotPasswordScreen;
