/**
 * Badge Component
 * Small pill-shaped status indicators
 * 
 * Features:
 * - Pill shape (rounded-full)
 * - Color variants: success, warning, error, info
 * - Sizes: sm, md, lg
 * - Dot variant (smaller, just a colored dot with text)
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme/spacing';

export interface BadgeProps {
  /** Badge text */
  children: string;
  
  /** Color variant */
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default';
  
  /** Badge size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Show as dot badge */
  dot?: boolean;
  
  /** Custom style */
  style?: ViewStyle;
}

const sizeConfig = {
  sm: { paddingH: 8, paddingV: 2, fontSize: 10, dotSize: 6 },
  md: { paddingH: 12, paddingV: 4, fontSize: 12, dotSize: 8 },
  lg: { paddingH: 16, paddingV: 6, fontSize: 14, dotSize: 10 },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  style,
}) => {
  const theme = useTheme();
  const config = sizeConfig[size];

  const getColors = () => {
    switch (variant) {
      case 'success':
        return {
          bg: theme.isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
          text: theme.colors.success,
        };
      case 'warning':
        return {
          bg: theme.isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
          text: theme.colors.warning,
        };
      case 'error':
        return {
          bg: theme.isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
          text: theme.colors.error,
        };
      case 'info':
        return {
          bg: theme.isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
          text: theme.colors.info,
        };
      default:
        return {
          bg: theme.isDark ? theme.colors.gray700 : theme.colors.gray200,
          text: theme.colors.text.primary,
        };
    }
  };

  const colors = getColors();

  const badgeStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: config.paddingH,
    paddingVertical: config.paddingV,
    borderRadius: 999, // PILL SHAPE
    backgroundColor: colors.bg,
    alignSelf: 'flex-start',
  };

  const textStyle: TextStyle = {
    fontSize: config.fontSize,
    fontWeight: '600',
    color: colors.text,
  };

  const dotStyle: ViewStyle = {
    width: config.dotSize,
    height: config.dotSize,
    borderRadius: config.dotSize / 2,
    backgroundColor: colors.text,
    marginRight: spacing.xs,
  };

  return (
    <View style={[badgeStyle, style]}>
      {dot && <View style={dotStyle} />}
      <Text style={textStyle}>{children}</Text>
    </View>
  );
};

export default Badge;
