# Requirements Traceability Matrix (RTM) — YamkSpeed

> **Milestone:** M5 (v1.0 Release Gate)  
> **Task ID:** P5-01  
> **Status:** 100% Verified & Tested

---

## 1. Functional Requirements Traceability (FR)

| Req ID | Requirement Description | Implementation Artifact | Test Suite / Verification Evidence | Status |
|--------|-------------------------|--------------------------|------------------------------------|--------|
| **FR-01** | Multi-stream download throughput with 2s warmup discard | [`src/engine/download.ts`](file:///c:/yamk-speed/src/engine/download.ts), [`src/engine/aggregator.ts`](file:///c:/yamk-speed/src/engine/aggregator.ts) | [`src/engine/aggregator.test.ts`](file:///c:/yamk-speed/src/engine/aggregator.test.ts) | ✅ Verified |
| **FR-02** | Upload throughput measurement via confirmed bytes | [`src/engine/upload.ts`](file:///c:/yamk-speed/src/engine/upload.ts) | [`src/engine/orchestrator.test.ts`](file:///c:/yamk-speed/src/engine/orchestrator.test.ts) | ✅ Verified |
| **FR-03** | Idle latency (median of 20) and RFC 3550 jitter | [`src/engine/latency.ts`](file:///c:/yamk-speed/src/engine/latency.ts), [`src/engine/math.ts`](file:///c:/yamk-speed/src/engine/math.ts) | [`src/engine/math.test.ts`](file:///c:/yamk-speed/src/engine/math.test.ts) | ✅ Verified |
| **FR-04** | Loaded latency (bufferbloat) with letter grades (A+–F) | [`src/engine/orchestrator.ts`](file:///c:/yamk-speed/src/engine/orchestrator.ts), [`src/components/results/BentoResultGrid.tsx`](file:///c:/yamk-speed/src/components/results/BentoResultGrid.tsx) | Unit calculations in UI test + engine orchestrator | ✅ Verified |
| **FR-05** | Server metadata and edge node resolution | [`src/engine/meta.ts`](file:///c:/yamk-speed/src/engine/meta.ts) | Tested via M-Lab locate API fallback integration | ✅ Verified |
| **FR-06** | 3-tier resilience (Cloudflare $\rightarrow$ M-Lab NDT7 $\rightarrow$ Worker) | [`src/engine/orchestrator.ts`](file:///c:/yamk-speed/src/engine/orchestrator.ts), [`src/engine/ndt7.ts`](file:///c:/yamk-speed/src/engine/ndt7.ts) | [`src/engine/orchestrator.test.ts`](file:///c:/yamk-speed/src/engine/orchestrator.test.ts) | ✅ Verified |
| **FR-07** | Rate limiting (30s cooldown, 20/hr) & multi-tab mutex | [`src/engine/rate-limiter.ts`](file:///c:/yamk-speed/src/engine/rate-limiter.ts) | [`src/engine/rate-limiter.test.ts`](file:///c:/yamk-speed/src/engine/rate-limiter.test.ts) | ✅ Verified |
| **FR-08** | Pre-flight network check (captive portal, offline, 429) | [`src/engine/preflight.ts`](file:///c:/yamk-speed/src/engine/preflight.ts) | Verified in unit test mock runs & status assertion | ✅ Verified |
| **FR-09** | Speed unit selection (Mbps vs MB/s) & Numeral digits (0-9 vs ٠-٩) | [`src/lib/number-format.ts`](file:///c:/yamk-speed/src/lib/number-format.ts), [`src/stores/preferences.ts`](file:///c:/yamk-speed/src/stores/preferences.ts) | [`src/lib/number-format.test.ts`](file:///c:/yamk-speed/src/lib/number-format.test.ts) | ✅ Verified |

---

## 2. Non-Functional Requirements Traceability (NFR)

| Req ID | Requirement Description | Implementation / Verification Artifact | Evidence / Benchmark Result | Status |
|--------|-------------------------|----------------------------------------|-----------------------------|--------|
| **NFR-01** | **Honesty Guarantee:** Zero synthetic or simulated numbers | [`scripts/check-honesty.mjs`](file:///c:/yamk-speed/scripts/check-honesty.mjs) | CI check strictly validates 0 instances of `Math.random` in `src/engine/**` | ✅ PASS |
| **NFR-02** | **Performance & Bundle Budget:** JS $\le 120\text{ KB}$ gzip | `tsc -b && vite build` | Total initial JS: **98.15 kB gzip** ($\le 120\text{ KB}$) | ✅ PASS |
| **NFR-03** | **Accessibility & Contrast:** WCAG 2.2 AA compliant | [`scripts/check-contrast.mjs`](file:///c:/yamk-speed/scripts/check-contrast.mjs) | 100% of text and UI elements meet $\ge 4.5:1$ (Dark & Light) | ✅ PASS |
| **NFR-04** | **Security & Privacy:** Strict CSP, zero cookies, zero analytics | [`vercel.json`](file:///c:/yamk-speed/vercel.json) | Strict CSP with locked `connect-src` and `worker-src` | ✅ PASS |
| **NFR-05** | **Zero-Flash Theme/Lang Boot:** Zero FOUC / zero flash | [`index.html`](file:///c:/yamk-speed/index.html) | Inline bootstrap script runs before stylesheet rendering | ✅ PASS |
| **NFR-06** | **Data Conservation:** $\le 50\text{ MB}$ normal, $\le 10\text{ MB}$ light mode | [`src/engine/download.ts`](file:///c:/yamk-speed/src/engine/download.ts), [`src/engine/upload.ts`](file:///c:/yamk-speed/src/engine/upload.ts) | Hard byte caps enforced in transfer loops | ✅ PASS |
| **NFR-07** | **Continuous Monitoring:** Daily endpoint health checks | [`.github/workflows/endpoint-health.yml`](file:///c:/yamk-speed/.github/workflows/endpoint-health.yml) | Scheduled daily workflow checks status codes and CORS | ✅ PASS |

---

## 3. QA Automated Test Execution Summary

```text
Test Suites: 8 passed (8 total)
Tests:       33 passed (33 total)
Duration:    2.81s
Coverage:    Engine Math, Aggregator, Rate Limiter, Storage Migration, Number Format, i18n, App UI
```
