/**
 * Pure statistical and mathematical functions for the measurement engine.
 * STRICT POLICY: Absolutely no random simulation or synthetic smoothing.
 */

/**
 * Calculates the median of an array of numbers.
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid]!;
  }
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/**
 * Calculates trimmed mean by discarding the top and bottom trimRatio (e.g. 0.1 for 10% trim).
 */
export function trimmedMean(values: number[], trimRatio = 0.1): number {
  if (values.length === 0) return 0;
  if (values.length <= 4) {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const trimCount = Math.floor(sorted.length * trimRatio);
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
  if (trimmed.length === 0) return median(values);
  return trimmed.reduce((sum, v) => sum + v, 0) / trimmed.length;
}

/**
 * Calculates a given percentile (0 to 100) from an array of numbers.
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  const weight = rank - lower;
  if (lower === upper) return sorted[lower]!;
  return sorted[lower]! * (1 - weight) + sorted[upper]! * weight;
}

/**
 * Calculates jitter as the mean absolute difference between consecutive latency samples.
 * Follows RFC 3550 / network telemetry standard.
 */
export function calculateJitter(latencies: number[]): number {
  if (latencies.length < 2) return 0;
  let sumDiff = 0;
  for (let i = 1; i < latencies.length; i++) {
    sumDiff += Math.abs(latencies[i]! - latencies[i - 1]!);
  }
  return sumDiff / (latencies.length - 1);
}

/**
 * Discards the highest N outliers from a series (e.g., initial DNS/TLS penalty).
 */
export function discardOutliers(values: number[], discardCount = 1): number[] {
  if (values.length <= discardCount) return values;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.slice(0, sorted.length - discardCount);
}

/**
 * Computes standard deviation.
 */
export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/**
 * Calculates coefficient of variation (CV = stdDev / mean).
 * Used for stability gating (CV > 0.35 flags connection as 'unstable').
 */
export function coefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (mean <= 0) return 0;
  const std = standardDeviation(values);
  return std / mean;
}

/**
 * Converts bytes transferred over a duration (in milliseconds) to decimal Megabits per second.
 * Formula: (bytes * 8) / (durationMs * 1000)
 */
export function bytesToMbps(bytes: number, durationMs: number): number {
  if (durationMs <= 0 || bytes <= 0) return 0;
  const bits = bytes * 8;
  const seconds = durationMs / 1000;
  // Decimal megabits per second (1 Mbps = 1,000,000 bits/s)
  return bits / (seconds * 1_000_000);
}
