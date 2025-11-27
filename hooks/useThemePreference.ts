/**
 * useThemePreference Hook
 * Manages user's theme preference (auto/light/dark) with persistence
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from './use-color-scheme';

const THEME_STORAGE_KEY = '@theme_preference';

export type ThemePreference = 'auto' | 'light' | 'dark';

interface UseThemePreferenceReturn {
  preference: ThemePreference;
  effectiveScheme: 'light' | 'dark';
  updatePreference: (newPref: ThemePreference) => Promise<void>;
  isLoading: boolean;
}

export function useThemePreference(): UseThemePreferenceReturn {
  const [preference, setPreference] = useState<ThemePreference>('auto');
  const [isLoading, setIsLoading] = useState(true);
  const systemScheme = useColorScheme();

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
        setIsLoading(false);
      }
    };
    loadPreference();
  }, []);

  const effectiveScheme: 'light' | 'dark' = 
    preference === 'auto' ? (systemScheme ?? 'light') : preference;

  const updatePreference = useCallback(async (newPref: ThemePreference): Promise<void> => {
    try {
      setPreference(newPref);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newPref);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }, []);

  return { preference, effectiveScheme, updatePreference, isLoading };
}
