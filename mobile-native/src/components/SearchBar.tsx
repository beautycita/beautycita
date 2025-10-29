/**
 * SearchBar Component
 * Search input with debounce and clear button
 * 
 * Features:
 * - Magnifying glass icon
 * - Clear button (X)
 * - Debounced onChange (300ms default)
 * - Loading state
 * - Optional filter button
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing, borderRadius, inputSizes } from '../theme/spacing';

export interface SearchBarProps {
  /** Search value */
  value: string;
  
  /** Change handler (debounced) */
  onChange: (value: string) => void;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Loading state */
  loading?: boolean;
  
  /** Debounce delay in ms */
  debounceDelay?: number;
  
  /** Show filter button */
  showFilterButton?: boolean;
  
  /** Filter button press handler */
  onFilterPress?: () => void;
  
  /** Container style */
  style?: ViewStyle;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  loading = false,
  debounceDelay = 300,
  showFilterButton = false,
  onFilterPress,
  style,
}) => {
  const theme = useTheme();
  const [localValue, setLocalValue] = useState(value);

  // Debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [localValue, debounceDelay]);

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.isDark ? theme.colors.gray700 : theme.colors.gray50,
        },
        style,
      ]}
    >
      {/* Search icon */}
      <View style={styles.searchIcon}>
        <Text style={{ fontSize: 18, color: theme.colors.text.secondary }}>🔍</Text>
      </View>

      {/* Input */}
      <TextInput
        value={localValue}
        onChangeText={setLocalValue}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text.secondary}
        style={[styles.input, { color: theme.colors.text.primary }]}
      />

      {/* Loading or Clear button */}
      {loading ? (
        <ActivityIndicator size="small" color={theme.colors.pink500} />
      ) : localValue.length > 0 ? (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Text style={{ fontSize: 18, color: theme.colors.text.secondary }}>✕</Text>
        </TouchableOpacity>
      ) : null}

      {/* Filter button */}
      {showFilterButton && (
        <TouchableOpacity onPress={onFilterPress} style={styles.filterButton}>
          <Text style={{ fontSize: 18, color: theme.colors.pink500 }}>⚙</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: inputSizes.default.height,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius['2xl'],
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: inputSizes.default.fontSize,
  },
  clearButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  filterButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});

export default SearchBar;
