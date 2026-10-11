import { create } from 'zustand';
import { safeStorage } from '@/lib/storage-migration';

export type Theme = 'dark' | 'light';
export type Language = 'ar' | 'en';

export type SpeedUnit = 'mbps' | 'MBps';
export type DigitFormat = 'latin' | 'arabic';

export interface PreferencesState {
  theme: Theme;
  lang: Language;
  speedUnit: SpeedUnit;
  digits: DigitFormat;
  lightTestMode: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLang: (lang: Language) => void;
  setSpeedUnit: (unit: SpeedUnit) => void;
  setDigits: (digits: DigitFormat) => void;
  setLightTestMode: (enabled: boolean) => void;
}

const STORAGE_KEY = 'nabd:prefs:v1';

function applyDocumentAttributes(theme: Theme, lang: Language) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.setAttribute('lang', lang);
  root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', theme === 'dark' ? '#070B14' : '#F6F3EC');
  }
}

function loadInitialPreferences(): {
  theme: Theme;
  lang: Language;
  speedUnit: SpeedUnit;
  digits: DigitFormat;
  lightTestMode: boolean;
} {
  const fallback = {
    theme: 'dark' as Theme,
    lang: 'ar' as Language,
    speedUnit: 'mbps' as SpeedUnit,
    digits: 'latin' as DigitFormat,
    lightTestMode: false,
  };

  try {
    const raw = safeStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const theme = parsed.theme === 'light' ? 'light' : 'dark';
        const lang = parsed.lang === 'en' ? 'en' : 'ar';
        const speedUnit = parsed.speedUnit === 'MBps' ? 'MBps' : 'mbps';
        const digits = parsed.digits === 'arabic' ? 'arabic' : 'latin';
        const lightTestMode = Boolean(parsed.lightTestMode);
        return { theme, lang, speedUnit, digits, lightTestMode };
      }
    }
  } catch {
    // ignore
  }

  // Detect system preferences if no stored setting
  if (typeof window !== 'undefined') {
    const systemPrefersDark =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    fallback.theme = systemPrefersDark ? 'dark' : 'light';
    const browserLang = (navigator.language || '').toLowerCase();
    fallback.lang = browserLang.startsWith('ar') ? 'ar' : 'en';
  }

  return fallback;
}

const initial = loadInitialPreferences();
applyDocumentAttributes(initial.theme, initial.lang);

export const usePreferencesStore = create<PreferencesState>((set, get) => {
  const save = (state: {
    theme: Theme;
    lang: Language;
    speedUnit: SpeedUnit;
    digits: DigitFormat;
    lightTestMode: boolean;
  }) => {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    applyDocumentAttributes(state.theme, state.lang);
  };

  return {
    theme: initial.theme,
    lang: initial.lang,
    speedUnit: initial.speedUnit,
    digits: initial.digits,
    lightTestMode: initial.lightTestMode,

    setTheme: (theme: Theme) => {
      // Support View Transitions API for theme change animation if available
      const update = () => {
        set((s) => {
          const next = { ...s, theme };
          save(next);
          return { theme };
        });
      };

      if (
        typeof document !== 'undefined' &&
        'startViewTransition' in document &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(update);
      } else {
        update();
      }
    },

    toggleTheme: () => {
      const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
      get().setTheme(nextTheme);
    },

    setLang: (lang: Language) => {
      set((s) => {
        const next = { ...s, lang };
        save(next);
        return { lang };
      });
    },

    setSpeedUnit: (speedUnit: SpeedUnit) => {
      set((s) => {
        const next = { ...s, speedUnit };
        save(next);
        return { speedUnit };
      });
    },

    setDigits: (digits: DigitFormat) => {
      set((s) => {
        const next = { ...s, digits };
        save(next);
        return { digits };
      });
    },

    setLightTestMode: (lightTestMode: boolean) => {
      set((s) => {
        const next = { ...s, lightTestMode };
        save(next);
        return { lightTestMode };
      });
    },
  };
});

// Multi-tab synchronization
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const updated = JSON.parse(e.newValue);
        if (updated.theme) usePreferencesStore.getState().setTheme(updated.theme);
        if (updated.lang) usePreferencesStore.getState().setLang(updated.lang);
      } catch {
        // ignore
      }
    }
  });
}
