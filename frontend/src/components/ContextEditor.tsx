import React, { useEffect, useRef } from 'react';

export default function ContextEditor({
  open,
  tokens,
  onClose,
}: {
  open: boolean;
  tokens: number;
  onClose: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const budget = 2000;
  const used = Math.max(0, tokens);
  const pct = Math.min(100, Math.round((used / budget) * 100));

  function getPanels() {
    const root = containerRef.current;
    if (!root) return [] as HTMLDetailsElement[];
    return Array.from(root.querySelectorAll<HTMLDetailsElement>('details[data-panel]'));
  }

  function getSummaries() {
    return getPanels()
      .map((p) => p.querySelector('summary'))
      .filter((s): s is HTMLElement => !!s);
  }

  function getAllItems() {
    const panels = getPanels();
    const items: { panel: HTMLDetailsElement; input: HTMLInputElement }[] = [];
    for (const p of panels) {
      const inputs = Array.from(
        p.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
      );
      for (const input of inputs) {
        items.push({ panel: p, input });
      }
    }
    return items;
  }

  function getActivePanelIndexFromFocus(): number {
    const active = document.activeElement as HTMLElement | null;
    const panels = getPanels();
    if (!active) return -1;
    const idx = panels.findIndex((p) => p.contains(active));
    if (idx >= 0) return idx;
    // If focus is outside panels, default to 0
    return 0;
  }

  function focusSummaryAt(idx: number) {
    const summaries = getSummaries();
    if (summaries.length === 0) return;
    const next = ((idx % summaries.length) + summaries.length) % summaries.length;
    summaries[next].focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const key = e.key;

    // Tab navigates between panels (their summaries)
    if (key === 'Tab') {
      e.preventDefault();
      const currentPanelIdx = getActivePanelIndexFromFocus();
      const delta = e.shiftKey ? -1 : 1;
      focusSummaryAt(currentPanelIdx + delta);
      return;
    }

    // Enter opens a collapsed panel if focused on its summary (or inside it)
    if (key === 'Enter') {
      const active = document.activeElement as HTMLElement | null;
      if (active) {
        const details = active.closest('details[data-panel]') as HTMLDetailsElement | null;
        const isOnSummary = active.tagName.toLowerCase() === 'summary' || !!active.closest('summary');
        if (details && isOnSummary && !details.open) {
          e.preventDefault();
          details.open = true;
        }
      }
      return;
    }

    // Up/Down navigate between checkbox items (can cross panels)
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      const items = getAllItems();
      if (items.length === 0) return;

      const active = document.activeElement as HTMLElement | null;
      const onCheckboxIdx = items.findIndex((it) => it.input === active);

      let targetIdx = -1;

      if (onCheckboxIdx >= 0) {
        targetIdx = key === 'ArrowDown' ? onCheckboxIdx + 1 : onCheckboxIdx - 1;
      } else {
        // If not on a checkbox: try to move from the current panel's summary into its first/last item
        const panels = getPanels();
        const currentPanelIdx = getActivePanelIndexFromFocus();
        const panel = panels[currentPanelIdx];
        if (!panel) return;

        const panelItems = items
          .map((it, i) => ({ ...it, i }))
          .filter((x) => x.panel === panel);

        if (panelItems.length === 0) return;

        if (key === 'ArrowDown') {
          targetIdx = panelItems[0].i;
        } else {
          targetIdx = panelItems[panelItems.length - 1].i;
        }
      }

      if (targetIdx < 0 || targetIdx >= items.length) {
        // Allow crossing to previous/next panel if exists; otherwise do nothing
        return;
      }

      e.preventDefault();
      const target = items[targetIdx];
      // Ensure the target's panel is open before focusing
      if (!target.panel.open) target.panel.open = true;
      target.input.focus();
      return;
    }
  }

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const summaries = getSummaries();
      if (summaries[0]) summaries[0].focus();
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  return open ? (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="context-editor-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative pointer-events-auto w-full max-w-2xl mx-auto rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 id="context-editor-title" className="text-sm font-medium text-[var(--fg)]">
            Context Editor (preview)
          </h2>
        </div>

        <div className="p-4 space-y-4">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">

              <details data-panel className="rounded border border-[var(--border)]">
                <summary className="flex items-center justify-between cursor-pointer select-none px-3 py-2 text-sm">
                  <span className="text-[var(--fg)]">Chapters</span>
                  <span className="ml-2 rounded bg-black/20 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">1</span>
                </summary>
                <div className="px-3 pb-3 text-sm text-[var(--muted)]">
                  <ul className="space-y-1">
                    <li className="flex items-center justify-between gap-3">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" tabIndex={-1} defaultChecked className="accent-[var(--fg)]" />
                        <span>03 — El puerto</span>
                      </label>
                      <span className="text-xs">~680t</span>
                    </li>
                    <li className="flex items-center justify-between gap-3 opacity-60">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" tabIndex={-1} className="accent-[var(--fg)]" />
                        <span>02 — Preparativos</span>
                      </label>
                      <span className="text-xs">~540t</span>
                    </li>
                    <li className="flex items-center justify-between gap-3 opacity-60">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" tabIndex={-1} className="accent-[var(--fg)]" />
                        <span>04 — Mareas</span>
                      </label>
                      <span className="text-xs">~720t</span>
                    </li>
                  </ul>
                </div>
              </details>

              <details data-panel className="rounded border border-[var(--border)]">
                <summary className="flex items-center justify-between cursor-pointer select-none px-3 py-2 text-sm">
                  <span className="text-[var(--fg)]">Characters</span>
                  <span className="ml-2 rounded bg-black/20 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">2</span>
                </summary>
                <div className="px-3 pb-3 text-sm text-[var(--muted)]">
                  <ul className="space-y-1">
                    <li className="flex items-center justify-between gap-3">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" tabIndex={-1} defaultChecked className="accent-[var(--fg)]" />
                        <span>Michelle — Protagonist</span>
                      </label>
                      <span className="text-xs">~120t</span>
                    </li>
                    <li className="flex items-center justify-between gap-3">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" tabIndex={-1} defaultChecked className="accent-[var(--fg)]" />
                        <span>Arturo — Supporting</span>
                      </label>
                      <span className="text-xs">~80t</span>
                    </li>
                    <li className="flex items-center justify-between gap-3 opacity-60">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" tabIndex={-1} className="accent-[var(--fg)]" />
                        <span>Port Authority — Minor</span>
                      </label>
                      <span className="text-xs">~40t</span>
                    </li>
                  </ul>
                </div>
              </details>

              <details data-panel className="rounded border border-[var(--border)]">
                <summary className="flex items-center justify-between cursor-pointer select-none px-3 py-2 text-sm">
                  <span className="text-[var(--fg)]">World info</span>
                  <span className="ml-2 rounded bg-black/20 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">1</span>
                </summary>
                <div className="px-3 pb-3 text-sm text-[var(--muted)]">
                  <ul className="space-y-1">
                    <li className="flex items-center justify-between gap-3">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" tabIndex={-1} defaultChecked className="accent-[var(--fg)]" />
                        <span>The Port of San Aurelio</span>
                      </label>
                      <span className="text-xs">~150t</span>
                    </li>
                    <li className="flex items-center justify-between gap-3 opacity-60">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" tabIndex={-1} className="accent-[var(--fg)]" />
                        <span>Ferry schedules</span>
                      </label>
                      <span className="text-xs">~60t</span>
                    </li>
                  </ul>
                </div>
              </details>

            </div>

            <div className="space-y-3">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-[var(--muted)]">Estimated tokens</span>
                  <span className="text-sm text-[var(--fg)]">
                    {used} / {budget} (~{pct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded bg-black/20 overflow-hidden">
                  <div
                    className={`h-full ${pct < 80 ? 'bg-emerald-500/70' : pct < 100 ? 'bg-amber-500/80' : 'bg-red-500/80'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <details open className="rounded border border-[var(--border)]">
                <summary className="flex items-center justify-between cursor-pointer select-none px-3 py-2 text-sm">
                  <span className="text-[var(--fg)]">Global</span>
                  <span className="ml-2 rounded bg-black/20 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">1</span>
                </summary>
                <div className="px-3 pb-3">
                  <div className="text-xs text-[var(--muted)] mb-1">System prompt (always included)</div>
                  <div className="rounded border border-[var(--border)] bg-black/10 p-2 text-xs text-[var(--muted)]">
                    You are a helpful writing assistant. Follow the author’s intent, preserve facts, and avoid spoilers beyond the current scope.
                  </div>
                </div>
              </details>

              <details className="rounded border border-[var(--border)]">
                <summary className="flex items-center justify-between cursor-pointer select-none px-3 py-2 text-sm">
                  <span className="text-[var(--fg)]">Writing style & tone</span>
                  <span className="ml-2 rounded bg-black/20 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">1</span>
                </summary>
                <div className="px-3 pb-3 text-sm text-[var(--muted)]">
                  <div className="mb-2 text-xs">Style guide</div>
                  <ul className="space-y-1 mb-3">
                    <li className="flex items-center justify-between">
                      <span>• House style: concise, sensory details</span>
                      <span className="text-xs">~120t</span>
                    </li>
                  </ul>
                  <div className="mb-2 text-xs">Tone</div>
                  <div className="flex flex-wrap gap-1">
                    <span className="rounded border border-[var(--border)] bg-black/20 px-2 py-0.5 text-xs">Moody</span>
                    <span className="rounded border border-[var(--border)] bg-black/10 px-2 py-0.5 text-xs">Lyrical</span>
                  </div>
                </div>
              </details>

              <p className="text-xs text-[var(--muted)]">
                This is a mock. Interactions and persistence will be added next.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-4 py-3">
          <span className="text-xs text-[var(--muted)] hidden sm:inline">Press Esc to close</span>
          <button
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('toast:show', { detail: { text: 'Context cleared (mock).' } }),
              );
            }}
            className="rounded border border-[var(--border)] bg-black/10 px-3 py-1.5 text-sm text-[var(--muted)] hover:bg-black/20"
          >
            Clear
          </button>
          <button
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('toast:show', { detail: { text: 'Context updated (mock).' } }),
              );
              onClose();
            }}
            className="rounded border border-[var(--border)] bg-black/20 px-3 py-1.5 text-sm text-[var(--fg)] hover:bg-black/30"
          >
            Apply
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
  ) : null;
}
