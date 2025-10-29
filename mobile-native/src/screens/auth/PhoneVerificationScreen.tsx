/**
 * Phone Verification Screen
 * SMS code verification
 * Features:
 * - 6-digit code input
 * - Auto-submit on complete
 * - Resend code option
 * - Error handling
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/types';
import { PillButton, LoadingSpinner } from '../../components/design-system';
import { colors, spacing, typography } from '../../theme';
import { authService } from '../../services/auth/authService';

type PhoneVerificationScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'PhoneVerification'
>;

type PhoneVerificationScreenRouteProp = RouteProp<
  AuthStackParamList,
  'PhoneVerification'
>;

/**
 * Phone Verification Screen Component
 */
export const PhoneVerificationScreen: React.FC = () => {
  const navigation = useNavigation<PhoneVerificationScreenNavigationProp>();
  const route = useRoute<PhoneVerificationScreenRouteProp>();
  const { phone } = route.params;

  // Form state
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Refs for input fields
  const inputRefs = useRef<(TextInput | null)[]>([]);

  /**
   * Handle code input change
   */
  const handleCodeChange = (text: string, index: number) => {
    // Only allow numbers
    if (text && !/^\d+$/.test(text)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (text && index === 5 && newCode.every(digit => digit !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  /**
   * Handle backspace
   */
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  /**
   * Handle verification
   */
  const handleVerify = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join('');

    if (codeToVerify.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter all 6 digits');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.verifySMSCode(phone, codeToVerify);

      if (result.success) {
        // Navigate to biometric setup
        navigation.navigate('BiometricSetup');
      } else {
        Alert.alert('Verification Failed', result.error || 'Invalid code');
        // Clear code
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Resend verification code
   */
  const handleResend = async () => {
    setResending(true);

    try {
      const result = await authService.sendSMSVerification(phone);

      if (result.success) {
        Alert.alert('Code Sent', 'A new verification code has been sent');
        // Clear code
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert('Failed', result.error || 'Could not send code');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An error occurred');
    } finally {
      setResending(false);
    }
  };

  /**
   * Go back
   */
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Verify Phone</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.phone}>{phone}</Text>
          </Text>
        </View>

        {/* Code Input */}
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[
                styles.codeInput,
                digit !== '' && styles.codeInputFilled,
              ]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              autoFocus={index === 0}
              editable={!loading}
            />
          ))}
        </View>

        {/* Verify Button */}
        <PillButton
          variant="gradient"
          size="large"
          fullWidth
          onPress={() => handleVerify()}
          loading={loading}
          disabled={loading || code.join('').length !== 6}
          style={styles.button}>
          Verify
        </PillButton>

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <TouchableOpacity onPress={handleResend} disabled={resending}>
            <Text style={[styles.resendLink, resending && styles.resendLinkDisabled]}>
              {resending ? 'Sending...' : 'Resend'}
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: spacing.xl,
  },

  // Header
  header: {
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
  phone: {
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.pink500,
  },

  // Code Input
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing['2xl'],
  },
  codeInput: {
    width: 50,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    fontSize: typography.fontSize.h3,
    fontFamily: typography.fontFamilies.bodyMedium,
    textAlign: 'center',
    color: colors.gray900,
  },
  codeInputFilled: {
    borderColor: colors.pink500,
    backgroundColor: colors.pink50,
  },

  button: {
    marginBottom: spacing.lg,
  },

  // Resend
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  resendText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyRegular,
    color: colors.gray600,
  },
  resendLink: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamilies.bodyMedium,
    color: colors.pink500,
  },
  resendLinkDisabled: {
    opacity: 0.5,
  },
});

export default PhoneVerificationScreen;
