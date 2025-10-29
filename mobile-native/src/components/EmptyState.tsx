/**
 * EmptyState Component
 * Placeholder for no results or error states
 * 
 * Features:
 * - Icon + message + optional action button
 * - Centered layout
 * - Various states: no results, error, offline
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme/spacing';
import { fontSize } from '../theme/typography';
import Button from './Button';

export interface EmptyStateProps {
  /** Icon emoji or component */
  icon?: string | React.ReactNode;
  
  /** Title message */
  title: string;
  
  /** Description */
  description?: string;
  
  /** Action button text */
  actionLabel?: string;
  
  /** Action handler */
  onAction?: () => void;
  
  /** Container style */
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]}>
      {/* Icon */}
      {icon && (
        <View style={styles.iconContainer}>
          {typeof icon === 'string' ? (
            <Text style={styles.iconEmoji}>{icon}</Text>
          ) : (
            icon
          )}
        </View>
      )}

      {/* Title */}
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
          {description}
        </Text>
      )}

      {/* Action button */}
      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button onPress={onAction}>{actionLabel}</Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  iconEmoji: {
    fontSize: 64,
  },
  title: {
    fontSize: fontSize.h3,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.base,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actionContainer: {
    marginTop: spacing.md,
  },
});

export default EmptyState;
