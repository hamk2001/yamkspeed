import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'glass' | 'interactive';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'glass',
  className = '',
  ...props
}) => {
  const variantClasses = {
    glass:
      'bg-[var(--surface)]/80 backdrop-blur-md border border-[var(--border)] shadow-lg shadow-black/5',
    surface:
      'bg-[var(--surface)] border border-[var(--border)] shadow-md',
    interactive:
      'bg-[var(--surface)]/90 backdrop-blur-md border border-[var(--border)] hover:border-[var(--accent-down)]/50 transition-all duration-300 shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-0.5',
  }[variant];

  return (
    <div
      className={`rounded-2xl p-5 ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
