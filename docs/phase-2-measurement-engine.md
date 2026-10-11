# Phase 2 — Measurement Engine & Accuracy Validation

**Duration:** ~2 weeks  **Milestone:** M2  **Depends on:** Phase 1 spike

## Objectives
1. Framework-free `SpeedEngine` with latency, jitter, download, upload.
2. Live samples at ≥ 4 Hz for the gauge.
3. Prove accuracy with a documented validation campaign.
4. Enforce the "non-fake" guarantee in code and CI.

## Deliverables
- `src/engine/*` with unit tests and a dev harness page (`/dev/engine`, excluded from production build)
- Validation report in `docs/validation/` meeting NFR-01
- Methodology text finalized for the UI

## Stage 2.1 — Engine skeleton (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P2-01 | Define types and `SpeedEngine` interface (Study 03 §7 — typed events, Promise return, dispose), typed event emitter | P0 | 5h |
| P2-02 | Orchestrator state machine: idle → locating → latency → download → upload → done/error/aborted | P0 | 6h |
| P2-03 | `AbortController` plumbing; guarantee all fetch/XHR/WebSocket close on abort within 300 ms | P0 | 4h |
| P2-04 | Clock utilities (`performance.now`), sliding-window bucket aggregator (250 ms), unit tested with synthetic byte streams | P0 | 5h |
| P2-05 | Statistics module: median, trimmed mean, percentile, jitter, coefficient of variation | P0 | 4h |
| P2-05b | Pre-flight network check module: captive portal detection (verify response content-type/body), endpoint health, 429 handling | P0 | 4h |
| P2-05c | Rate limiter integration: enforce 30s cooldown and 20 tests/hour from Phase 1 module; prevent concurrent tests across tabs via `BroadcastChannel` or `storage` event lock | P0 | 3h |

## Stage 2.2 — Cloudflare engine (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P2-06 | Locate/meta fetch: colo, city, country, client IP/ISP (optional, privacy toggle) | P0 | 4h |
| P2-07 | Latency module: 20 tiny requests, cache-busted, Resource Timing where allowed, discard worst, median + jitter | P0 | 6h |
| P2-08 | Download module: parallel streams with `fetch` + `ReadableStream` reader counting bytes; progressive sizes; adaptive stream count (4–8); time-boxed 8–12 s; data usage cap ≤50 MB normal / ≤10 MB light | P0 | 16h |
| P2-09 | Warm-up discard and final statistic (trimmed/percentile) as documented | P0 | 5h |
| P2-10 | Upload module: XHR POST with `upload.onprogress`, progressive payloads from preallocated random buffer (generated once with `crypto.getRandomValues`), parallel streams; data usage cap | P0 | 16h |
| P2-11 | Upload truthfulness: prefer completed-request timing and server timing header if present; compare vs progress-based value | P0 | 6h |
| P2-12 | Byte verification: assert received bytes equal expected; mark phase invalid otherwise | P0 | 3h |
| P2-13 | Quality gating: variance threshold, hidden-tab detection via `visibilitychange` | P1 | 4h |
| P2-14 | Loaded latency probes during download/upload (bufferbloat) | P1 | 6h |
| P2-15 | Move heavy loops into a Web Worker with main-thread fallback (graceful degradation per Study 02) | P1 | 8h |

## Stage 2.3 — Honesty enforcement (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P2-16 | CI check failing on `Math.random` or literal result numbers in `src/engine/**` | P0 | 1.5h |
| P2-17 | Mock engine only under `MODE === 'test'`; verify production bundle excludes it (bundle analysis test) | P0 | 2h |
| P2-18 | Unit tests: engine returns error (not numbers) when network fails at each phase | P0 | 4h |

## Stage 2.4 — NDT7 engine (P1, can slip to Phase 4)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P2-19 | Locate API + WebSocket client implementing the same interface | P1 | 8h |
| P2-20 | Map NDT7 measurement messages to `SpeedSample`; consent gate | P1 | 4h |

## Stage 2.5 — Validation campaign (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P2-21 | Build dev harness: run N tests, export CSV (timestamp, browser, results, references, data usage) | P0 | 5h |
| P2-22 | Controlled throttle tests (5/25/100/500 Mbps) | P0 | 8h |
| P2-23 | Reference comparisons: 10 runs each vs `@cloudflare/speedtest`, fast.com, Ookla, `iperf3` if available | P0 | 8h |
| P2-24 | Browser matrix: Chrome, Firefox, Safari mac/iOS, Edge, Android Chrome | P0 | 8h |
| P2-25 | Failure-injection (offline, blocked, captive portal, rate-limited) and 30-run soak (memory, sockets) | P0 | 6h |
| P2-26 | Tune constants (warm-up length, streams, durations, statistic, data caps) based on data; record changes | P0 | 8h |
| P2-27 | Verify data usage: measure actual bytes transferred per test at various speeds; confirm ≤50 MB normal / ≤10 MB light | P0 | 3h |
| P2-28 | Write validation report; decide per ADR-003 whether custom engine passes or fallback to `@cloudflare/speedtest` | P0 | 4h |

## Testing in this phase
- Unit: aggregator, statistics, state machine, abort.
- Integration: local mock HTTP server with fixed throttled throughput verifying the engine's math (dev-only, never shipped).
- Manual and spreadsheet-based validation (Stage 2.5).

## Definition of Done
- [ ] Engine produces download, upload, latency, jitter from real transfers
- [ ] Controlled-throttle error ≤ ±8%; reference median ≤ ±10%
- [ ] Abort closes all connections within 300 ms
- [ ] No fabricated values; CI rule active
- [ ] Validation report committed and ADR-003 resolved
- [ ] Sample stream emits at ≥ 4 Hz

## Risks
| Risk | Mitigation |
|------|-----------|
| Custom engine fails validation | Fallback: wrap `@cloudflare/speedtest` behind the same interface; keep custom live-sample layer if feasible |
| Safari upload quirks | XHR-only upload path, test early on real iOS device |
| Test-server rate limiting | Backoff, cap runs per minute, informative error |
| Main thread jank affecting numbers | Worker offload (P2-15), throttle UI updates to 10 Hz |
