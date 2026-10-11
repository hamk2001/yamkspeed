# Study 03 — Measurement Methodology (Accuracy & Honesty)

> Goal: produce numbers a user can trust, and be transparent about what they mean. Endpoint behavior below must be **verified in a Phase 1 spike** (headers, CORS, limits) because third parties can change it.

## 1. What is being measured

| Metric | Definition | Unit |
|--------|-----------|------|
| Download throughput | Bits received per second from nearest edge over parallel streams, after warm-up | Mbps (10^6 bits/s) |
| Upload throughput | Bits the server confirmably receives per second | Mbps |
| Idle latency | Median RTT of small requests before load | ms |
| Jitter | Mean absolute difference between consecutive latency samples | ms |
| Loaded latency (P1) | Latency while downloading/uploading (bufferbloat indicator) | ms |
| Server/location | Edge city/colo and country, reported by endpoint metadata | text |

Use **decimal megabits** (1 Mbps = 1,000,000 bits/s) like ISPs. Offer MB/s (÷8) as a display option.

## 2. Reference endpoints (to verify in spike)

> **Important:** these endpoints are **not officially documented public APIs**. Their behavior, URLs, and CORS policies may change without notice. The spike must verify current behavior, and the engine must handle failures gracefully with fallback.

**Cloudflare (primary)**
- Download: `GET https://speed.cloudflare.com/__down?bytes=<N>`
- Upload: `POST https://speed.cloudflare.com/__up` with an N-byte body
- Metadata/location: `https://speed.cloudflare.com/meta` (client IP/ISP/colo info)
- Latency: tiny `__down?bytes=0` requests, timed with Resource Timing

**M-Lab NDT7 (alternate)**
- Locate API returns nearest servers and signed WebSocket URLs for download/upload.
- Server sends measurement messages (~every 250 ms), giving live progress.
- Data collected by M-Lab is published openly; show a consent/notice in UI before first NDT7 run.

**Self-hosted Cloudflare Worker (emergency reserve)**
- If both primary providers fail, a minimal Worker endpoint (~50 lines) can serve download/upload payloads from Cloudflare's edge (free tier: 100K requests/day).
- Prepared as a ready-to-deploy template in `infra/worker-fallback/`, tested in Phase 1 spike but only deployed if needed.

### Pre-flight network verification

Before starting any test, run a lightweight pre-flight check:
1. Fetch a small known payload from the primary endpoint.
2. Verify the response `Content-Type` and body content match expectations (not a captive portal redirect or block page).
3. Check for `429 Too Many Requests` or unexpected status codes.
4. If the check fails, show a specific error: "Network may be restricted (captive portal, firewall, or endpoint unavailable)."

## 3. Accuracy principles

1. **Warm-up:** TCP slow start and TLS handshakes depress early speed. Discard the first ~1.5–2 s (or the first portion of bytes) from the final calculation, but still show it live.
2. **Parallel streams:** 4–8 simultaneous connections; adaptive: add streams if throughput is still climbing.
3. **Time-boxed phases:** each direction runs ~8–12 s (light mode ~5 s) rather than fixed file size, so slow and fast links both get stable windows.
4. **Progressive sizing:** start with small objects, grow (100 KB → 1 MB → 10 MB → 25 MB+) so the test saturates the link without wasting data on slow lines.
5. **Sampling window:** compute instantaneous speed from sliding 250 ms buckets of **actual bytes received**; final result is a **trimmed statistic** over the post-warm-up window (e.g., 90th percentile of per-second throughput, or trimmed mean). Document and keep the formula in code and on a methodology page.
6. **Latency before load:** measure idle latency first (20 samples, discard worst outlier), then loaded latency during transfer.
7. **No cache effects:** unique query param per request, `cache: 'no-store'`, check `Cache-Control`; verify Content-Length/bytes received equals requested.
8. **Precise timers:** `performance.now()` for byte timing; `PerformanceResourceTiming` for per-request timing when `Timing-Allow-Origin` allows.
9. **Upload truthfulness:** XHR `upload.onprogress` measures bytes handed to the OS buffer and can overestimate early. Mitigate with warm-up discard, preferring completed-request timing, and server timing headers (e.g., `Server-Timing`) to subtract server processing. Cross-check in validation.
10. **Stability gating:** if variance is extreme (coefficient of variation above a threshold) or the tab was hidden, flag the result as "unstable" with a retry hint instead of presenting false precision.
11. **Data usage targets:** normal mode ≤ ~50 MB total (both directions), light mode ≤ ~10 MB. Adaptive sizing must stop growing payloads once sufficient samples are collected. Show estimated data usage before starting.

## 4. Honesty rules ("non-fake" guarantee)

- No random, interpolated, or placeholder values in engine code. A CI check fails on `Math.random` inside `src/engine/**` (except for cache-busting IDs, which must use `crypto.randomUUID`).
- Gauge shows only measured samples; during warm-up it shows measured data labeled "warming up".
- If a phase fails, show an error for that metric; never auto-fill from another run.
- Results screen lists: server location, number of streams, duration, bytes transferred, engine used, timestamp.
- A "How we measure" page documents the method and limits.
- Demo/mock engine exists **only** in test builds (`import.meta.env.MODE === 'test'`) and is tree-shaken from production.

## 5. Known limitations (display in UI)

- Result reflects: your device + Wi-Fi/router + ISP + path to the nearest test server.
- Browser tests may cap near multi-Gbps; wired + modern browser recommended for fast lines.
- Different tools use different servers and algorithms, so ±10–20% differences between tools are normal.
- VPNs, proxies, background downloads, power-saving modes, and hidden tabs affect results.

## 6. Validation plan (executed in Phase 2)

| Test | Method | Pass criteria |
|------|--------|---------------|
| Controlled throttle | Chrome DevTools network throttling and OS-level shaping (e.g., `tc`/Network Link Conditioner) at 5, 25, 100, 500 Mbps | Reported value within ±8% of shaped rate |
| Reference comparison | Back-to-back runs vs `@cloudflare/speedtest`, fast.com, Speedtest by Ookla, and `iperf3` where possible, 10 runs each | Median within ±10% of references; coefficient of variation below 8% on stable links |
| Latency | Compare to `ping` to same edge | Within ±5 ms |
| Upload check | Compare with server-confirmed bytes/time | Overestimate under 5% after warm-up |
| Browser matrix | Chrome, Firefox, Safari (macOS and iOS), Edge, Android Chrome | No metric missing; variance within 15% across browsers |
| Failure injection | Offline mid-test, blocked host, slow DNS, tab hidden | Clear error, no fake numbers, clean recovery |
| Soak | 30 consecutive runs | No memory growth above 20 MB, no leaked connections |

Record all runs in a spreadsheet kept in the repo under `docs/validation/`.

## 7. Engine interface (contract)

```ts
type Phase = 'idle' | 'locating' | 'latency' | 'download' | 'upload' | 'done' | 'error' | 'aborted';

interface SpeedSample {
  t: number;                    // performance.now() timestamp
  mbps: number;
  phase: 'download' | 'upload';
  warmup: boolean;
}

interface SpeedTestError {
  code: 'OFFLINE' | 'ENDPOINT_UNREACHABLE' | 'BLOCKED' | 'CAPTIVE_PORTAL'
      | 'RATE_LIMITED' | 'ABORTED' | 'UNSUPPORTED' | 'UNKNOWN';
  message: string;
  phase: Phase;
  retryable: boolean;
}

interface TestResult {
  engine: 'cloudflare' | 'ndt7';
  startedAt: string;            // ISO
  server: { city?: string; country?: string; id?: string };
  latencyMs: number; jitterMs: number;
  downloadMbps: number; uploadMbps: number;
  loadedLatencyMs?: { down?: number; up?: number };
  bytes: { down: number; up: number };
  streams: { down: number; up: number };
  durationMs: number;
  quality: 'stable' | 'unstable';
}

/** Typed event map — eliminates `any` and provides full IntelliSense. */
interface EngineEventMap {
  phase: (phase: Phase, progress: number) => void;
  sample: (sample: SpeedSample) => void;
  result: (result: TestResult) => void;
  error: (error: SpeedTestError) => void;
}

interface SpeedTestOptions {
  light?: boolean;              // reduced data mode (≤10 MB)
  signal: AbortSignal;
}

interface SpeedEngine {
  /** Start a test. Resolves when done; rejects on unrecoverable error. */
  start(opts: SpeedTestOptions): Promise<TestResult>;
  /** Type-safe event subscription. Returns an unsubscribe function. */
  on<E extends keyof EngineEventMap>(event: E, cb: EngineEventMap[E]): () => void;
  /** Abort a running test. All connections close within 300 ms. */
  abort(): void;
  /** Clean up all resources (listeners, buffers, workers). Call when unmounting. */
  dispose(): void;
  /** Current phase (readonly). */
  readonly phase: Phase;
  /** Whether a test is currently running (readonly). */
  readonly isRunning: boolean;
}
```

> **Design notes:**
> - `start()` returns a `Promise<TestResult>` so callers can `await` or use events — both patterns work.
> - Events are fully typed via `EngineEventMap` — no `any` leaks.
> - `SpeedTestError.code` enables the UI to show targeted error messages and recovery hints.
> - `dispose()` ensures no leaked Web Workers, event listeners, or open connections after the component unmounts.
