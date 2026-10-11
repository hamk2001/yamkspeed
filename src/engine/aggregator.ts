import { bytesToMbps, trimmedMean, coefficientOfVariation } from './math';
import type { SpeedSample } from './types';

export interface BucketSample {
  timestamp: number;
  bytes: number;
}

/**
 * SlidingWindowAggregator:
 * Computes live rates and final sustained throughput with zero double-counting
 * and rigorous post-warmup statistical analysis.
 */
export class SlidingWindowAggregator {
  private sliceDurationMs: number;
  private warmupDurationMs: number;
  private startTime: number = 0;
  private totalBytes: number = 0;
  private warmupBytes: number = 0;
  private warmupEnded: boolean = false;
  private warmupEndTime: number = 0;
  private phase: 'download' | 'upload';

  // Contiguous non-overlapping post-warmup time slices
  private currentSliceBytes: number = 0;
  private currentSliceStart: number = 0;
  private postWarmupSlices: number[] = [];

  // Live sampling with EMA smoothing
  private liveRateMbps: number = 0;
  private lastLiveTime: number = 0;
  private lastLiveBytes: number = 0;

  constructor(
    phase: 'download' | 'upload',
    sliceDurationMs = 500,
    warmupDurationMs = 2000
  ) {
    this.phase = phase;
    this.sliceDurationMs = sliceDurationMs;
    this.warmupDurationMs = warmupDurationMs;
  }

  start(now = performance.now()): void {
    this.startTime = now;
    this.totalBytes = 0;
    this.warmupBytes = 0;
    this.warmupEnded = this.warmupDurationMs <= 0;
    this.warmupEndTime = now;
    this.currentSliceBytes = 0;
    this.currentSliceStart = now;
    this.postWarmupSlices = [];
    this.liveRateMbps = 0;
    this.lastLiveTime = now;
    this.lastLiveBytes = 0;
  }

  /**
   * Records newly received or sent bytes chunk with high-precision timestamp.
   * Every byte is strictly counted once in its exact time slice.
   */
  recordBytes(bytes: number, now = performance.now()): void {
    if (bytes <= 0) return;
    this.totalBytes += bytes;

    // Transition from warmup to active measurement
    if (!this.warmupEnded) {
      if (now - this.startTime >= this.warmupDurationMs) {
        this.warmupEnded = true;
        this.warmupEndTime = now;
        this.warmupBytes = this.totalBytes;
        this.currentSliceStart = now;
        this.currentSliceBytes = 0;
      }
      return;
    }

    this.currentSliceBytes += bytes;

    // When current contiguous slice window closes, record its throughput
    if (now - this.currentSliceStart >= this.sliceDurationMs) {
      const durationS = (now - this.currentSliceStart) / 1000;
      if (durationS > 0) {
        const sliceMbps = bytesToMbps(this.currentSliceBytes, durationS * 1000);
        this.postWarmupSlices.push(sliceMbps);
      }
      this.currentSliceStart = now;
      this.currentSliceBytes = 0;
    }
  }

  /**
   * Generates a SpeedSample for the live UI (called ≥ 4 Hz).
   */
  getLiveSample(now = performance.now()): SpeedSample {
    const elapsed = now - this.startTime;
    const isWarmup = elapsed < this.warmupDurationMs;

    const dtSeconds = (now - this.lastLiveTime) / 1000;
    const dbBytes = this.totalBytes - this.lastLiveBytes;

    if (dtSeconds >= 0.15) {
      const instMbps = bytesToMbps(dbBytes, dtSeconds * 1000);
      if (this.liveRateMbps === 0) {
        this.liveRateMbps = instMbps;
      } else {
        // Exponential Moving Average (EMA) with alpha=0.55 for smooth, responsive gauge
        this.liveRateMbps = 0.55 * instMbps + 0.45 * this.liveRateMbps;
      }
      this.lastLiveTime = now;
      this.lastLiveBytes = this.totalBytes;
    }

    return {
      t: now,
      mbps: Math.max(0, this.liveRateMbps),
      phase: this.phase,
      warmup: isWarmup,
      bytesTransferred: this.totalBytes,
      instantaneousMbps: this.liveRateMbps,
    };
  }

  /**
   * Calculates final post-warm-up trimmed speed result and stability.
   */
  getFinalResult(now = performance.now()): {
    mbps: number;
    totalBytes: number;
    quality: 'stable' | 'unstable';
  } {
    const postWarmupDurationMs = this.warmupEnded
      ? Math.max(1, now - this.warmupEndTime)
      : Math.max(1, now - this.startTime);

    const postWarmupBytes = this.warmupEnded
      ? Math.max(0, this.totalBytes - this.warmupBytes)
      : this.totalBytes;

    // Flush any pending slice
    if (this.warmupEnded && this.currentSliceBytes > 0) {
      const sliceDurationS = (now - this.currentSliceStart) / 1000;
      if (sliceDurationS > 0.1) {
        const sliceMbps = bytesToMbps(this.currentSliceBytes, sliceDurationS * 1000);
        this.postWarmupSlices.push(sliceMbps);
      }
    }

    // Exact sustained wire speed over the entire post-warmup period
    const sustainedMbps = bytesToMbps(postWarmupBytes, postWarmupDurationMs);

    let finalMbps = sustainedMbps;

    // If we have enough contiguous slices, blend with trimmed mean to filter brief network hiccups
    if (this.postWarmupSlices.length >= 4) {
      const trimmed = trimmedMean(this.postWarmupSlices, 0.1);
      finalMbps = sustainedMbps * 0.75 + trimmed * 0.25;
    }

    const cv =
      this.postWarmupSlices.length >= 2
        ? coefficientOfVariation(this.postWarmupSlices)
        : 0;
    const quality: 'stable' | 'unstable' = cv <= 0.35 ? 'stable' : 'unstable';

    return {
      mbps: Math.max(0, finalMbps),
      totalBytes: this.totalBytes,
      quality,
    };
  }
}
