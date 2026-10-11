import React from 'react';
import { Activity, Moon, Sun, Globe, Settings as SettingsIcon, Terminal, ShieldCheck } from 'lucide-react';
import { usePreferencesStore } from '@/stores/preferences';
import { useI18n } from '@/i18n';
import { IconButton } from '@/components/ui/IconButton';
import { Tooltip } from '@/components/ui/Tooltip';

export interface TopBarProps {
  onOpenSettings?: () => void;
  onOpenMethodology?: () => void;
  isAuditView?: boolean;
  onToggleAudit?: () => void;
  isHarnessView?: boolean;
  onToggleHarness?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenSettings,
  onOpenMethodology,
  isAuditView = false,
  onToggleAudit,
  isHarnessView = false,
  onToggleHarness,
}) => {
  const { theme, toggleTheme } = usePreferencesStore();
  const { t, lang, toggleLanguage } = useI18n();

  const targetLanguageLabel = lang === 'ar' ? 'English' : 'العربية';

  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-xl bg-[var(--surface)]/75 border-b border-[var(--border)] transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[var(--accent-down)] to-[var(--accent-up)] flex items-center justify-center shadow-md shadow-[var(--accent-down)]/20">
            <Activity className="w-5 h-5 text-[#070B14] stroke-[2.5]" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-[var(--text)]">
              {t.app.name}
              <span className="text-xs font-normal text-[var(--text-muted)] ms-2">
                {lang === 'ar' ? '(نبض)' : ''}
              </span>
            </span>
            <span className="text-[10px] text-[var(--text-muted)] hidden sm:inline leading-none">
              {t.app.tagline}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dev Harness Toggle */}
          {onToggleHarness && (
            <Tooltip content="Engine Dev Harness">
              <button
                onClick={onToggleHarness}
                className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                  isHarnessView
                    ? 'bg-[var(--accent-lat)] text-[#070B14] border-transparent font-medium'
                    : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Harness</span>
              </button>
            </Tooltip>
          )}

          {/* RTL Audit View Toggle */}
          {onToggleAudit && (
            <button
              onClick={onToggleAudit}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                isAuditView
                  ? 'bg-[var(--accent-down)] text-[#070B14] border-transparent font-medium'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {t.nav.auditRtl}
            </button>
          )}

          {/* Language Toggle */}
          <Tooltip content={lang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}>
            <button
              onClick={toggleLanguage}
              aria-label={`Switch language to ${targetLanguageLabel}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>{targetLanguageLabel}</span>
            </button>
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip content={theme === 'dark' ? t.nav.themeLight : t.nav.themeDark}>
            <IconButton
              size="sm"
              variant="outline"
              aria-label={theme === 'dark' ? t.nav.themeLight : t.nav.themeDark}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[var(--accent-lat)]" />
              ) : (
                <Moon className="w-4 h-4 text-[var(--accent-up)]" />
              )}
            </IconButton>
          </Tooltip>

          {/* Methodology Modal Toggle */}
          {onOpenMethodology && (
            <Tooltip content={t.nav.methodology}>
              <IconButton
                size="sm"
                variant="outline"
                aria-label={t.nav.methodology}
                onClick={onOpenMethodology}
              >
                <ShieldCheck className="w-4 h-4 text-[var(--accent-down)]" />
              </IconButton>
            </Tooltip>
          )}

          {/* Settings Modal Toggle */}
          {onOpenSettings && (
            <Tooltip content={t.nav.settings}>
              <IconButton
                size="sm"
                variant="outline"
                aria-label={t.nav.settings}
                onClick={onOpenSettings}
              >
                <SettingsIcon className="w-4 h-4 text-[var(--text-muted)]" />
              </IconButton>
            </Tooltip>
          )}
        </div>
      </div>
    </header>
  );
};
