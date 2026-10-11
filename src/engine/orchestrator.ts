import { TypedEventEmitter } from './events';
import type {
  Phase,
  SpeedEngine,
  SpeedTestOptions,
  TestResult,
  SpeedTestError,
  EngineEventMap,
} from './types';
import { runPreflightCheck } from './preflight';
import { fetchServerMetadata } from './meta';
import { measureLatency } from './latency';
import { measureDownload } from './download';
import { measureUpload } from './upload';
import { runNdt7Test } from './ndt7';
import { checkRateLimit, recordTestStart, releaseTestLock } from './rate-limiter';

export class CoreSpeedEngine implements SpeedEngine {
  private _phase: Phase = 'idle';
  private _isRunning: boolean = false;
  private emitter = new TypedEventEmitter();
  private abortController: AbortController | null = null;

  get phase(): Phase {
    return this._phase;
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  on<E extends keyof EngineEventMap>(event: E, cb: EngineEventMap[E]): () => void {
    return this.emitter.on(event, cb);
  }

  private setPhase(newPhase: Phase, progress = 0): void {
    this._phase = newPhase;
    this.emitter.emit('phase', newPhase, progress);
  }

  abort(): void {
    if (!this._isRunning) return;
    if (this.abortController) {
      this.abortController.abort();
    }
    releaseTestLock();
    this._isRunning = false;
    this.setPhase('aborted', 0);
    this.emitter.emit('aborted');
  }

  dispose(): void {
    this.abort();
    this.emitter.removeAllListeners();
  }

  async start(opts: SpeedTestOptions = {}): Promise<TestResult> {
    if (this._isRunning) {
      throw new Error('A speed test is already in progress');
    }

    // 1. Rate Limiting & Multi-Tab Lock Guard
    const limitStatus = checkRateLimit();
    if (!limitStatus.allowed) {
      const err: SpeedTestError = {
        code: limitStatus.reason === 'multi_tab_active' ? 'BLOCKED' : 'RATE_LIMITED',
        message:
          limitStatus.reason === 'multi_tab_active'
            ? 'A test is already running in another tab.'
            : `Please wait ${limitStatus.cooldownRemainingSeconds}s before starting another test.`,
        phase: 'idle',
        retryable: true,
      };
      this.emitter.emit('error', err);
      throw err;
    }

    recordTestStart();
    this._isRunning = true;
    this.abortController = new AbortController();

    if (opts.signal) {
      opts.signal.addEventListener('abort', () => this.abort(), { once: true });
    }

    const isLightMode = Boolean(opts.light);
    const signal = this.abortController.signal;
    const startedAt = new Date().toISOString();
    const testStartTime = performance.now();

    try {
      // 2. Pre-flight Network Verification
      this.setPhase('locating', 0.1);
      const preflight = await runPreflightCheck(
        'https://speed.cloudflare.com/__down?bytes=0',
        signal
      );

      if (!preflight.ok && preflight.error) {
        // Try fallback to M-Lab if Cloudflare preflight failed and not captive portal
        if (preflight.error.code !== 'CAPTIVE_PORTAL' && preflight.error.code !== 'OFFLINE') {
          console.warn('[Engine] Cloudflare pre-flight failed, falling back to NDT7 M-Lab');
          return await this.runFallbackNdt7(signal);
        } else {
          this.emitter.emit('error', preflight.error);
          this.setPhase('error', 0);
          throw preflight.error;
        }
      }

      // 3. Server Metadata / Geo-location
      const serverInfo = await fetchServerMetadata(signal);

      // 4. Latency & Jitter Measurement Phase
      this.setPhase('latency', 0.25);
      const latencyResult = await measureLatency({
        sampleCount: isLightMode ? 10 : 20,
        signal,
        onSample: (lat, jit) => {
          this.emitter.emit('latencySample', lat, jit);
        },
      });

      // 5. Download Bandwidth Measurement Phase
      this.setPhase('download', 0.5);
      let loadedDownLatency: number | undefined;
      const downloadPromise = measureDownload({
        durationMs: isLightMode ? 5000 : 9000,
        maxBytes: isLightMode ? 10 * 1024 * 1024 : 50 * 1024 * 1024,
        concurrency: isLightMode ? 3 : 5,
        signal,
        onSample: (sample) => {
          this.emitter.emit('sample', sample);
        },
      });

      // Concurrent probe for loaded latency during download (Task P2-14)
      const loadedDownProbe = (async () => {
        try {
          await new Promise((r) => setTimeout(r, isLightMode ? 1500 : 3000));
          if (!signal.aborted) {
            const probe = await measureLatency({ sampleCount: 3, signal });
            loadedDownLatency = probe.latencyMs;
          }
        } catch {
          // Loaded latency is optional; ignore probe failure
        }
      })();

      const [downloadResult] = await Promise.all([downloadPromise, loadedDownProbe]);

      // 6. Upload Bandwidth Measurement Phase
      this.setPhase('upload', 0.8);
      let loadedUpLatency: number | undefined;
      const uploadPromise = measureUpload({
        durationMs: isLightMode ? 5000 : 9000,
        maxBytes: isLightMode ? 10 * 1024 * 1024 : 35 * 1024 * 1024,
        concurrency: isLightMode ? 3 : 4,
        signal,
        onSample: (sample) => {
          this.emitter.emit('sample', sample);
        },
      });

      // Concurrent probe for loaded latency during upload (Task P2-14)
      const loadedUpProbe = (async () => {
        try {
          await new Promise((r) => setTimeout(r, isLightMode ? 1500 : 3000));
          if (!signal.aborted) {
            const probe = await measureLatency({ sampleCount: 3, signal });
            loadedUpLatency = probe.latencyMs;
          }
        } catch {
          // Loaded latency is optional; ignore probe failure
        }
      })();

      const [uploadResult] = await Promise.all([uploadPromise, loadedUpProbe]);

      // 7. Assemble Final Test Result
      const totalDurationMs = performance.now() - testStartTime;
      const isStable =
        downloadResult.quality === 'stable' && uploadResult.quality === 'stable';

      const finalResult: TestResult = {
        engine: 'cloudflare',
        startedAt,
        server: serverInfo,
        latencyMs: latencyResult.latencyMs,
        jitterMs: latencyResult.jitterMs,
        downloadMbps: downloadResult.mbps,
        uploadMbps: uploadResult.mbps,
        loadedLatencyMs: {
          down: loadedDownLatency,
          up: loadedUpLatency,
        },
        bytes: {
          down: downloadResult.totalBytes,
          up: uploadResult.totalBytes,
        },
        streams: {
          down: downloadResult.streamsUsed,
          up: uploadResult.streamsUsed,
        },
        durationMs: totalDurationMs,
        quality: isStable ? 'stable' : 'unstable',
      };

      this.setPhase('done', 1.0);
      this.emitter.emit('result', finalResult);
      return finalResult;
    } catch (err: unknown) {
      if (signal.aborted) {
        this.setPhase('aborted', 0);
        const abortErr: SpeedTestError = {
          code: 'ABORTED',
          message: 'Speed test was cancelled by user.',
          phase: this._phase,
          retryable: true,
        };
        throw abortErr;
      }

      if (
        (err as SpeedTestError)?.code === 'OFFLINE' ||
        (err as SpeedTestError)?.code === 'CAPTIVE_PORTAL'
      ) {
        throw err;
      }

      // Try failover to Tier 2 M-Lab before declaring total failure
      try {
        console.warn('[Engine] Primary measurement failed, attempting Tier 2 (M-Lab NDT7)...');
        return await this.runFallbackNdt7(signal);
      } catch {
        const errorObj: SpeedTestError = {
          code: (err as SpeedTestError)?.code || 'ENDPOINT_UNREACHABLE',
          message:
            err instanceof Error
              ? err.message
              : (err as SpeedTestError)?.message || 'Measurement engine failed to complete.',
          phase: this._phase,
          retryable: true,
        };
        this.setPhase('error', 0);
        this.emitter.emit('error', errorObj);
        throw errorObj;
      }
    } finally {
      this._isRunning = false;
      releaseTestLock();
    }
  }

  private async runFallbackNdt7(signal: AbortSignal): Promise<TestResult> {
    this.setPhase('download', 0.4);
    const result = await runNdt7Test({
      signal,
      onSample: (sample) => this.emitter.emit('sample', sample),
      onLatency: (lat, jit) => this.emitter.emit('latencySample', lat, jit),
    });

    this.setPhase('done', 1.0);
    this.emitter.emit('result', result);
    return result;
  }
}

// Export default singleton instance
export const speedEngine = new CoreSpeedEngine();
