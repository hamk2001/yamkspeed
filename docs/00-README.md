# ⚡ YamkSpeed (Nabd Speed / نبض)

Working title: **Nabd Speed** — a front-end-only internet speed test (download, upload, latency, jitter) hosted free on Vercel.

## Reading order

| # | File | Purpose |
|---|------|---------|
| 01 | `01-study-requirements-analysis.md` | Requirements, constraints, feasibility, risks |
| 02 | `02-study-technology-selection.md` | Stack comparison and decisions (ADRs) |
| 03 | `03-study-measurement-methodology.md` | How to measure accurately and honestly |
| 04 | `04-study-design-i18n-theming.md` | Visual identity, RTL/LTR, themes, preferences |
| 05 | `05-PRD.md` | Full Product Requirements Document |
| 06 | `phase-1-foundation.md` | Setup, design system, i18n/theme, deploy pipeline |
| 07 | `phase-2-measurement-engine.md` | Core engine and accuracy validation |
| 08 | `phase-3-ui-experience.md` | Gauge, results, motion, responsive polish |
| 09 | `phase-4-features-resilience.md` | History, sharing, settings, PWA, error handling |
| 10 | `phase-5-qa-launch.md` | Testing, performance, a11y, security, launch |

## Key decisions at a glance

- **Stack:** Vite + React 18 + TypeScript (SPA), Tailwind CSS v4 (logical properties for RTL, `@theme` integration with CSS variable tokens), Zustand, custom typed i18n, Vitest + Playwright.
- **Measurement servers:** Three-tier fallback: Cloudflare's public speed endpoints (primary) → M-Lab NDT7 (alternate) → self-hosted Cloudflare Worker (emergency reserve). Test traffic goes **browser → test server directly**, never through Vercel (protects the free bandwidth quota).
- **No fake data:** every number comes from real transfers; failures show errors, never simulated values. CI enforces `Math.random` ban in engine code.
- **Rate limiting:** 30s cooldown between tests, max 20 tests/hour, multi-tab prevention. Protects provider endpoints from abuse.
- **Data usage:** ≤50 MB per normal test, ≤10 MB in light mode. Adaptive sizing caps payloads early.
- **Hosting:** Vercel Hobby (free, non-commercial use), static output, security headers via `vercel.json`.
- **License:** MIT.

## Conventions

- Priorities: **P0** = must ship, **P1** = should ship, **P2** = nice to have.
- Task IDs: `P{phase}-{number}`; requirement IDs: `FR-xx`, `NFR-xx`.
- Estimates assume one developer; adjust to your team. Original estimates have been revised upward to reflect realistic complexity (total ~14–20 weeks).
