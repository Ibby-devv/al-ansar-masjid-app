/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const FontFamily = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semibold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS Poppins family mapping */
    sans: FontFamily.regular,
    serif: FontFamily.regular,
    rounded: FontFamily.regular,
    mono: FontFamily.regular,
  },
  default: {
    sans: FontFamily.regular,
    serif: FontFamily.regular,
    rounded: FontFamily.regular,
    mono: FontFamily.regular,
  },
  web: {
    sans: "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "'Poppins', Georgia, 'Times New Roman', serif",
    rounded: "'Poppins', 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "'Poppins', SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// App theme tokens (brand palette, spacing, radii, typography)
export const Theme = {
  colors: {
    light: {
      brand: {
        navy: { 900: '#0b1220', 800: '#172554', 700: '#1e3a8a', 600: '#1e40af' },
        gold: { 600: '#d97706', 400: '#f59e0b' },
      },
      surface: { base: '#ffffff', soft: '#f8fafc', muted: '#f1f5f9', card: '#ffffff' },
      text: { base: '#0f172a', muted: '#64748b', subtle: '#94a3b8', inverse: '#ffffff', strong: '#1f2937', header: '#ffffff' },
      border: { base: '#e5e7eb', soft: '#e2e8f0' },
      accent: { blueSoft: '#eff6ff', blue: '#60a5fa', amberSoft: '#fffbeb', green: '#22c55e', amber: '#f59e0b' },
      error: { 500: '#ef4444', 100: '#fee2e2' },
      tabBar: { background: '#ffffff', border: '#e5e7eb', activeTint: '#1e3a8a', inactiveTint: '#9ca3af' },
      iconBackground: { map: '#ef4444', phone: '#22c55e', email: '#f59e0b', website: '#0ea5e9', imam: '#d97706', version: '#8b5cf6', developer: '#6366f1', facebook: '#1877F2' },
      progress: { background: '#e5e7eb', fill: '#3b82f6', complete: '#10b981' },
      compass: { background: '#0f2945', face: '#f5efeb', accent: '#f4a261', muted: 'rgba(255,255,255,0.6)' },
    },
    dark: {
      brand: {
        navy: { 900: '#1e3a8a', 800: '#1e40af', 700: '#2563eb', 600: '#91adf9ff' },
        gold: { 600: '#f59e0b', 400: '#fbbf24' },
      },
      surface: { base: '#111827', soft: '#1f2937', muted: '#374151', card: '#1f2937' },
      text: { base: '#f9fafb', muted: '#9ca3af', subtle: '#6b7280', inverse: '#0f172a', strong: '#ffffff', header: '#ffffff' },
      border: { base: '#374151', soft: '#4b5563' },
      accent: { blueSoft: '#1e3a5f', blue: '#60a5fa', amberSoft: '#422006', green: '#34d399', amber: '#fbbf24' },
      error: { 500: '#ef4444', 100: '#7f1d1d' },
      tabBar: { background: '#1a1a1a', border: '#374151', activeTint: '#60a5fa', inactiveTint: '#6b7280' },
      iconBackground: { map: '#dc2626', phone: '#16a34a', email: '#d97706', website: '#0284c7', imam: '#f59e0b', version: '#a78bfa', developer: '#818cf8', facebook: '#1877F2' },
      progress: { background: '#374151', fill: '#60a5fa', complete: '#34d399' },
      compass: { background: '#0b1220', face: '#1f2937', accent: '#fb923c', muted: 'rgba(255,255,255,0.3)' },
    },
  },
  gradients: {
    light: { header: ['#172554', '#1e3a8a', '#0b1220'] as const },
    dark: { header: ['#1e3a8a', '#1e40af', '#172554'] as const },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    pill: 999,
  },
  typography: {
    h1: 24,
    h2: 20,
    h3: 18,
    body: 14,
    small: 12,
  },
  shadow: {
    soft: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    header: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 6,
    },
  },
} as const;

// Legacy alias for backward compatibility during migration
// TODO: Remove after all components are migrated to useTheme()
export const LegacyThemeColors = Theme.colors.light;
