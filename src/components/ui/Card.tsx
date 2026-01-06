import type { ReactNode, CSSProperties, HTMLAttributes } from 'react';
import { colors, radius, spacing, fonts, fontSizes, fontWeights } from '../../styles/design-system';

// ============================================
// Card Component - Pure Inline Styles
// ============================================

type CardVariant = 'default' | 'glass' | 'glow' | 'bordered';
type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const PADDING_MAP: Record<CardPadding, string> = {
  none: '0',
  sm: spacing[4],
  md: spacing[6],
  lg: spacing[8],
};

const VARIANT_STYLES: Record<CardVariant, CSSProperties> = {
  default: {
    background: 'linear-gradient(to bottom right, rgba(26, 26, 36, 0.8), rgba(18, 18, 26, 0.6))',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
  },
  glass: {
    backgroundColor: 'rgba(18, 18, 26, 0.4)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
  },
  glow: {
    background: 'linear-gradient(to bottom right, rgba(26, 26, 36, 0.8), rgba(18, 18, 26, 0.6))',
    border: '1px solid rgba(0, 240, 255, 0.2)',
    boxShadow: '0 0 30px rgba(0, 240, 255, 0.1)',
  },
  bordered: {
    backgroundColor: 'transparent',
    border: `2px dashed ${colors.steel}`,
  },
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  style,
  ...props
}: CardProps) {
  const cardStyle: CSSProperties = {
    borderRadius: radius.xl,
    padding: PADDING_MAP[padding],
    transition: 'all 0.3s ease',
    ...VARIANT_STYLES[variant],
    ...style,
  };

  return (
    <div style={cardStyle} {...props}>
      {children}
    </div>
  );
}

// ============================================
// Card Header
// ============================================
interface CardHeaderProps {
  children: ReactNode;
  noBorder?: boolean;
  style?: CSSProperties;
}

export function CardHeader({ children, noBorder = false, style }: CardHeaderProps) {
  const headerStyle: CSSProperties = {
    marginBottom: spacing[4],
    paddingBottom: spacing[4],
    borderBottom: noBorder ? 'none' : '1px solid rgba(255, 255, 255, 0.05)',
    ...style,
  };

  return <div style={headerStyle}>{children}</div>;
}

// ============================================
// Card Title
// ============================================
interface CardTitleProps {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  style?: CSSProperties;
}

export function CardTitle({ children, as: Component = 'h3', style }: CardTitleProps) {
  const titleStyle: CSSProperties = {
    fontFamily: fonts.display,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    color: colors.snow,
    lineHeight: 1.3,
    margin: 0,
    marginBottom: spacing[1],
    ...style,
  };

  return <Component style={titleStyle}>{children}</Component>;
}

// ============================================
// Card Description
// ============================================
interface CardDescriptionProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function CardDescription({ children, style }: CardDescriptionProps) {
  const descStyle: CSSProperties = {
    fontSize: fontSizes.sm,
    color: colors.silver,
    lineHeight: 1.6,
    margin: 0,
    ...style,
  };

  return <p style={descStyle}>{children}</p>;
}

// ============================================
// Card Content
// ============================================
interface CardContentProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function CardContent({ children, style }: CardContentProps) {
  return <div style={style}>{children}</div>;
}

// ============================================
// Card Footer
// ============================================
interface CardFooterProps {
  children: ReactNode;
  style?: CSSProperties;
}

export function CardFooter({ children, style }: CardFooterProps) {
  const footerStyle: CSSProperties = {
    marginTop: spacing[6],
    paddingTop: spacing[4],
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
    ...style,
  };

  return <div style={footerStyle}>{children}</div>;
}
