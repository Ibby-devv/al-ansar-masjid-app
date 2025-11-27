/**
 * ThemeContext
 * Provides theme values across the app with minimal re-renders
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useAppTheme } from '../hooks/useAppTheme';

type ThemeContextType = ReturnType<typeof useAppTheme>;

const ThemeContext = createContext<ThemeContextType | null>(null);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.JSX.Element {
  const theme = useAppTheme();
  
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
