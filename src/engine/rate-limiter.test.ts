import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, recordTestStart, releaseTestLock } from './rate-limiter';
import { safeStorage } from '@/lib/storage-migration';

describe('Rate Limiter Module', () => {
  beforeEach(() => {
    safeStorage.removeItem('nabd:rate_limit:v1');
    safeStorage.removeItem('nabd:active_test_lock:v1');
  });

  it('initially allows starting a test', () => {
    const status = checkRateLimit();
    expect(status.allowed).toBe(true);
    expect(status.cooldownRemainingSeconds).toBe(0);
  });

  it('enforces 30s cooldown after recording a test and releasing lock', () => {
    const started = recordTestStart();
    expect(started).toBe(true);

    // When active test completes, lock is released
    releaseTestLock();

    const status = checkRateLimit();
    expect(status.allowed).toBe(false);
    expect(status.reason).toBe('cooldown');
    expect(status.cooldownRemainingSeconds).toBeGreaterThan(0);
    expect(status.cooldownRemainingSeconds).toBeLessThanOrEqual(30);
  });

  it('detects active multi-tab lock while test is running', () => {
    recordTestStart();
    const status = checkRateLimit();
    expect(status.allowed).toBe(false);
    expect(status.reason).toBe('multi_tab_active');

    releaseTestLock();
    // After releasing lock, cooldown remains active
    const postStatus = checkRateLimit();
    expect(postStatus.reason).toBe('cooldown');
  });
});
