import { describe, it, expect } from 'vitest';
import {
  median,
  trimmedMean,
  percentile,
  calculateJitter,
  discardOutliers,
  standardDeviation,
  coefficientOfVariation,
  bytesToMbps,
} from './math';

describe('Engine Math & Statistics Module', () => {
  it('calculates median for odd and even length arrays', () => {
    expect(median([10, 20, 30])).toBe(20);
    expect(median([10, 20, 30, 40])).toBe(25);
    expect(median([])).toBe(0);
  });

  it('calculates trimmed mean correctly', () => {
    const samples = [10, 50, 52, 53, 54, 55, 56, 57, 58, 200];
    const tm = trimmedMean(samples, 0.1); // drops 10 and 200: (50+52+53+54+55+56+57+58)/8 = 54.375
    expect(tm).toBeCloseTo(54.375, 2);
  });

  it('calculates 90th percentile accurately', () => {
    const data = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const p90 = percentile(data, 90);
    expect(p90).toBe(91);
  });

  it('calculates jitter according to mean absolute difference', () => {
    // 20ms, 25ms (diff 5), 23ms (diff 2), 29ms (diff 6) -> (5 + 2 + 6) / 3 = 13 / 3 = 4.33ms
    const latencies = [20, 25, 23, 29];
    expect(calculateJitter(latencies)).toBeCloseTo(4.333, 2);
  });

  it('discards worst outliers from latency series', () => {
    const latencies = [15, 16, 17, 95];
    const filtered = discardOutliers(latencies, 1);
    expect(filtered).toEqual([15, 16, 17]);
  });

  it('computes standard deviation and coefficient of variation', () => {
    const values = [100, 102, 98, 101, 99];
    const std = standardDeviation(values);
    expect(std).toBeLessThan(2);
    const cv = coefficientOfVariation(values);
    expect(cv).toBeLessThan(0.05); // very stable
  });

  it('converts bytes transferred over time to decimal Mbps (1,000,000 bits/s)', () => {
    // 12,500,000 bytes (12.5 MB) in 1 second = 100,000,000 bits = 100 Mbps
    const mbps = bytesToMbps(12_500_000, 1000);
    expect(mbps).toBe(100);
  });
});
