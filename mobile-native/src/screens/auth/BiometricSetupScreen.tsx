/**
 * Biometric Setup Screen
 * Enable Touch ID / Face ID for quick login
 * Features:
 * - Biometric capability detection
 * - Explanation of benefits
 * - Enable/Skip options
 * - Registration flow
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { PillButton, GradientCard } from '../../components/design-system';
import { colors, spacing, typography } from '../../theme';
import { authService } from '../../services/auth/authService';

type BiometricSetupScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'BiometricSetup'
>;

/**
 * Biometric Setup Screen Component
 */
export const BiometricSetupScreen: React.FC = () => {
  const navigation = useNavigation<BiometricSetupScreenNavigationProp>();

  const [loading, setLoading] = useState(false);
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
      const typeMap: Record<string, string> = {
        'TouchID': 'Touch ID',
        'FaceID': 'Face ID',
        'Biometrics': 'Biometric',
      };
      setBiometricType(typeMap[biometryType] || 'Biometric');
    }
  };

  /**
   * Handle biometric setup
   */
  const handleEnable = async () => {
    if (!biometricsAvailable) {
      Alert.alert('Not Available', 'Biometric authentication is not available on this device');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.registerBiometric();

      if (result.success) {
        Alert.alert(
          'Success!',
          `${biometricType} has been enabled for quick login`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Registration complete - navigation will be handled by RootNavigator
                console.log('Biometric setup complete');
              },
            },
          ]
        );
      } else {
        Alert.alert('Setup Failed', result.error || 'Could not enable biometric login');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Skip biometric setup
   */
  const handleSkip = () => {
    // Registration complete - navigation will be handled by RootNavigator
    console.log('Biometric setup skipped');
    // In a real app, you'd navigate to the main app here
    // For now, the RootNavigator will handle it based on auth state
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Secure Your Account</Text>
          <Text style={styles.subtitle}>
            {biometricsAvailable
              ? `Enable ${biometricType} for quick and secure login`
              : 'Complete your account setup'}
          </Text>
        </View>

        {/* Info Card */}
        {biometricsAvailable && (
          <GradientCard gradient padding="large" style={styles.card}>
            <Text style={styles.cardTitle}>{`Why use ${biometricType}?`}</Text>
            <View style={styles.benefits}>
              <View style={styles.benefit}>
                <Text style={styles.benefitIcon}>🔒</Text>
                <Text style={styles.benefitText}>More secure than passwords</Text>
              </View>
              <View style={styles.benefit}>
                <Text style={styles.benefitIcon}>⚡</Text>
                <Text style={styles.benefitText}>Login in seconds</Text>
              </View>
              <View style={styles.benefit}>
                <Text style={styles.benefitIcon}>🛡️</Text>
                <Text style={styles.benefitText}>Protects your data</Text>
              </View>
            </View>
          </GradientCard>
        )}

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          {biometricsAvailable ? (
            <>
              <PillButton
                variant="gradient"
                size="large"
                fullWidth
                onPress={handleEnable}
                loading={loading}
                disabled={loading}
                style={styles.button}>
                {`Enable ${biometricType}`}
              </PillButton>

              <PillButton
                variant="ghost"
                size="large"
                fullWidth
                onPress={handleSkip}
                disabled={loading}
                style={styles.button}>
                Skip for Now
              </PillButton>
            </>
          ) : (
            <PillButton
              variant="gradient"
              size="large"
              fullWidth
              onPress={handleSkip}
              style={styles.button}>
              Continue
            </PillButton>
          )}
        </View>

        {/* Note */}
        <Text style={styles.note}>
          You can always enable or disable biometric login in Settings
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing['2xl'],
    paddingBottom: spacing.xl,
    justifyContent: 'space-between',
  },

  // Header
  header: {
    marginBottom: spacing.xl,
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

  // Card
  card: {
    marginBottom: spacing.xl,
  },
  cardTitle: {
    fontSize: typography.fontSize.h3,
    fontFamily: typography.fontFamilies.headingBold,
    color: colors.white,
    marginBottom: spacing.lg,
  },
  benefits: {
    gap: spacing.md,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  benefitText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.white,
    flex: 1,
  },

  // Buttons
  buttonsContainer: {
    marginTop: 'auto',
  },
  button: {
    marginBottom: spacing.md,
  },

  // Note
  note: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray500,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default BiometricSetupScreen;
