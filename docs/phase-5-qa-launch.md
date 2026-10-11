# Phase 5 — QA, Performance, Accessibility, Security & Launch

**Duration:** ~1 week (+ ongoing maintenance)  **Milestone:** M5 (v1.0)  **Depends on:** Phases 1–4

## Objectives
1. Verify every requirement and acceptance criterion.
2. Meet performance, accessibility, security and privacy targets.
3. Launch on Vercel and set up lightweight maintenance.

## Deliverables
- QA report, final validation re-run, Lighthouse and axe reports
- Production deployment with custom domain (optional)
- README, CONTRIBUTING, LICENSE, CHANGELOG, runbook

## Stage 5.1 — Functional QA (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P5-01 | Requirements traceability matrix: FR/NFR → tests/evidence | P0 | 4h |
| P5-02 | Full E2E suite on Chromium, Firefox, WebKit (mock engine) | P0 | 6h |
| P5-03 | Real-device testing: iPhone Safari, Android Chrome, desktop browsers, on Wi-Fi and mobile data | P0 | 10h |
| P5-04 | Persistence tests: theme/language across reloads, tabs, private mode, cleared storage; migration from v1→v2 schema | P0 | 4h |
| P5-04b | Rate limiting QA: verify 30s cooldown, 20 tests/hour, multi-tab prevention, UI countdown | P0 | 3h |
| P5-04c | Captive portal / restricted network QA: test on hotel Wi-Fi or simulated captive portal | P0 | 3h |
| P5-05 | Bilingual usability check with 5 people (3 Arabic, 2 English) | P1 | 8h |

## Stage 5.2 — Accuracy re-validation (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P5-06 | Re-run validation campaign on the release build (throttle, references, browser matrix) | P0 | 10h |
| P5-07 | Confirm no `Math.random` / mock engine in production bundle (script + manual inspection) | P0 | 2h |
| P5-07b | Verify data usage: confirm ≤50 MB normal / ≤10 MB light on release build at various speeds | P0 | 3h |
| P5-08 | Publish methodology and validation summary in repo docs | P1 | 3h |

## Stage 5.3 — Performance (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P5-09 | Lighthouse mobile ≥ 95 in all categories; fix regressions | P0 | 8h |
| P5-10 | Core Web Vitals check (LCP < 1.8 s, CLS < 0.05, INP < 150 ms) on throttled 4G mid-range profile | P0 | 5h |
| P5-11 | Font subset/preload tuning, image/icon optimization, remove unused CSS/JS | P1 | 4h |
| P5-12 | Memory soak (30 runs) re-check; verify history with 100 entries doesn't degrade performance | P0 | 3h |

## Stage 5.4 — Accessibility (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P5-13 | axe-core CI plus manual audit against WCAG 2.2 AA (focus order, target size, contrast, status messages) | P0 | 6h |
| P5-14 | Screen reader pass: VoiceOver (iOS/macOS), TalkBack, NVDA in Arabic and English | P0 | 6h |
| P5-15 | Reduced-motion, zoom 200%, forced-colors checks | P1 | 3h |

## Stage 5.5 — Security & privacy (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P5-16 | Finalize CSP (per exact policy in Study 02: `connect-src` for Cloudflare/M-Lab only, `worker-src`, `style-src`; hashed bootstrap script); fix console violations | P0 | 5h |
| P5-17 | Add `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: interest-cohort=()`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` | P0 | 2h |
| P5-18 | `npm audit`, Dependabot/Renovate, lockfile review, license scan | P0 | 4h |
| P5-19 | Privacy review: confirm no cookies, no analytics (unless opt-in error reporting enabled), storage keys documented | P0 | 3h |
| P5-20 | Verify test traffic never hits Vercel (network panel evidence) | P0 | 1.5h |

## Stage 5.6 — SEO & content (P1)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P5-21 | Meta tags, OG image (AR/EN), `hreflang`, `robots.txt`, `sitemap.xml`, JSON-LD `WebApplication` | P1 | 3h |
| P5-22 | Final copy proofreading in both languages | P1 | 3h |

## Stage 5.7 — Launch (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P5-23 | Confirm Vercel Hobby eligibility (personal, non-commercial) and settings | P0 | 0.5h |
| P5-24 | Optional custom domain and DNS; HTTPS verify | P1 | 1.5h |
| P5-25 | Tag `v1.0.0`, CHANGELOG, GitHub release, production promote | P0 | 1h |
| P5-26 | Post-launch smoke test on production URL (all browsers, both languages) | P0 | 2h |

## Stage 5.8 — Maintenance (**P0**/P1)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P5-27 | Scheduled GitHub Action (**daily**) that hits provider endpoints and opens an issue on failure/CORS change; alerts via email/webhook | **P0** | 5h |
| P5-28 | Runbook: how to switch default engine, deploy Worker fallback, roll back on Vercel, update dependencies | **P0** | 3h |
| P5-29 | Monthly checklist: audit, provider terms, validation spot check | P2 | 1h |

## Definition of Done (v1.0 release gate)
- [ ] PRD acceptance checklist fully ticked
- [ ] Validation meets NFR-01 on release build
- [ ] Lighthouse ≥ 95, axe zero critical/serious, WCAG AA audit signed off
- [ ] CSP and security headers active, no console errors
- [ ] Production deployed, smoke tested, tagged
- [ ] Monitoring action and runbook in place (**P0, not optional**)
- [ ] Rate limiting verified (30s cooldown, 20/hour)
- [ ] Data usage within targets (≤50 MB normal, ≤10 MB light)
- [ ] Share card Arabic text renders correctly
- [ ] Captive portal detection working
- [ ] Multi-tab test prevention verified
- [ ] LICENSE (MIT) and THIRD-PARTY-NOTICES committed

## Risks
| Risk | Mitigation |
|------|-----------|
| Provider changes just before launch | Daily health action, second engine, clear messaging |
| Late accessibility issues | Run axe from Phase 1 in CI so Phase 5 is verification, not discovery |
| Vercel policy change | Output is static `dist`; can move to Cloudflare Pages/Netlify/GitHub Pages in under an hour |
