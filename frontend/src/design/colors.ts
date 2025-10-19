/**
 * BeautyCita Design System - Color Palette
 * Instagram-level polish for beauty industry
 */

export const lightTheme = {
  // Primary - Millennial Pink Gradient
  primary: {
    gradient: 'linear-gradient(135deg, #FF6B9D 0%, #C66FBC 100%)',
    main: '#FF6B9D',
    light: '#FFB3D9',
    dark: '#C66FBC',
    soft: '#FFF0F5'
  },

  // Secondary - Gen Z Purple
  secondary: {
    main: '#8B5CF6',
    light: '#A78BFA',
    dark: '#7C3AED',
    soft: '#F3E8FF'
  },

  // Accent Colors
  accent: {
    green: '#67E8B8',
    warning: '#FFB800',
    error: '#FF4757',
    success: '#06D6A0'
  },

  // Neutrals
  white: '#FFFFFF',
  black: '#1A1A1A',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717'
  },

  // Semantic
  background: '#FFFFFF',
  surface: '#FAFAFA',
  elevated: '#FFFFFF',
  text: {
    primary: '#1A1A1A',
    secondary: '#737373',
    disabled: '#D4D4D4'
  },
  border: '#E5E5E5',

  // Special Effects
  glow: '0 0 30px rgba(255, 107, 157, 0.3)',
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    beauty: '0 10px 25px -5px rgba(255, 0, 128, 0.4)'
  }
}

export const darkTheme = {
  // Primary - Adjusted for dark background
  primary: {
    gradient: 'linear-gradient(135deg, rgba(255, 107, 157, 0.9) 0%, rgba(198, 111, 188, 0.9) 100%)',
    main: 'rgba(255, 107, 157, 0.9)',
    light: '#FFB3D9',
    dark: '#C66FBC',
    soft: 'rgba(255, 107, 157, 0.1)'
  },

  // Secondary
  secondary: {
    main: '#A78BFA',
    light: '#C4B5FD',
    dark: '#8B5CF6',
    soft: 'rgba(139, 92, 246, 0.1)'
  },

  // Accent Colors (slightly brighter for dark mode)
  accent: {
    green: '#67E8B8',
    warning: '#FFD93D',
    error: '#FF6B81',
    success: '#06FFA5'
  },

  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#262626',
    100: '#404040',
    200: '#525252',
    300: '#737373',
    400: '#A3A3A3',
    500: '#D4D4D4',
    600: '#E5E5E5',
    700: '#F5F5F5',
    800: '#FAFAFA',
    900: '#FFFFFF'
  },

  // Semantic
  background: '#0F0F0F',
  surface: '#1A1A1A',
  elevated: '#252525',
  text: {
    primary: '#FFFFFF',
    secondary: '#D4D4D4',
    disabled: '#737373'
  },
  border: '#404040',

  // Special Effects (enhanced glow in dark mode)
  glow: '0 0 40px rgba(255, 107, 157, 0.5)',
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
    beauty: '0 10px 30px -5px rgba(255, 107, 157, 0.6)'
  }
}

export type Theme = typeof lightTheme
export type ThemeMode = 'light' | 'dark'
