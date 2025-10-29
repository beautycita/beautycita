/**
 * Welcome Screen
 * First screen users see when opening the app
 * Features:
 * - BeautyCita branding
 * - Gradient background
 * - Login button
 * - Sign Up button
 * - Biometric login option (if available)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { PillButton } from '../../components/design-system';
import { colors, spacing, typography, gradients } from '../../theme';
import { authService } from '../../services/auth/authService';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Welcome'
>;

/**
 * Welcome Screen Component
 */
export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');

  /**
   * Check if biometrics are available
   */
  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const { available, biometryType } = await authService.isBiometricsAvailable();
    setBiometricsAvailable(available);

    if (biometryType) {
      // Map biometry type to user-friendly name
      const typeMap: Record<string, string> = {
        'TouchID': 'Touch ID',
        'FaceID': 'Face ID',
        'Biometrics': 'Biometric',
      };
      setBiometricType(typeMap[biometryType] || 'Biometric');
    }
  };

  /**
   * Navigate to Login screen
   */
  const handleLogin = () => {
    navigation.navigate('Login');
  };

  /**
   * Navigate to Register screen
   */
  const handleSignUp = () => {
    navigation.navigate('Register');
  };

  /**
   * Attempt biometric login
   */
  const handleBiometricLogin = async () => {
    const result = await authService.loginWithBiometric();

    if (result.success && result.data) {
      // Navigation will be handled by RootNavigator
      // when auth state changes
      console.log('Biometric login successful');
    } else {
      console.log('Biometric login failed:', result.error);
      // Could show an alert here
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Gradient Background */}
      <LinearGradient
        colors={gradients.primary.colors}
        start={gradients.primary.start}
        end={gradients.primary.end}
        style={styles.gradientBackground}>

        {/* Content Container */}
        <View style={styles.content}>

          {/* Logo Section */}
          <View style={styles.logoContainer}>
            {/* Placeholder for BeautyCita logo */}
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoText}>BC</Text>
            </View>

            <Text style={styles.title}>BeautyCita</Text>
            <Text style={styles.subtitle}>
              Discover beauty services near you
            </Text>
          </View>

          {/* Buttons Section */}
          <View style={styles.buttonsContainer}>
            {/* Biometric Login Button (if available) */}
            {biometricsAvailable && (
              <PillButton
                variant="solid"
                size="large"
                fullWidth
                onPress={handleBiometricLogin}
                style={styles.button}>
                {`Login with ${biometricType}`}
              </PillButton>
            )}

            {/* Login Button */}
            <PillButton
              variant="solid"
              size="large"
              fullWidth
              onPress={handleLogin}
              style={styles.button}>
              Login
            </PillButton>

            {/* Sign Up Button */}
            <PillButton
              variant="outline"
              size="large"
              fullWidth
              onPress={handleSignUp}
              style={styles.button}>
              Sign Up
            </PillButton>

            {/* Terms Text */}
            <Text style={styles.termsText}>
              By continuing, you agree to our{'\n'}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pink500,
  },
  gradientBackground: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingTop: spacing['3xl'],
    paddingBottom: spacing['2xl'],
  },

  // Logo Section
  logoContainer: {
    alignItems: 'center',
    marginTop: spacing['4xl'],
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoText: {
    fontSize: 48,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.white,
  },
  title: {
    fontSize: typography.fontSize.h1,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },

  // Buttons Section
  buttonsContainer: {
    width: '100%',
  },
  button: {
    marginBottom: spacing.md,
  },
  termsText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.white,
    textAlign: 'center',
    marginTop: spacing.lg,
    opacity: 0.8,
  },
  termsLink: {
    textDecorationLine: 'underline',
    fontFamily: typography.fontFamilies.bodyMedium,
  },
});

export default WelcomeScreen;
