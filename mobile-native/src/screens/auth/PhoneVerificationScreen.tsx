/**
 * Phone Verification Screen - 6-digit SMS code input
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { colors, getBackgroundColor, getTextColor } from '../../theme';
import { PillButton, GradientCard } from '../../components/design-system';

type AuthStackParamList = {
  PhoneVerification: { phone: string };
  BiometricSetup: undefined;
};

type PhoneVerificationScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'PhoneVerification'
>;

type PhoneVerificationScreenRouteProp = RouteProp<AuthStackParamList, 'PhoneVerification'>;

interface Props {
  navigation: PhoneVerificationScreenNavigationProp;
  route: PhoneVerificationScreenRouteProp;
}

export const PhoneVerificationScreen: React.FC<Props> = ({ navigation, route }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const { verifyPhone, resendVerificationCode } = useAuth();
  const { phone } = route.params;

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Auto-submit when all digits are entered
    if (code.every((digit) => digit !== '')) {
      handleVerify();
    }
  }, [code]);

  const handleCodeChange = (text: string, index: number) => {
    // Only allow single digit
    const digit = text.slice(-1);

    if (!/^\d*$/.test(digit)) return;

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join('');

    if (verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyPhone({
        phone,
        code: verificationCode,
      });

      if (response.success) {
        // Navigate to biometric setup
        navigation.navigate('BiometricSetup');
      } else {
        Alert.alert('Verification Failed', response.message || 'Invalid code');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Verification failed. Please try again.');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsLoading(true);
    try {
      await resendVerificationCode(phone);
      Alert.alert('Code Sent', 'A new verification code has been sent');

      // Reset countdown
      setCanResend(false);
      setResendCountdown(60);

      const timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not resend code');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (phoneNumber: string): string => {
    // Format as (XXX) XXX-XXXX
    if (phoneNumber.length === 10) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
    }
    return phoneNumber;
  };

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor(isDarkMode ? 'dark' : 'light') }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>📱</Text>
          <Text style={[styles.title, { color: getTextColor(isDarkMode ? 'dark' : 'light') }]}>
            Verify Phone Number
          </Text>
          <Text style={[styles.subtitle, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
            We sent a 6-digit code to
          </Text>
          <Text style={[styles.phone, { color: getTextColor(isDarkMode ? 'dark' : 'light') }]}>
            {formatPhone(phone)}
          </Text>
        </View>

        {/* Code Input */}
        <GradientCard style={styles.codeCard}>
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => (inputRefs.current[index] = ref)}
                style={[
                  styles.codeInput,
                  {
                    backgroundColor: getBackgroundColor(isDarkMode ? 'dark' : 'light'),
                    color: getTextColor(isDarkMode ? 'dark' : 'light'),
                    borderColor: digit ? colors.pink500 : colors.gray400,
                  },
                ]}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!isLoading}
                autoFocus={index === 0}
              />
            ))}
          </View>

          <PillButton
            onPress={handleVerify}
            variant="gradient"
            size="large"
            fullWidth
            loading={isLoading}
            disabled={code.some((digit) => !digit)}
            style={styles.verifyButton}
          >
            Verify Code
          </PillButton>
        </GradientCard>

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          <Text style={[styles.resendText, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
            Didn't receive the code?
          </Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={!canResend || isLoading}
            style={styles.resendButton}
          >
            <Text style={[
              styles.resendButtonText,
              { color: canResend ? colors.pink500 : colors.gray400 },
            ]}>
              {canResend ? 'Resend Code' : `Resend in ${resendCountdown}s`}
            </Text>
          </TouchableOpacity>
        </View>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  icon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  phone: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  codeCard: {
    marginBottom: 32,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  verifyButton: {
    marginTop: 8,
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    marginBottom: 8,
  },
  resendButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PhoneVerificationScreen;
