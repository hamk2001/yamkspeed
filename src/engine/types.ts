export type Phase =
  | 'idle'
  | 'locating'
  | 'latency'
  | 'download'
  | 'upload'
  | 'done'
  | 'error'
  | 'aborted';

export interface SpeedSample {
  t: number; // performance.now() timestamp
  mbps: number;
  phase: 'download' | 'upload';
  warmup: boolean;
  bytesTransferred: number;
  instantaneousMbps?: number;
}

export type ErrorCode =
  | 'OFFLINE'
  | 'ENDPOINT_UNREACHABLE'
  | 'BLOCKED'
  | 'CAPTIVE_PORTAL'
  | 'RATE_LIMITED'
  | 'ABORTED'
  | 'UNSUPPORTED'
  | 'UNKNOWN';

export interface SpeedTestError {
  code: ErrorCode;
  message: string;
  phase: Phase;
  retryable: boolean;
}

export interface ServerInfo {
  city?: string;
  country?: string;
  colo?: string;
  id?: string;
  ip?: string;
  asn?: number;
  asOrganization?: string;
}

export interface TestResult {
  engine: 'cloudflare' | 'ndt7' | 'worker-fallback';
  startedAt: string; // ISO format
  server: ServerInfo;
  latencyMs: number;
  jitterMs: number;
  downloadMbps: number;
  uploadMbps: number;
  loadedLatencyMs?: {
    down?: number;
    up?: number;
  };
  bytes: {
    down: number;
    up: number;
  };
  streams: {
    down: number;
    up: number;
  };
  durationMs: number;
  quality: 'stable' | 'unstable';
}

export interface EngineEventMap {
  phase: (phase: Phase, progress: number) => void;
  sample: (sample: SpeedSample) => void;
  latencySample: (latencyMs: number, jitterMs: number) => void;
  result: (result: TestResult) => void;
  error: (error: SpeedTestError) => void;
  aborted: () => void;
}

export interface SpeedTestOptions {
  light?: boolean; // reduced data mode (≤10 MB)
  signal?: AbortSignal;
}

export interface SpeedEngine {
  /** Start a test. Resolves with TestResult or throws SpeedTestError. */
  start(opts?: SpeedTestOptions): Promise<TestResult>;
  /** Type-safe event subscription. Returns an unsubscribe function. */
  on<E extends keyof EngineEventMap>(event: E, cb: EngineEventMap[E]): () => void;
  /** Abort a running test within 300ms. */
  abort(): void;
  /** Clean up all resources, listeners, connections, and worker threads. */
  dispose(): void;
  /** Current phase (readonly). */
  readonly phase: Phase;
  /** Whether a test is currently running (readonly). */
  readonly isRunning: boolean;
}
