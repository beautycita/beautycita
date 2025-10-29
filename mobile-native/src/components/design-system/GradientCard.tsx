/**
 * GradientCard Component
 * Rounded-3xl cards with optional gradient overlay
 * Matches web app card design
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing } from '../../theme';

export interface GradientCardProps {
  /**
   * Card content
   */
  children: React.ReactNode;

  /**
   * Enable gradient overlay
   */
  gradient?: boolean;

  /**
   * Custom gradient colors
   */
  gradientColors?: string[];

  /**
   * Card padding size
   */
  padding?: 'small' | 'default' | 'large' | 'none';

  /**
   * Make card pressable
   */
  onPress?: () => void;

  /**
   * Dark mode
   */
  darkMode?: boolean;

  /**
   * Custom container style
   */
  style?: ViewStyle;

  /**
   * Shadow elevation
   */
  elevation?: 'none' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl';

  /**
   * Disable default shadow
   */
  noShadow?: boolean;
}

export const GradientCard: React.FC<GradientCardProps> = ({
  children,
  gradient = false,
  gradientColors = ['rgba(236, 72, 153, 0.1)', 'rgba(147, 51, 234, 0.1)'],
  padding = 'default',
  onPress,
  darkMode = false,
  style,
  elevation = 'md',
  noShadow = false,
}) => {
  const paddingStyle = getPaddingStyle(padding);
  const shadowStyle = noShadow ? {} : getShadowStyle(elevation);
  const backgroundColor = darkMode ? colors.gray800 : colors.white;

  // Pressable card
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[
          styles.container,
          { backgroundColor },
          shadowStyle,
          style,
        ]}>
        {gradient ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradientOverlay, paddingStyle]}>
            {children}
          </LinearGradient>
        ) : (
          <View style={paddingStyle}>{children}</View>
        )}
      </TouchableOpacity>
    );
  }

  // Static card
  return (
    <View
      style={[
        styles.container,
        { backgroundColor },
        shadowStyle,
        style,
      ]}>
      {gradient ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradientOverlay, paddingStyle]}>
          {children}
        </LinearGradient>
      ) : (
        <View style={paddingStyle}>{children}</View>
      )}
    </View>
  );
};

/**
 * Get padding style based on size
 */
function getPaddingStyle(size: 'small' | 'default' | 'large' | 'none'): ViewStyle {
  switch (size) {
    case 'small':
      return { padding: spacing.md };
    case 'default':
      return { padding: spacing.lg };
    case 'large':
      return { padding: spacing.xl };
    case 'none':
      return {};
  }
}

/**
 * Get shadow style based on elevation
 */
function getShadowStyle(elevation: string): ViewStyle {
  const shadows: Record<string, ViewStyle> = {
    none: {},
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    base: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 15,
      elevation: 5,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.15,
      shadowRadius: 25,
      elevation: 8,
    },
    '2xl': {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 25 },
      shadowOpacity: 0.2,
      shadowRadius: 50,
      elevation: 12,
    },
  };
  return shadows[elevation] || shadows.md;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 48, // rounded-3xl
    overflow: 'hidden',
  },
  gradientOverlay: {
    borderRadius: 48,
  },
});

export default GradientCard;
