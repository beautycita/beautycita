/**
 * Card Component
 * Container component with rounded-3xl corners and shadow
 * 
 * Features:
 * - Rounded-3xl corners (48px) - matches web design
 * - Shadow/elevation
 * - Padding options
 * - Dark mode support
 * - Pressable option for touchable cards
 * - Optional gradient overlay
 */

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { borderRadius, cardPadding, shadows } from '../theme/spacing';

export interface CardProps {
  /** Card content */
  children: React.ReactNode;
  
  /** Padding size */
  padding?: 'none' | 'small' | 'default' | 'large';
  
  /** Shadow elevation */
  elevation?: 'none' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl';
  
  /** Make card pressable */
  pressable?: boolean;
  
  /** Press handler (only works if pressable=true) */
  onPress?: () => void;
  
  /** Additional card styles */
  style?: ViewStyle;
  
  /** Enable gradient overlay */
  gradientOverlay?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'default',
  elevation = 'md',
  pressable = false,
  onPress,
  style,
  gradientOverlay = false,
}) => {
  const theme = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.card,
    borderRadius: borderRadius['3xl'], // ROUNDED-3XL (48px) - MANDATORY
    overflow: 'hidden',
    ...shadows[elevation],
  };

  const paddingValue = padding !== 'none' ? cardPadding[padding as keyof typeof cardPadding] || cardPadding.default : 0;

  const content = (
    <View style={[cardStyle, style]}>
      {gradientOverlay && (
        <LinearGradient
          colors={['rgba(236, 72, 153, 0.1)', 'rgba(147, 51, 234, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={{ padding: paddingValue }}>
        {children}
      </View>
    </View>
  );

  if (pressable && onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export default Card;
