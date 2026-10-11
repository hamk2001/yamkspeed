import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  variant?: 'ghost' | 'outline' | 'surface';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      children,
      'aria-label': ariaLabel,
      variant = 'ghost',
      size = 'md',
      className = '',
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'w-8 h-8 p-1.5',
      md: 'w-10 h-10 p-2',
      lg: 'w-12 h-12 p-2.5',
    }[size];

    const variantClasses = {
      ghost: 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]',
      outline: 'border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)]',
      surface: 'bg-[var(--surface-2)] text-[var(--text)] hover:brightness-110',
    }[variant];

    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        className={`inline-flex items-center justify-center rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
