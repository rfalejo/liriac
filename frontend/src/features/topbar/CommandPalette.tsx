import { useEffect, useMemo, useRef, useState } from 'react';
import { useTopBarState } from './context';

export default function CommandPalette() {
  const { paletteOpen, api, commands } = useTopBarState();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (paletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery('');
      setActiveIdx(0);
    }
  }, [paletteOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.title.toLowerCase().includes(q));
  }, [commands, query]);

  if (!paletteOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cmdk-label"
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/30"
      onClick={() => api.closePalette()}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-zinc-200/70 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-zinc-200/70 dark:border-zinc-800">
          <label id="cmdk-label" className="sr-only">
            Command palette search
          </label>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') api.closePalette();
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIdx((i) => Math.min(i + 1, Math.max(0, filtered.length - 1)));
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIdx((i) => Math.max(i - 1, 0));
              }
              if (e.key === 'Enter') {
                const item = filtered[activeIdx];
                if (item) item.run();
                api.closePalette();
              }
            }}
            placeholder="Search commands…"
            role="searchbox"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <ul role="listbox" aria-label="Commands" className="max-h-80 overflow-auto p-2">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-zinc-500">No results</li>
          ) : (
            filtered.map((c, idx) => (
              <li key={c.id} role="option" aria-selected={idx === activeIdx}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 ${idx === activeIdx ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}
                  onClick={() => {
                    c.run();
                    api.closePalette();
                  }}
                >
                  <span className="text-zinc-900 dark:text-zinc-100">{c.title}</span>
                  {c.group ? (
                    <span className="ml-2 text-xs text-zinc-500">{c.group}</span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
