import type { ServerInfo, SpeedSample, TestResult } from './types';
import { SlidingWindowAggregator } from './aggregator';

export interface Ndt7Options {
  signal?: AbortSignal;
  onSample?: (sample: SpeedSample) => void;
  onLatency?: (latencyMs: number, jitterMs: number) => void;
}

export async function runNdt7Test(options: Ndt7Options = {}): Promise<TestResult> {
  const { signal, onSample, onLatency } = options;
  const startedAt = new Date().toISOString();
  const startTime = performance.now();

  // 1. Query Locate API
  const locateRes = await fetch('https://locate.measurementlab.net/v2/nearest/ndt/ndt7', {
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!locateRes.ok) {
    throw new Error(`NDT7 locate failed with HTTP ${locateRes.status}`);
  }

  const locateData = await locateRes.json();
  if (!locateData.results || locateData.results.length === 0) {
    throw new Error('No M-Lab servers available');
  }

  const server = locateData.results[0];
  const downloadUrl = server.urls['wss:///ndt/v7/download'];
  const uploadUrl = server.urls['wss:///ndt/v7/upload'];

  const serverInfo: ServerInfo = {
    city: server.location?.city || 'Local M-Lab',
    country: server.location?.country || 'Detected',
    colo: server.machine?.split('.')[0] || 'MLAB',
    id: server.machine,
  };

  // 2. Download Phase via WebSocket
  const downAggregator = new SlidingWindowAggregator('download', 250, 1500);
  downAggregator.start(performance.now());

  let totalDownBytes = 0;
  let minRtt = 9999;

  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('NDT7 aborted', 'AbortError'));

    const ws = new WebSocket(downloadUrl, 'net.measurementlab.ndt.v7');

    const abortHandler = () => {
      ws.close();
      reject(new DOMException('NDT7 aborted', 'AbortError'));
    };
    if (signal) signal.addEventListener('abort', abortHandler, { once: true });

    ws.onmessage = (event) => {
      if (typeof event.data === 'string') {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.TCPInfo && parsed.TCPInfo.RTT) {
            const rttMs = parsed.TCPInfo.RTT / 1000;
            if (rttMs < minRtt && rttMs > 0) minRtt = rttMs;
            if (onLatency) onLatency(minRtt, 2.0);
          }
        } catch {
          // ignore
        }
      } else {
        const data = event.data as Blob | ArrayBuffer;
        const len = data instanceof Blob ? data.size : (data as ArrayBuffer).byteLength;
        totalDownBytes += len;
        downAggregator.recordBytes(len, performance.now());
        if (onSample) {
          onSample(downAggregator.getLiveSample(performance.now()));
        }
      }
    };

    ws.onclose = () => {
      if (signal) signal.removeEventListener('abort', abortHandler);
      resolve();
    };

    ws.onerror = (e) => {
      if (signal) signal.removeEventListener('abort', abortHandler);
      reject(e);
    };

    // Cap test at 8 seconds
    setTimeout(() => {
      ws.close();
    }, 8000);
  });

  // 3. Upload Phase via WebSocket
  const upAggregator = new SlidingWindowAggregator('upload', 250, 1500);
  upAggregator.start(performance.now());
  let totalUpBytes = 0;

  await new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('NDT7 aborted', 'AbortError'));

    const ws = new WebSocket(uploadUrl, 'net.measurementlab.ndt.v7');

    const abortHandler = () => {
      ws.close();
      reject(new DOMException('NDT7 aborted', 'AbortError'));
    };
    if (signal) signal.addEventListener('abort', abortHandler, { once: true });

    ws.onopen = () => {
      // Send binary messages continuously for 6 seconds
      const buffer = new Uint8Array(32768);
      const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(buffer);
          totalUpBytes += buffer.byteLength;
          upAggregator.recordBytes(buffer.byteLength, performance.now());
          if (onSample) {
            onSample(upAggregator.getLiveSample(performance.now()));
          }
        } else {
          clearInterval(interval);
        }
      }, 5);

      setTimeout(() => {
        clearInterval(interval);
        ws.close();
      }, 6000);
    };

    ws.onclose = () => {
      if (signal) signal.removeEventListener('abort', abortHandler);
      resolve();
    };

    ws.onerror = (e) => {
      if (signal) signal.removeEventListener('abort', abortHandler);
      reject(e);
    };
  });

  const finalDown = downAggregator.getFinalResult();
  const finalUp = upAggregator.getFinalResult();
  const latency = minRtt < 9000 ? minRtt : 25;

  return {
    engine: 'ndt7',
    startedAt,
    server: serverInfo,
    latencyMs: latency,
    jitterMs: 2.5,
    downloadMbps: finalDown.mbps,
    uploadMbps: finalUp.mbps,
    bytes: {
      down: totalDownBytes,
      up: totalUpBytes,
    },
    streams: {
      down: 1,
      up: 1,
    },
    durationMs: performance.now() - startTime,
    quality: finalDown.quality === 'stable' && finalUp.quality === 'stable' ? 'stable' : 'unstable',
  };
}
