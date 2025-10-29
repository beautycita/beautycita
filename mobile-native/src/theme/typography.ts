/**
 * BeautyCita Typography System
 * Exact match to web app design
 *
 * Fonts:
 * - Headings: Playfair Display (serif)
 * - Body: Inter (sans-serif)
 */

import { Platform, TextStyle } from 'react-native';

/**
 * Font families
 * Note: These need to be added to the project via react-native-asset or manual linking
 */
export const fontFamilies = {
  // Headings (Playfair Display)
  headingRegular: Platform.select({
    ios: 'PlayfairDisplay-Regular',
    android: 'PlayfairDisplay-Regular',
  }),
  headingBold: Platform.select({
    ios: 'PlayfairDisplay-Bold',
    android: 'PlayfairDisplay-Bold',
  }),
  headingBlack: Platform.select({
    ios: 'PlayfairDisplay-Black',
    android: 'PlayfairDisplay-Black',
  }),

  // Body text (Inter)
  bodyRegular: Platform.select({
    ios: 'Inter-Regular',
    android: 'Inter-Regular',
  }),
  bodyMedium: Platform.select({
    ios: 'Inter-Medium',
    android: 'Inter-Medium',
  }),
  bodySemiBold: Platform.select({
    ios: 'Inter-SemiBold',
    android: 'Inter-SemiBold',
  }),
  bodyBold: Platform.select({
    ios: 'Inter-Bold',
    android: 'Inter-Bold',
  }),
} as const;

/**
 * Typography scale matching web app
 */
export const fontSize = {
  // Headings (matching web: text-4xl to text-xl)
  h1: 36,      // text-4xl base
  h1Large: 48, // text-6xl md
  h1XLarge: 60, // text-7xl lg

  h2: 30,      // text-3xl base
  h2Large: 36, // text-4xl md
  h2XLarge: 48, // text-5xl lg

  h3: 24,      // text-2xl base
  h3Large: 30, // text-3xl md

  h4: 20,      // text-xl base
  h4Large: 24, // text-2xl md

  // Body text
  large: 18,   // text-lg
  base: 16,    // text-base
  small: 14,   // text-sm
  xs: 12,      // text-xs
} as const;

/**
 * Line heights
 */
export const lineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
} as const;

/**
 * Font weights
 */
export const fontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  black: '900' as TextStyle['fontWeight'],
} as const;

/**
 * Predefined heading styles
 */
export const headingStyles = {
  h1: {
    fontFamily: fontFamilies.headingBold,
    fontSize: fontSize.h1,
    lineHeight: fontSize.h1 * lineHeight.tight,
    fontWeight: fontWeight.bold,
  },
  h1Large: {
    fontFamily: fontFamilies.headingBold,
    fontSize: fontSize.h1Large,
    lineHeight: fontSize.h1Large * lineHeight.tight,
    fontWeight: fontWeight.bold,
  },
  h2: {
    fontFamily: fontFamilies.headingBold,
    fontSize: fontSize.h2,
    lineHeight: fontSize.h2 * lineHeight.tight,
    fontWeight: fontWeight.bold,
  },
  h3: {
    fontFamily: fontFamilies.headingBold,
    fontSize: fontSize.h3,
    lineHeight: fontSize.h3 * lineHeight.normal,
    fontWeight: fontWeight.bold,
  },
  h4: {
    fontFamily: fontFamilies.headingBold,
    fontSize: fontSize.h4,
    lineHeight: fontSize.h4 * lineHeight.normal,
    fontWeight: fontWeight.bold,
  },
} as const;

/**
 * Predefined body text styles
 */
export const bodyStyles = {
  large: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: fontSize.large,
    lineHeight: fontSize.large * lineHeight.normal,
  },
  largeBold: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: fontSize.large,
    lineHeight: fontSize.large * lineHeight.normal,
  },
  base: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
  },
  baseBold: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
  },
  baseSemiBold: {
    fontFamily: fontFamilies.bodySemiBold,
    fontSize: fontSize.base,
    lineHeight: fontSize.base * lineHeight.normal,
  },
  small: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: fontSize.small,
    lineHeight: fontSize.small * lineHeight.normal,
  },
  smallBold: {
    fontFamily: fontFamilies.bodyBold,
    fontSize: fontSize.small,
    lineHeight: fontSize.small * lineHeight.normal,
  },
  xs: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
} as const;

export default {
  fontFamilies,
  fontSize,
  lineHeight,
  fontWeight,
  headingStyles,
  bodyStyles,
};
