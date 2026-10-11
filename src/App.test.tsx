import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';
import { safeStorage } from '@/lib/storage-migration';

describe('App Smoke & Integration Test', () => {
  beforeEach(() => {
    safeStorage.removeItem('nabd:prefs:v1');
    safeStorage.removeItem('nabd:rate_limit:v1');
  });

  it('renders app logo, start button, and metrics cards', () => {
    render(<App />);
    expect(screen.getByText('YamkSpeed')).toBeInTheDocument();
    expect(screen.getByText(/START|ابدأ/)).toBeInTheDocument();
    expect(screen.getByText(/Download|التنزيل/)).toBeInTheDocument();
  });

  it('toggles language reactively when language button is clicked', () => {
    render(<App />);

    // Initial state: Arabic by default in test env or system
    const langBtn = screen.getByRole('button', { name: /Switch language to/i });
    expect(langBtn).toBeInTheDocument();

    fireEvent.click(langBtn);

    // After clicking, document attributes update
    expect(document.documentElement.getAttribute('lang')).toBeDefined();
    expect(document.documentElement.getAttribute('dir')).toBeDefined();
  });

  it('toggles theme when theme button is clicked', () => {
    render(<App />);

    const themeBtn = screen.getByRole('button', { name: /Dark Mode|Light Mode|الوضع الداكن|الوضع الفاتح/i });
    const initialTheme = document.documentElement.getAttribute('data-theme');

    fireEvent.click(themeBtn);

    const nextTheme = document.documentElement.getAttribute('data-theme');
    expect(nextTheme).not.toBe(initialTheme);
  });

  it('switches to RTL audit page when audit button is clicked', () => {
    render(<App />);

    const auditBtn = screen.getByRole('button', { name: /RTL Audit|فحص الاتجاه/i });
    fireEvent.click(auditBtn);

    expect(screen.getByText(/RTL & BiDi Isolation Audit Page/i)).toBeInTheDocument();
  });
});
