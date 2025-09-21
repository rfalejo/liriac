import { useEffect, useRef } from 'react';

export function useDialogFocusNav(open: boolean) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Helpers scoped to the dialog container
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
    return 0;
  }

  function focusSummaryAt(idx: number) {
    const summaries = getSummaries();
    if (summaries.length === 0) return;
    const next = ((idx % summaries.length) + summaries.length) % summaries.length;
    summaries[next].focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const key = e.key;

    if (key === 'Tab') {
      e.preventDefault();
      const currentPanelIdx = getActivePanelIndexFromFocus();
      const delta = e.shiftKey ? -1 : 1;
      focusSummaryAt(currentPanelIdx + delta);
      return;
    }

    if (key === 'Enter') {
      const active = document.activeElement as HTMLElement | null;
      if (active) {
        const details = active.closest(
          'details[data-panel]',
        ) as HTMLDetailsElement | null;
        const isOnSummary =
          active.tagName.toLowerCase() === 'summary' || !!active.closest('summary');
        if (details && isOnSummary && !details.open) {
          e.preventDefault();
          details.open = true;
        }
      }
      return;
    }

    if (key === 'ArrowDown' || key === 'ArrowUp') {
      const items = getAllItems();
      if (items.length === 0) return;

      const active = document.activeElement as HTMLElement | null;
      const onCheckboxIdx = items.findIndex((it) => it.input === active);

      let targetIdx = -1;

      if (onCheckboxIdx >= 0) {
        targetIdx = key === 'ArrowDown' ? onCheckboxIdx + 1 : onCheckboxIdx - 1;
      } else {
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
        return;
      }

      e.preventDefault();
      const target = items[targetIdx];
      if (!target.panel.open) target.panel.open = true;
      target.input.focus();
      return;
    }
  }

  // Focus first section header when dialog opens
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const summaries = getSummaries();
      if (summaries[0]) summaries[0].focus();
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  return { containerRef, onKeyDown };
}
