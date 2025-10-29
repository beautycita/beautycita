/**
 * InputField Component
 * Rounded-2xl text inputs matching web app style
 * Supports labels, icons, validation states, and dark mode
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography } from '../../theme';

export interface InputFieldProps extends TextInputProps {
  /**
   * Input label
   */
  label?: string;

  /**
   * Error message (shows red border and error text)
   */
  error?: string;

  /**
   * Helper text (shown below input)
   */
  helperText?: string;

  /**
   * Icon component on the left
   */
  icon?: React.ReactNode;

  /**
   * Icon component on the right
   */
  iconRight?: React.ReactNode;

  /**
   * Dark mode
   */
  darkMode?: boolean;

  /**
   * Container style
   */
  containerStyle?: ViewStyle;

  /**
   * Required field indicator
   */
  required?: boolean;

  /**
   * Disable input
   */
  disabled?: boolean;

  /**
   * Show/hide password toggle (for password inputs)
   */
  secureTextEntry?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  error,
  helperText,
  icon,
  iconRight,
  darkMode = false,
  containerStyle,
  required = false,
  disabled = false,
  secureTextEntry = false,
  value,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const hasError = !!error;
  const showPasswordToggle = secureTextEntry && textInputProps.secureTextEntry !== false;

  // Input colors
  const borderColor = hasError
    ? colors.error
    : isFocused
    ? colors.pink500
    : darkMode
    ? colors.gray600
    : colors.gray300;

  const backgroundColor = disabled
    ? colors.gray100
    : darkMode
    ? colors.gray700
    : colors.white;

  const textColor = darkMode ? colors.white : colors.gray900;
  const placeholderColor = darkMode ? colors.gray400 : colors.gray500;

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <Text style={[styles.label, darkMode && styles.labelDark]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      {/* Input Container */}
      <View
        style={[
          styles.inputContainer,
          { borderColor, backgroundColor },
          isFocused && styles.inputFocused,
          hasError && styles.inputError,
          disabled && styles.inputDisabled,
        ]}>
        {/* Left Icon */}
        {icon && <View style={styles.iconLeft}>{icon}</View>}

        {/* Text Input */}
        <TextInput
          {...textInputProps}
          value={value}
          editable={!disabled}
          secureTextEntry={showPasswordToggle && !isPasswordVisible}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          style={[
            styles.input,
            { color: textColor },
            icon && styles.inputWithLeftIcon,
            (iconRight || showPasswordToggle) && styles.inputWithRightIcon,
          ]}
          placeholderTextColor={placeholderColor}
        />

        {/* Right Icon or Password Toggle */}
        {showPasswordToggle ? (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.iconRight}>
            <Text style={[styles.passwordToggle, { color: darkMode ? colors.gray400 : colors.gray600 }]}>
              {isPasswordVisible ? '👁️' : '👁️‍🗨️'}
            </Text>
          </TouchableOpacity>
        ) : iconRight ? (
          <View style={styles.iconRight}>{iconRight}</View>
        ) : null}
      </View>

      {/* Helper Text or Error */}
      {(error || helperText) && (
        <Text style={[styles.helperText, hasError && styles.errorText, darkMode && !hasError && styles.helperTextDark]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: typography.fontFamilies.bodyMedium,
    fontSize: typography.fontSize.small,
    color: colors.gray900,
    marginBottom: spacing.sm,
  },
  labelDark: {
    color: colors.gray100,
  },
  required: {
    color: colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16, // rounded-2xl
    borderWidth: 2,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  inputFocused: {
    borderColor: colors.pink500,
    shadowColor: colors.pink500,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontFamily: typography.fontFamilies.bodyRegular,
    fontSize: typography.fontSize.base,
    paddingVertical: spacing.sm,
  },
  inputWithLeftIcon: {
    marginLeft: spacing.sm,
  },
  inputWithRightIcon: {
    marginRight: spacing.sm,
  },
  iconLeft: {
    marginRight: spacing.xs,
  },
  iconRight: {
    marginLeft: spacing.xs,
  },
  passwordToggle: {
    fontSize: 20,
  },
  helperText: {
    fontFamily: typography.fontFamilies.bodyRegular,
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  helperTextDark: {
    color: colors.gray400,
  },
  errorText: {
    color: colors.error,
  },
});

export default InputField;
