import { useState, useEffect, useRef, useCallback } from 'react';
import { defaultEngine } from '@/engine/worker-client';
import type { Phase, TestResult, SpeedSample } from '@/engine/types';
import { usePreferencesStore } from '@/stores/preferences';
import { checkRateLimit } from '@/engine/rate-limiter';
import { useI18n } from '@/i18n';

export interface SpeedTestState {
  phase: Phase;
  isRunning: boolean;
  liveSpeed: number;
  liveLatency: number;
  liveJitter: number;
  isWarmingUp: boolean;
  sampleTrace: number[]; // Last N throughput samples for sparkline
  finalResult: TestResult | null;
  errorMessage: string | null;
  cooldownSeconds: number;
  startTest: () => Promise<void>;
  abortTest: () => void;
  resetTest: () => void;
}

const MAX_TRACE_POINTS = 120;
const SAMPLE_THROTTLE_MS = 90; // ~11 Hz update rate

export function useSpeedTest(): SpeedTestState {
  const { lightTestMode } = usePreferencesStore();
  const { t } = useI18n();

  const [phase, setPhase] = useState<Phase>('idle');
  const [isRunning, setIsRunning] = useState(false);
  const [liveSpeed, setLiveSpeed] = useState<number>(0);
  const [liveLatency, setLiveLatency] = useState<number>(0);
  const [liveJitter, setLiveJitter] = useState<number>(0);
  const [isWarmingUp, setIsWarmingUp] = useState<boolean>(false);
  const [sampleTrace, setSampleTrace] = useState<number[]>([]);
  const [finalResult, setFinalResult] = useState<TestResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  const lastSampleTimeRef = useRef<number>(0);
  const currentPhaseRef = useRef<Phase>('idle');

  // Cooldown countdown management
  useEffect(() => {
    const updateCooldown = () => {
      const status = checkRateLimit();
      if (!status.allowed && status.cooldownRemainingSeconds) {
        setCooldownSeconds(status.cooldownRemainingSeconds);
      } else {
        setCooldownSeconds(0);
      }
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    currentPhaseRef.current = phase;
  }, [phase]);

  // Engine event listeners
  useEffect(() => {
    const unsubPhase = defaultEngine.on('phase', (p) => {
      setPhase(p);
      currentPhaseRef.current = p;

      if (p === 'download' || p === 'upload') {
        // Clear trace on new transfer phase
        setSampleTrace([]);
      }

      if (p === 'done' || p === 'error' || p === 'aborted') {
        setIsRunning(false);
        setIsWarmingUp(false);
      }
    });

    const unsubSample = defaultEngine.on('sample', (s: SpeedSample) => {
      const now = performance.now();
      setIsWarmingUp(Boolean(s.warmup));

      // Throttle UI re-renders to ~10 Hz
      if (now - lastSampleTimeRef.current >= SAMPLE_THROTTLE_MS) {
        lastSampleTimeRef.current = now;
        setLiveSpeed(s.mbps);
        setSampleTrace((prev) => {
          const next = [...prev, s.mbps];
          return next.length > MAX_TRACE_POINTS ? next.slice(next.length - MAX_TRACE_POINTS) : next;
        });
      }
    });

    const unsubLat = defaultEngine.on('latencySample', (lat, jit) => {
      setLiveLatency(lat);
      setLiveJitter(jit);
    });

    const unsubResult = defaultEngine.on('result', (res) => {
      setFinalResult(res);
      setIsRunning(false);
      setIsWarmingUp(false);
    });

    const unsubError = defaultEngine.on('error', (err) => {
      setIsRunning(false);
      setIsWarmingUp(false);
      let localized = err.message;
      if (err.code === 'OFFLINE') localized = t.errors.offline;
      if (err.code === 'CAPTIVE_PORTAL') localized = t.errors.captivePortal;
      if (err.code === 'BLOCKED') localized = t.errors.multiTab;
      if (err.code === 'RATE_LIMITED') localized = err.message;
      setErrorMessage(localized);
    });

    const unsubAborted = defaultEngine.on('aborted', () => {
      setIsRunning(false);
      setIsWarmingUp(false);
      setPhase('aborted');
    });

    return () => {
      unsubPhase();
      unsubSample();
      unsubLat();
      unsubResult();
      unsubError();
      unsubAborted();
    };
  }, [t]);

  const startTest = useCallback(async () => {
    const status = checkRateLimit();
    if (!status.allowed) {
      if (status.cooldownRemainingSeconds) {
        setCooldownSeconds(status.cooldownRemainingSeconds);
      }
      setErrorMessage(
        status.reason === 'multi_tab_active'
          ? t.errors.multiTab
          : t.errors.rateLimited.replace('{seconds}', String(status.cooldownRemainingSeconds || 30))
      );
      return;
    }

    setErrorMessage(null);
    setFinalResult(null);
    setLiveSpeed(0);
    setLiveLatency(0);
    setLiveJitter(0);
    setIsWarmingUp(false);
    setSampleTrace([]);
    setIsRunning(true);

    try {
      await defaultEngine.start({ light: lightTestMode });
    } catch {
      // Dispatched via error event
    }
  }, [lightTestMode, t]);

  const abortTest = useCallback(() => {
    defaultEngine.abort();
    setIsRunning(false);
    setIsWarmingUp(false);
  }, []);

  const resetTest = useCallback(() => {
    if (isRunning) {
      defaultEngine.abort();
    }
    setPhase('idle');
    setIsRunning(false);
    setLiveSpeed(0);
    setLiveLatency(0);
    setLiveJitter(0);
    setIsWarmingUp(false);
    setSampleTrace([]);
    setFinalResult(null);
    setErrorMessage(null);
  }, [isRunning]);

  return {
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
    resetTest,
  };
}
