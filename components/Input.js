import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../styles/typography';
import { semanticSpacing, borderRadius } from '../styles/spacing';

const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  disabled = false,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  autoCorrect = false,
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  inputStyle,
  labelStyle,
  errorStyle,
  ...props
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getContainerStyle = () => {
    const baseStyle = {
      ...styles.container,
      ...theme.components.input.default,
    };

    if (isFocused) {
      return {
        ...baseStyle,
        ...theme.components.input.focused,
      };
    }

    if (error) {
      return {
        ...baseStyle,
        ...theme.components.input.error,
      };
    }

    if (disabled) {
      return {
        ...baseStyle,
        ...theme.components.input.disabled,
      };
    }

    return baseStyle;
  };

  const getInputStyle = () => {
    const baseInputStyle = {
      ...styles.input,
      ...typography.body,
      color: disabled ? theme.colors.textTertiary : theme.colors.textPrimary,
    };

    if (multiline) {
      return {
        ...baseInputStyle,
        textAlignVertical: 'top',
        minHeight: numberOfLines * 20 + semanticSpacing.md * 2,
      };
    }

    return baseInputStyle;
  };

  const getLabelStyle = () => {
    return {
      ...styles.label,
      ...typography.label,
      color: error ? theme.colors.error : theme.colors.textSecondary,
      marginBottom: semanticSpacing.sm,
    };
  };

  const getErrorStyle = () => {
    return {
      ...styles.error,
      ...typography.caption,
      color: theme.colors.error,
      marginTop: semanticSpacing.sm,
    };
  };

  return (
    <View style={style}>
      {label && (
        <Text style={[getLabelStyle(), labelStyle]}>
          {label}
        </Text>
      )}
      
      <View style={getContainerStyle()}>
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[getInputStyle(), inputStyle]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={numberOfLines}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={[getErrorStyle(), errorStyle]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    paddingHorizontal: semanticSpacing.md,
    paddingVertical: semanticSpacing.md,
    minHeight: semanticSpacing.touchTarget,
  },
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  label: {
    marginBottom: semanticSpacing.sm,
  },
  error: {
    marginTop: semanticSpacing.sm,
  },
  leftIcon: {
    marginRight: semanticSpacing.sm,
  },
  rightIcon: {
    marginLeft: semanticSpacing.sm,
    padding: semanticSpacing.xs,
  },
});

export default Input;
