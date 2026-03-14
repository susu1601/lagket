import {Dimensions, Platform} from 'react-native';
import {
  ICommonTheme,
  ThemeAssets,
  ThemeFonts,
  ThemeIcons,
  ThemeLineHeights,
  ThemeWeights,
} from './types';

const {width, height} = Dimensions.get('window');

export const WEIGHTS: ThemeWeights = {
  text: 'normal',
  h1: Platform.OS === 'ios' ? '700' : 'normal',
  h2: Platform.OS === 'ios' ? '700' : 'normal',
  h3: Platform.OS === 'ios' ? '700' : 'normal',
  h4: Platform.OS === 'ios' ? '700' : 'normal',
  h5: Platform.OS === 'ios' ? '600' : 'normal',
  p: 'normal',

  thin: Platform.OS === 'ios' ? '100' : 'normal',
  extralight: Platform.OS === 'ios' ? '200' : 'normal',
  light: Platform.OS === 'ios' ? '300' : 'normal',
  normal: Platform.OS === 'ios' ? '400' : 'normal',
  medium: Platform.OS === 'ios' ? '500' : 'normal',
  semibold: Platform.OS === 'ios' ? '600' : 'normal',
  bold: Platform.OS === 'ios' ? '700' : 'normal',
  extrabold: Platform.OS === 'ios' ? '800' : 'normal',
  black: Platform.OS === 'ios' ? '900' : 'normal',
};

// Simplified icons - only include what's needed
export const ICONS: ThemeIcons = {};

export const ASSETS: ThemeAssets = {};

export const FONTS: ThemeFonts = {
  text: Platform.OS === 'ios' ? 'System' : 'Roboto',
  h1: Platform.OS === 'ios' ? 'System' : 'Roboto',
  h2: Platform.OS === 'ios' ? 'System' : 'Roboto',
  h3: Platform.OS === 'ios' ? 'System' : 'Roboto',
  h4: Platform.OS === 'ios' ? 'System' : 'Roboto',
  h5: Platform.OS === 'ios' ? 'System' : 'Roboto',
  p: Platform.OS === 'ios' ? 'System' : 'Roboto',

  thin: Platform.OS === 'ios' ? 'System' : 'Roboto',
  extralight: Platform.OS === 'ios' ? 'System' : 'Roboto',
  light: Platform.OS === 'ios' ? 'System' : 'Roboto',
  normal: Platform.OS === 'ios' ? 'System' : 'Roboto',
  medium: Platform.OS === 'ios' ? 'System' : 'Roboto',
  semibold: Platform.OS === 'ios' ? 'System' : 'Roboto',
  bold: Platform.OS === 'ios' ? 'System' : 'Roboto',
  extrabold: Platform.OS === 'ios' ? 'System' : 'Roboto',
  black: Platform.OS === 'ios' ? 'System' : 'Roboto',
};

export const LINE_HEIGHTS: ThemeLineHeights = {
  text: 22,
  h1: 60,
  h2: 55,
  h3: 43,
  h4: 33,
  h5: 24,
  p: 22,
};

export const THEME: ICommonTheme = {
  icons: ICONS,
  assets: {...ICONS, ...ASSETS},
  fonts: FONTS,
  weights: WEIGHTS,
  lines: LINE_HEIGHTS,
  sizes: {width, height},
};
