# Study 01 — Requirements Analysis & Feasibility

## 1. Request summary

Build a web app, with **no backend server**, that tests internet **download and upload** speed with **accurate, reliable, non-fake** results. Requirements:

- Free hosting on Vercel
- Modern, distinctive, eye-catching UI
- Dark and light themes, Arabic and English, preferences saved
- Theme switch and language switch buttons in the top bar
- Deliverables: study files, PRD, five phase plans

## 2. The central tension: "no backend" vs "accurate speed test"

A speed test measures the path between the user and a **test server**. Without any server, nothing can be measured; a pure client-side "test" would have to fake numbers. So the honest interpretation is:

> **We run no server of our own. The browser talks directly to existing, public, purpose-built measurement endpoints.**

| Option | Verdict |
|--------|---------|
| Own backend on Vercel Functions | Rejected: breaks "no backend", 4.5 MB body limit, runs in few regions, burns free bandwidth, measures the wrong path |
| Static big files hosted on Vercel | Rejected: Hobby bandwidth cap (~100 GB/mo), tests would exhaust it in hundreds of runs; also measures Vercel's CDN only |
| Download-only from a public CDN file | Rejected: no upload, no control over headers/CORS |
| **Cloudflare public speed endpoints** | **Chosen (primary):** global anycast edge, CORS-enabled, supports download and upload, used by Cloudflare's own tool and open-source client |
| **M-Lab NDT7** | **Chosen (alternate):** open-source, peer-reviewed methodology, locate API picks a nearby server, WebSocket-based with live progress |
| **Cloudflare Workers (emergency fallback)** | **Reserve option:** if both primary endpoints fail, a minimal Cloudflare Worker (free tier: 100K req/day) can serve as a self-controlled download/upload endpoint |
| Fabricated/random results | **Forbidden** |

**Risk:** third-party endpoints are **not officially documented APIs** — they can change or rate-limit without notice. This is the project's single biggest risk. Mitigation: engine adapter interface, three-tier fallback (Cloudflare → NDT7 → self-hosted Worker), automated health monitoring (P0), graceful errors (see Phase 2 and 4).

## 3. Functional requirements (summary)

1. Run a full test with one click: latency, jitter, download, upload.
2. Show live progress and a live speed gauge.
3. Show final results with units (Mbps default, option for MB/s), server location, and test time.
4. Cancel and re-run a test.
5. Keep local history (device only) with a trend chart; clear history.
6. Theme switch (light/dark, plus "system" on first visit) and language switch (AR/EN) in the top bar.
7. Persist theme, language, units, selected engine across visits.
8. Share results as an image or copied text (client-side only).
9. Clear error states: offline, blocked endpoint, aborted test, unsupported browser.

## 4. Non-functional requirements (summary)

| Area | Target |
|------|--------|
| Accuracy | Within about ±5–10% of reference tools under the same conditions on stable links (validated in Phase 2) |
| Honesty | No `Math.random()` or hard-coded results in measurement code; automated check enforces this |
| Performance | Initial JS ≤ 120 KB gzip, LCP < 1.8 s on 4G mid-range phone, no layout shift on theme/language load |
| Accessibility | WCAG 2.2 AA, full keyboard use, screen-reader announcements for progress/results, reduced-motion support |
| i18n | Full RTL mirroring, Arabic typography, locale-aware number/date formatting |
| Privacy | No accounts, no cookies, no server-side storage; local data only; transparent disclosure of third-party endpoints |
| Security | Strict CSP, no inline scripts except hashed theme bootstrap, dependency auditing |
| Compatibility | Last 2 versions of Chrome, Edge, Firefox, Safari (iOS 16+), Samsung Internet |

## 5. Constraints

- **Vercel Hobby:** free for personal, non-commercial use; function and bandwidth limits apply. Review current terms before launch. If the app becomes commercial, move to a paid plan or another static host.
- **Browser limits:** HTTP/1.1 caps about 6 connections per host; browsers throttle background tabs; CPU and Wi-Fi of the device can bottleneck results; very high-speed lines (multi-Gbps) may be underreported by any browser test.
- **CORS:** endpoints must send permissive CORS headers and, ideally, `Timing-Allow-Origin` for precise Resource Timing data.
- **Third-party terms:** read Cloudflare and M-Lab usage terms/privacy policies during Phase 1 and show attribution in the footer.
- **Restricted networks:** corporate firewalls, captive portals (hotels/airports), and DNS-level blocking in some regions may prevent access to test endpoints. The app must detect these scenarios (captive portal redirect detection, response content verification) and show specific guidance.
- **Data usage:** a full test must not exceed ~50 MB on normal mode and ~10 MB on light mode. Adaptive sizing must reduce payloads on slow links. Show a clear data-usage estimate before starting, especially on metered connections.

## 6. Stakeholders and users

- **Primary:** everyday home users checking ISP speed (Arabic and English speakers).
- **Secondary:** gamers/remote workers needing latency and jitter; support technicians asking users for a screenshot.
- **Owner:** you, running a free personal project.

## 7. Risk register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|-----------|--------|------------|
| R1 | Endpoint changes or blocks our origin | **High** | **Critical** | Adapter pattern, three-tier fallback (Cloudflare → NDT7 → self-hosted Worker), **P0 automated health monitoring** (daily CI + runtime pre-test check), clear error UI with engine-switch suggestion |
| R2 | Results differ from user's expectation (vs Ookla/fast.com) | High | Medium | Methodology page, "why results differ" explainer, show server and connection count |
| R3 | Upload overestimation from socket buffering | Medium | High | Warm-up discard, server-timing where available, cross-check in Phase 2 |
| R4 | Safari/iOS quirks (streaming uploads, throttling) | Medium | Medium | XHR-based upload fallback, device lab testing |
| R5 | Vercel Hobby limits reached | Low | Low | App is static; test traffic bypasses Vercel |
| R6 | RTL layout bugs | Medium | Medium | Logical CSS properties only, RTL screenshot tests |
| R7 | Large payloads on metered mobile data | Medium | Medium | Data-usage estimate before test, "light mode" with capped bytes (≤10 MB), cellular warning where `navigator.connection` allows |
| R8 | Privacy concerns about IP/ISP display | Low | Medium | Show only data the endpoint returns, no logging, opt-out toggle |
| R9 | Captive portals / restricted networks give false results | Medium | High | Pre-flight response verification (check content-type and body), captive portal detection, specific error messages |
| R10 | Abuse / rapid repeated tests trigger provider rate limits | Medium | High | **P0 client-side rate limiting** (30s cooldown between tests, max 20 tests/hour), exponential backoff on 429 responses |
| R11 | localStorage schema migration on app updates | Medium | Medium | Versioned storage keys, explicit migration functions tested in CI, fallback to defaults on corrupt data |

## 8. Success criteria

1. A user can complete a test in under 40 seconds with live feedback.
2. Benchmark harness shows our results track reference tools within target tolerance.
3. Lighthouse ≥ 95 (Performance, Accessibility, Best Practices, SEO) on mobile.
4. Theme and language persist across reloads with zero flash of wrong theme/direction.
5. Deployed on Vercel free tier with automatic previews on every push.
