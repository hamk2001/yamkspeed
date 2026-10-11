# Operational Runbook — YamkSpeed (نبض)

> This document contains operational runbook instructions for maintaining, troubleshooting, and operating YamkSpeed in production. (Task P5-28, Milestone M5).

---

## 1. How to Switch Default Measurement Engine

If the primary Cloudflare Speed endpoints change their CORS policies, become blocked in certain regions, or experience an outage, YamkSpeed automatically fails over to Tier 2 (M-Lab NDT7).

To permanently promote **M-Lab NDT7** as the primary engine without waiting for fallback:

1. Open [`src/engine/orchestrator.ts`](file:///c:/yamk-speed/src/engine/orchestrator.ts).
2. In `CoreSpeedEngine.start()`, direct execution to `this.runFallbackNdt7(signal)` at the start of the measurement sequence.
3. Commit and push:
   ```bash
   git checkout -b chore/promote-mlab-primary
   git commit -am "chore: promote M-Lab NDT7 to primary engine"
   git push origin chore/promote-mlab-primary
   ```
4. Verify tests and build pass (`npm test && npm run build`).

---

## 2. Deploying Emergency Cloudflare Worker Fallback

If both Cloudflare speed endpoints and M-Lab NDT7 are unavailable or throttled, deploy the self-hosted Cloudflare Worker template located in [`infra/worker-fallback/`](file:///c:/yamk-speed/infra/worker-fallback/).

### Prerequisites:
- Free Cloudflare account (includes 100,000 requests/day).
- Node.js & Wrangler CLI (`npm i -g wrangler`).

### Deployment Steps:
1. Navigate to the worker template directory:
   ```bash
   cd infra/worker-fallback
   ```
2. Log in to Cloudflare:
   ```bash
   npx wrangler login
   ```
3. Deploy the worker to your Cloudflare account:
   ```bash
   npx wrangler deploy
   ```
4. The deployment will output a public URL (e.g. `https://yamk-speed-fallback.<subdomain>.workers.dev`).
5. Update `src/engine/preflight.ts`, `src/engine/download.ts`, and `src/engine/upload.ts` with your worker domain:
   - Download: `https://yamk-speed-fallback.<subdomain>.workers.dev/__down?bytes=<N>`
   - Upload: `https://yamk-speed-fallback.<subdomain>.workers.dev/__up`
6. Run `npm test` and redeploy the frontend to Vercel.

---

## 3. How to Roll Back a Production Deployment on Vercel

If a regression occurs in production:

1. **Instant Web Dashboard Rollback:**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard) $\rightarrow$ Select `yamk-speed`.
   - Go to the **Deployments** tab.
   - Locate the previous stable deployment (marked by git tag or commit SHA).
   - Click the three dots `...` on the deployment card and click **Instant Rollback**.
   - Traffic is redirected instantaneously without rebuilding.

2. **Git-based Rollback:**
   ```bash
   git revert HEAD
   git push origin main
   ```

---

## 4. Dependency Updates & Security Audit

YamkSpeed strictly enforces zero runtime vulnerabilities. Run monthly maintenance checks:

```bash
# 1. Check for security vulnerabilities
npm audit

# 2. Check for outdated packages
npm outdated

# 3. Verify TypeScript build and honesty gate
npm run test
npm run lint
node scripts/check-honesty.mjs
node scripts/check-contrast.mjs
npm run build
```

---

## 5. Automated Health Monitoring

- Daily scheduled monitoring runs via [`.github/workflows/endpoint-health.yml`](file:///c:/yamk-speed/.github/workflows/endpoint-health.yml) at 06:00 UTC.
- If endpoints return non-200 or omit `access-control-allow-origin`, the workflow fails and notifies maintainers.
