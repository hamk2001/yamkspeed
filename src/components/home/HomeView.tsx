import React, { useEffect, useCallback } from 'react';
import { useI18n } from '@/i18n';
import { useSpeedTest } from '@/features/speed-test/useSpeedTest';
import { RadialGauge } from '@/components/gauge/RadialGauge';
import { SparklineTrace } from '@/components/gauge/SparklineTrace';
import { BentoResultGrid } from '@/components/results/BentoResultGrid';

export interface HomeViewProps {
  onOpenMethodology?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onOpenMethodology }) => {
  const { t } = useI18n();
  const {
    phase,
    isRunning,
    liveSpeed,
    liveLatency,
    liveJitter,
    isWarmingUp,
    sampleTrace,
    finalResult,
    errorMessage,
    cooldownSeconds,
    startTest,
    abortTest,
  } = useSpeedTest();

  const handleToggleTest = useCallback(() => {
    if (isRunning) {
      abortTest();
    } else {
      startTest();
    }
  }, [isRunning, abortTest, startTest]);

  // Global Keyboard shortcuts: Space/Enter to start/abort, Esc to abort
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is inside an input, textarea or dialog
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.querySelector('[role="dialog"]')
      ) {
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleToggleTest();
      } else if (e.code === 'Escape' && isRunning) {
        e.preventDefault();
        abortTest();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleTest, isRunning, abortTest]);

  const getPhaseDescription = () => {
    switch (phase) {
      case 'locating':
        return t.phases.locating;
      case 'latency':
        return t.phases.latency;
      case 'download':
        return t.phases.download;
      case 'upload':
        return t.phases.upload;
      case 'done':
        return t.phases.completed;
      case 'aborted':
        return t.phases.aborted;
      case 'error':
        return t.phases.error;
      default:
        return t.phases.idle;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-4 px-2 sm:px-4 max-w-4xl mx-auto space-y-8 select-none">
      {/* Error alert banner */}
      {errorMessage && (
        <div
          role="alert"
          className="w-full p-4 rounded-xl bg-[var(--danger)]/15 border border-[var(--danger)]/40 text-[var(--danger)] text-sm text-center font-medium animate-in fade-in"
        >
          {errorMessage}
        </div>
      )}

      {/* Hero Radial SVG Gauge & Central Orb */}
      <div className="relative flex flex-col items-center justify-center">
        <RadialGauge
          phase={phase}
          isRunning={isRunning}
          liveSpeed={liveSpeed}
          liveLatency={liveLatency}
          finalSpeed={finalResult?.downloadMbps}
          isWarmingUp={isWarmingUp}
          cooldownSeconds={cooldownSeconds}
          onToggleTest={handleToggleTest}
        />

        {/* Phase subtitle below gauge */}
        <div className="mt-3 text-xs font-semibold text-[var(--text-muted)] text-center h-5 flex items-center justify-center gap-1.5">
          {isRunning && (
            <span className="w-2 h-2 rounded-full bg-[var(--accent-down)] animate-ping" />
          )}
          <span>{getPhaseDescription()}</span>
        </div>

        {/* Live Sparkline Throughput Curve during transfer */}
        {(isRunning || sampleTrace.length > 0) && (
          <div className="w-64 sm:w-80 mt-2 animate-in fade-in duration-200">
            <SparklineTrace data={sampleTrace} phase={phase} height={44} />
          </div>
        )}
      </div>

      {/* Bento Results & Metrics Grid */}
      <BentoResultGrid
        phase={phase}
        liveSpeed={liveSpeed}
        liveLatency={liveLatency}
        liveJitter={liveJitter}
        finalResult={finalResult}
        onOpenMethodology={onOpenMethodology}
      />
    </div>
  );
};
