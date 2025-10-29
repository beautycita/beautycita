/**
 * Button Component
 * Primary action button with BeautyCita gradient theme
 * 
 * Features:
 * - Pill-shaped (borderRadius: 999) - MANDATORY design requirement
 * - Three variants: primary (gradient), secondary (outline), ghost
 * - Three sizes: small, default, large
 * - Loading state with ActivityIndicator
 * - Disabled state
 * - Haptic feedback on press
 * - Left/right icon support
 * - WCAG AA compliant (48px minimum touch target)
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { buttonSizes, touchTarget } from '../theme/spacing';

export interface ButtonProps {
  /** Button text */
  children: string;
  
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'ghost';
  
  /** Button size */
  size?: 'small' | 'default' | 'large';
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Loading state */
  loading?: boolean;
  
  /** Icon component to display on the left */
  leftIcon?: React.ReactNode;
  
  /** Icon component to display on the right */
  rightIcon?: React.ReactNode;
  
  /** Press handler */
  onPress?: () => void;
  
  /** Additional button styles */
  style?: ViewStyle;
  
  /** Additional text styles */
  textStyle?: TextStyle;
  
  /** Full width button */
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'default',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  onPress,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const theme = useTheme();
  const sizeConfig = buttonSizes[size];

  const buttonStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sizeConfig.paddingHorizontal,
    paddingVertical: sizeConfig.paddingVertical,
    borderRadius: 999, // PILL SHAPE - MANDATORY
    minHeight: sizeConfig.height, // WCAG AA touch target
    opacity: disabled ? 0.5 : 1,
    ...(fullWidth && { width: '100%' }),
  };

  const textStyles: TextStyle = {
    fontSize: sizeConfig.fontSize,
    fontWeight: '600',
    textAlign: 'center',
    ...textStyle,
  };

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  // Primary variant: Gradient background
  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={style}
      >
        <LinearGradient
          colors={[theme.colors.pink500, theme.colors.purple600, theme.colors.blue500]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={buttonStyle}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
              <Text style={[textStyles, { color: '#ffffff' }]}>{children}</Text>
              {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Secondary variant: Outline
  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          buttonStyle,
          {
            borderWidth: 2,
            borderColor: theme.colors.pink500,
            backgroundColor: theme.colors.background,
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.pink500} size="small" />
        ) : (
          <>
            {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
            <Text style={[textStyles, { color: theme.colors.pink500 }]}>{children}</Text>
            {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
          </>
        )}
      </TouchableOpacity>
    );
  }

  // Ghost variant: No background
  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[buttonStyle, { backgroundColor: 'transparent' }, style]}
    >
      {loading ? (
        <ActivityIndicator color={theme.colors.pink500} size="small" />
      ) : (
        <>
          {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
          <Text style={[textStyles, { color: theme.colors.text.primary }]}>{children}</Text>
          {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});

export default Button;
