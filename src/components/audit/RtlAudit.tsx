import React from 'react';
import { Download, Upload, Clock, Wifi, CheckCircle2, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatArabicPlural, formatEnglishPlural, formatBandwidth, formatLatency } from '@/i18n/plural';

export const RtlAudit: React.FC = () => {
  const sampleIps = ['192.168.43.72', '2606:4700::6810:322'];
  const sampleServers = [
    'speed.cloudflare.com',
    'mlab1-doh03.mlab-oti.measurement-lab.org (Doha, QA)',
  ];

  const arabicPluralForms = {
    zero: 'صفر اختبارات',
    one: 'اختبار واحد',
    two: 'اختباران',
    few: '{count} اختبارات',
    many: '{count} اختباراً',
    other: '{count} اختبار',
  };

  const englishPluralForms = {
    one: '{count} test',
    other: '{count} tests',
  };

  const testCounts = [0, 1, 2, 5, 15, 100];

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-8 px-4">
      <div className="border-b border-[var(--border)] pb-4">
        <h1 className="text-2xl font-bold text-[var(--text)]">
          🔍 RTL & BiDi Isolation Audit Page
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Verification of directional mirroring, numerical tabular alignment, and BiDi isolation
          for network metrics, IP addresses, and domain names.
        </p>
      </div>

      {/* 1. BiDi Isolation Test */}
      <Card variant="glass" className="space-y-4">
        <h2 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-[var(--accent-down)]" />
          1. BiDi Isolation (IP Addresses & Hostnames in RTL)
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          Addresses must never flip slashes or octets backwards when displayed inside an Arabic RTL
          sentence.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[var(--surface-2)] space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Arabic Context (RTL)
            </span>
            {sampleServers.map((srv, idx) => (
              <div key={idx} className="text-sm text-[var(--text)]" dir="rtl">
                الخادم المتصل حالياً هو:{' '}
                <span className="bidi-isolate font-mono text-[var(--accent-down)] font-semibold">
                  {srv}
                </span>
              </div>
            ))}
            {sampleIps.map((ip, idx) => (
              <div key={idx} className="text-sm text-[var(--text)]" dir="rtl">
                عنوان الآي بي المكتشف هو:{' '}
                <span className="bidi-isolate font-mono text-[var(--accent-up)] font-semibold">
                  {ip}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-2)] space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              English Context (LTR)
            </span>
            {sampleServers.map((srv, idx) => (
              <div key={idx} className="text-sm text-[var(--text)]" dir="ltr">
                Currently connected server:{' '}
                <span className="bidi-isolate font-mono text-[var(--accent-down)] font-semibold">
                  {srv}
                </span>
              </div>
            ))}
            {sampleIps.map((ip, idx) => (
              <div key={idx} className="text-sm text-[var(--text)]" dir="ltr">
                Detected client IP address:{' '}
                <span className="bidi-isolate font-mono text-[var(--accent-up)] font-semibold">
                  {ip}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* 2. Numeric & Gauge Metric Bento Cards */}
      <Card variant="glass" className="space-y-4">
        <h2 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
          <Wifi className="w-5 h-5 text-[var(--accent-up)]" />
          2. Tabular Numerals & Bento Cards
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
              <Download className="w-4 h-4 text-[var(--accent-down)]" />
              <span>Download</span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[var(--text)]">
              {formatBandwidth(245.8, 'ar')}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
              <Upload className="w-4 h-4 text-[var(--accent-up)]" />
              <span>Upload</span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[var(--text)]">
              {formatBandwidth(84.2, 'ar')}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
              <Clock className="w-4 h-4 text-[var(--accent-lat)]" />
              <span>Latency</span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[var(--text)]">
              {formatLatency(19, 'ar')}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
              <Clock className="w-4 h-4 text-[var(--accent-lat)]" />
              <span>Jitter</span>
            </div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[var(--text)]">
              {formatLatency(2.4, 'ar')}
            </div>
          </div>
        </div>
      </Card>

      {/* 3. Arabic 6 Plural Forms Demonstration */}
      <Card variant="glass" className="space-y-4">
        <h2 className="text-base font-bold text-[var(--text)]">
          3. Arabic 6-Tier Pluralization Rules
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {testCounts.map((count) => (
            <div key={count} className="p-3 rounded-lg bg-[var(--surface-2)] text-xs">
              <span className="text-[var(--text-muted)]">Count {count}: </span>
              <span className="font-semibold text-[var(--text)]">
                {formatArabicPlural(count, arabicPluralForms)}
              </span>
              <div className="text-[10px] text-[var(--text-muted)] mt-1">
                EN: {formatEnglishPlural(count, englishPluralForms)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 4. Button Directional Mirroring */}
      <Card variant="glass" className="space-y-4">
        <h2 className="text-base font-bold text-[var(--text)]">
          4. Logical Directional Button Alignment
        </h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="primary" endIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}>
            ابدأ الفحص
          </Button>
          <Button variant="secondary" startIcon={<Download className="w-4 h-4" />}>
            تنزيل التقرير
          </Button>
          <Button variant="outline">إلغاء</Button>
          <Button variant="danger">حذف السجل</Button>
        </div>
      </Card>
    </div>
  );
};
