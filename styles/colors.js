// lagket Color Palette - Black & Pink Design System
export const colors = {
  // Primary Colors — pink accent scale
  primary: {
    50: '#FFF2F8',
    100: '#FFD9EC',
    200: '#FFB3DA',
    300: '#FF85C2',
    400: '#FF5AAE',
    500: '#FF3E9D',
    600: '#EA1F86',
    700: '#C3116C',
    800: '#8A0D4C',
    900: '#52072D',
  },

  // Pastel accent palette inspired by reference UI
  pastels: {
    peach: '#F6D6C8',
    sand: '#EEDFD4',
    mint: '#D6F1E4',
    sky: '#DDEBFB',
    lavender: '#E4E0FB',
    lemon: '#F7F3C6',
    rose: '#F7DDE7',
    sage: '#DCEAD9',
  },

  // Neutral Colors (black-first)
  neutral: {
    0: '#FFFFFF',
    50: '#F5F5F7',
    100: '#E8E8EC',
    200: '#CFCFD8',
    300: '#AFAFBD',
    400: '#8C8C9D',
    500: '#6D6D7E',
    600: '#4E4E60',
    700: '#373746',
    800: '#20202A',
    900: '#121218',
    950: '#08080D',
  },

  // Semantic Colors
  success: {
    50: '#F0FDF4',
    500: '#22C55E',
    600: '#16A34A',
  },

  warning: {
    50: '#FFFBEB',
    500: '#F59E0B',
    600: '#D97706',
  },

  error: {
    50: '#FEF2F2',
    500: '#EF4444',
    600: '#DC2626',
  },

  info: {
    50: '#EFF6FF',
    500: '#3B82F6',
    600: '#2563EB',
  },

  // Background Colors — black/pink harmony
  background: {
    primary: '#0D0B12',
    secondary: '#14101C',
    tertiary: '#1A1424',
    overlay: 'rgba(0, 0, 0, 0.62)',
  },

  // Text Colors
  text: {
    primary: '#FFF8FC',
    secondary: '#E0D6DF',
    tertiary: '#A699AB',
    inverse: '#FFFFFF',
    disabled: '#706576',
  },

  // Border Colors
  border: {
    light: '#2B2333',
    medium: '#473A53',
    dark: '#6A557B',
  },

  // Shadow Colors
  shadow: {
    light: 'rgba(0, 0, 0, 0.22)',
    medium: 'rgba(0, 0, 0, 0.32)',
    dark: 'rgba(0, 0, 0, 0.44)',
  },
};

// Common color combinations for easy access
export const colorCombinations = {
  primary: colors.primary[500],
  primaryLight: colors.primary[100],
  primaryDark: colors.primary[700],

  background: colors.background.primary,
  backgroundSecondary: colors.background.secondary,

  textPrimary: colors.text.primary,
  textSecondary: colors.text.secondary,
  textTertiary: colors.text.tertiary,

  border: colors.border.light,
  borderMedium: colors.border.medium,

  success: colors.success[500],
  warning: colors.warning[500],
  error: colors.error[500],
  info: colors.info[500],
};

export default colors;
