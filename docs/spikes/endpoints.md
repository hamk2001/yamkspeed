# Spike Report: Measurement Endpoints Feasibility

| Field | Value |
|-------|-------|
| Date | 2026-10-11 |
| Status | **GO** (with 3-Tier fallback strategy) |
| Author | YamkSpeed Engineering Team |

---

## 1. Executive Summary

We performed empirical testing against the primary and secondary measurement endpoints:
1. **Tier 1 (Cloudflare Speed Endpoints)**: `__down` and `__up` endpoints respond with open CORS (`Access-Control-Allow-Origin: *`), supporting streaming binary transfers. However, `/meta` and `/locations` return `403 Forbidden` when requested without Cloudflare session cookies, and regional routing to Cloudflare speed IP blocks may encounter transient timeouts or ISP routing hiccups.
2. **Tier 2 (M-Lab NDT7)**: The locate API (`https://locate.measurementlab.net/v2/nearest/ndt/ndt7`) responds with open CORS (`*`), provides rich geolocation data (e.g., Doha, QA), and returns active `wss://` endpoints for both download and upload that connect immediately and stream binary messages without restriction.
3. **Tier 3 (Self-Hosted Cloudflare Worker Reserve)**: Implemented in `infra/worker-fallback/` to serve as a zero-cost backup providing `__down`, `__up`, and `/meta` with guaranteed open CORS and custom headers.

**Decision: GO.** The 3-tier fallback architecture completely eliminates single-point-of-failure risks.

---

## 2. Detailed Findings by Provider

### 2.1 Cloudflare (`speed.cloudflare.com`)

| Endpoint | Method | Status | CORS | Timing-Allow-Origin | Notes |
|----------|--------|--------|------|---------------------|-------|
| `/__down?bytes=N` | `GET` | 200 | `*` | Exposed | Streams requested binary bytes. `Content-Type: application/octet-stream`. |
| `/__up` | `POST` | 200 | `*` | Exposed | Accepts binary body and discards. |
| `/meta` | `GET` | 403 / Restricted | None | None | Blocked for direct anonymous automated calls. Must extract client info from M-Lab or `cf-ray` / public IP services. |

### 2.2 M-Lab NDT7 (`locate.measurementlab.net`)

| Component | Status | Details |
|-----------|--------|---------|
| Locate API | 200 OK | `https://locate.measurementlab.net/v2/nearest/ndt/ndt7` returns `Access-Control-Allow-Origin: *`. |
| Server Selection | Verified | Returns 4 nearest servers with geographic metadata (city, country, hostname). |
| WebSocket Protocol | Verified | Connects over `wss://` using subprotocol `net.measurementlab.ndt.v7`. Streams binary chunks and client/server measurements. |
| Terms & Attribution | Open Data | Measurement Lab requires that users understand test data is collected for public research under Creative Commons CC0. We display clear attribution in the UI. |

---

## 3. Captive Portal Detection Strategy (P1-05b)

In public Wi-Fi environments (airports, cafes, hotels), networks frequently intercept HTTP requests and redirect them to a captive login portal.

### Detection Mechanism
1. **Pre-flight probe to known canary endpoint**:
   - Issue a `GET` request to `https://speed.cloudflare.com/__down?bytes=0` (or `https://locate.measurementlab.net/v2/nearest/ndt/ndt7`).
2. **Failure Signatures**:
   - Response is an HTML document (`content-type: text/html`) instead of `application/octet-stream` or `application/json`.
   - Response status is 302/307 redirect or 200 with an HTML `<form>` or `<title>Login</title>`.
   - SSL certificate mismatch or fetch error caused by MITM captive gateway.
3. **Engine Action**:
   - When a captive portal is detected, abort the test immediately and display a descriptive warning state (`captive-portal` state) directing the user to sign in to the local network before testing.

---

## 4. Emergency Worker Fallback (`infra/worker-fallback/`) (P1-05c)

A standalone Cloudflare Worker is prepared in `infra/worker-fallback/`:
- Handles `GET /__down?bytes=N` generating streaming zero-fill chunks.
- Handles `POST /__up` reading stream and measuring bytes.
- Handles `GET /meta` returning client IP, country, city, and colo code with CORS `*`.
- Deploys on Cloudflare Workers free plan (100,000 requests/day).
