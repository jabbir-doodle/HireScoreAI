/**
 * useResponsive Hook
 * Mobile-first responsive design utilities
 */

import { useState, useEffect, useCallback } from 'react';

// Breakpoints matching index.css
export const BREAKPOINTS = {
  xs: 375,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

export interface ResponsiveState {
  // Current viewport width
  width: number;
  height: number;

  // Boolean breakpoint checks
  isMobile: boolean;      // < 640px
  isTablet: boolean;      // 640px - 1023px
  isDesktop: boolean;     // >= 1024px
  isLargeDesktop: boolean; // >= 1280px

  // Specific breakpoint checks
  isXs: boolean;  // < 375px (very small phones)
  isSm: boolean;  // >= 640px
  isMd: boolean;  // >= 768px
  isLg: boolean;  // >= 1024px
  isXl: boolean;  // >= 1280px
  is2xl: boolean; // >= 1536px

  // Device type
  isTouchDevice: boolean;
  isPortrait: boolean;
  isLandscape: boolean;
}

export interface ResponsiveValues<T> {
  base: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  '2xl'?: T;
}

/**
 * Main responsive hook
 */
export function useResponsive(): ResponsiveState {
  const getState = useCallback((): ResponsiveState => {
    if (typeof window === 'undefined') {
      // SSR fallback - assume mobile first
      return {
        width: 375,
        height: 667,
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        isLargeDesktop: false,
        isXs: false,
        isSm: false,
        isMd: false,
        isLg: false,
        isXl: false,
        is2xl: false,
        isTouchDevice: true,
        isPortrait: true,
        isLandscape: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      width,
      height,
      isMobile: width < BREAKPOINTS.sm,
      isTablet: width >= BREAKPOINTS.sm && width < BREAKPOINTS.lg,
      isDesktop: width >= BREAKPOINTS.lg,
      isLargeDesktop: width >= BREAKPOINTS.xl,
      isXs: width < BREAKPOINTS.xs,
      isSm: width >= BREAKPOINTS.sm,
      isMd: width >= BREAKPOINTS.md,
      isLg: width >= BREAKPOINTS.lg,
      isXl: width >= BREAKPOINTS.xl,
      is2xl: width >= BREAKPOINTS['2xl'],
      isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      isPortrait: height > width,
      isLandscape: width > height,
    };
  }, []);

  const [state, setState] = useState<ResponsiveState>(getState);

  useEffect(() => {
    const handleResize = () => {
      setState(getState());
    };

    // Set initial state
    handleResize();

    // Debounced resize handler for performance
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timeoutId);
    };
  }, [getState]);

  return state;
}

/**
 * Get responsive value based on current breakpoint
 */
export function useResponsiveValue<T>(values: ResponsiveValues<T>): T {
  const { width } = useResponsive();

  if (width >= BREAKPOINTS['2xl'] && values['2xl'] !== undefined) return values['2xl'];
  if (width >= BREAKPOINTS.xl && values.xl !== undefined) return values.xl;
  if (width >= BREAKPOINTS.lg && values.lg !== undefined) return values.lg;
  if (width >= BREAKPOINTS.md && values.md !== undefined) return values.md;
  if (width >= BREAKPOINTS.sm && values.sm !== undefined) return values.sm;

  return values.base;
}

/**
 * Responsive spacing helper
 */
export function useResponsiveSpacing() {
  const { isMobile, isTablet } = useResponsive();

  return {
    // Page padding
    pagePadding: isMobile ? '16px' : isTablet ? '24px' : '32px',

    // Section padding
    sectionPaddingY: isMobile ? '48px' : isTablet ? '64px' : '80px',

    // Card padding
    cardPadding: isMobile ? '16px' : isTablet ? '20px' : '24px',

    // Gap sizes
    gapSm: isMobile ? '8px' : '12px',
    gapMd: isMobile ? '12px' : isTablet ? '16px' : '24px',
    gapLg: isMobile ? '16px' : isTablet ? '24px' : '32px',
    gapXl: isMobile ? '24px' : isTablet ? '32px' : '48px',

    // Container max width
    containerMaxWidth: isMobile ? '100%' : isTablet ? '768px' : '1200px',
  };
}

/**
 * Responsive font sizes helper
 */
export function useResponsiveFonts() {
  const { isMobile, isTablet } = useResponsive();

  return {
    // Headings
    h1: isMobile ? '28px' : isTablet ? '36px' : '48px',
    h2: isMobile ? '24px' : isTablet ? '30px' : '36px',
    h3: isMobile ? '18px' : isTablet ? '20px' : '24px',
    h4: isMobile ? '16px' : isTablet ? '18px' : '20px',

    // Body text
    body: isMobile ? '14px' : '16px',
    bodyLg: isMobile ? '16px' : isTablet ? '18px' : '20px',
    bodySm: isMobile ? '13px' : '14px',

    // Small text
    caption: isMobile ? '12px' : '13px',
    tiny: isMobile ? '11px' : '12px',
  };
}

/**
 * Grid columns helper
 */
export function useResponsiveGrid() {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  return {
    // Standard grids
    cols2: isMobile ? 1 : 2,
    cols3: isMobile ? 1 : isTablet ? 2 : 3,
    cols4: isMobile ? 1 : isTablet ? 2 : isDesktop ? 4 : 4,

    // Grid template strings
    grid2: isMobile ? '1fr' : 'repeat(2, 1fr)',
    grid3: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
    grid4: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',

    // Hero grid (content + visual)
    heroGrid: isMobile ? '1fr' : '1fr 1fr',
  };
}

export default useResponsive;
