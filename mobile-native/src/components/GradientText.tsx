/**
 * GradientText Component
 * Text with BeautyCita brand gradient (pink → purple → blue)
 * 
 * Note: React Native doesn't support gradient text natively.
 * This uses MaskedView with LinearGradient for the effect.
 */

import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useTheme } from '../hooks/useTheme';
import { fontSize as fontSizes } from '../theme/typography';

export interface GradientTextProps extends TextProps {
  /** Text content */
  children: string;
  
  /** Text size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  
  /** Font weight */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
}

export const GradientText: React.FC<GradientTextProps> = ({
  children,
  size = 'md',
  weight = 'bold',
  style,
  ...textProps
}) => {
  const theme = useTheme();

  const sizeMap = {
    sm: fontSizes.small,
    md: fontSizes.base,
    lg: fontSizes.large,
    xl: fontSizes.h4,
    '2xl': fontSizes.h3,
    '3xl': fontSizes.h2,
  };

  const weightMap = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  };

  const textStyle = {
    fontSize: sizeMap[size],
    fontWeight: weightMap[weight] as any,
    ...StyleSheet.flatten(style),
  };

  return (
    <MaskedView
      maskElement={
        <Text {...textProps} style={textStyle}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={[theme.colors.pink500, theme.colors.purple600, theme.colors.blue500]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text {...textProps} style={[textStyle, { opacity: 0 }]}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
};

export default GradientText;
