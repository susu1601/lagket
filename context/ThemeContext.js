import React, { createContext, useContext, useState } from 'react';
import { colors, colorCombinations } from '../styles/colors';
import { typography } from '../styles/typography';
import { spacing, semanticSpacing, borderRadius, shadows, layouts } from '../styles/spacing';

// Theme configuration
const lightTheme = {
  colors: {
    ...colors,
    ...colorCombinations,
    // Override with theme-specific colors
    background: colors.background.primary,
    backgroundSecondary: colors.background.secondary,
    surface: colors.neutral[0],
    surfaceVariant: colors.neutral[50],
    
    text: colors.text.primary,
    textSecondary: colors.text.secondary,
    textTertiary: colors.text.tertiary,
    textInverse: colors.text.inverse,
    
    border: colors.border.light,
    borderMedium: colors.border.medium,
    
    primary: colors.primary[500],
    primaryLight: colors.primary[100],
    primaryDark: colors.primary[700],
    
    success: colors.success[500],
    warning: colors.warning[500],
    error: colors.error[500],
    info: colors.info[500],
  },
  
  typography,
  spacing: {
    ...spacing,
    ...semanticSpacing,
  },
  borderRadius: {
    ...borderRadius,
    // more rounded overall look
    md: 16,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 32,
  },
  shadows,
  layouts,
  
  // Component-specific styles
  components: {
    // Button styles
    button: {
      primary: {
        backgroundColor: colors.primary[500],
        borderColor: 'transparent',
        color: colors.neutral[0],
        ...shadows.md,
      },
      secondary: {
        backgroundColor: colors.pastels.sky,
        borderColor: 'transparent',
        borderWidth: 0,
        color: colors.primary[500],
      },
      ghost: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
        color: colors.primary[500],
      },
      danger: {
        backgroundColor: colors.error[500],
        borderColor: 'transparent',
        color: colors.neutral[0],
      },
      disabled: {
        backgroundColor: colors.neutral[200],
        borderColor: 'transparent',
        color: colors.neutral[400],
      },
    },
    
    // Input styles
    input: {
      default: {
        backgroundColor: colors.neutral[0],
        borderColor: 'rgba(0,0,0,0.06)',
        borderWidth: 1,
        color: colors.text.primary,
        placeholderColor: colors.text.tertiary,
      },
      focused: {
        borderColor: colors.primary[500],
        borderWidth: 2,
        ...shadows.sm,
      },
      error: {
        borderColor: colors.error[500],
        borderWidth: 1,
      },
      disabled: {
        backgroundColor: colors.neutral[100],
        borderColor: colors.border.light,
        color: colors.text.tertiary,
      },
    },
    
    // Card styles
    card: {
      default: {
        backgroundColor: colors.neutral[0],
        borderColor: 'transparent',
        borderWidth: 0,
        ...shadows.md,
      },
      elevated: {
        backgroundColor: colors.neutral[0],
        ...shadows.lg,
      },
      outlined: {
        backgroundColor: 'transparent',
        borderColor: 'rgba(0,0,0,0.08)',
        borderWidth: 1,
      },
    },
    
    // Navigation styles
    navigation: {
      tabBar: {
        backgroundColor: colors.neutral[0],
        borderTopColor: 'transparent',
        borderTopWidth: 0,
        ...shadows.md,
      },
      header: {
        backgroundColor: colors.neutral[0],
        borderBottomColor: 'transparent',
        borderBottomWidth: 0,
        ...shadows.sm,
      },
    },
  },
};

// Create theme context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(lightTheme);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // For now, we only have light theme
    // In the future, you can add dark theme here
  };

  const value = {
    theme,
    isDarkMode,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper functions for common styling
export const createStyles = (styleFunction) => {
  return (theme) => styleFunction(theme);
};

// Common style patterns
export const commonStyles = {
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  
  // Centering styles
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  centerHorizontal: {
    alignItems: 'center',
  },
  
  centerVertical: {
    justifyContent: 'center',
  },
  
  // Flex styles
  row: {
    flexDirection: 'row',
  },
  
  column: {
    flexDirection: 'column',
  },
  
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  spaceAround: {
    justifyContent: 'space-around',
  },
  
  spaceEvenly: {
    justifyContent: 'space-evenly',
  },
  
  // Text alignment
  textCenter: {
    textAlign: 'center',
  },
  
  textLeft: {
    textAlign: 'left',
  },
  
  textRight: {
    textAlign: 'right',
  },
  
  // Common spacing
  paddingHorizontal: {
    paddingHorizontal: semanticSpacing.screen,
  },
  
  paddingVertical: {
    paddingVertical: semanticSpacing.md,
  },
  
  marginHorizontal: {
    marginHorizontal: semanticSpacing.screen,
  },
  
  marginVertical: {
    marginVertical: semanticSpacing.md,
  },
};

export default ThemeContext;
