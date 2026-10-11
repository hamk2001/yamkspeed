import React from 'react';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      startIcon,
      endIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

    const sizeClasses = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-6 py-3.5 gap-2.5',
    }[size];

    const variantClasses = {
      primary:
        'bg-[var(--accent-down)] text-[#070B14] font-semibold hover:brightness-110 active:scale-[0.98] shadow-sm',
      secondary:
        'bg-[var(--surface-2)] text-[var(--text)] hover:brightness-105 active:scale-[0.98]',
      outline:
        'border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] active:scale-[0.98]',
      ghost:
        'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] active:scale-[0.98]',
      danger:
        'bg-[var(--danger)] text-white hover:brightness-110 active:scale-[0.98]',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Spinner size={size === 'lg' ? 'md' : 'sm'} className="text-current" />
        ) : (
          startIcon && <span className="inline-flex shrink-0">{startIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && endIcon && <span className="inline-flex shrink-0">{endIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
