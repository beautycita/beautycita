/**
 * BeautyCita Design System - Typography
 * Font scales for mobile and desktop
 */

export const typography = {
  // Font Families
  fontFamily: {
    heading: "'Playfair Display', serif",
    body: "'Inter', sans-serif"
  },

  // Mobile Scale (base)
  mobile: {
    xs: '0.75rem',    // 12px - badges, labels
    sm: '0.875rem',   // 14px - body small
    base: '1rem',     // 16px - body default
    lg: '1.125rem',   // 18px - emphasis
    xl: '1.5rem',     // 24px - section headers
    '2xl': '2rem',    // 32px - page titles
    '3xl': '2.5rem',  // 40px - hero titles
    '4xl': '3rem'     // 48px - landing page
  },

  // Desktop Scale (1.125x multiplier)
  desktop: {
    xs: '0.84375rem', // 13.5px
    sm: '0.984375rem', // 15.75px
    base: '1.125rem',  // 18px
    lg: '1.265625rem', // 20.25px
    xl: '1.6875rem',   // 27px
    '2xl': '2.25rem',  // 36px
    '3xl': '2.8125rem', // 45px
    '4xl': '3.375rem'  // 54px
  },

  // Font Weights
  weight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2
  },

  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em'
  }
}

export type Typography = typeof typography
