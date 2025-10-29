/**
 * LoadingSpinner Component
 * Loading indicator with gradient colors and optional overlay
 * 
 * Features:
 * - ActivityIndicator with brand colors
 * - Size options (small, medium, large)
 * - Optional message text below
 * - Full screen overlay option
 */

import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
  Modal,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme/spacing';
import { fontSize } from '../theme/typography';

export interface LoadingSpinnerProps {
  /** Spinner size */
  size?: 'small' | 'large';
  
  /** Optional loading message */
  message?: string;
  
  /** Show as full screen overlay */
  overlay?: boolean;
  
  /** Custom color */
  color?: string;
  
  /** Container style (only used when overlay=false) */
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  message,
  overlay = false,
  color,
  style,
}) => {
  const theme = useTheme();
  const spinnerColor = color || theme.colors.pink500;

  const content = (
    <View style={[styles.container, overlay && styles.overlayContainer, style]}>
      <ActivityIndicator size={size} color={spinnerColor} />
      {message && (
        <Text
          style={[
            styles.message,
            { color: overlay ? '#ffffff' : theme.colors.text.primary },
          ]}
        >
          {message}
        </Text>
      )}
    </View>
  );

  if (overlay) {
    return (
      <Modal transparent visible animationType="fade">
        <View style={styles.modalBackground}>
          {content}
        </View>
      </Modal>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  overlayContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 16,
    padding: spacing.xl,
  },
  modalBackground: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  message: {
    marginTop: spacing.md,
    fontSize: fontSize.base,
    textAlign: 'center',
  },
});

export default LoadingSpinner;
