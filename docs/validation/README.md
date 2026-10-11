# Measurement Engine Validation Report & Accuracy Protocol

| Field | Value |
|---|---|
| Milestone | M2 (Phase 2 Delivery) |
| Standards | RFC 3550 (Jitter), Decimal Megabits (10^6 bits/s), NFR-01 (±8% Target) |
| Verification Engine | `CoreSpeedEngine` + `WorkerSpeedEngineClient` |

---

## 1. Methodology Summary

YamkSpeed is engineered with a strict **"No Fake Numbers"** charter.
- **Timing & Timestamps**: Timed via `performance.now()` with sub-millisecond precision.
- **Warm-Up Discard**: The initial ~2.0 seconds of TCP slow-start and TLS handshakes are discarded from post-warmup throughput calculations.
- **Sampling Window**: Instantaneous throughput is calculated over sliding 250 ms buckets (≥ 4 Hz update rate).
- **Trimmed Statistics**: The final bandwidth estimate is derived from a composite average of the 90th percentile and 10% trimmed mean of post-warmup buckets.
- **Upload Truthfulness**: Measured using `XMLHttpRequest.upload.onprogress` with preallocated binary buffers (`crypto.getRandomValues`) to prevent compression skew.
- **Idle Latency**: Measured before payload transfers via 20 ping probes with the single worst outlier discarded; jitter is calculated as the mean absolute difference between consecutive pings ($\frac{1}{N-1} \sum |s_{i+1} - s_i|$).

---

## 2. Validation Matrix & Pass Criteria

| Test Category | Methodology | Pass Criteria | Validation Status |
|---|---|---|---|
| **Controlled Throttle** | Chrome Network Throttler & shaped profiles (5, 25, 100 Mbps) | Reported value within ±8% of shaped rate | ✅ Passed |
| **Idle Latency** | Compared against ICMP ping to nearest Cloudflare PoP | Within ±5 ms | ✅ Passed |
| **Jitter Calculation** | RFC 3550 formula over 20 probe samples | Verified mathematically | ✅ Passed |
| **Data Usage Caps** | Strict byte counter in download & upload streams | Normal: ≤50 MB, Light: ≤10 MB | ✅ Passed |
| **Failure Injection** | Offline detection, captive portal HTML response | Immediate failure state, 0 fake numbers | ✅ Passed |
| **Rate Limiter Mutex** | Cooldown 30s, max 20 tests/hr, multi-tab lock | Second tab blocked during test | ✅ Passed |

---

## 3. Dev Harness Instructions

The engine includes a dedicated interactive diagnostic harness at `/` (switch via the **Harness** button in the top bar):
- Allows running both **Normal Mode** (≤50 MB) and **Light Mode** (≤10 MB).
- Displays live telemetry at ≥ 4 Hz: Phase, Instantaneous Throughput, Live Latency, and Jitter.
- Exports complete test session logs to **CSV** format (`StartedAt, Engine, Server, Latency, Jitter, Download, Upload, Bytes, Quality`).
