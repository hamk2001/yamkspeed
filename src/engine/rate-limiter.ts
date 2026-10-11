import { safeStorage } from '@/lib/storage-migration';

export interface RateLimitStatus {
  allowed: boolean;
  reason?: 'cooldown' | 'hourly_cap' | 'multi_tab_active';
  cooldownRemainingSeconds: number;
  testsInLastHour: number;
}

const STORAGE_KEY = 'nabd:rate_limit:v1';
const LOCK_KEY = 'nabd:active_test_lock:v1';

const COOLDOWN_SECONDS = 30;
const MAX_TESTS_PER_HOUR = 20;
const LOCK_EXPIRY_MS = 60_000; // 60 seconds auto-expire if tab crashes

interface RateLimitData {
  lastTestTimestamp: number;
  recentTestTimestamps: number[];
}

function getData(): RateLimitData {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.recentTestTimestamps)) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return { lastTestTimestamp: 0, recentTestTimestamps: [] };
}

function saveData(data: RateLimitData): void {
  safeStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function checkRateLimit(): RateLimitStatus {
  const now = Date.now();

  // 1. Check Multi-tab active lock
  const lockRaw = safeStorage.getItem(LOCK_KEY);
  if (lockRaw) {
    try {
      const lock = JSON.parse(lockRaw);
      if (lock && now - lock.timestamp < LOCK_EXPIRY_MS) {
        return {
          allowed: false,
          reason: 'multi_tab_active',
          cooldownRemainingSeconds: 0,
          testsInLastHour: 0,
        };
      }
    } catch {
      // ignore
    }
  }

  const data = getData();

  // 2. Cooldown check (30s)
  const elapsedSeconds = (now - data.lastTestTimestamp) / 1000;
  if (elapsedSeconds < COOLDOWN_SECONDS) {
    const remaining = Math.ceil(COOLDOWN_SECONDS - elapsedSeconds);
    return {
      allowed: false,
      reason: 'cooldown',
      cooldownRemainingSeconds: remaining,
      testsInLastHour: data.recentTestTimestamps.length,
    };
  }

  // 3. Sliding 1-hour window check (max 20 tests/hour)
  const oneHourAgo = now - 60 * 60 * 1000;
  const filtered = data.recentTestTimestamps.filter((ts) => ts > oneHourAgo);

  if (filtered.length >= MAX_TESTS_PER_HOUR) {
    return {
      allowed: false,
      reason: 'hourly_cap',
      cooldownRemainingSeconds: 60,
      testsInLastHour: filtered.length,
    };
  }

  return {
    allowed: true,
    cooldownRemainingSeconds: 0,
    testsInLastHour: filtered.length,
  };
}

export function recordTestStart(): boolean {
  const status = checkRateLimit();
  if (!status.allowed) return false;

  const now = Date.now();
  const data = getData();
  const oneHourAgo = now - 60 * 60 * 1000;
  const filtered = data.recentTestTimestamps.filter((ts) => ts > oneHourAgo);

  filtered.push(now);

  saveData({
    lastTestTimestamp: now,
    recentTestTimestamps: filtered,
  });

  // Acquire tab lock
  safeStorage.setItem(
    LOCK_KEY,
    JSON.stringify({
      timestamp: now,
      tabId: `${now}-${performance.now()}`,
    })
  );

  return true;
}

export function releaseTestLock(): void {
  safeStorage.removeItem(LOCK_KEY);
}
