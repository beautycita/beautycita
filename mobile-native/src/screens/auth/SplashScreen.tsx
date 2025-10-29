/**
 * Splash Screen - Shows BeautyCita logo while checking auth state
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, useColorScheme, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, gradients } from '../../theme';
import { LoadingSpinner } from '../../components/design-system';

const { width, height } = Dimensions.get('window');

export const SplashScreen: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <LinearGradient
      colors={gradients.primary.colors}
      start={gradients.primary.start}
      end={gradients.primary.end}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo Text */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>BeautyCita</Text>
          <Text style={styles.tagline}>Your Beauty, Your Way</Text>
        </View>

        {/* Loading Spinner */}
        <View style={styles.spinnerContainer}>
          <LoadingSpinner size="large" color={colors.white} />
        </View>
      </View>

      {/* Bottom Text */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Loading your beauty experience...</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 18,
    color: colors.white,
    marginTop: 12,
    opacity: 0.95,
    letterSpacing: 1,
  },
  spinnerContainer: {
    marginTop: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
  },
});

export default SplashScreen;
