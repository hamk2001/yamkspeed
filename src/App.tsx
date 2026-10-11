import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { AuroraBackground } from '@/components/layout/AuroraBackground';
import { HomeView } from '@/components/home/HomeView';
import { RtlAudit } from '@/components/audit/RtlAudit';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { useI18n } from '@/i18n';

export function App() {
  const { t } = useI18n();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuditView, setIsAuditView] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative text-[var(--text)]">
      <AuroraBackground />

      <TopBar
        onOpenSettings={() => setIsSettingsOpen(true)}
        isAuditView={isAuditView}
        onToggleAudit={() => setIsAuditView(!isAuditView)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {isAuditView ? <RtlAudit /> : <HomeView />}
      </main>

      <footer className="border-t border-[var(--border)] py-6 mt-auto text-xs text-center text-[var(--text-muted)] space-y-1">
        <div>{t.footer.attribution}</div>
        <div>{t.footer.license}</div>
      </footer>

      <SettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default App;
