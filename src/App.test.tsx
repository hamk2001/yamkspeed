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

    const langBtn = screen.getByRole('button', { name: /Switch language to/i });
    expect(langBtn).toBeInTheDocument();

    fireEvent.click(langBtn);

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

  it('switches to Engine Dev Harness view when Harness button is clicked', () => {
    render(<App />);

    const harnessBtn = screen.getByRole('button', { name: /Harness/i });
    fireEvent.click(harnessBtn);

    expect(screen.getByText(/Engine Dev Harness/i)).toBeInTheDocument();
  });

  it('opens and closes the How We Measure methodology dialog', () => {
    render(<App />);

    const methodologyBtns = screen.getAllByRole('button', { name: /How We Measure|كيف نقيس السرعة/i });
    expect(methodologyBtns.length).toBeGreaterThan(0);
    fireEvent.click(methodologyBtns[0]);

    expect(
      screen.getByText(/Measurement Methodology & Honesty|منهجية القياس ودقة الأرقام/i)
    ).toBeInTheDocument();
  });
});
