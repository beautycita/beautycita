/**
 * Home Screen - Main app screen (placeholder)
 */

import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getBackgroundColor, getTextColor } from '../../theme';
import { PillButton } from '../../components/design-system';

export const HomeScreen: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const { user, logout } = useAuth();

  return (
    <View style={[styles.container, { backgroundColor: getBackgroundColor(isDarkMode ? 'dark' : 'light') }]}>
      <Text style={[styles.title, { color: getTextColor(isDarkMode ? 'dark' : 'light') }]}>
        Welcome to BeautyCita!
      </Text>
      <Text style={[styles.subtitle, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
        Hello, {user?.name || user?.email}
      </Text>
      <Text style={[styles.role, { color: getTextColor(isDarkMode ? 'dark' : 'light', 'secondary') }]}>
        Role: {user?.role}
      </Text>

      <PillButton
        onPress={logout}
        variant="outline"
        size="large"
        style={styles.logoutButton}
      >
        Logout
      </PillButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  role: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
  },
  logoutButton: {
    minWidth: 200,
  },
});

export default HomeScreen;
