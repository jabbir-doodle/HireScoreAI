// HireScore AI Design System - 2026
// CTO-Level Professional UI/UX Standards

import type { CSSProperties } from 'react';

// ============================================
// COLOR PALETTE
// ============================================
export const colors = {
  // Backgrounds
  void: '#06060a',
  obsidian: '#0a0a0f',
  slate: '#12121a',
  graphite: '#1a1a24',
  steel: '#2a2a38',

  // Text
  silver: '#8888a0',
  cloud: '#c8c8d8',
  snow: '#f0f0f8',

  // Accents
  cyan: '#00f0ff',
  cyanGlow: 'rgba(0, 240, 255, 0.25)',
  coral: '#ff6b6b',
  coralGlow: 'rgba(255, 107, 107, 0.25)',
  emerald: '#00ff88',
  emeraldGlow: 'rgba(0, 255, 136, 0.25)',
  amber: '#ffaa00',
  amberGlow: 'rgba(255, 170, 0, 0.25)',
  violet: '#8b5cf6',
  violetGlow: 'rgba(139, 92, 246, 0.25)',
} as const;

// ============================================
// TYPOGRAPHY
// ============================================
export const fonts = {
  display: "'Space Grotesk', system-ui, sans-serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export const fontSizes = {
  xs: '12px',
  sm: '14px',
  base: '16px',
  lg: '18px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '30px',
  '4xl': '36px',
  '5xl': '48px',
  '6xl': '60px',
} as const;

export const fontWeights = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

// ============================================
// SPACING (8px Grid System)
// ============================================
export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

// ============================================
// BORDER RADIUS
// ============================================
export const radius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
} as const;

// ============================================
// SHADOWS
// ============================================
export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
  md: '0 4px 6px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.3)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.25)',
  glow: {
    cyan: `0 0 20px ${colors.cyanGlow}`,
    coral: `0 0 20px ${colors.coralGlow}`,
    emerald: `0 0 20px ${colors.emeraldGlow}`,
    amber: `0 0 20px ${colors.amberGlow}`,
    violet: `0 0 20px ${colors.violetGlow}`,
  },
} as const;

// ============================================
// TRANSITIONS
// ============================================
export const transitions = {
  fast: 'all 0.15s ease',
  normal: 'all 0.2s ease',
  slow: 'all 0.3s ease',
} as const;

// ============================================
// BREAKPOINTS
// ============================================
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// ============================================
// COMMON STYLE PATTERNS
// ============================================

// Base page style
export const pageStyle: CSSProperties = {
  minHeight: '100vh',
  width: '100%',
  backgroundColor: colors.void,
  color: colors.cloud,
};

// Container styles
export const containerStyle: CSSProperties = {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: `0 ${spacing[6]}`,
  width: '100%',
};

export const narrowContainerStyle: CSSProperties = {
  maxWidth: '800px',
  margin: '0 auto',
  padding: `0 ${spacing[6]}`,
  width: '100%',
};

// Card styles
export const cardStyle: CSSProperties = {
  backgroundColor: 'rgba(26, 26, 36, 0.5)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: radius.xl,
  padding: spacing[6],
};

export const cardGlowStyle: CSSProperties = {
  ...cardStyle,
  boxShadow: `0 0 40px rgba(0, 240, 255, 0.1)`,
  border: '1px solid rgba(0, 240, 255, 0.2)',
};

// Section styles
export const sectionStyle: CSSProperties = {
  padding: `${spacing[20]} ${spacing[6]}`,
};

// Heading styles
export const h1Style: CSSProperties = {
  fontFamily: fonts.display,
  fontSize: 'clamp(36px, 6vw, 72px)',
  fontWeight: fontWeights.bold,
  lineHeight: 1.1,
  color: colors.snow,
  margin: 0,
};

export const h2Style: CSSProperties = {
  fontFamily: fonts.display,
  fontSize: fontSizes['3xl'],
  fontWeight: fontWeights.bold,
  lineHeight: 1.2,
  color: colors.snow,
  margin: 0,
};

export const h3Style: CSSProperties = {
  fontFamily: fonts.display,
  fontSize: fontSizes.lg,
  fontWeight: fontWeights.semibold,
  lineHeight: 1.3,
  color: colors.snow,
  margin: 0,
};

// Text styles
export const textStyle: CSSProperties = {
  fontFamily: fonts.body,
  fontSize: fontSizes.base,
  lineHeight: 1.6,
  color: colors.silver,
};

export const smallTextStyle: CSSProperties = {
  fontFamily: fonts.body,
  fontSize: fontSizes.sm,
  lineHeight: 1.5,
  color: colors.silver,
};

// Gradient text
export const gradientTextStyle: CSSProperties = {
  background: `linear-gradient(90deg, ${colors.cyan}, ${colors.violet}, ${colors.coral})`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
};

// Flex utilities
export const flexCenter: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const flexBetween: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

export const flexColumn: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

// Background effects
export const backgroundGradient = (opacity: number = 0.1): CSSProperties => ({
  position: 'fixed' as const,
  inset: 0,
  pointerEvents: 'none' as const,
  background: `
    radial-gradient(ellipse 60% 40% at 30% 20%, rgba(0, 240, 255, ${opacity}) 0%, transparent 50%),
    radial-gradient(ellipse 50% 50% at 70% 80%, rgba(139, 92, 246, ${opacity * 0.6}) 0%, transparent 50%)
  `,
});

// Badge styles
export const badgeStyle = (color: string, bgOpacity: number = 0.1): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: spacing[2],
  padding: `${spacing[2]} ${spacing[4]}`,
  borderRadius: radius.full,
  backgroundColor: `${color}${Math.round(bgOpacity * 255).toString(16).padStart(2, '0')}`,
  border: `1px solid ${color}33`,
  fontSize: fontSizes.sm,
  fontWeight: fontWeights.medium,
  color: color,
});

// Icon container styles
export const iconContainerStyle = (color: string, size: number = 48): CSSProperties => ({
  width: `${size}px`,
  height: `${size}px`,
  borderRadius: radius.lg,
  backgroundColor: `${color}15`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

// Input styles
export const inputStyle: CSSProperties = {
  width: '100%',
  padding: `${spacing[3]} ${spacing[4]}`,
  backgroundColor: colors.graphite,
  border: `1px solid ${colors.steel}`,
  borderRadius: radius.lg,
  color: colors.snow,
  fontSize: fontSizes.base,
  outline: 'none',
  transition: transitions.normal,
};

// Progress bar styles
export const progressBarContainerStyle: CSSProperties = {
  width: '100%',
  height: '8px',
  backgroundColor: colors.graphite,
  borderRadius: radius.full,
  overflow: 'hidden',
};

export const progressBarFillStyle = (percent: number): CSSProperties => ({
  width: `${percent}%`,
  height: '100%',
  background: `linear-gradient(90deg, ${colors.cyan}, ${colors.violet})`,
  borderRadius: radius.full,
  transition: 'width 0.5s ease',
});
