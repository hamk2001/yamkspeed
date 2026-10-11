# Study 04 — Design, i18n (AR/EN) & Theming

## 1. Visual identity: "Aurora Pulse"

A speed test is a repeated, utilitarian tool; the design must make it feel like an *instrument* with personality, not a generic template.

**Concept:** a luminous, pulsing radial gauge floating over a soft aurora gradient. The "heartbeat" (نبض) motif appears in the logo, the idle breathing animation of the start button, and the latency trace.

**Signature elements**
1. **Hero gauge:** large circular arc (270°), tick marks, glowing progress stroke with trailing comet, giant tabular numerals in the center.
2. **Start button as orb:** circular "GO / ابدأ" orb that breathes while idle, ripples while testing.
3. **Bento result grid:** download, upload, latency, jitter, server, quality as modular glass cards.
4. **Aurora background:** blurred radial gradients (static, GPU-cheap) that shift hue with the test phase (cyan for download, violet for upload, amber for latency).
5. **Live trace:** sparkline of the last N samples under the gauge.

## 2. Design tokens

| Token | Dark ("Midnight") | Light ("Sand") |
|-------|-------------------|----------------|
| `--bg` | `#070B14` | `#F6F3EC` |
| `--surface` | `#0E1626` | `#FFFFFF` |
| `--surface-2` | `#16213A` | `#EEE9DD` |
| `--text` | `#E8EEF9` | `#0B1220` |
| `--text-muted` | `#93A1BD` | `#4B5568` |
| `--accent-down` | `#22E6C3` | `#0A8F7A` |
| `--accent-up` | `#8B6CFF` | `#5B3FE0` |
| `--accent-lat` | `#FFB547` | `#B86E00` |
| `--danger` | `#FF6B7A` | `#C62839` |
| `--border` | `rgba(255,255,255,.08)` | `rgba(11,18,32,.10)` |

Validate all text/background pairs for **≥ 4.5:1** (large text ≥ 3:1); adjust in Phase 1 with a contrast script.

**Radii:** 12 / 20 / 28 / full. **Spacing:** 4-pt scale. **Shadow:** soft glow in dark, soft drop in light. **Glass:** `backdrop-filter: blur(16px)` with solid fallback.

## 3. Typography

| Script | Font | Notes |
|--------|------|-------|
| Latin UI + numerals | Space Grotesk (variable) | Distinctive geometric shapes, tabular numerals via `font-variant-numeric: tabular-nums` |
| Arabic | **IBM Plex Sans Arabic** | Clean, modern; weights 400/500/700. **Selected** after evaluation: better tabular-nums support and geometric consistency with Space Grotesk compared to Cairo/Tajawal. Test rendering in Phase 1 spike on iOS Safari, Chrome Android, and Windows Edge to confirm. |
| Fallback | `system-ui, "Segoe UI", Tahoma, sans-serif` | Tahoma covers Arabic on Windows |

Arabic requires larger line-height (about 1.7 vs 1.5) and slightly larger size; set via `:lang(ar)` rules. Never use letter-spacing on Arabic.

## 4. Language & direction

- Languages: `en` (LTR), `ar` (RTL). Default from saved preference, else `navigator.languages`, else `en`.
- `<html lang dir>` updated at boot (inline script) and on change.
- Switch button in top bar shows the **target** language in its own script ("العربية" when in English, "English" when in Arabic) plus a globe icon, `aria-label` translated.
- **Mirroring rules:** layout and icons mirror (arrows, chevrons, progress direction for lists), but **do not mirror**: gauge arc direction (clockwise is universal), logo, charts' time axis, numerals, code/URLs.
- **Chart direction (resolved):** all charts (sparkline, trend history) keep **left-to-right time axis** (oldest → newest) in both LTR and RTL. Rationale: time-series data universally reads left-to-right; mirroring would confuse users and contradict axis labels. The chart container gets `dir="ltr"` with `lang` preserved for proper localized tooltips.
- **Numerals:** default Latin digits (0–9) in both languages for consistency with network tools; setting offers Eastern Arabic-Indic digits (٠–٩) in Arabic via `Intl.NumberFormat('ar-EG')`.
- Units: "Mbps" stays Latin; Arabic label "ميجابت/ث" may appear in secondary text.
- Dates: `Intl.DateTimeFormat` with the active locale; always Gregorian calendar by default.
- Plurals via `Intl.PluralRules` (Arabic has 6 forms; ensure dictionary supports `zero/one/two/few/many/other`).
- **Bidi isolation:** wrap mixed-direction snippets (IP addresses, server names, URLs) in `<bdi>` elements or use `<span dir="ltr">` with `unicode-bidi: isolate`. Example: server location "Riyadh (الرياض)" must render correctly in both directions. Apply `dir="ltr"` islands to: IP addresses, port numbers, URLs, file sizes, version strings.

## 5. Theme behavior

- Values: `light`, `dark`; first visit uses `prefers-color-scheme`; after the user toggles, save explicit choice. (Optional "system" third state in Settings, P2.)
- Toggle button: sun/moon morphing icon, `aria-pressed`, tooltip, animated with View Transitions API when supported and `prefers-reduced-motion` is not set.
- **View Transitions fallback:** when the API is unsupported (Firefox, older Safari), fall back to a CSS class-based crossfade transition (`.theme-transition { transition: background-color 300ms ease, color 300ms ease }`). The theme switch must remain functional in all supported browsers regardless of animation support.
- No flash: bootstrap script sets attributes before CSS paints.
- Sync across tabs via the `storage` event.

## 6. Persistence

Key `nabd:prefs:v1` (JSON): `{ theme, lang, units, engine, light, digits, consentNdt7 }`. History key `nabd:history:v1`. Wrap storage in try/catch (private mode, quota) and fall back to memory.

**Migration strategy:**
- Each storage key includes a version suffix (`v1`, `v2`, etc.).
- On app load, `migrateStorage()` reads the current version, applies sequential migration functions (`v1→v2`, `v2→v3`, etc.), writes the new version, and deletes obsolete keys.
- If migration fails or data is corrupt, log a warning and reset to defaults. Never crash on bad storage data.
- Migration functions are unit-tested in CI with fixtures for each historical schema version.
- Example migration: `v1→v2` might add a new `cooldown` preference with a default value of `30`.

## 7. Top bar spec

- Sticky, translucent glass, height 64 px (56 px on mobile).
- **Start side:** logo + wordmark ("Nabd Speed" / "نبض سبيد").
- **End side:** language switch, theme switch, settings/overflow menu (history, about). All icon buttons have visible focus and ≥ 44 px hit area.
- Mobile: icons only; labels in tooltips and aria.

## 8. Layout & responsive

Breakpoints: 360, 640, 1024, 1440. Mobile-first: gauge on top, results below; desktop: gauge left/center, bento right, history below. Max content width 1200 px.

## 9. Motion

Durations 150–400 ms, `cubic-bezier(.2,.8,.2,1)`. Gauge needle uses `requestAnimationFrame` easing from latest sample. Under `prefers-reduced-motion`: remove ripples/aurora drift, keep value changes instantaneous.

## 10. Content design

Microcopy in both languages for: idle, locating, latency, download, upload, done, error variants, limits note, privacy note, methodology. Tone: clear and calm, never hype. All strings live in `src/i18n/en.ts` and `ar.ts`, type-checked for key parity (build fails if a key is missing).
