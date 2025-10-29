/**
 * Login Screen - Email/password, biometric, and Google sign-in
 */

import React, { useState, useEffect } from 'react';
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

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  PasswordReset: undefined;
  BiometricSetup: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const { login, biometricLogin, googleSignIn, checkBiometricAvailability } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const { available } = await checkBiometricAvailability();
    setBiometricAvailable(available);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await login({ email: email.trim(), password });

      if (response.success) {
        // Navigation handled by AuthContext
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid credentials');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setIsLoading(true);
    try {
      await biometricLogin();
      // Success - navigation handled by AuthContext
    } catch (error: any) {
      Alert.alert('Authentication Failed', error.message || 'Biometric login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await googleSignIn();
      // Success - navigation handled by AuthContext
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

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
        <View style={styles.header}>
          <Text style={[styles.title, { color: getTextColor(isDarkMode ? 'dark' : 'light') }]}>
            Welcome Back
          </Text>
          <Text style={[styles.subtitle, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
            Sign in to continue your beauty journey
          </Text>
        </View>

        {/* Login Form Card */}
        <GradientCard style={styles.formCard}>
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
          />

          <InputField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            autoComplete="password"
            error={errors.password}
            editable={!isLoading}
            style={styles.passwordInput}
          />

          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('PasswordReset')}
            disabled={isLoading}
          >
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>

          <PillButton
            onPress={handleLogin}
            variant="gradient"
            size="large"
            fullWidth
            loading={isLoading}
            style={styles.loginButton}
          >
            Log In
          </PillButton>
        </GradientCard>

        {/* Biometric Login */}
        {biometricAvailable && (
          <PillButton
            onPress={handleBiometricLogin}
            variant="outline"
            size="large"
            fullWidth
            disabled={isLoading}
            style={styles.biometricButton}
          >
            Login with Biometrics
          </PillButton>
        )}

        {/* Divider */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: colors.gray400 }]} />
          <Text style={[styles.dividerText, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
            OR
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.gray400 }]} />
        </View>

        {/* Google Sign-In */}
        <PillButton
          onPress={handleGoogleSignIn}
          variant="secondary"
          size="large"
          fullWidth
          disabled={isLoading}
          style={styles.googleButton}
        >
          Continue with Google
        </PillButton>

        {/* Sign Up Link */}
        <TouchableOpacity
          style={styles.signupLink}
          onPress={() => navigation.navigate('Register')}
          disabled={isLoading}
        >
          <Text style={[styles.signupText, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
            Don't have an account?{' '}
            <Text style={styles.signupTextBold}>Sign Up</Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
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
  formCard: {
    marginBottom: 24,
  },
  passwordInput: {
    marginTop: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.pink500,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: 8,
  },
  biometricButton: {
    marginBottom: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '600',
  },
  googleButton: {
    marginBottom: 24,
  },
  signupLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  signupText: {
    fontSize: 16,
  },
  signupTextBold: {
    fontWeight: 'bold',
    color: colors.pink500,
  },
});

export default LoginScreen;
