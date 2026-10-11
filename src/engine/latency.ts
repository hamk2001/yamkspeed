import { median, calculateJitter, discardOutliers } from './math';

export interface LatencyResult {
  latencyMs: number;
  jitterMs: number;
  samples: number[];
}

export interface LatencyOptions {
  sampleCount?: number;
  endpoint?: string;
  signal?: AbortSignal;
  onSample?: (latencyMs: number, jitterMs: number) => void;
}

export async function measureLatency(
  options: LatencyOptions = {}
): Promise<LatencyResult> {
  const {
    sampleCount = 20,
    endpoint = 'https://speed.cloudflare.com/__down?bytes=0',
    signal,
    onSample,
  } = options;

  const samples: number[] = [];

  for (let i = 0; i < sampleCount; i++) {
    if (signal?.aborted) {
      throw new DOMException('Latency measurement aborted', 'AbortError');
    }

    const cacheBuster = `${Date.now()}-${i}-${performance.now()}`;
    const url = new URL(endpoint);
    url.searchParams.set('_cb', cacheBuster);

    const t0 = performance.now();
    try {
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Cache-Control': 'no-store, no-cache' },
        signal,
      });

      if (!res.ok && res.status !== 200) {
        continue;
      }

      await res.arrayBuffer();
      const rtt = performance.now() - t0;
      samples.push(rtt);

      if (onSample) {
        const curMedian = median(samples);
        const curJitter = calculateJitter(samples);
        onSample(curMedian, curJitter);
      }

      // 50ms pause between pings to avoid burst queuing
      await new Promise((r) => setTimeout(r, 50));
    } catch {
      if (signal?.aborted) {
        throw new DOMException('Latency measurement aborted', 'AbortError');
      }
      // If single request fails, continue gathering other samples
    }
  }

  if (samples.length === 0) {
    throw new Error('All latency measurement probes failed');
  }

  // Discard the worst outlier (e.g. initial connection/TLS penalty)
  const cleanedSamples = discardOutliers(samples, 1);
  const finalLatency = median(cleanedSamples);
  const finalJitter = calculateJitter(cleanedSamples);

  return {
    latencyMs: finalLatency,
    jitterMs: finalJitter,
    samples: cleanedSamples,
  };
}
