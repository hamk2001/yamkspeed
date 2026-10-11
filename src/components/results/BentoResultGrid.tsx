import React, { useState } from 'react';
import {
  Download,
  Upload,
  Activity,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Server,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { TestResult, Phase } from '@/engine/types';
import { useI18n } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences';
import { formatLocaleNumber } from '@/lib/number-format';

export interface BentoResultGridProps {
  phase: Phase;
  liveSpeed: number;
  liveLatency: number;
  liveJitter: number;
  finalResult: TestResult | null;
  onOpenMethodology?: () => void;
}

function calculateBufferbloatGrade(
  idleMs: number,
  loadedDownMs?: number,
  loadedUpMs?: number
): { grade: string; color: string; descEn: string; descAr: string; delta: number } {
  const deltaDown = loadedDownMs !== undefined ? Math.max(0, loadedDownMs - idleMs) : 0;
  const deltaUp = loadedUpMs !== undefined ? Math.max(0, loadedUpMs - idleMs) : 0;
  const maxDelta = Math.max(deltaDown, deltaUp);

  if (maxDelta <= 5) {
    return {
      grade: 'A+',
      color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
      descEn: 'Minimal delay under load; ideal for competitive gaming.',
      descAr: 'استجابة فائقة تحت الضغط؛ مثالية للألعاب التنافسية والمكالمات.',
      delta: maxDelta,
    };
  }
  if (maxDelta <= 15) {
    return {
      grade: 'A',
      color: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
      descEn: 'Low queue delay; smooth streaming and gaming.',
      descAr: 'تأخير منخفض جداً؛ أداء ممتاز للبث والألعاب.',
      delta: maxDelta,
    };
  }
  if (maxDelta <= 35) {
    return {
      grade: 'B',
      color: 'text-teal-400 border-teal-500/40 bg-teal-500/10',
      descEn: 'Acceptable buffer latency; slight lag spikes possible.',
      descAr: 'تأخير مقبول في المخزن المؤقت؛ قد تظهر تقلبات طفيفة.',
      delta: maxDelta,
    };
  }
  if (maxDelta <= 75) {
    return {
      grade: 'C',
      color: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
      descEn: 'Noticeable bufferbloat during heavy downloads.',
      descAr: 'تضخم ملحوظ في المخزن المؤقت أثناء التنزيل الكثيف.',
      delta: maxDelta,
    };
  }
  if (maxDelta <= 150) {
    return {
      grade: 'D',
      color: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
      descEn: 'High latency increase under load.',
      descAr: 'ارتفاع كبير في زمن الاستجابة عند تشارك الاتصال.',
      delta: maxDelta,
    };
  }
  return {
    grade: 'F',
    color: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
    descEn: 'Severe bufferbloat; router queue management recommended (SQM).',
    descAr: 'تضخم حاد في المودم؛ يوصى بتفعيل إدارة الطوابير الذكية (SQM).',
    delta: maxDelta,
  };
}

export const BentoResultGrid: React.FC<BentoResultGridProps> = ({
  phase,
  liveSpeed,
  liveLatency,
  liveJitter,
  finalResult,
  onOpenMethodology,
}) => {
  const { t, lang } = useI18n();
  const { speedUnit, digits } = usePreferencesStore();
  const [copied, setCopied] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const isMBps = speedUnit === 'MBps';
  const unitLabel = isMBps ? t.metrics.mbpsBytes : t.metrics.mbps;

  const formatSpeed = (valMbps: number) => {
    const converted = isMBps ? valMbps / 8 : valMbps;
    return formatLocaleNumber(converted, { decimals: 1, lang, digits });
  };

  const downloadVal = finalResult
    ? formatSpeed(finalResult.downloadMbps)
    : phase === 'download' && liveSpeed > 0
      ? formatSpeed(liveSpeed)
      : '--';

  const uploadVal = finalResult
    ? formatSpeed(finalResult.uploadMbps)
    : phase === 'upload' && liveSpeed > 0
      ? formatSpeed(liveSpeed)
      : '--';

  const latencyVal = finalResult
    ? formatLocaleNumber(finalResult.latencyMs, { decimals: 0, lang, digits })
    : liveLatency > 0
      ? formatLocaleNumber(liveLatency, { decimals: 0, lang, digits })
      : '--';

  const jitterVal = finalResult
    ? formatLocaleNumber(finalResult.jitterMs, { decimals: 1, lang, digits })
    : liveJitter > 0
      ? formatLocaleNumber(liveJitter, { decimals: 1, lang, digits })
      : '--';

  const bufferbloat = finalResult?.loadedLatencyMs
    ? calculateBufferbloatGrade(
        finalResult.latencyMs,
        finalResult.loadedLatencyMs.down,
        finalResult.loadedLatencyMs.up
      )
    : null;

  const handleCopySummary = async () => {
    if (!finalResult) return;
    const summary = `⚡ YamkSpeed Benchmark:
• Download: ${formatSpeed(finalResult.downloadMbps)} ${unitLabel}
• Upload: ${formatSpeed(finalResult.uploadMbps)} ${unitLabel}
• Latency: ${finalResult.latencyMs.toFixed(0)} ms (Jitter: ${finalResult.jitterMs.toFixed(1)} ms)
• Server: ${finalResult.server.city || 'Edge'}, ${finalResult.server.country || ''}
• Engine: ${finalResult.engine} (${finalResult.quality})
• Timestamp: ${new Date(finalResult.startedAt).toLocaleString()}`;

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="w-full space-y-4 select-none">
      {/* 4 Core Metric Cards (Bento) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full">
        {/* Download Card */}
        <Card
          variant={phase === 'download' ? 'interactive' : 'glass'}
          className={`flex flex-col justify-between transition-all duration-300 ${
            phase === 'download' ? 'border-[var(--accent-down)] shadow-lg shadow-[var(--accent-down)]/10' : ''
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] mb-2">
            <Download className="w-4 h-4 text-[var(--accent-down)]" />
            <span>{t.metrics.download}</span>
          </div>
          <div
            dir="ltr"
            className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[var(--text)] tracking-tight"
          >
            {downloadVal}
          </div>
          <div className="text-[11px] font-medium text-[var(--text-muted)] mt-1">{unitLabel}</div>
        </Card>

        {/* Upload Card */}
        <Card
          variant={phase === 'upload' ? 'interactive' : 'glass'}
          className={`flex flex-col justify-between transition-all duration-300 ${
            phase === 'upload' ? 'border-[var(--accent-up)] shadow-lg shadow-[var(--accent-up)]/10' : ''
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] mb-2">
            <Upload className="w-4 h-4 text-[var(--accent-up)]" />
            <span>{t.metrics.upload}</span>
          </div>
          <div
            dir="ltr"
            className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[var(--text)] tracking-tight"
          >
            {uploadVal}
          </div>
          <div className="text-[11px] font-medium text-[var(--text-muted)] mt-1">{unitLabel}</div>
        </Card>

        {/* Latency Card */}
        <Card
          variant={phase === 'latency' ? 'interactive' : 'glass'}
          className={`flex flex-col justify-between transition-all duration-300 ${
            phase === 'latency' ? 'border-[var(--accent-lat)] shadow-lg shadow-[var(--accent-lat)]/10' : ''
          }`}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] mb-2">
            <Activity className="w-4 h-4 text-[var(--accent-lat)]" />
            <span>{t.metrics.latency}</span>
          </div>
          <div
            dir="ltr"
            className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[var(--text)] tracking-tight"
          >
            {latencyVal}
          </div>
          <div className="text-[11px] font-medium text-[var(--text-muted)] mt-1">{t.metrics.ms}</div>
        </Card>

        {/* Jitter Card */}
        <Card variant="glass" className="flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] mb-2">
            <Zap className="w-4 h-4 text-[var(--accent-lat)]" />
            <span>{t.metrics.jitter}</span>
          </div>
          <div
            dir="ltr"
            className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-[var(--text)] tracking-tight"
          >
            {jitterVal}
          </div>
          <div className="text-[11px] font-medium text-[var(--text-muted)] mt-1">{t.metrics.ms}</div>
        </Card>
      </div>

      {/* Post-Test Quality & Bufferbloat Summary (Study 03 §1 & §4) */}
      {finalResult && (
        <div className="space-y-3 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Stability Gating Card (Study 03 §3 #10) */}
            <Card variant="surface" className="flex items-center justify-between p-3.5">
              <div className="flex items-center gap-2.5">
                {finalResult.quality === 'stable' ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold text-[var(--text)]">
                    {t.metrics.quality}:{' '}
                    <span
                      className={
                        finalResult.quality === 'stable' ? 'text-emerald-400' : 'text-amber-400'
                      }
                    >
                      {finalResult.quality === 'stable' ? t.metrics.stable : t.metrics.unstable}
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">
                    {finalResult.quality === 'stable'
                      ? lang === 'ar'
                        ? 'إشارة متسقة ومنخفضة التشتت.'
                        : 'Low coefficient of variation.'
                      : lang === 'ar'
                        ? 'تذبذب مرتفع أثناء الفحص؛ يوصى بإعادة الفحص.'
                        : 'High variance detected; retest recommended.'}
                  </div>
                </div>
              </div>
            </Card>

            {/* Bufferbloat Grade Card (Study 03 §1) */}
            {bufferbloat && (
              <Card variant="surface" className="flex items-center justify-between p-3.5">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-lg border font-black text-sm flex items-center justify-center shrink-0 ${bufferbloat.color}`}
                  >
                    {bufferbloat.grade}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[var(--text)]">
                      {t.metrics.bufferbloat}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] leading-tight mt-0.5">
                      {lang === 'ar' ? bufferbloat.descAr : bufferbloat.descEn}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] font-mono text-[var(--text-muted)] text-end shrink-0">
                  +{bufferbloat.delta.toFixed(0)}ms
                </div>
              </Card>
            )}
          </div>

          {/* Action Row: Copy & Collapsible Technical Details */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopySummary}
              startIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              {copied ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : t.actions.copyLink}
            </Button>

            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition-colors px-2 py-1 rounded"
            >
              <span>{lang === 'ar' ? 'التفاصيل التقنية' : 'Technical Details'}</span>
              {showTechnicalDetails ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Collapsible Technical Metadata Grid */}
          {showTechnicalDetails && (
            <Card
              variant="glass"
              className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs border-[var(--border)] animate-in fade-in"
            >
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">{t.metrics.server}</span>
                <span className="font-mono font-medium text-[var(--text)] bidi-isolate">
                  {finalResult.server.city || 'Edge'}, {finalResult.server.country || ''}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">{t.metrics.engine}</span>
                <span className="font-semibold text-[var(--accent-down)] uppercase">
                  {finalResult.engine}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">{t.metrics.streams}</span>
                <span className="font-mono font-medium text-[var(--text)]">
                  {finalResult.streams.down} down / {finalResult.streams.up} up
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">{t.metrics.duration}</span>
                <span className="font-mono font-medium text-[var(--text)]">
                  {(finalResult.durationMs / 1000).toFixed(1)}s
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">{t.metrics.bytes}</span>
                <span className="font-mono font-medium text-[var(--text)]">
                  {((finalResult.bytes.down + finalResult.bytes.up) / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
              <div>
                <span className="text-[var(--text-muted)] block text-[10px]">
                  {lang === 'ar' ? 'وقت الفحص' : 'Timestamp'}
                </span>
                <span className="font-mono font-medium text-[var(--text-muted)] text-[10px]">
                  {new Date(finalResult.startedAt).toLocaleTimeString()}
                </span>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Network Server & Engine Info Bar when Idle or Running */}
      {!finalResult && (
        <Card variant="surface" className="w-full flex flex-wrap items-center justify-between gap-4 p-3 text-xs">
          <div className="flex items-center gap-2 text-[var(--text)]">
            <Server className="w-4 h-4 text-[var(--accent-down)] shrink-0" />
            <span className="text-[var(--text-muted)]">{t.metrics.server}:</span>
            <span className="font-mono font-medium bidi-isolate">
              {lang === 'ar' ? 'أقرب خادم معتمد (تلقائي)' : 'Optimal edge node (auto)'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[var(--text-muted)] text-[11px]">
              {t.metrics.dataNotice.replace('{size}', '50')}
            </span>
            {onOpenMethodology && (
              <button
                type="button"
                onClick={onOpenMethodology}
                className="text-[var(--accent-down)] hover:underline text-xs font-semibold"
              >
                {t.actions.howWeMeasure}
              </button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
