import { CoreSpeedEngine } from './orchestrator';
import type { SpeedTestOptions } from './types';

const engine = new CoreSpeedEngine();

// Forward all engine events to main thread
engine.on('phase', (phase, progress) => {
  self.postMessage({ type: 'PHASE', phase, progress });
});

engine.on('sample', (sample) => {
  self.postMessage({ type: 'SAMPLE', sample });
});

engine.on('latencySample', (latencyMs, jitterMs) => {
  self.postMessage({ type: 'LATENCY_SAMPLE', latencyMs, jitterMs });
});

engine.on('result', (result) => {
  self.postMessage({ type: 'RESULT', result });
});

engine.on('error', (error) => {
  self.postMessage({ type: 'ERROR', error });
});

engine.on('aborted', () => {
  self.postMessage({ type: 'ABORTED' });
});

self.onmessage = async (e: MessageEvent) => {
  const { type, options } = e.data || {};
  if (type === 'START') {
    try {
      await engine.start(options as SpeedTestOptions);
    } catch {
      // Errors already dispatched via event listeners
    }
  } else if (type === 'ABORT') {
    engine.abort();
  }
};
