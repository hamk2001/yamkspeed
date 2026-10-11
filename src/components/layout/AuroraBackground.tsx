import React, { useState, useEffect } from 'react';
import { defaultEngine } from '@/engine/worker-client';
import type { Phase } from '@/engine/types';

export interface AuroraBackgroundProps {
  className?: string;
}

export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({ className = '' }) => {
  const [phase, setPhase] = useState<Phase>('idle');

  useEffect(() => {
    const unsub = defaultEngine.on('phase', (newPhase) => {
      setPhase(newPhase);
    });
    return unsub;
  }, []);

  // Aurora hue shifts per test phase according to Study 04 §1 & Phase 3 §3.6
  const getPhaseHue = () => {
    switch (phase) {
      case 'latency':
        return '38deg'; // Amber
      case 'download':
        return '168deg'; // Cyan
      case 'upload':
        return '265deg'; // Violet
      case 'locating':
        return '195deg'; // Soft Blue
      case 'error':
        return '350deg'; // Rose
      case 'aborted':
        return '350deg';
      default:
        return '168deg'; // Idle Cyan
    }
  };

  const hue = getPhaseHue();

  return (
    <div
      className={`fixed inset-0 pointer-events-none -z-10 overflow-hidden transition-all duration-1000 ${className}`}
      aria-hidden="true"
    >
      {/* Top primary glow with smooth hue transition */}
      <div
        className="absolute -top-[20%] start-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px] opacity-25 dark:opacity-20 transition-all duration-1000"
        style={{
          background: `radial-gradient(circle, hsl(${hue} 80% 50%) 0%, transparent 70%)`,
        }}
      />

      {/* Secondary accent glow (violet) */}
      <div
        className="absolute top-[35%] -end-[10%] w-[500px] h-[500px] rounded-full blur-[160px] opacity-15 dark:opacity-10 transition-all duration-1000"
        style={{
          background: 'radial-gradient(circle, var(--accent-up) 0%, transparent 70%)',
        }}
      />

      {/* Ambient bottom glow (latency amber) */}
      <div
        className="absolute -bottom-[20%] start-[10%] w-[600px] h-[400px] rounded-full blur-[160px] opacity-15 dark:opacity-10 transition-all duration-1000"
        style={{
          background: 'radial-gradient(circle, var(--accent-lat) 0%, transparent 70%)',
        }}
      />
    </div>
  );
};
