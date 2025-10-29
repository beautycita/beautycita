/**
 * BeautyCita Brand Colors
 * Exact match to web app design system
 */

export const colors = {
  // Primary Gradient (Pink → Purple → Blue)
  pink500: '#ec4899',
  purple600: '#9333ea',
  blue500: '#3b82f6',

  // Extended Pink Palette
  pink400: '#f472b6',
  pink600: '#db2777',

  // Extended Purple Palette
  purple500: '#a855f7',
  purple700: '#7e22ce',

  // Extended Blue Palette
  blue400: '#60a5fa',
  blue600: '#2563eb',

  // Dark Mode Colors
  gray900: '#111827',
  gray800: '#1f2937',
  gray700: '#374151',
  gray600: '#4b5563',
  gray500: '#6b7280',
  gray400: '#9ca3af',
  gray300: '#d1d5db',
  gray200: '#e5e7eb',
  gray100: '#f3f4f6',
  gray50: '#f9fafb',

  // Semantic Colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Success/Error/Warning
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',

  // Status Colors (matching Stripe)
  pending: '#f59e0b',    // Yellow/Orange
  confirmed: '#10b981',  // Green
  completed: '#3b82f6',  // Blue
  cancelled: '#ef4444',  // Red
} as const;

/**
 * Gradient definitions for LinearGradient
 */
export const gradients = {
  // Primary brand gradient (horizontal)
  primary: {
    colors: [colors.pink500, colors.purple600, colors.blue500],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },

  // Primary brand gradient (vertical)
  primaryVertical: {
    colors: [colors.pink500, colors.purple600, colors.blue500],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },

  // Primary brand gradient (diagonal)
  primaryDiagonal: {
    colors: [colors.pink500, colors.purple600, colors.blue500],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // Card gradient overlay
  cardOverlay: {
    colors: ['rgba(236, 72, 153, 0.1)', 'rgba(147, 51, 234, 0.1)'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // Dark mode gradient
  dark: {
    colors: [colors.gray900, colors.gray800],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
} as const;

/**
 * Theme modes
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Get background color for theme mode
 */
export const getBackgroundColor = (mode: ThemeMode) => {
  return mode === 'dark' ? colors.gray900 : colors.white;
};

/**
 * Get text color for theme mode
 */
export const getTextColor = (mode: ThemeMode, variant: 'primary' | 'secondary' = 'primary') => {
  if (mode === 'dark') {
    return variant === 'primary' ? colors.gray100 : colors.gray300;
  }
  return variant === 'primary' ? colors.gray900 : colors.gray600;
};

/**
 * Get card background for theme mode
 */
export const getCardBackground = (mode: ThemeMode) => {
  return mode === 'dark' ? colors.gray800 : colors.white;
};

export default colors;
