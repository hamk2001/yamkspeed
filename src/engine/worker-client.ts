import { TypedEventEmitter } from './events';
import { CoreSpeedEngine } from './orchestrator';
import type {
  EngineEventMap,
  Phase,
  SpeedEngine,
  SpeedTestOptions,
  TestResult,
  SpeedTestError,
} from './types';

export class WorkerSpeedEngineClient implements SpeedEngine {
  private worker: Worker | null = null;
  private fallbackEngine: CoreSpeedEngine | null = null;
  private emitter = new TypedEventEmitter();
  private _phase: Phase = 'idle';
  private _isRunning: boolean = false;
  private workerAvailable = true;

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      this.workerAvailable = false;
      return;
    }

    try {
      this.worker = new Worker(new URL('./worker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (e: MessageEvent) => {
        const { type, phase, progress, sample, latencyMs, jitterMs, result, error } =
          e.data || {};

        switch (type) {
          case 'PHASE':
            this._phase = phase;
            this.emitter.emit('phase', phase, progress);
            break;
          case 'SAMPLE':
            this.emitter.emit('sample', sample);
            break;
          case 'LATENCY_SAMPLE':
            this.emitter.emit('latencySample', latencyMs, jitterMs);
            break;
          case 'RESULT':
            this._isRunning = false;
            this._phase = 'done';
            this.emitter.emit('result', result);
            break;
          case 'ERROR':
            this._isRunning = false;
            this._phase = 'error';
            this.emitter.emit('error', error);
            break;
          case 'ABORTED':
            this._isRunning = false;
            this._phase = 'aborted';
            this.emitter.emit('aborted');
            break;
        }
      };

      this.worker.onerror = (err) => {
        console.warn('[SpeedEngine] Worker error, falling back to main-thread engine:', err);
        this.workerAvailable = false;
        if (this.worker) {
          this.worker.terminate();
          this.worker = null;
        }
      };
    } catch (err) {
      console.warn('[SpeedEngine] Failed to instantiate Web Worker, using main-thread fallback:', err);
      this.workerAvailable = false;
    }
  }

  get phase(): Phase {
    return this.fallbackEngine ? this.fallbackEngine.phase : this._phase;
  }

  get isRunning(): boolean {
    return this.fallbackEngine ? this.fallbackEngine.isRunning : this._isRunning;
  }

  on<E extends keyof EngineEventMap>(event: E, cb: EngineEventMap[E]): () => void {
    return this.emitter.on(event, cb);
  }

  async start(opts?: SpeedTestOptions): Promise<TestResult> {
    if (this.isRunning) {
      throw new Error('A test is already running');
    }

    // Graceful degradation: run on main thread if worker unavailable
    if (!this.workerAvailable || !this.worker) {
      if (!this.fallbackEngine) {
        this.fallbackEngine = new CoreSpeedEngine();
        // Pipe fallback events to this client's emitter
        this.fallbackEngine.on('phase', (p, pr) => this.emitter.emit('phase', p, pr));
        this.fallbackEngine.on('sample', (s) => this.emitter.emit('sample', s));
        this.fallbackEngine.on('latencySample', (l, j) => this.emitter.emit('latencySample', l, j));
        this.fallbackEngine.on('result', (r) => this.emitter.emit('result', r));
        this.fallbackEngine.on('error', (e) => this.emitter.emit('error', e));
        this.fallbackEngine.on('aborted', () => this.emitter.emit('aborted'));
      }
      return this.fallbackEngine.start(opts);
    }

    this._isRunning = true;
    this._phase = 'locating';
    this.emitter.emit('phase', 'locating', 0.1);

    return new Promise<TestResult>((resolve, reject) => {
      const unsubResult = this.emitter.on('result', (res) => {
        unsubResult();
        unsubError();
        resolve(res);
      });

      const unsubError = this.emitter.on('error', (err: SpeedTestError) => {
        unsubResult();
        unsubError();
        reject(err);
      });

      this.worker!.postMessage({ type: 'START', options: opts });
    });
  }

  abort(): void {
    if (this.fallbackEngine) {
      this.fallbackEngine.abort();
      return;
    }

    if (this.worker && this._isRunning) {
      this.worker.postMessage({ type: 'ABORT' });
    }
    this._isRunning = false;
    this._phase = 'aborted';
    this.emitter.emit('aborted');
  }

  dispose(): void {
    this.abort();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    if (this.fallbackEngine) {
      this.fallbackEngine.dispose();
      this.fallbackEngine = null;
    }
    this.emitter.removeAllListeners();
  }
}

export const defaultEngine = new WorkerSpeedEngineClient();
