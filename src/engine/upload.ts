import { SlidingWindowAggregator } from './aggregator';
import type { SpeedSample } from './types';

export interface UploadOptions {
  endpoint?: string;
  durationMs?: number;
  maxBytes?: number;
  concurrency?: number;
  signal?: AbortSignal;
  onSample?: (sample: SpeedSample) => void;
}

export interface UploadResult {
  mbps: number;
  totalBytes: number;
  quality: 'stable' | 'unstable';
  streamsUsed: number;
  durationMs: number;
}

// Pre-allocate a 2MB binary payload once using crypto API
let cachedBlob: Blob | null = null;
function getPayload(size: number): Blob {
  const maxCached = 2 * 1024 * 1024;
  if (!cachedBlob) {
    const raw = new Uint8Array(maxCached);
    // Fill with random noise once to avoid compression by middleboxes
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(raw.subarray(0, 65536)); // Seed first 64KB
      for (let i = 65536; i < maxCached; i += 65536) {
        raw.set(raw.subarray(0, Math.min(65536, maxCached - i)), i);
      }
    }
    cachedBlob = new Blob([raw], { type: 'application/octet-stream' });
  }
  return cachedBlob.slice(0, Math.min(size, maxCached));
}

/**
 * measureUpload:
 * Measures true, server-confirmed upload throughput.
 * Uses adaptive chunk sizes and calculates speed from server HTTP 200 acknowledgements,
 * preventing local OS socket buffer inflation (Study 03 §3 #9).
 */
export async function measureUpload(
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    endpoint = 'https://speed.cloudflare.com/__up',
    durationMs = 9000,
    maxBytes = 25 * 1024 * 1024,
    concurrency = 2,
    signal,
    onSample,
  } = options;

  const aggregator = new SlidingWindowAggregator('upload', 500, 2000);
  const startTime = performance.now();
  aggregator.start(startTime);

  let bytesConfirmed = 0;
  let isFinished = false;
  const activeControllers: AbortController[] = [];

  const sampleInterval = setInterval(() => {
    if (onSample) {
      onSample(aggregator.getLiveSample(performance.now()));
    }
  }, 200);

  // Initial chunk size 128KB, adapts based on measured link speed
  let currentChunkSize = 128 * 1024;

  async function workerStream(): Promise<void> {
    while (!isFinished && !signal?.aborted) {
      const now = performance.now();
      if (now - startTime >= durationMs || bytesConfirmed >= maxBytes) {
        break;
      }

      const chunkSize = currentChunkSize;
      const payload = getPayload(chunkSize);

      const controller = new AbortController();
      activeControllers.push(controller);

      const abortHandler = () => controller.abort();
      if (signal) {
        signal.addEventListener('abort', abortHandler, { once: true });
      }

      const reqStart = performance.now();

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Cache-Control': 'no-store, no-cache',
          },
          body: payload,
          signal: controller.signal,
        });

        const reqEnd = performance.now();

        if (response.ok) {
          // Server confirmed reception of the full payload!
          const headerBytes = response.headers.get('cf-meta-upload-bytes');
          const confirmedChunkBytes = headerBytes ? parseInt(headerBytes, 10) : chunkSize;

          bytesConfirmed += confirmedChunkBytes;
          aggregator.recordBytes(confirmedChunkBytes, reqEnd);

          // Adapt next chunk size so requests complete in ~350-500ms
          const reqDurationS = (reqEnd - reqStart) / 1000;
          if (reqDurationS > 0) {
            const measuredChunkMbps = (confirmedChunkBytes * 8) / (reqDurationS * 1_000_000);
            const targetBytes = Math.round((measuredChunkMbps * 1_000_000 / 8) * 0.4);
            // Clamp between 64KB and 2MB
            currentChunkSize = Math.max(64 * 1024, Math.min(2 * 1024 * 1024, targetBytes));
          }

          if (bytesConfirmed >= maxBytes || performance.now() - startTime >= durationMs) {
            isFinished = true;
            break;
          }
        }
      } catch {
        if (signal?.aborted) break;
        // Minor network glitch on this chunk, retry with smaller chunk
        currentChunkSize = Math.max(64 * 1024, Math.floor(currentChunkSize / 2));
      } finally {
        if (signal) {
          signal.removeEventListener('abort', abortHandler);
        }
        const idx = activeControllers.indexOf(controller);
        if (idx !== -1) activeControllers.splice(idx, 1);
      }
    }
  }

  try {
    const streams = Array.from({ length: concurrency }, () => workerStream());
    await Promise.all(streams);
  } finally {
    isFinished = true;
    clearInterval(sampleInterval);
    activeControllers.forEach((c) => {
      try {
        c.abort();
      } catch {
        // ignore
      }
    });
  }

  if (signal?.aborted) {
    throw new DOMException('Upload aborted', 'AbortError');
  }

  const final = aggregator.getFinalResult(performance.now());
  const actualDurationMs = performance.now() - startTime;

  return {
    mbps: final.mbps,
    totalBytes: bytesConfirmed,
    quality: final.quality,
    streamsUsed: concurrency,
    durationMs: actualDurationMs,
  };
}
