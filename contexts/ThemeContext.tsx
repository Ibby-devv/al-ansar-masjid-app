/**
 * ThemeContext
 * Provides theme values and preference management across the app
 */

import React, { createContext, useContext, ReactNode, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '../hooks/use-color-scheme';
import { Theme } from '../constants/theme';

const THEME_STORAGE_KEY = '@theme_preference';

export type ThemePreference = 'auto' | 'light' | 'dark';
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

interface ThemeContextType extends AppTheme {
  preference: ThemePreference;
  updatePreference: (newPref: ThemePreference) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  const [preference, setPreference] = useState<ThemePreference>('auto');
  const [isLoaded, setIsLoaded] = useState(false);
  const systemScheme = useColorScheme();

  // Load saved preference on mount
  useEffect(() => {
    const loadPreference = async (): Promise<void> => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && ['auto', 'light', 'dark'].includes(saved)) {
          setPreference(saved as ThemePreference);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadPreference();
  }, []);

  // Calculate effective color scheme
  const colorScheme: ColorScheme = 
    preference === 'auto' ? (systemScheme ?? 'light') : preference;

  // Update preference and save to storage
  const updatePreference = useCallback(async (newPref: ThemePreference): Promise<void> => {
    try {
      setPreference(newPref);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newPref);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }, []);

  // Memoize theme object
  const theme = useMemo((): ThemeContextType => ({
    colors: Theme.colors[colorScheme],
    gradients: Theme.gradients[colorScheme],
    spacing: Theme.spacing,
    radius: Theme.radius,
    typography: Theme.typography,
    shadow: Theme.shadow,
    colorScheme,
    preference,
    updatePreference,
  }), [colorScheme, preference, updatePreference]);

  // Don't render children until preference is loaded to prevent flash
  if (!isLoaded) {
    return <></>;
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
