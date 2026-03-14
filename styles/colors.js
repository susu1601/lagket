// MB Bank Color Palette - Minimalist Design System
export const colors = {
  // Primary Colors — soft charcoal accent for text/icons
  primary: {
    50: '#F5F6F8',
    100: '#ECEFF3',
    200: '#D9DEE6',
    300: '#B9C0CC',
    400: '#8E97A6',
    500: '#2D3142', // soft charcoal
    600: '#242838',
    700: '#1C2030',
    800: '#151926',
    900: '#0E121C',
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

  // Neutral Colors
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F6F6F6',
    200: '#EDEDED',
    300: '#E3E3E3',
    400: '#BDBDBD',
    500: '#8F8F8F',
    600: '#6B6B6B',
    700: '#4D4D4D',
    800: '#2F2F2F',
    900: '#1A1A1A',
    950: '#0A0A0A',
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

  // Background Colors — warm, soft canvas
  background: {
    primary: '#F3EAE2', // warm beige canvas
    secondary: '#F7F1EB',
    tertiary: '#FBF7F3',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  // Text Colors
  text: {
    primary: '#171717',
    secondary: '#525252',
    tertiary: '#A3A3A3',
    inverse: '#FFFFFF',
    disabled: '#D4D4D4',
  },

  // Border Colors
  border: {
    light: '#E5E5E5',
    medium: '#D4D4D4',
    dark: '#A3A3A3',
  },

  // Shadow Colors
  shadow: {
    light: 'rgba(0, 0, 0, 0.06)',
    medium: 'rgba(0, 0, 0, 0.1)',
    dark: 'rgba(0, 0, 0, 0.16)',
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
