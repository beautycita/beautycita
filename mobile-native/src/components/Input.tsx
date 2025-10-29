/**
 * Input Component
 * Text input field with label, error message, and icons
 * 
 * Features:
 * - Label + input + error/helper text
 * - Rounded-2xl (16px) - matches web design
 * - Focus ring: pink-500 glow
 * - Left/right icons
 * - Secure text entry option
 * - Dark mode support
 * - Error state (red border)
 * - WCAG AA compliant (48px height)
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { borderRadius, inputSizes, spacing } from '../theme/spacing';
import { fontSize, fontWeight } from '../theme/typography';

export interface InputProps extends TextInputProps {
  /** Input label */
  label?: string;
  
  /** Error message */
  error?: string;
  
  /** Helper text */
  helperText?: string;
  
  /** Left icon */
  leftIcon?: React.ReactNode;
  
  /** Right icon */
  rightIcon?: React.ReactNode;
  
  /** Container style */
  containerStyle?: ViewStyle;
  
  /** Input size */
  size?: 'default' | 'large';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  size = 'default',
  ...textInputProps
}) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const sizeConfig = inputSizes[size];

  const inputContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.isDark ? theme.colors.gray700 : theme.colors.gray50,
    borderRadius: sizeConfig.borderRadius, // ROUNDED-2XL (16px)
    borderWidth: 2,
    borderColor: error
      ? theme.colors.error
      : isFocused
      ? theme.colors.pink500
      : 'transparent',
    height: sizeConfig.height, // WCAG AA touch target
    paddingHorizontal: sizeConfig.paddingHorizontal,
    // Focus ring glow effect
    ...(isFocused && !error && {
      shadowColor: theme.colors.pink500,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    }),
  };

  const textInputStyle = {
    flex: 1,
    fontSize: sizeConfig.fontSize,
    color: theme.colors.text.primary,
    paddingVertical: 0, // Remove default padding
  };

  return (
    <View style={containerStyle}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: theme.colors.text.primary,
              marginBottom: spacing.sm,
            },
          ]}
        >
          {label}
        </Text>
      )}
      
      <View style={inputContainerStyle}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          {...textInputProps}
          style={textInputStyle}
          placeholderTextColor={theme.colors.text.secondary}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
        />
        
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      
      {error && (
        <Text style={[styles.helperText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}
      
      {helperText && !error && (
        <Text style={[styles.helperText, { color: theme.colors.text.secondary }]}>
          {helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.semibold,
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  helperText: {
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
});

export default Input;
