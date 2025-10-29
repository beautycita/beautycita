/**
 * BeautyCita Native App
 * Entry point for the mobile application
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation';
import { colors } from './src/theme';

// Services
import notificationService from './src/services/notificationService';
import socketService from './src/services/socketService';
import { authService } from './src/services/authService';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'AsyncStorage has been extracted from react-native core',
]);

function App() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    initializeApp();

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
      notificationService.clearCallbacks();
    };
  }, []);

  /**
   * Initialize app services
   */
  const initializeApp = async () => {
    try {
      // Initialize OneSignal (push notifications)
      notificationService.initialize();

      // Check if user is already authenticated
      const user = await authService.getCurrentUser();
      if (user) {
        // Initialize socket connection for real-time chat
        const token = await authService.getAuthToken();
        if (token) {
          socketService.connect(user.id, token);
        }

        // Set OneSignal user
        await notificationService.setUser(user.id.toString());

        // Set user role for notification segmentation
        await notificationService.setUserRole(user.role);

        console.log('User authenticated:', user.email);
      }

      // Setup notification click handler
      notificationService.onNotificationClicked((action) => {
        console.log('Notification action:', action);
        // TODO: Navigate to appropriate screen based on notification type
      });

      setIsInitializing(false);
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsInitializing(false);
    }
  };

  if (isInitializing) {
    // TODO: Show splash screen
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={colors.white}
            translucent={false}
          />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
