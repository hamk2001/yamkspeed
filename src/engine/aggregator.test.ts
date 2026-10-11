import { describe, it, expect } from 'vitest';
import { SlidingWindowAggregator } from './aggregator';

describe('Sliding Window Aggregator', () => {
  it('correctly tracks warmup period and transitions to post-warmup', () => {
    const agg = new SlidingWindowAggregator('download', 250, 1000);
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

  it('aggregates synthetic stream of bytes to expected speed', () => {
    const agg = new SlidingWindowAggregator('download', 250, 1000);
    agg.start(0);

    // Simulate steady 100 Mbps transfer for 4 seconds (12.5 MB/s = 3.125 MB per 250ms bucket)
    const bytesPerBucket = 3_125_000;
    for (let t = 250; t <= 4000; t += 250) {
      agg.recordBytes(bytesPerBucket, t);
      agg.getLiveSample(t);
    }

    const finalResult = agg.getFinalResult();
    expect(finalResult.totalBytes).toBe(bytesPerBucket * 16);
    expect(finalResult.mbps).toBeCloseTo(100, 0);
    expect(finalResult.quality).toBe('stable');
  });
});
