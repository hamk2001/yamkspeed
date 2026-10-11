# Product Requirements Document — Nabd Speed (نبض)

| Field | Value |
|-------|-------|
| Version | 1.0 (draft for approval) |
| Type | Static single-page web app (no owned backend) |
| Hosting | Vercel Hobby (free) |
| Languages | English (LTR), Arabic (RTL) |
| Themes | Light, Dark |

## 1. Vision & problem

People can't easily verify whether their connection delivers what they pay for. Many speed tests are cluttered with ads, collect data, or give inconsistent numbers. **Nabd Speed** offers a fast, clean, ad-free, bilingual speed test with honest methodology, running entirely in the browser against public measurement servers.

## 2. Goals and non-goals

**Goals**
- G1: Accurate, reproducible download/upload/latency/jitter measurement.
- G2: Distinctive modern UI with light/dark themes and Arabic/English support.
- G3: Zero backend, zero accounts, zero ads, zero tracking by default.
- G4: Free to host and run indefinitely.

**Non-goals (v1)**
- User accounts, cloud history, ISP leaderboards, maps of coverage.
- Server-side result storage or public result URLs.
- Native apps.
- Guaranteeing identical numbers to other tools.
- Packet-loss measurement (requires TURN infrastructure) — deferred.

## 3. Personas

| Persona | Need |
|---------|------|
| Layla, home user (Arabic) | Check if ISP delivers advertised speed, simple UI in Arabic |
| Omar, remote worker (bilingual) | Latency/jitter for calls, keep history to show ISP |
| Sam, gamer (English) | Ping and loaded latency, quick re-test |
| Tech support agent | Ask customers for a screenshot with clear server and time info |

## 4. User stories

1. As a user, I press one button and see my download, upload and latency with live progress.
2. As a user, I can cancel a running test.
3. As a user, I switch between light and dark themes from the top bar and my choice is remembered.
4. As a user, I switch between Arabic and English from the top bar, the layout flips correctly, and my choice is remembered.
5. As a user, I see where the test server is and which engine was used.
6. As a user, I review my past results and a trend chart, and can delete them.
7. As a user, I share or save my result as an image.
8. As a user on mobile data, I can run a lighter test and see an estimate of data used.
9. As a user, I understand why numbers may differ from other tools.
10. As a user with a screen reader or keyboard only, I can run a test and hear results.

## 5. Functional requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | One-click test sequence: locate → latency → download → upload → summary | P0 |
| FR-02 | Real-time gauge updates at ≥ 4 Hz from measured samples | P0 |
| FR-03 | Show download and upload (Mbps), latency and jitter (ms) | P0 |
| FR-04 | Abort button; clean cancellation of all connections | P0 |
| FR-05 | Top bar with theme toggle and language toggle | P0 |
| FR-06 | Persist theme and language; apply before first paint | P0 |
| FR-07 | Full RTL layout for Arabic with Arabic typography | P0 |
| FR-08 | Error states: offline, endpoint unreachable, blocked, captive portal, aborted, unsupported, rate-limited | P0 |
| FR-09 | Results card includes server location, engine, streams, bytes, duration, timestamp | P0 |
| FR-10 | Engine abstraction with Cloudflare primary engine | P0 |
| FR-11 | Alternate NDT7 engine selectable in Settings with consent notice | P1 |
| FR-12 | Local history (last 100), list + trend chart, clear/delete | P1 |
| FR-13 | Units toggle Mbps / MB/s | P1 |
| FR-14 | Light test mode (reduced data ≤10 MB) and data-usage estimate (normal ≤50 MB) | P1 |
| FR-15 | Share: copy text, download PNG card (html2canvas or dom-to-image for Arabic text support, client-side) | P1 |
| FR-16 | Loaded latency (bufferbloat grade A–F) | P1 |
| FR-17 | "How we measure" page/modal and limitations | P1 |
| FR-18 | Result quality flag (stable / unstable) with retry hint | P1 |
| FR-19 | Installable PWA with offline shell (test disabled offline) | P2 |
| FR-20 | Arabic-Indic digits option | P2 |
| FR-21 | "System" theme option | P2 |
| FR-22 | Export/import history as JSON | P2 |
| FR-23 | Keyboard shortcut (Space/Enter to start, Esc to abort) | P2 |
| FR-24 | Client-side rate limiting: 30s cooldown between tests, max 20 tests/hour | **P0** |
| FR-25 | Pre-flight network check with captive portal detection before starting test | **P0** |
| FR-26 | Opt-in anonymous error reporting ("Help improve Nabd" toggle, default off) | P2 |

## 6. Non-functional requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Accuracy vs reference | Median within ±10% (±8% under controlled throttle) |
| NFR-02 | No fabricated values | CI-enforced; code review checklist |
| NFR-03 | Initial JS | ≤ 120 KB gzip; total CSS ≤ 25 KB gzip |
| NFR-04 | Lighthouse (mobile) | ≥ 95 in all four categories |
| NFR-05 | LCP / CLS / INP | < 1.8 s / < 0.05 / < 150 ms |
| NFR-06 | Accessibility | WCAG 2.2 AA, axe zero critical/serious |
| NFR-07 | Browser support | Latest 2 versions of major browsers, iOS 16+ |
| NFR-08 | Security | CSP enforced; no inline script other than hashed bootstrap; zero high vulnerabilities |
| NFR-09 | Privacy | No cookies, no analytics by default; local storage only |
| NFR-10 | Reliability | Test succeeds in ≥ 98% of runs on healthy connections in matrix |
| NFR-11 | Memory | No growth above 20 MB over 30 runs |
| NFR-12 | Availability | Static hosting; engine health check with graceful degradation |

## 7. Measurement specification

Defined in `03-study-measurement-methodology.md`. Binding points:
- Decimal Mbps; warm-up discarded; trimmed/percentile statistic; 4–8 adaptive streams; time-boxed phases; no cache; quality flag.
- Public result fields listed in FR-09.
- Honesty rules are acceptance criteria, not guidelines.

## 8. UX / UI specification

Defined in `04-study-design-i18n-theming.md`. Key screens:

1. **Home / Test** — top bar, hero gauge + start orb, live trace, bento results, footer (attribution, privacy, methodology).
2. **Running state** — phase label ("Testing download…"), cancel button, aurora hue shift.
3. **Result state** — big numbers, quality badge, share and re-test buttons.
4. **History** — table/cards, trend chart, delete/clear.
5. **Settings (dialog)** — units, engine, light mode, digits, privacy toggles.
6. **How we measure** — methodology explainer.
7. **Error states** — friendly message, cause hints, retry.

Top bar: logo (start), language switch, theme switch, menu (end). Both switches visible on all viewport sizes.

## 9. Data, privacy and legal

- Stored locally only: preferences and history.
- Third-party requests: Cloudflare (and M-Lab if chosen). The footer and "How we measure" disclose this and link to their policies. NDT7 requires explicit acknowledgement that M-Lab publishes measurement data.
- No analytics by default; if Vercel Web Analytics is added later, disclose and keep cookieless.
- Vercel Hobby is for personal non-commercial use; do not add ads or sell services without moving plans.
- Provide MIT (or chosen) license and third-party notices.

## 10. Technical architecture (summary)

```
Browser (static assets from Vercel CDN)
 ├─ React UI (Zustand store, i18n, theme)
 ├─ SpeedEngine interface
 │    ├─ CloudflareEngine (fetch streams + XHR upload, Worker)
 │    └─ Ndt7Engine (WebSocket)
 └─ localStorage (prefs, history)
Test traffic: Browser ⇄ Cloudflare edge / M-Lab server   (never via Vercel)
```

## 11. Success metrics

- Validation harness passes NFR-01.
- Lighthouse ≥ 95 mobile.
- 0 critical a11y issues.
- ≥ 90% of test users in usability check complete a test unaided (5-person informal test, AR and EN).

## 12. Release plan

| Milestone | Content | Phase |
|-----------|---------|-------|
| M1 | Skeleton deployed on Vercel, theme + language switch working | 1 |
| M2 | Engine validated against references | 2 |
| M3 | Complete UI, all P0 requirements | 3 |
| M4 | P1 features, resilience, PWA | 4 |
| M5 | v1.0 public launch | 5 |

## 13. Assumptions, dependencies, open questions

**Assumptions:** Cloudflare endpoints remain public and CORS-enabled; project is personal and non-commercial.
**Dependencies:** Cloudflare speed endpoints, M-Lab locate API, Vercel, GitHub.

**Resolved decisions (previously open):**

| # | Question | Decision | Rationale |
|---|----------|----------|----------|
| 1 | Product name and domain | **Nabd Speed (نبض سبيد)** | Final name; domain TBD but reserve `nabdspeed.com` or use `nabd-speed.vercel.app` initially |
| 2 | NDT7 in v1.0 or v1.1? | **v1.0 as P1** | Include in Phase 4 if schedule allows; defer to v1.1 if phase slips |
| 3 | Default numerals in Arabic | **Latin digits (0–9)** | Consistent with network tools worldwide; Arabic-Indic digits (٠–٩) available as P2 option |
| 4 | Data usage per test | **≤50 MB normal, ≤10 MB light** | 150 MB was too high for metered connections; adaptive sizing caps early |
| 5 | License | **MIT** | Standard permissive license for open-source tools; add third-party notices file |

## 14. Acceptance checklist for v1.0

- [ ] All P0 requirements implemented and tested (including FR-24 rate limiting, FR-25 pre-flight check)
- [ ] Validation report meets NFR-01
- [ ] No `Math.random` in engine (CI)
- [ ] RTL and LTR screenshots reviewed on 3 viewports each
- [ ] Theme/language persist with no flash
- [ ] Lighthouse and axe targets met
- [ ] CSP active, no console errors
- [ ] README, methodology page, privacy note published
- [ ] Rate limiting enforced (30s cooldown, 20 tests/hour)
- [ ] Pre-flight captive portal detection working
- [ ] Data usage within targets (≤50 MB normal, ≤10 MB light)
- [ ] localStorage migration tested with CI fixtures
- [ ] Share card renders correctly in Arabic (verified on iOS Safari and Android Chrome)
