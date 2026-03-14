import {
  Animated,
  ColorValue,
  ImageProps,
  ImageStyle,
  KeyboardAvoidingViewProps,
  ModalProps,
  ScrollViewProps,
  StyleProp,
  TextInputProps,
  TextProps,
  TextStyle,
  TouchableOpacityProps,
  ViewProps,
  ViewStyle,
} from 'react-native';
import {ISpacing, ITheme} from './theme';

type BlurTint = 'light' | 'dark' | 'default';
type LinearGradientPoint = [number, number];

export interface IBlockProps
  extends ISpacing,
    ViewProps,
    ScrollViewProps,
    KeyboardAvoidingViewProps {
  id?: string;
  flex?: ViewStyle['flex'];
  row?: boolean;
  wrap?: ViewStyle['flexWrap'];
  safe?: boolean;
  keyboard?: boolean;
  scroll?: boolean;
  shadow?: boolean;
  card?: boolean;
  center?: boolean;
  outlined?: boolean;
  style?: StyleProp<ViewStyle>;
  overflow?: ViewStyle['overflow'];
  color?: ViewStyle['backgroundColor'];
  gradient?: string[];
  primary?: boolean;
  secondary?: boolean;
  tertiary?: boolean;
  black?: boolean;
  white?: boolean;
  gray?: boolean;
  danger?: boolean;
  warning?: boolean;
  success?: boolean;
  info?: boolean;
  radius?: ViewStyle['borderRadius'];
  height?: ViewStyle['height'];
  width?: ViewStyle['width'];
  justify?: ViewStyle['justifyContent'];
  align?: ViewStyle['alignItems'];
  children?: any;
  blur?: boolean;
  intensity?: number;
  tint?: BlurTint;
  position?: ViewStyle['position'];
  right?: ViewStyle['right'];
  left?: ViewStyle['left'];
  top?: ViewStyle['top'];
  bottom?: ViewStyle['bottom'];
  start?: LinearGradientPoint;
  end?: LinearGradientPoint;
}

export interface IButtonProps extends TouchableOpacityProps, ISpacing {
  id?: string;
  round?: boolean;
  rounded?: boolean;
  flex?: ViewStyle['flex'];
  radius?: ViewStyle['borderRadius'];
  color?: ViewStyle['backgroundColor'];
  gradient?: string[];
  primary?: boolean;
  secondary?: boolean;
  tertiary?: boolean;
  gray?: boolean;
  black?: boolean;
  white?: boolean;
  light?: boolean;
  dark?: boolean;
  danger?: boolean;
  warning?: boolean;
  success?: boolean;
  info?: boolean;
  row?: boolean;
  align?: ViewStyle['alignItems'];
  justify?: ViewStyle['justifyContent'];
  height?: ViewStyle['height'];
  width?: ViewStyle['width'];
  outlined?: boolean | string;
  shadow?: boolean;
  social?: 'facebook' | 'twitter' | 'dribbble';
  position?: ViewStyle['position'];
  right?: ViewStyle['right'];
  left?: ViewStyle['left'];
  top?: ViewStyle['top'];
  bottom?: ViewStyle['bottom'];
  haptic?: boolean;
  vibrate?: number | number[] | null;
  vibrateRepeat?: boolean | null;
  children?: any;
}

export interface ICheckboxProps extends ISpacing {
  id?: string;
  checked?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
  onPress?: (checked: boolean) => void;
}

export interface IImageProps extends ImageProps, ISpacing {
  id?: string;
  avatar?: boolean;
  shadow?: boolean;
  background?: boolean;
  rounded?: boolean;
  radius?: ImageStyle['borderRadius'];
  color?: ImageStyle['tintColor'];
  transform?: ImageStyle['transform'];
  style?: StyleProp<ImageStyle>;
  children?: any;
}

export interface IInputProps extends TextInputProps, ISpacing {
  id?: string;
  color?: ColorValue;
  primary?: boolean;
  secondary?: boolean;
  tertiary?: boolean;
  black?: boolean;
  white?: boolean;
  gray?: boolean;
  danger?: boolean;
  warning?: boolean;
  success?: boolean;
  info?: boolean;
  search?: boolean;
  disabled?: boolean;
  label?: string;
  icon?: keyof ITheme['assets'];
  children?: any;
  style?: TextStyle;
}

export interface IModalProps extends ModalProps {
  id?: string;
  children?: any;
  style?: ViewStyle;
}

export interface ISwitchProps extends ISpacing {
  id?: string;
  checked?: boolean;
  style?: ViewStyle;
  thumbColor?: ColorValue;
  activeFillColor?: ColorValue;
  inactiveFillColor?: ColorValue;
  thumbStyle?: ViewStyle;
  switchStyle?: ViewStyle;
  onPress?: (checked: boolean) => void;
  haptic?: boolean;
  duration?: Animated.TimingAnimationConfig['duration'];
}

export interface ITextProps extends TextProps, ISpacing {
  id?: string;
  center?: boolean;
  gradient?: string[];
  primary?: boolean;
  secondary?: boolean;
  tertiary?: boolean;
  black?: boolean;
  white?: boolean;
  gray?: boolean;
  danger?: boolean;
  warning?: boolean;
  success?: boolean;
  info?: boolean;
  color?: TextStyle['color'];
  opacity?: TextStyle['opacity'];
  size?: ITheme['sizes'] | string | number;
  weight?: TextStyle['fontWeight'];
  font?: string;
  bold?: boolean;
  semibold?: boolean;
  start?: LinearGradientPoint;
  end?: LinearGradientPoint;
  h1?: boolean;
  h2?: boolean;
  h3?: boolean;
  h4?: boolean;
  h5?: boolean;
  p?: boolean;
  align?: TextStyle['textAlign'];
  transform?: TextStyle['textTransform'];
  lineHeight?: TextStyle['lineHeight'];
  right?: TextStyle['right'];
  left?: TextStyle['left'];
  top?: TextStyle['top'];
  bottom?: TextStyle['bottom'];
  position?: TextStyle['position'];
  children?: any;
  style?: TextStyle;
}
