/**
 * LoadingSpinner Component
 * Branded loading indicator with gradient colors
 */

import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme';

export interface LoadingSpinnerProps {
  /**
   * Spinner size
   */
  size?: 'small' | 'large';

  /**
   * Spinner color
   */
  color?: string;

  /**
   * Center in container
   */
  centered?: boolean;

  /**
   * Container style
   */
  style?: ViewStyle;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  color = colors.pink500,
  centered = false,
  style,
}) => {
  if (centered) {
    return (
      <View style={[styles.centeredContainer, style]}>
        <ActivityIndicator size={size} color={color} />
      </View>
    );
  }

  return <ActivityIndicator size={size} color={color} style={style} />;
};

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingSpinner;
