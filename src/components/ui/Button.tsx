import type { ReactNode, CSSProperties, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

const SIZE_STYLES: Record<string, CSSProperties> = {
  sm: { height: '36px', padding: '0 16px', fontSize: '14px', gap: '8px', borderRadius: '8px' },
  md: { height: '44px', padding: '0 20px', fontSize: '16px', gap: '10px', borderRadius: '12px' },
  lg: { height: '52px', padding: '0 28px', fontSize: '18px', gap: '12px', borderRadius: '12px' },
};

const VARIANT_STYLES: Record<string, CSSProperties> = {
  primary: {
    background: 'linear-gradient(90deg, #00f0ff, #00c4cc)',
    color: '#06060a',
    fontWeight: 600,
    border: 'none',
    boxShadow: '0 0 20px rgba(0,240,255,0.25)',
  },
  secondary: {
    background: '#1a1a24',
    color: '#c8c8d8',
    fontWeight: 500,
    border: '1px solid #2a2a38',
  },
  ghost: {
    background: 'transparent',
    color: '#c8c8d8',
    fontWeight: 500,
    border: 'none',
  },
  danger: {
    background: 'linear-gradient(90deg, #ff6b6b, #ff5252)',
    color: '#ffffff',
    fontWeight: 600,
    border: 'none',
    boxShadow: '0 0 20px rgba(255,107,107,0.25)',
  },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  style,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease',
    width: fullWidth ? '100%' : 'auto',
    ...SIZE_STYLES[size],
    ...VARIANT_STYLES[variant],
    ...style,
  };

  return (
    <button style={baseStyle} disabled={disabled || loading} {...props}>
      {loading ? (
        <span>Processing...</span>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span style={{ display: 'flex', marginRight: '8px' }}>{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span style={{ display: 'flex', marginLeft: '8px' }}>{icon}</span>}
        </>
      )}
    </button>
  );
}
