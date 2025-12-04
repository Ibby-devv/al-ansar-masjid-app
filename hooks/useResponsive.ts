// ============================================================================
// RESPONSIVE DIMENSIONS HOOK
// ============================================================================
/**
 * Custom hook for responsive design utilities.
 * Provides breakpoint detection, dimensions, and margin calculations.
 * Memoized to prevent unnecessary re-renders.
 * 
 * @returns ResponsiveValues object with device info
 * 
 * @example
 * const { isTablet, width, getMargin } = useResponsive();
 * const marginTop = getMargin(); // Returns appropriate margin based on screen size
 */

import {
    ResponsiveValues,
    SAFE_MARGINS,
    SCREEN_BREAKPOINTS,
    moderateScale,
    scale,
    verticalScale
} from '@/constants/responsive';
import { useEffect, useMemo, useState } from 'react';
import { Dimensions, PixelRatio, ScaledSize } from 'react-native';

export const useResponsive = (): ResponsiveValues => {
  // Use Dimensions.addEventListener instead of useWindowDimensions for bare workflow
  const [dimensions, setDimensions] = useState<ScaledSize>(() => Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      console.log('🔄 DIMENSION CHANGE EVENT:', window);
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width, height, fontScale } = dimensions;

  // Memoize calculations to prevent unnecessary re-renders
  return useMemo(() => {
    const isSmallPhone = width < SCREEN_BREAKPOINTS.MEDIUM;
    const isPhone = width < SCREEN_BREAKPOINTS.TABLET;
    const isTablet = width >= SCREEN_BREAKPOINTS.TABLET;
    const isLargeTablet = width >= SCREEN_BREAKPOINTS.XLARGE;
    const isLandscape = width > height;
    const isHighDPI = PixelRatio.get() >= 3;

    const getMargin = (category?: 'small' | 'medium' | 'large' | 'tablet' | 'xlarge'): number => {
      if (category) {
        const key = category.toUpperCase() as keyof typeof SAFE_MARGINS;
        return SAFE_MARGINS[key];
      }
      
      // Auto-select based on screen size
      if (isSmallPhone) return SAFE_MARGINS.SMALL;
      if (width < SCREEN_BREAKPOINTS.LARGE) return SAFE_MARGINS.MEDIUM;
      if (width < SCREEN_BREAKPOINTS.TABLET) return SAFE_MARGINS.LARGE;
      if (width < SCREEN_BREAKPOINTS.XLARGE) return SAFE_MARGINS.TABLET;
      return SAFE_MARGINS.XLARGE;
    };

    // Runtime scaling functions bound to current dimensions
    const s = (size: number) => scale(size, width);
    const vs = (size: number) => verticalScale(size, height);
    const ms = (size: number, factor: number = 0.3) => moderateScale(size, width, factor);

    return {
      isSmallPhone,
      isPhone,
      isTablet,
      isLargeTablet,
      isLandscape,
      isHighDPI,
      fontScale,
      width,
      height,
      getMargin,
      s,
      vs,
      ms
    };
  }, [width, height, fontScale]);
};
