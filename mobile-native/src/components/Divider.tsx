/**
 * Divider Component
 * Visual separator with optional label
 * 
 * Features:
 * - Horizontal or vertical orientation
 * - Optional label in center
 * - Customizable spacing
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme/spacing';
import { fontSize } from '../theme/typography';

export interface DividerProps {
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  
  /** Optional label */
  label?: string;
  
  /** Spacing around divider */
  spacing?: 'sm' | 'md' | 'lg';
  
  /** Custom style */
  style?: ViewStyle;
}

const spacingMap = {
  sm: spacing.sm,
  md: spacing.md,
  lg: spacing.lg,
};

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  label,
  spacing: spacingSize = 'md',
  style,
}) => {
  const theme = useTheme();
  const spacingValue = spacingMap[spacingSize];

  if (orientation === 'vertical') {
    return (
      <View
        style={[
          styles.vertical,
          {
            backgroundColor: theme.colors.border,
            marginHorizontal: spacingValue,
          },
          style,
        ]}
      />
    );
  }

  // Horizontal with optional label
  if (label) {
    return (
      <View
        style={[
          styles.horizontalWithLabel,
          { marginVertical: spacingValue },
          style,
        ]}
      >
        <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
        <Text style={[styles.label, { color: theme.colors.text.secondary }]}>
          {label}
        </Text>
        <View style={[styles.line, { backgroundColor: theme.colors.border }]} />
      </View>
    );
  }

  // Simple horizontal line
  return (
    <View
      style={[
        styles.horizontal,
        {
          backgroundColor: theme.colors.border,
          marginVertical: spacingValue,
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    height: '100%',
  },
  horizontalWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    height: 1,
  },
  label: {
    marginHorizontal: spacing.md,
    fontSize: fontSize.small,
    fontWeight: '500',
  },
});

export default Divider;
