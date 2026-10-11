import { describe, it, expect, beforeEach } from 'vitest';
import { migrateStorage, safeStorage } from './storage-migration';

describe('Storage Migration Utility', () => {
  const TEST_KEY = 'test:storage:v1';

  beforeEach(() => {
    safeStorage.removeItem(TEST_KEY);
  });

  it('initializes default data when storage key is empty', () => {
    const result = migrateStorage(TEST_KEY, 1, { theme: 'dark', lang: 'ar' });
    expect(result.version).toBe(1);
    expect(result.data).toEqual({ theme: 'dark', lang: 'ar' });
  });

  it('returns existing data if already on target version', () => {
    safeStorage.setItem(
      TEST_KEY,
      JSON.stringify({
        version: 1,
        data: { theme: 'light', lang: 'en' },
        updatedAt: 1000,
      })
    );

    const result = migrateStorage(TEST_KEY, 1, { theme: 'dark', lang: 'ar' });
    expect(result.version).toBe(1);
    expect(result.data.theme).toBe('light');
    expect(result.data.lang).toBe('en');
  });

  it('runs sequential migrations from v1 to v3 correctly', () => {
    // V1 schema: { theme: 'dark' }
    safeStorage.setItem(
      TEST_KEY,
      JSON.stringify({
        version: 1,
        data: { theme: 'dark' },
        updatedAt: 1000,
      })
    );

    interface V3Schema {
      theme: string;
      lang: string;
      lightTestMode: boolean;
    }

    const migrations = [
      {
        fromVersion: 1,
        toVersion: 2,
        migrate: (data: unknown) => ({ ...(data as Record<string, unknown>), lang: 'ar' } as unknown as V3Schema),
      },
      {
        fromVersion: 2,
        toVersion: 3,
        migrate: (data: unknown) => ({ ...(data as Record<string, unknown>), lightTestMode: false } as V3Schema),
      },
    ];

    const result = migrateStorage<V3Schema>(
      TEST_KEY,
      3,
      { theme: 'dark', lang: 'ar', lightTestMode: false },
      migrations
    );
    expect(result.version).toBe(3);
    expect(result.data).toEqual({
      theme: 'dark',
      lang: 'ar',
      lightTestMode: false,
    });
  });

  it('gracefully recovers to defaults when corrupted JSON is present', () => {
    safeStorage.setItem(TEST_KEY, 'corrupted{non-json');
    const result = migrateStorage(TEST_KEY, 1, { theme: 'dark', lang: 'ar' });
    expect(result.version).toBe(1);
    expect(result.data).toEqual({ theme: 'dark', lang: 'ar' });
  });
});
