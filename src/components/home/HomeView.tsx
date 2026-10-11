import { useState } from 'react';
import { Download, Upload, Activity, Zap, Server, Shield, Play } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/i18n';
import { checkRateLimit } from '@/engine/rate-limiter';

export const HomeView: React.FC = () => {
  const { t, lang } = useI18n();
  const [rateLimitNotice, setRateLimitNotice] = useState<string | null>(null);

  const handleStartTest = () => {
    const status = checkRateLimit();
    if (!status.allowed) {
      if (status.reason === 'cooldown') {
        setRateLimitNotice(
          t.errors.rateLimited.replace('{seconds}', status.cooldownRemainingSeconds.toString())
        );
      } else if (status.reason === 'multi_tab_active') {
        setRateLimitNotice(t.errors.multiTab);
      }
      return;
    }
    setRateLimitNotice(null);
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 max-w-4xl mx-auto space-y-12">
      {/* Rate limit banner if active */}
      {rateLimitNotice && (
        <div className="w-full p-4 rounded-xl bg-[var(--danger)]/15 border border-[var(--danger)]/30 text-[var(--danger)] text-sm text-center font-medium animate-in fade-in">
          {rateLimitNotice}
        </div>
      )}

      {/* Hero Circular Gauge / Start Orb */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Luminous Pulsing Glow Outer Ring */}
        <div className="absolute w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-gradient-to-tr from-[var(--accent-down)]/20 to-[var(--accent-up)]/20 blur-2xl animate-pulse -z-10" />

        {/* Outer Circular SVG Track */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Track */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-[var(--surface-2)] opacity-80"
              strokeDasharray="200"
              strokeDashoffset="35"
              strokeLinecap="round"
            />
            {/* Ambient Progress Indicator */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="var(--accent-down)"
              strokeWidth="4"
              strokeDasharray="200"
              strokeDashoffset="140"
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>

          {/* Central Interactive Orb Button */}
          <button
            onClick={handleStartTest}
            className="absolute inset-8 rounded-full bg-gradient-to-b from-[var(--surface-2)] to-[var(--surface)] border border-[var(--border)] shadow-2xl flex flex-col items-center justify-center group hover:scale-[1.02] active:scale-95 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-down)]/50"
          >
            <div className="w-12 h-12 rounded-full bg-[var(--accent-down)]/10 text-[var(--accent-down)] flex items-center justify-center mb-2 group-hover:bg-[var(--accent-down)] group-hover:text-[#070B14] transition-colors duration-300">
              <Play className="w-6 h-6 fill-current ms-0.5 rtl:-scale-x-100" />
            </div>
            <span className="text-xl sm:text-2xl font-black tracking-widest text-[var(--text)] group-hover:text-[var(--accent-down)] transition-colors">
              {t.actions.start}
            </span>
            <span className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">
              {t.phases.idle}
            </span>
          </button>
        </div>
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
        {/* Download Card */}
        <Card variant="glass" className="flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] mb-2">
            <Download className="w-4 h-4 text-[var(--accent-down)]" />
            <span>{t.metrics.download}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[var(--text)]">
            --
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">{t.metrics.mbps}</div>
        </Card>

        {/* Upload Card */}
        <Card variant="glass" className="flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] mb-2">
            <Upload className="w-4 h-4 text-[var(--accent-up)]" />
            <span>{t.metrics.upload}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[var(--text)]">
            --
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">{t.metrics.mbps}</div>
        </Card>

        {/* Latency Card */}
        <Card variant="glass" className="flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] mb-2">
            <Activity className="w-4 h-4 text-[var(--accent-lat)]" />
            <span>{t.metrics.latency}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[var(--text)]">
            --
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">{t.metrics.ms}</div>
        </Card>

        {/* Jitter Card */}
        <Card variant="glass" className="flex flex-col justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] mb-2">
            <Zap className="w-4 h-4 text-[var(--accent-lat)]" />
            <span>{t.metrics.jitter}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-[var(--text)]">
            --
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1">{t.metrics.ms}</div>
        </Card>
      </div>

      {/* Infrastructure & Status Bar */}
      <Card variant="surface" className="w-full flex flex-wrap items-center justify-between gap-4 p-4 text-xs">
        <div className="flex items-center gap-2 text-[var(--text)]">
          <Server className="w-4 h-4 text-[var(--accent-down)]" />
          <span className="text-[var(--text-muted)]">{t.metrics.server}:</span>
          <span className="font-mono font-medium bidi-isolate">
            {lang === 'ar' ? 'أقرب خادم معتمد (تلقائي)' : 'Optimal edge node (auto)'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[var(--text)]">
          <Shield className="w-4 h-4 text-[var(--accent-up)]" />
          <span className="text-[var(--text-muted)]">{t.metrics.engine}:</span>
          <span className="font-semibold text-[var(--accent-down)]">
            3-Tier Fallback (CF / M-Lab)
          </span>
        </div>
      </Card>
    </div>
  );
};
