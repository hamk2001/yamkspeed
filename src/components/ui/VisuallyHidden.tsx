import React from 'react';

export interface VisuallyHiddenProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ children, className = '', ...props }) => {
  return (
    <span
      className={`sr-only ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
