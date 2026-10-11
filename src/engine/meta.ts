import type { ServerInfo } from './types';

/**
 * Fetches server metadata and client geo-location.
 * Combines M-Lab locate API and Cloudflare metadata with resilient fallbacks.
 */
export async function fetchServerMetadata(signal?: AbortSignal): Promise<ServerInfo> {
  const fallbackInfo: ServerInfo = {
    city: 'Optimal Edge',
    country: 'Global',
    colo: 'EDGE',
    id: 'cloudflare-primary',
  };

  // 1. Try M-Lab locate API (open CORS and gives precise nearest edge city/country)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true });

    const mlabRes = await fetch('https://locate.measurementlab.net/v2/nearest/ndt/ndt7', {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (mlabRes.ok) {
      const data = await mlabRes.json();
      if (data.results && data.results.length > 0) {
        const top = data.results[0];
        return {
          city: top.location?.city || 'Local Edge',
          country: top.location?.country || 'Detected',
          colo: top.machine?.split('.')[0] || 'CF-EDGE',
          id: top.machine || 'mlab-edge',
        };
      }
    }
  } catch {
    // Continue to fallback
  }

  // 2. Try Cloudflare public speed meta
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true });

    const cfRes = await fetch('https://speed.cloudflare.com/meta', {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (cfRes.ok) {
      const data = await cfRes.json();
      return {
        city: data.city || fallbackInfo.city,
        country: data.country || fallbackInfo.country,
        colo: data.colo || fallbackInfo.colo,
        ip: data.ip,
        asn: data.asn,
        asOrganization: data.asOrganization,
        id: `cf-${data.colo || 'edge'}`,
      };
    }
  } catch {
    // Continue to fallback
  }

  return fallbackInfo;
}
