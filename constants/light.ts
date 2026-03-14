import {
  ITheme,
  ThemeColors,
  ThemeGradients,
  ThemeSizes,
  ThemeSpacing,
} from './types';

import {THEME as commonTheme} from './theme';

export const COLORS: ThemeColors = {
  // default text color
  text: '#ffffff', // White text for dark mode

  // base colors - Updated with new color scheme
  primary: '#ffcc00', // Locket-style yellow/gold accent
  secondary: '#333333',
  tertiary: '#222222',

  // non-colors
  black: '#000000',
  white: '#FFFFFF',

  dark: '#000000',
  light: '#ffffff',

  // gray variations
  gray: '#8e8e93', // Apple system gray

  // colors variations
  danger: '#ff3b30',
  warning: '#ffcc00',
  success: '#34c759',
  info: '#5ac8fa',

  // UI colors for navigation & card
  card: '#1c1c1e', // Dark gray for panels/cards
  background: '#000000', // Solid black background

  // UI color for shadowColor
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.6)',

  // UI color for input borderColor on focus
  focus: '#ffcc00',
  input: '#ffffff',

  // UI color for switch checked/active color
  switchOn: '#34c759',
  switchOff: '#3a3a3c',

  // UI color for checkbox icon checked/active color
  checkbox: ['#ffcc00', '#e5b800'],
  checkboxIcon: '#000000',

  // social colors
  facebook: '#3B5998',
  twitter: '#55ACEE',
  dribbble: '#EA4C89',

  // icon tint color
  icon: '#ffffff',

  // blur tint color
  blurTint: 'dark',

  // product link color
  link: '#5ac8fa',
};

export const GRADIENTS: ThemeGradients = {
  primary: ['#54b6f8', '#4a9fd8', '#3d8bc7'],
  secondary: ['#e6f7ff', '#b3e0ff', '#80c9ff'],
  info: ['#54b6f8', '#3d8bc7'],
  success: ['#2ecc71', '#27ae60'],
  warning: ['#f39c12', '#e67e22'],
  danger: ['#e74c3c', '#c0392b'],

  light: ['#ffffff', '#e6f7ff', '#cceeff'],
  dark: ['#2c3e50', '#34495e'],

  white: [String(COLORS.white), '#f8fcff'],
  black: [String(COLORS.black), '#2c3e50'],

  divider: ['rgba(84, 182, 248, 0.3)', 'rgba(74, 159, 216, 0.6)'],
  menu: [
    'rgba(230, 247, 255, 0.9)',
    'rgba(84, 182, 248, 0.5)',
    'rgba(230, 247, 255, 0.9)',
  ],
};

export const SIZES: ThemeSizes = {
  // global sizes
  base: 8,
  text: 14,
  radius: 4,
  padding: 20,

  // font sizes
  h1: 44,
  h2: 40,
  h3: 32,
  h4: 24,
  h5: 18,
  p: 16,

  // button sizes
  buttonBorder: 1,
  buttonRadius: 8,
  socialSize: 64,
  socialRadius: 16,
  socialIconSize: 26,

  // button shadow
  shadowOffsetWidth: 0,
  shadowOffsetHeight: 7,
  shadowOpacity: 0.07,
  shadowRadius: 4,
  elevation: 2,

  // input sizes
  inputHeight: 46,
  inputBorder: 1,
  inputRadius: 8,
  inputPadding: 12,

  // card sizes
  cardRadius: 16,
  cardPadding: 10,

  // image sizes
  imageRadius: 14,
  avatarSize: 32,
  avatarRadius: 8,

  // switch sizes
  switchWidth: 50,
  switchHeight: 24,
  switchThumb: 20,

  // checkbox sizes
  checkboxWidth: 18,
  checkboxHeight: 18,
  checkboxRadius: 5,
  checkboxIconWidth: 10,
  checkboxIconHeight: 8,

  // product link size
  linkSize: 12,

  multiplier: 2,
};

export const SPACING: ThemeSpacing = {
  xs: SIZES.base * 0.5,
  s: SIZES.base * 1,
  sm: SIZES.base * 2,
  m: SIZES.base * 3,
  md: SIZES.base * 4,
  l: SIZES.base * 5,
  xl: SIZES.base * 6,
  xxl: SIZES.base * 7,
};

export const light: ITheme = {
  ...commonTheme,
  colors: COLORS,
  gradients: GRADIENTS,
  sizes: {...SIZES, ...commonTheme.sizes, ...SPACING},
};
