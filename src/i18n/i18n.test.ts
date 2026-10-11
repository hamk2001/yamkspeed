import { describe, it, expect } from 'vitest';
import { en } from './en';
import { ar } from './ar';
import { formatArabicPlural, formatEnglishPlural, formatBandwidth, formatLatency } from './plural';

describe('i18n Key Parity & Pluralization', () => {
  it('en and ar have identical top-level and nested key structures', () => {
    function getKeys(obj: Record<string, unknown>, prefix = ''): string[] {
      return Object.keys(obj).flatMap((key) => {
        const val = obj[key];
        const nextPrefix = prefix ? `${prefix}.${key}` : key;
        return typeof val === 'object' && val !== null
          ? getKeys(val as Record<string, unknown>, nextPrefix)
          : [nextPrefix];
      });
    }

    const enKeys = getKeys(en as unknown as Record<string, unknown>).sort();
    const arKeys = getKeys(ar as unknown as Record<string, unknown>).sort();

    expect(enKeys).toEqual(arKeys);
  });

  it('correctly handles all 6 Arabic plural forms', () => {
    const arabicForms = {
      zero: 'صفر اختبارات',
      one: 'اختبار واحد',
      two: 'اختباران',
      few: '{count} اختبارات',
      many: '{count} اختباراً',
      other: '{count} اختبار',
    };

    expect(formatArabicPlural(0, arabicForms)).toBe('صفر اختبارات');
    expect(formatArabicPlural(1, arabicForms)).toBe('اختبار واحد');
    expect(formatArabicPlural(2, arabicForms)).toBe('اختباران');
    expect(formatArabicPlural(3, arabicForms)).toBe('3 اختبارات');
    expect(formatArabicPlural(10, arabicForms)).toBe('10 اختبارات');
    expect(formatArabicPlural(11, arabicForms)).toBe('11 اختباراً');
    expect(formatArabicPlural(99, arabicForms)).toBe('99 اختباراً');
    expect(formatArabicPlural(100, arabicForms)).toBe('100 اختبار');
  });

  it('correctly handles English plural forms', () => {
    const englishForms = {
      one: '{count} test',
      other: '{count} tests',
    };

    expect(formatEnglishPlural(1, englishForms)).toBe('1 test');
    expect(formatEnglishPlural(5, englishForms)).toBe('5 tests');
  });

  it('formats bandwidth and latency localized strings correctly', () => {
    expect(formatBandwidth(85.456, 'en')).toBe('85.5 Mbps');
    expect(formatBandwidth(85.456, 'ar')).toBe('85.5 م.بت/ث');
    expect(formatLatency(18.4, 'en')).toBe('18 ms');
    expect(formatLatency(18.4, 'ar')).toBe('18 مللي ثانية');
  });
});
