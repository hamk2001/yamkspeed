import { SlidingWindowAggregator } from './aggregator';
import type { SpeedSample } from './types';

export interface DownloadOptions {
  endpoint?: string;
  durationMs?: number; // 8,000 - 12,000 ms normal, ~5,000 ms light
  maxBytes?: number; // 50MB normal, 10MB light
  concurrency?: number; // 4 - 8 streams
  signal?: AbortSignal;
  onSample?: (sample: SpeedSample) => void;
}

export interface DownloadResult {
  mbps: number;
  totalBytes: number;
  quality: 'stable' | 'unstable';
  streamsUsed: number;
  durationMs: number;
}

export async function measureDownload(
  options: DownloadOptions = {}
): Promise<DownloadResult> {
  const {
    endpoint = 'https://speed.cloudflare.com/__down',
    durationMs = 9000,
    maxBytes = 50 * 1024 * 1024,
    concurrency = 4,
    signal,
    onSample,
  } = options;

  const aggregator = new SlidingWindowAggregator('download', 250, 2000);
  const startTime = performance.now();
  aggregator.start(startTime);

  let bytesDownloaded = 0;
  let isFinished = false;
  const activeControllers: AbortController[] = [];

  // Interval timer for ≥ 4 Hz live sample emission
  const sampleInterval = setInterval(() => {
    if (onSample) {
      onSample(aggregator.getLiveSample(performance.now()));
    }
  }, 200);

  // Progressive payload sizes: start small (250KB), then 1MB, 5MB, 10MB
  const payloadSizes = [
    250 * 1024,
    500 * 1024,
    1024 * 1024,
    2 * 1024 * 1024,
    5 * 1024 * 1024,
    10 * 1024 * 1024,
  ];

  async function workerStream(streamIndex: number): Promise<void> {
    let sizeIndex = 0;

    while (!isFinished && !signal?.aborted) {
      const now = performance.now();
      if (now - startTime >= durationMs || bytesDownloaded >= maxBytes) {
        break;
      }

      const chunkSize = payloadSizes[Math.min(sizeIndex, payloadSizes.length - 1)]!;
      sizeIndex++;

      const childController = new AbortController();
      activeControllers.push(childController);

      const abortHandler = () => childController.abort();
      if (signal) {
        signal.addEventListener('abort', abortHandler, { once: true });
      }

      try {
        const url = new URL(endpoint);
        url.searchParams.set('bytes', chunkSize.toString());
        url.searchParams.set('_s', `${streamIndex}-${Date.now()}-${performance.now()}`);

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: { 'Cache-Control': 'no-store, no-cache' },
          signal: childController.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP error ${response.status}`);
        }

        const reader = response.body.getReader();

        while (!isFinished && !signal?.aborted) {
          const { done, value } = await reader.read();
          if (done) break;

          if (value && value.byteLength > 0) {
            const len = value.byteLength;
            bytesDownloaded += len;
            aggregator.recordBytes(len, performance.now());

            if (bytesDownloaded >= maxBytes || performance.now() - startTime >= durationMs) {
              isFinished = true;
              reader.cancel().catch(() => {});
              break;
            }
          }
        }
      } catch {
        if (signal?.aborted) {
          throw new DOMException('Download aborted', 'AbortError');
        }
        // Transient stream error, will exit loop
        break;
      } finally {
        if (signal) {
          signal.removeEventListener('abort', abortHandler);
        }
        const idx = activeControllers.indexOf(childController);
        if (idx !== -1) activeControllers.splice(idx, 1);
      }
    }
  }

  try {
    const streams = Array.from({ length: concurrency }, (_, i) => workerStream(i));
    await Promise.all(streams);
  } finally {
    isFinished = true;
    clearInterval(sampleInterval);
    // Abort all in-flight stream requests cleanly
    activeControllers.forEach((c) => {
      try {
        c.abort();
      } catch {
        // ignore
      }
    });
  }

  if (signal?.aborted) {
    throw new DOMException('Download aborted', 'AbortError');
  }

  const final = aggregator.getFinalResult();
  const actualDurationMs = performance.now() - startTime;

  return {
    mbps: final.mbps,
    totalBytes: final.totalBytes,
    quality: final.quality,
    streamsUsed: concurrency,
    durationMs: actualDurationMs,
  };
}
