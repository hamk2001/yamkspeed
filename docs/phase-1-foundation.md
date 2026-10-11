# Phase 1 — Foundation, Design System, i18n/Theme & Deployment Pipeline

**Duration:** ~1 week  **Milestone:** M1  **Depends on:** none

## Objectives
1. Repository, tooling and CI ready.
2. Design tokens, typography and top bar working in both themes and both languages.
3. Theme/language persistence with zero flash.
4. Verified endpoint behavior (feasibility spike).
5. Live deployment on Vercel.

## Deliverables
- Running skeleton at a Vercel URL with working top-bar theme and language toggles
- Spike report `docs/spikes/endpoints.md`
- Design token file and base components
- CI pipeline green

## Stage 1.1 — Feasibility spike (P0, first)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P1-01 | Call Cloudflare `__down`, `__up`, `meta` from a browser on a different origin; record CORS, `Timing-Allow-Origin`, HTTP version, max bytes, rate limits | P0 | 4h |
| P1-02 | Call M-Lab locate API and open an NDT7 WebSocket from the browser | P0 | 4h |
| P1-03 | Read Cloudflare and M-Lab terms/privacy; note attribution requirements | P0 | 1.5h |
| P1-04 | Run `@cloudflare/speedtest` in a scratch page; save sample outputs for later baseline | P0 | 3h |
| P1-05 | Write the spike report with go/no-go decision | P0 | 1.5h |
| P1-05b | Test captive portal detection: verify response content-type and body against known patterns; document detection strategy | P0 | 2h |
| P1-05c | Prepare Cloudflare Worker fallback template (`infra/worker-fallback/`); test locally with `wrangler dev`; document deployment steps for emergency use | P0 | 3h |

**Gate:** if both providers fail CORS/limits, stop and revisit ADR-002 before continuing.

## Stage 1.2 — Project setup (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P1-06 | `npm create vite@latest` (React + TS), enable TS strict flags | P0 | 1h |
| P1-07 | Install Tailwind v4 (Vite plugin), Zustand, Fontsource fonts | P0 | 1h |
| P1-08 | ESLint (incl. `jsx-a11y`), Prettier, Husky + lint-staged | P0 | 2h |
| P1-09 | Folder structure: `src/{engine,features,components,i18n,theme,lib,styles}` | P0 | 0.5h |
| P1-10 | Vitest + Testing Library setup, first smoke test | P0 | 1.5h |
| P1-11 | Custom ESLint/grep CI rule: ban `Math.random` in `src/engine/**` and ban `left/right` physical CSS utilities | P0 | 2h |
| P1-12 | GitHub repo, branch protection, PR template with honesty/RTL checklist | P0 | 1h |
| P1-13 | GitHub Actions: typecheck, lint, test, build, size-limit | P0 | 2h |

## Stage 1.3 — Vercel deployment (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P1-14 | Import repo into Vercel (Hobby), preset Vite, output `dist` | P0 | 0.5h |
| P1-15 | `vercel.json`: SPA fallback, caching (`immutable` for `/assets/*`), initial security headers | P0 | 1.5h |
| P1-16 | Verify preview URL per PR and production on `main` | P0 | 0.5h |

## Stage 1.4 — Design system (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P1-17 | Implement tokens as CSS variables for `light` and `dark` (Study 04 §2); integrate with Tailwind v4 `@theme` directive | P0 | 3h |
| P1-18 | Contrast script verifying all text/background pairs ≥ AA | P0 | 2h |
| P1-19 | Typography: self-hosted Space Grotesk + IBM Plex Sans Arabic, subsets, `:lang(ar)` line-height rules; verify rendering on iOS Safari, Chrome Android, Windows Edge | P0 | 3h |
| P1-20 | Base components: Button, IconButton, Card, Dialog, Tooltip, VisuallyHidden, Spinner | P0 | 8h |
| P1-21 | Aurora background component (static gradients, hue via CSS variable) | P1 | 3h |

## Stage 1.5 — Theme, language, persistence (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P1-22 | Inline bootstrap script in `index.html` reading `nabd:prefs:v1`, setting `data-theme`, `lang`, `dir`, falling back to system/browser; hash for CSP | P0 | 3h |
| P1-23 | Preferences store (Zustand persist, versioned, try/catch, memory fallback) | P0 | 3h |
| P1-23b | localStorage migration utility (`migrateStorage()`) with version detection, sequential migration functions, CI fixtures for each schema version | P0 | 3h |
| P1-24 | Typed i18n: `en.ts`, `ar.ts`, `t()` hook, key-parity type check, `Intl` formatters, plural support (all 6 Arabic forms) | P0 | 8h |
| P1-25 | TopBar component with logo, `ThemeToggle`, `LanguageToggle` (shows target language name), menu placeholder | P0 | 6h |
| P1-26 | Update `<html lang dir>` and `<meta name="theme-color">` on change; `storage` event sync across tabs | P0 | 2h |
| P1-27 | Theme switch animation via View Transitions API with CSS crossfade fallback for unsupported browsers; reduced-motion guard | P1 | 2h |
| P1-28 | RTL audit page with sample components in both directions; BiDi isolation verification (IP, server names, URLs) | P0 | 3h |
| P1-29b | Client-side rate limiter module: 30s cooldown, 20 tests/hour, persistent counter in localStorage | **P0** | 2h |

## Stage 1.6 — Metadata & SEO scaffolding (P1)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P1-29 | `<title>`, description, Open Graph, favicon set, `hreflang`, manifest stub | P1 | 2h |

## Testing in this phase
- Unit: store persistence, i18n key parity, formatter output for `ar` and `en`, migration functions with version fixtures.
- Component: toggles update attributes and storage.
- E2E (Playwright smoke): reload keeps theme and language; no flash (check attributes set before first contentful paint).
- Manual: view on Chrome, Safari iOS, Firefox in both languages.
- Rate limiter: verify cooldown enforcement and counter reset.

## Definition of Done
- [ ] Spike report committed with go decision
- [ ] CI green on PR; production deploy live
- [ ] Theme and language toggles in top bar work and persist
- [ ] No flash of wrong theme/direction on reload
- [ ] Contrast report passes
- [ ] No physical-direction CSS utilities remain (lint passes)

## Risks
| Risk | Mitigation |
|------|-----------|
| Endpoint CORS surprise | Spike done first with explicit gate |
| Arabic font loading flicker | Preload subset, `size-adjust` fallback metrics |
| CSP blocks bootstrap script | Compute and pin script hash during build |
| Multi-tab concurrent tests | Rate limiter uses localStorage with timestamp; second tab sees cooldown |
| Storage quota exceeded | try/catch with memory fallback; graceful degradation |
