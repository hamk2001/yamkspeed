import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoreSpeedEngine } from './orchestrator';
import { safeStorage } from '@/lib/storage-migration';

describe('CoreSpeedEngine Orchestrator', () => {
  let engine: CoreSpeedEngine;

  beforeEach(() => {
    safeStorage.removeItem('nabd:rate_limit:v1');
    safeStorage.removeItem('nabd:active_test_lock:v1');
    engine = new CoreSpeedEngine();
  });

  it('starts in idle phase and isRunning is false', () => {
    expect(engine.phase).toBe('idle');
    expect(engine.isRunning).toBe(false);
  });

  it('emits abort event and resets isRunning when abort() is invoked', () => {
    const abortSpy = vi.fn();
    engine.on('aborted', abortSpy);

    // Call abort when running
    (engine as unknown as { _isRunning: boolean })._isRunning = true;
    engine.abort();

    expect(engine.phase).toBe('aborted');
    expect(engine.isRunning).toBe(false);
    expect(abortSpy).toHaveBeenCalled();
  });

  it('dispatches typed phase transitions properly', () => {
    const phases: string[] = [];
    engine.on('phase', (p) => phases.push(p));

    const internal = engine as unknown as { setPhase: (p: string, pr: number) => void };
    internal.setPhase('locating', 0.1);
    internal.setPhase('latency', 0.25);
    internal.setPhase('download', 0.5);
    internal.setPhase('upload', 0.75);
    internal.setPhase('done', 1.0);

    expect(phases).toEqual(['locating', 'latency', 'download', 'upload', 'done']);
  });

  it('returns honest error when offline without generating fake numbers', async () => {
    // Mock navigator.onLine to false
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

    let caughtError: unknown = null;
    try {
      await engine.start();
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();
    expect((caughtError as { code: string }).code).toBe('OFFLINE');
    expect(engine.phase).toBe('error');
    expect(engine.isRunning).toBe(false);

    vi.restoreAllMocks();
  });
});
