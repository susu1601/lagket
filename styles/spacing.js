// Spacing System - 8pt Grid System for Consistent Layout
export const spacing = {
  // Base spacing units (8pt grid)
  0: 0,
  1: 4,   // 0.25rem
  2: 8,   // 0.5rem
  3: 12,  // 0.75rem
  4: 16,  // 1rem
  5: 20,  // 1.25rem
  6: 24,  // 1.5rem
  7: 28,  // 1.75rem
  8: 32,  // 2rem
  9: 36,  // 2.25rem
  10: 40, // 2.5rem
  11: 44, // 2.75rem
  12: 48, // 3rem
  14: 56, // 3.5rem
  16: 64, // 4rem
  20: 80, // 5rem
  24: 96, // 6rem
  28: 112, // 7rem
  32: 128, // 8rem
  36: 144, // 9rem
  40: 160, // 10rem
  44: 176, // 11rem
  48: 192, // 12rem
  52: 208, // 13rem
  56: 224, // 14rem
  60: 240, // 15rem
  64: 256, // 16rem
  72: 288, // 18rem
  80: 320, // 20rem
  96: 384, // 24rem
};

// Semantic spacing for common use cases
export const semanticSpacing = {
  // Component internal spacing
  xs: spacing[1],    // 4px - Very tight spacing
  sm: spacing[2],    // 8px - Tight spacing
  md: spacing[4],    // 16px - Medium spacing
  lg: spacing[6],    // 24px - Large spacing
  xl: spacing[8],    // 32px - Extra large spacing
  '2xl': spacing[12], // 48px - 2x large spacing
  '3xl': spacing[16], // 64px - 3x large spacing
  '4xl': spacing[24], // 96px - 4x large spacing

  // Layout spacing
  container: spacing[4],     // 16px - Container padding
  section: spacing[8],       // 32px - Section spacing
  card: spacing[6],          // 24px - Card padding
  button: spacing[4],        // 16px - Button padding
  input: spacing[4],         // 16px - Input padding
  list: spacing[4],          // 16px - List item spacing
  grid: spacing[4],          // 16px - Grid spacing

  // Screen spacing
  screen: spacing[4],        // 16px - Screen padding
  screenLarge: spacing[6],   // 24px - Large screen padding
  screenSmall: spacing[3],   // 12px - Small screen padding

  // Touch targets (minimum 44px for accessibility)
  touchTarget: 44,
  touchTargetSmall: 36,
  touchTargetLarge: 56,
};

// Border radius values
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

// Shadow elevations
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Common layout patterns
export const layouts = {
  // Container max widths
  container: {
    maxWidth: 1200,
    paddingHorizontal: semanticSpacing.screen,
  },
  
  // Card styles
  card: {
    padding: semanticSpacing.card,
    borderRadius: borderRadius.lg,
    backgroundColor: '#FFFFFF',
  },
  
  // Button styles
  button: {
    paddingVertical: semanticSpacing.button,
    paddingHorizontal: semanticSpacing.lg,
    borderRadius: borderRadius.md,
    minHeight: semanticSpacing.touchTarget,
  },
  
  // Input styles
  input: {
    paddingVertical: semanticSpacing.input,
    paddingHorizontal: semanticSpacing.md,
    borderRadius: borderRadius.md,
    minHeight: semanticSpacing.touchTarget,
  },
  
  // List item styles
  listItem: {
    paddingVertical: semanticSpacing.list,
    paddingHorizontal: semanticSpacing.screen,
  },
};

export default spacing;
