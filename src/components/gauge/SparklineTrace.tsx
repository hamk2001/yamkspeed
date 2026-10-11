import React from 'react';
import type { Phase } from '@/engine/types';

export interface SparklineTraceProps {
  data: number[];
  phase: Phase;
  height?: number;
  className?: string;
}

export const SparklineTrace: React.FC<SparklineTraceProps> = ({
  data,
  phase,
  height = 56,
  className = '',
}) => {
  if (data.length < 2) {
    return <div style={{ height }} className={`w-full ${className}`} />;
  }

  const maxVal = Math.max(...data, 1);
  const minVal = 0;
  const range = maxVal - minVal || 1;
  const width = 280;
  const strokeWidth = 2;

  // Build SVG path points (always LTR time progression)
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - minVal) / range) * (height - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const strokeColor =
    phase === 'upload'
      ? 'var(--accent-up)'
      : phase === 'latency'
        ? 'var(--accent-lat)'
        : 'var(--accent-down)';

  return (
    <div
      dir="ltr"
      className={`w-full flex flex-col items-center justify-center select-none overflow-hidden ${className}`}
      style={{ height }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="trace-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gradient Fill under trace curve */}
        <path d={areaD} fill="url(#trace-gradient)" className="transition-all duration-150" />

        {/* Main Line */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all duration-150"
        />

        {/* Pulsing Active Head Dot */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].split(',')[0]}
            cy={points[points.length - 1].split(',')[1]}
            r="3.5"
            fill={strokeColor}
            className="animate-pulse"
          />
        )}
      </svg>
    </div>
  );
};
