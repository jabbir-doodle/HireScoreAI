import { forwardRef, useId, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode, type CSSProperties } from 'react';
import { colors, fonts, radius, spacing, fontSizes, fontWeights } from '../../styles/design-system';

// ============================================
// Shared Styles
// ============================================
const getBaseInputStyle = (hasError: boolean, hasIconLeft: boolean, hasIconRight: boolean): CSSProperties => ({
  width: '100%',
  height: '48px',
  padding: `0 ${spacing[4]}`,
  paddingLeft: hasIconLeft ? '44px' : spacing[4],
  paddingRight: hasIconRight ? '44px' : spacing[4],
  backgroundColor: colors.obsidian,
  border: `1px solid ${hasError ? colors.coral : colors.steel}`,
  borderRadius: radius.lg,
  color: colors.snow,
  fontFamily: fonts.body,
  fontSize: fontSizes.base,
  outline: 'none',
  transition: 'all 0.2s ease',
  boxSizing: 'border-box',
});

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: fontSizes.sm,
  fontWeight: fontWeights.medium,
  color: colors.silver,
  marginBottom: spacing[2],
};

const errorStyle: CSSProperties = {
  marginTop: spacing[2],
  fontSize: fontSizes.sm,
  color: colors.coral,
};

const hintStyle: CSSProperties = {
  marginTop: spacing[2],
  fontSize: fontSizes.sm,
  color: 'rgba(136, 136, 160, 0.7)',
};

const iconContainerStyle = (position: 'left' | 'right'): CSSProperties => ({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  [position]: spacing[4],
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '20px',
  height: '20px',
  color: colors.silver,
  pointerEvents: 'none',
});

// ============================================
// Input Component
// ============================================
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error,
    hint,
    icon,
    iconPosition = 'left',
    id,
    style,
    ...props
  }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const hasError = !!error;
    const hasIconLeft = !!icon && iconPosition === 'left';
    const hasIconRight = !!icon && iconPosition === 'right';

    const containerStyle: CSSProperties = {
      width: '100%',
    };

    const inputWrapperStyle: CSSProperties = {
      position: 'relative',
    };

    const inputStyle: CSSProperties = {
      ...getBaseInputStyle(hasError, hasIconLeft, hasIconRight),
      ...style,
    };

    return (
      <div style={containerStyle}>
        {label && (
          <label htmlFor={inputId} style={labelStyle}>
            {label}
          </label>
        )}
        <div style={inputWrapperStyle}>
          {icon && iconPosition === 'left' && (
            <span style={iconContainerStyle('left')}>{icon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            style={inputStyle}
            aria-invalid={hasError ? 'true' : undefined}
            {...props}
          />
          {icon && iconPosition === 'right' && (
            <span style={iconContainerStyle('right')}>{icon}</span>
          )}
        </div>
        {error && <p style={errorStyle}>{error}</p>}
        {hint && !error && <p style={hintStyle}>{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================
// Textarea Component
// ============================================
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    label,
    error,
    hint,
    id,
    rows = 4,
    style,
    ...props
  }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const hasError = !!error;

    const containerStyle: CSSProperties = {
      width: '100%',
    };

    const textareaStyle: CSSProperties = {
      width: '100%',
      minHeight: '120px',
      padding: spacing[4],
      backgroundColor: colors.obsidian,
      border: `1px solid ${hasError ? colors.coral : colors.steel}`,
      borderRadius: radius.lg,
      color: colors.snow,
      fontFamily: fonts.body,
      fontSize: fontSizes.base,
      outline: 'none',
      transition: 'all 0.2s ease',
      resize: 'vertical',
      boxSizing: 'border-box',
      lineHeight: 1.6,
      ...style,
    };

    return (
      <div style={containerStyle}>
        {label && (
          <label htmlFor={textareaId} style={labelStyle}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          style={textareaStyle}
          aria-invalid={hasError ? 'true' : undefined}
          {...props}
        />
        {error && <p style={errorStyle}>{error}</p>}
        {hint && !error && <p style={hintStyle}>{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// ============================================
// Select Component
// ============================================
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<InputHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    label,
    error,
    hint,
    options,
    placeholder,
    id,
    style,
    ...props
  }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const hasError = !!error;

    const containerStyle: CSSProperties = {
      width: '100%',
    };

    const selectWrapperStyle: CSSProperties = {
      position: 'relative',
    };

    const selectStyle: CSSProperties = {
      width: '100%',
      height: '48px',
      padding: `0 ${spacing[10]} 0 ${spacing[4]}`,
      backgroundColor: colors.obsidian,
      border: `1px solid ${hasError ? colors.coral : colors.steel}`,
      borderRadius: radius.lg,
      color: colors.snow,
      fontFamily: fonts.body,
      fontSize: fontSizes.base,
      outline: 'none',
      transition: 'all 0.2s ease',
      cursor: 'pointer',
      appearance: 'none',
      boxSizing: 'border-box',
      ...style,
    };

    const arrowStyle: CSSProperties = {
      position: 'absolute',
      right: spacing[4],
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      color: colors.silver,
    };

    return (
      <div style={containerStyle}>
        {label && (
          <label htmlFor={selectId} style={labelStyle}>
            {label}
          </label>
        )}
        <div style={selectWrapperStyle}>
          <select
            ref={ref}
            id={selectId}
            style={selectStyle}
            aria-invalid={hasError ? 'true' : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                style={{ backgroundColor: colors.obsidian, color: colors.snow }}
              >
                {opt.label}
              </option>
            ))}
          </select>
          <span style={arrowStyle}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2.5 4.5L6 8L9.5 4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        {error && <p style={errorStyle}>{error}</p>}
        {hint && !error && <p style={hintStyle}>{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
