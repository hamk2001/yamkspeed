# Changelog

All notable changes to YamkSpeed (نبض) will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-12

### Added
- **Core Measurement Engine:**
  - 3-tier measurement architecture (Primary: Cloudflare Edge, Tier 2: M-Lab NDT7 WebSocket, Emergency Tier 3: Cloudflare Worker fallback).
  - Strict Honesty Guarantee: Zero synthetic numbers, zero interpolation; automated CI gate banning `Math.random` in engine code.
  - Multi-stream parallel download and upload tests with progressive payload sizing (250 KB – 10 MB).
  - RFC 3550 jitter calculation and median idle latency measurement (20 probes with worst outlier discarded).
  - Concurrent bufferbloat (loaded latency) measurement during active transfer with letter grades (A+ to F).
  - Rate limiting & multi-tab mutex (30s cooldown, 20 tests/hour, active tab lock).
  - Web Worker execution with automatic fallback to main thread.
- **UI & Experience:**
  - Custom 270° radial speedometer SVG gauge with auto-scaling dynamic thresholds and live comet tail glow.
  - Real-time sparkline throughput curve (strictly LTR time progression in both LTR and RTL modes).
  - Modular Bento results grid with collapsible technical metadata and one-click summary copying.
  - "Aurora Pulse" ambient background that dynamically shifts hue with the test phase.
  - Dedicated "How We Measure" modal documenting methodology, formulas, and limitations.
- **Design System & i18n:**
  - Zero-flash theme switching (Midnight Dark & Sand Light) and language switching (Arabic RTL & English LTR).
  - Self-hosted web fonts via Fontsource (IBM Plex Sans Arabic & Space Grotesk) with complete tabular numerals.
  - Number format switcher supporting both standard Latin digits (0-9) and Eastern Arabic-Indic numerals (٠-٩).
  - Full WCAG 2.2 AA contrast compliance and keyboard navigation.
- **Infrastructure & Maintenance:**
  - Strict Content Security Policy (CSP) and security headers configured in `vercel.json`.
  - Automated daily endpoint health monitoring workflow (`.github/workflows/endpoint-health.yml`).
  - Comprehensive operational runbook (`docs/runbook.md`) and validation reports.
