# Emergency Fallback Worker

This directory contains the Cloudflare Worker implementation used as **Tier 3 Emergency Reserve** for the YamkSpeed measurement engine.

## Purpose
If both Cloudflare public endpoints (`speed.cloudflare.com`) and M-Lab servers fail or are blocked by an ISP/firewall, the client engine can failover to this worker.

## Endpoints
- `GET /__down?bytes=N`: Returns `N` bytes of binary stream with `Content-Type: application/octet-stream` and open CORS.
- `POST /__up`: Accepts binary uploads and reports completion.
- `GET /meta`: Returns client IP, country, city, and Cloudflare edge colo.

## Deployment
1. Install dependencies:
   ```bash
   cd infra/worker-fallback
   npm install
   ```
2. Test locally:
   ```bash
   npx wrangler dev
   ```
3. Deploy to Cloudflare Workers (Free Plan: 100k requests/day):
   ```bash
   npx wrangler deploy
   ```
4. Copy the deployed worker URL and set it in your environment or client configuration:
   `VITE_FALLBACK_WORKER_URL=https://yamk-speed-fallback-worker.<your-subdomain>.workers.dev`
