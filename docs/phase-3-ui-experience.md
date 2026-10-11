# Phase 3 — UI/UX: Gauge, Results, Motion & Responsive Polish

**Duration:** ~2 weeks  **Milestone:** M3  **Depends on:** Phase 1 (design system), Phase 2 (engine events; use the test-mode mock engine to develop in parallel)

## Objectives
1. Deliver the distinctive "Aurora Pulse" experience for the full test flow.
2. Connect UI to the real engine with live data.
3. Perfect RTL/LTR, light/dark, mobile/desktop.
4. Meet accessibility and performance budgets.

## Deliverables
- Complete Test screen (idle, running, result, error)
- Responsive layouts at 360/640/1024/1440 in both languages and themes
- Accessibility report and screenshots matrix

## Stage 3.1 — State integration (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P3-01 | `useSpeedTest` hook: subscribes to engine events, exposes phase, samples, result, error | P0 | 4h |
| P3-02 | Throttle UI sample updates to ~10 Hz; keep a bounded sample buffer (last 120) | P0 | 2h |
| P3-03 | Test controller store: start, abort, retry; prevents concurrent runs | P0 | 2h |

## Stage 3.2 — Hero gauge (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P3-04 | SVG gauge: 270° arc, ticks, auto-scaling max (e.g., 10/50/100/250/500/1000/…), glow stroke, comet tail | P0 | 16h |
| P3-05 | Animated center number (`tabular-nums`, `dir="ltr"`), unit label, phase label | P0 | 5h |
| P3-06 | rAF-based easing toward latest sample; reduced-motion variant (instant value changes, no comet/glow animation, but keep count-up with reduced duration) | P0 | 4h |
| P3-07 | Color/hue per phase using tokens (down cyan, up violet, latency amber) | P0 | 2h |
| P3-08 | Gauge text alternative and `aria-live="polite"` status (announce phase changes and final results, not every sample) | P0 | 3h |

## Stage 3.3 — Start orb & controls (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P3-09 | Start orb with breathing idle animation, ripple while running, converts to Cancel; rate-limit cooldown indicator (disabled state with countdown timer when in cooldown) | P0 | 6h |
| P3-10 | Keyboard: Enter/Space start, Esc abort; focus management after finish | P1 | 3h |

## Stage 3.4 — Live trace & results (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P3-11 | Sparkline SVG of live samples for current phase (always LTR time axis per Study 04 §4 chart direction decision) | P0 | 5h |
| P3-12 | Bento result grid: Download, Upload, Latency, Jitter, Server, Quality cards with count-up on completion | P0 | 10h |
| P3-13 | Results details: engine, streams, bytes, duration, timestamp, data used (collapsible) | P0 | 4h |
| P3-14 | Quality badge (stable/unstable) and retry hint | P1 | 3h |
| P3-15 | Bufferbloat grade card (A–F) if loaded latency available | P1 | 4h |
| P3-16 | Locale-aware formatting (numbers, dates, digits option wiring); BiDi isolation for mixed-direction values | P0 | 4h |

## Stage 3.5 — Errors, empty, edge states (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P3-17 | Error component per type: offline, endpoint unreachable, captive portal, blocked by network/extension, aborted, unsupported browser, rate-limited (with cooldown timer) | P0 | 6h |
| P3-18 | `online/offline` events: disable start, show banner | P0 | 2h |
| P3-19 | Data-usage notice before first run and in light mode; estimated bytes shown prominently | P1 | 3h |

## Stage 3.6 — Layout, top bar and content (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P3-20 | Page layouts mobile-first with responsive bento/gauge arrangement | P0 | 10h |
| P3-21 | Sticky glass top bar finalization (heights, blur fallback for low-end devices, focus rings, tooltips) | P0 | 4h |
| P3-22 | Footer: attribution to Cloudflare/M-Lab, privacy note, methodology link, version | P0 | 3h |
| P3-23 | Microcopy for all states in AR and EN, reviewed by a native Arabic speaker; BiDi edge cases verified | P0 | 10h |
| P3-24 | Aurora background hue shifts per phase (CSS variable transition) | P1 | 3h |

## Stage 3.7 — Polish & verification (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P3-25 | RTL visual QA: mirrored icons, spacing, truncation, BiDi isolation (`<bdi>`, `dir="ltr"` islands for IPs/URLs/server names), `unicode-bidi: isolate` verification | P0 | 6h |
| P3-26 | Light theme visual QA (contrast, shadows, glass fallbacks for devices without `backdrop-filter`) | P0 | 4h |
| P3-27 | Playwright screenshot matrix: {ar,en} × {light,dark} × {360,1024} for idle/running/result/error | P0 | 8h |
| P3-28 | Accessibility pass: axe, keyboard-only run, VoiceOver and TalkBack smoke | P0 | 6h |
| P3-29 | Performance pass: bundle check, lazy-load non-critical pieces, avoid layout shift | P0 | 5h |

## Testing in this phase
- Component tests for gauge scale logic, formatters, state transitions.
- E2E: full run against real endpoints (nightly, allowed to be flaky) and against mock engine (required in CI).
- Visual regression via Playwright snapshots.

## Definition of Done
- [ ] All P0 UI requirements (FR-01..FR-09) met with live engine data
- [ ] Both themes and both languages verified at 360 and 1024 px
- [ ] axe: zero critical/serious; keyboard-only completion possible
- [ ] Reduced-motion respected
- [ ] CLS < 0.05; initial JS ≤ 120 KB gzip
- [ ] Arabic copy reviewed by native speaker

## Risks
| Risk | Mitigation |
|------|-----------|
| Heavy animations skew measurement | Animate with CSS/rAF only, throttle updates, Worker engine |
| Backdrop blur performance on low-end phones | Feature-detect and fall back to solid surfaces |
| Gauge scale jumps feel jarring | Smoothed auto-scale with hysteresis |
