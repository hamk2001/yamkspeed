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
let cachedPayload: Uint8Array | null = null;
function getPayload(size: number): Uint8Array {
  const maxCached = 2 * 1024 * 1024;
  if (!cachedPayload) {
    cachedPayload = new Uint8Array(maxCached);
    // Fill with random noise once to avoid compression by middleboxes
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(cachedPayload.subarray(0, 65536)); // Seed first 64KB
      for (let i = 65536; i < maxCached; i += 65536) {
        cachedPayload.set(cachedPayload.subarray(0, Math.min(65536, maxCached - i)), i);
      }
    }
  }
  return cachedPayload.subarray(0, Math.min(size, maxCached));
}

export async function measureUpload(
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    endpoint = 'https://speed.cloudflare.com/__up',
    durationMs = 9000,
    maxBytes = 35 * 1024 * 1024,
    concurrency = 4,
    signal,
    onSample,
  } = options;

  const aggregator = new SlidingWindowAggregator('upload', 250, 2000);
  const startTime = performance.now();
  aggregator.start(startTime);

  let bytesUploaded = 0;
  let isFinished = false;
  const activeXhrs: XMLHttpRequest[] = [];

  const sampleInterval = setInterval(() => {
    if (onSample) {
      onSample(aggregator.getLiveSample(performance.now()));
    }
  }, 200);

  const payloadSizes = [
    128 * 1024,
    256 * 1024,
    512 * 1024,
    1024 * 1024,
    2 * 1024 * 1024,
  ];

  function sendXhrChunk(size: number): Promise<number> {
    return new Promise((resolve, reject) => {
      if (isFinished || signal?.aborted) {
        return reject(new DOMException('Upload aborted', 'AbortError'));
      }

      const xhr = new XMLHttpRequest();
      activeXhrs.push(xhr);
      const data = getPayload(size);

      let lastLoaded = 0;

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const delta = event.loaded - lastLoaded;
          if (delta > 0) {
            lastLoaded = event.loaded;
            bytesUploaded += delta;
            aggregator.recordBytes(delta, performance.now());

            if (bytesUploaded >= maxBytes || performance.now() - startTime >= durationMs) {
              isFinished = true;
              xhr.abort();
            }
          }
        }
      };

      xhr.onload = () => {
        const idx = activeXhrs.indexOf(xhr);
        if (idx !== -1) activeXhrs.splice(idx, 1);
        resolve(lastLoaded || size);
      };

      xhr.onerror = (e) => {
        const idx = activeXhrs.indexOf(xhr);
        if (idx !== -1) activeXhrs.splice(idx, 1);
        reject(e);
      };

      xhr.onabort = () => {
        const idx = activeXhrs.indexOf(xhr);
        if (idx !== -1) activeXhrs.splice(idx, 1);
        resolve(lastLoaded);
      };

      xhr.open('POST', endpoint, true);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');
      xhr.setRequestHeader('Cache-Control', 'no-store');

      try {
        xhr.send(data as unknown as XMLHttpRequestBodyInit);
      } catch (err) {
        reject(err);
      }
    });
  }

  async function workerStream(): Promise<void> {
    let sizeIndex = 0;

    while (!isFinished && !signal?.aborted) {
      if (performance.now() - startTime >= durationMs || bytesUploaded >= maxBytes) {
        break;
      }

      const chunkSize = payloadSizes[Math.min(sizeIndex, payloadSizes.length - 1)]!;
      sizeIndex++;

      try {
        await sendXhrChunk(chunkSize);
      } catch {
        if (signal?.aborted) break;
        // Minor chunk error, break stream
        break;
      }
    }
  }

  try {
    const streams = Array.from({ length: concurrency }, () => workerStream());
    await Promise.all(streams);
  } finally {
    isFinished = true;
    clearInterval(sampleInterval);
    activeXhrs.forEach((xhr) => {
      try {
        xhr.abort();
      } catch {
        // ignore
      }
    });
  }

  if (signal?.aborted) {
    throw new DOMException('Upload aborted', 'AbortError');
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
