import {
  ITheme,
  ThemeColors,
  ThemeGradients,
  ThemeSizes,
  ThemeSpacing,
} from "./types";

import { THEME as commonTheme } from "./theme";

export const COLORS: ThemeColors = {
  // default text color
  text: "#fff6fb",

  // base colors - black & pink palette
  primary: "#ff3e9d",
  secondary: "#1b1623",
  tertiary: "#131019",

  // non-colors
  black: "#000000",
  white: "#FFFFFF",

  dark: "#000000",
  light: "#ffffff",

  // gray variations
  gray: "#9e90a5",

  // colors variations
  danger: "#ff3b30",
  warning: "#ff7abf",
  success: "#34c759",
  info: "#ff5db0",

  // UI colors for navigation & card
  card: "#1a1422",
  background: "#0d0b12",

  // UI color for shadowColor
  shadow: "#000000",
  overlay: "rgba(0,0,0,0.68)",

  // UI color for input borderColor on focus
  focus: "#ff3e9d",
  input: "#f9f3f8",

  // UI color for switch checked/active color
  switchOn: "#34c759",
  switchOff: "#3a3a3c",

  // UI color for checkbox icon checked/active color
  checkbox: ["#ff5fb3", "#d61e7d"],
  checkboxIcon: "#000000",

  // social colors
  facebook: "#3B5998",
  twitter: "#55ACEE",
  dribbble: "#EA4C89",

  // icon tint color
  icon: "#ffffff",

  // blur tint color
  blurTint: "dark",

  // product link color
  link: "#ff76c0",
};

export const GRADIENTS: ThemeGradients = {
  primary: ["#ff8ac8", "#ff4ca8", "#d61e7d"],
  secondary: ["#261d31", "#1b1623", "#130f1a"],
  info: ["#ff76c0", "#d61e7d"],
  success: ["#2ecc71", "#27ae60"],
  warning: ["#ff8ac8", "#ff5fb3"],
  danger: ["#e74c3c", "#c0392b"],

  light: ["#fff7fb", "#ffe4f3", "#ffd1ea"],
  dark: ["#0d0b12", "#191321"],

  white: [String(COLORS.white), "#ffeaf5"],
  black: [String(COLORS.black), "#22192d"],

  divider: ["rgba(255, 95, 179, 0.28)", "rgba(214, 30, 125, 0.62)"],
  menu: [
    "rgba(36, 26, 46, 0.94)",
    "rgba(255, 95, 179, 0.35)",
    "rgba(36, 26, 46, 0.94)",
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
  sizes: { ...SIZES, ...commonTheme.sizes, ...SPACING },
};
