/**
 * BeautyCita Theme System
 * Central export for all theme values
 */

import colors, { gradients, ThemeMode, getBackgroundColor, getTextColor, getCardBackground } from './colors';
import typography from './typography';
import spacing from './spacing';

export { colors, gradients, typography, spacing };
export type { ThemeMode };
export { getBackgroundColor, getTextColor, getCardBackground };

/**
 * Complete theme object
 */
export const theme = {
  colors,
  gradients,
  typography,
  spacing,
  // Helper functions
  getBackgroundColor,
  getTextColor,
  getCardBackground,
} as const;

export default theme;
