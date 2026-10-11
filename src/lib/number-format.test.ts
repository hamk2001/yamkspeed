import { describe, it, expect } from 'vitest';
import { formatLocaleNumber } from './number-format';

describe('formatLocaleNumber Utility', () => {
  it('formats numbers with Latin digits by default in English', () => {
    const formatted = formatLocaleNumber(123.456, { decimals: 1, lang: 'en', digits: 'latin' });
    expect(formatted).toBe('123.5');
  });

  it('formats numbers with Latin digits when requested in Arabic', () => {
    const formatted = formatLocaleNumber(123.456, { decimals: 1, lang: 'ar', digits: 'latin' });
    expect(formatted).toBe('123.5');
  });

  it('formats numbers with Eastern Arabic-Indic numerals when selected in Arabic', () => {
    const formatted = formatLocaleNumber(123.4, { decimals: 1, lang: 'ar', digits: 'arabic' });
    // In Eastern Arabic-Indic: 123.4 becomes ١٢٣٫٤
    expect(formatted).toContain('١٢٣');
  });
});
