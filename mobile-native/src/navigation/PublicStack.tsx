/**
 * Public Stack Navigator
 * Navigation for non-authenticated users
 * Features:
 * - Landing page as initial route
 * - All public information screens
 * - Seamless transition to auth flow
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PublicStackParamList } from './types';

// Import public screens
import LandingScreen from '../screens/public/LandingScreen';
import AboutScreen from '../screens/public/AboutScreen';
import HowItWorksScreen from '../screens/public/HowItWorksScreen';
import FAQScreen from '../screens/public/FAQScreen';
import ContactScreen from '../screens/public/ContactScreen';
import TermsScreen from '../screens/public/TermsScreen';
import PrivacyScreen from '../screens/public/PrivacyScreen';

// Import auth screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import PhoneVerificationScreen from '../screens/auth/PhoneVerificationScreen';
import BiometricSetupScreen from '../screens/auth/BiometricSetupScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

const Stack = createNativeStackNavigator<PublicStackParamList>();

/**
 * Public Stack Navigator
 */
export const PublicStack: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Landing"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      {/* Landing & Info Screens */}
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="HowItWorks" component={HowItWorksScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />

      {/* Auth Screens */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen
        name="PhoneVerification"
        component={PhoneVerificationScreen}
      />
      <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

export default PublicStack;
