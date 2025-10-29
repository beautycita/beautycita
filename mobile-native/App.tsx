/**
 * BeautyCita Mobile App
 * Main entry point with authentication and navigation
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Context
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Screens
import {
  SplashScreen,
  WelcomeScreen,
  LoginScreen,
  RegisterScreen,
  PhoneVerificationScreen,
  BiometricSetupScreen,
  PasswordResetScreen,
} from './src/screens/auth';
import { HomeScreen } from './src/screens/main';

// Theme
import { getBackgroundColor } from './src/theme';

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  PhoneVerification: { phone: string };
  BiometricSetup: undefined;
  PasswordReset: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Navigation based on authentication state
 */
const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const isDarkMode = useColorScheme() === 'dark';

  // Show splash while checking auth state
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: getBackgroundColor(isDarkMode ? 'dark' : 'light'),
        },
        animation: 'fade',
      }}
    >
      {isAuthenticated ? (
        // Authenticated Stack
        <Stack.Screen name="Main" component={HomeScreen} />
      ) : (
        // Auth Stack
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
          <Stack.Screen name="BiometricSetup" component={BiometricSetupScreen} />
          <Stack.Screen name="PasswordReset" component={PasswordResetScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

/**
 * Main App Component
 */
function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
