/**
 * Password Reset Screen - Request password reset email
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  useColorScheme,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiService } from '../../services/api';
import { colors, getBackgroundColor, getTextColor } from '../../theme';
import { PillButton, InputField, GradientCard } from '../../components/design-system';

type AuthStackParamList = {
  PasswordReset: undefined;
  Login: undefined;
};

type PasswordResetScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'PasswordReset'
>;

interface Props {
  navigation: PasswordResetScreenNavigationProp;
}

export const PasswordResetScreen: React.FC<Props> = ({ navigation }) => {
  const isDarkMode = useColorScheme() === 'dark';

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Invalid email format');
      return false;
    }
    setError('');
    return true;
  };

  const handleSendResetLink = async () => {
    if (!validateEmail()) return;

    setIsLoading(true);
    try {
      const response = await apiService.requestPasswordReset(email.trim());

      if (response.success) {
        setIsSuccess(true);
        Alert.alert(
          'Check Your Email',
          'We have sent you a password reset link. Please check your inbox and follow the instructions.',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Login'),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Could not send reset link');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <View style={[styles.container, { backgroundColor: getBackgroundColor(isDarkMode ? 'dark' : 'light') }]}>
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✉️</Text>
          <Text style={[styles.successTitle, { color: getTextColor(isDarkMode ? 'dark' : 'light') }]}>
            Check Your Email
          </Text>
          <Text style={[styles.successText, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
            We've sent a password reset link to
          </Text>
          <Text style={[styles.successEmail, { color: getTextColor(isDarkMode ? 'dark' : 'light') }]}>
            {email}
          </Text>
          <Text style={[styles.successInstructions, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
            Click the link in the email to reset your password. The link will expire in 1 hour.
          </Text>

          <PillButton
            onPress={() => navigation.navigate('Login')}
            variant="gradient"
            size="large"
            fullWidth
            style={styles.backButton}
          >
            Back to Login
          </PillButton>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: getBackgroundColor(isDarkMode ? 'dark' : 'light') }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backNavButton}
          onPress={() => navigation.navigate('Login')}
          disabled={isLoading}
        >
          <Text style={styles.backNavText}>← Back to Login</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerIcon}>🔑</Text>
          <Text style={[styles.title, { color: getTextColor(isDarkMode ? 'dark' : 'light') }]}>
            Reset Password
          </Text>
          <Text style={[styles.subtitle, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
            Enter your email address and we'll send you a link to reset your password
          </Text>
        </View>

        {/* Form Card */}
        <GradientCard style={styles.formCard}>
          <InputField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={error}
            editable={!isLoading}
          />

          <PillButton
            onPress={handleSendResetLink}
            variant="gradient"
            size="large"
            fullWidth
            loading={isLoading}
            style={styles.sendButton}
          >
            Send Reset Link
          </PillButton>
        </GradientCard>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Text style={[styles.helpText, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
            Remember your password?{' '}
            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={isLoading}>
              <Text style={styles.helpLink}>Log In</Text>
            </TouchableOpacity>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backNavButton: {
    marginBottom: 24,
  },
  backNavText: {
    fontSize: 16,
    color: colors.pink500,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headerIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formCard: {
    marginBottom: 24,
  },
  sendButton: {
    marginTop: 24,
  },
  helpContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  helpText: {
    fontSize: 16,
  },
  helpLink: {
    color: colors.pink500,
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 100,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  successEmail: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  successInstructions: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 48,
  },
  backButton: {
    width: '100%',
  },
});

export default PasswordResetScreen;
