/**
 * Auth Stack Navigator
 * Handles authentication flow:
 * - Welcome screen
 * - Login (email/password, biometric)
 * - Register (email/password)
 * - Phone verification (SMS)
 * - Forgot password
 * - Reset password
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';

// Import screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import PhoneVerificationScreen from '../screens/auth/PhoneVerificationScreen';
import BiometricSetupScreen from '../screens/auth/BiometricSetupScreen';
// import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * Auth Stack Navigator
 */
export const AuthStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}>
      {/* Welcome Screen - First screen users see */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />

      {/* Login Screen - Email/password + biometric */}
      <Stack.Screen name="Login" component={LoginScreen} />

      {/* Register Screen - Create account */}
      <Stack.Screen name="Register" component={RegisterScreen} />

      {/* Phone Verification - SMS code entry */}
      <Stack.Screen
        name="PhoneVerification"
        component={PhoneVerificationScreen}
        options={{
          title: 'Verify Phone',
        }}
      />

      {/* Biometric Setup - Enable Touch ID / Face ID */}
      <Stack.Screen
        name="BiometricSetup"
        component={BiometricSetupScreen}
        options={{
          title: 'Enable Biometric Login',
        }}
      />

      {/* Forgot Password - Request reset email */}
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          title: 'Reset Password',
        }}
      />

      {/* Reset Password - Enter new password with token */}
      {/* <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
        options={{
          title: 'Create New Password',
        }}
      /> */}
    </Stack.Navigator>
  );
};

export default AuthStack;
