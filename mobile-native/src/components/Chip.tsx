/**
 * Chip Component
 * Pill-shaped filter chips with selected state
 * 
 * Features:
 * - Pill-shaped (rounded-full)
 * - Selected state (gradient background)
 * - Optional close button
 * - Multiselect support
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme/spacing';
import { fontSize } from '../theme/typography';

export interface ChipProps {
  /** Chip label */
  children: string;
  
  /** Selected state */
  selected?: boolean;
  
  /** Press handler */
  onPress?: () => void;
  
  /** Show close button */
  closable?: boolean;
  
  /** Close handler */
  onClose?: () => void;
  
  /** Chip size */
  size?: 'sm' | 'md' | 'lg';
  
  /** Custom style */
  style?: ViewStyle;
}

const sizeConfig = {
  sm: { paddingH: 12, paddingV: 6, fontSize: 12 },
  md: { paddingH: 16, paddingV: 8, fontSize: 14 },
  lg: { paddingH: 20, paddingV: 10, fontSize: 16 },
};

export const Chip: React.FC<ChipProps> = ({
  children,
  selected = false,
  onPress,
  closable = false,
  onClose,
  size = 'md',
  style,
}) => {
  const theme = useTheme();
  const config = sizeConfig[size];

  const chipStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: config.paddingH,
    paddingVertical: config.paddingV,
    borderRadius: 999, // PILL SHAPE
  };

  const textStyle: TextStyle = {
    fontSize: config.fontSize,
    fontWeight: '600',
  };

  const content = (
    <>
      <Text style={[textStyle, { color: selected ? '#ffffff' : theme.colors.text.primary }]}>
        {children}
      </Text>
      
      {closable && (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          style={styles.closeButton}
        >
          <Text style={{ color: selected ? '#ffffff' : theme.colors.text.primary, fontSize: config.fontSize }}>
            ✕
          </Text>
        </TouchableOpacity>
      )}
    </>
  );

  if (selected) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={style}>
        <LinearGradient
          colors={[theme.colors.pink500, theme.colors.purple600, theme.colors.blue500]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={chipStyle}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        chipStyle,
        {
          backgroundColor: theme.isDark ? theme.colors.gray700 : theme.colors.gray200,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        style,
      ]}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    marginLeft: spacing.xs,
  },
});

export default Chip;
