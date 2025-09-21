import React, { useState } from 'react';

export type InfoItem = {
  id: string;
  description: string;
  checked?: boolean;
  disabled?: boolean;
};

export type ContextStyleTonePanelProps = {
  title?: string;
  items?: InfoItem[];
  defaultOpen?: boolean;
};

export default function ContextStyleTonePanel({
  title = 'Writing style & tone',
  items = [],
  defaultOpen,
}: ContextStyleTonePanelProps) {
  const [list, setList] = useState<InfoItem[]>(items);
  const activeCount = list.filter((i) => i.checked).length;

  function handleToggle(id: string, next: boolean) {
    setList((prev) => prev.map((it) => (it.id === id ? { ...it, checked: next } : it)));
  }

  return (
    <details
      data-panel
      className="rounded border border-[var(--border)]"
      open={defaultOpen}
    >
      <summary className="flex items-center justify-between cursor-pointer select-none px-3 py-2 text-sm">
        <span className="text-[var(--fg)]">{title}</span>
        <span className="ml-2 rounded bg-black/20 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
          {activeCount}
        </span>
      </summary>
      <div className="px-3 pb-3 text-sm text-[var(--muted)]">
        {list.length > 0 && (
          <ul className="space-y-1">
            {list.map((it) => (
              <li
                key={it.id}
                className={`flex items-center justify-between gap-3 ${it.checked ? '' : 'opacity-60'}`}
              >
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="accent-[var(--fg)]"
                    tabIndex={-1}
                    disabled={it.disabled}
                    checked={!!it.checked}
                    onChange={(e) => handleToggle(it.id, e.target.checked)}
                  />
                  <span className="min-w-0 flex-1 truncate" title={it.description}>
                    {it.description}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
