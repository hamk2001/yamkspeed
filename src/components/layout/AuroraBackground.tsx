import React from 'react';

export interface AuroraBackgroundProps {
  hue?: string;
  className?: string;
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  hue = '168deg',
  className = '',
}) => {
  return (
    <div
      className={`fixed inset-0 pointer-events-none -z-10 overflow-hidden transition-all duration-700 ${className}`}
      aria-hidden="true"
    >
      {/* Top primary glow */}
      <div
        className="absolute -top-[20%] start-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px] opacity-25 dark:opacity-20 transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, hsl(var(--aurora-hue, ${hue}) 80% 50%) 0%, transparent 70%)`,
        }}
      />

      {/* Secondary accent glow */}
      <div
        className="absolute top-[35%] -end-[10%] w-[500px] h-[500px] rounded-full blur-[160px] opacity-15 dark:opacity-10 transition-all duration-1000"
        style={{
          background: 'radial-gradient(circle, var(--accent-up) 0%, transparent 70%)',
        }}
      />

      {/* Subtle ambient bottom glow */}
      <div
        className="absolute -bottom-[20%] start-[10%] w-[600px] h-[400px] rounded-full blur-[160px] opacity-15 dark:opacity-10 transition-all duration-1000"
        style={{
          background: 'radial-gradient(circle, var(--accent-lat) 0%, transparent 70%)',
        }}
      />
    </div>
  );
};
