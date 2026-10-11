import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { AuroraBackground } from '@/components/layout/AuroraBackground';
import { HomeView } from '@/components/home/HomeView';
import { RtlAudit } from '@/components/audit/RtlAudit';
import { DevEngineHarness } from '@/features/dev/DevEngineHarness';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { HowWeMeasureDialog } from '@/components/methodology/HowWeMeasureDialog';
import { useI18n } from '@/i18n';

export function App() {
  const { t } = useI18n();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'audit' | 'harness'>('home');

  return (
    <div className="min-h-screen flex flex-col relative text-[var(--text)]">
      <AuroraBackground />

      <TopBar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
        isAuditView={currentView === 'audit'}
        onToggleAudit={() =>
          setCurrentView((v) => (v === 'audit' ? 'home' : 'audit'))
        }
        isHarnessView={currentView === 'harness'}
        onToggleHarness={() =>
          setCurrentView((v) => (v === 'harness' ? 'home' : 'harness'))
        }
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {currentView === 'audit' && <RtlAudit />}
        {currentView === 'harness' && <DevEngineHarness />}
        {currentView === 'home' && (
          <HomeView onOpenMethodology={() => setIsMethodologyOpen(true)} />
        )}
      </main>

      <footer className="border-t border-[var(--border)] py-6 mt-auto text-xs text-center text-[var(--text-muted)] space-y-1">
        <div>{t.footer.attribution}</div>
        <div className="flex items-center justify-center gap-3">
          <span>{t.footer.license}</span>
          <span>•</span>
          <button
            type="button"
            onClick={() => setIsMethodologyOpen(true)}
            className="text-[var(--accent-down)] hover:underline"
          >
            {t.actions.howWeMeasure}
          </button>
        </div>
      </footer>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
      />

      <HowWeMeasureDialog
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
}

export default App;
