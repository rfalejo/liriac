import React from 'react';

export default function SettingsDialog({
  open,
  title = 'Settings',
  activeTab = 'context',
  onClose,
  onSave,
  onClear,
  children,
  containerRef,
  onKeyDown,
}: {
  open: boolean;
  title?: string;
  activeTab?: 'context';
  onClose: () => void;
  onSave?: () => void;
  onClear?: () => void;
  children: React.ReactNode;
  containerRef?: React.RefObject<HTMLDivElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
}) {
  if (!open) return null;

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={onKeyDown}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative pointer-events-auto w-full max-w-3xl mx-auto rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-xl">
        <div className="border-b border-[var(--border)]">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 id="settings-title" className="text-sm font-medium text-[var(--fg)]">
              {title}
            </h2>
          </div>
          <div className="flex gap-1 px-2 pb-2">
            <button
              className="rounded bg-black/30 px-3 py-1.5 text-xs text-[var(--fg)] border border-[var(--border)]"
              aria-current={activeTab === 'context' ? 'page' : undefined}
            >
              Context editor
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4" role="tabpanel" aria-label="Context editor">
          {children}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-4 py-3">
          <span className="text-xs text-[var(--muted)] hidden sm:inline">Press Esc to close</span>
          <button
            onClick={() => {
              onClear?.();
            }}
            className="rounded border border-[var(--border)] bg-black/10 px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-black/20"
          >
            Clear
          </button>
          <button
            onClick={() => {
              onSave?.();
              onClose();
            }}
            className="rounded border border-[var(--border)] bg-black/20 px-3 py-1.5 text-sm text-[var(--fg)] hover:bg-black/30"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="rounded border border-[var(--border)] bg-black/10 px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-black/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
