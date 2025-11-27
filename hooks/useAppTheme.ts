/**
 * useAppTheme Hook
 * Returns memoized theme values based on current color scheme
 */

import { useMemo } from 'react';
import { Theme } from '../constants/theme';
import { useThemePreference } from './useThemePreference';

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

export function useAppTheme(): AppTheme {
  const { effectiveScheme } = useThemePreference();
  
  const colorScheme: ColorScheme = effectiveScheme;

  return useMemo(() => ({
    colors: Theme.colors[colorScheme],
    gradients: Theme.gradients[colorScheme],
    spacing: Theme.spacing,
    radius: Theme.radius,
    typography: Theme.typography,
    shadow: Theme.shadow,
    colorScheme,
  }), [colorScheme]);
}
