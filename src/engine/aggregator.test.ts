import { describe, it, expect } from 'vitest';
import { SlidingWindowAggregator } from './aggregator';

describe('Sliding Window Aggregator', () => {
  it('correctly tracks warmup period and transitions to post-warmup', () => {
    const agg = new SlidingWindowAggregator('download', 500, 1000);
    agg.start(1000);

    // Warmup period (t = 1500 < 2000)
    agg.recordBytes(125000, 1500);
    const sample1 = agg.getLiveSample(1500);
    expect(sample1.warmup).toBe(true);

    // Post-warmup period (t = 2500 > 2000)
    agg.recordBytes(250000, 2500);
    const sample2 = agg.getLiveSample(2500);
    expect(sample2.warmup).toBe(false);
  });

  it('aggregates steady stream of bytes to exact expected speed', () => {
    const agg = new SlidingWindowAggregator('download', 500, 1000);
    agg.start(0);

    // Simulate steady 100 Mbps transfer for 4 seconds (12.5 MB/s = 6.25 MB per 500ms slice)
    const bytesPerSlice = 6_250_000;
    for (let t = 250; t <= 4000; t += 250) {
      agg.recordBytes(bytesPerSlice / 2, t);
      agg.getLiveSample(t);
    }

    const finalResult = agg.getFinalResult(4000);
    expect(finalResult.totalBytes).toBe(bytesPerSlice * 8);
    expect(finalResult.mbps).toBeCloseTo(100, 0);
    expect(finalResult.quality).toBe('stable');
  });

  it('does not inflate throughput on bursty packet arrivals (4.5 Mbps test)', () => {
    const agg = new SlidingWindowAggregator('download', 500, 2000);
    agg.start(0);

    // Total actual wire speed: 4.5 Mbps = 562.5 KB/s
    // Arriving in 281.25 KB bursts every 500ms
    let nextT = 500;
    for (let t = 0; t <= 8000; t += 200) {
      if (t >= nextT) {
        agg.recordBytes(281250, t);
        nextT += 500;
      }
      agg.getLiveSample(t);
    }

    const finalResult = agg.getFinalResult(8000);
    // Must be close to 4.5 Mbps (within ±5%), NOT 12.5 Mbps!
    expect(finalResult.mbps).toBeGreaterThan(4.2);
    expect(finalResult.mbps).toBeLessThan(4.8);
  });
});
