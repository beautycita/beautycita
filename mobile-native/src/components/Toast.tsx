/**
 * Toast Component
 * Toast notifications with auto-dismiss
 * 
 * Features:
 * - Auto-dismiss after delay
 * - Types: success, error, warning, info
 * - Slide down from top animation
 * - Optional action button
 * - Queue support for multiple toasts
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing, borderRadius } from '../theme/spacing';
import { fontSize } from '../theme/typography';

export interface ToastProps {
  /** Toast message */
  message: string;
  
  /** Toast type */
  type?: 'success' | 'error' | 'warning' | 'info';
  
  /** Visibility state */
  visible: boolean;
  
  /** Duration in ms (0 = no auto-dismiss) */
  duration?: number;
  
  /** Dismiss handler */
  onDismiss: () => void;
  
  /** Optional action button */
  actionLabel?: string;
  
  /** Action handler */
  onAction?: () => void;
  
  /** Container style */
  style?: ViewStyle;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  visible,
  duration = 3000,
  onDismiss,
  actionLabel,
  onAction,
  style,
}) => {
  const theme = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Slide down
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Auto-dismiss
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      // Slide up
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, duration]);

  const handleDismiss = () => {
    Animated.timing(translateY, {
      toValue: -100,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: theme.colors.success,
          icon: '✓',
        };
      case 'error':
        return {
          bg: theme.colors.error,
          icon: '✕',
        };
      case 'warning':
        return {
          bg: theme.colors.warning,
          icon: '⚠',
        };
      default:
        return {
          bg: theme.colors.info,
          icon: 'ℹ',
        };
    }
  };

  const colors = getColors();

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg,
          transform: [{ translateY }],
        },
        style,
      ]}
    >
      {/* Icon */}
      <Text style={styles.icon}>{colors.icon}</Text>

      {/* Message */}
      <Text style={styles.message}>{message}</Text>

      {/* Action button */}
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} style={styles.actionButton}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}

      {/* Close button */}
      <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius['2xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  icon: {
    fontSize: 20,
    color: '#ffffff',
    marginRight: spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: fontSize.base,
    color: '#ffffff',
    fontWeight: '500',
  },
  actionButton: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  actionText: {
    fontSize: fontSize.small,
    color: '#ffffff',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  closeButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  closeText: {
    fontSize: 18,
    color: '#ffffff',
  },
});

export default Toast;
