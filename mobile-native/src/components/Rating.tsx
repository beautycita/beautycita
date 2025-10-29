/**
 * Rating Component
 * Star rating display and input
 * 
 * Features:
 * - 5 stars
 * - Half-star support
 * - Read-only or interactive
 * - Size options
 * - Gold color (#fbbf24)
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';

export interface RatingProps {
  /** Rating value (0-5, supports decimals) */
  value: number;
  
  /** Change handler (only for interactive mode) */
  onChange?: (value: number) => void;
  
  /** Read-only mode */
  readOnly?: boolean;
  
  /** Star size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Show numeric value */
  showValue?: boolean;
  
  /** Container style */
  style?: ViewStyle;
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 32,
};

export const Rating: React.FC<RatingProps> = ({
  value,
  onChange,
  readOnly = false,
  size = 'md',
  showValue = false,
  style,
}) => {
  const theme = useTheme();
  const starSize = sizeMap[size];
  const goldColor = '#fbbf24';

  const handleStarPress = (starIndex: number) => {
    if (readOnly || !onChange) return;
    onChange(starIndex + 1);
  };

  const renderStar = (index: number) => {
    const filled = value >= index + 1;
    const halfFilled = value > index && value < index + 1;

    let starIcon = '☆'; // Empty star
    if (filled) {
      starIcon = '★'; // Filled star
    } else if (halfFilled) {
      starIcon = '⯨'; // Half star (approximation)
    }

    const StarComponent = readOnly ? View : TouchableOpacity;

    return (
      <StarComponent
        key={index}
        onPress={() => handleStarPress(index)}
        style={styles.star}
      >
        <Text
          style={{
            fontSize: starSize,
            color: filled || halfFilled ? goldColor : theme.colors.gray300,
          }}
        >
          {starIcon}
        </Text>
      </StarComponent>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.stars}>
        {[0, 1, 2, 3, 4].map(renderStar)}
      </View>
      
      {showValue && (
        <Text
          style={[
            styles.value,
            { color: theme.colors.text.secondary, fontSize: starSize * 0.6 },
          ]}
        >
          {value.toFixed(1)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
  },
  star: {
    marginRight: 2,
  },
  value: {
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default Rating;
