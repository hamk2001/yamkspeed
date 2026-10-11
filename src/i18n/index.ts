import { usePreferencesStore } from '@/stores/preferences';
import { en } from './en';
import { ar } from './ar';

export type Language = 'ar' | 'en';
export type Direction = 'rtl' | 'ltr';

const translations = { ar, en };

export function useI18n() {
  const lang = usePreferencesStore((s) => s.lang);
  const setLang = usePreferencesStore((s) => s.setLang);

  const t = translations[lang] || en;
  const dir: Direction = lang === 'ar' ? 'rtl' : 'ltr';

  const toggleLanguage = () => {
    const nextLang: Language = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
  };

  return {
    t,
    lang,
    dir,
    setLang,
    toggleLanguage,
  };
}

export { en, ar };
