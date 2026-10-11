import React, { useMemo } from 'react';
import { Play, Square, RotateCcw, Clock } from 'lucide-react';
import type { Phase } from '@/engine/types';
import { useI18n } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences';
import { formatLocaleNumber } from '@/lib/number-format';

export interface RadialGaugeProps {
  phase: Phase;
  isRunning: boolean;
  liveSpeed: number; // in Mbps
  liveLatency: number; // in ms
  finalSpeed?: number; // in Mbps
  isWarmingUp?: boolean;
  cooldownSeconds?: number;
  onToggleTest: () => void;
}

const SCALE_STEPS = [10, 50, 100, 250, 500, 1000, 2500];
const RADIUS = 90;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~565.487
const ARC_DEGREES = 270;
const ARC_LENGTH = (ARC_DEGREES / 360) * CIRCUMFERENCE; // ~424.115

export const RadialGauge: React.FC<RadialGaugeProps> = ({
  phase,
  isRunning,
  liveSpeed,
  liveLatency,
  finalSpeed,
  isWarmingUp = false,
  cooldownSeconds = 0,
  onToggleTest,
}) => {
  const { t } = useI18n();
  const { speedUnit, digits, lang } = usePreferencesStore();

  const isMBps = speedUnit === 'MBps';

  // Active raw numerical value for calculation
  const rawValue = isRunning
    ? phase === 'latency'
      ? liveLatency
      : liveSpeed
    : finalSpeed ?? 0;

  // Compute dynamic max scale with hysteresis
  const maxScale = useMemo(() => {
    const target = phase === 'latency' ? 200 : Math.max(rawValue, 10);
    for (const step of SCALE_STEPS) {
      if (target <= step) return step;
    }
    return 2500;
  }, [phase, rawValue]);

  // Fraction for arc progress [0, 1]
  const progressFraction = Math.min(1, Math.max(0, rawValue / maxScale));
  const progressLength = progressFraction * ARC_LENGTH;

  // Comet head coordinates
  const currentAngleDeg = 135 + progressFraction * ARC_DEGREES;
  const currentAngleRad = (currentAngleDeg * Math.PI) / 180;
  const headX = 120 + RADIUS * Math.cos(currentAngleRad);
  const headY = 120 + RADIUS * Math.sin(currentAngleRad);

  // Colors per phase
  const strokeColor =
    phase === 'upload'
      ? 'var(--accent-up)'
      : phase === 'latency'
        ? 'var(--accent-lat)'
        : 'var(--accent-down)';

  // Value formatting for display
  const displayFormattedValue = useMemo(() => {
    if (!isRunning && finalSpeed === undefined) return '';

    if (phase === 'latency') {
      return liveLatency > 0 ? formatLocaleNumber(liveLatency, { decimals: 0, lang, digits }) : '0';
    }

    const val = isRunning ? liveSpeed : (finalSpeed ?? 0);
    const converted = isMBps ? val / 8 : val;
    return formatLocaleNumber(converted, { decimals: 1, lang, digits });
  }, [isRunning, phase, liveLatency, liveSpeed, finalSpeed, isMBps, lang, digits]);

  const displayUnit = phase === 'latency' ? t.metrics.ms : isMBps ? t.metrics.mbpsBytes : t.metrics.mbps;

  // Tick marks calculations
  const ticks = useMemo(() => {
    return [0, 0.25, 0.5, 0.75, 1].map((fraction) => {
      const angleDeg = 135 + fraction * ARC_DEGREES;
      const angleRad = (angleDeg * Math.PI) / 180;
      const x1 = 120 + (RADIUS - 8) * Math.cos(angleRad);
      const y1 = 120 + (RADIUS - 8) * Math.sin(angleRad);
      const x2 = 120 + (RADIUS + 2) * Math.cos(angleRad);
      const y2 = 120 + (RADIUS + 2) * Math.sin(angleRad);

      const labelVal = isMBps && phase !== 'latency' ? (fraction * maxScale) / 8 : fraction * maxScale;
      const labelText = labelVal >= 1000 ? `${(labelVal / 1000).toFixed(0)}k` : `${labelVal.toFixed(0)}`;

      const lx = 120 + (RADIUS - 18) * Math.cos(angleRad);
      const ly = 120 + (RADIUS - 18) * Math.sin(angleRad);

      return { x1, y1, x2, y2, lx, ly, labelText };
    });
  }, [isMBps, maxScale, phase]);

  const isCooldown = cooldownSeconds > 0 && !isRunning;

  return (
    <div className="relative flex flex-col items-center justify-center select-none w-72 h-72 sm:w-80 sm:h-80">
      {/* Ambient Pulsing Glow behind Gauge */}
      <div
        className={`absolute inset-4 rounded-full blur-3xl transition-opacity duration-700 -z-10 ${
          isRunning
            ? 'opacity-40 animate-pulse bg-gradient-to-tr from-[var(--accent-down)] to-[var(--accent-up)]'
            : 'opacity-15 bg-[var(--accent-down)]'
        }`}
      />

      <svg
        viewBox="0 0 240 240"
        className="w-full h-full drop-shadow-xl overflow-visible"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="gauge-track-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--surface-2)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--surface-2)" stopOpacity="0.8" />
          </linearGradient>
          <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 270° Background Track Arc */}
        <circle
          cx="120"
          cy="120"
          r={RADIUS}
          fill="none"
          stroke="url(#gauge-track-gradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
          transform="rotate(135 120 120)"
          className="text-[var(--surface-2)]"
        />

        {/* Dynamic Ticks and Numeric Labels */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="var(--border)"
              strokeWidth={i % 2 === 0 ? '1.5' : '1'}
              strokeOpacity="0.75"
            />
            <text
              x={t.lx}
              y={t.ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-[var(--text-muted)] text-[8px] font-mono font-medium select-none"
            >
              {t.labelText}
            </text>
          </g>
        ))}

        {/* Active Measurement Arc */}
        <circle
          cx="120"
          cy="120"
          r={RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${progressLength} ${CIRCUMFERENCE}`}
          transform="rotate(135 120 120)"
          filter="url(#gauge-glow)"
          className="transition-all duration-150 ease-out"
        />

        {/* Glowing Comet Head Point */}
        {progressFraction > 0.01 && (
          <g filter="url(#gauge-glow)">
            <circle cx={headX} cy={headY} r="5" fill="#ffffff" />
            <circle cx={headX} cy={headY} r="3" fill={strokeColor} />
          </g>
        )}
      </svg>

      {/* Central Interactive Orb / Readout Screen */}
      <button
        onClick={onToggleTest}
        disabled={isCooldown}
        aria-label={isRunning ? t.actions.abort : t.actions.start}
        className={`absolute inset-12 sm:inset-14 rounded-full bg-gradient-to-b from-[var(--surface-2)] to-[var(--surface)] border border-[var(--border)] shadow-2xl flex flex-col items-center justify-center group focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-down)]/50 transition-all duration-300 ${
          isCooldown
            ? 'opacity-60 cursor-not-allowed'
            : isRunning
              ? 'border-[var(--accent-down)]/60 cursor-pointer active:scale-95'
              : 'hover:scale-[1.03] active:scale-95 cursor-pointer hover:border-[var(--accent-down)]/40'
        }`}
      >
        {isCooldown ? (
          <div className="flex flex-col items-center text-center px-2">
            <Clock className="w-6 h-6 text-[var(--accent-lat)] animate-spin-slow mb-1" />
            <span className="text-xs font-bold text-[var(--text)]">
              {cooldownSeconds}s
            </span>
            <span className="text-[9px] text-[var(--text-muted)] leading-tight mt-0.5">
              {t.metrics.cooldown.replace('{seconds}', String(cooldownSeconds))}
            </span>
          </div>
        ) : isRunning ? (
          <div className="flex flex-col items-center text-center">
            {/* Number Readout (Strictly LTR + Tabular Nums) */}
            <div
              dir="ltr"
              className="text-3xl sm:text-4xl font-black font-mono tabular-nums text-[var(--text)] tracking-tight"
            >
              {displayFormattedValue}
            </div>

            {/* Speed Unit */}
            <div className="text-[11px] font-bold text-[var(--accent-down)] uppercase tracking-wide">
              {displayUnit}
            </div>

            {/* Honest Warm-up Badge (Study 03 §4) */}
            {isWarmingUp ? (
              <div className="mt-1 px-2 py-0.5 rounded-full bg-[var(--accent-lat)]/15 border border-[var(--accent-lat)]/30 text-[9px] font-bold text-[var(--accent-lat)] animate-pulse">
                {t.metrics.warmingUp}
              </div>
            ) : (
              <div className="flex items-center gap-1 mt-1 text-[10px] text-[var(--text-muted)] group-hover:text-[var(--danger)] transition-colors">
                <Square className="w-2.5 h-2.5 fill-current" />
                <span>{t.actions.abort}</span>
              </div>
            )}
          </div>
        ) : finalSpeed !== undefined ? (
          <div className="flex flex-col items-center text-center">
            <div
              dir="ltr"
              className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[var(--accent-down)] tracking-tight"
            >
              {displayFormattedValue}
            </div>
            <div className="text-[10px] font-semibold text-[var(--text-muted)]">
              {displayUnit}
            </div>
            <div className="flex items-center gap-1 mt-1.5 text-xs font-bold text-[var(--accent-down)] group-hover:underline">
              <RotateCcw className="w-3 h-3" />
              <span>{t.actions.retest}</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--accent-down)]/10 text-[var(--accent-down)] flex items-center justify-center mb-1 group-hover:bg-[var(--accent-down)] group-hover:text-[#070B14] transition-all duration-300">
              <Play className="w-5 h-5 fill-current ms-0.5 rtl:-scale-x-100" />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-widest text-[var(--text)] group-hover:text-[var(--accent-down)] transition-colors">
              {t.actions.start}
            </span>
          </div>
        )}
      </button>

      {/* Screen Reader Status Announcement */}
      <div className="sr-only" role="status" aria-live="polite">
        {isRunning
          ? `${phase === 'done' ? t.phases.completed : (t.phases as Record<string, string>)[phase] || phase}: ${displayFormattedValue} ${displayUnit}`
          : finalSpeed !== undefined
            ? `${t.phases.completed}: ${displayFormattedValue} ${displayUnit}`
            : t.phases.idle}
      </div>
    </div>
  );
};
