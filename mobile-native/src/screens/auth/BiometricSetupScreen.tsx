/**
 * Biometric Setup Screen - Enable biometric authentication after registration
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { colors, getBackgroundColor, getTextColor } from '../../theme';
import { PillButton, GradientCard } from '../../components/design-system';

type AuthStackParamList = {
  BiometricSetup: undefined;
  Main: undefined;
};

type BiometricSetupScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'BiometricSetup'
>;

interface Props {
  navigation: BiometricSetupScreenNavigationProp;
}

export const BiometricSetupScreen: React.FC<Props> = ({ navigation }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const { setupBiometrics } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleEnableBiometrics = async () => {
    setIsLoading(true);
    try {
      const success = await setupBiometrics();
      if (success) {
        // Navigate to main app
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }
    } catch (error) {
      console.error('Biometric setup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Navigate to main app without biometrics
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor(isDarkMode ? 'dark' : 'light') }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>🔐</Text>
          <Text style={[styles.title, { color: getTextColor(isDarkMode ? 'dark' : 'light') }]}>
            Secure Your Account
          </Text>
          <Text style={[styles.subtitle, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
            Enable biometric authentication for faster, more secure access to your account
          </Text>
        </View>

        {/* Benefits Card */}
        <GradientCard style={styles.benefitsCard}>
          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>⚡</Text>
            <View style={styles.benefitText}>
              <Text style={[styles.benefitTitle, { color: getTextColor(isDarkMode ? 'dark' : 'light') }]}>
                Instant Login
              </Text>
              <Text style={[styles.benefitDescription, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
                Access your account with just a touch or glance
              </Text>
            </View>
          </View>

          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>🛡️</Text>
            <View style={styles.benefitText}>
              <Text style={[styles.benefitTitle, { color: getTextColor(isDarkMode ? 'dark' : 'light') }]}>
                Enhanced Security
              </Text>
              <Text style={[styles.benefitDescription, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
                Your biometric data never leaves your device
              </Text>
            </View>
          </View>

          <View style={styles.benefit}>
            <Text style={styles.benefitIcon}>🚫</Text>
            <View style={styles.benefitText}>
              <Text style={[styles.benefitTitle, { color: getTextColor(isDarkMode ? 'dark' : 'light') }]}>
                No More Passwords
              </Text>
              <Text style={[styles.benefitDescription, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
                Skip typing passwords every time you log in
              </Text>
            </View>
          </View>
        </GradientCard>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <PillButton
            onPress={handleEnableBiometrics}
            variant="gradient"
            size="large"
            fullWidth
            loading={isLoading}
            style={styles.enableButton}
          >
            Enable Biometric Login
          </PillButton>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={isLoading}
          >
            <Text style={[styles.skipText, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
              Skip for now
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Text */}
        <Text style={[styles.infoText, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
          You can enable or disable biometric login anytime in your account settings
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  icon: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  benefitsCard: {
    marginBottom: 48,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  benefitIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    marginBottom: 24,
  },
  enableButton: {
    marginBottom: 16,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});

export default BiometricSetupScreen;
