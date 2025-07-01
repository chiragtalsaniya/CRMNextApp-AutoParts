import React from 'react';
import { colors, fontSizes, borderRadius, spacing } from '../styles/designTokens';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
};

const getButtonClass = (variant: string, size: string, fullWidth: boolean) => {
  let base = `rounded-[${borderRadius.md}px] font-semibold flex items-center justify-center transition focus:outline-none`;
  if (fullWidth) base += ' w-full';
  switch (size) {
    case 'small':
      base += ` px-${spacing.md} py-${spacing.sm + 2}`;
      break;
    case 'large':
      base += ` px-${spacing.xl} py-${spacing.md + 2}`;
      break;
    default:
      base += ` px-${spacing.lg} py-${spacing.md - 2}`;
  }
  switch (variant) {
    case 'primary':
      base += ` bg-[${colors.primary}] text-[${colors.surface}]`;
      break;
    case 'secondary':
      base += ` bg-[${colors.background}] text-[${colors.text}] border border-[#e2e8f0]`;
      break;
    case 'outline':
      base += ` bg-transparent text-[${colors.primary}] border-2 border-[${colors.primary}]`;
      break;
    case 'ghost':
      base += ` bg-transparent text-[${colors.primary}]`;
      break;
    case 'danger':
      base += ` bg-[${colors.error}] text-[${colors.surface}]`;
      break;
    default:
      base += ` bg-[${colors.primary}] text-[${colors.surface}]`;
  }
  return base;
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  fullWidth = false,
  ...props
}) => (
  <button
    className={getButtonClass(variant, size, fullWidth)}
    disabled={props.disabled || loading}
    {...props}
  >
    {loading ? (
      <span className="mr-2 animate-spin">⏳</span>
    ) : (
      icon && <span className="mr-2">{icon}</span>
    )}
    <span
      style={{
        fontSize:
          size === 'small'
            ? fontSizes.small
            : size === 'large'
            ? fontSizes.heading
            : fontSizes.body,
      }}
    >
      {children}
    </span>
  </button>
);
