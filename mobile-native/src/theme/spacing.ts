/**
 * BeautyCita Spacing & Sizing System
 * Matching web app layout system
 *
 * Key principles:
 * - 48px minimum touch targets (WCAG AA compliant)
 * - 8px base spacing unit
 * - Rounded corners matching web (rounded-full, rounded-3xl, rounded-2xl)
 */

/**
 * Base spacing unit: 8px
 * All spacing should be multiples of this
 */
const BASE_UNIT = 8;

/**
 * Spacing scale (multipliers of BASE_UNIT)
 */
export const spacing = {
  xs: BASE_UNIT * 0.5,    // 4px
  sm: BASE_UNIT,          // 8px
  md: BASE_UNIT * 2,      // 16px
  lg: BASE_UNIT * 3,      // 24px
  xl: BASE_UNIT * 4,      // 32px
  '2xl': BASE_UNIT * 6,   // 48px
  '3xl': BASE_UNIT * 8,   // 64px
  '4xl': BASE_UNIT * 10,  // 80px
  '5xl': BASE_UNIT * 12,  // 96px
} as const;

/**
 * Border radius values matching web app
 */
export const borderRadius = {
  // Web: rounded-sm
  sm: 2,

  // Web: rounded
  base: 4,

  // Web: rounded-md
  md: 6,

  // Web: rounded-lg
  lg: 8,

  // Web: rounded-xl
  xl: 12,

  // Web: rounded-2xl (inputs)
  '2xl': 16,

  // Web: rounded-3xl (cards)
  '3xl': 48,

  // Web: rounded-full (buttons)
  full: 9999,
} as const;

/**
 * Touch target sizes (WCAG AA minimum: 48x48px)
 */
export const touchTarget = {
  // Minimum for WCAG AA compliance
  min: 48,

  // Small interactive elements
  small: 48,

  // Default buttons and inputs
  default: 48,

  // Large call-to-action buttons
  large: 56,

  // Extra large hero CTAs
  xlarge: 64,
} as const;

/**
 * Button sizes matching web app
 */
export const buttonSizes = {
  // Small: px-4 py-2 (web)
  small: {
    paddingHorizontal: spacing.md,    // 16px
    paddingVertical: spacing.sm,      // 8px
    height: touchTarget.small,        // 48px (ensures touch target)
    fontSize: 14,
  },

  // Default: px-6 py-3 (web)
  default: {
    paddingHorizontal: spacing.lg,    // 24px
    paddingVertical: spacing.md,      // 16px
    height: touchTarget.default,      // 48px
    fontSize: 16,
  },

  // Large: px-8 py-4 (web)
  large: {
    paddingHorizontal: spacing.xl,    // 32px
    paddingVertical: spacing.lg,      // 24px
    height: touchTarget.large,        // 56px
    fontSize: 18,
  },

  // Extra large
  xlarge: {
    paddingHorizontal: spacing['2xl'], // 48px
    paddingVertical: spacing.xl,       // 32px
    height: touchTarget.xlarge,        // 64px
    fontSize: 20,
  },
} as const;

/**
 * Input field sizes
 */
export const inputSizes = {
  default: {
    height: touchTarget.default,       // 48px
    paddingHorizontal: spacing.md,     // 16px
    fontSize: 16,
    borderRadius: borderRadius['2xl'], // rounded-2xl
  },
  large: {
    height: touchTarget.large,         // 56px
    paddingHorizontal: spacing.lg,     // 24px
    fontSize: 18,
    borderRadius: borderRadius['2xl'],
  },
} as const;

/**
 * Card padding sizes
 */
export const cardPadding = {
  small: spacing.md,    // 16px
  default: spacing.lg,  // 24px
  large: spacing.xl,    // 32px
} as const;

/**
 * Shadow elevations (matching web box-shadow)
 */
export const shadows = {
  none: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 8,
  },
  '2xl': {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.2,
    shadowRadius: 50,
    elevation: 12,
  },
} as const;

/**
 * Screen padding (safe area aware)
 */
export const screenPadding = {
  horizontal: spacing.md,  // 16px
  vertical: spacing.lg,    // 24px
} as const;

/**
 * Container max widths (for tablet/larger screens)
 */
export const containerMaxWidth = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export default {
  spacing,
  borderRadius,
  touchTarget,
  buttonSizes,
  inputSizes,
  cardPadding,
  shadows,
  screenPadding,
  containerMaxWidth,
};
