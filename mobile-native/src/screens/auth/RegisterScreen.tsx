/**
 * Register Screen - Role selection and user registration
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
import { useAuth } from '../../context/AuthContext';
import { colors, getBackgroundColor, getTextColor, getCardBackground } from '../../theme';
import { PillButton, InputField, GradientCard } from '../../components/design-system';
import type { UserRole } from '../../types/auth';

type AuthStackParamList = {
  Register: undefined;
  Login: undefined;
  PhoneVerification: { phone: string };
};

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const { register } = useAuth();

  // Form state
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');

    // Format as (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
  };

  const getCleanPhone = (): string => {
    return phone.replace(/\D/g, '');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedRole) {
      newErrors.role = 'Please select a role';
    }

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    const cleanPhone = getCleanPhone();
    if (!cleanPhone) {
      newErrors.phone = 'Phone number is required';
    } else if (cleanPhone.length !== 10) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', Object.values(errors)[0]);
      return;
    }

    setIsLoading(true);
    try {
      const cleanPhone = getCleanPhone();
      const response = await register({
        email: email.trim(),
        password,
        phone: cleanPhone,
        role: selectedRole!,
        name: name.trim(),
      });

      if (response.success) {
        if (response.requiresPhoneVerification) {
          // Navigate to phone verification
          navigation.navigate('PhoneVerification', { phone: cleanPhone });
        } else {
          Alert.alert('Success', 'Account created! Please log in.');
          navigation.navigate('Login');
        }
      } else {
        Alert.alert('Registration Failed', response.message || 'Could not create account');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show role selection first
  if (!selectedRole) {
    return (
      <View style={[styles.container, { backgroundColor: getBackgroundColor(isDarkMode ? 'dark' : 'light') }]}>
        <View style={styles.roleSelectionContainer}>
          <Text style={[styles.title, { color: getTextColor(isDarkMode ? 'dark' : 'light') }]}>
            Join BeautyCita
          </Text>
          <Text style={[styles.subtitle, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
            How would you like to use the app?
          </Text>

          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => setSelectedRole('CLIENT')}
          >
            <GradientCard>
              <View style={styles.roleCardContent}>
                <Text style={styles.roleIcon}>👤</Text>
                <Text style={[styles.roleTitle, { color: getTextColor(isDarkMode ? 'dark' : 'light') }]}>
                  I'm a Client
                </Text>
                <Text style={[styles.roleDescription, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
                  Looking to book beauty services
                </Text>
              </View>
            </GradientCard>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.roleCard}
            onPress={() => setSelectedRole('STYLIST')}
          >
            <GradientCard>
              <View style={styles.roleCardContent}>
                <Text style={styles.roleIcon}>✂️</Text>
                <Text style={[styles.roleTitle, { color: getTextColor(isDarkMode ? 'dark' : 'light') }]}>
                  I'm a Stylist
                </Text>
                <Text style={[styles.roleDescription, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
                  Offering professional beauty services
                </Text>
              </View>
            </GradientCard>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={[styles.loginText, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
              Already have an account?{' '}
              <Text style={styles.loginTextBold}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show registration form
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
        {/* Header */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedRole(null)}
        >
          <Text style={styles.backButtonText}>← Change Role</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: getTextColor(isDarkMode ? 'dark' : 'light') }]}>
            Create Account
          </Text>
          <Text style={[styles.subtitle, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
            Sign up as a {selectedRole === 'CLIENT' ? 'Client' : 'Stylist'}
          </Text>
        </View>

        {/* Registration Form */}
        <GradientCard style={styles.formCard}>
          <InputField
            label="Full Name"
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            autoCapitalize="words"
            autoComplete="name"
            error={errors.name}
            editable={!isLoading}
          />

          <InputField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
            editable={!isLoading}
            style={styles.inputSpacing}
          />

          <InputField
            label="Phone Number"
            value={phone}
            onChangeText={handlePhoneChange}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
            autoComplete="tel"
            error={errors.phone}
            editable={!isLoading}
            style={styles.inputSpacing}
            maxLength={14}
          />

          <InputField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 8 characters"
            secureTextEntry
            autoComplete="password-new"
            error={errors.password}
            editable={!isLoading}
            style={styles.inputSpacing}
          />

          <InputField
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter password"
            secureTextEntry
            autoComplete="password-new"
            error={errors.confirmPassword}
            editable={!isLoading}
            style={styles.inputSpacing}
          />

          {/* Terms Checkbox */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            disabled={isLoading}
          >
            <View style={[
              styles.checkbox,
              agreedToTerms && styles.checkboxChecked,
              { borderColor: errors.terms ? colors.error : colors.gray400 },
            ]}>
              {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={[styles.termsText, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
              I agree to the Terms of Service and Privacy Policy
            </Text>
          </TouchableOpacity>
          {errors.terms && (
            <Text style={styles.errorText}>{errors.terms}</Text>
          )}

          <PillButton
            onPress={handleRegister}
            variant="gradient"
            size="large"
            fullWidth
            loading={isLoading}
            style={styles.registerButton}
          >
            Create Account
          </PillButton>
        </GradientCard>

        {/* Login Link */}
        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
          disabled={isLoading}
        >
          <Text style={[styles.loginText, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
            Already have an account?{' '}
            <Text style={styles.loginTextBold}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  roleSelectionContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.pink500,
    fontWeight: '600',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  roleCard: {
    marginBottom: 20,
  },
  roleCardContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  roleIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 16,
    textAlign: 'center',
  },
  formCard: {
    marginBottom: 24,
  },
  inputSpacing: {
    marginTop: 16,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.pink500,
    borderColor: colors.pink500,
  },
  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: -16,
    marginBottom: 16,
  },
  registerButton: {
    marginTop: 8,
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 16,
  },
  loginTextBold: {
    fontWeight: 'bold',
    color: colors.pink500,
  },
});

export default RegisterScreen;
