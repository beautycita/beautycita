/**
 * PillButton Component
 * Rounded-full buttons matching web app style
 * Supports gradient background, solid colors, and outline variants
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, gradients, spacing, typography } from '../../theme';

type ButtonVariant = 'gradient' | 'solid' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'default' | 'large' | 'xlarge';

export interface PillButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /**
   * Button text
   */
  children: string;

  /**
   * Visual variant
   */
  variant?: ButtonVariant;

  /**
   * Button size
   */
  size?: ButtonSize;

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Icon component to display before text
   */
  icon?: React.ReactNode;

  /**
   * Icon component to display after text
   */
  iconRight?: React.ReactNode;

  /**
   * Custom background color (for solid variant)
   */
  backgroundColor?: string;

  /**
   * Custom text color
   */
  textColor?: string;

  /**
   * Full width button
   */
  fullWidth?: boolean;

  /**
   * Custom container style
   */
  containerStyle?: ViewStyle;

  /**
   * Custom text style
   */
  textStyle?: TextStyle;
}

export const PillButton: React.FC<PillButtonProps> = ({
  children,
  variant = 'gradient',
  size = 'default',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  backgroundColor,
  textColor,
  fullWidth = false,
  containerStyle,
  textStyle,
  ...touchableProps
}) => {
  // Get size-specific styles
  const sizeStyles = getSizeStyles(size);
  const isDisabled = disabled || loading;

  // Render gradient button
  if (variant === 'gradient' && !isDisabled) {
    return (
      <TouchableOpacity
        {...touchableProps}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[styles.touchable, fullWidth && styles.fullWidth, containerStyle]}>
        <LinearGradient
          colors={gradients.primary.colors}
          start={gradients.primary.start}
          end={gradients.primary.end}
          style={[
            styles.gradientContainer,
            sizeStyles.container,
            isDisabled && styles.disabled,
          ]}>
          {loading ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <>
              {icon && <>{icon}</>}
              <Text
                style={[
                  styles.text,
                  sizeStyles.text,
                  styles.whiteText,
                  icon && styles.textWithIcon,
                  iconRight && styles.textWithIconRight,
                  textStyle,
                ]}>
                {children}
              </Text>
              {iconRight && <>{iconRight}</>}
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Render solid/outline/ghost variants
  const buttonBackgroundColor = getBackgroundColor(variant, backgroundColor, isDisabled);
  const buttonTextColor = getTextColor(variant, textColor, isDisabled);
  const borderStyle = variant === 'outline' ? styles.outline : undefined;

  return (
    <TouchableOpacity
      {...touchableProps}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.container,
        sizeStyles.container,
        { backgroundColor: buttonBackgroundColor },
        borderStyle,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        containerStyle,
      ]}>
      {loading ? (
        <ActivityIndicator
          color={buttonTextColor}
          size="small"
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              styles.text,
              sizeStyles.text,
              { color: buttonTextColor },
              icon && styles.textWithIcon,
              iconRight && styles.textWithIconRight,
              textStyle,
            ]}>
            {children}
          </Text>
          {iconRight && <>{iconRight}</>}
        </>
      )}
    </TouchableOpacity>
  );
};

/**
 * Get size-specific styles
 */
function getSizeStyles(size: ButtonSize) {
  const sizes = {
    small: {
      container: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        minHeight: 48,
      },
      text: {
        fontSize: 14,
      },
    },
    default: {
      container: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        minHeight: 48,
      },
      text: {
        fontSize: 16,
      },
    },
    large: {
      container: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        minHeight: 56,
      },
      text: {
        fontSize: 18,
      },
    },
    xlarge: {
      container: {
        paddingHorizontal: spacing['2xl'],
        paddingVertical: spacing.xl,
        minHeight: 64,
      },
      text: {
        fontSize: 20,
      },
    },
  };
  return sizes[size];
}

/**
 * Get background color based on variant
 */
function getBackgroundColor(
  variant: ButtonVariant,
  customColor?: string,
  disabled?: boolean,
): string {
  if (disabled) return colors.gray300;
  if (customColor) return customColor;

  switch (variant) {
    case 'solid':
      return colors.pink500;
    case 'outline':
    case 'ghost':
      return colors.transparent;
    default:
      return colors.pink500;
  }
}

/**
 * Get text color based on variant
 */
function getTextColor(
  variant: ButtonVariant,
  customColor?: string,
  disabled?: boolean,
): string {
  if (disabled) return colors.gray500;
  if (customColor) return customColor;

  switch (variant) {
    case 'solid':
    case 'gradient':
      return colors.white;
    case 'outline':
    case 'ghost':
      return colors.pink500;
    default:
      return colors.white;
  }
}

const styles = StyleSheet.create({
  touchable: {
    overflow: 'hidden',
    borderRadius: 9999, // rounded-full
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999, // rounded-full
  },
  gradientContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  text: {
    fontFamily: typography.fontFamilies.bodySemiBold,
    fontWeight: '600',
    textAlign: 'center',
  },
  whiteText: {
    color: colors.white,
  },
  textWithIcon: {
    marginLeft: spacing.sm,
  },
  textWithIconRight: {
    marginRight: spacing.sm,
  },
  outline: {
    borderWidth: 2,
    borderColor: colors.pink500,
  },
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },
});

export default PillButton;
