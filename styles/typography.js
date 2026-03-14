// Typography System - Clean Sans-serif Design
import { Platform } from 'react-native';

// Font families
export const fontFamilies = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  semiBold: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'System',
  }),
};

// Font sizes - Based on 8pt grid system
export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
};

// Line heights - Optimized for readability
export const lineHeights = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
};

// Font weights
export const fontWeights = {
  normal: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
};

// Typography styles for common use cases
export const typography = {
  // Display styles - For large headings
  display: {
    fontSize: fontSizes['5xl'],
    fontFamily: fontFamilies.bold,
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['5xl'] * lineHeights.tight,
    letterSpacing: -0.5,
  },

  // Heading styles
  h1: {
    fontSize: fontSizes['4xl'],
    fontFamily: fontFamilies.bold,
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['4xl'] * lineHeights.tight,
    letterSpacing: -0.25,
  },

  h2: {
    fontSize: fontSizes['3xl'],
    fontFamily: fontFamilies.bold,
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes['3xl'] * lineHeights.tight,
    letterSpacing: -0.25,
  },

  h3: {
    fontSize: fontSizes['2xl'],
    fontFamily: fontFamilies.semiBold,
    fontWeight: fontWeights.semiBold,
    lineHeight: fontSizes['2xl'] * lineHeights.normal,
  },

  h4: {
    fontSize: fontSizes.xl,
    fontFamily: fontFamilies.semiBold,
    fontWeight: fontWeights.semiBold,
    lineHeight: fontSizes.xl * lineHeights.normal,
  },

  h5: {
    fontSize: fontSizes.lg,
    fontFamily: fontFamilies.medium,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.lg * lineHeights.normal,
  },

  h6: {
    fontSize: fontSizes.base,
    fontFamily: fontFamilies.medium,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.base * lineHeights.normal,
  },

  // Body text styles
  bodyLarge: {
    fontSize: fontSizes.lg,
    fontFamily: fontFamilies.regular,
    fontWeight: fontWeights.normal,
    lineHeight: fontSizes.lg * lineHeights.relaxed,
  },

  body: {
    fontSize: fontSizes.base,
    fontFamily: fontFamilies.regular,
    fontWeight: fontWeights.normal,
    lineHeight: fontSizes.base * lineHeights.relaxed,
  },

  bodySmall: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.regular,
    fontWeight: fontWeights.normal,
    lineHeight: fontSizes.sm * lineHeights.relaxed,
  },

  // Caption and label styles
  caption: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.regular,
    fontWeight: fontWeights.normal,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },

  label: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.medium,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },

  // Button text styles
  buttonLarge: {
    fontSize: fontSizes.lg,
    fontFamily: fontFamilies.medium,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.lg * lineHeights.tight,
  },

  button: {
    fontSize: fontSizes.base,
    fontFamily: fontFamilies.medium,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.base * lineHeights.tight,
  },

  buttonSmall: {
    fontSize: fontSizes.sm,
    fontFamily: fontFamilies.medium,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.sm * lineHeights.tight,
  },

  // Special styles
  overline: {
    fontSize: fontSizes.xs,
    fontFamily: fontFamilies.medium,
    fontWeight: fontWeights.medium,
    lineHeight: fontSizes.xs * lineHeights.normal,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  code: {
    fontSize: fontSizes.sm,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontWeight: fontWeights.normal,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
};

export default typography;
