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
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const { lightTestMode, setLightTestMode } = usePreferencesStore();
  const { t } = useI18n();

  const handleClearData = () => {
    safeStorage.removeItem('nabd:history:v1');
    safeStorage.removeItem('nabd:rate_limit:v1');
    window.location.reload();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t.nav.settings}>
      <div className="space-y-6">
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

        {/* Engine Transparency Notice */}
        <div className="p-4 rounded-xl border border-[var(--border)] space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <ShieldCheck className="w-4 h-4 text-[var(--accent-down)]" />
            <span>Honesty & Measurement Architecture</span>
          </div>
          <p className="text-xs text-[var(--text)] leading-relaxed">
            YamkSpeed uses a 3-tier measurement architecture:
            <br />
            1. Cloudflare Speed Endpoints (Primary)
            <br />
            2. M-Lab NDT7 WebSocket (Alternate)
            <br />
            3. Cloudflare Worker (Emergency Reserve)
          </p>
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
