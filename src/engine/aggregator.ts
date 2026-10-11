import { bytesToMbps, trimmedMean, percentile, coefficientOfVariation } from './math';
import type { SpeedSample } from './types';

export interface BucketSample {
  timestamp: number;
  bytes: number;
}

export class SlidingWindowAggregator {
  private bucketDurationMs: number;
  private warmupDurationMs: number;
  private startTime: number = 0;
  private totalBytes: number = 0;
  private buckets: BucketSample[] = [];
  private postWarmupMbps: number[] = [];
  private phase: 'download' | 'upload';

  constructor(
    phase: 'download' | 'upload',
    bucketDurationMs = 250,
    warmupDurationMs = 2000
  ) {
    this.phase = phase;
    this.bucketDurationMs = bucketDurationMs;
    this.warmupDurationMs = warmupDurationMs;
  }

  start(now = performance.now()): void {
    this.startTime = now;
    this.totalBytes = 0;
    this.buckets = [];
    this.postWarmupMbps = [];
  }

  /**
   * Records newly received or sent bytes chunk with high-precision timestamp.
   */
  recordBytes(bytes: number, now = performance.now()): void {
    if (bytes <= 0) return;
    this.totalBytes += bytes;

    const currentBucket = this.buckets[this.buckets.length - 1];
    if (currentBucket && now - currentBucket.timestamp < this.bucketDurationMs) {
      currentBucket.bytes += bytes;
    } else {
      this.buckets.push({ timestamp: now, bytes });
    }
  }

  /**
   * Generates a SpeedSample for the live UI (called ≥ 4 Hz).
   */
  getLiveSample(now = performance.now()): SpeedSample {
    const elapsed = now - this.startTime;
    const isWarmup = elapsed < this.warmupDurationMs;

    // Calculate instantaneous speed from recent buckets (last 500ms)
    const recentWindowMs = 500;
    const recentBuckets = this.buckets.filter((b) => now - b.timestamp < recentWindowMs);
    const recentBytes = recentBuckets.reduce((sum, b) => sum + b.bytes, 0);
    const effectiveWindow = Math.min(elapsed, recentWindowMs);
    const instantaneousMbps = bytesToMbps(recentBytes, effectiveWindow);

    // Cumulative post-warmup speed
    const cumulativeMbps = bytesToMbps(this.totalBytes, elapsed);

    if (!isWarmup && instantaneousMbps > 0) {
      this.postWarmupMbps.push(instantaneousMbps);
    }

    return {
      t: now,
      mbps: instantaneousMbps || cumulativeMbps,
      phase: this.phase,
      warmup: isWarmup,
      bytesTransferred: this.totalBytes,
      instantaneousMbps,
    };
  }

  /**
   * Calculates final post-warm-up trimmed speed result and stability.
   */
  getFinalResult(): {
    mbps: number;
    totalBytes: number;
    quality: 'stable' | 'unstable';
  } {
    if (this.postWarmupMbps.length === 0) {
      // If duration was short, use all recorded buckets
      const totalElapsed =
        this.buckets.length > 0
          ? this.buckets[this.buckets.length - 1]!.timestamp - this.startTime
          : 0;
      return {
        mbps: bytesToMbps(this.totalBytes, totalElapsed || 1),
        totalBytes: this.totalBytes,
        quality: 'unstable',
      };
    }

    // 90th percentile of post-warmup throughput or trimmed mean
    const trimmed = trimmedMean(this.postWarmupMbps, 0.1);
    const p90 = percentile(this.postWarmupMbps, 90);
    // Conservative honest estimate: average between trimmed mean and 90th percentile
    const finalMbps = (trimmed + p90) / 2;

    const cv = coefficientOfVariation(this.postWarmupMbps);
    const quality: 'stable' | 'unstable' = cv <= 0.35 ? 'stable' : 'unstable';

    return {
      mbps: finalMbps,
      totalBytes: this.totalBytes,
      quality,
    };
  }
}
