import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div
        ref={dialogRef}
        className={`relative w-full max-w-lg bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 ${className}`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)] mb-4">
          <h2 id="dialog-title" className="text-lg font-bold text-[var(--text)]">
            {title}
          </h2>
          <IconButton
            size="sm"
            aria-label="Close dialog"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <X className="w-5 h-5" />
          </IconButton>
        </div>

        <div className="text-sm text-[var(--text)]">{children}</div>
      </div>
    </div>
  );
};
