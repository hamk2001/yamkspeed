/**
 * Schema-versioned LocalStorage migration utility.
 * Protects user preferences and history across schema upgrades without data loss.
 */

export interface MigrationPlan<T = unknown> {
  fromVersion: number;
  toVersion: number;
  migrate: (data: unknown) => T;
}

export interface StorageContainer<T = unknown> {
  version: number;
  data: T;
  updatedAt: number;
}

export class SafeStorage {
  private memoryFallback: Map<string, string> = new Map();

  isAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getItem(key: string): string | null {
    try {
      if (this.isAvailable()) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Fallback on security/quota errors
    }
    return this.memoryFallback.get(key) || null;
  }

  setItem(key: string, value: string): void {
    try {
      if (this.isAvailable()) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Quota exceeded or private browsing restrictions
    }
    this.memoryFallback.set(key, value);
  }

  removeItem(key: string): void {
    try {
      if (this.isAvailable()) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
    this.memoryFallback.delete(key);
  }
}

export const safeStorage = new SafeStorage();

/**
 * Reads a versioned storage key, applies migrations sequentially up to targetVersion.
 */
export function migrateStorage<T>(
  key: string,
  targetVersion: number,
  defaultData: T,
  migrations: MigrationPlan<T>[] = []
): StorageContainer<T> {
  const raw = safeStorage.getItem(key);
  if (!raw) {
    const fresh: StorageContainer<T> = {
      version: targetVersion,
      data: defaultData,
      updatedAt: Date.now(),
    };
    safeStorage.setItem(key, JSON.stringify(fresh));
    return fresh;
  }

  try {
    const parsed = JSON.parse(raw);
    let currentVersion = typeof parsed.version === 'number' ? parsed.version : 0;
    let currentData = (parsed.data !== undefined ? parsed.data : parsed) as T;

    if (currentVersion === targetVersion) {
      return {
        version: targetVersion,
        data: currentData,
        updatedAt: parsed.updatedAt || Date.now(),
      };
    }

    // Sort migrations in ascending order
    const sorted = [...migrations].sort((a, b) => a.fromVersion - b.fromVersion);

    for (const plan of sorted) {
      if (plan.fromVersion === currentVersion && plan.toVersion <= targetVersion) {
        currentData = plan.migrate(currentData);
        currentVersion = plan.toVersion;
      }
    }

    const migratedContainer: StorageContainer<T> = {
      version: targetVersion,
      data: currentData,
      updatedAt: Date.now(),
    };

    safeStorage.setItem(key, JSON.stringify(migratedContainer));
    return migratedContainer;
  } catch (err) {
    console.warn(`[SafeStorage] Failed to parse or migrate ${key}, resetting to defaults:`, err);
    const reset: StorageContainer<T> = {
      version: targetVersion,
      data: defaultData,
      updatedAt: Date.now(),
    };
    safeStorage.setItem(key, JSON.stringify(reset));
    return reset;
  }
}
