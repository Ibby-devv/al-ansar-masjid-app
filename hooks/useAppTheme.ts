/**
 * useAppTheme Hook
 * Returns memoized theme values based on current color scheme
 * NOTE: This hook is kept for backward compatibility. 
 * The main theme logic is now in ThemeContext.tsx
 */

import { Theme } from '../constants/theme';

type ColorScheme = 'light' | 'dark';
type ThemeColors = typeof Theme.colors.light;
type ThemeGradients = typeof Theme.gradients.light;

export interface AppTheme {
  colors: ThemeColors;
  gradients: ThemeGradients;
  spacing: typeof Theme.spacing;
  radius: typeof Theme.radius;
  typography: typeof Theme.typography;
  shadow: typeof Theme.shadow;
  colorScheme: ColorScheme;
}

// Re-export for backward compatibility with components that import from here
export type { ThemeColors, ThemeGradients, ColorScheme };
