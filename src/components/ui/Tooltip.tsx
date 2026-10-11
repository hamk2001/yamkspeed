import React, { useState } from 'react';

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
  }[position];

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute ${positionClasses} start-1/2 -translate-x-1/2 z-40 px-2.5 py-1 text-xs font-medium text-white bg-black/90 backdrop-blur-md rounded-md shadow-md whitespace-nowrap pointer-events-none animate-in fade-in duration-150`}
        >
          {content}
        </div>
      )}
    </div>
  );
};
