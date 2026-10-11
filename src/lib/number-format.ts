import { usePreferencesStore } from '@/stores/preferences';

/**
 * Locale and digits-aware number formatter according to Study 04 §4.
 * Offers standard Latin numerals (0-9) by default, and Eastern Arabic-Indic numerals (٠-٩)
 * when selected in preferences during Arabic mode.
 */
export function formatLocaleNumber(
  value: number,
  options?: {
    decimals?: number;
    lang?: 'ar' | 'en';
    digits?: 'latin' | 'arabic';
  }
): string {
  const prefs = usePreferencesStore.getState();
  const activeLang = options?.lang ?? prefs.lang;
  const activeDigits = options?.digits ?? prefs.digits;
  const decimals = options?.decimals ?? 1;

  if (activeLang === 'ar' && activeDigits === 'arabic') {
    return new Intl.NumberFormat('ar-EG', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  return value.toFixed(decimals);
}
