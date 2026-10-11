export type ArabicPluralForms = {
  zero: string;
  one: string;
  two: string;
  few: string;
  many: string;
  other: string;
};

export type EnglishPluralForms = {
  one: string;
  other: string;
};

/**
 * Returns the grammatically correct plural form for Arabic numbers according to Intl rules.
 */
export function formatArabicPlural(count: number, forms: ArabicPluralForms): string {
  const pr = new Intl.PluralRules('ar');
  const rule = pr.select(count); // 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'
  const template = forms[rule] || forms.other;
  return template.replace('{count}', count.toString());
}

/**
 * Formats an English plural string.
 */
export function formatEnglishPlural(count: number, forms: EnglishPluralForms): string {
  const pr = new Intl.PluralRules('en');
  const rule = pr.select(count);
  const template = forms[rule as keyof EnglishPluralForms] || forms.other;
  return template.replace('{count}', count.toString());
}

/**
 * Number formatter respecting locale with tabular digit alignment.
 */
export function formatNumber(value: number, locale: 'ar' | 'en', options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', options).format(value);
}

/**
 * Formats megabits per second or bytes into human readable representations.
 */
export function formatBandwidth(mbps: number, locale: 'ar' | 'en'): string {
  const formatted = mbps.toFixed(mbps >= 100 ? 0 : mbps >= 10 ? 1 : 2);
  const unit = locale === 'ar' ? 'م.بت/ث' : 'Mbps';
  return `${formatted} ${unit}`;
}

/**
 * Formats milliseconds.
 */
export function formatLatency(ms: number, locale: 'ar' | 'en'): string {
  const formatted = Math.round(ms);
  const unit = locale === 'ar' ? 'مللي ثانية' : 'ms';
  return `${formatted} ${unit}`;
}
