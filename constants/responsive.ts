// ============================================================================
// RESPONSIVE CONSTANTS & UTILITIES
// ============================================================================
/**
 * Breakpoints for adaptive layouts across different device sizes.
 * Based on industry standards: small phones (320px), medium (375px), 
 * large (430px), tablets (600px+)
 */

// Screen size breakpoints (in pixels)
export const SCREEN_BREAKPOINTS = {
  SMALL: 320,        // Small phones (iPhone SE, old Android)
  MEDIUM: 375,       // Standard phones (iPhone 12-14, Pixel 6)
  LARGE: 430,        // Large phones (Plus models, Pixel 8 Pro)
  TABLET: 600,       // Small tablets (iPad Mini)
  XLARGE: 768,       // Large tablets (iPad, iPad Air)
  XXLARGE: 1024      // iPad Pro
} as const;

/**
 * Safe margins for content on different screen sizes.
 * Prevents text/buttons from touching edges on large phones.
 */
export const SAFE_MARGINS = {
  SMALL: 12,         // Compact phones need less margin
  MEDIUM: 16,        // Standard margin
  LARGE: 20,         // Large phones and tablets get more breathing room
  TABLET: 24,        // Tablets have plenty of space
  XLARGE: 32
} as const;

/**
 * Touch target minimums (Android Material Design guideline: 48dp minimum)
 * Ensures buttons and interactive elements are easy to tap.
 */
export const TOUCH_TARGET = {
  MINIMUM: 48,       // Absolute minimum for accessibility
  COMFORTABLE: 56,   // Better for average users
  SPACIOUS: 64       // For tablet layouts
} as const;

/**
 * Typography scaling factors for fonts.
 * moderateScale with lower factor = text doesn't scale as aggressively.
 * This prevents text from becoming too large on big screens.
 */
export const FONT_SCALING = {
  HEADING: 0.2,      // Headings: minimal scaling (~20% of screen width growth)
  BODY: 0.1,         // Body text: conservative scaling (~10% of growth)
  CAPTION: 0.05      // Captions: minimal scaling (~5% of growth)
} as const;

/**
 * Runtime scaling functions based on screen dimensions
 * These recalculate on every render, allowing for responsive updates
 */
const guidelineBaseWidth = 375;  // iPhone 12/13/14 standard width
const guidelineBaseHeight = 812;  // iPhone 12/13/14 standard height

export const scale = (size: number, width: number): number => {
  return (width / guidelineBaseWidth) * size;
};

export const verticalScale = (size: number, height: number): number => {
  return (height / guidelineBaseHeight) * size;
};

export const moderateScale = (size: number, width: number, factor: number = 0.5): number => {
  return size + (scale(size, width) - size) * factor;
};

export interface ResponsiveValues {
  isSmallPhone: boolean;
  isPhone: boolean;
  isTablet: boolean;
  isLargeTablet: boolean;
  isLandscape: boolean;
  isHighDPI: boolean;
  fontScale: number;
  width: number;
  height: number;
  getMargin: (category?: 'small' | 'medium' | 'large' | 'tablet' | 'xlarge') => number;
  // Runtime scaling functions that use current dimensions
  s: (size: number) => number;  // horizontal scale
  vs: (size: number) => number;  // vertical scale
  ms: (size: number, factor?: number) => number;  // moderate scale
}
