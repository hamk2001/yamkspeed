# Phase 4 — Features, Settings, History, Sharing & Resilience

**Duration:** ~1.5 weeks  **Milestone:** M4  **Depends on:** Phases 2–3

## Objectives
1. Deliver P1 features: history, units, light mode, share, methodology, NDT7.
2. Harden against endpoint failures and browser quirks.
3. Add optional PWA shell without breaking measurement.

## Deliverables
- Settings dialog, history view with chart, share card, methodology page
- Engine fallback logic and health check
- PWA (installable, offline shell)

## Stage 4.1 — Settings (P1)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P4-01 | Settings dialog (focus trap, Esc to close): units, engine, light mode, digits, show IP/ISP toggle | P1 | 5h |
| P4-02 | Units toggle Mbps / MB/s applied app-wide | P1 | 2h |
| P4-03 | Light test mode: shorter phases and capped payloads; data-usage estimate | P1 | 4h |
| P4-04 | Arabic-Indic digits option | P2 | 2h |
| P4-05 | "System" theme option | P2 | 2h |

## Stage 4.2 — History (P1)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P4-06 | History repository: versioned schema, cap 100, quota/private-mode safe, uses migration utility from Phase 1 | P1 | 5h |
| P4-07 | Auto-save completed (valid) results only; never save errors or partials | P1 | 2h |
| P4-08 | History list/cards with locale formatting, delete one/clear all with confirm | P1 | 6h |
| P4-09 | Trend chart (SVG, always LTR time axis): download/upload/latency over time, tooltips, keyboard accessible | P1 | 10h |
| P4-10 | Export/import JSON | P2 | 3h |
| P4-10b | History stress test: verify performance with 100 entries, localStorage quota handling, render time < 200ms | P1 | 3h |

## Stage 4.3 — Sharing (P1)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P4-11 | Copy-as-text (localized, BiDi-safe) | P1 | 2h |
| P4-12 | PNG share card rendered with **html2canvas** or **dom-to-image** (NOT raw Canvas — to ensure correct Arabic text shaping and RTL layout); both themes, both languages, includes server and timestamp; Web Share API where supported; `document.fonts.ready` before capture | P1 | 10h |

## Stage 4.4 — Engines & resilience (P0/P1)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P4-13 | NDT7 engine integration into selector with consent dialog (if not completed in Phase 2) | P1 | 8h |
| P4-14 | Pre-test health check (tiny request with timeout) and captive portal detection; clear failure reasons | **P0** | 4h |
| P4-15 | Automatic suggestion to switch engine when primary fails; never silently substitute results | **P0** | 4h |
| P4-16 | Rate limiting enforcement: 30s cooldown UI (disabled button with countdown), max 20 tests/hour, exponential backoff on 429 | **P0** | 4h |
| P4-17 | Handle tab visibility, Battery Saver/Data Saver hints (`navigator.connection.saveData`), cellular warning | P1 | 4h |
| P4-17b | Multi-tab test prevention via `BroadcastChannel` or `storage` event lock; show "test running in another tab" message | **P0** | 3h |
| P4-18 | Safari/iOS fixes found in validation | P0 | 8h |

## Stage 4.5 — Content pages (P1)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P4-19 | "How we measure" modal/page: method, limits, why results differ; bilingual | P1 | 5h |
| P4-20 | Privacy and third-party disclosure page; license/notices | P1 | 2h |

## Stage 4.6 — PWA (P2)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P4-21 | `vite-plugin-pwa`: manifest (AR/EN names, icons, theme colors), precache app shell | P2 | 4h |
| P4-22 | Workbox rule: **network-only** for Cloudflare/M-Lab hosts; never cache test traffic | P2 | 2h |
| P4-23 | Offline UI state: shell loads, test disabled with explanation; update prompt | P2 | 3h |

## Stage 4.7 — Quality (P0)
| ID | Task | Pri | Est |
|----|------|-----|-----|
| P4-24 | Unit/component tests for history, settings, share, engine fallback, rate limiting, migration | P0 | 10h |
| P4-25 | Update screenshot matrix for new screens in AR/EN × light/dark | P0 | 5h |
| P4-26 | Bundle audit; lazy-load history, share, settings, NDT7 | P0 | 4h |

## Definition of Done
- [ ] All P1 requirements implemented or explicitly deferred with note
- [ ] Engine failure paths show clear errors, never fake values
- [ ] History survives reload; handles quota errors; stress test passes with 100 entries
- [ ] Share card correct in both languages and themes (**Arabic text renders correctly, not broken glyphs**)
- [ ] PWA does not cache measurement endpoints (verified in DevTools)
- [ ] Bundle budgets still met
- [ ] Rate limiting enforced (30s cooldown visible in UI, 20 tests/hour)
- [ ] Multi-tab test prevention working
- [ ] Captive portal detection shows specific error

## Risks
| Risk | Mitigation |
|------|-----------|
| ~~Canvas text shaping for Arabic in share card~~ | **Resolved:** using html2canvas/dom-to-image instead of raw Canvas; wait for `document.fonts.ready` before capture; test on iOS Safari |
| Service worker interferes with tests | Network-only rule plus E2E check that SW is bypassed |
| Scope creep | Defer P2 items to v1.1 if schedule slips |
| localStorage full with 100 history entries | Measure entry size in Phase 1; cap total bytes; LRU eviction if near quota |
