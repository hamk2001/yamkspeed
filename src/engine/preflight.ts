import type { SpeedTestError } from './types';

export interface PreflightResult {
  ok: boolean;
  error?: SpeedTestError;
}

/**
 * Pre-flight network verification to detect captive portals, blocked hosts, and 429s.
 */
export async function runPreflightCheck(
  probeUrl = 'https://speed.cloudflare.com/__down?bytes=0',
  signal?: AbortSignal
): Promise<PreflightResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      ok: false,
      error: {
        code: 'OFFLINE',
        message: 'Device is offline.',
        phase: 'locating',
        retryable: true,
      },
    };
  }

  try {
    const cacheBuster = `${Date.now()}-${performance.now()}`;
    const url = new URL(probeUrl);
    url.searchParams.set('_cb', cacheBuster);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    // Merge external abort signal if provided
    if (signal) {
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/octet-stream, application/json, */*',
        'Cache-Control': 'no-store, no-cache',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 429) {
      return {
        ok: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Endpoint rate limited (HTTP 429). Please wait before retesting.',
          phase: 'locating',
          retryable: true,
        },
      };
    }

    const contentType = (response.headers.get('content-type') || '').toLowerCase();

    // Captive portal returns an HTML redirection/login page instead of binary or JSON
    if (contentType.includes('text/html')) {
      const text = await response.text();
      if (
        text.includes('<html') ||
        text.includes('<form') ||
        text.includes('login') ||
        text.includes('portal')
      ) {
        return {
          ok: false,
          error: {
            code: 'CAPTIVE_PORTAL',
            message: 'Captive portal login detected. Please sign in to your network.',
            phase: 'locating',
            retryable: true,
          },
        };
      }
    }

    if (!response.ok && response.status !== 200) {
      return {
        ok: false,
        error: {
          code: 'ENDPOINT_UNREACHABLE',
          message: `Endpoint returned HTTP status ${response.status}`,
          phase: 'locating',
          retryable: true,
        },
      };
    }

    return { ok: true };
  } catch (err: unknown) {
    if (signal?.aborted) {
      return {
        ok: false,
        error: {
          code: 'ABORTED',
          message: 'Test was aborted by user.',
          phase: 'locating',
          retryable: false,
        },
      };
    }

    const message = err instanceof Error ? err.message : 'Network unreachable';
    return {
      ok: false,
      error: {
        code: 'ENDPOINT_UNREACHABLE',
        message: `Network probe failed: ${message}`,
        phase: 'locating',
        retryable: true,
      },
    };
  }
}
