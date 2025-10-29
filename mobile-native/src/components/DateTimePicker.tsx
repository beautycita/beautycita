/**
 * DateTimePicker Component
 * Cross-platform date and time picker
 * 
 * Features:
 * - Uses native iOS/Android pickers
 * - Dark mode support
 * - Min/max date constraints
 * - Multiple modes: date, time, datetime
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useTheme } from '../hooks/useTheme';
import { spacing, borderRadius } from '../theme/spacing';
import { fontSize } from '../theme/typography';

export interface DateTimePickerProps {
  /** Current value */
  value: Date;
  
  /** Change handler */
  onChange: (date: Date) => void;
  
  /** Picker mode */
  mode?: 'date' | 'time' | 'datetime';
  
  /** Label */
  label?: string;
  
  /** Minimum date */
  minimumDate?: Date;
  
  /** Maximum date */
  maximumDate?: Date;
  
  /** Display format function */
  formatDisplay?: (date: Date) => string;
}

const defaultFormatDisplay = (date: Date, mode: 'date' | 'time' | 'datetime' = 'date'): string => {
  if (mode === 'time') {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (mode === 'datetime') {
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  mode = 'date',
  label,
  minimumDate,
  maximumDate,
  formatDisplay,
}) => {
  const theme = useTheme();
  const [isPickerVisible, setPickerVisible] = useState(false);

  const showPicker = () => setPickerVisible(true);
  const hidePicker = () => setPickerVisible(false);

  const handleConfirm = (date: Date) => {
    onChange(date);
    hidePicker();
  };

  const displayValue = formatDisplay
    ? formatDisplay(value)
    : defaultFormatDisplay(value, mode);

  return (
    <View>
      {label && (
        <Text
          style={[
            styles.label,
            { color: theme.colors.text.primary, marginBottom: spacing.sm },
          ]}
        >
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        onPress={showPicker}
        style={[
          styles.pickerButton,
          {
            backgroundColor: theme.isDark ? theme.colors.gray700 : theme.colors.gray50,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Text style={[styles.pickerText, { color: theme.colors.text.primary }]}>
          {displayValue}
        </Text>
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={isPickerVisible}
        mode={mode}
        date={value}
        onConfirm={handleConfirm}
        onCancel={hidePicker}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        isDarkModeEnabled={theme.isDark}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: fontSize.small,
    fontWeight: '600',
  },
  pickerButton: {
    height: 48,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    justifyContent: 'center',
  },
  pickerText: {
    fontSize: fontSize.base,
  },
});

export default DateTimePicker;
