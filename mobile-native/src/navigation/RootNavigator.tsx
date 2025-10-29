/**
 * Root Navigator
 * Main app navigation with authentication check
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { authService, User } from '../services/auth/authService';
import { colors } from '../theme';
import { LoadingSpinner } from '../components/design-system';

// Lazy load navigators
import PublicStack from './PublicStack';
import AuthStack from './AuthStack';
import ClientStack from './ClientStack';
import StylistStack from './StylistStack';
import AdminStack from './AdminStack';
// import BusinessStack from './BusinessStack';

// Lazy load splash screen
// import SplashScreen from '../screens/auth/SplashScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root Navigator Component
 */
export const RootNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  /**
   * Check authentication status on mount
   */
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await authService.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Show loading spinner while checking auth
   */
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" centered />
      </View>
    );
  }

  /**
   * Determine which stack to show based on user role
   */
  const getInitialRoute = (): keyof RootStackParamList => {
    if (!isAuthenticated || !user) {
      return 'Public';
    }

    switch (user.role) {
      case 'CLIENT':
        return 'ClientApp';
      case 'STYLIST':
        return 'StylistApp';
      case 'ADMIN':
      case 'SUPERADMIN':
        return 'AdminApp';
      default:
        return 'Public';
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.white },
        }}>
        {/* Public Stack (Non-authenticated users) */}
        <Stack.Screen name="Public" component={PublicStack} />

        {/* Authentication Stack */}
        <Stack.Screen name="Auth" component={AuthStack} />

        {/* Client App Stack */}
        <Stack.Screen name="ClientApp" component={ClientStack} />

        {/* Stylist App Stack */}
        <Stack.Screen name="StylistApp" component={StylistStack} />

        {/* Business App Stack (for Stylist business management) */}
        {/* <Stack.Screen name="BusinessApp" component={BusinessStack} /> */}

        {/* Admin App Stack */}
        <Stack.Screen name="AdminApp" component={AdminStack} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
});

export default RootNavigator;
