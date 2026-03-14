import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../styles/typography';
import { semanticSpacing, borderRadius, shadows } from '../styles/spacing';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  children,
  ...props
}) => {
  const { theme } = useTheme();

  const getButtonStyle = () => {
    const baseStyle = {
      ...styles.base,
      ...(theme.components?.button?.[variant] || {}),
      ...(theme.layouts?.button || {}),
    };

    // Size variations
    const sizeStyles = {
      small: {
        paddingVertical: semanticSpacing.sm,
        paddingHorizontal: semanticSpacing.lg,
        minHeight: semanticSpacing.touchTargetSmall,
      },
      medium: {
        paddingVertical: semanticSpacing.md,
        paddingHorizontal: semanticSpacing['2xl'],
        minHeight: semanticSpacing.touchTarget,
      },
      large: {
        paddingVertical: semanticSpacing.lg,
        paddingHorizontal: semanticSpacing['3xl'],
        minHeight: semanticSpacing.touchTargetLarge,
      },
    };

    // Disabled state
    if (disabled || loading) {
      return {
        ...baseStyle,
        ...sizeStyles[size],
        ...(theme.components?.button?.disabled || { backgroundColor: '#ccc' }),
      };
    }

    return {
      ...baseStyle,
      ...sizeStyles[size],
    };
  };

  const getTextStyle = () => {
    const baseTextStyle = {
      ...typography.button,
      color: disabled || loading 
        ? (theme.colors?.textTertiary || '#999') 
        : (theme.components?.button?.[variant]?.color || '#007AFF'),
    };

    const sizeTextStyles = {
      small: typography.buttonSmall,
      medium: typography.button,
      large: typography.buttonLarge,
    };

    return {
      ...baseTextStyle,
      ...sizeTextStyles[size],
    };
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="small" 
            color={disabled 
              ? (theme.colors?.textTertiary || '#999') 
              : (theme.components?.button?.[variant]?.color || '#007AFF')
            } 
          />
          {title && <Text style={[getTextStyle(), styles.loadingText]}>{title}</Text>}
        </View>
      );
    }

    if (children) {
      return children;
    }

    if (icon && title) {
      return (
        <View style={styles.iconContainer}>
          {iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          <Text style={getTextStyle()}>{title}</Text>
          {iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      );
    }

    if (icon) {
      return icon;
    }

    return <Text style={getTextStyle()}>{title}</Text>;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: semanticSpacing.sm,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: semanticSpacing.sm,
  },
  iconRight: {
    marginLeft: semanticSpacing.sm,
  },
});

export default Button;
