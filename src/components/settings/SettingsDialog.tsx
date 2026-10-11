import React from 'react';
import { ShieldCheck, Zap, Database, RotateCcw } from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { usePreferencesStore } from '@/stores/preferences';
import { useI18n } from '@/i18n';
import { safeStorage } from '@/lib/storage-migration';

export interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMethodology?: () => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  isOpen,
  onClose,
  onOpenMethodology,
}) => {
  const {
    speedUnit,
    setSpeedUnit,
    digits,
    setDigits,
    lightTestMode,
    setLightTestMode,
  } = usePreferencesStore();
  const { t } = useI18n();

  const handleClearData = () => {
    safeStorage.removeItem('nabd:history:v1');
    safeStorage.removeItem('nabd:rate_limit:v1');
    window.location.reload();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t.nav.settings}>
      <div className="space-y-6">
        {/* Speed Unit Selector (Study 03 §1) */}
        <div className="p-4 rounded-xl bg-[var(--surface-2)] space-y-3">
          <div className="space-y-1">
            <div className="font-semibold text-sm text-[var(--text)]">
              {t.settings.speedUnit}
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {t.settings.speedUnitDesc}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSpeedUnit('mbps')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                speedUnit === 'mbps'
                  ? 'bg-[var(--accent-down)] text-[#070B14] border-transparent shadow-sm'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
              }`}
            >
              Mbps (Megabits/s)
            </button>
            <button
              type="button"
              onClick={() => setSpeedUnit('MBps')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                speedUnit === 'MBps'
                  ? 'bg-[var(--accent-down)] text-[#070B14] border-transparent shadow-sm'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
              }`}
            >
              MB/s (Megabytes/s, ÷8)
            </button>
          </div>
        </div>

        {/* Numeral Digits Selector (Study 04 §4) */}
        <div className="p-4 rounded-xl bg-[var(--surface-2)] space-y-3">
          <div className="space-y-1">
            <div className="font-semibold text-sm text-[var(--text)]">
              {t.settings.digits}
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {t.settings.digitsDesc}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDigits('latin')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                digits === 'latin'
                  ? 'bg-[var(--accent-down)] text-[#070B14] border-transparent shadow-sm'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
              }`}
            >
              {t.settings.digitsLatin}
            </button>
            <button
              type="button"
              onClick={() => setDigits('arabic')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                digits === 'arabic'
                  ? 'bg-[var(--accent-down)] text-[#070B14] border-transparent shadow-sm'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text)]'
              }`}
            >
              {t.settings.digitsArabic}
            </button>
          </div>
        </div>

        {/* Light Test Mode Toggle */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[var(--surface-2)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold text-sm text-[var(--text)]">
              <Zap className="w-4 h-4 text-[var(--accent-lat)]" />
              <span>{t.settings.lightTestMode}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {t.settings.lightTestDesc}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={lightTestMode}
            onClick={() => setLightTestMode(!lightTestMode)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              lightTestMode ? 'bg-[var(--accent-down)]' : 'bg-gray-600'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                lightTestMode ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Engine Transparency & Methodology Notice */}
        <div className="p-4 rounded-xl border border-[var(--border)] space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <ShieldCheck className="w-4 h-4 text-[var(--accent-down)]" />
            <span>Honesty & Measurement Architecture</span>
          </div>
          <p className="text-xs text-[var(--text)] leading-relaxed">
            YamkSpeed uses a 3-tier measurement architecture (Cloudflare edge, M-Lab NDT7, Worker fallback) with zero synthetic values.
          </p>
          {onOpenMethodology && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                onClose();
                onOpenMethodology();
              }}
              className="w-full text-xs"
            >
              {t.actions.howWeMeasure}
            </Button>
          )}
        </div>

        {/* Storage / Reset */}
        <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Database className="w-4 h-4" />
            <span>Local Storage</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClearData}
            startIcon={<RotateCcw className="w-3.5 h-3.5" />}
            className="text-[var(--danger)] hover:text-[var(--danger)]"
          >
            {t.actions.clearHistory}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
