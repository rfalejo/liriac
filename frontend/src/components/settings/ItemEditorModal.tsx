import React, { useEffect, useRef, useState } from 'react';
import { mockTokenize } from '../../utils/tokens';

type CharacterDraft = {
  name: string;
  role?: string;
  summary?: string;
  checked?: boolean; // include in context
};

type WorldDraft = {
  title: string;
  summary?: string;
  facts?: string;
  checked?: boolean;
};

export default function ItemEditorModal({
  open,
  type,
  mode = 'create',
  initialValue,
  onCancel,
  onSave,
}: {
  open: boolean;
  type: 'character' | 'world';
  mode?: 'create' | 'edit';
  initialValue?: CharacterDraft | WorldDraft;
  onCancel: () => void;
  onSave: (_draft: CharacterDraft | WorldDraft) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  type Draft = CharacterDraft | WorldDraft;
  const initialDraft: Draft =
    type === 'character'
      ? { name: '', role: '', summary: '', checked: true }
      : { title: '', summary: '', facts: '', checked: true };
  const [draft, setDraft] = useState<Draft>(initialDraft);

  useEffect(() => {
    if (!open) return;
    // Initialize draft when opening
    if (type === 'character') {
      if (mode === 'edit' && initialValue && (initialValue as CharacterDraft)) {
        const iv = initialValue as CharacterDraft;
        setDraft({
          name: iv.name ?? '',
          role: iv.role ?? '',
          summary: iv.summary ?? '',
          checked: iv.checked ?? true,
        });
      } else {
        setDraft({ name: '', role: '', summary: '', checked: true });
      }
    } else if (type === 'world') {
      if (mode === 'edit' && initialValue && (initialValue as WorldDraft)) {
        const iv = initialValue as WorldDraft;
        setDraft({
          title: iv.title ?? '',
          summary: iv.summary ?? '',
          facts: iv.facts ?? '',
          checked: iv.checked ?? true,
        });
      } else {
        setDraft({ title: '', summary: '', facts: '', checked: true });
      }
    }
    const t = setTimeout(() => {
      firstFieldRef.current?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [open, mode, type, initialValue]);

  function computeTokenEstimate(): number {
    if (type === 'character') {
      const parts = [
        draft?.name ?? '',
        draft?.role ? ` — ${draft.role}` : '',
        draft?.summary ?? '',
      ].join('\n');
      return mockTokenize(parts);
    } else {
      const parts = [draft?.title ?? '', draft?.summary ?? '', draft?.facts ?? ''].join(
        '\n',
      );
      return mockTokenize(parts);
    }
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onCancel();
  }

  function getFocusableEls(): HTMLElement[] {
    const root = containerRef.current;
    if (!root) return [];
    const panel = root.querySelector<HTMLElement>('[data-modal-panel]');
    if (!panel) return [];
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    const nodes = Array.from(panel.querySelectorAll<HTMLElement>(selectors));
    return nodes.filter(
      (el) =>
        !el.hasAttribute('disabled') && el.tabIndex !== -1 && el.offsetParent !== null,
    );
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    // Always stop propagation so parent dialogs (Settings) don't hijack keys
    e.stopPropagation();

    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const els = getFocusableEls();
      if (els.length === 0) return;
      const active = document.activeElement as HTMLElement | null;
      let idx = els.findIndex((el) => el === active);
      if (idx === -1) idx = 0;
      const delta = e.shiftKey ? -1 : 1;
      const next = (idx + delta + els.length) % els.length;
      els[next].focus();
      return;
    }

    if (e.key === 'Enter') {
      // Prevent parent handling Enter (section toggles, etc.). Let form handle submit.
      // No preventDefault here so buttons and inputs behave normally.
      return;
    }
  }

  if (!open) return null;

  const isValid =
    (type === 'character' &&
      typeof draft.name === 'string' &&
      draft.name.trim().length > 0) ||
    (type === 'world' &&
      typeof draft.title === 'string' &&
      draft.title.trim().length > 0);

  const estTokens = computeTokenEstimate();

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="item-editor-title"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        data-modal-panel
        className="relative w-full max-w-md mx-auto rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-xl"
      >
        <div className="border-b border-[var(--border)] px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 id="item-editor-title" className="text-sm font-medium text-[var(--fg)]">
              {type === 'character'
                ? mode === 'edit'
                  ? 'Edit character'
                  : 'Add character'
                : mode === 'edit'
                  ? 'Edit world info'
                  : 'Add world info'}
            </h2>
            <span
              className="ml-3 rounded bg-black/20 px-1.5 py-0.5 text-[11px] text-[var(--muted)]"
              aria-label="Estimated tokens"
              title="Estimated tokens"
            >
              ~{estTokens}t
            </span>
          </div>
        </div>

        <form
          className="p-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (isValid) onSave(draft);
          }}
        >
          {type === 'character' && (
            <>
              <div className="space-y-1">
                <label className="text-xs text-[var(--muted)]" htmlFor="char-name">
                  Name
                </label>
                <input
                  id="char-name"
                  ref={firstFieldRef}
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  className="w-full rounded border border-[var(--border)] bg-black/10 px-2 py-1.5 text-sm text-[var(--fg)] outline-none focus:ring-1 focus:ring-[var(--border)]"
                  placeholder="e.g., Michelle"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[var(--muted)]" htmlFor="char-role">
                  Role (optional)
                </label>
                <input
                  id="char-role"
                  value={draft.role ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
                  className="w-full rounded border border-[var(--border)] bg-black/10 px-2 py-1.5 text-sm text-[var(--fg)] outline-none focus:ring-1 focus:ring-[var(--border)]"
                  placeholder="e.g., Protagonist"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[var(--muted)]" htmlFor="char-summary">
                  Summary (optional)
                </label>
                <textarea
                  id="char-summary"
                  value={draft.summary ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
                  className="min-h-[80px] w-full rounded border border-[var(--border)] bg-black/10 px-2 py-1.5 text-sm text-[var(--fg)] outline-none focus:ring-1 focus:ring-[var(--border)]"
                  placeholder="One or two lines that describe the character…"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <input
                  type="checkbox"
                  className="accent-[var(--fg)]"
                  checked={!!draft.checked}
                  onChange={(e) => setDraft((d) => ({ ...d, checked: e.target.checked }))}
                />
                Include in context
              </label>
            </>
          )}

          {type === 'world' && (
            <>
              <div className="space-y-1">
                <label className="text-xs text-[var(--muted)]" htmlFor="wi-title">
                  Title
                </label>
                <input
                  id="wi-title"
                  ref={firstFieldRef}
                  value={draft.title ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  className="w-full rounded border border-[var(--border)] bg-black/10 px-2 py-1.5 text-sm text-[var(--fg)] outline-none focus:ring-1 focus:ring-[var(--border)]"
                  placeholder="e.g., The Port of San Aurelio"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[var(--muted)]" htmlFor="wi-summary">
                  Summary (optional)
                </label>
                <textarea
                  id="wi-summary"
                  value={draft.summary ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))}
                  className="min-h-[80px] w-full rounded border border-[var(--border)] bg-black/10 px-2 py-1.5 text-sm text-[var(--fg)] outline-none focus:ring-1 focus:ring-[var(--border)]"
                  placeholder="One or two lines that describe this element…"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-[var(--muted)]" htmlFor="wi-facts">
                  Facts (optional)
                </label>
                <textarea
                  id="wi-facts"
                  value={draft.facts ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, facts: e.target.value }))}
                  className="min-h-[80px] w-full rounded border border-[var(--border)] bg-black/10 px-2 py-1.5 text-sm text-[var(--fg)] outline-none focus:ring-1 focus:ring-[var(--border)]"
                  placeholder="Bullet points or notes…"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
                <input
                  type="checkbox"
                  className="accent-[var(--fg)]"
                  checked={!!draft.checked}
                  onChange={(e) => setDraft((d) => ({ ...d, checked: e.target.checked }))}
                />
                Include in context
              </label>
            </>
          )}
          <div className="flex items-center justify-end gap-2 pt-2">
            <span className="hidden sm:inline text-xs text-[var(--muted)]">
              Press Esc to cancel
            </span>
            <button
              type="button"
              onClick={onCancel}
              className="rounded border border-[var(--border)] bg-black/10 px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-black/20"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="rounded border border-[var(--border)] bg-black/20 px-3 py-1.5 text-sm text-[var(--fg)] hover:bg-black/30 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
