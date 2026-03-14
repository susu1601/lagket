import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { semanticSpacing, borderRadius, shadows } from '../styles/spacing';

const Card = ({
  children,
  variant = 'default',
  onPress,
  style,
  contentStyle,
  ...props
}) => {
  const { theme } = useTheme();

  const getCardStyle = () => {
    const baseStyle = {
      ...styles.base,
      ...theme.components.card[variant],
    };

    return baseStyle;
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[getCardStyle(), style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      {...props}
    >
      <View style={[styles.content, contentStyle]}>
        {children}
      </View>
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.xl,
    padding: semanticSpacing.card,
  },
  content: {
    flex: 1,
  },
});

export default Card;
