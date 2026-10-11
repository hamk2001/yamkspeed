# Study 02 — Technology Selection & Best Practices

## 1. Decision summary

| Layer | Choice | Why |
|-------|--------|-----|
| Build tool | **Vite 6+** | Zero-config on Vercel, fast HMR, small output |
| UI library | **React 18/19 + TypeScript (strict)** | Mature ecosystem, strong typing for engine/UI contracts |
| Styling | **Tailwind CSS v4** + CSS variables tokens | Logical utilities (`ms-*`, `ps-*`, `start-*`), `rtl:` variant, tiny CSS output. Tokens defined as CSS custom properties on `:root` and consumed via Tailwind's `@theme` directive for seamless integration. Where `rtl:` variant is insufficient, use `[dir="rtl"]` selector directly. |
| State | **Zustand** (+ `persist` middleware) | ~1 KB, simple, built-in localStorage persistence |
| i18n | **Custom typed dictionary + `Intl` APIs** | 2 languages only; avoids ~15 KB library; compile-time key safety |
| Animation | **CSS + Web Animations API**, optional `motion` for orchestration | Keep bundle small, respect `prefers-reduced-motion` |
| Charts/gauge | **Hand-written SVG components** | Gauge and sparkline are simple; avoids 100 KB+ chart libs |
| Fonts | **Fontsource (self-hosted)**: Space Grotesk (Latin/numerals), IBM Plex Sans Arabic | No third-party font requests, better privacy and CSP |
| Engine | **Custom multi-stream engine** on Cloudflare endpoints + **NDT7** adapter | Live gauge, control over methodology (see Study 03) |
| Benchmark baseline | `@cloudflare/speedtest` (dev-only) | Cross-check our engine without shipping it |
| Testing | **Vitest**, Testing Library, **Playwright**, axe-core | Unit, component, E2E, a11y |
| Quality | ESLint, Prettier, `tsc --noEmit`, Husky + lint-staged | Consistency, pre-commit safety |
| CI/CD | **GitHub + Vercel Git integration**, GitHub Actions for checks | Preview URL per PR, production on `main` |
| PWA | `vite-plugin-pwa` (Phase 4) | Installable, offline shell; **never cache test endpoints** |
| Analytics | None by default (optional Vercel Web Analytics later) | Privacy-first |

## 2. Framework comparison

| Criterion | Vite + React SPA | Next.js (static export) | SvelteKit/Astro | Vanilla TS |
|-----------|------------------|-------------------------|-----------------|-----------|
| Needs backend? | No | No (if `output: 'export'`) | No | No |
| Bundle size | Small | Larger runtime | Smallest | Smallest |
| Vercel fit | Excellent | Native | Good | Good |
| Complexity for this app | Low | Medium (unused features) | Low | Medium (manual state/UI) |
| Team familiarity / hiring | High | High | Medium | High |
| **Verdict** | **Selected** | Overkill (no SSR/routes needed) | Viable alternative | Too much boilerplate |

SEO note: a single-page tool needs only good `<head>` metadata, hreflang, structured data, and a static pre-rendered shell. If separate indexable pages per language are desired later, add `vite-plugin-ssg` or move to Astro.

## 3. Engine technology choices

### 3.1 Transport options in the browser

| API | Download | Upload | Notes |
|-----|----------|--------|-------|
| `fetch` + `ReadableStream` | Excellent: count bytes per chunk, live speed | Streaming upload is limited (Chromium + HTTP/2) | Primary for download |
| `XMLHttpRequest` | OK | **Best: `upload.onprogress` works everywhere** | Primary for upload, Safari-safe |
| WebSocket (NDT7) | Good | Good | Server pushes measurements; single TCP stream |
| WebRTC data channel | Possible | Possible | Needs TURN/STUN infrastructure; out of scope |
| Resource Timing API | Precise start/end per request | Same | Needs `Timing-Allow-Origin` |

### 3.2 Concurrency

Use **HTTP/2 or HTTP/3 multiplexing** with 4–8 parallel streams (adaptive), because a single TCP stream rarely saturates fast links. Cloudflare endpoints support H2/H3.

### 3.3 Off-main-thread

Run the engine's timing and aggregation in a **Web Worker** where possible so UI animation never skews measurements, and so counting bytes does not compete with rendering. Fallback to main thread if workers fail.

**Worker graceful degradation strategy:**
1. Attempt to spawn a Worker via `new Worker()` with `type: 'module'`.
2. If the constructor throws (CSP restriction, unsupported, iOS power-saver mode), catch the error and flag `workerAvailable = false`.
3. Run the same aggregation code on the main thread, but throttle UI updates to 10 Hz to minimize measurement interference.
4. Log a warning in dev builds; in production, silently fall back. Document in "How we measure" that results on fallback path may have slightly higher variance.

## 4. Best practices adopted

**Code**
- TypeScript `strict`, `noUncheckedIndexedAccess`, path aliases.
- Feature-sliced folders: `engine/`, `features/`, `components/`, `i18n/`, `theme/`, `lib/`.
- Engine is framework-free (pure TS) with an event emitter interface so it can be unit-tested and reused.
- Immutable results model, versioned localStorage schema with migrations.

**CSS / RTL**
- Only logical properties (`margin-inline-start`, `inset-inline-end`, etc.); ban `left/right` via Stylelint/ESLint rule.
- `dir` and `lang` set on `<html>`; directional icons flipped via `rtl:` utilities; numerals and gauge kept LTR via `dir="ltr"` islands.

**Theming**
- Design tokens as CSS variables on `:root[data-theme="light|dark"]`.
- Tiny inline bootstrap script (hash-whitelisted in CSP) sets `data-theme`, `lang`, `dir` **before first paint** from `localStorage`, falling back to `prefers-color-scheme` and `navigator.language`.
- `color-scheme` meta and CSS property so native controls match.

**Performance**
- Code-split non-critical features (history, share, settings dialog).
- Preload critical font subset; `font-display: swap`; subset Arabic and Latin.
- Budgets enforced in CI (size-limit).

**Security**
- CSP headers (exact policy):
  ```
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';  /* required for Tailwind runtime */
  img-src 'self' blob:;              /* blob: for share card; avoid data: to reduce XSS surface */
  font-src 'self';                   /* self-hosted via Fontsource */
  connect-src 'self'
    https://speed.cloudflare.com
    https://*.measurementlab.net
    wss://*.measurementlab.net;       /* NDT7 WebSocket */
  worker-src 'self' blob:;           /* Web Worker for engine */
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'none';
  ```
  Note: M-Lab servers are dynamic (returned by locate API). The `*.measurementlab.net` wildcard covers them. If a tighter policy is desired, add specific subdomains discovered during the spike.
- `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: interest-cohort=()`, `X-Content-Type-Options: nosniff`, HSTS (Vercel provides TLS).
- `npm audit` and Dependabot/Renovate.

**Error reporting (opt-in)**
- No analytics or tracking by default.
- Optional: anonymous, opt-in error reporting via a lightweight client (e.g., Sentry Free Tier or a custom `navigator.sendBeacon` to a Cloudflare Worker endpoint) that captures only: error code, browser, phase, engine, and timestamp. No IP, no results, no PII.
- Include a "Help improve Nabd" toggle in Settings (default off).

**Accessibility**
- Semantic landmarks, visible focus, 44 px touch targets, `aria-live` regions for status, gauge has text alternative, color is never the only signal.

## 5. Vercel free-tier practices

- Framework preset: Vite; build `vite build`; output `dist`.
- `vercel.json` for headers (CSP, caching), SPA rewrite fallback, long-cache for hashed assets (`immutable`), short cache for `index.html`.
- Preview deployments for each branch; protect `main`.
- Keep the project static: no Functions, no Edge middleware, no Image Optimization usage.
- Respect Hobby terms (personal, non-commercial). Add custom domain later if desired (free to attach).

## 6. Architecture Decision Records

| ADR | Decision | Status |
|-----|----------|--------|
| ADR-001 | Static SPA, no owned backend | Accepted |
| ADR-002 | Cloudflare endpoints primary, NDT7 alternate, self-hosted Worker as emergency reserve, behind a common `SpeedEngine` interface | Accepted |
| ADR-003 | Custom engine, validated against `@cloudflare/speedtest` and reference tools | Accepted (revisit if validation fails; fallback is shipping `@cloudflare/speedtest`) |
| ADR-004 | Custom typed i18n instead of i18next | Accepted (revisit at 3+ languages) |
| ADR-005 | SVG-only visualization | Accepted |
| ADR-006 | Tailwind v4 with logical properties + `@theme` integration with CSS variable tokens | Accepted |
| ADR-007 | Test traffic never proxied through Vercel | Accepted (non-negotiable) |
| ADR-008 | Emergency Cloudflare Worker fallback endpoint | Accepted (deploy only when needed; template ready in `infra/worker-fallback/`) |
| ADR-009 | Client-side rate limiting (30s cooldown, 20 tests/hour max) | Accepted (P0, protects provider goodwill) |
