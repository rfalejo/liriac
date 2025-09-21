import React from 'react';

export type ContextItem = {
  id: string;
  label: string;
  tokens?: number;
  checked?: boolean;
  disabled?: boolean;
};

export type ContextSection = {
  id: string;
  title: string;
  items: ContextItem[];
  defaultOpen?: boolean;
};

export type ContextSectionListProps = {
  section: ContextSection;
  onToggle?: (sectionId: string, itemId: string, nextChecked: boolean) => void;
  addButtonLabel?: string;
  onAdd?: () => void;
  onEdit?: (sectionId: string, itemId: string) => void;
};

/**
 * Renders a <details> panel with a summary and a list of checkbox items.
 * Stateless and API-ready: accepts data + callback, no internal persistence.
 */
export default function ContextSectionList({ section, onToggle, addButtonLabel, onAdd, onEdit }: ContextSectionListProps) {
  const activeCount = section.items.filter((i) => i.checked).length;

  return (
    <details data-panel className="rounded border border-[var(--border)]" open={section.defaultOpen}>
      <summary className="flex items-center justify-between cursor-pointer select-none px-3 py-2 text-sm">
        <span className="text-[var(--fg)]">{section.title}</span>
        <span className="ml-2 flex items-center gap-2">
          {typeof onAdd === 'function' && !!addButtonLabel && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onAdd?.();
              }}
              className="rounded border border-[var(--border)] bg-black/10 px-2 py-1 text-[11px] text-[var(--muted)] hover:bg-black/20"
              aria-label={addButtonLabel}
              title={addButtonLabel}
            >
              + {addButtonLabel}
            </button>
          )}
          <span className="rounded bg-black/20 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
            {activeCount}
          </span>
        </span>
      </summary>
      <div className="px-3 pb-3 text-sm text-[var(--muted)]">
        <ul className="space-y-1">
          {section.items.map((it) => (
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
                  onChange={(e) => onToggle?.(section.id, it.id, e.target.checked)}
                />
                <span>{it.label}</span>
              </label>
              <div className="flex items-center gap-2">
                {typeof it.tokens === 'number' && <span className="text-xs">~{it.tokens}t</span>}
                {typeof onEdit === 'function' && (
                  <button
                    type="button"
                    className="rounded border border-[var(--border)] bg-black/10 px-2 py-0.5 text-[11px] text-[var(--muted)] hover:bg-black/20"
                    onClick={() => onEdit(section.id, it.id)}
                    aria-label={`Edit ${it.label}`}
                    title={`Edit ${it.label}`}
                  >
                    Edit
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
