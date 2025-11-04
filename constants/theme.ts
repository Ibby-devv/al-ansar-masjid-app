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
  extrabold: 'Poppins_800ExtraBold',
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
    brand: {
      navy: {
        900: '#0b1220',
        800: '#172554',
        700: '#1e3a8a',
        600: '#1d4ed8',
      },
      gold: {
        600: '#d97706',
        400: '#fbbf24',
      },
    },
    surface: {
      base: '#ffffff',
      soft: '#f8fafc',
      muted: '#f1f5f9',
      card: '#ffffff',
    },
    text: {
      base: '#0f172a',
      muted: '#64748b',
      subtle: '#94a3b8',
      inverse: '#ffffff',
      strong: '#1f2937',
    },
    border: {
      base: '#e5e7eb',
      soft: '#e2e8f0',
    },
    accent: {
      blueSoft: '#eff6ff',
      blue: '#60a5fa',
      amberSoft: '#fff7ed',
      green: '#22c55e',
      amber: '#f59e0b',
    },
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
