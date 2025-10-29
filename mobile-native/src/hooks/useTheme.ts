/**
 * useTheme Hook
 * Provides theme values and utilities based on current color scheme
 */

import { useColorScheme } from 'react-native';
import colors, { getBackgroundColor, getTextColor, getCardBackground, ThemeMode } from '../theme/colors';
import spacing from '../theme/spacing';
import typography from '../theme/typography';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const mode: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';

  return {
    mode,
    colors: {
      ...colors,
      // Dynamic colors based on theme
      background: getBackgroundColor(mode),
      card: getCardBackground(mode),
      text: {
        primary: getTextColor(mode, 'primary'),
        secondary: getTextColor(mode, 'secondary'),
      },
      border: mode === 'dark' ? colors.gray700 : colors.gray200,
    },
    spacing,
    typography,
    isDark: mode === 'dark',
  };
};

export default useTheme;
